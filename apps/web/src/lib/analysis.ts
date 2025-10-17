export type Topic = { topic: string; score: number };
export type Thesis = { text: string; relevance: number };
export type Statement = { text: string; rationales: string[] };
export type Summary = { topics: number; theses: number; avgRelevance: number };
export type Analysis = {
  topics: Topic[];
  theses: Thesis[];
  statements: Statement[];
  summary: Summary;
};

/**
 * Sehr schnelle, rein lokale Heuristik (keine LLM-Calls).
 * - extrahiert Topics über Worthäufigkeiten (mit Stopwords)
 * - erkennt Thesen über Markerwörter
 * - baut eine Kurzliste „Kernaussagen“
 */
export default function analyzeLocal(text: string): Analysis {
  const sentences = text
    .split(/[.!?;\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const words = text
    .toLowerCase()
    .replace(/[^a-zäöüß]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  const stop = new Set(
    [
      "und","der","die","das","mit","im","in","es","ein","eine","zu","von","ist","sind","war","waren",
      "an","den","dem","des","oder","auch","nicht","für","auf","sich","weil","bei","man","wir","ich",
      "aber","am","um","so","noch","nur","mehr","weniger","ohne","unter","über","wie","dass","daß"
    ]
  );

  // Häufigkeiten
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length > 2 && !stop.has(w)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  // Top-Themen (KEIN Lookbehind/Unicode-Property – browserfreundlich)
  const topics: Topic[] = Array.from(freq.entries())
    .filter(([, c]) => c > 1)                 // <-- korrektes Destrukturieren
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, c], i) => ({
      topic: t.charAt(0).toUpperCase() + t.slice(1),
      // Score zwischen 0..1, skaliert nach Rang & Länge
      score: Math.max(
        0,
        Math.min(1, 0.85 - i * 0.1 + c / Math.max(10, words.length / 50))
      ),
    }));

  // Marker für Thesen/Claims
  const marker =
    /\b(muss|müssen|sollte|sollten|fordert|braucht|ist\s+notwendig|es\s+bedarf|wird\s+erwartet|unzumutbar|nicht\s+vertretbar)\b/i;

  const theses: Thesis[] = sentences
    .filter((s) => marker.test(s))
    .slice(0, 5)
    .map((t, i) => ({
      text: t,
      relevance: Math.max(0.2, 0.8 - i * 0.15),
    }));

  const base = theses.length ? theses.map((t) => t.text) : sentences.slice(0, 3);
  const statements: Statement[] = base.slice(0, 5).map((s) => ({
    text: s,
    rationales: [], // Platzhalter – kann später mit Begründungen gefüllt werden
  }));

  const avgRel =
    theses.length > 0
      ? theses.reduce((a, b) => a + b.relevance, 0) / theses.length
      : 0;

  return {
    topics,
    theses,
    statements,
    summary: {
      topics: topics.length,
      theses: theses.length,
      avgRelevance: Math.round(avgRel * 100) / 100,
    },
  };
}
