import { callOpenAIJson } from "@features/ai";

export type CreatePlannerScope = "local" | "district" | "municipal" | "state" | "federal" | "eu" | "international" | "unclear";
export type CreatePlannerStance = "pro" | "contra" | "mixed" | "open" | "unclear";
export type CreatePlannerRecommendedLane = "standard" | "create_fast_followup";
export type CreatePlannerSource = "openai" | "heuristic_fallback";

export type CreatePlannerProviderPlan = {
  lane: CreatePlannerRecommendedLane;
  plannerProvider: "openai" | null;
  plannerRole: "planner_only";
  structureProvider: "mistral";
  summaryProvider: "claude";
  researchUsed: "none";
  researchProvider: null;
  deepSearchUsed: false;
  graphMatch: "after_structure";
};

export type CreatePlannerPermissions = {
  nonMutative: true;
  canPublish: false;
  canSave: false;
  canMerge: false;
  canDeepSearch: false;
};

export type CreatePlannerResult = {
  source: CreatePlannerSource;
  plannerTopic: string;
  plannerCore: string;
  plannerScope: CreatePlannerScope[];
  plannerStance: CreatePlannerStance;
  plannerClusters: string[];
  plannerOpenQuestions: string[];
  shortSummary: string;
  topicCandidates: string[];
  clusterCandidates: string[];
  scopeCandidates: CreatePlannerScope[];
  stance: CreatePlannerStance;
  openQuestions: string[];
  graphSearchTerms: string[];
  materialSignals: string[];
  recommendedLane: CreatePlannerRecommendedLane;
  providerPlan: CreatePlannerProviderPlan;
  permissions: CreatePlannerPermissions;
};

type BuildCreatePlannerInput = {
  text: string;
  locale: string;
};

type OpenAiPlannerPayload = {
  plannerTopic?: unknown;
  plannerCore?: unknown;
  plannerScope?: unknown;
  plannerStance?: unknown;
  plannerClusters?: unknown;
  plannerOpenQuestions?: unknown;
  shortSummary?: unknown;
  topicCandidates?: unknown;
  clusterCandidates?: unknown;
  scopeCandidates?: unknown;
  stance?: unknown;
  openQuestions?: unknown;
  graphSearchTerms?: unknown;
  materialSignals?: unknown;
  recommendedLane?: unknown;
};

const BROAD_COMMUNAL_TOPIC_RULES = [
  { label: "Wohnen", pattern: /wohnraum|wohnen|miete|mieten|zweckentfremdung|wohnungsbau|neubau/i },
  { label: "Verkehr", pattern: /verkehr|bus|bahn|radweg|radwege|auto|mobilit[aä]t|schulweg/i },
  { label: "Klima", pattern: /klima|klimaziel|co2|emission|generation/i },
  { label: "Bildung", pattern: /schule|schulen|bildung|sprachf[oö]rderung|digitale ausstattung|basiskompetenz/i },
  { label: "Migration/Integration", pattern: /migration|integration|zuwander/i },
  { label: "Sicherheit/Rechtsstaat", pattern: /sicherheit|rechtsstaat|regeln|regelverst[oö][ßs]e?|missachtet|handlungsf[aä]hig/i },
  { label: "Gesundheit/Pflege", pattern: /gesundheit|pflege|pflegedienst/i },
  { label: "Kommunale Finanzen", pattern: /kommunale finanz|haushalt|haushalts|kosten|finanzierung/i },
  { label: "Bürgerbeteiligung", pattern: /b[uü]rgerbeteiligung|priorisieren|mitentscheiden|direkt priorisieren/i },
] as const;

const EXPLICIT_OFFICEHOLDER_PATTERNS = [
  /\bamtstr[aä]ger\b/i,
  /\bpolitiker\b/i,
  /\bmandatstr[aä]ger\b/i,
  /\bminister\b/i,
  /\babgeordnete?\b/i,
  /\bpolitische [aä]mter\b/i,
  /\bqualifikation f[üu]r amt\b/i,
  /\bsanktionen f[üu]r amtstr[aä]ger\b/i,
];

const ANIMAL_WELFARE_KEYWORDS = [
  /\btierschutz\b/i,
  /\btierhaltung\b/i,
  /\btierwohl\b/i,
  /\bhaltungsstufe\b/i,
  /\bbio[- ]?label\b/i,
  /\bfleisch\b/i,
  /\bgefl[üu]gel\b/i,
  /\bfisch\b/i,
  /\bagrar\b/i,
  /\bimport\b/i,
  /\bexport\b/i,
  /\beuropa\b/i,
  /\beu\b/i,
  /\bweltweit\b/i,
  /\binternational\b/i,
  /\bethisch\b/i,
  /\bmindeststandards?\b/i,
  /\bhaltungsstandards?\b/i,
];

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function isPlannerScope(value: string): value is CreatePlannerScope {
  return ["local", "district", "municipal", "state", "federal", "eu", "international", "unclear"].includes(value);
}

function isPlannerStance(value: string): value is CreatePlannerStance {
  return ["pro", "contra", "mixed", "open", "unclear"].includes(value);
}

function isRecommendedLane(value: string): value is CreatePlannerRecommendedLane {
  return ["standard", "create_fast_followup"].includes(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
}

function countPatternHits(text: string, patterns: readonly RegExp[]): number {
  return patterns.filter((pattern) => pattern.test(text)).length;
}

function detectBroadCommunalTopicFields(text: string): string[] {
  return BROAD_COMMUNAL_TOPIC_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label);
}

function isExplicitOfficeholderText(text: string): boolean {
  return EXPLICIT_OFFICEHOLDER_PATTERNS.some((pattern) => pattern.test(text));
}

function isAnimalWelfareText(text: string): boolean {
  return countPatternHits(text, ANIMAL_WELFARE_KEYWORDS) >= 4;
}

function inferScopesFromText(text: string): CreatePlannerScope[] {
  const scopes = new Set<CreatePlannerScope>();
  if (/lokal|nachbarschaft|kiez|viertel/i.test(text)) scopes.add("local");
  if (/bezirk/i.test(text)) scopes.add("district");
  if (/kommune|kommunal|stadt|gemeinde/i.test(text)) scopes.add("municipal");
  if (/landtag|landes/i.test(text)) scopes.add("state");
  if (/bund|bundes/i.test(text)) scopes.add("federal");
  if (/\beu\b|europa/i.test(text)) scopes.add("eu");
  if (/international|weltweit|global|import|export/i.test(text)) scopes.add("international");
  if (scopes.size === 0) scopes.add("unclear");
  return Array.from(scopes).slice(0, 4);
}

function baseProviderPlan(source: CreatePlannerSource, lane: CreatePlannerRecommendedLane): CreatePlannerProviderPlan {
  return {
    lane,
    plannerProvider: source === "openai" ? "openai" : null,
    plannerRole: "planner_only",
    structureProvider: "mistral",
    summaryProvider: "claude",
    researchUsed: "none",
    researchProvider: null,
    deepSearchUsed: false,
    graphMatch: "after_structure",
  };
}

function basePermissions(): CreatePlannerPermissions {
  return {
    nonMutative: true,
    canPublish: false,
    canSave: false,
    canMerge: false,
    canDeepSearch: false,
  };
}

function finalizePlannerResult(
  source: CreatePlannerSource,
  draft: Omit<CreatePlannerResult, "source" | "providerPlan" | "permissions">,
): CreatePlannerResult {
  const recommendedLane = draft.recommendedLane;
  return {
    ...draft,
    plannerScope: dedupeStrings(draft.plannerScope).filter(isPlannerScope),
    plannerClusters: dedupeStrings(draft.plannerClusters),
    plannerOpenQuestions: dedupeStrings(draft.plannerOpenQuestions),
    topicCandidates: dedupeStrings(draft.topicCandidates),
    clusterCandidates: dedupeStrings(draft.clusterCandidates),
    scopeCandidates: dedupeStrings(draft.scopeCandidates).filter(isPlannerScope),
    openQuestions: dedupeStrings(draft.openQuestions),
    graphSearchTerms: dedupeStrings(draft.graphSearchTerms),
    materialSignals: dedupeStrings(draft.materialSignals),
    source,
    providerPlan: baseProviderPlan(source, recommendedLane),
    permissions: basePermissions(),
  };
}

function buildAnimalWelfarePlanner(text: string, source: CreatePlannerSource): CreatePlannerResult {
  const scopes = inferScopesFromText(text);
  const openQuestions = [
    "Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?",
    "Sollten importierte und exportierte Tierprodukte nur zugelassen werden, wenn vergleichbare Tierwohlstandards eingehalten werden?",
    "Welche Zuständigkeit liegt bei EU, Bund oder internationalen Handelsregeln?",
  ];
  const clusters = [
    "Tierwohl und Haltungsstandards",
    "Import- und Exportregeln",
    "EU-/internationale Mindeststandards",
    "Verbraucherinformation / Kennzeichnung / Bio-Label / Haltungsstufen",
    "ethische Bewertung von Tierhaltung",
  ];
  const topic = "Tierschutz, Tierhaltung und Agrarstandards";
  const core = "Forderung nach besseren Tierschutz- und Tierhaltungsstandards";
  return finalizePlannerResult(source, {
    plannerTopic: topic,
    plannerCore: core,
    plannerScope: scopes.includes("federal") ? scopes : dedupeStrings([...scopes, "federal"]).filter(isPlannerScope),
    plannerStance: "pro",
    plannerClusters: clusters,
    plannerOpenQuestions: openQuestions,
    shortSummary:
      "Der Beitrag fordert strengere Tierwohl- und Tierhaltungsstandards für Fleisch, Geflügel und Fisch, auch entlang von Import-, Export- und EU-Regeln.",
    topicCandidates: [topic, "Tierwohl", "Import und Export", "Kennzeichnung", "Bio-Label", "Haltungsstufen", "Agrarstandards"],
    clusterCandidates: clusters,
    scopeCandidates: scopes.includes("federal") ? scopes : dedupeStrings([...scopes, "federal"]).filter(isPlannerScope),
    stance: "pro",
    openQuestions,
    graphSearchTerms: ["Tierwohl", "Tierhaltung", "Agrarstandards", "Import Export Tierprodukte", "EU Mindeststandards", "Bio-Label Haltungsstufen"],
    materialSignals: [],
    recommendedLane: "create_fast_followup",
  });
}

function buildOfficeholderPlanner(text: string, source: CreatePlannerSource): CreatePlannerResult {
  const scopes = inferScopesFromText(text);
  const topic = "Politische Ämter, Qualifikation und Verantwortung";
  const core = "Forderung nach klaren Qualifikations- und Verantwortungsregeln für politische Ämter";
  const openQuestions = [
    "Für welche Ämter sollen diese Regeln gelten?",
    "Welche Qualifikation, Kontrolle oder Sanktionen sind konkret gemeint?",
  ];
  const clusters = [
    "Qualifikation für politische Ämter",
    "Verantwortung und Transparenz",
    "Sanktionen bei Pflichtverletzungen",
  ];
  return finalizePlannerResult(source, {
    plannerTopic: topic,
    plannerCore: core,
    plannerScope: scopes,
    plannerStance: /dagegen|ablehnen|nicht/i.test(text) ? "contra" : "pro",
    plannerClusters: clusters,
    plannerOpenQuestions: openQuestions,
    shortSummary: "Der Beitrag zielt auf politische Ämter, Qualifikation und Konsequenzen bei Pflichtverletzungen.",
    topicCandidates: [topic, "Amtsträger", "Qualifikation", "Sanktionen"],
    clusterCandidates: clusters,
    scopeCandidates: scopes,
    stance: /dagegen|ablehnen|nicht/i.test(text) ? "contra" : "pro",
    openQuestions,
    graphSearchTerms: ["Amtsträger", "politische Ämter", "Qualifikation", "Sanktionen"],
    materialSignals: [],
    recommendedLane: "create_fast_followup",
  });
}

function buildBroadCommunalPlanner(text: string, source: CreatePlannerSource): CreatePlannerResult {
  const fields = detectBroadCommunalTopicFields(text);
  const topic = "Kommunale Prioritäten und Zielkonflikte";
  const core = "Mehrere kommunale Zielkonflikte priorisieren";
  const openQuestions = ["Welche Bereiche sollen zuerst bearbeitet werden – und wer ist zuständig?"];
  return finalizePlannerResult(source, {
    plannerTopic: topic,
    plannerCore: core,
    plannerScope: inferScopesFromText(text),
    plannerStance: "open",
    plannerClusters: fields.slice(0, 6),
    plannerOpenQuestions: openQuestions,
    shortSummary: `Der Beitrag bündelt mehrere kommunale Bedarfspunkte: ${fields.slice(0, 6).join(", ")}.`,
    topicCandidates: [topic, ...fields],
    clusterCandidates: fields,
    scopeCandidates: inferScopesFromText(text),
    stance: "open",
    openQuestions,
    graphSearchTerms: [topic, ...fields],
    materialSignals: [],
    recommendedLane: "create_fast_followup",
  });
}

function buildNeutralPlanner(text: string, source: CreatePlannerSource): CreatePlannerResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  const scopes = inferScopesFromText(text);
  const summary = normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
  const openQuestions = ["Was genau soll geklärt, verändert oder vorbereitet werden?"];
  return finalizePlannerResult(source, {
    plannerTopic: "Öffentliches Anliegen mit Klärungsbedarf",
    plannerCore: "Neues öffentliches Thema strukturieren",
    plannerScope: scopes,
    plannerStance: /dagegen|ablehnen|nicht sinnvoll/i.test(text) ? "contra" : /soll|muss|fordern|fordere|verlangen/i.test(text) ? "pro" : "open",
    plannerClusters: [],
    plannerOpenQuestions: openQuestions,
    shortSummary: summary || "Ein neues öffentliches Anliegen soll eingeordnet werden.",
    topicCandidates: ["Öffentliches Anliegen mit Klärungsbedarf"],
    clusterCandidates: [],
    scopeCandidates: scopes,
    stance: /dagegen|ablehnen|nicht sinnvoll/i.test(text) ? "contra" : /soll|muss|fordern|fordere|verlangen/i.test(text) ? "pro" : "open",
    openQuestions,
    graphSearchTerms: [],
    materialSignals: [],
    recommendedLane: "standard",
  });
}

function buildHeuristicPlanner(text: string): CreatePlannerResult {
  if (isAnimalWelfareText(text)) return buildAnimalWelfarePlanner(text, "heuristic_fallback");
  if (isExplicitOfficeholderText(text)) return buildOfficeholderPlanner(text, "heuristic_fallback");
  const communalFields = detectBroadCommunalTopicFields(text);
  if (communalFields.length >= 4) return buildBroadCommunalPlanner(text, "heuristic_fallback");
  return buildNeutralPlanner(text, "heuristic_fallback");
}

function normalizeOpenAiPlannerPayload(payload: OpenAiPlannerPayload, text: string): CreatePlannerResult | null {
  const plannerTopic = String(payload.plannerTopic ?? "").trim();
  const plannerCore = String(payload.plannerCore ?? "").trim();
  if (!plannerTopic || !plannerCore) return null;

  const plannerScope = asStringArray(payload.plannerScope).filter(isPlannerScope);
  const plannerStanceRaw = String(payload.plannerStance ?? payload.stance ?? "").trim().toLowerCase();
  const plannerStance = isPlannerStance(plannerStanceRaw) ? plannerStanceRaw : "open";
  const recommendedLaneRaw = String(payload.recommendedLane ?? "").trim().toLowerCase();
  const recommendedLane = isRecommendedLane(recommendedLaneRaw) ? recommendedLaneRaw : "create_fast_followup";
  const plannerClusters = asStringArray(payload.plannerClusters);
  const plannerOpenQuestions = dedupeStrings([...asStringArray(payload.plannerOpenQuestions), ...asStringArray(payload.openQuestions)]);
  const topicCandidates = dedupeStrings([plannerTopic, ...asStringArray(payload.topicCandidates)]);
  const clusterCandidates = dedupeStrings([...plannerClusters, ...asStringArray(payload.clusterCandidates)]);
  const scopeCandidates = dedupeStrings([...plannerScope, ...asStringArray(payload.scopeCandidates)]).filter(isPlannerScope);
  const graphSearchTerms = dedupeStrings([...asStringArray(payload.graphSearchTerms), plannerTopic, ...plannerClusters.slice(0, 3)]);
  const materialSignals = asStringArray(payload.materialSignals);
  const shortSummary = String(payload.shortSummary ?? "").trim() || plannerCore || text;

  return finalizePlannerResult("openai", {
    plannerTopic,
    plannerCore,
    plannerScope: plannerScope.length > 0 ? plannerScope : inferScopesFromText(text),
    plannerStance,
    plannerClusters,
    plannerOpenQuestions,
    shortSummary,
    topicCandidates,
    clusterCandidates,
    scopeCandidates: scopeCandidates.length > 0 ? scopeCandidates : inferScopesFromText(text),
    stance: plannerStance,
    openQuestions: plannerOpenQuestions,
    graphSearchTerms,
    materialSignals,
    recommendedLane,
  });
}

async function tryOpenAiPlanner(input: BuildCreatePlannerInput): Promise<CreatePlannerResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const system = [
    "Du bist planner_only für den ersten nicht-mutativen /create-Follow-up-Schritt in E150.",
    "Du darfst nur grob strukturieren und Provider/Lane empfehlen.",
    "Du darfst NICHT veröffentlichen, speichern, mergen, DeepSearch starten oder finale Faktenbehauptungen siegeln.",
    "Gib nur kompaktes JSON zurück.",
    "Bevorzuge konkrete Themen statt generischer Sammelbezeichnungen.",
  ].join("\n");
  const user = [
    "Analysiere den folgenden Beitrag als planner_only.",
    "Gib JSON mit diesen Feldern zurück:",
    "plannerTopic, plannerCore, plannerScope, plannerStance, plannerClusters, plannerOpenQuestions, shortSummary, topicCandidates, clusterCandidates, scopeCandidates, openQuestions, graphSearchTerms, materialSignals, recommendedLane.",
    "Regeln:",
    "- Keine mutativen Aktionen.",
    "- researchUsed bleibt none.",
    "- deepSearchUsed bleibt false.",
    "- empfohlenes Lane-Feld nur standard oder create_fast_followup.",
    "- Nutze Amtsträger/Qualifikation nur bei expliziten Hinweisen auf Amtsträger, Politiker, Mandatsträger, Minister, Abgeordnete oder politische Ämter.",
    "",
    `Locale: ${input.locale}`,
    "",
    "TEXT:",
    input.text,
  ].join("\n");

  try {
    const { text } = await callOpenAIJson({
      system,
      user,
      max_tokens: 1200,
    });
    const parsed = JSON.parse(text) as OpenAiPlannerPayload;
    return normalizeOpenAiPlannerPayload(parsed, input.text);
  } catch {
    return null;
  }
}

export async function buildCreatePlanner(input: BuildCreatePlannerInput): Promise<CreatePlannerResult> {
  const openAiPlanner = await tryOpenAiPlanner(input);
  if (openAiPlanner) return openAiPlanner;
  return buildHeuristicPlanner(input.text.trim());
}
