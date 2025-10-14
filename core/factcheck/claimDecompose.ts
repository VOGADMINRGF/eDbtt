// core/factcheck/claimDecompose.ts final geprüft 
export type Lang = "de" | "en";

const END = /(?<=\.|\?|!)(?=\s+[A-ZÄÖÜ]|$)/u;
const CLEAN_MULTI = /\s+/g;
const SOFT_JOINERS = /\b(und|oder|but|and|or|sowie|jedoch|doch|however)\b/gi;
const clean = (s: string) => s.replace(CLEAN_MULTI, " ").trim();

export function splitIntoClaims(text: string, lang: Lang = "de"): string[] {
  if (!text) return [];
  const paras = text.split(/\n{2,}/).map(clean).filter(Boolean);
  const claims: string[] = [];

  for (const p of paras) {
    const sentences = p.split(END).map(clean).filter(Boolean);
    for (let sent of sentences) {
      if (sent.length < 15) continue;
      const soft = sent.split(SOFT_JOINERS).map(clean).filter(Boolean);
      if (soft.length > 1 && soft.every(x => x.length >= 12)) {
        for (const s of soft) claims.push(s);
      } else {
        claims.push(sent);
      }
    }
  }

  const seen = new Set<string>(), out: string[] = [];
  for (const c of claims) { const k = c.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(c); } }
  return out;
}
export default { splitIntoClaims };
