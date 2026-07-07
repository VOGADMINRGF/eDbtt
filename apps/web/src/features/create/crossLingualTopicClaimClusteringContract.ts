export const CROSS_LINGUAL_TOPIC_CLAIM_RELATIONSHIPS = [
  "possible_same_topic",
  "possible_duplicate_claim",
  "possible_translation_match",
  "possible_context_overlap",
  "possible_minor_perspective",
] as const;

export type CrossLingualTopicClaimRelationship =
  (typeof CROSS_LINGUAL_TOPIC_CLAIM_RELATIONSHIPS)[number];

export type CrossLingualTopicClaimClusteringSuggestion = {
  suggestionId: string;
  leftRef: string;
  rightRef: string;
  relationship: CrossLingualTopicClaimRelationship;
  explanation: string;
  reviewRequired: true;
  autoMerge: false;
  decisionState: "suggested_only";
  minorityPerspectivePreserved: boolean;
  missingRuntimeTruth: string[];
};

export type BuildCrossLingualTopicClaimClusteringSuggestionInput = {
  suggestionId: string;
  leftRef: string;
  rightRef: string;
  relationship?: CrossLingualTopicClaimRelationship;
  explanation?: string | null;
  runtimeConfirmed?: boolean;
};

export function buildCrossLingualTopicClaimClusteringSuggestion(
  input: BuildCrossLingualTopicClaimClusteringSuggestionInput,
): CrossLingualTopicClaimClusteringSuggestion {
  const relationship = input.relationship ?? "possible_context_overlap";
  const explanation =
    input.explanation?.trim() ??
    "Sprachübergreifende Nähe ist nur ein Review-Hinweis und keine Zusammenführung.";

  return {
    suggestionId: input.suggestionId.trim(),
    leftRef: input.leftRef.trim(),
    rightRef: input.rightRef.trim(),
    relationship,
    explanation,
    reviewRequired: true,
    autoMerge: false,
    decisionState: "suggested_only",
    minorityPerspectivePreserved:
      relationship === "possible_minor_perspective" ||
      relationship === "possible_context_overlap",
    missingRuntimeTruth: input.runtimeConfirmed === true ? [] : ["missing_runtime_truth"],
  };
}
