import {
  resolvePart06CategoryLabels,
  type Part06CategoryKey,
} from "@/features/create/part06TopicMapping";
import type { CreatePlannerResult } from "@/features/create/createPlanner";

export type FollowupConfidence = "low" | "medium" | "high";

export type CreateUnderstandingStatementKind =
  | "question"
  | "claim"
  | "demand"
  | "argument"
  | "source"
  | "option"
  | "objection"
  | "hint";

/**
 * Normalized create follow-up model derived from the E150 intake/analyze
 * envelope. It may condense multiple upstream fields for `/create`, but it
 * must not become a second domain contract beside Part16.
 */
export type CreateUnderstandingResult = {
  summary: string;
  dossierContext?: string;
  categories: Array<{
    id: string;
    label: string;
    confidence: FollowupConfidence;
  }>;
  topics: Array<{
    id: string;
    label: string;
    confidence: FollowupConfidence;
  }>;
  statements: Array<{
    id: string;
    text: string;
    kind: CreateUnderstandingStatementKind;
    stance: "pro" | "contra" | "mixed" | "open" | "unclear";
    confidence: FollowupConfidence;
    sourceExcerpt?: string;
  }>;
  scopes: Array<"local" | "district" | "municipal" | "state" | "federal" | "eu" | "international" | "unclear">;
  positionClusters?: Array<{
    id: string;
    label: "sozial/ausgleichend" | "ordnungs-/leistungsorientiert" | "pragmatisch/abwägend";
    confidence: FollowupConfidence;
  }>;
  openQuestion?: string | null;
  confidence: FollowupConfidence;
};

/**
 * UI-facing Anschluss suggestions for `/create`.
 * They stay reviewable view models and must not auto-assign dossiers,
 * Anlassraeume or votes.
 */
export type CreateConnectionSuggestion = {
  id: string;
  kind: "dossier" | "anlassraum" | "vote" | "topic" | "new_anlassraum";
  title: string;
  reason: string;
  confidence: FollowupConfidence;
  href?: string;
  suggestedContributionKind?: string;
  suggestedStance?: "yes" | "no" | "abstain" | "open" | null;
  requiresConfirmation: true;
};

export type CreateGraphMatchRelation =
  | "same"
  | "related"
  | "opposing"
  | "duplicate_risk"
  | "new"
  | "needs_review";

export type CreateGraphMatchRecord = {
  id: string;
  kind: "topic" | "dossier" | "claim" | "anlassraum" | "vote";
  label: string;
  relation: CreateGraphMatchRelation;
  requiresConfirmation: true;
};

export type CreateFollowupGraphMatchPlan = {
  stage: "after_structure";
  prepared: boolean;
  requiresConfirmation: true;
  searchTerms: string[];
  matches: CreateGraphMatchRecord[];
  matchedTopics: string[];
  matchedDossiers: string[];
  matchedClaims: string[];
  matchedAnlassraeume: string[];
  matchedVotes: string[];
  shouldCreateNewTopic: boolean;
};

export type CreateGraphMatchResult = CreateFollowupGraphMatchPlan;

export type CreateIntelligentFollowupMeta = {
  planner: CreatePlannerResult;
  graphMatch: CreateFollowupGraphMatchPlan;
  researchUsed: "none";
  researchProvider: null;
  deepSearchUsed: false;
};

export type CreateIntelligentFollowupResult = {
  understanding: CreateUnderstandingResult;
  suggestions: CreateConnectionSuggestion[];
  sourceText: string;
  generatedAt: string;
  meta?: CreateIntelligentFollowupMeta;
  degraded?: boolean;
  degradedReason?: string | null;
};

export type CreateVisualNode = {
  id: string;
  kind:
    | "source_text"
    | "statement"
    | "topic"
    | "stance"
    | "scope"
    | "dossier"
    | "anlassraum"
    | "vote"
    | "new_anlassraum";
  label: string;
  detail?: string;
  confidence: FollowupConfidence;
};

export type CreateVisualEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type CreateVisualMap = {
  center: CreateVisualNode;
  nodes: CreateVisualNode[];
  edges: CreateVisualEdge[];
};

export type CreateVisualSection = {
  id: string;
  label: string;
  sourceText: string;
  statementLabel?: string;
  topicLabel?: string;
  stanceLabel?: string;
  connectionLabel?: string;
};

/**
 * UI-only ViewModel for the active-branch workspace in `/create`.
 * It derives from `topics`, statement-level claims/question signals and the
 * Part06 mirror. This is not a new domain taxonomy or orchestration contract.
 */
export type CreateStructureBranch = {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  topics: string[];
  topicTags: string[];
  evidenceSnippets: string[];
  subtopics: string[];
  sourceSection: string | null;
  confidence: FollowupConfidence;
  parentTopicId?: string | null;
  relatedTopicIds: string[];
  suggestedQuestions: string[];
  part06CategoryKeys: Part06CategoryKey[];
  part06CategoryLabels: string[];
  need: string;
  claims: string[];
  voteQuestions: string[];
  openReviewPoints: string[];
  positionClusters: string[];
  overflowTopics?: string[];
};

export type CreateFollowupDedupeResult = {
  prominentSummary: string;
  prominentCoreClaim: string;
  userBubbleText: string;
};

export function deriveDominantUnderstandingStance(
  understanding: CreateUnderstandingResult,
): "eher dafür" | "eher dagegen" | "offen/unklar" {
  let pro = 0;
  let contra = 0;
  let mixed = 0;
  for (const statement of understanding.statements) {
    if (statement.stance === "pro") pro += 1;
    if (statement.stance === "contra") contra += 1;
    if (statement.stance === "mixed") mixed += 1;
  }
  if (pro > contra && pro >= mixed) return "eher dafür";
  if (contra > pro && contra >= mixed) return "eher dagegen";
  return "offen/unklar";
}

function normalizeSuggestionNodeKind(
  kind: CreateConnectionSuggestion["kind"],
): CreateVisualNode["kind"] {
  if (kind === "dossier") return "dossier";
  if (kind === "anlassraum") return "anlassraum";
  if (kind === "vote") return "vote";
  if (kind === "topic") return "topic";
  return "new_anlassraum";
}

export function buildCreateVisualMap(result: CreateIntelligentFollowupResult): CreateVisualMap {
  const center: CreateVisualNode = {
    id: "source",
    kind: "source_text",
    label: "Dein Beitrag",
    detail: result.understanding.summary,
    confidence: result.understanding.confidence,
  };
  const nodes: CreateVisualNode[] = [];
  const edges: CreateVisualEdge[] = [];

  result.understanding.categories.slice(0, 3).forEach((category, index) => {
    const nodeId = `category-${index + 1}`;
    nodes.push({
      id: nodeId,
      kind: "statement",
      label: category.label,
      detail: "Kategorie",
      confidence: category.confidence,
    });
    edges.push({
      id: `edge-source-${nodeId}`,
      from: center.id,
      to: nodeId,
      label: "Kernsignal",
    });
  });

  result.understanding.statements.slice(0, 6).forEach((statement, index) => {
    const nodeId = `statement-${index + 1}`;
    nodes.push({
      id: nodeId,
      kind: "statement",
      label: statement.text,
      detail: statement.kind,
      confidence: statement.confidence,
    });
    edges.push({
      id: `edge-source-${nodeId}`,
      from: center.id,
      to: nodeId,
      label: "Aussage",
    });
  });

  result.understanding.topics.slice(0, 8).forEach((topic, index) => {
    const nodeId = `topic-${index + 1}`;
    nodes.push({
      id: nodeId,
      kind: "topic",
      label: topic.label,
      confidence: topic.confidence,
    });
    edges.push({
      id: `edge-source-${nodeId}`,
      from: center.id,
      to: nodeId,
      label: "Thema",
    });
  });

  const stanceNode: CreateVisualNode = {
    id: "stance",
    kind: "stance",
    label: deriveDominantUnderstandingStance(result.understanding),
    detail: "Vermutete Haltung",
    confidence: result.understanding.confidence,
  };
  nodes.push(stanceNode);
  edges.push({
    id: "edge-source-stance",
    from: center.id,
    to: stanceNode.id,
    label: "Haltung",
  });

  result.understanding.scopes.slice(0, 2).forEach((scope, index) => {
    const nodeId = `scope-${index + 1}`;
    nodes.push({
      id: nodeId,
      kind: "scope",
      label: scope,
      detail: "Ebene",
      confidence: result.understanding.confidence,
    });
    edges.push({
      id: `edge-source-${nodeId}`,
      from: center.id,
      to: nodeId,
      label: "Ebene",
    });
  });

  result.suggestions.slice(0, 4).forEach((suggestion, index) => {
    const nodeId = `suggestion-${index + 1}`;
    nodes.push({
      id: nodeId,
      kind: normalizeSuggestionNodeKind(suggestion.kind),
      label: suggestion.title,
      detail: suggestion.reason,
      confidence: suggestion.confidence,
    });
    edges.push({
      id: `edge-source-${nodeId}`,
      from: center.id,
      to: nodeId,
      label: "Anschluss",
    });
  });

  const hasDossier = nodes.some((node) => node.kind === "dossier");
  const hasNewAnlassraum = nodes.some((node) => node.kind === "new_anlassraum");
  if (!hasDossier) {
    const nodeId = "suggestion-fallback-dossier";
    nodes.push({
      id: nodeId,
      kind: "dossier",
      label: "Dossier",
      confidence: "medium",
    });
    edges.push({ id: `edge-source-${nodeId}`, from: center.id, to: nodeId, label: "Anschluss" });
  }
  if (!hasNewAnlassraum) {
    const nodeId = "suggestion-fallback-new-anlassraum";
    nodes.push({
      id: nodeId,
      kind: "new_anlassraum",
      label: "Neuer Anlassraum",
      confidence: "medium",
    });
    edges.push({ id: `edge-source-${nodeId}`, from: center.id, to: nodeId, label: "Anschluss" });
  }

  return {
    center,
    nodes,
    edges,
  };
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized) continue;
    const key = normalizeText(normalized);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function areSimilarText(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length < 18 || right.length < 18) return false;
  return left.includes(right) || right.includes(left);
}

export function dedupeCreateFollowupSections(params: {
  summary: string;
  coreClaim: string;
  sourceText: string;
  statementText?: string;
}): CreateFollowupDedupeResult {
  const summary = params.summary.trim();
  const coreClaim = params.coreClaim.trim();
  const statementText = String(params.statementText ?? "").trim();
  const sourceText = params.sourceText.trim().replace(/\s+/g, " ");

  let prominentSummary = summary || statementText || coreClaim || sourceText;
  let prominentCoreClaim = coreClaim || statementText || summary || sourceText;

  if (areSimilarText(prominentSummary, prominentCoreClaim)) {
    prominentCoreClaim = prominentSummary;
  }

  const bubbleSeed =
    statementText.length > 0 && !areSimilarText(statementText, prominentSummary)
      ? statementText
      : prominentSummary;

  return {
    prominentSummary,
    prominentCoreClaim,
    userBubbleText: bubbleSeed || sourceText,
  };
}

function resolveSectionThemeLabel(params: {
  sourceText: string;
  statementLabel?: string;
  topicLabel?: string;
  index: number;
}): string {
  const haystack = normalizeText(
    `${params.sourceText} ${params.statementLabel ?? ""} ${params.topicLabel ?? ""}`,
  );

  if (
    /(bus|oepnv|öpnv|s-bahn|sbahn|anschluss|pendler|pendlerinnen|beschaeftigte|beschäftigte|mobilit)/.test(
      haystack,
    ) &&
    /(hauptstra|hauptstrasse|hauptstraße|umbau|radweg|radverkehr|parkpla|parkplatz|parkraum|planung)/.test(
      haystack,
    )
  ) {
    if (/(s-bahn|sbahn|anschluss|pendler|beschaeftigte|beschäftigte)/.test(haystack)) {
      return "Pendler- und Anschlussmobilität";
    }
    if (/(parkpla|parkplatz|parkraum|planung)/.test(haystack)) {
      return "Parkraum und kommunale Planung";
    }
    if (/(hauptstra|hauptstrasse|hauptstraße|umbau|radweg|radverkehr)/.test(haystack)) {
      return "Straßenraum und Radverkehr";
    }
    return "ÖPNV und Mobilität";
  }

  if (
    /(kita|schule|schulweg|hauptstra|hauptstrasse|hauptstraße|querung|haltestelle|radfahrer|gehweg|gruenflaeche|grünfläche|haushalt)/.test(
      haystack,
    ) &&
    /(verkehr|auto|rad|querung|haltestelle|bauprojekt|gruen|grün|haushalt|finanz)/.test(haystack)
  ) {
    if (/(querung|hauptstra|hauptstrasse|hauptstraße|radfahrer|gehweg|haltestelle|verkehr|auto)/.test(haystack)) {
      return "Verkehrssicherheit";
    }
    if (/(kita|schule|schulweg)/.test(haystack)) return "Kita- und Schulwege";
    if (/(gruenflaeche|grünfläche|gruen|grün|bauprojekt)/.test(haystack)) {
      return "Stadtplanung und Grünflächen";
    }
    if (/(haushalt|finanz)/.test(haystack)) return "Kommunale Finanzierung";
  }

  if (/wohn|miete|genehmigung|bau|leerstand/.test(haystack)) return "Wohnen und Genehmigungen";
  if (/verkehr|mobilit|auto|rad|bus|bahn|klima/.test(haystack)) {
    return "Verkehr, Klima und Alltagstauglichkeit";
  }
  if (/bildung|schule|sprach|leistung|kita/.test(haystack)) {
    return "Schule und Bildung";
  }
  if (/integration|migration|sicherheit|rechtsstaat|verwaltung|zust[aä]ndigkeit/.test(haystack)) {
    return "Migration, Sicherheit und Verwaltung";
  }
  if (/gesundheit|pflege|versorgung/.test(haystack)) {
    return "Gesundheit, Pflege und kommunale Zuständigkeit";
  }
  if (/finanz|haushalt|beteiligung|kommune/.test(haystack)) {
    return "Finanzen, Beteiligung und Zuständigkeit";
  }
  if (/forderung|mindestanforder|soll|muss/.test(haystack)) return "Was du forderst";
  if (/option|vorschlag|alternative/.test(haystack)) return "Welche Lösung du vorschlägst";
  if (/frage|offen|unklar/.test(haystack)) return "Was noch offen ist";
  if (params.topicLabel?.trim()) return params.topicLabel.trim();
  if (params.statementLabel?.trim()) return params.statementLabel.trim().slice(0, 72);
  return `Schwerpunkt ${params.index + 1}`;
}

function dedupeSectionLabel(label: string, fallbackTopicLabel: string | undefined, usedLabels: Set<string>): string {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel) return label;
  if (!usedLabels.has(normalizedLabel)) {
    usedLabels.add(normalizedLabel);
    return label;
  }

  const topicLabel = String(fallbackTopicLabel ?? "").trim();
  if (topicLabel) {
    const topicNormalized = normalizeText(topicLabel);
    if (topicNormalized && !usedLabels.has(topicNormalized)) {
      usedLabels.add(topicNormalized);
      return topicLabel;
    }

    const combined = `${label} zu ${topicLabel}`;
    const combinedNormalized = normalizeText(combined);
    if (!usedLabels.has(combinedNormalized)) {
      usedLabels.add(combinedNormalized);
      return combined;
    }
  }

  let counter = 2;
  while (true) {
    const candidate = `${label} ${counter}`;
    const candidateNormalized = normalizeText(candidate);
    if (!usedLabels.has(candidateNormalized)) {
      usedLabels.add(candidateNormalized);
      return candidate;
    }
    counter += 1;
  }
}

function splitIntoSentenceGroups(text: string, maxSections: number): string[] {
  const normalized = text.trim().replace(/\r/g, "");
  if (!normalized) return [];
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const groups = paragraphs.length > 0 ? paragraphs : [normalized];
  const sections: string[] = [];

  for (const group of groups) {
    const sentences = group
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (sentences.length <= 2) {
      sections.push(group);
      continue;
    }
    for (let i = 0; i < sentences.length; i += 2) {
      sections.push(sentences.slice(i, i + 2).join(" "));
    }
  }

  if (sections.length <= maxSections) return sections;
  const trimmed = sections.slice(0, maxSections);
  const overflow = sections.slice(maxSections).join(" ");
  if (overflow.trim()) trimmed[maxSections - 1] = `${trimmed[maxSections - 1]} ${overflow}`.trim();
  return trimmed;
}

export function buildCreateVisualSections(
  result: CreateIntelligentFollowupResult,
  maxSections: number = 4,
): CreateVisualSection[] {
  const chunks = splitIntoSentenceGroups(result.sourceText, Math.max(1, maxSections));
  if (chunks.length === 0) return [];
  const usedLabels = new Set<string>();
  return chunks.map((chunk, index) => {
    const statement = result.understanding.statements[index] ?? result.understanding.statements[0];
    const topic = result.understanding.topics[index] ?? result.understanding.topics[0];
    const suggestion = result.suggestions[index] ?? result.suggestions[0];
    const label = dedupeSectionLabel(
      resolveSectionThemeLabel({
        sourceText: chunk,
        statementLabel: statement?.text,
        topicLabel: topic?.label,
        index,
      }),
      topic?.label,
      usedLabels,
    );
    const baseSection: CreateVisualSection = {
      id: `section-${index + 1}`,
      label,
      sourceText: chunk,
      statementLabel: statement?.text,
      topicLabel: topic?.label,
      stanceLabel: statement?.stance,
      connectionLabel: suggestion?.title,
    };
    return baseSection;
  });
}

type BranchDefinition = {
  id: string;
  title: string;
  topicPatterns: RegExp[];
  textPatterns: RegExp[];
  topicTagRules: Array<{ label: string; pattern: RegExp }>;
  defaultTopicTags: string[];
  part06CategoryKeys: Part06CategoryKey[];
  defaultNeed: string;
  defaultQuestion: string;
};

type PlannerBranchDefinition = {
  id: string;
  part06CategoryKeys: Part06CategoryKey[];
  defaultNeed: string;
  defaultQuestion: string;
  topicTags: string[];
};

type CivicPriorityPreviewBranch = {
  id: string;
  title: string;
  topicTags: string[];
  part06CategoryKeys: Part06CategoryKey[];
  need: string;
  voteQuestion: string;
  openReviewPoints: string[];
};

// Heuristische UI-Grouping-Regeln fuer den Follow-up-Workspace.
// Sie helfen nur beim Rendern lesbarer Strukturaste und sind kein kanonischer
// E150-Contract und keine zweite Claim-/Fragen-Taxonomie.
const STRUCTURE_BRANCH_DEFINITIONS: readonly BranchDefinition[] = [
  {
    id: "housing-permits",
    title: "Wohnen und Genehmigungen",
    topicPatterns: [/wohnen/i],
    textPatterns: [/wohn|miete|genehmigung|bau|leerstand|zweckentfremdung|auflagen|invest/i],
    topicTagRules: [
      { label: "Wohnen", pattern: /wohn|miete|wohnungsbau|leerstand/i },
      { label: "Genehmigungen", pattern: /genehmigung|auflagen/i },
      { label: "Stadtentwicklung", pattern: /bau|neubau|invest|zweckentfremdung/i },
    ],
    defaultTopicTags: ["Wohnen", "Genehmigungen", "Stadtentwicklung"],
    part06CategoryKeys: ["mobility_urban", "local_community"],
    defaultNeed: "Wohnungsbau, Zweckentfremdung, Auflagen und Investitionen müssen gemeinsam abgewogen werden.",
    defaultQuestion: "Soll kommunaler Wohnungsbau schneller genehmigt werden, auch wenn Auflagen vereinfacht werden?",
  },
  {
    id: "traffic-climate-daily-life",
    title: "Verkehr, Klima und Alltagstauglichkeit",
    topicPatterns: [/verkehr/i, /klima/i],
    textPatterns: [/verkehr|bus|bahn|radweg|auto|handwerker|pflege|familie|klima|mobilit/i],
    topicTagRules: [
      { label: "ÖPNV", pattern: /öpnv|bus|bahn/i },
      { label: "Radwege", pattern: /radweg|radwege|fahrrad/i },
      { label: "Auto", pattern: /auto|autonutzung|handwerker/i },
      { label: "Klimaziele", pattern: /klima|klimaziel|emission/i },
    ],
    defaultTopicTags: ["ÖPNV", "Radwege", "Auto", "Klimaziele"],
    part06CategoryKeys: ["mobility_urban", "climate_environment"],
    defaultNeed: "Verkehrswende, Klimaziele und notwendige Autonutzung treffen im Alltag aufeinander.",
    defaultQuestion: "Wie soll die Stadt zwischen Klimazielen und notwendiger Autonutzung abwägen?",
  },
  {
    id: "education-integration-safety",
    title: "Bildung, Integration und Sicherheit",
    topicPatterns: [/bildung/i, /migration|integration/i, /sicherheit|rechtsstaat/i],
    textPatterns: [/bildung|schule|digital|sprach|integration|migration|sicherheit|rechtsstaat|regelverst/i],
    topicTagRules: [
      { label: "Schule", pattern: /schule|schulen|bildung/i },
      { label: "Sprachförderung", pattern: /sprachf[oö]rderung|sprach/i },
      { label: "Integration", pattern: /integration|migration/i },
      { label: "Regelverstöße", pattern: /regelverst|rechtsstaat|sicherheit/i },
    ],
    defaultTopicTags: ["Schule", "Sprachförderung", "Integration", "Regelverstöße"],
    part06CategoryKeys: ["education_research", "migration_integration", "interior_security"],
    defaultNeed: "Bildung, Sprachförderung, Integration und Sicherheit brauchen nachvollziehbare Prioritäten.",
    defaultQuestion: "Soll Sprachförderung verbindlicher werden, ohne soziale Ausgrenzung zu verstärken?",
  },
  {
    id: "health-care",
    title: "Gesundheit und Pflege",
    topicPatterns: [/gesundheit|pflege/i],
    textPatterns: [/gesundheit|pflege|pflegedienst/i],
    topicTagRules: [
      { label: "Pflege", pattern: /pflege|pflegedienst/i },
      { label: "Gesundheitsversorgung", pattern: /gesundheit|arzt|versorgung/i },
    ],
    defaultTopicTags: ["Pflege", "Gesundheitsversorgung"],
    part06CategoryKeys: ["health_care"],
    defaultNeed: "Gesundheit und Pflege sind als weiterer Prüfpunkt berührt.",
    defaultQuestion: "Welche Pflege- und Gesundheitsmaßnahmen sind kurzfristig am dringendsten?",
  },
  {
    id: "finance-participation",
    title: "Finanzen und Beteiligung",
    topicPatterns: [/finanzen|beteiligung/i],
    textPatterns: [/kommunale finanz|haushalt|kosten|beteiligung|priorisieren|zust[aä]ndigkeit/i],
    topicTagRules: [
      { label: "Finanzen", pattern: /kommunale finanz|haushalt|kosten|finanzierung/i },
      { label: "Bürgerbeteiligung", pattern: /b[uü]rgerbeteiligung|beteiligung|mitentscheiden|priorisieren/i },
      { label: "Zuständigkeiten", pattern: /zust[aä]ndigkeit|kommune|verwaltung/i },
    ],
    defaultTopicTags: ["Finanzen", "Bürgerbeteiligung", "Zuständigkeiten"],
    part06CategoryKeys: ["budget_finance", "democracy_elections", "local_community"],
    defaultNeed: "Finanzierbarkeit, Zuständigkeit und Beteiligung müssen im weiteren Arbeitsstand geklärt werden.",
    defaultQuestion: "Welche Prioritäten sind unter den aktuellen kommunalen Finanzen tragfähig?",
  },
];

const PLANNER_BRANCH_DEFINITIONS: Readonly<Record<string, PlannerBranchDefinition>> = {
  gleichberechtigung: {
    id: "quota-equality",
    part06CategoryKeys: ["social_family", "justice_law", "democracy_elections"],
    defaultNeed: "Gleichberechtigung soll gestärkt werden, ohne neue Ungleichbehandlung zu erzeugen.",
    defaultQuestion: "Welche Form von Gleichberechtigung soll gestärkt werden, ohne starre Quotenlogik zu übernehmen?",
    topicTags: ["Gleichberechtigung", "Gleichstellung", "Fairness"],
  },
  frauenquote: {
    id: "quota-women",
    part06CategoryKeys: ["social_family", "justice_law", "work_economy"],
    defaultNeed: "Folgen und Fairness verbindlicher Frauenquoten sollen konkret geprüft werden.",
    defaultQuestion: "Geht es um gesetzliche Quoten, Unternehmensquoten oder Förderprogramme?",
    topicTags: ["Frauenquote", "Quotenregelungen", "Unternehmenspraxis"],
  },
  minderheitenförderung: {
    id: "quota-minorities",
    part06CategoryKeys: ["social_family", "migration_integration", "justice_law"],
    defaultNeed: "Vergleichbarkeit zwischen Frauenquote und Förderinstrumenten für andere Minderheiten braucht klare Kriterien.",
    defaultQuestion: "Welche Minderheiten oder Gruppen sollen verglichen werden?",
    topicTags: ["Minderheitenförderung", "Vergleich", "Antidiskriminierung"],
  },
  "wirtschaftliche auswirkungen für unternehmen": {
    id: "quota-business-impact",
    part06CategoryKeys: ["work_economy", "justice_law", "social_family"],
    defaultNeed: "Wirtschaftliche Folgen und Umsetzbarkeit für Unternehmen sollen nachvollziehbar geprüft werden.",
    defaultQuestion: "Welche wirtschaftlichen Folgen oder betrieblichen Zielkonflikte stehen im Vordergrund?",
    topicTags: ["Unternehmen", "Wirtschaft", "Umsetzbarkeit"],
  },
  "tierwohl und haltungsstandards": {
    id: "animal-welfare-standards",
    part06CategoryKeys: ["climate_environment", "work_economy", "local_community"],
    defaultNeed: "Tierwohl, Haltung und Mindeststandards sollen konkreter gefasst werden.",
    defaultQuestion: "Welche Tierwohl- und Haltungsstandards sollen verbindlich werden?",
    topicTags: ["Tierwohl", "Tierhaltung", "Mindeststandards"],
  },
  "import- und exportregeln": {
    id: "animal-trade-rules",
    part06CategoryKeys: ["europe_foreign", "work_economy", "justice_law"],
    defaultNeed: "Import- und Exportregeln sollen an vergleichbare Tierwohlstandards gekoppelt werden.",
    defaultQuestion: "Sollten importierte und exportierte Tierprodukte nur zugelassen werden, wenn vergleichbare Tierwohlstandards eingehalten werden?",
    topicTags: ["Import", "Export", "Lieferketten"],
  },
  "eu-/internationale mindeststandards": {
    id: "animal-eu-international-standards",
    part06CategoryKeys: ["europe_foreign", "justice_law", "climate_environment"],
    defaultNeed: "EU- und internationale Mindeststandards brauchen eine klarere Zuständigkeits- und Regelperspektive.",
    defaultQuestion: "Welche Standards sollen auf EU- oder internationaler Ebene vereinheitlicht werden?",
    topicTags: ["EU", "international", "Mindeststandards"],
  },
  "verbraucherinformation / kennzeichnung / bio-label / haltungsstufen": {
    id: "animal-labeling-consumer-info",
    part06CategoryKeys: ["work_economy", "justice_law", "local_community"],
    defaultNeed: "Kennzeichnung, Bio-Label und Haltungsstufen sollen Verbraucherinformation verständlicher machen.",
    defaultQuestion: "Welche Kennzeichnungs- und Kontrollpflichten sollen für Bio-Label und Haltungsstufen gelten?",
    topicTags: ["Kennzeichnung", "Bio-Label", "Haltungsstufen"],
  },
  "ethische bewertung von tierhaltung": {
    id: "animal-ethics",
    part06CategoryKeys: ["climate_environment", "social_family", "justice_law"],
    defaultNeed: "Die ethische Bewertung von Tierhaltung soll ausdrücklich mitgeführt werden.",
    defaultQuestion: "Welche ethischen Grenzen oder Leitprinzipien sollen für Tierhaltung gelten?",
    topicTags: ["Ethik", "Tierhaltung", "Bewertung"],
  },
};

const CIVIC_SMOKE_BRANCHES_FIVE: readonly CivicPriorityPreviewBranch[] = [
  {
    id: "traffic-safety",
    title: "Verkehrssicherheit",
    topicTags: ["Hauptstraße", "sichere Querung", "Radfahrer", "Haltestelle"],
    part06CategoryKeys: ["mobility_urban", "local_community"],
    need: "Zu schnelle Autos, unsichere Querungen und Konflikte zwischen Rad- und Fußverkehr brauchen eine klare Priorität.",
    voteQuestion: "Welche Sofortmaßnahme verbessert die Verkehrssicherheit an Hauptstraße und Haltestelle zuerst?",
    openReviewPoints: ["Querung sichern", "Tempo prüfen", "Rad- und Fußverkehr entflechten"],
  },
  {
    id: "school-routes",
    title: "Kita- und Schulwege",
    topicTags: ["Kita", "Schulweg", "Familien"],
    part06CategoryKeys: ["education_research", "mobility_urban", "local_community"],
    need: "Wege rund um Kita und Schule sollen für Kinder und Begleitpersonen sicherer und verlässlicher werden.",
    voteQuestion: "Welche Wege rund um Kita und Schule sollen zuerst gesichert werden?",
    openReviewPoints: ["Kita-Bezug klären", "Schulweg sichern", "Bring- und Holverkehr ordnen"],
  },
  {
    id: "accessibility",
    title: "Barrierefreiheit",
    topicTags: ["ältere Menschen", "Haltestelle", "Gehweg"],
    part06CategoryKeys: ["mobility_urban", "social_family", "local_community"],
    need: "Haltestellen, Gehwege und Querungen sollen auch für ältere Menschen und Menschen mit Einschränkungen nutzbar bleiben.",
    voteQuestion: "Welche Barrieren an Haltestelle und Gehweg sollen zuerst beseitigt werden?",
    openReviewPoints: ["Barrieren benennen", "Haltestelle prüfen", "Fußwege nutzbar halten"],
  },
  {
    id: "planning-green",
    title: "Stadtplanung und Grünflächen",
    topicTags: ["Bauprojekte", "Grünflächen", "Quartier"],
    part06CategoryKeys: ["local_community", "climate_environment", "mobility_urban"],
    need: "Bauprojekte und Grünflächen müssen so geplant werden, dass das Quartier nicht weiter an Aufenthaltsqualität verliert.",
    voteQuestion: "Wie sollen Bauprojekte und Grünflächen im Quartier gegeneinander abgewogen werden?",
    openReviewPoints: ["Bauprojekte sichtbar machen", "Grünflächen schützen", "Quartierswirkung prüfen"],
  },
  {
    id: "municipal-finance",
    title: "Kommunale Finanzierung",
    topicTags: ["Haushalt", "Prioritäten", "Finanzierung"],
    part06CategoryKeys: ["budget_finance", "local_community"],
    need: "Knappe Haushaltsmittel erzwingen eine klare Reihenfolge zwischen Sicherheit, Barrierefreiheit und Planung.",
    voteQuestion: "Welche Maßnahmen sind trotz knapper Haushaltsmittel zuerst finanzierbar?",
    openReviewPoints: ["Haushaltslage prüfen", "Prioritäten ordnen", "Finanzierung offenlegen"],
  },
] as const;

const CIVIC_SMOKE_BRANCHES_THREE: readonly CivicPriorityPreviewBranch[] = [
  {
    id: "traffic-safety",
    title: "Verkehrssicherheit",
    topicTags: ["Hauptstraße", "sichere Querung", "Radfahrer", "Haltestelle"],
    part06CategoryKeys: ["mobility_urban", "local_community"],
    need: "Zu schnelle Autos, unsichere Querungen und Konflikte zwischen Rad- und Fußverkehr bilden den naheliegenden ersten Schwerpunkt.",
    voteQuestion: "Welche Sofortmaßnahme verbessert die Verkehrssicherheit zuerst?",
    openReviewPoints: ["Querung sichern", "Tempo prüfen", "Rad- und Fußverkehr entflechten"],
  },
  {
    id: "school-routes-accessibility",
    title: "Kita-/Schulweg & Barrierefreiheit",
    topicTags: ["Kita", "Schulweg", "ältere Menschen", "Gehweg"],
    part06CategoryKeys: ["education_research", "mobility_urban", "social_family", "local_community"],
    need: "Kinder, Begleitpersonen und ältere Menschen brauchen sichere, barrierearme Wege zu Kita, Schule und Haltestelle.",
    voteQuestion: "Welche Wege zu Kita, Schule und Haltestelle sollen zuerst sicher und barrierearm werden?",
    openReviewPoints: ["Schulweg sichern", "Barrieren abbauen", "Haltestelle nutzbar halten"],
  },
  {
    id: "planning-finance",
    title: "Stadtplanung & Finanzierung",
    topicTags: ["Bauprojekte", "Grünflächen", "Haushalt"],
    part06CategoryKeys: ["local_community", "climate_environment", "budget_finance"],
    need: "Bauprojekte, Grünflächen und knappe Haushaltsmittel müssen als gemeinsamer Planungs- und Prioritätskonflikt bewertet werden.",
    voteQuestion: "Welche Bau- und Grünflächenmaßnahmen sind unter knappen Haushaltsmitteln zuerst tragfähig?",
    openReviewPoints: ["Bauprojekte prüfen", "Grünflächen schützen", "Finanzierung ordnen"],
  },
] as const;

const TRANSIT_STREET_PLANNING_BRANCHES_FOUR: readonly CivicPriorityPreviewBranch[] = [
  {
    id: "public-transit-mobility",
    title: "ÖPNV und Mobilität",
    topicTags: ["Bus", "ÖPNV", "Abendtakt", "Mobilität"],
    part06CategoryKeys: ["mobility_urban", "local_community"],
    need: "Bus-Takt, Verlässlichkeit und alltagstaugliche Mobilität bilden den ersten klaren Schwerpunkt.",
    voteQuestion: "Welche Verbesserung im ÖPNV soll zuerst angegangen werden?",
    openReviewPoints: ["Takt ausdünnung prüfen", "Betroffene Verbindungen benennen", "Erreichbarkeit am Abend klären"],
  },
  {
    id: "street-space-cycling",
    title: "Straßenraum und Radverkehr",
    topicTags: ["Hauptstraße", "Umbau", "Radwege", "Straßenraum"],
    part06CategoryKeys: ["mobility_urban", "local_community", "climate_environment"],
    need: "Der Umbau der Hauptstraße und die Frage nach sicheren Radwegen brauchen einen eigenen Planungsstrang.",
    voteQuestion: "Wie soll der Straßenraum beim Umbau der Hauptstraße priorisiert werden?",
    openReviewPoints: ["Radwege konkretisieren", "Umbauziele sichtbar machen", "Sicherheitsfolgen prüfen"],
  },
  {
    id: "parking-planning",
    title: "Parkraum und kommunale Planung",
    topicTags: ["Parkplätze", "Parkraum", "Umbau", "Planung"],
    part06CategoryKeys: ["local_community", "budget_finance", "mobility_urban"],
    need: "Parkplätze, Umbaufolgen und kommunale Abwägung zwischen Nutzungen müssen nachvollziehbar geplant werden.",
    voteQuestion: "Wie soll die Kommune Parkraum und Umbauziele gegeneinander abwägen?",
    openReviewPoints: ["Parkraumverlust prüfen", "Planungszuständigkeit klären", "Abwägung transparent machen"],
  },
  {
    id: "commuter-connections",
    title: "Pendler- und Anschlussmobilität",
    topicTags: ["S-Bahn", "Anschluss", "Pendler", "Beschäftigte"],
    part06CategoryKeys: ["mobility_urban", "work_economy", "local_community"],
    need: "Anschlüsse am Abend und die Pendelrealität von Beschäftigten bleiben als eigener Mobilitätsstrang erkennbar.",
    voteQuestion: "Wie sollen Anschlüsse für Pendlerinnen und Pendler am Abend verlässlicher werden?",
    openReviewPoints: ["S-Bahn-Anschluss prüfen", "Arbeitswege sichtbar machen", "Anschlussverluste belegen"],
  },
] as const;

const TRANSIT_STREET_PLANNING_BRANCHES_THREE: readonly CivicPriorityPreviewBranch[] = [
  TRANSIT_STREET_PLANNING_BRANCHES_FOUR[0],
  TRANSIT_STREET_PLANNING_BRANCHES_FOUR[1],
  TRANSIT_STREET_PLANNING_BRANCHES_FOUR[2],
] as const;

function matchesCivicStreetSafetySmoke(text: string): boolean {
  const haystack = normalizeText(text);
  return (
    /(kita|schule|schulweg)/.test(haystack) &&
    /(hauptstra|hauptstrasse|hauptstraße|verkehr|auto|radfahrer|gehweg|querung|haltestelle)/.test(haystack) &&
    /(bauprojekt|gruenflaeche|grünfläche|gruen|grün)/.test(haystack) &&
    /(haushalt|finanz|knapp)/.test(haystack)
  );
}

function matchesTransitStreetPlanningSmoke(text: string): boolean {
  const haystack = normalizeText(text);
  return (
    /(bus|oepnv|öpnv|s-bahn|sbahn|anschluss|pendler|pendlerinnen|beschaeftigte|beschäftigte|mobilit)/.test(
      haystack,
    ) &&
    /(hauptstra|hauptstrasse|hauptstraße|umbau|radweg|radverkehr|parkpla|parkplatz|parkraum|planung)/.test(
      haystack,
    )
  );
}

function buildCivicStreetSafetySmokeBranches(
  result: CreateIntelligentFollowupResult,
  maxBranches: number,
): CreateStructureBranch[] {
  const sourceText = normalizeText(result.sourceText);
  const positionClusters = selectPositionClusters(result.understanding);
  const definitions =
    maxBranches >= 5 ? CIVIC_SMOKE_BRANCHES_FIVE : CIVIC_SMOKE_BRANCHES_THREE;

  return definitions.slice(0, Math.max(1, maxBranches)).map((definition) => {
    const matchingTopics = result.understanding.topics
      .map((topic) => topic.label)
      .filter((label) => {
        const normalizedLabel = normalizeText(label);
        return (
          definition.topicTags.some((tag) => normalizedLabel.includes(normalizeText(tag))) ||
          (definition.title === "Verkehrssicherheit" && /verkehr/.test(normalizedLabel)) ||
          (definition.title.includes("Schulweg") && /(bildung|schule|kita)/.test(normalizedLabel)) ||
          (definition.title.includes("Finanz") && /finanz/.test(normalizedLabel))
        );
      });
    const topicTags = dedupeStrings([
      ...definition.topicTags.filter((tag) => sourceText.includes(normalizeText(tag))),
      ...definition.topicTags,
    ]).slice(0, 6);
    const claims = dedupeStrings([
      ...result.understanding.statements
        .map((statement) => statement.text)
        .filter((text) => {
          const normalized = normalizeText(text);
          return definition.topicTags.some((tag) => normalized.includes(normalizeText(tag)));
        }),
      definition.need,
    ]).slice(0, 2);

    return {
      id: definition.id,
      topicId: definition.id,
      title: definition.title,
      summary: buildBranchSummary({
        title: definition.title,
        need: definition.need,
        claims,
      }),
      topics: matchingTopics.length > 0 ? matchingTopics : [definition.title],
      topicTags,
      evidenceSnippets: claims,
      subtopics: buildBranchSubtopics({
        topicTags,
        openReviewPoints: [...definition.openReviewPoints],
        voteQuestions: [definition.voteQuestion],
      }),
      sourceSection: result.understanding.summary ?? null,
      confidence: result.understanding.confidence,
      parentTopicId: null,
      relatedTopicIds: result.understanding.topics
        .filter((topic) => matchingTopics.includes(topic.label))
        .map((topic) => topic.id),
      suggestedQuestions: [definition.voteQuestion],
      part06CategoryKeys: [...definition.part06CategoryKeys],
      part06CategoryLabels: resolvePart06CategoryLabels(definition.part06CategoryKeys),
      need: definition.need,
      claims,
      voteQuestions: [definition.voteQuestion],
      openReviewPoints: [...definition.openReviewPoints],
      positionClusters,
    };
  });
}

function buildTransitStreetPlanningBranches(
  result: CreateIntelligentFollowupResult,
  maxBranches: number,
): CreateStructureBranch[] {
  const sourceText = normalizeText(result.sourceText);
  const positionClusters = selectPositionClusters(result.understanding);
  const definitions =
    maxBranches >= 4 ? TRANSIT_STREET_PLANNING_BRANCHES_FOUR : TRANSIT_STREET_PLANNING_BRANCHES_THREE;

  return definitions.slice(0, Math.max(1, maxBranches)).map((definition) => {
    const topicTags = dedupeStrings([
      ...definition.topicTags.filter((tag) => sourceText.includes(normalizeText(tag))),
      ...definition.topicTags,
    ]).slice(0, 6);
    const claims = dedupeStrings([
      ...result.understanding.statements
        .map((statement) => statement.text)
        .filter((text) => {
          const normalized = normalizeText(text);
          return definition.topicTags.some((tag) => normalized.includes(normalizeText(tag)));
        }),
      definition.need,
    ]).slice(0, 2);
    return {
      id: definition.id,
      topicId: definition.id,
      title: definition.title,
      summary: buildBranchSummary({
        title: definition.title,
        need: definition.need,
        claims,
      }),
      topics: [definition.title],
      topicTags,
      evidenceSnippets: claims,
      subtopics: buildBranchSubtopics({
        topicTags,
        openReviewPoints: [...definition.openReviewPoints],
        voteQuestions: [definition.voteQuestion],
      }),
      sourceSection: result.understanding.summary ?? null,
      confidence: "high",
      parentTopicId: null,
      relatedTopicIds: result.understanding.topics.map((topic) => topic.id).slice(0, 4),
      suggestedQuestions: [definition.voteQuestion],
      part06CategoryKeys: [...definition.part06CategoryKeys],
      part06CategoryLabels: resolvePart06CategoryLabels(definition.part06CategoryKeys),
      need: definition.need,
      claims,
      voteQuestions: [definition.voteQuestion],
      openReviewPoints: [...definition.openReviewPoints],
      positionClusters,
    };
  });
}

function topicMatchesBranch(topic: string, branch: BranchDefinition): boolean {
  return branch.topicPatterns.some((pattern) => pattern.test(topic));
}

function textMatchesBranch(text: string, branch: BranchDefinition): boolean {
  return branch.textPatterns.some((pattern) => pattern.test(text));
}

function statementMatchesBranch(statement: CreateUnderstandingResult["statements"][number], branch: BranchDefinition): boolean {
  const combined = `${statement.text} ${statement.sourceExcerpt ?? ""}`;
  return textMatchesBranch(combined, branch);
}

function selectBranchTopics(
  topics: CreateUnderstandingResult["topics"],
  branch: BranchDefinition,
): string[] {
  return topics
    .map((topic) => topic.label)
    .filter((label) => topicMatchesBranch(label, branch))
    .filter((label, index, list) => list.indexOf(label) === index);
}

function selectBranchClaims(
  statements: CreateUnderstandingResult["statements"],
  branch: BranchDefinition,
): string[] {
  const claims = statements
    .filter((statement) => statementMatchesBranch(statement, branch))
    .map((statement) => statement.text)
    .filter((text, index, list) => text.trim().length > 0 && list.indexOf(text) === index)
    .slice(0, 2);
  return claims.length > 0 ? claims : [branch.defaultNeed];
}

function selectPositionClusters(
  understanding: CreateUnderstandingResult,
): string[] {
  return understanding.positionClusters?.map((cluster) => cluster.label).slice(0, 3) ?? [];
}

function selectBranchTopicTags(
  sourceText: string,
  topics: CreateUnderstandingResult["topics"],
  branch: BranchDefinition,
): string[] {
  const tags: string[] = [];
  const pushTag = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (!normalized || normalized === "Kommunale Prioritäten und Zielkonflikte" || tags.includes(normalized)) return;
    tags.push(normalized);
  };

  for (const topic of topics) {
    if (!topicMatchesBranch(topic.label, branch)) continue;
    pushTag(topic.label);
  }

  for (const rule of branch.topicTagRules) {
    if (rule.pattern.test(sourceText)) pushTag(rule.label);
  }

  for (const tag of branch.defaultTopicTags) {
    pushTag(tag);
  }

  return tags.slice(0, 6);
}

function collectUnassignedCreateTopics(params: {
  topics: CreateUnderstandingResult["topics"];
  visibleBranches: CreateStructureBranch[];
}): string[] {
  const assignedTopics = new Set(
    params.visibleBranches.flatMap((branch) => branch.topics).map((topic) => normalizeText(topic)),
  );
  const overflowTopics: string[] = [];

  for (const topic of params.topics) {
    const normalized = normalizeText(topic.label);
    if (!normalized || assignedTopics.has(normalized)) continue;
    if (overflowTopics.some((entry) => normalizeText(entry) === normalized)) continue;
    overflowTopics.push(topic.label);
  }

  return overflowTopics;
}

function buildBranchSummary(params: {
  title: string;
  need: string;
  claims: string[];
}): string {
  return params.claims[0] ?? params.need ?? `${params.title} bleibt sichtbar.`;
}

function buildBranchSubtopics(params: {
  topicTags: string[];
  openReviewPoints: string[];
  voteQuestions: string[];
}): string[] {
  return dedupeStrings([
    ...params.topicTags,
    ...params.openReviewPoints,
    ...params.voteQuestions,
  ]).slice(0, 8);
}

function buildPlannerStructureBranches(
  result: CreateIntelligentFollowupResult,
  maxBranches: number,
): CreateStructureBranch[] {
  const planner = result.meta?.planner;
  if (!planner || planner.plannerClusters.length === 0) return [];
  const positionClusters = selectPositionClusters(result.understanding);
  const topicLabels = result.understanding.topics.map((topic) => topic.label);
  const branchLimit = Math.max(1, maxBranches);

  return planner.plannerClusters.slice(0, branchLimit).map((cluster, index) => {
    const key = normalizeText(cluster);
    const definition = PLANNER_BRANCH_DEFINITIONS[key];
    const part06CategoryKeys = definition?.part06CategoryKeys ?? ["local_community"];
    const voteQuestion =
      definition?.defaultQuestion ??
      planner.plannerOpenQuestions[index] ??
      planner.openQuestions[index] ??
      "Welche Leitfrage soll zuerst geklärt werden?";
    const plannerClaim = index === 0 ? planner.plannerCore : planner.openQuestions[index - 1] ?? planner.plannerCore;
    const relatedTopics = dedupeStrings([
      cluster,
      planner.plannerTopic,
      ...topicLabels.filter((topic) => normalizeText(topic).includes(normalizeText(cluster).split(" ")[0] ?? "")),
    ]);
    const topicTags = dedupeStrings([...(definition?.topicTags ?? []), cluster, planner.plannerTopic]).slice(0, 6);
    const claims = dedupeStrings([plannerClaim, result.understanding.statements[index]?.text]).slice(0, 2);
    const openReviewPoints = dedupeStrings([
      planner.plannerOpenQuestions[index] ?? planner.openQuestions[index] ?? "",
      "Zuständigkeit klären",
      "Kontroll- und Umsetzungslogik prüfen",
    ]).slice(0, 3);

    return {
      id: definition?.id ?? `planner-branch-${index + 1}`,
      topicId: definition?.id ?? `planner-branch-${index + 1}`,
      title: cluster,
      summary: buildBranchSummary({
        title: cluster,
        need: definition?.defaultNeed ?? `${cluster} braucht eine konkretere Einordnung.`,
        claims,
      }),
      topics: relatedTopics.length > 0 ? relatedTopics : [cluster],
      topicTags,
      evidenceSnippets: claims,
      subtopics: buildBranchSubtopics({
        topicTags,
        openReviewPoints,
        voteQuestions: [voteQuestion],
      }),
      sourceSection: result.understanding.summary ?? null,
      confidence:
        result.understanding.topics[index]?.confidence ?? result.understanding.confidence,
      parentTopicId: null,
      relatedTopicIds: result.understanding.topics
        .filter((topic) => relatedTopics.includes(topic.label))
        .map((topic) => topic.id),
      suggestedQuestions: [voteQuestion],
      part06CategoryKeys,
      part06CategoryLabels: resolvePart06CategoryLabels(part06CategoryKeys),
      need: definition?.defaultNeed ?? `${cluster} braucht eine konkretere Einordnung.`,
      claims,
      voteQuestions: [voteQuestion],
      openReviewPoints,
      positionClusters,
    };
  });
}

export function buildCreateStructureBranches(
  result: CreateIntelligentFollowupResult,
  maxBranches: number = 3,
): CreateStructureBranch[] {
  if (matchesTransitStreetPlanningSmoke(result.sourceText)) {
    return buildTransitStreetPlanningBranches(result, maxBranches);
  }

  const plannerBranches = buildPlannerStructureBranches(result, maxBranches);
  if (plannerBranches.length > 0) {
    const overflowTopics = collectUnassignedCreateTopics({
      topics: result.understanding.topics,
      visibleBranches: plannerBranches,
    });
    if (overflowTopics.length > 0) {
      plannerBranches[plannerBranches.length - 1] = {
        ...plannerBranches[plannerBranches.length - 1],
        overflowTopics,
      };
    }
    return plannerBranches;
  }

  if (matchesCivicStreetSafetySmoke(result.sourceText)) {
    return buildCivicStreetSafetySmokeBranches(result, maxBranches);
  }

  const sourceText = normalizeText(result.sourceText);
  const positionClusters = selectPositionClusters(result.understanding);
  const branches: CreateStructureBranch[] = [];

  for (const definition of STRUCTURE_BRANCH_DEFINITIONS) {
    const matchedTopics = selectBranchTopics(result.understanding.topics, definition);
    const hasTextMatch = textMatchesBranch(sourceText, definition);
    if (matchedTopics.length === 0 && !hasTextMatch) continue;
    const topicTags = selectBranchTopicTags(sourceText, result.understanding.topics, definition);
    const claims = selectBranchClaims(result.understanding.statements, definition);

    branches.push({
      id: definition.id,
      topicId: definition.id,
      title: definition.title,
      summary: buildBranchSummary({
        title: definition.title,
        need: definition.defaultNeed,
        claims,
      }),
      topics: matchedTopics.length > 0 ? matchedTopics : [definition.title],
      topicTags,
      evidenceSnippets: claims,
      subtopics: buildBranchSubtopics({
        topicTags,
        openReviewPoints: [
          "Quellenlage prüfen",
          "Zuständigkeit klären",
          "Folgen und Zielkonflikte sauber abwägen",
        ],
        voteQuestions: [definition.defaultQuestion],
      }),
      sourceSection: result.understanding.summary ?? null,
      confidence:
        result.understanding.topics.find((topic) => matchedTopics.includes(topic.label))
          ?.confidence ?? result.understanding.confidence,
      parentTopicId: null,
      relatedTopicIds: result.understanding.topics
        .filter((topic) => matchedTopics.includes(topic.label))
        .map((topic) => topic.id),
      suggestedQuestions: [definition.defaultQuestion],
      part06CategoryKeys: [...definition.part06CategoryKeys],
      part06CategoryLabels: resolvePart06CategoryLabels(definition.part06CategoryKeys),
      need: definition.defaultNeed,
      claims,
      voteQuestions: [definition.defaultQuestion],
      openReviewPoints: ["Quellenlage prüfen", "Zuständigkeit klären", "Folgen und Zielkonflikte sauber abwägen"],
      positionClusters,
    });
  }

  if (branches.length === 0) return branches;

  const branchLimit = Math.max(1, maxBranches);
  const visibleBranches = branches.slice(0, branchLimit);
  const overflowTopics = collectUnassignedCreateTopics({
    topics: result.understanding.topics,
    visibleBranches,
  });
  if (overflowTopics.length > 0 && visibleBranches.length > 0) {
    visibleBranches[visibleBranches.length - 1] = {
      ...visibleBranches[visibleBranches.length - 1],
      overflowTopics,
    };
  }
  return visibleBranches;
}
