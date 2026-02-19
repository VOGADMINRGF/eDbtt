import type { Dossier } from "@features/dossier";

type PresentationStream = { id: string; title: string; date: string };

type PresentationContribution = {
  id: string;
  title: string;
  date: string;
  streamId?: string;
};

type PresentationVoteOption = { id: string; label: string };

type PresentationMajority = { id: string; pct: number };

type PresentationOption = {
  id: string;
  label: string;
  type?: string;
  touchesStatements?: string[];
};

type PresentationCluster = { label: string; count: number };

type PresentationPayload = {
  topic?: { id?: string; label?: string; municipality?: string; windowDays?: number };
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
};

function mergeUniqueById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

export function getPresentation(dossier: Dossier): PresentationResult {
  const notes = (dossier.analyze.notes ?? []) as PresentationNote[];
  const result: PresentationPayload = {};
  const options: PresentationOption[] = [];
  const streams: PresentationStream[] = [];
  const contributions: PresentationContribution[] = [];
  const voteOptions: PresentationVoteOption[] = [];
  const majorityDemo: PresentationMajority[] = [];

  for (const note of notes) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload;
      if (parsed.topic) result.topic = { ...result.topic, ...parsed.topic };
      if (parsed.inputs) result.inputs = { ...(result.inputs ?? {}), ...parsed.inputs };
      if (parsed.statementStats) result.statementStats = parsed.statementStats;
      if (parsed.clusters) result.clusters = parsed.clusters;
      if (Array.isArray(parsed.options)) options.push(...parsed.options);
      if (parsed.vote?.options) voteOptions.push(...parsed.vote.options);
      if (parsed.vote?.majorityDemo) majorityDemo.push(...parsed.vote.majorityDemo);

      const inputStreams = parsed.inputs?.streams;
      if (Array.isArray(inputStreams)) {
        for (const stream of inputStreams) streams.push(stream as PresentationStream);
      }

      const inputContrib = parsed.inputs?.contributions;
      if (Array.isArray(inputContrib)) {
        for (const contrib of inputContrib) contributions.push(contrib as PresentationContribution);
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
};
