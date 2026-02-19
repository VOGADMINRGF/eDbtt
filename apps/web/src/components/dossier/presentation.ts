import type { Dossier } from "@features/dossier";

type PresentationStream = { id: string; title: string; date: string };

type PresentationContribution = {
  id: string;
  title: string;
  date: string;
  streamId?: string;
};

type PresentationVoteOption = { id: string; label: string; type?: string };

type PresentationMajority = { id: string; pct: number };

type PresentationOption = {
  id: string;
  label: string;
  type?: string;
  touchesStatements?: string[];
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

type PresentationTraceability = {
  streamsToStatements?: Record<string, string[]>;
  contributionsToStatements?: Record<string, string[]>;
};

type PresentationPayload = {
  topic?: PresentationTopic;
  hero?: PresentationHero;
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
  };
  traceability?: PresentationTraceability;
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
      if (parsed.inputs) result.inputs = { ...(result.inputs ?? {}), ...parsed.inputs };
      if (parsed.statementStats) result.statementStats = parsed.statementStats;
      if (parsed.clusters) result.clusters = parsed.clusters;
      if (Array.isArray(parsed.options)) options.push(...parsed.options);
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
  };
}

export type {
  PresentationStream,
  PresentationContribution,
  PresentationVoteOption,
  PresentationMajority,
  PresentationOption,
  PresentationCluster,
  PresentationPayload,
  PresentationTraceability,
  PresentationHero,
};
