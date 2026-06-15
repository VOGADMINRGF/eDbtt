import type { GraphMergeCandidate } from "@features/graphMergeCandidatesClient";

export type AccountGraphMergeCandidateSlice = {
  graphMergeCandidates?: GraphMergeCandidate[];
};

export function readAccountGraphMergeCandidateSlice(
  src: unknown,
): AccountGraphMergeCandidateSlice {
  const value =
    src && typeof src === "object"
      ? (src as { graphMergeCandidates?: unknown }).graphMergeCandidates
      : undefined;

  return {
    graphMergeCandidates: Array.isArray(value)
      ? (value as GraphMergeCandidate[])
      : [],
  };
}
