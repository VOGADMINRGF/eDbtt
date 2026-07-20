import { ObjectId, getCol } from "@core/db/triMongo";
import type { IdentityMethod } from "./verificationTypes";
import {
  ensureVerificationDefaults,
  upgradeVerificationLevel,
} from "./verificationTypes";
import type {
  IdentityVerificationProvider,
  IdentityVerificationProviderPayload,
  IdentityVerificationProofType,
  IdentityVerificationSessionDoc,
} from "./identityVerificationTypes";

const COLLECTION = "identity_verification_sessions";
const SESSION_TTL_MS = 10 * 60 * 1000;

function allowedMethod(method: IdentityMethod) {
  return method === "otb_app" || method === "eid_scan";
}

export class IdentityVerificationError extends Error {
  status: number;
  constructor(
    public readonly code:
      | "forbidden"
      | "method_not_supported"
      | "provider_proof_missing"
      | "provider_unavailable"
      | "session_expired"
      | "session_not_found"
      | "session_not_pending"
      | "session_replay"
      | "user_not_found",
    status: number,
  ) {
    super(code);
    this.name = "IdentityVerificationError";
    this.status = status;
  }
}

type StartIdentityVerificationInput = {
  userId: ObjectId;
  method: IdentityMethod;
  now?: Date;
};

type CompleteIdentityVerificationInput = {
  sessionId: string;
  userId: ObjectId;
  providerPayload?: unknown;
  now?: Date;
};

function fail(code: IdentityVerificationError["code"], status: number): never {
  throw new IdentityVerificationError(code, status);
}

function isMockProviderAllowed() {
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

function resolveVerificationProvider(): IdentityVerificationProvider {
  if (process.env.OTB_API_URL?.trim()) {
    fail("provider_unavailable", 503);
  }
  if (isMockProviderAllowed()) {
    return "mock";
  }
  fail("provider_unavailable", 503);
}

function expiresAtFrom(now: Date) {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

function normalizeProviderProof(
  provider: IdentityVerificationProvider,
  payload: unknown,
  now: Date,
): {
  providerPayload: IdentityVerificationProviderPayload;
  providerProofType: IdentityVerificationProofType;
} {
  if (provider === "otb") {
    fail("provider_unavailable", 503);
  }
  if (!isMockProviderAllowed()) {
    fail("provider_unavailable", 503);
  }
  if (!payload || typeof payload !== "object") {
    fail("provider_proof_missing", 400);
  }
  const proof = payload as Partial<IdentityVerificationProviderPayload>;
  const verificationId = String(proof.verificationId ?? "").trim();
  if (proof.adapter !== "test" || proof.verified !== true || verificationId.length < 6) {
    fail("provider_proof_missing", 400);
  }
  return {
    providerPayload: {
      adapter: "test",
      verificationId,
      verified: true,
      verifiedAt: proof.verifiedAt ? String(proof.verifiedAt) : now.toISOString(),
    },
    providerProofType: "test_adapter",
  };
}

function buildSucceededSession(
  session: IdentityVerificationSessionDoc,
  now: Date,
  providerPayload: IdentityVerificationProviderPayload,
  providerProofType: IdentityVerificationProofType,
): IdentityVerificationSessionDoc {
  return {
    ...session,
    status: "succeeded",
    updatedAt: now,
    completedAt: now,
    verifiedAt: now,
    failureReason: null,
    providerPayload,
    providerProofType,
  };
}

export async function startIdentityVerification({
  userId,
  method,
  now = new Date(),
}: StartIdentityVerificationInput) {
  if (!allowedMethod(method)) fail("method_not_supported", 400);
  const col = await getCol<IdentityVerificationSessionDoc>(COLLECTION);
  const provider = resolveVerificationProvider();
  await col.updateMany(
    {
      userId,
      method,
      provider,
      status: "pending",
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: "expired",
        updatedAt: now,
        completedAt: now,
        failureReason: "expired",
      },
    },
  );
  const existing = await col.findOne(
    {
      userId,
      method,
      provider,
      status: "pending",
      expiresAt: { $gt: now },
    },
    { sort: { createdAt: -1 } },
  );
  if (existing) {
    return existing;
  }
  const doc: IdentityVerificationSessionDoc = {
    _id: new ObjectId(),
    userId,
    method,
    provider,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    expiresAt: expiresAtFrom(now),
    completedAt: null,
    verifiedAt: null,
    failureReason: null,
    providerProofType: null,
    providerPayload: null,
  };
  await col.insertOne(doc);
  return doc;
}

export async function completeIdentityVerification({
  sessionId,
  userId,
  providerPayload,
  now = new Date(),
}: CompleteIdentityVerificationInput) {
  if (!ObjectId.isValid(sessionId)) fail("session_not_found", 404);
  const col = await getCol<IdentityVerificationSessionDoc>(COLLECTION);
  const _id = new ObjectId(sessionId);
  const session = await col.findOne({ _id, userId });
  if (!session) {
    const existing = await col.findOne({ _id }, { projection: { _id: 1 } });
    if (existing) fail("forbidden", 403);
    fail("session_not_found", 404);
  }
  if (session.status === "succeeded") fail("session_replay", 409);
  if (session.status === "expired" || session.expiresAt <= now) {
    if (session.status === "pending") {
      await col.updateOne(
        { _id, userId, status: "pending" },
        {
          $set: {
            status: "expired",
            updatedAt: now,
            completedAt: now,
            failureReason: "expired",
          },
        },
      );
    }
    fail("session_expired", 410);
  }
  if (session.status !== "pending") fail("session_not_pending", 409);

  const verifiedProof = normalizeProviderProof(session.provider, providerPayload, now);
  const sessionUpdate = await col.updateOne(
    {
      _id,
      userId,
      status: "pending",
      expiresAt: { $gt: now },
    },
    {
      $set: {
        status: "succeeded",
        providerPayload: verifiedProof.providerPayload,
        providerProofType: verifiedProof.providerProofType,
        verifiedAt: now,
        updatedAt: now,
        completedAt: now,
        failureReason: null,
      },
    },
  );
  if (sessionUpdate.matchedCount !== 1) {
    const latest = await col.findOne({ _id, userId });
    if (!latest) fail("session_not_found", 404);
    if (latest.status === "succeeded") fail("session_replay", 409);
    if (latest.status === "expired" || latest.expiresAt <= now) fail("session_expired", 410);
    fail("session_not_pending", 409);
  }

  const Users = await getCol("users");
  const user = await Users.findOne(
    { _id: userId },
    { projection: { verification: 1 } },
  );
  if (!user) fail("user_not_found", 404);

  const verification = ensureVerificationDefaults(user.verification);
  const methods = new Set(verification.methods);
  methods.add(session.method);

  const nextVerification = {
    ...verification,
    level: upgradeVerificationLevel(verification.level, "soft"),
    methods: Array.from(methods),
    lastVerifiedAt: now,
  };

  const userUpdate = await Users.updateOne(
    { _id: userId },
    { $set: { verification: nextVerification, updatedAt: now } },
  );
  if (userUpdate.matchedCount !== 1) fail("user_not_found", 404);

  return {
    session: buildSucceededSession(
      session,
      now,
      verifiedProof.providerPayload,
      verifiedProof.providerProofType,
    ),
    verification: nextVerification,
  };
}
