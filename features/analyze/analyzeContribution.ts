import { needsClarify, clarifyForPrices } from "./clarify";
import { callOpenAIJson } from "../ai/providers";

/* =======================
 * Typen
 * ======================= */

export type Claim = {
  text: string;
  categoryMain?: string | null;
  categorySubs?: string[];
  region?: string | null;
  authority?: string | null;
  canon?: string | null;
  // v2 (optional, wenn Modell liefert)
  specificity?: number;       // 0..1
  needsClarify?: boolean;
};

type Organ = {
  level: "EU" | "Bund" | "Land" | "Kommune" | "Behörde";
  name: string;
  why: string;
};

type Trust = {
  score: number;              // 0..1
  reasons: string[];
  riskFlags: string[];
};

type Newsroom = {
  queries: string[];
  angles: string[];
  watch: string[];
};

type WeightsUpdated = {
  specificity: number;
  sources: number;
  organ_alignment: number;
  region_link: number;
  feasibility: number;
};

type ClarifyCTAFromModel = {
  title?: string;
  hint?: string;
  options?: string[];
} | null;

export type AnalyzeResult = {
  language: string | null;
  mainTopic: string | null;
  subTopics: string[];
  regionHint: string | null;
  claims: Claim[];
  organs?: Organ[];           // v2
  trust?: Trust;              // v2
  newsroom?: Newsroom;        // v2
  weightsUpdated?: WeightsUpdated; // v2
  news: any[];
  scoreHints: { baseWeight?: number; reasons?: string[] } | null;
  // Für die UI belassen wir "cta" (type:"clarify", ask[], options[], quickSources[])
  cta: any | null;
  _meta: {
    mode: "gpt" | "ari" | "error";
    errors: string[] | null;
    tookMs: number;
    gptMs?: number;
    ariMs?: number;
    gptText: string | null;
  };
};

/* =======================
 * Mini-Prompt (v2)
 * ======================= */

const MINI_PROMPT = String.raw`You are VOG Analyzer. Output STRICT JSON (RFC8259), no prose.
Use the MANIFEST and RUBRIC to 1) extract claims, 2) map to political organs, 3) compute trust,
4) emit an optional clarify CTA for generic price statements, 5) propose newsroom queries/angles.

MANIFEST.topics_to_organs (DE/EU):
- "Preise/Preiserhöhungen": EU-Kommission (DG COMP, DG ENER), Bund: BMWK; Behörden: Bundeskartellamt, BNetzA; Länder: Wirtschafts-/Verbraucherschutz-Min.; Kommune: Stadtrat (Tarife/ÖPNV).
- "Lebensmittelpreise": BMEL; Behörden: BLE; Statistik: Destatis; EU: DG AGRI.
- "Energie/Kraftstoff": BMWK, BMDV; BNetzA; EU: DG ENER.
- "Mieten/Nebenkosten": BMI/BMWSB; Landesbau-/Mietrecht; Kommune: Mietspiegel, Stadtwerke.
(Erweitere implizit mit gesundem Menschenverstand, aber bleib konservativ.)

RUBRIC (0..1, additiv):
- specificity (0.0..0.4) – je konkreter (Branche/Region/Preistyp), desto höher
- sources (0.0..0.2) – valide Quellen/URLs (z.B. Destatis, Behörden)
- organ_alignment (0.0..0.2) – passt Topic → zuständige Organe?
- region_link (0.0..0.1) – erkennbare Region?
- feasibility (0.0..0.1) – als Maßnahme/Abstimmung formulierbar?
Total = sum; include reasons.

CLARIFY rule:
If statement is generic about “Preiserhöhungen/Preise” without subtype (Lebensmittel, Energie, Kraftstoff, Miete, Tarife),
set needsClarify=true and propose options: ["Lebensmittelpreise","Energiepreise","Kraftstoffpreise","Mieten/Nebenkosten","ÖPNV/Telekom-Tarife"].

FEEDBACK (editorSignals): summarize patterns and adjust weights slightly (±0.05 per strong pattern).
No free-form text—return newWeights with the deltas applied.

OUTPUT schema:
{
 "language": "de"|"en"|null,
 "mainTopic": string|null,
 "subTopics": string[],
 "claims": [{
   "text": string,
   "categoryMain": string|null,
   "categorySubs": string[],
   "specificity": number,
   "needsClarify": boolean
 }],
 "organs": [{"level":"EU"|"Bund"|"Land"|"Kommune"|"Behörde","name":string,"why":string}],
 "trust": {"score": number, "reasons": string[], "riskFlags": string[]},
 "clarifyCTA": null | {"title":string,"hint":string,"options":string[]},
 "newsroom": {"queries": string[], "angles": string[], "watch": string[]},
 "scoreHints": {"baseWeight": number, "reasons": string[]},
 "weightsUpdated": {"specificity":number,"sources":number,"organ_alignment":number,"region_link":number,"feasibility":number}
}

== TEXT ==
<<<INPUT>>

== EDITOR_SIGNALS_JSON ==
<<<EDITOR>>`;

/* =======================
 * Analyzer
 * ======================= */

export async function analyzeContribution(
  text: string,
  opts: {
    maxClaims?: number;
    context?: { editorSignals?: any };
    debug?: boolean;
    // optionaler Hook für zukünftige ARI/Suche (siehe unten)
    searchFn?: (queries: string[]) => Promise<{ news?: any[] }>;
  } = {}
): Promise<AnalyzeResult> {
  const t0 = Date.now();
  const errs: string[] = [];
  const maxClaims = Math.max(1, Number(opts.maxClaims ?? 5));

  let outText = "";
  let gptMs = 0;

  // Prompt mit Editor-Signalen füllen
  const prompt = MINI_PROMPT
    .replace("<<<INPUT>>>", text)
    .replace("<<<EDITOR>>>", JSON.stringify(opts?.context?.editorSignals ?? {}));

  let parsed: any = {};
  try {
    const tCall0 = Date.now();
    const { text: t } = await callOpenAIJson(prompt, 1600);
    gptMs = Date.now() - tCall0;
    outText = String(t || "");
    parsed = JSON.parse(outText || "{}");
  } catch (e: any) {
    errs.push("GPT JSON parse failed: " + String(e?.message || e));
    parsed = {};
  }

  // 🧹 Claims normalisieren (DE: „opinion“ → „Meinung“)
  const claims: Claim[] = Array.isArray(parsed?.claims)
    ? (parsed.claims as any[])
        .slice(0, maxClaims)
        .map((c): Claim => {
          const rawCat = c?.categoryMain ?? null;
          const catDE =
            rawCat && String(rawCat).toLowerCase() === "opinion" ? "Meinung" : rawCat;
          return {
            text: String(c?.text || "").trim(),
            categoryMain: catDE,
            categorySubs: Array.isArray(c?.categorySubs) ? c.categorySubs : [],
            region: c?.region ?? null,
            authority: c?.authority ?? null,
            canon: c?.canon ?? null,
            specificity: typeof c?.specificity === "number" ? c.specificity : undefined,
            needsClarify: Boolean(c?.needsClarify),
          };
        })
        .filter((c) => c.text)
    : [];

  // (Optional) Heuristik: „Preiserhöhung“ → Wirtschaft/Preise
  if (/preiserh[oö]hung/i.test(claims?.[0]?.text || "")) {
    claims[0] = {
      ...claims[0],
      categoryMain: "Wirtschaft",
      categorySubs: Array.from(new Set([...(claims[0].categorySubs || []), "Preise", "Tarife"])),
    };
  }

  // v2-Felder übernehmen, mit defensivem Fallback
  const organs: Organ[] = Array.isArray(parsed?.organs) ? parsed.organs : [];
  const trust: Trust | undefined = parsed?.trust && typeof parsed.trust === "object"
    ? {
        score: clamp01(Number(parsed.trust.score ?? 0)),
        reasons: Array.isArray(parsed.trust.reasons) ? parsed.trust.reasons : [],
        riskFlags: Array.isArray(parsed.trust.riskFlags) ? parsed.trust.riskFlags : [],
      }
    : undefined;

  const newsroom: Newsroom = {
    queries: Array.isArray(parsed?.newsroom?.queries) ? parsed.newsroom.queries : [],
    angles: Array.isArray(parsed?.newsroom?.angles) ? parsed.newsroom.angles : [],
    watch: Array.isArray(parsed?.newsroom?.watch) ? parsed.newsroom.watch : [],
  };

  const weightsUpdated: WeightsUpdated | undefined =
    parsed?.weightsUpdated && typeof parsed.weightsUpdated === "object"
      ? {
          specificity: Number(parsed.weightsUpdated.specificity ?? 0),
          sources: Number(parsed.weightsUpdated.sources ?? 0),
          organ_alignment: Number(parsed.weightsUpdated.organ_alignment ?? 0),
          region_link: Number(parsed.weightsUpdated.region_link ?? 0),
          feasibility: Number(parsed.weightsUpdated.feasibility ?? 0),
        }
      : undefined;

  // Klassische Felder (Kompatibilität zu v1)
  const language = parsed?.language ?? null;
  const mainTopic = parsed?.mainTopic ?? null;
  const subTopics = Array.isArray(parsed?.subTopics) ? parsed.subTopics : [];
  const regionHint = parsed?.regionHint ?? null; // falls Modell nichts liefert, bleibt null

  // scoreHints: vom Modell übernehmen oder aus trust ableiten
  let scoreHints: AnalyzeResult["scoreHints"] =
    parsed?.scoreHints && typeof parsed.scoreHints === "object"
      ? parsed.scoreHints
      : null;

  if (!scoreHints && trust) {
    scoreHints = {
      baseWeight: Math.round(clamp01(trust.score) * 5 * 10) / 10, // z.B. 0..5 in 0.1-Steps
      reasons: trust.reasons || [],
    };
  }

  // News-Array (für UI bereits vorhanden) – bleibt leer, bis ARI/Suche angeschlossen ist
  let news: any[] = Array.isArray(parsed?.news) ? parsed.news : [];

  // Clarify-CTA: (a) Modell-Mapping → UI-Form, (b) Fallback via needsClarify/clarifyForPrices()
  let cta: any = null;

  // (a) Mapping aus clarifyCTA des Modells
  const clarifyFromModel: ClarifyCTAFromModel = parsed?.clarifyCTA ?? null;
  if (clarifyFromModel && Array.isArray(clarifyFromModel.options) && clarifyFromModel.options.length) {
    const pricesPreset = clarifyForPrices?.() || { ask: [], options: [], quickSources: [] };
    cta = {
      type: "clarify",
      ask: [
        clarifyFromModel.title || "Bitte präzisieren: Welche Preise genau?",
        clarifyFromModel.hint || "Konkreter = bessere Zuordnung, Faktencheck, Quellen.",
        ...(pricesPreset.ask || []),
      ].filter(Boolean),
      options: clarifyFromModel.options.map((label: string, i: number) => ({ key: `opt${i + 1}`, label })),
      quickSources: pricesPreset.quickSources || [],
    };
  } else {
    // (b) Fallback-Heuristik
    const first = claims?.[0];
    if (first && needsClarify?.({ text: first.text, categoryMain: first.categoryMain, region: first.region })) {
      cta = { type: "clarify", ...(clarifyForPrices?.() || {}) };
    }
  }

  // Basisresultat ohne _meta
  const resultBase: Omit<AnalyzeResult, "_meta"> = {
    language,
    mainTopic,
    subTopics,
    regionHint,
    claims,
    organs,
    trust,
    newsroom,
    weightsUpdated,
    news,
    scoreHints,
    cta,
  };

  // Optional: ARI/Suche jetzt oder später anschalten (GPT = Fallback)
  // Wenn opts.searchFn gesetzt ist, nutzen wir newsroom.queries → suchen → news füllen und Mode kennzeichnen.
  let ariMs: number | undefined;
  if (opts.searchFn && Array.isArray(newsroom.queries) && newsroom.queries.length) {
    const tAri0 = Date.now();
    try {
      const res = await opts.searchFn(newsroom.queries);
      if (res?.news?.length) {
        resultBase.news = res.news;
      }
      ariMs = Date.now() - tAri0;
    } catch (e: any) {
      errs.push("Search/ARI failed: " + String(e?.message || e));
    }
  }

  // _meta sauber setzen
  const meta: AnalyzeResult["_meta"] = {
    mode: errs.length ? "error" : (ariMs ? "ari" : "gpt"),
    errors: errs.length ? errs : null,
    tookMs: Date.now() - t0,
    gptMs,
    ariMs,
    gptText: opts.debug ? outText ?? null : null,
  };

  return { ...resultBase, _meta: meta };
}

/* =======================
 * Helpers
 * ======================= */

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
