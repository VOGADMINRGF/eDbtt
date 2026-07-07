import { describe, expect, it } from "vitest";

import { buildCrossLingualTopicClaimClusteringSuggestion } from "@/features/create/crossLingualTopicClaimClusteringContract";

describe("cross lingual topic claim clustering contract", () => {
  it("keeps clustering suggestions review-first and non-merging", () => {
    const suggestion = buildCrossLingualTopicClaimClusteringSuggestion({
      suggestionId: "cluster-1",
      leftRef: "claim-a",
      rightRef: "claim-b",
      relationship: "possible_duplicate_claim",
    });

    expect(suggestion.autoMerge).toBe(false);
    expect(suggestion.decisionState).toBe("suggested_only");
    expect(suggestion.missingRuntimeTruth).toContain("missing_runtime_truth");
  });

  it("preserves minority perspectives when explicitly marked", () => {
    const suggestion = buildCrossLingualTopicClaimClusteringSuggestion({
      suggestionId: "cluster-2",
      leftRef: "claim-c",
      rightRef: "claim-d",
      relationship: "possible_minor_perspective",
    });

    expect(suggestion.minorityPerspectivePreserved).toBe(true);
  });
});
