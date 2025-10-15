// apps/web/src/features/analyze/argumentation.ts
export type Stance = "Pro" | "Contra" | "Neutral";

const POS_VERBS = /\b(verbessert|senkt|reduziert|entlastet|beschleunigt|stärkt|schützt|fördert|erhöht\s+transparenz)\b/i;
const NEG_VERBS = /\b(verschlechtert|erhöht|verteuert|verlangsamt|gefährdet|belastet|schwächt|hebt\s+auf)\b/i;

const POS_NOUNS = /\b(Transparenz|Effizienz|Sicherheit|Gesundheit|Versorgung|Teilhabe|Wettbewerb|Biodiversität|Klimaschutz|Bezahlbarkeit|Wohnraum|Bildung|Zugänglichkeit|Verlässlichkeit)\b/i;
const NEG_NOUNS = /\b(Kosten|Bürokratie|Belastung|Unsicherheit|Engpässe|Wartezeiten|Armut|Obdachlosigkeit|Emissionen|Kriminalität|Monopol|Lärmbelastung)\b/i;

export const DEMAND_MARKER = /\b(soll(en)?|muss|fordern|einführen|abschaffen|verbieten|erlauben)\b/i;
export const EVENTUALITY_MARKER = /\b(falls|wenn|sofern|alternativ|oder\s+stattdessen|variante|option)\b/i;

export function stanceFor(text: string): Stance {
  const hasPos = POS_VERBS.test(text) || POS_NOUNS.test(text);
  const hasNeg = NEG_VERBS.test(text) || NEG_NOUNS.test(text);
  if (hasPos && !hasNeg) return "Pro";
  if (hasNeg && !hasPos) return "Contra";
  return "Neutral";
}

export function claimWeight(type: string | null, len: number): number {
  const t = (type || "").toLowerCase();
  let w = 0;
  if (t.includes("forderung")) w += 3;
  else if (t.includes("prognose")) w += 2;
  else if (t.includes("fakt")) w += 1;
  if (len < 120) w += 0.3;
  return w;
}
