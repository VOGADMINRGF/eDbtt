import crypto from "crypto";
export function stableHash(input: unknown): string {
  const s = typeof input === "string" ? input : JSON.stringify(input);
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 32);
}
