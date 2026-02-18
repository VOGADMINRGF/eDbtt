import { coreCol, ObjectId } from "@core/db/triMongo";
import { ensureVerificationDefaults } from "@core/auth/verificationTypes";
import { getUserIdentityDocument } from "@core/db/pii/userIdentityDocuments";
import { getEngagementLevel } from "@features/user/engagement";

export type StreamHostContext = {
  id: string;
  isVerified?: boolean;
  accessTier?: string;
  engagementLevel?: string | null;
};

const ALLOWED_TIERS = new Set([
  "citizenPro",
  "citizenUltra",
  "staff",
]);

const MIN_LEVELS = new Set(["engagiert", "begeistert", "brennend"]);

export class StreamHostError extends Error {
  constructor() {
    super("STREAM_HOST_NOT_ALLOWED");
    this.name = "StreamHostError";
  }
}

export type StreamIdentityGate =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_user" | "user_not_found" | "identity_document_missing" | "email_code_missing";
    };

export async function checkStreamIdentityReady(userId: string): Promise<StreamIdentityGate> {
  if (!ObjectId.isValid(userId)) {
    return { ok: false, reason: "invalid_user" };
  }

  const [doc, user] = await Promise.all([
    getUserIdentityDocument(new ObjectId(userId)),
    coreCol("users").then((col) =>
      col.findOne({ _id: new ObjectId(userId) }, { projection: { verification: 1 } }),
    ),
  ]);

  if (!user) return { ok: false, reason: "user_not_found" };
  if (!doc) return { ok: false, reason: "identity_document_missing" };

  const verification = ensureVerificationDefaults((user as any).verification);
  const methods = new Set(verification.methods ?? []);
  if (!methods.has("email_code")) {
    return { ok: false, reason: "email_code_missing" };
  }

  return { ok: true };
}

export async function assertStreamHostAllowed(user: StreamHostContext): Promise<void> {
  const normalizedLevel = user.engagementLevel?.toLowerCase();

  if (!user.id || !user.isVerified) {
    throw new StreamHostError();
  }
  if (!user.accessTier || !ALLOWED_TIERS.has(user.accessTier)) {
    throw new StreamHostError();
  }
  if (!normalizedLevel || !MIN_LEVELS.has(normalizedLevel)) {
    throw new StreamHostError();
  }
}

export async function buildStreamHostContext(
  userId: string,
  options: {
    isVerified?: boolean;
    accessTier?: string | null;
    engagementLevel?: string | null;
  },
): Promise<StreamHostContext> {
  const engagementLevel =
    options.engagementLevel ?? (await resolveEngagementLevelFromStore(userId));

  return {
    id: userId,
    isVerified: options.isVerified,
    accessTier: options.accessTier ?? undefined,
    engagementLevel,
  };
}

async function resolveEngagementLevelFromStore(userId: string): Promise<string | null> {
  if (!ObjectId.isValid(userId)) return null;
  const col = await coreCol("users");
  const doc = await col.findOne(
    { _id: new ObjectId(userId) },
    { projection: { engagementLevel: 1, engagementXp: 1 } },
  );
  if (!doc) return null;
  if (typeof doc.engagementLevel === "string" && doc.engagementLevel.trim()) {
    return doc.engagementLevel.toLowerCase();
  }
  if (typeof doc.engagementXp === "number") {
    return getEngagementLevel(doc.engagementXp);
  }
  return null;
}
