// apps/web/src/utils/tokens.ts
import crypto from "crypto";
import { piiCol } from "@core/db/triMongo";

type TokenType = "verify" | "reset";

type StoredTokenDoc = {
  _id?: unknown;
  slotKey?: string | null;
  userId: string;
  type: TokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  invalidatedAt?: Date | null;
  invalidationReason?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
};

let indexesEnsured = false;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function tokenSlotKey(userId: string, type: TokenType) {
  return `slot:${type}:${userId}`;
}

async function ensureTokenIndexes(col: Awaited<ReturnType<typeof piiCol<StoredTokenDoc>>>) {
  if (indexesEnsured) return;

  try {
    await col.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "expires_ttl" },
    );
  } catch (error: any) {
    const code = error?.code ?? error?.codeName;
    if (!(code === 85 || code === "IndexOptionsConflict")) {
      throw error;
    }
  }

  try {
    await col.createIndex(
      { slotKey: 1 },
      { unique: true, sparse: true, name: "token_slot_unique" },
    );
  } catch (error: any) {
    const code = error?.code ?? error?.codeName;
    if (!(code === 85 || code === "IndexOptionsConflict")) {
      throw error;
    }
  }

  indexesEnsured = true;
}

export async function createToken(
  userId: string,
  type: TokenType,
  ttlMinutes: number,
) {
  const raw = crypto.randomBytes(24).toString("hex");
  const tokenHash = sha256(raw);
  const slotKey = tokenSlotKey(userId, type);
  const col = await piiCol<StoredTokenDoc>("tokens");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

  await ensureTokenIndexes(col);

  await col.findOneAndUpdate(
    { slotKey },
    {
      $set: {
        userId,
        type,
        tokenHash,
        expiresAt,
        usedAt: null,
        invalidatedAt: null,
        invalidationReason: null,
        updatedAt: now,
      },
      $setOnInsert: {
        slotKey,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "before" },
  );

  await col.updateMany(
    {
      slotKey: { $exists: false },
      userId,
      type,
      usedAt: null,
      $or: [{ invalidatedAt: null }, { invalidatedAt: { $exists: false } }],
      expiresAt: { $gt: now },
    },
    {
      $set: {
        invalidatedAt: now,
        invalidationReason: "rotated",
        updatedAt: now,
      },
    },
  );

  return raw;
}

export async function consumeToken(raw: string, type: TokenType) {
  const col = await piiCol<StoredTokenDoc>("tokens");
  const tokenHash = sha256(raw);
  const now = new Date();

  const currentSlot = await col.findOneAndUpdate(
    {
      slotKey: { $exists: true },
      type,
      tokenHash,
      usedAt: null,
      $or: [{ invalidatedAt: null }, { invalidatedAt: { $exists: false } }],
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
  if (currentSlot) {
    return currentSlot.userId as string;
  }

  const legacyDoc = await col.findOneAndUpdate(
    {
      slotKey: { $exists: false },
      tokenHash,
      type,
      usedAt: null,
      $or: [{ invalidatedAt: null }, { invalidatedAt: { $exists: false } }],
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
  if (legacyDoc) {
    return legacyDoc.userId as string;
  }

  return null;
}
