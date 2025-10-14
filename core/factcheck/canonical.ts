// core/factcheck/canonical.ts
import crypto from "node:crypto";

export function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\p{P}+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalKey({ text, scope, timeframe }: { text: string; scope?: string; timeframe?: string }) {
  const t = normalizeText(text);
  const s = (scope || "global").toLowerCase();
  const f = (timeframe || "any").toLowerCase();
  const payload = `${s}|${f}|${t}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}
