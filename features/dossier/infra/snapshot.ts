import crypto from "crypto";
import { canonicalize } from "./canonicalize";
import { signPayload } from "./signer";
import type { DossierSnapshot } from "./types";

export function createContentHash(data: unknown): string {
  const canonical = canonicalize(data);
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function createSnapshot(input: {
  dossierId: string;
  content: unknown;
  previousHash?: string;
  privateKeyPem: string;
}): DossierSnapshot {
  const createdAt = new Date().toISOString();
  const snapshotId = crypto.randomUUID();
  const contentHash = createContentHash(input.content);
  const signaturePayload = contentHash;
  const { signature, publicKey, publicKeyId } = signPayload(signaturePayload, input.privateKeyPem);

  return {
    snapshotId,
    dossierId: input.dossierId,
    createdAt,
    contentHash,
    previousHash: input.previousHash,
    signature,
    publicKey,
    publicKeyId,
  };
}
