// apps/web/src/features/analyze/analyzeContribution.ts
import { z } from "zod";
// Optional (empfohlen, damit das File nicht in Client-Bundles rutscht):
// import "server-only";

const ClaimSchema = z.object({
  text: z.string().min(6).max(2000),
  categoryMain: z.string().min(2).max(80).nullable().optional(),
  categorySubs: z.array(z.string().min(2).max(80)).max(6).default([]),
  region: z.string().min(2).max(120).nullable().optional(),
  authority: z.string().min(2).max(160).nullable().optional(),
});

const AnalyzeSchema = z.object({
  language: z.string().min(2).max(5).default("de"),
  mainTopic: z.string().min(2).max(80).nullable().optional(),
  subTopics: z.array(z.string().min(2).max(80)).max(10).default([]),
  regionHint: z.string().nullable().optional(),
  claims: z.array(ClaimSchema).min(1).max(20),
});

export type AnalyzeResult = z.infer<typeof AnalyzeSchema>;

const SYS = ``
 
Du bist ein strenger Extraktor für bürgerliche Eingaben in VoiceOpenGov (VOG).

Ziele (hart):
- MaxClaims: 8 (lieber 5–6 präzise).
- Jede claim.text = genau EINE prüfbare Aussage (keine „und/oder“-Ketten).
- 1–2 Sätze, ≤ 180 Zeichen. Keine Slogans/Fragen/Appelle.
- Keine Duplikate (normalisiert: lowercased, ohne Satzzeichen/Stopwörter).
- categoryMain MUSS ∈ DomainKanon (Tier-1). Fehlt Match → Claim verwerfen.
- categorySubs optional (max 2), nur ∈ TopicKanon (Tier-2).
- region/authority NUR bei klarer Salienz (siehe Regel), sonst null.

DomainKanon (Tier-1, exakt benutzen):
"Verfassung & Grundrechte","Demokratie & Beteiligung","Wahlen & Parteienrecht",
"Parlamente & Verfahren","Föderalismus & Kommunen","Öffentliche Verwaltung & E-Gov",
"Transparenz & Antikorruption","Innere Sicherheit & Polizei","Justiz & Rechtsstaat",
"Außenpolitik & Diplomatie","EU-Politik","Entwicklung & Humanitäres",
"Wirtschaftspolitik","Finanzen & Steuern","Arbeit & Beschäftigung","Soziales & Grundsicherung",
"Rente & Alterssicherung","Gesundheitspolitik","Pflege","Bildung","Hochschule & Forschung",
"Digitalisierung & Netzpolitik","Datenschutz & IT-Sicherheit","Familie & Gleichstellung",
"Kinder & Jugend","Migration & Integration","Wohnen & Stadtentwicklung",
"Verkehr & Infrastruktur","Energiepolitik","Klima & Umweltschutz",
"Landwirtschaft","Verbraucherschutz","Tierschutz & Tierhaltung",
"Kultur, Medien & Sport","Handel & Außenwirtschaft","Regionalentwicklung & Ländlicher Raum",
"Bau & Planungsrecht","Kommunalpolitik","Verteidigung & Bundeswehr"

TopicKanon (Tier-2 – Auswahl, erweiterbar):
"Meinungsfreiheit","Bürgerentscheide","Wahlrecht","Ausschüsse","Kommunalfinanzen",
"Registermodernisierung","Lobbyregister","Cybercrime","Digitaljustiz","Sanktionen",
"Binnenmarkt","Industriestrategie","Schuldenbremse","Mindestlohn","Zeitarbeit",
"Bürgergeld","Kindergrundsicherung","Rentenniveau","Primärversorgung","KV",
"Krankenhausplanung","GVSG","Notfallversorgung","Pflegepersonal","Lehrkräftemangel",
"Open Science","Netzausbau","KI-Governance","Open Data","Digitale Identität",
"DSGVO","Elterngeld","Jugendschutz","Asylverfahren","Staatsangehörigkeit",
"Mietrecht","Sozialer Wohnungsbau","Deutschlandticket","Radwege",
"Erneuerbare","Wasserstoff","CO₂-Bepreisung","Kreislaufwirtschaft",
"Haltungsstufen","Produktsicherheit","Tiertransporte","Rundfunk",
"CETA","Lieferketten","Breitband","Wärmeplanung kommunal","Bauordnung","Bürgerentscheid",
"Ehrenamt","Zivilgesellschaft","Katastrophenschutz","Zivilschutz","Krisenvorsorge",
"Drogenpolitik","Pandemievorsorge","Landarztquote","Behindertenrechte","Barrierefreiheit",
"Geldwäschebekämpfung","Krypto-Regulierung","Bankenaufsicht","Plattformaufsicht/DSA",
"Desinformation","Medienkompetenz digital","Klimaanpassung","Biodiversität","Lärmschutz",
"Smart City","Obdachlosigkeit","Weiterbildung/Qualifizierung","Fachkräfteeinwanderung",
"Wehrpflicht","Zivildienst","Rüstungsbeschaffung","NATO-2%","Tourismusförderung","Öffentliche Beschaffung"

Zusatz-Attribute pro Claim:
- claimType ∈ {"Fakt","Forderung","Prognose","Wertung"} (nur wenn klar)
- policyInstrument ∈ {"Steuer/Abgabe","Subvention/Förderung","Verbot/Limit","Erlaubnis/Ausnahme","Transparenz/Reporting","Investition","Organisation/Prozess","Standard/Norm"}
- ballotDimension ∈ {"Budget","Gesetz/Regel","Personal/Organisation","Infrastruktur","Symbol/Resolution"}
- timeframe: "sofort" | "kurzfristig(<1J)" | "mittelfristig(1–3J)" | "langfristig(>3J)" | ISO (YYYY-MM), nur wenn explizit
- targets (max 3, kurz: "Mieter","Ärzte","Schüler")
- evidence: Ziffern/Prozente/Daten/§-Angaben (strings)

Salienzregel für region/authority:
Setze nur, wenn ≥2 Signale: (1) Ort/Region/EU/Feiertag/Ereignis, (2) Institution (BMG, KV, Gemeinde, Landtag, Bundestag, EU-Kommission),
(3) lokales Ereignis/Firmenstandort, (4) Zeit-Ort-Kopplung.

Qualitäts-Gate je Claim:
1) Kernaussage-Verb (ist/hat/erhöht/senkt/verbietet/erlaubt/führt zu/fordert).
2) ≤ 180 Zeichen. 3) Kein „und/oder“. 4) categoryMain ∈ DomainKanon.
5) Nicht doppelt (normalisiert). 6) Keine reinen Stimmungswörter ohne Gehalt.

Ausgabe: JSON mit language, mainTopic, subTopics, regionHint, claims[] (inkl. id, confidence).
Regel: Leeres Array, wenn keine validen Claims (keine Halluzination).
`;
function jsonSchemaForOpenAI() {
  // Chat Completions: erzwingt ein JSON-Objekt als Antwort
  return { type: "json_object" as const };
}

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
        { role: "system", content: SYS },
        { role: "user", content: user },
      ],
      // KEIN temperature/top_p mit Modellen nutzen, die nur Default erlauben
      response_format: jsonSchemaForOpenAI(),
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}${raw ? ` – ${raw}` : ""}`);
  }

  // content herausziehen (falls Gateway → JSON string im "content")
  let content: unknown;
  try {
    const full = JSON.parse(raw);
    content = full?.choices?.[0]?.message?.content ?? "{}";
  } catch {
    content = raw;
  }

  // robustes JSON-Parse
  let parsed: unknown = content;
  if (typeof content === "string") {
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = null;
    }
  }

  let out: AnalyzeResult;
  const safe = AnalyzeSchema.safeParse(parsed);
  if (safe.success) {
    out = safe.data;
  } else {
    // weicher Fallback: 1 Claim mit dem Rohtext
    out = {
      language: "de",
      mainTopic: null,
      subTopics: [],
      regionHint: null,
      claims: [
        { text: user, categoryMain: null, categorySubs: [], region: null, authority: null },
      ],
    };
  }

  // Normalisieren + Trimmen + Deduplizieren
  out.language = (out.language || "de").slice(0, 5);
  out.mainTopic ??= null;
  out.regionHint ??= null;
  out.subTopics ??= [];

  const seen = new Set<string>();
  out.claims = (out.claims || [])
    .map(c => ({
      text: (c.text || "").trim().replace(/\s+/g, " ").slice(0, 240),
      categoryMain: c.categoryMain ?? null,
      categorySubs: c.categorySubs ?? [],
      region: c.region ?? null,
      authority: c.authority ?? null,
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
