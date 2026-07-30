import crypto from "node:crypto";
import { ObjectId, piiCol } from "@core/db/triMongo";
import type { SendMailResult } from "@/utils/mailer";

type OrgInviteSetupTokenDoc = {
  _id?: ObjectId;
  membershipId: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  invalidatedAt: Date | null;
  invalidationReason: string | null;
  dispatchId: string | null;
  dispatchStartedAt: Date | null;
  deliveryStatus: "pending" | "delivered" | "failed" | "partial";
  deliveryRetryable: boolean | null;
  deliveryCategory: string | null;
  deliveryAttemptedAt: Date | null;
  deliveryAttemptedCount: number;
  deliveryDeliveredCount: number;
  deliveryFailedCount: number;
  deliveryMessageId: string | null;
  deliveryRecoveryStatus: string | null;
  deliveryNextAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

let indexesEnsured = false;

function hashSetupToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function setupTokensCol() {
  const col = await piiCol<OrgInviteSetupTokenDoc>("org_invite_setup_tokens");
  if (!indexesEnsured) {
    await col.createIndex(
      { membershipId: 1 },
      { unique: true, name: "org_invite_setup_membership_unique" },
    );
    await col.createIndex(
      { tokenHash: 1 },
      { unique: true, name: "org_invite_setup_token_unique" },
    );
    await col.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "org_invite_setup_expires_ttl" },
    );
    indexesEnsured = true;
  }
  return col;
}

export async function issueOrgInviteSetupToken(input: {
  membershipId: ObjectId;
  userId: ObjectId;
  ttlMinutes: number;
}) {
  const col = await setupTokensCol();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSetupToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.ttlMinutes * 60_000);

  await col.findOneAndUpdate(
    { membershipId: input.membershipId },
    {
      $set: {
        userId: input.userId,
        tokenHash,
        expiresAt,
        usedAt: null,
        invalidatedAt: null,
        invalidationReason: null,
        dispatchId: null,
        dispatchStartedAt: null,
        deliveryStatus: "pending",
        deliveryRetryable: null,
        deliveryCategory: null,
        deliveryAttemptedAt: null,
        deliveryAttemptedCount: 0,
        deliveryDeliveredCount: 0,
        deliveryFailedCount: 0,
        deliveryMessageId: null,
        deliveryRecoveryStatus: null,
        deliveryNextAttemptAt: null,
        updatedAt: now,
      },
      $setOnInsert: {
        membershipId: input.membershipId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "before" },
  );

  return { rawToken, tokenHash, expiresAt };
}

export async function startOrgInviteSetupDispatch(input: {
  membershipId: ObjectId;
  rawToken: string;
  dispatchId: string;
  startedAt: Date;
}) {
  const col = await setupTokensCol();
  const result = await col.updateOne(
    {
      membershipId: input.membershipId,
      tokenHash: hashSetupToken(input.rawToken),
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { $gt: input.startedAt },
      dispatchId: null,
    },
    {
      $set: {
        dispatchId: input.dispatchId,
        dispatchStartedAt: input.startedAt,
        updatedAt: input.startedAt,
      },
    },
  );
  return result.modifiedCount === 1;
}

export async function recordOrgInviteSetupDelivery(input: {
  membershipId: ObjectId;
  rawToken: string;
  dispatchId: string;
  dispatchedAt: Date;
  result: SendMailResult;
}) {
  const col = await setupTokensCol();
  const attemptedAt = new Date();
  const result = await col.updateOne(
    {
      membershipId: input.membershipId,
      tokenHash: hashSetupToken(input.rawToken),
      dispatchId: input.dispatchId,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { $gt: input.dispatchedAt },
    },
    {
      $set: {
        deliveryStatus: input.result.status,
        deliveryRetryable: input.result.retryable,
        deliveryCategory: input.result.category,
        deliveryAttemptedAt: attemptedAt,
        deliveryAttemptedCount: input.result.attemptedCount,
        deliveryDeliveredCount: input.result.deliveredCount,
        deliveryFailedCount: input.result.failedCount,
        deliveryMessageId: input.result.messageId,
        deliveryRecoveryStatus: null,
        deliveryNextAttemptAt: null,
        updatedAt: attemptedAt,
      },
    },
  );
  return result.modifiedCount === 1;
}

export async function consumeOrgInviteSetupToken(rawToken: string) {
  const col = await setupTokensCol();
  const now = new Date();
  const tokenHash = hashSetupToken(rawToken);
  const token = await col.findOneAndUpdate(
    {
      tokenHash,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        usedAt: now,
        invalidatedAt: now,
        invalidationReason: "consumed",
        updatedAt: now,
      },
    },
    { returnDocument: "before" },
  );
  return token
    ? {
        membershipId: token.membershipId,
        userId: token.userId,
        tokenHash,
      }
    : null;
}
