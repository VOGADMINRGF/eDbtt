import {
  resolvePart06CategoryLabels,
  type Part06CategoryKey,
} from "@/features/create/part06TopicMapping";

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

export type CreateIntelligentFollowupResult = {
  understanding: CreateUnderstandingResult;
  suggestions: CreateConnectionSuggestion[];
  sourceText: string;
  generatedAt: string;
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
  title: string;
  topics: string[];
  topicTags: string[];
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

  if (/wohn|miete|genehmigung|bau|leerstand/.test(haystack)) return "Wohnen und Genehmigungen";
  if (/verkehr|mobilit|auto|rad|bus|bahn|klima/.test(haystack)) {
    return "Verkehr, Klima und notwendige Autonutzung";
  }
  if (/bildung|schule|sprach|leistung|kita/.test(haystack)) {
    return "Bildung, Sprache und Leistungsdruck";
  }
  if (/integration|migration|sicherheit|rechtsstaat|zust[aä]ndigkeit/.test(haystack)) {
    return "Integration, Sicherheit und Zuständigkeiten";
  }
  if (/forderung|mindestanforder|soll|muss/.test(haystack)) return "Was du forderst";
  if (/option|vorschlag|alternative/.test(haystack)) return "Welche Lösung du vorschlägst";
  if (/frage|offen|unklar/.test(haystack)) return "Was noch offen ist";
  return `Teil ${params.index + 1}`;
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
  return chunks.map((chunk, index) => {
    const statement = result.understanding.statements[index] ?? result.understanding.statements[0];
    const topic = result.understanding.topics[index] ?? result.understanding.topics[0];
    const suggestion = result.suggestions[index] ?? result.suggestions[0];
    const baseSection: CreateVisualSection = {
      id: `section-${index + 1}`,
      label: resolveSectionThemeLabel({
        sourceText: chunk,
        statementLabel: statement?.text,
        topicLabel: topic?.label,
        index,
      }),
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

export function buildCreateStructureBranches(
  result: CreateIntelligentFollowupResult,
  maxBranches: number = 3,
): CreateStructureBranch[] {
  const sourceText = normalizeText(result.sourceText);
  const positionClusters = selectPositionClusters(result.understanding);
  const branches: CreateStructureBranch[] = [];

  for (const definition of STRUCTURE_BRANCH_DEFINITIONS) {
    const matchedTopics = selectBranchTopics(result.understanding.topics, definition);
    const hasTextMatch = textMatchesBranch(sourceText, definition);
    if (matchedTopics.length === 0 && !hasTextMatch) continue;

    branches.push({
      id: definition.id,
      title: definition.title,
      topics: matchedTopics.length > 0 ? matchedTopics : [definition.title],
      topicTags: selectBranchTopicTags(sourceText, result.understanding.topics, definition),
      part06CategoryKeys: [...definition.part06CategoryKeys],
      part06CategoryLabels: resolvePart06CategoryLabels(definition.part06CategoryKeys),
      need: definition.defaultNeed,
      claims: selectBranchClaims(result.understanding.statements, definition),
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
