import { analyzeContribution } from "@features/analyze/analyzeContribution";
import type { AnalyzeResult } from "@features/analyze/schemas";
import type { CreateIntent } from "@/features/create/intentFlows";
import { buildCreateConnectionSuggestions } from "@/features/create/createConnectionSuggestions";
import { buildCreatePlanner, type CreatePlannerResult, type CreatePlannerScope, type CreatePlannerStance } from "@/features/create/createPlanner";
import type {
  CreateFollowupGraphMatchPlan,
  CreateIntelligentFollowupResult,
  CreateUnderstandingStatementKind,
  CreateUnderstandingResult,
  FollowupConfidence,
} from "@/features/create/intelligentFollowupContract";

type BuildCreateIntelligentFollowupInput = {
  text: string;
  locale: string;
  intent?: CreateIntent;
  userId?: string | null;
  anlassraumId?: string | null;
  dossierId?: string | null;
  maxSuggestions?: number;
};

const DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS = 2_800;

class CreateFollowupTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`create_followup_timeout_after_${timeoutMs}ms`);
    this.name = "CreateFollowupTimeoutError";
  }
}

function resolveFastFollowupTimeoutMs(): number {
  const raw = Number(process.env.CREATE_INTELLIGENT_FOLLOWUP_TIMEOUT_MS ?? DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_FAST_FOLLOWUP_TIMEOUT_MS;
  return Math.min(8_000, Math.max(800, Math.floor(raw)));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new CreateFollowupTimeoutError(timeoutMs)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeConfidence(score: number): FollowupConfidence {
  if (score >= 0.74) return "high";
  if (score >= 0.44) return "medium";
  return "low";
}

function mapStance(raw: AnalyzeResult["claims"][number]["stance"]): "pro" | "contra" | "mixed" | "open" | "unclear" {
  if (raw === "pro") return "pro";
  if (raw === "contra") return "contra";
  if (raw === "neutral") return "open";
  return "unclear";
}

function inferStatementKind(text: string, fallback?: string | null): CreateUnderstandingStatementKind {
  const normalized = text.toLowerCase();
  if (fallback === "question" || /\?/.test(text)) return "question";
  if (/https?:\/\/|www\./.test(normalized) || /quelle|bericht|dokument|studie/.test(normalized)) return "source";
  if (/soll|muss|fordern|fordere|verlangen/.test(normalized)) return "demand";
  if (/option|variante|alternativ|lösung|loesung/.test(normalized)) return "option";
  if (/widerspruch|dagegen|kritik|zweifel/.test(normalized)) return "objection";
  if (/hinweis|beobachtung|erfahrung/.test(normalized)) return "hint";
  if (/weil|daher|deshalb|darum/.test(normalized)) return "argument";
  return "claim";
}

function inferScopes(result: AnalyzeResult, sourceText: string): CreateUnderstandingResult["scopes"] {
  const values = new Set<CreateUnderstandingResult["scopes"][number]>();
  const joined = `${sourceText} ${result.claims.map((claim) => claim.responsibility ?? "").join(" ")}`.toLowerCase();
  if (/bezirk/.test(joined)) values.add("district");
  if (/kommune|kommunal|stadt|gemeinde/.test(joined)) values.add("municipal");
  if (/landtag|landes/.test(joined)) values.add("state");
  if (/bund|bundes/.test(joined)) values.add("federal");
  if (/\beu\b|europa/.test(joined)) values.add("eu");
  if (/international|weltweit|global|un/.test(joined)) values.add("international");
  if (/lokal|nachbarschaft|kiez|viertel/.test(joined)) values.add("local");
  if (values.size === 0) values.add("unclear");
  return Array.from(values).slice(0, 3);
}

function summarizeText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 280) return normalized;
  return `${normalized.slice(0, 277).trim()}...`;
}

type FallbackTopicRule = {
  label: string;
  pattern: RegExp;
};

const BROAD_COMMUNAL_TOPIC_RULES: readonly FallbackTopicRule[] = [
  { label: "Wohnen", pattern: /wohnraum|wohnen|miete|mieten|zweckentfremdung|wohnungsbau|neubau/ },
  { label: "Verkehr", pattern: /verkehr|bus|bahn|radweg|radwege|auto|mobilit[aä]t|schulweg/ },
  { label: "Klima", pattern: /klima|klimaziel|co2|emission|generation/ },
  { label: "Bildung", pattern: /schule|schulen|bildung|sprachf[oö]rderung|digitale ausstattung|basiskompetenz/ },
  { label: "Migration/Integration", pattern: /migration|integration|zuwander/ },
  { label: "Sicherheit/Rechtsstaat", pattern: /sicherheit|rechtsstaat|regeln|regelverst[oö][ßs]e?|missachtet|handlungsf[aä]hig/ },
  { label: "Gesundheit/Pflege", pattern: /gesundheit|pflege|pflegedienst/ },
  { label: "Kommunale Finanzen", pattern: /kommunale finanz|haushalt|haushalts|kosten|finanzierung/ },
  { label: "Bürgerbeteiligung", pattern: /b[uü]rgerbeteiligung|priorisieren|mitentscheiden|direkt priorisieren/ },
];

const LEGACY_OFFICE_TOPIC_RULES: readonly FallbackTopicRule[] = [
  { label: "Politische Verantwortung", pattern: /verantwort|pflicht/ },
  { label: "Amtsträger", pattern: /\bminister\b|\bpolitiker\b|\bmandatstr[aä]ger\b|\bamtstr[aä]ger\b|\babgeordnete?\b|\bpolitische [aä]mter\b/ },
  { label: "Qualifikation", pattern: /\bqualifikation f[üu]r amt\b|\bqualifikation\b|\bvorausbildung\b|\bkompetenz\b|\bmindestanforderung(?:en)?\b/ },
  { label: "Sanktionen", pattern: /\bsanktionen? f[üu]r amtstr[aä]ger\b|\bsanktion\b|\bstreichen\b|\bentzug\b|\bkonsequenz\b/ },
  { label: "Gesetzgebung", pattern: /gesetzesentwurf|gesetzgebung|gesetz/ },
  { label: "Abstimmungsoptionen", pattern: /option\s*[a-z]|option b|option c|vorschlag|abstimm/ },
  { label: "Themenagenda / Optionen", pattern: /agenda|themenagenda/ },
];

function isOfficeholderFocusedText(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    /\bamtstr[aä]ger\b/,
    /\bpolitiker\b/,
    /\bmandatstr[aä]ger\b/,
    /\bminister\b/,
    /\babgeordnete?\b/,
    /\bpolitische [aä]mter\b/,
    /\bqualifikation f[üu]r amt\b/,
    /\bsanktionen? f[üu]r amtstr[aä]ger\b/,
  ].some((rule) => rule.test(normalized));
}

function detectBroadCommunalTopicFields(text: string): string[] {
  const normalized = text.toLowerCase();
  const fields: string[] = [];
  for (const rule of BROAD_COMMUNAL_TOPIC_RULES) {
    if (!rule.pattern.test(normalized)) continue;
    if (fields.includes(rule.label)) continue;
    fields.push(rule.label);
  }
  return fields;
}

function inferDossierContextFromText(params: {
  text: string;
  topics: Array<{ label: string }>;
  statements: Array<{ text: string }>;
}): {
  dossierContext: string | null;
  topicFields: string[];
  useBroadContext: boolean;
  officeholderFocus: boolean;
} {
  const combined = `${params.text} ${params.topics.map((topic) => topic.label).join(" ")} ${params.statements
    .map((statement) => statement.text)
    .join(" ")}`;
  const topicFields = detectBroadCommunalTopicFields(combined);
  const officeholderFocus = isOfficeholderFocusedText(combined);
  const useBroadContext = topicFields.length >= 4 && !officeholderFocus;
  if (useBroadContext) {
    return {
      dossierContext: "Kommunale Prioritäten und Zielkonflikte",
      topicFields,
      useBroadContext: true,
      officeholderFocus: false,
    };
  }
  return {
    dossierContext: null,
    topicFields,
    useBroadContext: false,
    officeholderFocus,
  };
}

function buildPositionClusters(text: string): NonNullable<CreateUnderstandingResult["positionClusters"]> {
  const normalized = text.toLowerCase();
  const clusters: NonNullable<CreateUnderstandingResult["positionClusters"]> = [];
  const pushCluster = (id: string, label: CreateUnderstandingResult["positionClusters"][number]["label"], confidence: FollowupConfidence) => {
    if (clusters.some((item) => item.id === id)) return;
    clusters.push({ id, label, confidence });
  };
  if (/bezahlbar|chancen|ausgrenzung|entlast|schutz|pflege|sozial/.test(normalized)) {
    pushCluster("social-balance", "sozial/ausgleichend", "medium");
  }
  if (/regel|handlungsf[aä]hig|leistung|sprachf[oö]rderung|sanktion|rechtsstaat/.test(normalized)) {
    pushCluster("order-performance", "ordnungs-/leistungsorientiert", "medium");
  }
  if (/abw[aä]g|zust[aä]ndigkeit|kosten|mobilit[aä]t|klimaziel|priorit[aä]t/.test(normalized)) {
    pushCluster("pragmatic-balance", "pragmatisch/abwägend", "medium");
  }
  if (clusters.length === 0) {
    pushCluster("pragmatic-balance", "pragmatisch/abwägend", "low");
  }
  return clusters.slice(0, 3);
}

function buildFallbackTopics(normalizedText: string): Array<{ id: string; label: string; confidence: FollowupConfidence }> {
  const topics: Array<{ id: string; label: string; confidence: FollowupConfidence }> = [];
  const pushTopic = (label: string, confidence: FollowupConfidence = "medium") => {
    if (topics.some((topic) => topic.label === label)) return;
    topics.push({
      id: `topic-${topics.length + 1}`,
      label,
      confidence,
    });
  };
  const broadFields = detectBroadCommunalTopicFields(normalizedText);
  for (const field of broadFields) {
    pushTopic(field);
  }

  const officeholderFocus = isOfficeholderFocusedText(normalizedText);
  if (officeholderFocus) {
    for (const rule of LEGACY_OFFICE_TOPIC_RULES) {
      if (!rule.pattern.test(normalizedText)) continue;
      pushTopic(rule.label);
    }
  }

  if (broadFields.length >= 4 && !officeholderFocus) {
    topics.unshift({
      id: "topic-context-1",
      label: "Kommunale Prioritäten und Zielkonflikte",
      confidence: "high",
    });
  }
  if (officeholderFocus) {
    pushTopic("Politische Verantwortung");
  }
  if (topics.length === 0) {
    pushTopic("Öffentliches Anliegen", "low");
  }
  return topics;
}

function buildFallbackCategories(
  normalizedText: string,
  fallbackKind: CreateUnderstandingStatementKind,
): Array<{ id: string; label: string; confidence: FollowupConfidence }> {
  const categories: Array<{ id: string; label: string; confidence: FollowupConfidence }> = [];
  const pushIfMissing = (id: string, label: string, confidence: FollowupConfidence) => {
    if (categories.some((item) => item.id === id)) return;
    categories.push({ id, label, confidence });
  };

  if (/soll|muss|fordern|fordere|verlangen|mindestanforderung/.test(normalizedText)) {
    pushIfMissing("demand", "Forderung", "medium");
  }
  if (/kritik|zweifel|problem|fehlt|zu wenig|ungeeignet|widerspruch|wertung|verstö|verstoß|verstoe|verstoss/.test(normalizedText)) {
    pushIfMissing("objection", "Kritik", "medium");
  }
  if (/vorschlag|option|agenda|alternativ/.test(normalizedText)) {
    pushIfMissing("option", "Vorschlag", "medium");
  }

  if (categories.length > 0) return categories;
  if (fallbackKind === "demand") return [{ id: "demand", label: "Forderung", confidence: "low" }];
  if (fallbackKind === "objection") return [{ id: "objection", label: "Kritik", confidence: "low" }];
  if (fallbackKind === "option") return [{ id: "option", label: "Vorschlag", confidence: "low" }];
  if (fallbackKind === "question") return [{ id: "question", label: "Frage", confidence: "low" }];
  if (fallbackKind === "source") return [{ id: "source", label: "Quelle", confidence: "low" }];
  if (fallbackKind === "argument") return [{ id: "argument", label: "Argument", confidence: "low" }];
  return [{ id: "hint", label: "Hinweis", confidence: "low" }];
}

function buildFallbackSummary(
  normalizedText: string,
  normalizedLower: string,
  topics: Array<{ label: string }>,
): string {
  const dossierInference = inferDossierContextFromText({
    text: normalizedText,
    topics,
    statements: [{ text: normalizedText }],
  });
  if (dossierInference.useBroadContext) {
    const fieldText = dossierInference.topicFields.slice(0, 5).join(", ");
    return `Du beschreibst kommunale Prioritäten und Zielkonflikte mit Fokus auf ${fieldText}.`;
  }
  if (
    /minister|amtstr[aä]ger|gesetzesentwurf|gesetzgebung/.test(normalizedLower) &&
    (/qualifikation|mindestanforderung/.test(normalizedLower) || /sanktionen? f[üu]r amtstr[aä]ger/.test(normalizedLower) || /pflicht/.test(normalizedLower))
  ) {
    return "Du forderst klarere Mindestanforderungen und Konsequenzen für gewählte oder ernannte Amtsträger, insbesondere bei Ministerämtern und Gesetzgebung.";
  }
  if (topics.length > 0) {
    return `Du benennst Handlungsbedarf zu ${topics
      .slice(0, 3)
      .map((topic) => topic.label.toLowerCase())
      .join(", ")}.`;
  }
  return summarizeText(normalizedText);
}

function mapPlannerScope(scope: CreatePlannerScope): CreateUnderstandingResult["scopes"][number] {
  if (scope === "local") return "local";
  if (scope === "district") return "district";
  if (scope === "municipal") return "municipal";
  if (scope === "state") return "state";
  if (scope === "federal") return "federal";
  if (scope === "eu") return "eu";
  if (scope === "international") return "international";
  return "unclear";
}

function mapPlannerStanceToUnderstanding(stance: CreatePlannerStance): CreateUnderstandingResult["statements"][number]["stance"] {
  if (stance === "pro") return "pro";
  if (stance === "contra") return "contra";
  if (stance === "mixed") return "mixed";
  if (stance === "open") return "open";
  return "unclear";
}

function mergeUnderstandingTopics(params: {
  understanding: CreateUnderstandingResult;
  planner: CreatePlannerResult;
}): CreateUnderstandingResult["topics"] {
  const merged: CreateUnderstandingResult["topics"] = [];
  const seen = new Set<string>();
  const pushTopic = (label: string, confidence: FollowupConfidence = "high") => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      id: `topic-${merged.length + 1}`,
      label: trimmed,
      confidence,
    });
  };

  pushTopic(params.planner.plannerTopic, "high");
  params.planner.topicCandidates.forEach((topic) => pushTopic(topic, "high"));
  params.planner.plannerClusters.forEach((cluster) => pushTopic(cluster, "medium"));
  params.understanding.topics.forEach((topic) => pushTopic(topic.label, topic.confidence));
  return merged.slice(0, 12);
}

function mergeUnderstandingCategories(params: {
  understanding: CreateUnderstandingResult;
  planner: CreatePlannerResult;
  text: string;
}): CreateUnderstandingResult["categories"] {
  const kind = inferStatementKind(params.planner.plannerCore, /soll|muss|fordern|fordere|verlangen/.test(params.text) ? "demand" : null);
  const label =
    kind === "question"
      ? "Frage"
      : kind === "demand"
        ? "Forderung"
        : kind === "source"
          ? "Quelle"
          : kind === "option"
            ? "Option"
            : kind === "objection"
              ? "Widerspruch"
              : kind === "hint"
                ? "Hinweis"
                : kind === "argument"
                  ? "Argument"
                  : "Aussage";
  const merged = [{ id: kind, label, confidence: "high" as const }, ...params.understanding.categories];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = item.id.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function mergeUnderstandingStatements(params: {
  understanding: CreateUnderstandingResult;
  planner: CreatePlannerResult;
  text: string;
}): CreateUnderstandingResult["statements"] {
  const plannerStatement = {
    id: "planner-core",
    text: params.planner.plannerCore,
    kind: inferStatementKind(params.planner.plannerCore, /soll|muss|fordern|fordere|verlangen/.test(params.text) ? "demand" : null),
    stance: mapPlannerStanceToUnderstanding(params.planner.plannerStance),
    confidence: "high" as const,
  };
  const statements = [plannerStatement, ...params.understanding.statements];
  const seen = new Set<string>();
  return statements
    .filter((statement) => {
      const key = statement.text.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function mergeUnderstandingScopes(params: {
  understanding: CreateUnderstandingResult;
  planner: CreatePlannerResult;
}): CreateUnderstandingResult["scopes"] {
  const merged = [...params.planner.plannerScope.map(mapPlannerScope), ...params.understanding.scopes];
  const seen = new Set<CreateUnderstandingResult["scopes"][number]>();
  const scopes: CreateUnderstandingResult["scopes"] = [];
  for (const scope of merged) {
    if (seen.has(scope)) continue;
    seen.add(scope);
    scopes.push(scope);
  }
  return scopes.length > 0 ? scopes.slice(0, 4) : ["unclear"];
}

function applyPlannerToUnderstanding(params: {
  text: string;
  understanding: CreateUnderstandingResult;
  planner: CreatePlannerResult;
}): CreateUnderstandingResult {
  const mergedTopics = mergeUnderstandingTopics({ understanding: params.understanding, planner: params.planner });
  const mergedStatements = mergeUnderstandingStatements({
    understanding: params.understanding,
    planner: params.planner,
    text: params.text,
  });
  return {
    ...params.understanding,
    summary: params.planner.shortSummary || params.understanding.summary,
    dossierContext:
      params.planner.plannerTopic === "Kommunale Prioritäten und Zielkonflikte"
        ? params.planner.plannerTopic
        : params.understanding.dossierContext,
    topics: mergedTopics,
    statements: mergedStatements,
    categories: mergeUnderstandingCategories({
      understanding: params.understanding,
      planner: params.planner,
      text: params.text,
    }),
    scopes: mergeUnderstandingScopes({ understanding: params.understanding, planner: params.planner }),
    openQuestion: params.planner.plannerOpenQuestions[0] ?? params.planner.openQuestions[0] ?? params.understanding.openQuestion,
    confidence: params.understanding.confidence === "high" ? "high" : "medium",
  };
}

function buildGraphMatchPlan(planner: CreatePlannerResult): CreateFollowupGraphMatchPlan {
  const matches: CreateFollowupGraphMatchPlan["matches"] = planner.graphSearchTerms.slice(0, 5).map((term, index) => {
    const relation =
      index === 0
        ? planner.plannerTopic === "Öffentliches Anliegen mit Klärungsbedarf"
          ? "needs_review"
          : "new"
        : "related";
    return {
      id: `graph-match-${index + 1}`,
      kind: index === 0 ? "topic" : "claim",
      label: term,
      relation,
      requiresConfirmation: true,
    };
  });
  return {
    stage: "after_structure",
    prepared: planner.graphSearchTerms.length > 0,
    requiresConfirmation: true,
    searchTerms: planner.graphSearchTerms,
    matches,
    matchedTopics: [],
    matchedDossiers: [],
    matchedClaims: [],
    matchedAnlassraeume: [],
    matchedVotes: [],
    shouldCreateNewTopic: true,
  };
}

function mapAnalyzeResultToUnderstanding(text: string, result: AnalyzeResult): CreateUnderstandingResult {
  const statements = result.claims.slice(0, 6).map((claim, index) => {
    const statementText = claim.text?.trim() || `Aussage ${index + 1}`;
    const kind = inferStatementKind(statementText, claim.statementType ?? null);
    const confidenceScore =
      typeof claim.importance === "number" ? Math.min(1, Math.max(0.2, claim.importance / 5)) : 0.55;
    return {
      id: claim.id || `statement-${index + 1}`,
      text: statementText,
      kind,
      stance: mapStance(claim.stance),
      confidence: normalizeConfidence(confidenceScore),
      sourceExcerpt: kind === "source" ? statementText.slice(0, 180) : undefined,
    };
  });

  const topicsSeen = new Set<string>();
  const claimTopics = result.claims
    .flatMap((claim) => [claim.topic, claim.domain, ...(claim.domains ?? [])])
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      const key = value.toLowerCase();
      if (topicsSeen.has(key)) return false;
      topicsSeen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((label, index) => ({
      id: `topic-${index + 1}`,
      label,
      confidence: normalizeConfidence(0.6 - index * 0.06),
    }));
  const dossierInference = inferDossierContextFromText({
    text,
    topics: claimTopics,
    statements: statements.map((item) => ({ text: item.text })),
  });
  const mergedTopics: Array<{ id: string; label: string; confidence: FollowupConfidence }> = [];
  const seenTopicLabels = new Set<string>();
  const pushTopic = (label: string, confidence: FollowupConfidence) => {
    const key = label.toLowerCase();
    if (seenTopicLabels.has(key)) return;
    seenTopicLabels.add(key);
    mergedTopics.push({
      id: `topic-${mergedTopics.length + 1}`,
      label,
      confidence,
    });
  };
  if (dossierInference.dossierContext) {
    pushTopic(dossierInference.dossierContext, "high");
  }
  for (const field of dossierInference.topicFields) {
    pushTopic(field, dossierInference.useBroadContext ? "high" : "medium");
  }
  for (const topic of claimTopics) {
    pushTopic(topic.label, topic.confidence);
  }

  const categorySet = new Map<string, { label: string; weight: number }>();
  for (const statement of statements) {
    const weight = statement.confidence === "high" ? 0.9 : statement.confidence === "medium" ? 0.6 : 0.35;
    const categoryId = statement.kind;
    const label =
      categoryId === "question"
        ? "Frage"
        : categoryId === "demand"
          ? "Forderung"
          : categoryId === "source"
            ? "Quelle"
            : categoryId === "option"
              ? "Option"
              : categoryId === "objection"
                ? "Widerspruch"
                : categoryId === "hint"
                  ? "Hinweis"
                  : categoryId === "argument"
                    ? "Argument"
                    : "Aussage";
    const existing = categorySet.get(categoryId);
    if (!existing || weight > existing.weight) {
      categorySet.set(categoryId, { label, weight });
    }
  }
  if (categorySet.size === 0) {
    categorySet.set("hint", { label: "Hinweis", weight: 0.4 });
  }

  const categories = Array.from(categorySet.entries())
    .slice(0, 5)
    .map(([id, item]) => ({
      id,
      label: item.label,
      confidence: normalizeConfidence(item.weight),
    }));

  const openQuestion = result.questions[0]?.text?.trim() || null;
  const confidence = normalizeConfidence(
    Math.min(
      0.95,
      0.3 + statements.length * 0.08 + categories.length * 0.07 + (mergedTopics.length > 0 ? 0.1 : 0),
    ),
  );
  const summary = dossierInference.useBroadContext
    ? `Du beschreibst kommunale Prioritäten und Zielkonflikte. Im Fokus stehen ${dossierInference.topicFields
        .slice(0, 5)
        .join(", ")}.`
    : result.report?.summary?.trim() || summarizeText(text);

  return {
    summary,
    dossierContext: dossierInference.dossierContext ?? undefined,
    categories,
    topics:
      mergedTopics.length > 0
        ? mergedTopics.slice(0, 12)
        : [{ id: "topic-1", label: "Thema noch offen", confidence: "low" }],
    statements,
    scopes: inferScopes(result, text),
    positionClusters: buildPositionClusters(text),
    openQuestion,
    confidence,
  };
}

function buildFallbackUnderstanding(text: string): CreateUnderstandingResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  const normalizedLower = normalized.toLowerCase();
  const fallbackKind = inferStatementKind(normalized);
  const topics = buildFallbackTopics(normalizedLower);
  const categories = buildFallbackCategories(normalizedLower, fallbackKind);
  const inferredStance: "pro" | "contra" | "mixed" | "open" | "unclear" = /qualifikation f[üu]r amt|sanktionen? f[üu]r amtstr[aä]ger|soll|muss|fordern|fordere|verlangen/.test(
    normalizedLower,
  )
    ? "pro"
    : /dagegen|ablehnen|nicht sinnvoll/.test(normalizedLower)
      ? "contra"
      : "open";
  const scopes: CreateUnderstandingResult["scopes"] = [];
  if (/minister|gesetzesentwurf|gesetzgebung|bund|bundes/.test(normalizedLower)) scopes.push("federal");
  if (/bezirk/.test(normalizedLower)) scopes.push("district");
  if (/kommune|stadt|gemeinde/.test(normalizedLower)) scopes.push("municipal");
  if (/\beu\b|europa/.test(normalizedLower)) scopes.push("eu");
  if (/international|weltweit|global|import|export/.test(normalizedLower)) scopes.push("international");
  if (scopes.length === 0) scopes.push("unclear");

  return {
    summary: buildFallbackSummary(normalized, normalizedLower, topics),
    dossierContext: topics[0]?.label === "Kommunale Prioritäten und Zielkonflikte" ? topics[0].label : undefined,
    categories,
    topics,
    statements: [
      {
        id: "fallback-1",
        text: summarizeText(normalized),
        kind: fallbackKind,
        stance: inferredStance,
        confidence: "medium",
      },
    ],
    scopes,
    positionClusters: buildPositionClusters(normalized),
    openQuestion: null,
    confidence: "medium",
  };
}

export async function buildCreateIntelligentFollowup(
  input: BuildCreateIntelligentFollowupInput,
): Promise<CreateIntelligentFollowupResult> {
  const text = input.text.trim();
  const generatedAt = new Date().toISOString();
  const planner = await buildCreatePlanner({
    text,
    locale: input.locale,
  });
  const graphMatch = buildGraphMatchPlan(planner);
  try {
    const result = await withTimeout(
      analyzeContribution({
        text,
        locale: input.locale,
        analysisMode: "analyze",
        journeyHint: input.intent === "check" ? "media" : input.intent === "draft" ? "guided" : "analyze",
        maxClaims: 6,
      }),
      resolveFastFollowupTimeoutMs(),
    );
    const understanding = applyPlannerToUnderstanding({
      text,
      understanding: mapAnalyzeResultToUnderstanding(text, result as AnalyzeResult),
      planner,
    });
    const suggestions = buildCreateConnectionSuggestions({
      text,
      intent: input.intent,
      understanding,
      planner,
      anlassraumId: input.anlassraumId,
      dossierId: input.dossierId,
      maxSuggestions: input.maxSuggestions,
    });
    return {
      understanding,
      suggestions,
      sourceText: text,
      generatedAt,
      meta: {
        planner,
        graphMatch,
        researchUsed: "none",
        researchProvider: null,
        deepSearchUsed: false,
      },
      degraded: false,
      degradedReason: null,
    };
  } catch (error: unknown) {
    const understanding = applyPlannerToUnderstanding({
      text,
      understanding: buildFallbackUnderstanding(text),
      planner,
    });
    const suggestions = buildCreateConnectionSuggestions({
      text,
      intent: input.intent,
      understanding,
      planner,
      anlassraumId: input.anlassraumId,
      dossierId: input.dossierId,
      maxSuggestions: input.maxSuggestions,
    });
    return {
      understanding,
      suggestions,
      sourceText: text,
      generatedAt,
      meta: {
        planner,
        graphMatch,
        researchUsed: "none",
        researchProvider: null,
        deepSearchUsed: false,
      },
      degraded: true,
      degradedReason: error instanceof Error ? error.message : "fallback_used",
    };
  }
}
