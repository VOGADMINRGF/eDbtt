// VPM25/apps/web/src/features/analyze/analyzeContribution.ts
import { z } from "zod";
// import "server-only"; // optional, wenn nur auf Server genutzt

/** ───────────────────────────── Schemas (rückwärtskompatibel) ───────────────────────────── */

const OptionSchema = z.object({
  label: z.string().min(1).max(120),
  params: z.record(z.string(), z.any()).default({}),
});

const MetricSchema = z.object({
  name: z.string().min(1).max(120),
  target: z.string().min(1).max(120),
});

const ClaimSchema = z.object({
  // bestehende Felder
  text: z.string().min(6).max(2000),
  categoryMain: z.string().min(2).max(80).nullable().optional(),
  categorySubs: z.array(z.string().min(2).max(80)).max(6).default([]),
  region: z.string().min(2).max(120).nullable().optional(),
  authority: z.string().min(2).max(160).nullable().optional(),

  // neue optionale Felder (vollumfänglich, für Slider & Factcheck)
  id: z.string().optional(),
  claimType: z.enum(["Fakt", "Forderung", "Prognose", "Wertung"]).optional(),
  policyInstrument: z.enum([
    "Steuer/Abgabe","Subvention/Förderung","Verbot/Limit","Erlaubnis/Ausnahme",
    "Transparenz/Reporting","Investition","Organisation/Prozess","Standard/Norm",
  ]).optional(),
  ballotDimension: z.enum(["Budget","Gesetz/Regel","Personal/Organisation","Infrastruktur","Symbol/Resolution"]).optional(),
  timeframe: z.string().max(24).optional(),
  targets: z.array(z.string().min(2).max(40)).max(3).optional(),
  evidence: z.array(z.string().min(1).max(160)).max(6).optional(),

  // aus der „VOG-fertig“-Variante
  decisionMaker: z.string().max(160).optional(),
  jurisdiction: z.enum(["kommunal","land","regional","national","eu","global","ÖRR"]).optional(),
  options: z.array(OptionSchema).max(8).optional(),
  metrics: z.array(MetricSchema).max(8).optional(),
  verifiability: z.enum(["hoch","mittel","niedrig"]).optional(),
  checks: z.array(z.string().min(2).max(140)).max(8).optional(),
  relevance: z.number().int().min(1).max(5).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const AnalyzeSchema = z.object({
  language: z.string().min(2).max(5).default("de"),
  mainTopic: z.string().min(2).max(80).nullable().optional(),
  subTopics: z.array(z.string().min(2).max(80)).max(10).default([]),
  regionHint: z.string().nullable().optional(),
  claims: z.array(ClaimSchema).min(1).max(20),
});

export type AnalyzeResult = z.infer<typeof AnalyzeSchema>;

/** ───────────────────────────── Prompt-Builder (vereint beide Welten) ───────────────────────────── */

function buildSystemPrompt() {
  // Dein strenges Regelwerk + Shared JSON Constraints vereinigt.
  return `
Du bist ein strenger Extraktor für VoiceOpenGov (VOG). Antworte **ausschließlich** mit JSON.
Ziel: wenige, präzise, abstimmbare Aussagen ("claims").

Hart-Regeln:
- MaxClaims: 8 (lieber 5–6 präzise).
- claim.text = genau EINE prüfbare Aussage (1–2 Sätze, ≤ 180 Zeichen, keine "und/oder").
- Keine Duplikate (normalisiert).
- categoryMain MUSS im DomainKanon liegen (Tier-1). categorySubs nur aus TopicKanon (Tier-2, max 2).
- region/authority nur bei klarer Salienz.

Konvertiere Fragen in **neutrale, entscheidbare Thesen** mit Zuständigkeit.
Füge – wo sinnvoll – Optionen (3–5) und Metriken (2–3) hinzu.

Zusatz-Attribute je Claim:
- claimType ∈ {"Fakt","Forderung","Prognose","Wertung"}
- policyInstrument, ballotDimension, timeframe, targets[], evidence[]
- decisionMaker, jurisdiction
- verifiability ∈ {"hoch","mittel","niedrig"}, checks[] (konkrete Quellen-Hooks)
- relevance (1–5) nach Heuristik:
  +2 wenn Entscheidung Budget auf kommunal/land betrifft
  +1 hohe Öffentlichkeit (Medien/ÖRR)
  −1 bei verifiability = "niedrig"

DomainKanon (Tier-1, exakt benutzen):
"Kultur, Medien & Sport","Finanzen & Steuern","Kommunalpolitik","Föderalismus & Kommunen","Öffentliche Verwaltung & E-Gov","Transparenz & Antikorruption", "Demokratie & Beteiligung", "Wirtschaftspolitik", "Verkehr & Infrastruktur", "Energiepolitik", "Klima & Umweltschutz", "Wohnen & Stadtentwicklung", "Digitalisierung & Netzpolitik", "Datenschutz & IT-Sicherheit", "Bildung", "Gesundheitspolitik", "Soziales & Grundsicherung", "Justiz & Rechtsstaat", "Innere Sicherheit & Polizei", "EU-Politik" 
(… ggf. ergänzt – bleibe konsistent)

TopicKanon (Tier-2 – Auswahl):
"Kommunalfinanzen","Rundfunk","Medienkompetenz digital","Öffentliche Beschaffung","Smart City","Bürgerentscheid","Open Data","KI-Governance","Barrierefreiheit","Krisenvorsorge","Tourismusförderung","Veranstaltungen"
(… erweiterbar; nutze nur existierende)

Salienzregel für region/authority:
Setze nur bei ≥2 Signalen: Ort/Region/EU/Feiertag/Ereignis, benannte Institution, lokales Ereignis/Standort, Zeit-Ort-Kopplung.

Qualitäts-Gate je Claim:
1) Verb (ist/hat/erhöht/senkt/verbietet/erlaubt/fordert),
2) ≤180 Zeichen, 3) keine "und/oder", 4) categoryMain im Kanon,
5) keine Dublette, 6) kein reines Stimmungswort.

AUSGABE (JSON ONLY):
{
  "language":"de",
  "mainTopic": "...",
  "subTopics": ["..."],
  "regionHint": null,
  "claims": [
    { /* ClaimSchema kompatibel (s.o.) */ }
  ]
}

/* Kompatibilität:
Falls du nach einem bestehenden 'Shared JSON' arbeitest (statements/alternatives/...),
liefere TROTZDEM zusätzlich das Feld "claims" gemäß obiger Struktur.
*/
`;
}

/** ───────────────────────────── OpenAI Helper ───────────────────────────── */

function jsonSchemaForOpenAI() {
  // zwingt JSON-only bei neueren Modellen
  return { type: "json_object" as const };
}

/** ───────────────────────────── Normalizer: Shared → AnalyzeResult ───────────────────────────── */

function coerceToAnalyzeResult(parsed: any, fallbackText: string): AnalyzeResult {
  // 1) Bevorzugt: bereits im gewünschten Format
  const direct = AnalyzeSchema.safeParse(parsed);
  if (direct.success) return direct.data;

  // 2) Shared-Format (statements[]) → claims[]
  const claimsFromShared =
    Array.isArray(parsed?.statements)
      ? (parsed.statements as any[]).map((s: any, i: number) => ({
          id: s.id ?? `C${i + 1}`,
          text: String(s.text ?? "").trim(),
          categoryMain: (s.tags?.includes("Rundfunk") ? "Kultur, Medien & Sport" : null),
          categorySubs: Array.isArray(s.tags) ? s.tags.slice(0, 2) : [],
          region: null,
          authority: null,
          claimType: "Forderung",
          jurisdiction: (parsed?.level as any) || "land",
          relevance: 3,
        })).filter(c => c.text)
      : [];

  if (claimsFromShared.length) {
    const candidate = {
      language: (parsed?.translations?.de ? "de" : "de"),
      mainTopic: parsed?.topics?.[0] ?? null,
      subTopics: parsed?.topics?.slice(1, 4) ?? [],
      regionHint: null,
      claims: claimsFromShared,
    };
    const ok = AnalyzeSchema.safeParse(candidate);
    if (ok.success) return ok.data;
  }

  // 3) Fallback
  return {
    language: "de",
    mainTopic: null,
    subTopics: [],
    regionHint: null,
    claims: [{ text: fallbackText, categoryMain: null, categorySubs: [], region: null, authority: null }],
  };
}

/** ───────────────────────────── Hauptfunktion ───────────────────────────── */

export async function analyzeContribution(text: string): Promise<AnalyzeResult> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const user = text.slice(0, 8000);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: user },
      ],
      response_format: jsonSchemaForOpenAI(),
      temperature: 0.2,
    }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}${raw ? ` – ${raw}` : ""}`);

  let content: unknown;
  try {
    const full = JSON.parse(raw);
    content = full?.choices?.[0]?.message?.content ?? "{}";
  } catch {
    content = raw;
  }

  let parsed: any = content;
  if (typeof content === "string") {
    try { parsed = JSON.parse(content); } catch { parsed = null; }
  }

  // Akzeptiere sowohl dein Format als auch das Shared-Format
  let out = coerceToAnalyzeResult(parsed, user);

  // Hygiene + Dedupe + Kürzung
  const seen = new Set<string>();
  out.language = (out.language || "de").slice(0, 5);
  out.mainTopic ??= null;
  out.regionHint ??= null;
  out.subTopics ??= [];

  out.claims = (out.claims || [])
    .map(c => ({
      ...c,
      text: (c.text || "").trim().replace(/\s+/g, " ").slice(0, 240),
      categoryMain: c.categoryMain ?? null,
      categorySubs: (c.categorySubs ?? []).slice(0, 2),
      region: c.region ?? null,
      authority: c.authority ?? null,
      relevance: Math.max(1, Math.min(5, Math.round((c as any).relevance ?? 3))),
    }))
    .filter(c => {
      if (!c.text) return false;
      const k = `${c.text}|${c.categoryMain ?? ""}`.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  if (out.claims.length === 0) {
    out.claims = [{ text: user, categoryMain: null, categorySubs: [], region: null, authority: null }];
  }

  return out;
}
export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
