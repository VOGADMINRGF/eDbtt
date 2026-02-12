import { ObjectId, getCol, piiCol } from "@core/db/triMongo";
import { hashPassword, verifyPassword } from "@/utils/password";

type SeedResult =
  | { ok: true; changed: boolean; userId: string; reason: "updated" | "created" | "noop" }
  | { ok: false; reason: "missing_email" | "missing_password_for_create" };

type UserDoc = {
  _id: ObjectId;
  email?: string;
  email_lc?: string;
  role?: string;
  roles?: string[];
  accessTier?: string;
  b2cPlanId?: string;
  tier?: string;
};

type CredentialsDoc = {
  _id?: ObjectId;
  coreUserId: ObjectId;
  email: string;
  passwordHash: string;
  twoFactorEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const CREDENTIAL_COLLECTION = "user_credentials";
const ROLES_TO_ENSURE = ["superadmin", "admin", "staff"] as const;
const MIN_RUN_INTERVAL_MS = 60_000;
let lastRunAt = 0;

export async function ensureEnvSuperadminSeed(options?: { force?: boolean }): Promise<SeedResult> {
  const superEmailRaw = process.env.SUPERADMIN_EMAIL?.trim();
  if (!superEmailRaw) return { ok: false, reason: "missing_email" };

  const nowTs = Date.now();
  if (!options?.force && nowTs - lastRunAt < MIN_RUN_INTERVAL_MS) {
    return { ok: true, changed: false, userId: "cached", reason: "noop" };
  }
  lastRunAt = nowTs;

  const email = superEmailRaw.toLowerCase();
  const superPw = process.env.SUPERADMIN_PW?.trim() ?? "";
  const now = new Date();

  const users = await getCol<UserDoc>("users");
  const existing = await users.findOne({
    $or: [{ email }, { email_lc: email }],
  });

  if (!existing) {
    if (!superPw) return { ok: false, reason: "missing_password_for_create" };

    const passwordHash = await hashPassword(superPw);
    const userInsert = await users.insertOne({
      email,
      email_lc: email,
      name: "Superadmin",
      role: "superadmin",
      roles: [...ROLES_TO_ENSURE],
      verifiedEmail: true,
      emailVerified: true,
      accessTier: "staff",
      b2cPlanId: "staff",
      tier: "staff",
      profile: {
        displayName: "Superadmin",
        locale: "de",
      },
      settings: {
        preferredLocale: "de",
        newsletterOptIn: false,
      },
      verification: {
        level: "none",
        methods: [],
        lastVerifiedAt: null,
        preferredRegionCode: null,
      },
      createdAt: now,
      updatedAt: now,
    } as any);

    const creds = await piiCol<CredentialsDoc>(CREDENTIAL_COLLECTION);
    await creds.updateOne(
      { coreUserId: userInsert.insertedId },
      {
        $set: {
          coreUserId: userInsert.insertedId,
          email,
          passwordHash,
          twoFactorEnabled: false,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return { ok: true, changed: true, userId: String(userInsert.insertedId), reason: "created" };
  }

  const existingRoles = Array.isArray(existing.roles) ? existing.roles.filter(Boolean) : [];
  const mergedRoles = Array.from(new Set([...existingRoles, ...ROLES_TO_ENSURE]));
  const needsRoleUpdate =
    existing.role !== "superadmin" ||
    mergedRoles.length !== existingRoles.length ||
    existing.accessTier !== "staff" ||
    existing.b2cPlanId !== "staff" ||
    existing.tier !== "staff";

  if (needsRoleUpdate) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          email,
          email_lc: email,
          role: "superadmin",
          roles: mergedRoles,
          accessTier: "staff",
          b2cPlanId: "staff",
          tier: "staff",
          updatedAt: now,
        },
      },
    );
  }

  let credentialsChanged = false;
  if (superPw) {
    const creds = await piiCol<CredentialsDoc>(CREDENTIAL_COLLECTION);
    const credDoc = await creds.findOne({ coreUserId: existing._id });
    if (!credDoc) {
      const passwordHash = await hashPassword(superPw);
      await creds.insertOne({
        coreUserId: existing._id,
        email,
        passwordHash,
        twoFactorEnabled: false,
        createdAt: now,
        updatedAt: now,
      });
      credentialsChanged = true;
    } else {
      const matches = await verifyPassword(superPw, credDoc.passwordHash);
      if (!matches || credDoc.email !== email) {
        const passwordHash = matches ? credDoc.passwordHash : await hashPassword(superPw);
        await creds.updateOne(
          { _id: credDoc._id },
          {
            $set: {
              email,
              passwordHash,
              updatedAt: now,
            },
          },
        );
        credentialsChanged = true;
      }
    }
  }

  const changed = needsRoleUpdate || credentialsChanged;
  return {
    ok: true,
    changed,
    userId: String(existing._id),
    reason: changed ? "updated" : "noop",
  };
}
