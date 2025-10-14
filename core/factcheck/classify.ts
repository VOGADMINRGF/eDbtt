// core/factcheck/classify.ts
export type UnitKind = "claim" | "opinion" | "policy" | "question" | "prediction";

export type RawUnit = {
  text: string;
  span: [number, number];
  kind: UnitKind;
  confidence: number; // 0..1
  scope?: string;
  timeframe?: string;
};

const EVIDENCE = /\b(laut|gemäß|offiziell|statistik|studie|bericht|destatis|eurostat|who|oecd)\b/i;
const NUMBER = /\b(\d{1,3}([.,]\d+)?\s?%|\d{4}|\d{1,3}([.,]\d{3})+|\d+)\b/;
const COPULA = /\b(ist|sind|war|waren|beträgt|betrugen|lag|lagen|gibt|gibt es|hat|haben|wurde|wurden|stieg|fiel)\b/i;
const NORMATIV = /\b(soll|sollte|muss|müsste|wir brauchen|ich fordere|einführen|verbieten|erhöhen|senken)\b/i;
const OPINION = /\b(ich\s*(bin|finde|halte)|meiner meinung|ich glaube|gegen|für|schlecht|gut|falsch|richtig)\b/i;
const FUTURE = /\b(wird|werden)\b/i;
const QUESTION = /\?\s*$/;

export function splitIntoClauses(text: string): { text: string; span: [number, number] }[] {
  // simple splitter: . ! ? ; , und/aber/während
  const parts: { text: string; span: [number, number] }[] = [];
  let start = 0;
  const regex = /(\.|!|\?|;|,\s+(?:und|aber|während)\s+)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    const end = m.index + m[0].length;
    const chunk = text.slice(start, end).trim();
    if (chunk) parts.push({ text: chunk, span: [start, end] });
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) parts.push({ text: tail, span: [start, start + tail.length] });
  return parts;
}

export function classifyClause(text: string): { kind: UnitKind; confidence: number } {
  const t = text.trim();
  const hasNumber = NUMBER.test(t);
  const hasEvidence = EVIDENCE.test(t);
  const isQuestion = QUESTION.test(t);
  const isFuture = FUTURE.test(t);
  const isNormativ = NORMATIV.test(t);
  const isOpinion = OPINION.test(t);
  const hasCopula = COPULA.test(t);

  let kind: UnitKind;
  if (isQuestion) kind = "question";
  else if (isNormativ) kind = "policy";
  else if (isFuture && !hasEvidence && !hasNumber) kind = "prediction";
  else if ((hasNumber || hasEvidence || hasCopula) && !isOpinion && !isNormativ) kind = "claim";
  else if (isOpinion) kind = "opinion";
  else kind = "opinion";

  const confidence =
    kind === "claim"
      ? Math.min(1, 0.4 + (hasNumber ? 0.3 : 0) + (hasEvidence ? 0.2 : 0) + (hasCopula ? 0.1 : 0))
      : kind === "policy"
      ? 0.8
      : kind === "question"
      ? 0.9
      : kind === "prediction"
      ? 0.6
      : 0.7;

  return { kind, confidence };
}

export function extractUnits(text: string): RawUnit[] {
  const clauses = splitIntoClauses(text);
  return clauses.map(({ text, span }) => {
    const { kind, confidence } = classifyClause(text);
    // TODO: simple scope/timeframe detection could go here
    return { text, span, kind, confidence };
  });
}
