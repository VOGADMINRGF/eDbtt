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

export type CreateUnderstandingResult = {
  summary: string;
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
  openQuestion?: string | null;
  confidence: FollowupConfidence;
};

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

  return {
    center,
    nodes,
    edges,
  };
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
    return {
      id: `section-${index + 1}`,
      label: `Abschnitt ${index + 1}`,
      sourceText: chunk,
      statementLabel: statement?.text,
      topicLabel: topic?.label,
      stanceLabel: statement?.stance,
      connectionLabel: suggestion?.title,
    };
  });
}
