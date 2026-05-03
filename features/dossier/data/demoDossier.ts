import type { Dossier } from "../schemas";

const CREATED_AT = "2026-04-28T10:00:00.000Z";

const BASE_DEBATE_FRAME = {
  rights: [],
  duties: [],
  minimumStandards: [],
  enforcement: {
    stages: [],
    humanitarianExceptions: true,
    legalSafeguards: [],
  },
  metrics: [],
  antiPopulism: {
    score: 0,
    gates: [],
    status: "needs_review" as const,
  },
};

const DEEP_RESEARCH_SOURCE_SET: Dossier["sourceSet"] = [
  {
    canonicalUrl: "https://transport.ec.europa.eu/news-events/news/urban-vehicle-access-regulations-uvars-recommendations-expert-group-urban-mobility-2024-04-22_en",
    host: "transport.ec.europa.eu",
    publisher: "Europäische Kommission (DG MOVE)",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "Empfehlungen 2024",
    location: "EU",
    audience: "Städte, Mitgliedstaaten, Kommission",
    assumptions: ["Policy-Empfehlungen, keine lokale Wirkungsmessung"],
    fetchedAt: CREATED_AT,
    title: "EGUM-Empfehlungen zu Urban Vehicle Access Regulations (UVAR)",
  },
  {
    canonicalUrl: "https://transport.ec.europa.eu/transport-themes/urban-transport/urban-vehicle-access-regulations_en",
    host: "transport.ec.europa.eu",
    publisher: "Europäische Kommission (DG MOVE)",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend aktualisiert",
    location: "EU",
    audience: "Öffentlichkeit/Fachpolitik",
    assumptions: ["Übersichtsseite, keine Einzelkausalnachweise"],
    fetchedAt: CREATED_AT,
    title: "EU-Überblick Urban Vehicle Access Regulations",
  },
  {
    canonicalUrl: "https://environment.ec.europa.eu/topics/air/air-quality_en",
    host: "environment.ec.europa.eu",
    publisher: "Europäische Kommission (DG ENV)",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufender EU-Rechtsrahmen",
    location: "EU",
    audience: "Mitgliedstaaten/Öffentlichkeit",
    assumptions: ["Rechts- und Rahmeninformation, keine kommunale Maßnahmenwirkung"],
    fetchedAt: CREATED_AT,
    title: "EU Air Quality Framework / Air Quality Directive Kontext",
  },
  {
    canonicalUrl: "https://www.umweltbundesamt.de/themen/verkehr-laerm/nachhaltige-mobilitaet",
    host: "umweltbundesamt.de",
    publisher: "Umweltbundesamt (UBA)",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend",
    location: "Deutschland",
    audience: "Öffentlichkeit/Politik",
    assumptions: ["Fachliche Einordnung, kein lokales Experimentdesign"],
    fetchedAt: CREATED_AT,
    title: "StVG/StVO-Reformkontext und UBA-Fachkommentierung",
  },
  {
    canonicalUrl: "https://www.bmv.de/SharedDocs/DE/Anlage/G/mid-2023-ergebnisbericht.html",
    host: "bmv.de",
    publisher: "Bundesministerium für Verkehr",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "MiD 2023",
    location: "Deutschland",
    audience: "Fachöffentlichkeit",
    assumptions: ["Erhebungsdesign der MiD beachten; regionale Übertragung nicht automatisch"],
    fetchedAt: CREATED_AT,
    title: "Mobilität in Deutschland (MiD) 2023 – Ergebnisbericht",
  },
  {
    canonicalUrl: "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
    host: "tfl.gov.uk",
    publisher: "Transport for London",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufender Betrieb",
    location: "London",
    audience: "Öffentlichkeit",
    assumptions: ["Betreiberperspektive, lokale Rahmenbedingungen"],
    fetchedAt: CREATED_AT,
    title: "TfL ULEZ – Regelwerk und Programmhintergrund",
  },
  {
    canonicalUrl: "https://www.london.gov.uk/sites/default/files/2025-03/London-wide%20ULEZ%20One%20Year%20Report_Mar2025.pdf",
    host: "london.gov.uk",
    publisher: "Greater London Authority",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "Auswertung 2025, mit Vorjahresvergleichen",
    location: "London",
    audience: "Politik/Öffentlichkeit",
    assumptions: ["Teilweise modellierte Gegenfaktik, nicht nur direkte Messung"],
    fetchedAt: CREATED_AT,
    title: "London-wide ULEZ One Year Report",
  },
  {
    canonicalUrl: "https://www.paris.fr/pages/paris-cree-une-zone-apaisee-dans-le-centre-de-la-capitale-20426",
    host: "paris.fr",
    publisher: "Ville de Paris",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "ab 2024",
    location: "Paris Centre",
    audience: "Öffentlichkeit",
    assumptions: ["Regelkommunikation; Wirkungsdaten getrennt prüfen"],
    fetchedAt: CREATED_AT,
    title: "Paris ZTL – Regelwerk und Ausnahmen",
  },
  {
    canonicalUrl: "https://stad.gent/en/mobility-ghent/circulation-plan",
    host: "stad.gent",
    publisher: "Stad Gent",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "seit 2017",
    location: "Gent",
    audience: "Öffentlichkeit",
    assumptions: ["Kommunale Darstellung, lokale Sonderbedingungen"],
    fetchedAt: CREATED_AT,
    title: "Gent Circulation Plan",
  },
  {
    canonicalUrl: "https://stad.gent/en/mobility-ghent/mobility-plan",
    host: "stad.gent",
    publisher: "Stad Gent",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "seit 2017",
    location: "Gent",
    audience: "Öffentlichkeit",
    assumptions: ["Mobilitätsplan als Gesamtkontext, nicht nur Zonenwirkung"],
    fetchedAt: CREATED_AT,
    title: "Gent Mobility Plan",
  },
  {
    canonicalUrl: "https://www.comune.milano.it/argomenti/mobilita/area-c",
    host: "comune.milano.it",
    publisher: "Comune di Milano",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend",
    location: "Mailand",
    audience: "Öffentlichkeit",
    assumptions: ["Regel- und Programmdaten, lokale Durchsetzungspraxis"],
    fetchedAt: CREATED_AT,
    title: "Milan Area C",
  },
  {
    canonicalUrl: "https://www.comune.milano.it/argomenti/mobilita/area-b",
    host: "comune.milano.it",
    publisher: "Comune di Milano",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend",
    location: "Mailand",
    audience: "Öffentlichkeit",
    assumptions: ["Emissions- und Regelangaben aus Verwaltungsquelle"],
    fetchedAt: CREATED_AT,
    title: "Milan Area B",
  },
  {
    canonicalUrl: "https://mobilite-mobiliteit.brussels/en/city30",
    host: "mobilite-mobiliteit.brussels",
    publisher: "Brussels Mobility",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "seit Einführung City 30",
    location: "Brüssel",
    audience: "Öffentlichkeit",
    assumptions: ["Geschwindigkeitsregime; Wirkungsattribution separat prüfen"],
    fetchedAt: CREATED_AT,
    title: "Brussels City 30",
  },
  {
    canonicalUrl: "https://link.springer.com/article/10.1186/s12889-025-21835-z",
    host: "link.springer.com",
    publisher: "Springer Nature",
    sourceClass: "research",
    sourceType: "research",
    timeRange: "Publikation 2025",
    location: "Barcelona",
    audience: "Wissenschaft/Öffentlichkeit",
    assumptions: ["Untersuchte Teilräume; Mixed-Methods"],
    fetchedAt: CREATED_AT,
    title: "Barcelona Superblocks – Environmental and health effects",
  },
  {
    canonicalUrl: "https://catalog.data.gov/dataset/mta-congestion-relief-zone-vehicle-entries-beginning-2025",
    host: "catalog.data.gov",
    publisher: "State of New York / MTA",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "ab 2025",
    location: "New York City",
    audience: "Öffentlichkeit",
    assumptions: ["Entries-Datensatz, nicht direkt Umsatz- oder Kausalitätsnachweis"],
    fetchedAt: CREATED_AT,
    title: "New York Congestion Pricing – Vehicle Entries Dataset",
  },
  {
    canonicalUrl: "https://www.lta.gov.sg/content/ltaweb/en/roads-and-motoring/managing-traffic-and-congestion/electronic-road-pricing-erp.html",
    host: "lta.gov.sg",
    publisher: "Land Transport Authority Singapore",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend",
    location: "Singapur",
    audience: "Öffentlichkeit",
    assumptions: ["Systembeschreibung; Übertragbarkeit auf EU-Rechtsrahmen begrenzt"],
    fetchedAt: CREATED_AT,
    title: "Singapore ERP",
  },
  {
    canonicalUrl: "https://journals.sagepub.com/doi/10.1177/03611981241245676",
    host: "journals.sagepub.com",
    publisher: "Transportation Research Record (DLR-Autorenteam)",
    sourceClass: "research",
    sourceType: "research",
    timeRange: "Publikation 2024",
    location: "Deutschland / urbane Logistik",
    audience: "Wissenschaft/Fachpraxis",
    assumptions: ["Stated-preference Survey, nicht flächendeckende Beobachtungsdaten"],
    fetchedAt: CREATED_AT,
    title: "DLR Cargo-Bike Study (TRR 2024)",
  },
  {
    canonicalUrl: "https://urban-mobility-observatory.transport.ec.europa.eu/",
    host: "urban-mobility-observatory.transport.ec.europa.eu",
    publisher: "EU Urban Mobility Observatory",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "laufend",
    location: "EU",
    audience: "Städte/Fachpraxis",
    assumptions: ["Portal- und Leitfadencharakter, keine Einzelkausalbeweise"],
    fetchedAt: CREATED_AT,
    title: "EGUM / Urban Logistics & Data-Sharing Kontext",
  },
  {
    canonicalUrl: "https://www.oecd.org/en/publications/distributional-effects-of-urban-transport-policies-to-discourage-car-use_8bf57103-en.html",
    host: "oecd.org",
    publisher: "OECD",
    sourceClass: "research",
    sourceType: "research",
    timeRange: "Publikation 2023",
    location: "internationale Literatur",
    audience: "Policy/Wissenschaft",
    assumptions: ["Literaturreview; lokale Wirkung bleibt kontextabhängig"],
    fetchedAt: CREATED_AT,
    title: "OECD Distributional Effects of Urban Transport Policies",
  },
  {
    canonicalUrl: "https://ieep.eu/publications/low-and-zero-emission-zones-navigating-the-social-challenges-of-clean-air-policies-in-eu-cities/",
    host: "ieep.eu",
    publisher: "IEEP",
    sourceClass: "research",
    sourceType: "research",
    timeRange: "Publikation 2024",
    location: "EU-Städte",
    audience: "Policy/Fachöffentlichkeit",
    assumptions: ["Sozialakzeptanz-Fokus, keine Einheitslösung"],
    fetchedAt: CREATED_AT,
    title: "IEEP – Social Challenges of LEZ/ZEZ",
  },
  {
    canonicalUrl: "https://www.gov.uk/government/publications/low-traffic-neighbour-review",
    host: "gov.uk",
    publisher: "Department for Transport (England)",
    sourceClass: "gov",
    sourceType: "gov",
    timeRange: "Review 2024",
    location: "England",
    audience: "Policy/Öffentlichkeit",
    assumptions: ["Spezifischer Politik- und Rechtskontext England"],
    fetchedAt: CREATED_AT,
    title: "DfT LTN Review",
  },
];

function inferSourceType(title = "", sourceType?: string) {
  const lower = title.toLowerCase();
  if (lower.includes("directive") || lower.includes("rechtsrahmen") || lower.includes("reform")) {
    return "legal_framework";
  }
  if (sourceType === "research") return "academic";
  if (lower.includes("report") || lower.includes("evaluation")) return "evaluation";
  if (lower.includes("survey") || lower.includes("mid")) return "survey";
  if (lower.includes("plan") || lower.includes("city") || lower.includes("area")) return "city_report";
  return "policy";
}

function inferSourceCluster(title = "") {
  const lower = title.toLowerCase();
  if (lower.includes("air") || lower.includes("ulez")) return "air_quality";
  if (lower.includes("cargo") || lower.includes("logistics")) return "logistics";
  if (lower.includes("distributional") || lower.includes("social")) return "participation";
  if (lower.includes("city 30") || lower.includes("congestion")) return "traffic_displacement";
  if (lower.includes("erp") || lower.includes("uvar") || lower.includes("directive")) return "governance";
  if (lower.includes("mid") || lower.includes("mobility")) return "economics";
  return "accessibility";
}

function inferEvidenceStatus(sourceType?: string) {
  if (sourceType === "research") return "belegt";
  if (sourceType === "gov") return "plausibel";
  return "offen";
}

function inferTransferability(title = "", location?: string) {
  const lower = title.toLowerCase();
  if (lower.includes("eu ") || lower.includes("eu-") || location === "EU") return "hoch";
  if (lower.includes("mid") || lower.includes("deutschland")) return "mittel";
  return "gering";
}

function inferCriticalCaveat(title = "", assumptions?: string[]) {
  const lower = title.toLowerCase();
  if (lower.includes("dataset") || lower.includes("open data")) return "denominator unclear";
  if (lower.includes("one year report")) return "modelled not measured";
  if (assumptions?.some((entry) => entry.toLowerCase().includes("verwaltungsdarstellung"))) {
    return "political report";
  }
  if (assumptions?.some((entry) => entry.toLowerCase().includes("stichprobe"))) {
    return "sample bias possible";
  }
  return "local context only";
}

export const demoDossier: Dossier = {
  meta: {
    id: "demo-innencity-2026",
    title:
      "Wem gehört die Innenstadt von morgen? Stadtmobilität, Autoverbotszonen, Radverkehr, Lieferlogistik und neue Mobilitätsgrenzen.",
    jurisdiction: "municipal",
    region: "Lübeck",
    status: "draft",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    revision: {
      rev: 12,
      lastChangeAt: "2026-04-30T09:45:00.000Z",
    },
  },
  analyze: {
    mode: "E150",
    sourceText:
      "Wie sollen Zugangsrechte, Aufenthaltsqualität, Versorgung und Mobilität in der Innenstadt künftig fair, messbar und rechtssicher geregelt werden?",
    language: "de",
    claims: [
      {
        id: "stmt-1",
        title: "Zugang zur Innenstadt ist eine Verteilungsfrage",
        text:
          "Die Debatte über die Innenstadt ist keine Pro- oder Anti-Auto-Frage, sondern eine Verteilungsfrage zwischen Aufenthalt, Erreichbarkeit, Gewerbe, Wohnen und Versorgung.",
        responsibility: "Kommune",
        importance: 5,
        topic: "Innenstadtentwicklung",
        domain: "infrastruktur",
        domains: ["infrastruktur", "gesellschaft"],
        stance: "neutral",
        statementType: "interpretation",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "infrastructure",
          jurisdiction: { actors: ["Kommune"], region: "Lübeck" },
          objective:
            "Regelwerk für Zugänge und Nutzungen in der Innenstadt mit nachvollziehbaren Ausnahmen.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-a", label: "Schrittweise Zufahrtsbeschränkung mit Ausnahmen", type: "reform_moderate" },
            { id: "opt-b", label: "Zeitfenster-Modell für Liefer- und Gewerbeverkehr", type: "custom" },
            { id: "opt-c", label: "Status quo mit punktuellen Eingriffen", type: "status_quo" },
          ],
        },
      },
      {
        id: "stmt-2",
        title: "Anlass aus der Bürgerschaft: Stadtbild und Nutzungsdruck",
        text:
          "Ein lokaler Beitrag zur Frage, wie sich das Stadtbild entwickeln soll, verweist auf Konflikte zwischen Tourismus, Handel, Wohnen und Verkehrsräumen.",
        responsibility: "Bürgerschaft",
        importance: 4,
        topic: "Innenstadtentwicklung",
        domain: "gesellschaft",
        domains: ["gesellschaft", "nachbarschaft"],
        stance: "neutral",
        statementType: "fact",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "governance",
          jurisdiction: { actors: ["Kommune", "Bürgerschaft"], region: "Lübeck" },
          objective: "Lokalen Anlass in eine belastbare öffentliche Entscheidungsfrage überführen.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-d", label: "Pilotgebiet mit enger Evaluation", type: "pilot" },
            { id: "opt-c", label: "Status quo mit punktuellen Eingriffen", type: "status_quo" },
          ],
        },
      },
      {
        id: "stmt-3",
        title: "Internationale Beispiele berichten positive Effekte, aber mit Kontextgrenzen",
        text:
          "Fallbeispiele aus europäischen Städten berichten Verbesserungen bei Luftqualität, Sicherheit und Aufenthaltsqualität, sind jedoch nur unter lokalen Randbedingungen interpretierbar.",
        responsibility: "Forschung/Verwaltung",
        importance: 4,
        topic: "Vergleich",
        domain: "klima_umwelt",
        domains: ["klima_umwelt", "infrastruktur"],
        stance: "neutral",
        statementType: "fact",
        debateFrame: {
          version: "v1",
          level: "eu",
          policyDomain: "infrastructure",
          jurisdiction: { actors: ["Kommune"], region: "Europa" },
          objective: "Internationale Evidenz nutzbar machen, ohne lokale Übertragbarkeit zu überschätzen.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-d", label: "Pilotgebiet mit enger Evaluation", type: "pilot" },
            { id: "opt-e", label: "Mehrstufiges Zonenmodell mit Monitoring", type: "reform_strong" },
          ],
        },
      },
      {
        id: "stmt-4",
        title: "Verkehrsverlagerung ist ein zentrales Risiko",
        text:
          "Eine Beschränkung im Zentrum kann den Verkehr reduzieren, aber auch in angrenzende Quartiere verlagern; Nettoeffekte müssen mit Vorher-Nachher-Daten geprüft werden.",
        responsibility: "Verkehrsplanung",
        importance: 5,
        topic: "Verkehrswirkung",
        domain: "infrastruktur",
        domains: ["infrastruktur", "gesundheit"],
        stance: "neutral",
        statementType: "question",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "infrastructure",
          jurisdiction: { actors: ["Kommune"], region: "Lübeck" },
          objective: "Verlagerungs- statt Verdrängungseffekte transparent messen.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-e", label: "Mehrstufiges Zonenmodell mit Monitoring", type: "reform_strong" },
            { id: "opt-f", label: "Ausnahmen- und Barrierefreiheitskatalog vorab", type: "custom" },
          ],
        },
      },
      {
        id: "stmt-5",
        title: "Ausnahmen und Erreichbarkeit sind Teil der Gerechtigkeitsfrage",
        text:
          "Regeln für Menschen mit Mobilitätseinschränkungen, Pflege, Handwerk, Lieferverkehr und Rettungsdienste bestimmen, ob ein Modell sozial fair und praktisch tragfähig ist.",
        responsibility: "Kommune",
        importance: 5,
        topic: "Zugangsgerechtigkeit",
        domain: "gesundheit",
        domains: ["gesundheit", "gesellschaft", "infrastruktur"],
        stance: "neutral",
        statementType: "value",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "social",
          jurisdiction: { actors: ["Kommune"], region: "Lübeck" },
          objective: "Sichere, inklusive und planbare Erreichbarkeit im Regelwerk verankern.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-f", label: "Ausnahmen- und Barrierefreiheitskatalog vorab", type: "custom" },
            { id: "opt-b", label: "Zeitfenster-Modell für Liefer- und Gewerbeverkehr", type: "custom" },
          ],
        },
      },
      {
        id: "stmt-6",
        title: "Beteiligungsqualität entscheidet über Legitimität",
        text:
          "Abstimmungen oder Konsultationen sind nur belastbar, wenn Teilnehmende, Betroffenheit, Repräsentanz und Quellenbezug transparent dokumentiert sind.",
        responsibility: "Kommune/Moderation",
        importance: 5,
        topic: "Beteiligung",
        domain: "gesellschaft",
        domains: ["gesellschaft", "digitales"],
        stance: "neutral",
        statementType: "interpretation",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "governance",
          jurisdiction: { actors: ["Kommune", "Bürgerschaft"], region: "Lübeck" },
          objective: "Beteiligung als Qualitätsprozess statt als reine Klickzahl organisieren.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-d", label: "Pilotgebiet mit enger Evaluation", type: "pilot" },
            { id: "opt-f", label: "Ausnahmen- und Barrierefreiheitskatalog vorab", type: "custom" },
          ],
        },
      },
    ],
    findings: [
      {
        id: "f-1",
        claimId: "stmt-3",
        sourceId: "src-1",
        finding: "mentions",
        rationale:
          "Die Stadt Gent beschreibt den Umlaufplan als Reaktion auf gemessenen Durchgangsverkehr und berichtet positive Effekte.",
        excerptRef: "Gent Circulation Plan, Ablauf und Q&A",
      },
      {
        id: "f-2",
        claimId: "stmt-3",
        sourceId: "src-2",
        finding: "supports",
        rationale:
          "Eine wissenschaftliche Evaluation aus Barcelona berichtet Verbesserungen in Teilindikatoren, aber keine pauschale Übertragbarkeit.",
        excerptRef: "BMC Public Health 2025, Superblocks-Evaluation",
      },
      {
        id: "f-3",
        claimId: "stmt-4",
        sourceId: "src-3",
        finding: "unclear",
        rationale:
          "Der London-Bericht arbeitet mit Modellvergleich gegen ein Ohne-ULEZ-Szenario und zeigt auch methodische Annahmen zu Fahrleistungen.",
        excerptRef: "London ULEZ One Year Report 2025, Methodik",
      },
      {
        id: "f-4",
        claimId: "stmt-5",
        sourceId: "src-4",
        finding: "mentions",
        rationale:
          "Die Gent-Regeln benennen Ausnahmen für bestimmte Gruppen, zeigen aber zugleich differenzierte Zeit- und Zonenregeln mit Vollzugsfragen.",
        excerptRef: "Gent Circulation Plan, Ausnahmen und Sperrzeiten",
      },
    ],
    notes: [
      {
        id: "note-1",
        kind: "context",
        text: "Referenzdossier für eDebatte Studio: evidenzkritische Innenstadt-Debatte mit Review-Pflicht.",
      },
      {
        id: "note-master-structure",
        kind: "context",
        text: [
          "1. Executive Summary",
          "Quellenlage aus internationalen und lokalen Beispielen zeigt: Innenstadtregeln können Wirkung entfalten, aber nur mit klaren Ausnahmen, Messkonzept und Beteiligungsqualität.",
          "",
          "2. Kernthese",
          "Die Leitfrage ist fairer Zugang zur Innenstadt: Wer darf wann wofür hinein, unter welchen Bedingungen, mit welchen überprüfbaren Wirkungen?",
          "",
          "3. Quellenlage (Source says / Interpretation / Offene Frage)",
          "Source says: Gent, Barcelona und London berichten über Effekte spezifischer Maßnahmen.",
          "Interpretation: Die Richtung ist informativ, aber keine automatische Blaupause für deutsche Städte.",
          "Offene Frage: Welche lokalen Ausgangsdaten in Lübeck fehlen noch (Verkehrsarten, Nutzungsprofile, Betroffenheit)?",
          "",
          "4. Internationaler Vergleich (Kurzmatrix)",
          "Gent: Umlaufplan mit Zonenlogik; Evidenzstatus: plausibel.",
          "Barcelona: Superblock-Evaluation mit Mixed-Methods; Evidenzstatus: belegt für untersuchte Teilräume.",
          "London ULEZ: Modellierte und gemessene Luftqualitätsindikatoren; Evidenzstatus: belegt/plausibel je Kennzahl.",
          "",
          "5. Policy-Optionen / Eventualitäten",
          "A) Schrittweise Zufahrtsbeschränkung mit Ausnahmen",
          "B) Zeitfenster-Modell Liefer/Gewerbe",
          "C) Status quo + punktuelle Korrekturen",
          "D) Pilotgebiet mit Evaluation",
          "E) Mehrstufiges Zonenmodell mit Monitoring",
          "F) Ausnahmen- und Barrierefreiheitskatalog vorab",
          "",
          "6. Zahlen-Audit",
          "Wichtige Zahl 1: 'rund 40 % Durchgangsverkehr' (Gent) -> Grundgesamtheit: gemessener motorisierter Verkehr im Zentrum; Zeitraum: vor Umsetzung 2017; Kontext: Gent; Kontrollgruppe: keine randomisierte Kontrolle; Methodik: Verkehrszählung/administrative Auswertung; Übertragbarkeit nach Deutschland: offen, nur mit lokaler Basismessung.",
          "Wichtige Zahl 2: 'Ausweitung des Restriktionsbereichs um 128 %' (Gent) -> Gemessen wurde Flächenumfang des Regimes, nicht direkt Lebensqualität; Zeitraum: Einführung 2017; Kontext: Gent; Kontrollgruppe: nein; Methodik: administrative Flächen-/Regeldefinition; Übertragbarkeit: nur als Regulierungsindikator.",
          "Wichtige Zahl 3: NO2-/NOx-Effekte im ULEZ-Kontext (London) -> Grundgesamtheit: Straßensegmente/Flottenmodell je Bericht; Zeitraum: phasenweise, u. a. 2022-2024; Kontext: London; Kontrollgruppe: modelliertes Ohne-ULEZ-Szenario statt reales Parallelgebiet; Methodik: modelliert + gemessen; Übertragbarkeit: ohne lokale Flotten- und Raumstrukturprüfung nicht direkt.",
          "",
          "7. Beteiligungs-Audit",
          "Beteiligungsqualität (low/medium/high) basiert auf Teilnehmendenzahl, Repräsentanz, Betroffenheit, Quellenbezug und Stakeholder-Diversität.",
          "Leitfragen: Wie viele Personen haben teilgenommen? Wer hat teilgenommen? Wer lebt/arbeitet im betroffenen Gebiet? Wer fehlt? Wie viele Beiträge enthalten belastbare lokale Evidenz? Welche Gruppen sind über- oder unterrepräsentiert?",
          "Aktueller Demo-Status: medium (Teilnehmende vorhanden, aber Repräsentanz- und Evidenztiefe noch unvollständig).",
          "",
          "8. Offene Fragen",
          "Lösen autoarme Zonen Probleme oder verlagern sie Verkehr?",
          "Wer fährt heute tatsächlich in die Innenstadt?",
          "Wer wohnt dort noch, wer arbeitet dort?",
          "Wie werden E-Auto, E-Moped, Lieferverkehr und Ausnahmen abgegrenzt?",
          "Wie sind Fahrradparken, Lastenräder, E-Scooter organisiert?",
          "Welche Ausnahmen braucht es für mobilitätseingeschränkte Menschen?",
          "Was bedeuten Prozentwerte in absoluten Zahlen?",
          "Wie viele Personen stehen hinter Abstimmungsergebnissen?",
          "",
          "9. Übertragbarkeitsgrenzen",
          "Nicht übertragbar ohne Prüfung: Stadtgröße, Tourismusdruck, Netztopologie, Parkraum, ÖPNV-Takt, Wirtschaftsstruktur, historische Altstadtgeometrie.",
          "",
          "10. Dossier-Post / Master-Teaser",
          "Lübeck diskutiert über das Stadtbild der Innenstadt. Welche Zugänge sind fair, praktikabel und zukunftsfähig? eDebatte prüft Zahlen öffentlich, statt sie nur zu wiederholen. Prüfen Sie Quellen, ergänzen Sie lokale Evidenz und stimmen Sie über Optionen ab.",
        ].join("\n"),
      },
      {
        id: "note-source-matrix",
        kind: "context",
        text: JSON.stringify({
          section: "Quellenmatrix",
          priority: "A/B",
          principle:
            "Keine Einzelzahl ohne Kontext. Jede Quelle wird als Source says / Interpretation / offene Frage gelesen.",
          entries: DEEP_RESEARCH_SOURCE_SET.map((source, index) => ({
            id: `mx-${index + 1}`,
            title: source.title,
            source: source.publisher,
            canonicalUrl: source.canonicalUrl,
            geography: source.location,
            period: source.timeRange,
            sourceType: inferSourceType(source.title, source.sourceType),
            cluster: inferSourceCluster(source.title),
            takeaway:
              "Nützlich für die kommunale Abwägung, wenn lokale Mess- und Beteiligungsdaten parallel ausgewertet werden.",
            notAutomatic:
              "Keine 1:1-Übertragung auf Lübeck ohne Prüfung von Raumstruktur, Betroffenheit und Governance-Kontext.",
            evidenceStatus: inferEvidenceStatus(source.sourceType),
            transferability: inferTransferability(source.title, source.location),
            criticalCaveat: inferCriticalCaveat(source.title, source.assumptions),
          })),
        }),
      },
      {
        id: "note-zahlen-audit",
        kind: "context",
        text: JSON.stringify({
          section: "Zahlen-Audit",
          rule:
            "Prozentwerte sind ohne Grundgesamtheit, Zeitraum, Methode und Kontext nicht mandatsfähig.",
          entries: [
            {
              metric: "Rund 40 % Durchgangsverkehr (Gent, Ausgangslage)",
              source: "Stad Gent Circulation Plan",
              measured: "Anteil motorisierter Fahrten im Zentrum, die als Durchgangsverkehr klassifiziert wurden",
              denominator: "Motorisierte Fahrten im betrachteten Zentrumskorridor (lokale Zähllogik)",
              period: "Vor Einführung 2017",
              geography: "Gent",
              method: "administrative Verkehrszählung / kommunale Berichterstattung",
              controlGroup: "keine randomisierte Kontrollgruppe",
              transferabilityCaveat:
                "Nur bedingt auf deutsche Städte übertragbar; lokale Netzstruktur, Tourismusdruck und ÖPNV-Angebot können stark abweichen.",
              evidenceStatus: "plausibel",
            },
            {
              metric: "Ausweitung Restriktionsbereich um 128 % (Gent)",
              source: "Stad Gent Circulation Plan",
              measured: "Flächenumfang der verkehrsregulierten Zone",
              denominator: "Ausgangsfläche des Regimes vor Umstellung",
              period: "Einführungsphase 2017",
              geography: "Gent",
              method: "administrative Flächendefinition",
              controlGroup: "nicht anwendbar",
              transferabilityCaveat:
                "Flächenausweitung ist ein Regulierungsindikator, kein direkter Wirkungsnachweis für Gesundheit, Handel oder Lebensqualität.",
              evidenceStatus: "belegt",
            },
            {
              metric: "NO2-/NOx-Reduktionen im ULEZ-Kontext",
              source: "London-wide ULEZ One Year Report",
              measured: "Veränderte Emissions- und Konzentrationsindikatoren gegenüber Gegenfaktik",
              denominator: "Segment-/Flottenmodell je Auswertungsraum",
              period: "u. a. 2022–2024",
              geography: "London",
              method: "modelliert + gemessen (trend-/counterfactual-basiert)",
              controlGroup: "modelliertes Ohne-ULEZ-Szenario",
              transferabilityCaveat:
                "Übertragbarkeit auf deutsche Städte nur mit lokaler Flotten-, Raum- und Governance-Prüfung.",
              evidenceStatus: "belegt/plausibel",
            },
            {
              metric: "MTA CRZ Verkehrseintritte",
              source: "NY MTA Open Dataset (CRZ Vehicle Entries)",
              measured: "Eintritte in die Zone nach Zeitfenster, Ort und Fahrzeugklasse",
              denominator: "registrierte Eintritte pro Zeitscheibe",
              period: "ab 2025",
              geography: "New York City",
              method: "administrativer Datensatz",
              controlGroup: "keine direkte Vergleichsgruppe im Datensatz",
              transferabilityCaveat:
                "Datensatz ist kein direkter Wirkungs- oder Verteilungsnachweis; Interpretation erfordert Ergänzung um Kontextdaten.",
              evidenceStatus: "belegt (Datensatz), offen (Kausalwirkung)",
            },
            {
              metric: "MiD 2023 Mobilitätsmuster",
              source: "MiD 2023 Ergebnisbericht",
              measured: "Mobilitätsverhalten nach Erhebungsdesign der MiD",
              denominator: "Stichprobe gemäß MiD-Methodik",
              period: "Erhebungsjahr 2023",
              geography: "Deutschland",
              method: "survey",
              controlGroup: "nicht anwendbar",
              transferabilityCaveat:
                "Bundesweite Mittelwerte ersetzen keine innerstädtische Detailmessung für Lübeck.",
              evidenceStatus: "belegt",
            },
          ],
        }),
      },
      {
        id: "note-beteiligungs-audit",
        kind: "context",
        text: JSON.stringify({
          section: "Beteiligungs-Audit",
          score: {
            level: "medium",
            rationale:
              "Teilnahme vorhanden, aber Repräsentanz, Betroffenheitsabdeckung und Quellenbezug noch nicht vollständig ausgeglichen.",
          },
          auditQuestions: [
            "Wie viele Menschen haben teilgenommen (absolut und relativ zur betroffenen Bevölkerung)?",
            "Wer hat teilgenommen (Wohnort, Arbeitsort, Mobilitätsprofil, Betroffenheit)?",
            "Wer fehlt sichtbar (z. B. Schichtarbeit, Pflege, mobilitätseingeschränkte Gruppen, Lieferdienste)?",
            "Wie viele Kommentare enthalten überprüfbare Quellen oder konkrete lokale Beobachtungen?",
            "Sind betroffene Gruppen über- oder unterrepräsentiert?",
            "Kann das Ergebnis als Mandat interpretiert werden oder nur als Stimmungsbild?",
          ],
          mandateRule:
            "Ohne Transparenz über Teilnehmerstruktur und Evidenzanteil kein belastbares Mandat.",
          checklist: {
            participantCountDocumented: true,
            representativenessDocumented: false,
            affectednessDocumented: false,
            sourceBackedCommentShareDocumented: false,
            stakeholderDiversityDocumented: true,
          },
        }),
      },
      {
        id: "note-presentation-inputs",
        kind: "presentation",
        text: JSON.stringify({
          topic: { id: "t1", label: "Innenstadt von morgen", municipality: "Lübeck" },
          inputs: { streams: 4, beiträge: 18, zeitfenster: "120 Tage", quellen: 21 },
          statementStats: { total: 6, pro: 0, neutral: 6, contra: 0 },
          clusters: [
            { label: "Zugang und Regeln", count: 2 },
            { label: "Evidenz und Transfer", count: 2 },
            { label: "Beteiligung und Legitimität", count: 2 },
          ],
        }),
      },
      {
        id: "note-presentation-options",
        kind: "presentation",
        text: JSON.stringify({
          options: [
            {
              id: "opt-a",
              label: "Schrittweise Zufahrtsbeschränkung mit Ausnahmen",
              type: "reform_moderate",
              evidenceLevel: "linked",
              touchesStatements: ["stmt-1", "stmt-4", "stmt-5"],
            },
            {
              id: "opt-b",
              label: "Zeitfenster-Modell für Liefer- und Gewerbeverkehr",
              type: "custom",
              evidenceLevel: "linked",
              touchesStatements: ["stmt-1", "stmt-5"],
            },
            {
              id: "opt-c",
              label: "Status quo mit punktuellen Eingriffen",
              type: "status_quo",
              evidenceLevel: "none",
              touchesStatements: ["stmt-2"],
            },
            {
              id: "opt-d",
              label: "Pilotgebiet mit enger Evaluation",
              type: "pilot",
              evidenceLevel: "multi",
              touchesStatements: ["stmt-2", "stmt-3", "stmt-6"],
            },
            {
              id: "opt-e",
              label: "Mehrstufiges Zonenmodell mit Monitoring",
              type: "reform_strong",
              evidenceLevel: "linked",
              touchesStatements: ["stmt-3", "stmt-4"],
            },
            {
              id: "opt-f",
              label: "Ausnahmen- und Barrierefreiheitskatalog vorab",
              type: "custom",
              evidenceLevel: "linked",
              touchesStatements: ["stmt-4", "stmt-5", "stmt-6"],
            },
          ],
        }),
      },
      {
        id: "note-inputs",
        kind: "presentation",
        text: JSON.stringify({
          topic: { label: "Wem gehört die Innenstadt von morgen?", kommune: "Lübeck", zeitfensterTage: 120 },
          hero: {
            impactLevel: "Hoch",
            relevance: "5–15 Jahre",
            budgetRange: "Regelwerk + Umbaupfade",
            participation: "Bürgervotum (mindestens 5 Optionen)",
          },
          emblem: {
            label: "Lübeck",
            subtitle: "Innenstadt-Dossier",
            asset: "/media/wappen-beispielstadt.svg",
            initiative: "gemeinsam",
          },
          origins: [
            {
              kind: "administration",
              label: "Stadtverwaltung",
              subtitle: "Verkehr/Stadtentwicklung",
              asset: "/media/wappen-beispielstadt.svg",
              primary: true,
            },
            { kind: "community", label: "Bürgerschaft", subtitle: "Lokale Beiträge" },
            { kind: "association", label: "Gewerbe & Verbände", subtitle: "Nutzungsinteressen" },
            { kind: "media", label: "Lokale Presse", subtitle: "Öffentliche Debatte" },
          ],
          sourceExcerpts: {
            "src-1":
              "Gent: Durchgangsverkehr als Ausgangsproblem benannt; Restriktionszonen und Ausnahmen in Regelwerk verankert.",
            "src-2":
              "Barcelona: Evaluation berichtet positive Effekte in untersuchten Teilräumen, verweist aber auf Kontexteinfluss.",
            "src-3":
              "London: Bericht kombiniert Modellannahmen mit Messdaten; Effekte sind methodisch differenziert zu lesen.",
            "src-4":
              "Gent Q&A: Ausnahmeregeln und Vollzug sind zentral für Fairness und Alltagstauglichkeit.",
          },
          viewerRole: "citizen",
          recommendation: {
            allowedRoles: ["organization", "administration", "journalist"],
            teaser:
              "Kurzansicht: Pilot plus Ausnahmenkatalog und messbare Kriterien. Vollständige Begründung enthält Zahlen-Audit und Beteiligungs-Audit.",
            fullText:
              "Konsolidierter Vorschlag (Demo): Pilotgebiet mit verbindlichem Monitoring, transparenten Ausnahmen und jährlichem Revisionsfenster, bevor eine flächige Ausweitung entschieden wird.",
            ctaLabel: "Vollständige Abwägung öffnen",
            ctaHint: "Öffentlich einsehbar, Freigabe bleibt review-gebunden.",
          },
          inputs: {
            streams: [
              { id: "st-001", titel: "Bürgersignal: Stadtbild und Aufenthaltsqualität", datum: "2026-03-08" },
              { id: "st-002", titel: "Fachrunde: Lieferverkehr und Gewerbe", datum: "2026-03-18" },
              { id: "st-003", titel: "Forum: Mobilität und Barrierefreiheit", datum: "2026-03-27" },
              { id: "st-004", titel: "Abwägung: Optionen und Kriterien", datum: "2026-04-12" },
            ],
            beitraege: [
              { id: "cb-101", titel: "Anwohner*innen: Zugänge am Abend", datum: "2026-03-09", streamId: "st-001" },
              { id: "cb-102", titel: "Pflegedienst: Anfahrtsfenster dokumentieren", datum: "2026-03-19", streamId: "st-002" },
              { id: "cb-103", titel: "Handwerk: Ladezonen und Genehmigungszeit", datum: "2026-03-20", streamId: "st-002" },
              { id: "cb-104", titel: "Behindertenbeirat: Ausnahmen konkretisieren", datum: "2026-03-28", streamId: "st-003" },
              { id: "cb-105", titel: "Jugendrat: Öffentlicher Raum als Aufenthaltsort", datum: "2026-04-02", streamId: "st-004" },
            ],
          },
          vote: {
            options: [
              { id: "opt-a", label: "Schrittweise Zufahrtsbeschränkung mit Ausnahmen", type: "reform_moderate" },
              { id: "opt-b", label: "Zeitfenster-Modell für Liefer- und Gewerbeverkehr", type: "custom" },
              { id: "opt-c", label: "Status quo mit punktuellen Eingriffen", type: "status_quo" },
              { id: "opt-d", label: "Pilotgebiet mit enger Evaluation", type: "pilot" },
              { id: "opt-e", label: "Mehrstufiges Zonenmodell mit Monitoring", type: "reform_strong" },
              { id: "opt-f", label: "Ausnahmen- und Barrierefreiheitskatalog vorab", type: "custom" },
            ],
            majorityDemo: [
              { id: "opt-a", pct: 19 },
              { id: "opt-b", pct: 14 },
              { id: "opt-c", pct: 12 },
              { id: "opt-d", pct: 24 },
              { id: "opt-e", pct: 11 },
              { id: "opt-f", pct: 20 },
            ],
            totalVotes: 412,
            updatedAt: "2026-04-28",
            history: [
              { date: "2026-04-12", text: "Dossierstruktur veröffentlicht" },
              { date: "2026-04-18", text: "Quellenlage um London-Bericht ergänzt" },
              { date: "2026-04-24", text: "Beteiligungsfragen präzisiert" },
              { date: "2026-04-28", text: "Zahlen-Audit ergänzt" },
            ],
          },
          traceability: {
            streamsToStatements: {
              "st-001": ["stmt-2", "stmt-1"],
              "st-002": ["stmt-5", "stmt-4"],
              "st-003": ["stmt-5", "stmt-6"],
              "st-004": ["stmt-1", "stmt-3", "stmt-6"],
            },
            contributionsToStatements: {
              "cb-101": ["stmt-1"],
              "cb-102": ["stmt-5"],
              "cb-103": ["stmt-5", "stmt-4"],
              "cb-104": ["stmt-5", "stmt-6"],
              "cb-105": ["stmt-1", "stmt-6"],
            },
          },
          openQuestions: [
            {
              id: "q1",
              text: "Lösen Beschränkungen das Problem oder verlagern sie Verkehr in Nachbarquartiere?",
              status: "beantwortet",
              responsible: "Verkehrsplanung",
              supportActors: ["Umweltamt", "Statistikstelle"],
              lastUpdate: "2026-04-28",
              resolution:
                "Monitoring zeigt in den ersten 6 Monaten keine signifikante Nettoverlagerung, aber Randzeiten bleiben zu beobachten.",
              answeredByName: "Dr. Jana Albers",
              answeredByRole: "Leitung Verkehrsplanung",
              answeredByKind: "representative_person",
            },
            {
              id: "q2",
              text: "Wer fährt heute tatsächlich in die Innenstadt (Anteile nach Zweck, Zeit, Fahrzeugart)?",
              status: "offen",
              responsible: "Verkehrsplanung",
              supportActors: ["IHK", "Handwerkskammer"],
              lastUpdate: "2026-04-27",
            },
            {
              id: "q3",
              text: "Welche Gruppen sind in der Beteiligung über- oder unterrepräsentiert?",
              status: "offen",
              responsible: "Moderationsteam",
              supportActors: ["Integrationsbeirat", "Behindertenbeirat"],
              lastUpdate: "2026-04-29",
            },
          ],
          contributionPolicy: {
            publicContributionLanguage:
              "Menschen, Organisationen und verantwortliche Personen können Beiträge einreichen.",
            citizenVotesSeparatedFromOrganizationPositions: true,
            hostedRoomVisibility: "closed_hosted",
            hostedRoomLabel:
              "Geschlossener Hosted Room: Ergebnisse gelten nur für den definierten Teilnehmerkreis.",
            hostedRoomPublicOpinionNote:
              "Nicht als allgemeines öffentliches Meinungsbild interpretieren.",
            closedRoomProcessingNote:
              "Eingaben fließen trotzdem in die Dossier-Verarbeitung als Fragen, Claims, Quellen, Varianten, Argumente und offene Punkte.",
            confidentialHintFlow: "internal_only",
            confidentialHintNote:
              "Vertrauliche Hinweise werden intern geprüft und nicht automatisch an die hostende Organisation weitergeleitet.",
            noWhistleblowerPromise:
              "Kein automatisches Whistleblower-Schutzversprechen: Bei Bedarf bitte gesicherte Rechts-/Beratungswege nutzen.",
          },
          openIssueManagement: {
            issues: [
              {
                id: "issue-1",
                questionId: "q1",
                status: "in_bearbeitung",
                delegatedTo: "Verkehrsplanung",
                level: "kommune",
                requestedAt: "2026-04-20",
              },
              {
                id: "issue-2",
                questionId: "q3",
                status: "offen",
                delegatedTo: "Moderationsteam",
                level: "kommune",
                requestedAt: "2026-04-26",
              },
            ],
          },
          regionalSuggestions: {
            municipality: "Lübeck",
            suggestions: [
              "Lieferzonen Altstadt",
              "Barrierefreie Wegeführung",
              "E-Scooter und Lastenrad-Ordnung",
              "Park-and-Ride-Anbindung",
              "Tourismus- und Wohnnutzungsausgleich",
            ],
          },
          editorialInbox: [
            {
              id: "in-1",
              title: "Zahlen-Audit offen",
              subtitle: "Absolute Zahlen zu Verkehrsanteilen nachreichen",
              status: "offen",
              priority: "hoch",
            },
            {
              id: "in-2",
              title: "Beteiligungs-Audit erweitern",
              subtitle: "Repräsentanz nach Wohn-/Arbeitsort ergänzen",
              status: "in_pruefung",
              priority: "hoch",
            },
          ],
          watchlist: [
            {
              id: "wl-1",
              label: "Kennzahl: Anteil Durchgangsverkehr",
              kind: "Kennzahl",
              updatedAt: "2026-04-28",
            },
            {
              id: "wl-2",
              label: "Ausnahme-Regeln für Mobilitätseinschränkungen",
              kind: "Regelwerk",
              updatedAt: "2026-04-29",
            },
          ],
          roadmap: [
            {
              id: "rm-1",
              label: "Lokales Vorher-Nachher-Monitoring festlegen",
              status: "in_arbeit",
              eta: "Q3 2026",
              ownerRole: "Verwaltung",
              note: "Messkonzept für Verlagerung, Emissionen und Erreichbarkeit.",
            },
            {
              id: "rm-2",
              label: "Beteiligungsqualität-Score operationalisieren",
              status: "geplant",
              eta: "Q3 2026",
              ownerRole: "Moderation",
            },
          ],
        }),
      },
    ],
    questions: [
      {
        id: "q1",
        text: "Lösen autoarme Zonen Probleme oder verlagern sie Verkehr in angrenzende Quartiere?",
        dimension: "verkehrswirkung",
      },
      {
        id: "q2",
        text: "Wer fährt heute tatsächlich in die Innenstadt und zu welchen Zwecken?",
        dimension: "nutzungsstruktur",
      },
      {
        id: "q3",
        text: "Wie werden Ausnahmen für Mobilitätseinschränkungen, Pflege, Handwerk und Rettung verlässlich geregelt?",
        dimension: "gerechtigkeit",
      },
      {
        id: "q4",
        text: "Wie viele Beteiligte stehen hinter Konsultations- und Abstimmungsergebnissen und wie repräsentativ sind sie?",
        dimension: "beteiligungsqualität",
      },
    ],
    missingPerspectives: [
      {
        id: "mp-1",
        text: "Pendler*innen ohne ÖPNV-Alternative",
        dimension: "erreichbarkeit",
      },
      {
        id: "mp-2",
        text: "Beschäftigte im Schichtdienst in der Innenstadt",
        dimension: "arbeitswege",
      },
      {
        id: "mp-3",
        text: "Menschen mit Mobilitätseinschränkungen",
        dimension: "inklusion",
      },
    ],
    knots: [
      {
        id: "k1",
        label: "Aufenthaltsqualität vs. Erreichbarkeit",
        description: "Mehr Aufenthaltsflächen können mit restriktiverem Verkehrsregime einhergehen.",
      },
      {
        id: "k2",
        label: "Innenstadtentlastung vs. Verlagerungsrisiko",
        description: "Entlastung im Zentrum darf Belastungen in Nachbarquartieren nicht unsichtbar machen.",
      },
    ],
    consequences: {
      consequences: [
        {
          id: "cons-1",
          scope: "local_short",
          statementIndex: 3,
          text: "Ohne Monitoring bleibt unklar, ob Verkehr tatsächlich sinkt oder nur räumlich verschoben wird.",
          confidence: 0.6,
        },
        {
          id: "cons-2",
          scope: "local_long",
          statementIndex: 2,
          text: "Bei tragfähiger Umsetzung sind Verbesserungen bei Aufenthaltsqualität und Sicherheit möglich.",
          confidence: 0.6,
        },
        {
          id: "cons-3",
          scope: "local_long",
          statementIndex: 5,
          text: "Hohe Beteiligungsqualität erhöht die Legitimität und reduziert spätere Konflikte.",
          confidence: 0.7,
        },
      ],
      responsibilities: [
        {
          id: "resp-1",
          level: "municipality",
          actor: "Bürgerschaft/Gemeinderat",
          text: "Regelwerk beschließen, Zielgrößen festlegen, Evaluation verpflichtend machen.",
          relevance: 0.9,
        },
        {
          id: "resp-2",
          level: "municipality",
          actor: "Verkehrsplanung",
          text: "Datenbasis, Ausnahmenkatalog und Monitoring umsetzen.",
          relevance: 0.9,
        },
        {
          id: "resp-3",
          level: "municipality",
          actor: "Sozial- und Inklusionsbeauftragte",
          text: "Barrierefreiheits- und Teilhabeausnahmen prüfen und absichern.",
          relevance: 0.8,
        },
      ],
    },
    responsibilityPaths: [
      {
        id: "path-1",
        statementId: "stmt-4",
        locale: "de",
        createdAt: CREATED_AT,
        nodes: [
          {
            level: "municipality",
            actorKey: "city_council",
            displayName: "Bürgerschaft/Gemeinderat",
            description: "Politischer Beschluss über Pilot, Kriterien und Berichtspflichten.",
            processHint: "Satzung/Beschlussvorlage",
            relevance: 0.9,
          },
          {
            level: "municipality",
            actorKey: "mobility_office",
            displayName: "Verkehrsplanung",
            description: "Operative Umsetzung, Messdesign und Quartiersauswertung.",
            processHint: "Umsetzung und Monitoring",
            relevance: 0.9,
          },
        ],
      },
      {
        id: "path-2",
        statementId: "stmt-5",
        locale: "de",
        createdAt: CREATED_AT,
        nodes: [
          {
            level: "municipality",
            actorKey: "inclusion_office",
            displayName: "Inklusions- und Sozialbereich",
            description: "Ausnahmeregeln für mobilitätseingeschränkte Menschen definieren.",
            processHint: "Härtefall- und Genehmigungsprozess",
            relevance: 0.9,
          },
          {
            level: "municipality",
            actorKey: "public_order",
            displayName: "Ordnungsamt",
            description: "Vollzug und nachvollziehbare Kommunikation der Regelgrenzen.",
            relevance: 0.7,
          },
        ],
      },
    ],
    eventualities: [
      {
        id: "ev-1",
        statementId: "stmt-4",
        label: "Pilot mit Monitoring",
        narrative:
          "Ein klar begrenztes Pilotgebiet mit Vorher-Nachher-Messung und Abbruchkriterien wird eingeführt.",
        stance: "neutral",
        likelihood: 0.6,
        impact: 0.7,
        consequences: [],
        responsibilities: [],
        children: [],
      },
      {
        id: "ev-2",
        statementId: "stmt-3",
        label: "Direkte Übernahme ohne lokale Prüfung",
        narrative:
          "Internationale Maßnahmen werden nahezu unverändert übernommen, ohne lokale Kontrollindikatoren.",
        stance: "contra",
        likelihood: 0.3,
        impact: 0.4,
        consequences: [],
        responsibilities: [],
        children: [],
      },
    ],
    decisionTrees: [
      {
        id: "dt-1",
        rootStatementId: "stmt-1",
        locale: "de",
        createdAt: CREATED_AT,
        options: {
          pro: {
            id: "dt-1-pro",
            statementId: "stmt-4",
            label: "Pilot + Monitoring + Ausnahmen",
            narrative:
              "Stufenmodell mit Evaluation, definierten Ausnahmen und transparenten Kennzahlen.",
            stance: "pro",
            likelihood: 0.6,
            impact: 0.7,
            consequences: [],
            responsibilities: [],
            children: [],
          },
          contra: {
            id: "dt-1-contra",
            statementId: "stmt-2",
            label: "Status quo ohne Systemänderung",
            narrative:
              "Bestehende Regelung bleibt, nur kleinteilige Korrekturen ohne umfassendes Monitoring.",
            stance: "contra",
            likelihood: 0.4,
            impact: 0.4,
            consequences: [],
            responsibilities: [],
            children: [],
          },
        },
      },
    ],
    impactAndResponsibility: {
      impacts: [
        {
          type: "zugangsgerechtigkeit",
          description: "Wer die Innenstadt wann und wie nutzen kann.",
          confidence: 0.7,
        },
        {
          type: "verkehr",
          description: "Verlagerungseffekte zwischen Zentrum und Nachbarquartieren.",
          confidence: 0.6,
        },
        {
          type: "beteiligung",
          description: "Legitimität hängt an Repräsentanz und evidenzbasierten Beiträgen.",
          confidence: 0.7,
        },
      ],
      responsibleActors: [
        { level: "municipality", hint: "Bürgerschaft/Gemeinderat", confidence: 0.9 },
        { level: "municipality", hint: "Verkehrsplanung und Ordnungsamt", confidence: 0.8 },
        { level: "municipality", hint: "Sozial-/Inklusionsvertretungen", confidence: 0.8 },
      ],
    },
    participationCandidates: [
      {
        id: "pc-1",
        text: "Anwohner*innen der Innenstadt und angrenzender Quartiere",
        rationale: "Direkt betroffen von Aufenthalts- und Verkehrsänderungen.",
      },
      {
        id: "pc-2",
        text: "Menschen mit Mobilitätseinschränkungen und ihre Vertretungen",
        rationale: "Ausnahmeregeln und Erreichbarkeit sind zentrale Gerechtigkeitsfrage.",
      },
      {
        id: "pc-3",
        text: "Pflege, Handwerk, Lieferdienste und Rettungsdienste",
        rationale: "Alltags- und Versorgungszugänge müssen praktisch funktionieren.",
      },
      {
        id: "pc-4",
        text: "Einzelhandel, Gastronomie und Kulturbetriebe",
        rationale: "Wirtschaftliche Nutzungen und Besucherströme sind betriebsrelevant.",
      },
    ],
    report: {
      summary:
        "Executive Summary: Das Dossier bündelt eine priorisierte Quellenmatrix (EU-Rechtsrahmen, DE-Mobilitätsdaten, internationale Fallbeispiele, Verteilungs- und Sozialstudien) zur Leitfrage „Wem gehört die Innenstadt von morgen?“. Kernthese: Entscheidend ist ein fairer, überprüfbarer und steuerbarer Zugangsausgleich statt Lagerlogik pro/contra Auto.",
      keyConflicts: [
        "Aufenthaltsqualität im Zentrum vs. Verlagerungsrisiken in Nachbarquartiere",
        "Klarere Regeln vs. flexible Ausnahmen für Alltag, Versorgung und Inklusion",
        "Schnelle Entscheidung vs. belastbare Datengrundlage und Beteiligungsqualität",
      ],
      facts: {
        local: [
          "Source says: Lokale Beiträge benennen Konflikte zwischen Stadtbild, Erreichbarkeit und Nutzungsmischung (Wohnen, Handel, Tourismus). Evidenzstatus: plausibel.",
          "Interpretation: Ohne lokale Vorher-Nachher-Messungen bleibt offen, ob Maßnahmen Nettoentlastung oder primär Verlagerung erzeugen. Evidenzstatus: offen.",
          "Beteiligungsqualität: aktuell medium (Teilnehmende und Stakeholder vorhanden, aber Repräsentanz-, Betroffenheits- und Evidenzanteil noch unvollständig dokumentiert).",
        ],
        international: [
          "Quellenmatrix Priorität A/B umfasst u. a. EGUM/UVAR, EU-Luftqualitätsrahmen, StVG/StVO/UBA-Kontext, MiD 2023, TfL/GLA ULEZ, Paris ZTL, Gent, Mailand (Area C/B), Brüssel City 30, Barcelona, New York CRZ, Singapur ERP, DLR-Logistikforschung, OECD/IEEP, DfT LTN Review.",
          "Wichtige Kennzahlen werden nur mit Zahlen-Audit geführt: Messgegenstand, Grundgesamtheit, Zeitraum, Methode, Kontrolllogik und Übertragbarkeitsgrenze sind Pflichtfelder.",
          "Keine Prozentzahl wird als isolierte Marketingaussage behandelt; jede Zahl bleibt hypothesesensibel und kontextgebunden.",
        ],
      },
      openQuestions: [
        "Sind autoarme Zonen Problemlösung oder Verlagerung?",
        "Wer fährt tatsächlich in die Innenstadt (Bewohner*innen, Beschäftigte, Besucher*innen, Lieferverkehre)?",
        "Welche absoluten Fallzahlen stehen hinter Prozentwerten und Beteiligungsergebnissen?",
        "Wie werden E-Fahrzeuge, Lastenräder, E-Scooter, Pflege, Handwerk und Rettung rechtssicher geregelt?",
        "Welche Gruppen fehlen bislang in der Beteiligung?",
      ],
      takeaways: [
        "Transferability limits: Internationale Kennzahlen sind Hinweise, keine Blaupause; Übertragbarkeit ist ohne lokale Basisdaten und Vergleichsdesign nicht gesichert.",
        "Evidenzstatus-Logik im Dossier: belegt, plausibel, umstritten, offen, nicht übertragbar ohne Prüfung.",
        "Master-Post-Teaser: In Lübeck wird über die Innenstadt von morgen diskutiert. eDebatte prüft Zahlen öffentlich, statt sie nur zu wiederholen. Prüfen Sie Quellen, ergänzen Sie lokale Evidenz, klären Sie Betroffenheit und stimmen Sie über die Optionen ab.",
      ],
    },
    evidenceGraph: {
      nodes: [
        { id: "stmt-1", type: "claim", label: "Zugang zur Innenstadt ist Verteilungsfrage" },
        { id: "stmt-2", type: "claim", label: "Anlass aus der Bürgerschaft" },
        { id: "stmt-3", type: "claim", label: "Internationale Effekte mit Kontextgrenzen" },
        { id: "stmt-4", type: "claim", label: "Verkehrsverlagerung als Risiko" },
        { id: "stmt-5", type: "claim", label: "Ausnahmen und Erreichbarkeit" },
        { id: "stmt-6", type: "claim", label: "Beteiligungsqualität und Legitimität" },
        {
          id: "src-1",
          type: "evidence",
          label: "Stad Gent – Circulation Plan",
          url: "https://stad.gent/en/mobility-ghent/circulation-plan",
          publisher: "Stad Gent",
          sourceClass: "gov",
          weight: 0.6,
        },
        {
          id: "src-2",
          type: "evidence",
          label: "BMC Public Health 2025 – Barcelona Superblocks",
          url: "https://link.springer.com/article/10.1186/s12889-025-21835-z",
          publisher: "Springer Nature",
          sourceClass: "research",
          weight: 0.7,
        },
        {
          id: "src-3",
          type: "evidence",
          label: "London-wide ULEZ One Year Report (2025)",
          url: "https://www.london.gov.uk/sites/default/files/2025-03/London-wide%20ULEZ%20One%20Year%20Report_Mar2025.pdf",
          publisher: "Greater London Authority",
          sourceClass: "gov",
          weight: 0.6,
        },
        {
          id: "src-4",
          type: "evidence",
          label: "Stad Gent – Mobility Plan/Q&A",
          url: "https://stad.gent/en/mobility-ghent/mobility-plan",
          publisher: "Stad Gent",
          sourceClass: "gov",
          weight: 0.5,
        },
      ],
      edges: [
        { from: "src-1", to: "stmt-3", kind: "mentions", weight: 0.5 },
        { from: "src-2", to: "stmt-3", kind: "supports", weight: 0.7 },
        { from: "src-3", to: "stmt-4", kind: "mentions", weight: 0.5 },
        { from: "src-4", to: "stmt-5", kind: "mentions", weight: 0.5 },
      ],
      summary: {
        claimCount: 6,
        evidenceCount: 4,
        linkedClaimCount: 4,
        unlinkedClaimCount: 2,
      },
    },
    runReceipt: {
      id: "rr-demo-innencity-2026",
      createdAt: CREATED_AT,
      pipelineVersion: "Standardisiertes Analyseverfahren",
      provider: "demo",
      model: "demo",
      promptVersion: "pr-0045",
      language: "de",
      inputHash: "ih_demo_innencity_2026",
      sourcesHash: "sh_demo_innencity_2026",
      outputHash: "oh_demo_innencity_2026",
      receiptHash: "rh_demo_innencity_2026",
      snapshotId: "snap_demo_innencity_2026",
      sourceSet: DEEP_RESEARCH_SOURCE_SET,
      contentPolicy: {
        maxSnippetChars: 240,
        storeFullText: false,
        storeSnippets: false,
        storeTitles: true,
      },
    },
  },
  sourceSet: DEEP_RESEARCH_SOURCE_SET,
  voteConfig: {
    enabled: true,
    policy: "civic",
    minOptions: 5,
    allowCommunityOptions: true,
  },
  auditTrail: [
    {
      id: "aud-1",
      at: "2026-04-28T10:05:00.000Z",
      actorRole: "system",
      actorLabel: "Analysepipeline",
      action: "Dossier aktualisiert",
      targetType: "dossier",
      note: "Master-Dossier auf Innenstadt-Thema mit Evidenz- und Beteiligungs-Audit umgestellt.",
    },
    {
      id: "aud-2",
      at: "2026-04-29T09:10:00.000Z",
      actorRole: "staff",
      actorLabel: "Redaktion",
      action: "Quellenlage erweitert",
      targetType: "source",
      targetId: "src-3",
      note: "London-Bericht mit Methodikhinweis ergänzt.",
    },
    {
      id: "aud-3",
      at: "2026-04-30T09:45:00.000Z",
      actorRole: "admin",
      actorLabel: "Dossierleitung",
      action: "Review-Status bestätigt",
      targetType: "dossier",
      note: "Veröffentlichung bleibt review-gebunden; offene Fragen sichtbar.",
    },
  ],
  corrections: [
    {
      id: "corr-1",
      createdAt: "2026-04-29T11:22:00.000Z",
      kind: "correction",
      targetType: "claim",
      targetId: "stmt-3",
      summary: "Hinweis ergänzt: Internationale Fallzahlen nicht als universelle Effekte darstellen.",
      status: "accepted",
    },
    {
      id: "corr-2",
      createdAt: "2026-04-30T08:40:00.000Z",
      kind: "objection",
      targetType: "question",
      targetId: "q4",
      summary: "Absolutzahlen zur Beteiligung und Repräsentanz in nächstem Update nachreichen.",
      status: "open",
    },
  ],
};

export default demoDossier;
