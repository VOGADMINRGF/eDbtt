// apps/web/src/utils/tokens.ts
import crypto from "crypto";
import { piiCol } from "@core/db/triMongo";

type TokenType = "verify" | "reset";

type StoredTokenDoc = {
  userId: string;
  type: TokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  invalidatedAt?: Date | null;
  invalidationReason?: string | null;
  createdAt: Date;
};

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function createToken(
  userId: string,
  type: TokenType,
  ttlMinutes: number,
) {
  const raw = crypto.randomBytes(24).toString("hex");
  const tokenHash = sha256(raw);
  const col = await piiCol<StoredTokenDoc>("tokens");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  const now = new Date();
  try {
    await col.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "expires_ttl" },
    );
  } catch (err: any) {
    // Ignore when the TTL index already exists under a different name/options.
    const code = err?.code ?? err?.codeName;
    if (!(code === 85 || code === "IndexOptionsConflict")) {
      throw err;
    }
  }
  await col.updateMany(
    {
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
      },
    },
  );
  await col.insertOne({
    userId,
    type,
    tokenHash,
    expiresAt,
    usedAt: null,
    invalidatedAt: null,
    invalidationReason: null,
    createdAt: now,
  });
  return raw;
}

export async function consumeToken(raw: string, type: TokenType) {
  const col = await piiCol<StoredTokenDoc>("tokens");
  const tokenHash = sha256(raw);
  const now = new Date();
  const doc = await col.findOneAndUpdate(
    {
      tokenHash,
      type,
      usedAt: null,
      $or: [{ invalidatedAt: null }, { invalidatedAt: { $exists: false } }],
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
    { returnDocument: "before" },
  );
  if (!doc) return null;
  return doc.userId as string;
}
