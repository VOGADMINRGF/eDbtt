import type { Dossier } from "@features/dossier";

type PresentationStream = { id: string; title: string; date: string };

type PresentationContribution = {
  id: string;
  title: string;
  date: string;
  streamId?: string;
};

type PresentationVoteOption = { id: string; label: string; type?: string; evidenceLevel?: EvidenceLevel };

type PresentationMajority = { id: string; pct: number };

type PresentationVoteHistory = { date: string; text: string };

type PresentationOption = {
  id: string;
  label: string;
  type?: string;
  touchesStatements?: string[];
  evidenceLevel?: EvidenceLevel;
};

type PresentationCluster = { label: string; count: number };

type PresentationTopic = {
  id?: string;
  label?: string;
  municipality?: string;
  windowDays?: number;
};

type PresentationHero = {
  impactLevel?: string;
  relevance?: string;
  budgetRange?: string;
  participation?: string;
};

type PresentationEmblem = {
  label?: string;
  subtitle?: string;
  asset?: string;
  initiative?: "volk" | "verwaltung" | "gemeinsam";
};

type EvidenceLevel = "none" | "linked" | "multi";

type PresentationRole =
  | "citizen"
  | "organization"
  | "administration"
  | "admin"
  | "staff"
  | "journalist"
  | "research";

type PresentationOrigin = {
  kind: "administration" | "community" | "association" | "media";
  label?: string;
  subtitle?: string;
  asset?: string;
  primary?: boolean;
};

type PresentationRecommendation = {
  allowedRoles?: PresentationRole[];
  teaser?: string;
  fullText?: string;
  ctaLabel?: string;
  ctaHint?: string;
};

type PresentationTraceability = {
  streamsToStatements?: Record<string, string[]>;
  contributionsToStatements?: Record<string, string[]>;
};

type PresentationOpenQuestion = {
  id: string;
  text: string;
  status?: "open" | "in_review" | "answered" | "closed" | "offen" | "in_pruefung" | "beantwortet" | "delegiert";
  responsible?: string;
  supportActors?: string[];
  lastUpdate?: string;
  resolution?: string;
  sourceNote?: string;
};

type PresentationPayload = {
  topic?: PresentationTopic;
  hero?: PresentationHero;
  emblem?: PresentationEmblem;
  origins?: PresentationOrigin[];
  viewerRole?: PresentationRole;
  recommendation?: PresentationRecommendation;
  sourceExcerpts?: Record<string, string>;
  inputs?: Record<string, unknown>;
  statementStats?: {
    total?: number;
    pro?: number;
    neutral?: number;
    contra?: number;
    clusters?: PresentationCluster[];
  };
  clusters?: PresentationCluster[];
  options?: PresentationOption[];
  vote?: {
    options?: PresentationVoteOption[];
    majorityDemo?: PresentationMajority[];
    totalVotes?: number;
    updatedAt?: string;
    history?: PresentationVoteHistory[];
  };
  traceability?: PresentationTraceability;
  openQuestions?: PresentationOpenQuestion[];
};

type PresentationNote = {
  id?: string;
  text?: string;
  kind?: string | null;
};

type PresentationResult = {
  presentation: PresentationPayload;
  streams: PresentationStream[];
  contributions: PresentationContribution[];
  voteOptions: PresentationVoteOption[];
  majorityDemo: PresentationMajority[];
  traceability: PresentationTraceability;
  openQuestions: PresentationOpenQuestion[];
};

function mergeUniqueById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

function normalizeStream(input: Record<string, unknown>): PresentationStream | null {
  const id = input.id as string | undefined;
  const title = (input.title as string | undefined) ?? (input.titel as string | undefined);
  const date = (input.date as string | undefined) ?? (input.datum as string | undefined);
  if (!id || !title || !date) return null;
  return { id, title, date };
}

function normalizeContribution(input: Record<string, unknown>): PresentationContribution | null {
  const id = input.id as string | undefined;
  const title = (input.title as string | undefined) ?? (input.titel as string | undefined);
  const date = (input.date as string | undefined) ?? (input.datum as string | undefined);
  const streamId = (input.streamId as string | undefined) ?? (input.stream_id as string | undefined);
  if (!id || !title || !date) return null;
  return { id, title, date, streamId };
}

export function getPresentation(dossier: Dossier): PresentationResult {
  const notes = (dossier.analyze.notes ?? []) as PresentationNote[];
  const result: PresentationPayload = {};
  const options: PresentationOption[] = [];
  const streams: PresentationStream[] = [];
  const contributions: PresentationContribution[] = [];
  const voteOptions: PresentationVoteOption[] = [];
  const majorityDemo: PresentationMajority[] = [];
  const traceability: PresentationTraceability = {};
  const openQuestions: PresentationOpenQuestion[] = [];

  for (const note of notes) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload & {
        topic?: PresentationTopic & { kommune?: string; zeitfensterTage?: number };
        inputs?: Record<string, unknown> & {
          beitraege?: Record<string, unknown>[];
          "beiträge"?: Record<string, unknown>[];
          contributions?: Record<string, unknown>[];
        };
      };

      if (parsed.topic) {
        result.topic = {
          ...result.topic,
          ...parsed.topic,
          municipality:
            parsed.topic.municipality ?? parsed.topic.kommune ?? result.topic?.municipality,
          windowDays:
            parsed.topic.windowDays ?? parsed.topic.zeitfensterTage ?? result.topic?.windowDays,
        };
      }

      if (parsed.hero) result.hero = { ...result.hero, ...parsed.hero };
      if (parsed.emblem) result.emblem = { ...result.emblem, ...parsed.emblem };
      if (Array.isArray(parsed.origins)) {
        result.origins = [...(result.origins ?? []), ...parsed.origins];
      }
      if (parsed.recommendation) {
        result.recommendation = { ...(result.recommendation ?? {}), ...parsed.recommendation };
      }
      if (parsed.sourceExcerpts) {
        result.sourceExcerpts = { ...(result.sourceExcerpts ?? {}), ...parsed.sourceExcerpts };
      }
      if (parsed.inputs) result.inputs = { ...(result.inputs ?? {}), ...parsed.inputs };
      if (parsed.statementStats) result.statementStats = parsed.statementStats;
      if (parsed.clusters) result.clusters = parsed.clusters;
      if (Array.isArray(parsed.options)) options.push(...parsed.options);
      if (parsed.vote) {
        result.vote = { ...(result.vote ?? {}), ...parsed.vote };
      }
      if (parsed.vote?.options) voteOptions.push(...parsed.vote.options);
      if (parsed.vote?.majorityDemo) majorityDemo.push(...parsed.vote.majorityDemo);
      if (parsed.traceability) {
        traceability.streamsToStatements = {
          ...(traceability.streamsToStatements ?? {}),
          ...(parsed.traceability.streamsToStatements ?? {}),
        };
        traceability.contributionsToStatements = {
          ...(traceability.contributionsToStatements ?? {}),
          ...(parsed.traceability.contributionsToStatements ?? {}),
        };
      }
      if (Array.isArray(parsed.openQuestions)) openQuestions.push(...parsed.openQuestions);

      const inputStreams = parsed.inputs?.streams;
      if (Array.isArray(inputStreams)) {
        for (const raw of inputStreams) {
          const normalized = normalizeStream(raw as Record<string, unknown>);
          if (normalized) streams.push(normalized);
        }
      }

      const inputContrib =
        parsed.inputs?.contributions ??
        parsed.inputs?.beitraege ??
        parsed.inputs?.["beiträge"] ??
        [];
      if (Array.isArray(inputContrib)) {
        for (const raw of inputContrib) {
          const normalized = normalizeContribution(raw as Record<string, unknown>);
          if (normalized) contributions.push(normalized);
        }
      }
    } catch {
      continue;
    }
  }

  const mergedOptions = mergeUniqueById(options);
  const mergedVoteOptions = mergeUniqueById(voteOptions);
  const mergedMajorityDemo = mergeUniqueById(majorityDemo);
  const mergedStreams = mergeUniqueById(streams);
  const mergedContributions = mergeUniqueById(contributions);

  const presentation: PresentationPayload = {
    ...result,
    options: mergedOptions.length ? mergedOptions : result.options,
    vote: {
      ...(result.vote ?? {}),
      options: mergedVoteOptions.length ? mergedVoteOptions : result.vote?.options,
      majorityDemo: mergedMajorityDemo.length ? mergedMajorityDemo : result.vote?.majorityDemo,
    },
  };

  return {
    presentation,
    streams: mergedStreams,
    contributions: mergedContributions,
    voteOptions: mergedVoteOptions,
    majorityDemo: mergedMajorityDemo,
    traceability,
    openQuestions,
  };
}

export type {
  PresentationStream,
  PresentationContribution,
  PresentationVoteOption,
  PresentationMajority,
  PresentationVoteHistory,
  PresentationOption,
  PresentationCluster,
  PresentationPayload,
  PresentationTraceability,
  PresentationHero,
  PresentationEmblem,
  PresentationOrigin,
  PresentationRole,
  PresentationRecommendation,
  PresentationOpenQuestion,
};
