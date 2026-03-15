import crypto from "crypto";
import { RoundAssistOutputSchema, type AssistSuggestionOutput } from "./assistSchemas";
import type {
  RoundAssistRun,
  RoundAssistRunSnapshot,
  RoundAssistReviewDecision,
  RoundAssistSuggestion,
  RoundAssistSuggestionKind,
  TopicMergeReviewState,
} from "./assistTypes";
import { getRoundBySlug, getTopicBySlug } from "./repository";

type InternalRunRecord = RoundAssistRun & {
  suggestions: RoundAssistSuggestion[];
};

type AssistStore = {
  runsById: Map<string, InternalRunRecord>;
  latestRunIdByRoundSlug: Map<string, string>;
};

function getStore(): AssistStore {
  const key = "__topic_round_assist_store__";
  const root = globalThis as Record<string, unknown>;
  if (!root[key]) {
    root[key] = {
      runsById: new Map<string, InternalRunRecord>(),
      latestRunIdByRoundSlug: new Map<string, string>(),
    } satisfies AssistStore;
  }
  return root[key] as AssistStore;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function mapOutputToSuggestions(args: {
  runId: string;
  roundSlug: string;
  topicSlug: string;
  kind: RoundAssistSuggestionKind;
  items: AssistSuggestionOutput[];
}): RoundAssistSuggestion[] {
  const timestamp = nowIso();
  return args.items.map((item) => ({
    suggestionId: makeId("ras"),
    runId: args.runId,
    roundSlug: args.roundSlug,
    topicSlug: args.topicSlug,
    kind: args.kind,
    title: item.title,
    text: item.text,
    confidence: item.confidence,
    status: "pending",
    targetHint: item.targetHint,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function buildMockAssistOutput(roundSlug: string) {
  const round = getRoundBySlug(roundSlug);
  if (!round) return null;
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) return null;

  const firstQuestion = round.openPoints[0] ?? topic.openQuestions[0] ?? "Welche Evidenz fehlt priorisiert?";
  const firstContribution = round.contributions[0]?.text ?? topic.claims[0]?.text ?? "Keine Primärbeiträge vorhanden.";
  const firstClaim = topic.claims[0]?.text ?? "Claim fehlt";
  const firstSource = topic.sources[0];
  const firstOption = topic.options[0];
  const firstRoadmap = topic.roadmap[0];

  return {
    suggestedClaims: [
      {
        title: "Round-Beobachtung als Claim-Entwurf",
        text: `Aus der Runde '${round.title}' ergibt sich als Arbeitsclaim: ${firstContribution}`,
        confidence: "medium",
        targetHint: "topic.claims",
      },
    ],
    suggestedQuestions: [
      {
        title: "Nachfrage fuer naechste Runde",
        text: firstQuestion,
        confidence: "high",
        targetHint: "topic.openQuestions",
      },
    ],
    suggestedSourceLinks: firstSource
      ? [
          {
            title: `Quelle verknuepfen: ${firstSource.publisher}`,
            text: `${firstSource.title} (${firstSource.url}) sollte mit Runde '${round.title}' verknuepft werden.`,
            confidence: "medium",
            targetHint: "topic.sources",
          },
        ]
      : [],
    suggestedOptionRefinements: firstOption
      ? [
          {
            title: `Option praezisieren: ${firstOption.title}`,
            text: `Die Option sollte mit Messkriterium aus '${round.title}' verknuepft werden: ${firstQuestion}`,
            confidence: "medium",
            targetHint: "topic.options",
          },
        ]
      : [],
    suggestedRoadmapItems: firstRoadmap
      ? [
          {
            title: `Roadmap-Follow-up zu '${firstRoadmap.title}'`,
            text: `Round-Follow-up: ${round.openPoints[0] ?? "Offenen Punkt konsolidieren und Verantwortliche benennen."}`,
            confidence: "high",
            targetHint: "topic.roadmap",
          },
        ]
      : [],
    duplicateAndClusterHints: [
      {
        title: "Cluster-Hinweis",
        text: `Pruefen, ob neuer Claim-Entwurf inhaltlich mit bestehendem Claim ueberschneidet: '${firstClaim.slice(0, 140)}'`,
        confidence: "low",
        targetHint: "topic.claims",
      },
    ],
    personaSummaries: [
      {
        title: "Kurzfazit Journalismus",
        text: "Wichtigster offener Konflikt: Kostenannahmen vs. Umsetzungstempo.",
        confidence: "medium",
        targetHint: "round.summary",
      },
      {
        title: "Kurzfazit Verwaltung",
        text: "Naechster Schritt: Zustaendigkeitsantwort fuer offene Roadmap-Punkte festlegen.",
        confidence: "medium",
        targetHint: "topic.roadmap",
      },
      {
        title: "Kurzfazit Buerger",
        text: "Beteiligungsfokus: Quelle + Frage einreichen, um den Vote-Check vorzubereiten.",
        confidence: "medium",
        targetHint: "create.entry",
      },
    ],
  };
}

function toReviewState(runId: string, suggestions: RoundAssistSuggestion[]): TopicMergeReviewState {
  const counts = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    deferred: 0,
    edited: 0,
    linked: 0,
    duplicate: 0,
  };
  let last = nowIso();

  for (const suggestion of suggestions) {
    counts[suggestion.status] += 1;
    if (suggestion.updatedAt > last) last = suggestion.updatedAt;
  }

  const applied = counts.accepted + counts.edited + counts.linked + counts.duplicate;
  return {
    runId,
    total: suggestions.length,
    ...counts,
    canApplyToTopic: applied > 0,
    reviewCompleted: counts.pending === 0,
    updatedAt: last,
  };
}

function toSnapshot(run: InternalRunRecord): RoundAssistRunSnapshot {
  return {
    run: {
      runId: run.runId,
      roundSlug: run.roundSlug,
      topicSlug: run.topicSlug,
      status: run.status,
      provider: run.provider,
      model: run.model,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      error: run.error,
      outputJson: run.outputJson,
      suggestionsCount: run.suggestions.length,
    },
    suggestions: [...run.suggestions],
    reviewState: toReviewState(run.runId, run.suggestions),
  };
}

export function getLatestRoundAssistSnapshot(roundSlug: string): RoundAssistRunSnapshot | null {
  const store = getStore();
  const runId = store.latestRunIdByRoundSlug.get(roundSlug);
  if (!runId) return null;
  const run = store.runsById.get(runId);
  if (!run) return null;
  return toSnapshot(run);
}

export function getRoundAssistSnapshot(runId: string): RoundAssistRunSnapshot | null {
  const run = getStore().runsById.get(runId);
  if (!run) return null;
  return toSnapshot(run);
}

export function triggerRoundAssistRun(args: {
  roundSlug: string;
  provider?: string;
  model?: string;
}): RoundAssistRunSnapshot {
  const round = getRoundBySlug(args.roundSlug);
  if (!round) {
    throw new Error("round_not_found");
  }
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) {
    throw new Error("topic_not_found");
  }

  const store = getStore();
  const runId = makeId("rar");
  const startedAt = nowIso();
  const run: InternalRunRecord = {
    runId,
    roundSlug: round.slug,
    topicSlug: topic.slug,
    status: "running",
    provider: args.provider ?? "assistive_mock",
    model: args.model ?? "structured_v1",
    startedAt,
    suggestionsCount: 0,
    suggestions: [],
  };
  store.runsById.set(runId, run);
  store.latestRunIdByRoundSlug.set(round.slug, runId);

  const outputCandidate = buildMockAssistOutput(round.slug);
  if (!outputCandidate) {
    run.status = "failed";
    run.finishedAt = nowIso();
    run.error = "round_or_topic_missing";
    return toSnapshot(run);
  }

  const parsed = RoundAssistOutputSchema.safeParse(outputCandidate);
  if (!parsed.success) {
    run.status = "failed";
    run.finishedAt = nowIso();
    run.error = "schema_validation_failed";
    return toSnapshot(run);
  }

  const output = parsed.data;
  run.outputJson = output;
  run.suggestions = [
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "suggestedClaims",
      items: output.suggestedClaims,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "suggestedQuestions",
      items: output.suggestedQuestions,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "suggestedSourceLinks",
      items: output.suggestedSourceLinks,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "suggestedOptionRefinements",
      items: output.suggestedOptionRefinements,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "suggestedRoadmapItems",
      items: output.suggestedRoadmapItems,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "duplicateAndClusterHints",
      items: output.duplicateAndClusterHints,
    }),
    ...mapOutputToSuggestions({
      runId,
      roundSlug: round.slug,
      topicSlug: topic.slug,
      kind: "personaSummaries",
      items: output.personaSummaries,
    }),
  ];
  run.suggestionsCount = run.suggestions.length;
  run.status = "completed";
  run.finishedAt = nowIso();
  return toSnapshot(run);
}

export function reviewRoundAssistSuggestion(args: {
  roundSlug: string;
  runId: string;
  suggestionId: string;
  decision: RoundAssistReviewDecision;
  editedText?: string;
  linkedEntityId?: string;
  reviewNote?: string;
}): RoundAssistRunSnapshot {
  const run = getStore().runsById.get(args.runId);
  if (!run || run.roundSlug !== args.roundSlug) {
    throw new Error("run_not_found");
  }

  const index = run.suggestions.findIndex((item) => item.suggestionId === args.suggestionId);
  if (index < 0) {
    throw new Error("suggestion_not_found");
  }

  const now = nowIso();
  const current = run.suggestions[index];
  const next: RoundAssistSuggestion = {
    ...current,
    updatedAt: now,
    reviewNote: args.reviewNote ?? current.reviewNote,
  };

  if (args.decision === "accept") {
    next.status = "accepted";
    next.appliedEntityId = next.appliedEntityId ?? `${next.topicSlug}:accepted:${next.suggestionId}`;
  } else if (args.decision === "reject") {
    next.status = "rejected";
  } else if (args.decision === "defer") {
    next.status = "deferred";
  } else if (args.decision === "edit_accept") {
    if (!args.editedText) throw new Error("edited_text_required");
    next.status = "edited";
    next.editedText = args.editedText;
    next.appliedEntityId = `${next.topicSlug}:edited:${next.suggestionId}`;
  } else if (args.decision === "link_existing") {
    if (!args.linkedEntityId) throw new Error("linked_entity_required");
    next.status = "linked";
    next.linkedEntityId = args.linkedEntityId;
    next.appliedEntityId = args.linkedEntityId;
  } else if (args.decision === "mark_duplicate") {
    next.status = "duplicate";
    if (args.linkedEntityId) {
      next.linkedEntityId = args.linkedEntityId;
      next.appliedEntityId = args.linkedEntityId;
    }
  }

  run.suggestions[index] = next;
  return toSnapshot(run);
}
