import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, getCol, getDb } from "@core/db/triMongo";
import { requireAdminOrResponse, userIsSuperadmin } from "@/lib/server/auth/admin";
import type { UserRole } from "@/types/user";
import { deriveAccessTierFromPlanCode } from "@core/access/accessTiers";
import { piiCol } from "@core/db/db/triMongo";
import { CREDENTIAL_COLLECTION } from "@/app/api/auth/sharedAuth";
import { hashPassword } from "@/utils/password";
import { createEmailVerificationToken } from "@core/auth/emailVerificationService";
import { buildSetPasswordMail, buildVerificationMail } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { DEFAULT_LOCALE } from "@core/locale/locales";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { ensureBasicPiiProfile } from "@core/pii/userProfileService";
import { createToken } from "@/utils/tokens";
import { resetEmailLink } from "@/utils/email";
import {
  activeAccountFilter,
  adminAccessFilter,
  isAccountDisabled,
  mapAdminDashboardUser,
  normalizeManagedRoles,
  resolveUserRoles,
  superadminAccessFilter,
  type AdminDashboardCredentialDoc,
  type AdminDashboardUserDoc,
} from "./shared";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().min(12).optional(),
  ),
  roles: z.array(z.string()).optional(),
  accessTier: z.string().optional(),
  newsletterOptIn: z.boolean().optional(),
  sendVerification: z.boolean().optional(),
  sendPasswordLink: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const users = await getCol<AdminDashboardUserDoc>("users");
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");
  const pkg = searchParams.get("package");
  const newsletter = searchParams.get("newsletter");
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 25);
  const activeDays = Number(searchParams.get("activeDays") ?? NaN);
  const createdDays = Number(searchParams.get("createdDays") ?? NaN);

  const filter: any = {};
  if (q) {
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ];
    if (ObjectId.isValid(q)) {
      filter.$or.push({ _id: new ObjectId(q) });
    }
  }
  if (role) {
    filter.$or = filter.$or || [];
    filter.$or.push({ roles: role }, { role });
  }
  if (pkg) {
    filter["membership.edebatte.planKey"] = pkg;
  }
  if (newsletter === "true") {
    filter.$or = filter.$or || [];
    filter.$or.push({ "settings.newsletterOptIn": true }, { newsletterOptIn: true });
  } else if (newsletter === "false") {
    filter.$or = filter.$or || [];
    filter.$or.push({ "settings.newsletterOptIn": { $ne: true } }, { newsletterOptIn: { $ne: true } });
  }
  if (!Number.isNaN(activeDays) && activeDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - activeDays);
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ "stats.lastSeenAt": { $gte: since } }, { lastLoginAt: { $gte: since } }],
    });
  }
  if (!Number.isNaN(createdDays) && createdDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - createdDays);
    filter.$and = filter.$and || [];
    filter.$and.push({ createdAt: { $gte: since } });
  }

  const total = await users.countDocuments(filter);
  const docs = await users
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  const credentialIds = docs.map((doc) => doc._id).filter(Boolean);
  const Credentials = await piiCol<AdminDashboardCredentialDoc>(CREDENTIAL_COLLECTION);
  const credentialDocs = credentialIds.length
    ? await Credentials.find(
        { coreUserId: { $in: credentialIds } } as any,
        {
          projection: {
            coreUserId: 1,
            passwordHash: 1,
            twoFactorEnabled: 1,
            otpSecret: 1,
            twoFactorMethod: 1,
          },
        },
      ).toArray()
    : [];
  const credentialsByUserId = new Map(
    credentialDocs.map((doc) => [String(doc.coreUserId), doc]),
  );

  return NextResponse.json({
    items: docs.map((doc) => mapAdminDashboardUser(doc, credentialsByUserId.get(String(doc._id)) ?? null)),
    total,
    page,
    pageSize,
  });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireAdminOrResponse(req);
  if (actor instanceof Response) return actor;

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    roles?: UserRole[];
    packageCode?: string | null;
    membershipStatus?: string | null;
    newsletterOptIn?: boolean;
    planCode?: string | null;
    accessTier?: string | null;
  };

  if (!body.userId || !ObjectId.isValid(body.userId)) {
    return NextResponse.json({ ok: false, error: "missing_user" }, { status: 400 });
  }

  const users = await getCol<AdminDashboardUserDoc>("users");
  const target = await users.findOne(
    { _id: new ObjectId(body.userId) },
    { projection: { roles: 1, role: 1, suspended: 1, suspendedAt: 1, disabledAt: 1 } },
  );
  if (!target) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

  // safety: only superadmin can edit superadmin roles
  const actorIsSuper = userIsSuperadmin(actor as any);
  const targetRoles = resolveUserRoles(target);

  if (targetRoles.includes("superadmin") && !actorIsSuper) {
    return NextResponse.json({ ok: false, error: "forbidden_superadmin" }, { status: 403 });
  }

  const update: any = {};
  const normalizedRoles = Array.isArray(body.roles) ? normalizeManagedRoles(body.roles) : null;
  if (Array.isArray(body.roles)) {
    if (!normalizedRoles.length) {
      return NextResponse.json({ ok: false, error: "invalid_roles" }, { status: 422 });
    }
    if (normalizedRoles.includes("superadmin") && !actorIsSuper) {
      return NextResponse.json({ ok: false, error: "forbidden_superadmin" }, { status: 403 });
    }
    update.roles = normalizedRoles;
    update.role = normalizedRoles[0];
  }
  if (body.packageCode !== undefined) {
    update["membership.edebatte.planKey"] = body.packageCode;
    // Keep legacy/user-facing package state in sync with membership snapshot.
    // Account overview prefers users.edebatte.* for rendering.
    update["edebatte.package"] = body.packageCode;
    update["edebatte.status"] = body.packageCode ? "active" : "none";
    update["edebatte.updatedAt"] = new Date();
  }
  if (body.membershipStatus !== undefined) {
    update["membership.status"] = body.membershipStatus;
  }
  const incomingPlan = typeof body.planCode === "string" ? body.planCode : typeof body.accessTier === "string" ? body.accessTier : null;
  if (incomingPlan) {
    const derived = deriveAccessTierFromPlanCode(incomingPlan);
    update["membership.planCode"] = incomingPlan;
    update.accessTier = derived;
    update.b2cPlanId = derived;
    update.tier = derived;
  }
  if (body.newsletterOptIn !== undefined) {
    update["settings.newsletterOptIn"] = !!body.newsletterOptIn;
    update.newsletterOptIn = !!body.newsletterOptIn;
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 400 });
  }

  const roleProtectionError = normalizedRoles
    ? await getRoleMutationProtection(users, target, normalizedRoles)
    : null;
  if (roleProtectionError) {
    return NextResponse.json({ ok: false, error: roleProtectionError }, { status: 422 });
  }

  const db = await getDb("core");
  const client = (db as any)?.client;
  const targetId = new ObjectId(body.userId);
  if (client?.startSession) {
    const mongoSession = client.startSession();
    try {
      let updated: AdminDashboardUserDoc | null = null;
      await mongoSession.withTransaction(async () => {
        if (normalizedRoles) {
          const latest = await users.findOne(
            { _id: targetId },
            {
              projection: { roles: 1, role: 1, suspended: 1, suspendedAt: 1, disabledAt: 1 },
              session: mongoSession,
            } as any,
          );
          if (!latest) {
            throw new RoleMutationGuardError("user_not_found", 404);
          }
          const latestProtectionError = await getRoleMutationProtection(users, latest, normalizedRoles, mongoSession);
          if (latestProtectionError) {
            throw new RoleMutationGuardError(latestProtectionError, 422);
          }
        }

        await users.updateOne(
          { _id: targetId },
          { $set: update, $currentDate: { updatedAt: true } },
          { session: mongoSession } as any,
        );
        updated = await users.findOne({ _id: targetId }, { session: mongoSession } as any);
      });
      return NextResponse.json({ ok: true, user: updated ? mapAdminDashboardUser(updated) : null });
    } catch (error) {
      if (error instanceof RoleMutationGuardError) {
        return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
      }
      return NextResponse.json({ ok: false, error: "status_change_unavailable" }, { status: 500 });
    } finally {
      await mongoSession.endSession();
    }
  }

  if (normalizedRoles) {
    const latest = await users.findOne(
      { _id: targetId },
      { projection: { roles: 1, role: 1, suspended: 1, suspendedAt: 1, disabledAt: 1 } },
    );
    if (!latest) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }
    const latestProtectionError = await getRoleMutationProtection(users, latest, normalizedRoles);
    if (latestProtectionError) {
      return NextResponse.json({ ok: false, error: latestProtectionError }, { status: 422 });
    }
  }

  await users.updateOne({ _id: targetId }, { $set: update, $currentDate: { updatedAt: true } });
  const updated = await users.findOne({ _id: targetId });
  return NextResponse.json({ ok: true, user: updated ? mapAdminDashboardUser(updated as AdminDashboardUserDoc) : null });
}

export async function POST(req: NextRequest) {
  const actor = await requireAdminOrResponse(req);
  if (actor instanceof Response) return actor;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    const passwordTooShort = parsed.error.issues.some(
      (issue) =>
        issue.path.join(".") === "password" &&
        issue.code === "too_small",
    );
    return NextResponse.json(
      { ok: false, error: passwordTooShort ? "weak_password" : "invalid_input" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const email = body.email.trim().toLowerCase();
  const email_lc = email;
  const name = body.name.trim();
  const roles = normalizeManagedRoles(Array.isArray(body.roles) ? body.roles : ["user"]);
  const actorIsSuper = userIsSuperadmin(actor as any);

  if (!roles.length) {
    return NextResponse.json({ ok: false, error: "invalid_roles" }, { status: 422 });
  }

  if (roles.includes("superadmin") && !actorIsSuper) {
    return NextResponse.json({ ok: false, error: "forbidden_superadmin" }, { status: 403 });
  }

  const users = await getCol<AdminDashboardUserDoc>("users");
  const existing = await users.findOne(
    { $or: [{ email }, { email_lc }] },
    { projection: { _id: 1, verifiedEmail: 1, createdAt: 1 } },
  );

  if (existing && (existing as any).verifiedEmail) {
    return NextResponse.json({ ok: false, error: "email_in_use" }, { status: 409 });
  }

  const sendPasswordLink = body.sendPasswordLink ?? false;
  let finalPassword = body.password ?? "";
  if (!finalPassword && sendPasswordLink) {
    finalPassword = generatePassword(18);
  }
  if (!finalPassword) {
    return NextResponse.json({ ok: false, error: "missing_password" }, { status: 400 });
  }
  if (!isPasswordStrong(finalPassword)) {
    return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
  }

  const now = new Date();
  const passwordHash = await hashPassword(finalPassword);
  const accessTier = body.accessTier ? deriveAccessTierFromPlanCode(body.accessTier) : "citizenBasic";

  const baseDoc = {
    email,
    email_lc,
    name,
    role: (roles[0] as UserRole) ?? "user",
    roles: roles as UserRole[],
    verifiedEmail: false,
    emailVerified: false,
    accessTier,
    b2cPlanId: accessTier,
    tier: accessTier,
    profile: {
      displayName: name,
      locale: DEFAULT_LOCALE,
    },
    settings: {
      preferredLocale: DEFAULT_LOCALE,
      newsletterOptIn: body.newsletterOptIn ?? false,
    },
    verification: {
      level: "none",
      methods: [],
      lastVerifiedAt: null,
      preferredRegionCode: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  let userId: ObjectId;
  if (!existing) {
    const insert = await users.insertOne(baseDoc as any);
    userId = insert.insertedId;
  } else {
    userId = existing._id as ObjectId;
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          ...baseDoc,
          createdAt: existing.createdAt ?? now,
        },
      },
    );
  }

  const credentials = await piiCol(CREDENTIAL_COLLECTION);
  await credentials.updateOne(
    { coreUserId: userId },
    {
      $set: {
        coreUserId: userId,
        email,
        passwordHash,
        twoFactorEnabled: false,
      },
      $setOnInsert: {
        createdAt: now,
      },
      $currentDate: { updatedAt: true },
    },
    { upsert: true },
  );

  let verificationMailQueued = false;
  if (body.sendVerification ?? true) {
    const { rawToken } = await createEmailVerificationToken(userId, email);
    const origin = publicOrigin();
    const verifyUrl = `${origin.replace(/\/$/, "")}/register/verify-email?token=${encodeURIComponent(
      rawToken,
    )}&email=${encodeURIComponent(email)}`;

    const mail = buildVerificationMail({
      verifyUrl,
      displayName: name,
      locale: DEFAULT_LOCALE,
    });

    const mailResult = await sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "admin_create_verification",
    });
    if (!mailResult.ok) {
      const updated = await users.findOne({ _id: userId });
      return NextResponse.json({
        ok: false,
        error: mapMailFailureToError(mailResult as Extract<Awaited<ReturnType<typeof sendMail>>, { ok: false }>),
        partial: true,
        userCreated: true,
        user: updated ? mapAdminDashboardUser(updated as AdminDashboardUserDoc) : null,
        verificationMailQueued: false,
        passwordMailQueued: false,
      }, { status: 502 });
    }
    verificationMailQueued = true;
  }

  let passwordMailQueued = false;
  if (sendPasswordLink) {
    const rawToken = await createToken(String(userId), "reset", 60);
    const resetUrl = resetEmailLink(rawToken);
    const mail = buildSetPasswordMail({
      resetUrl,
      displayName: name,
      locale: DEFAULT_LOCALE,
    });
    const mailResult = await sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "admin_create_password_link",
    });
    if (!mailResult.ok) {
      const updated = await users.findOne({ _id: userId });
      return NextResponse.json({
        ok: false,
        error: mapMailFailureToError(mailResult as Extract<Awaited<ReturnType<typeof sendMail>>, { ok: false }>),
        partial: true,
        userCreated: true,
        user: updated ? mapAdminDashboardUser(updated as AdminDashboardUserDoc) : null,
        verificationMailQueued,
        passwordMailQueued: false,
      }, { status: 502 });
    }
    passwordMailQueued = true;
  }

  try {
    await ensureBasicPiiProfile(userId, {
      email,
      displayName: name,
    });
  } catch (err) {
    console.error("[admin.users] ensureBasicPiiProfile failed", err);
  }

  try {
    await logIdentityEvent("identity_register", {
      userId: String(userId),
      meta: { source: "admin_create", sendVerification: body.sendVerification ?? true },
    });
  } catch (err) {
    console.error("[admin.users] logIdentityEvent failed", err);
  }

  const updated = await users.findOne({ _id: userId });
  return NextResponse.json({
    ok: true,
    user: updated ? mapAdminDashboardUser(updated as AdminDashboardUserDoc) : null,
    verificationMailQueued,
    passwordMailQueued,
  });
}

function isPasswordStrong(value: string) {
  return value.length >= 12 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function generatePassword(length = 16) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%_-+=*";
  const all = `${letters}${digits}${symbols}`;
  const bytes = crypto.randomBytes(length);
  const core = Array.from(bytes, (b) => all[b % all.length]).join("");
  return `${core.slice(0, length - 3)}${digits[0]}${symbols[0]}${letters[0]}`;
}

class RoleMutationGuardError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "RoleMutationGuardError";
  }
}

async function getRoleMutationProtection(
  users: Awaited<ReturnType<typeof getCol<AdminDashboardUserDoc>>>,
  target: Pick<AdminDashboardUserDoc, "_id" | "roles" | "role" | "suspended" | "suspendedAt" | "disabledAt">,
  nextRoles: UserRole[],
  mongoSession?: any,
) {
  if (isAccountDisabled(target)) return null;

  const targetRoles = resolveUserRoles(target);
  const wouldKeepAdminAccess = nextRoles.includes("admin") || nextRoles.includes("superadmin");
  const currentlyHasAdminAccess = targetRoles.includes("admin") || targetRoles.includes("superadmin");
  if (currentlyHasAdminAccess && !wouldKeepAdminAccess) {
    const adminCount = await users.countDocuments(
      {
        _id: { $ne: target._id },
        ...activeAccountFilter(),
        ...adminAccessFilter(),
      } as any,
      mongoSession ? ({ session: mongoSession } as any) : undefined,
    );
    if (adminCount <= 0) {
      return "last_admin_required";
    }
  }

  if (targetRoles.includes("superadmin") && !nextRoles.includes("superadmin")) {
    const superadminCount = await users.countDocuments(
      {
        _id: { $ne: target._id },
        ...activeAccountFilter(),
        ...superadminAccessFilter(),
      } as any,
      mongoSession ? ({ session: mongoSession } as any) : undefined,
    );
    if (superadminCount <= 0) {
      return "last_superadmin_required";
    }
  }

  return null;
}

function mapMailFailureToError(result: Extract<Awaited<ReturnType<typeof sendMail>>, { ok: false }>) {
  return result.code === "mail_transport_unavailable" ? "mail_delivery_unavailable" : "mail_delivery_failed";
}
