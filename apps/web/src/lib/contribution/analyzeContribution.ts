// apps/web/src/lib/contribution/analyzeContribution.ts
// V1-kompatibler Analyzer (Heuristik-first, optional KI-Boost-Hooks)
// Nutzt die "leichte" Analyse-Typdatei aus "@/types/contribution"

import type {
  ContributionAnalysisRequest,
  ContributionAnalysisResponse,
  TopicScore,
  AnalyzedStatement,
  Polarity,
  StatementType,
} from "@/types/contribution";

/** Optionale Boost-Hooks (z. B. Orchestrator/LLM) */
type BoostHooks = {
  aiTopics?: (text: string) => Promise<TopicScore[]>; // 0..1 confidence
  aiRegion?: (body: ContributionAnalysisRequest) => Promise<string | null>;
  aiSuggestions?: (text: string) => Promise<string[]>;
};

let BOOST_HOOKS: BoostHooks | null = null;

/** Von außen aktivierbar, ohne Call-Sites anzupassen */
export function enableAnalyzeContributionBoost(hooks: BoostHooks) {
  BOOST_HOOKS = hooks;
}

/** ---------- Heuristik-Bausteine ---------- **/

function inferRegion(body: ContributionAnalysisRequest): string | null {
  if (body.region) return body.region;
  if (body.userProfile?.region) return body.userProfile.region;

  const t = body.text.toLowerCase();
  if (/\bdeutschland\b|\bberlin\b|\bde\b/.test(t)) return "DE";
  if (/\bfrance\b|\bparis\b|\bfr\b/.test(t)) return "FR";
  if (/\bitalia\b|\broma\b|\bit\b/.test(t)) return "IT";
  if (/\bespaña\b|\bmadrid\b|\bes\b/.test(t)) return "ES";
  if (/\bpolska\b|\bwarszawa\b|\bpl\b/.test(t)) return "PL";
  return null;
}

function scoreTopicsHeuristic(text: string, cap = 5): TopicScore[] {
  const lower = text.toLowerCase();
  const raw: Array<{ name: string; hits: number }> = [];

  for (const [name, kws] of Object.entries(TOPIC_KEYWORDS)) {
    let hits = 0;
    for (const kw of kws) {
      const re = new RegExp(
        `\\b${String(kw).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "g",
      );
      hits += lower.match(re)?.length ?? 0;
    }
    if (hits > 0) raw.push({ name, hits });
  }

  const max = raw.reduce((m, x) => Math.max(m, x.hits), 0) || 1;

  return raw
    .map(({ name, hits }) => ({
      name,
      confidence: Number((hits / max).toFixed(4)), // 0..1
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, cap);
}

function makeSuggestionsHeuristic(text: string): string[] {
  const s: string[] = [];
  const t = text.trim();
  const len = t.length;

  if (len < 80)
    s.push(
      "Bitte gib mehr Kontext: Wer ist betroffen, welches Ziel, warum jetzt?",
    );
  if (len > 1500)
    s.push(
      "Der Text ist lang. Erstelle eine kurze Zusammenfassung (3–5 Sätze).",
    );
  if (!/[.!?]$/.test(t)) s.push("Schließe mit einem klaren Satz und Punkt.");
  if (!/\b(https?:\/\/|www\.)/.test(t) && /quelle|beleg|nachweis/i.test(t))
    s.push("Füge ggf. eine Quelle/URL als Nachweis hinzu.");
  return s;
}

/** Merge: Heuristik + AI (max confidence, Dedupe per name) */
function mergeTopics(a: TopicScore[], b: TopicScore[], cap = 5): TopicScore[] {
  const map = new Map<string, TopicScore>();
  const put = (x: TopicScore) => {
    const key = x.name.toLowerCase();
    const prev = map.get(key);
    if (!prev) map.set(key, x);
    else
      map.set(key, {
        name: x.name,
        confidence: Math.max(prev.confidence, x.confidence),
      });
  };
  a.forEach(put);
  b.forEach(put);

  const arr = [...map.values()];
  const max = arr.reduce((m, x) => Math.max(m, x.confidence), 0) || 1;
  return arr
    .map((x) => ({ ...x, confidence: Number((x.confidence / max).toFixed(4)) }))
    .sort((x, y) => y.confidence - x.confidence)
    .slice(0, cap);
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const k = s.trim();
    if (!k) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

/** Platzhalter: Statements erzeugen wir hier NICHT (macht extractStatementsFromText) */
function emptyStatements(): AnalyzedStatement[] {
  return [];
}

/** ---------- Hauptfunktion ---------- **/
export async function analyzeContribution(
  body: ContributionAnalysisRequest,
): Promise<ContributionAnalysisResponse> {
  const text = String(body?.text ?? "").trim();

  // Heuristik
  const regionH = inferRegion(body);
  const topicsH = scoreTopicsHeuristic(text);
  const suggestionsH = makeSuggestionsHeuristic(text);

  // Optional: AI-Boost
  let region = regionH;
  let topics = topicsH;
  let suggestions = suggestionsH;

  if (BOOST_HOOKS) {
    const [aiRegion, aiTopics, aiSug] = await Promise.all([
      BOOST_HOOKS.aiRegion
        ? BOOST_HOOKS.aiRegion(body).catch(() => null)
        : Promise.resolve(null),
      BOOST_HOOKS.aiTopics
        ? BOOST_HOOKS.aiTopics(text).catch(() => [])
        : Promise.resolve([]),
      BOOST_HOOKS.aiSuggestions
        ? BOOST_HOOKS.aiSuggestions(text).catch(() => [])
        : Promise.resolve([]),
    ]);

    if (aiRegion) region = aiRegion;
    if (aiTopics?.length) topics = mergeTopics(topicsH, aiTopics, 5);
    if (aiSug?.length) suggestions = dedupeStrings([...suggestionsH, ...aiSug]);
  }

  // V1-Fluss: Statements leer; Extraktion passiert in analyzeAndTranslate via extractStatementsFromText
  const statements: AnalyzedStatement[] = emptyStatements();

  return {
    region: region ?? null,
    topics,
    statements,
    suggestions,
    isNewContext: true, // Heuristik: bei späterer Persistenz/Cache-Erkennung auf false setzen
    saved: null,
  };
}
