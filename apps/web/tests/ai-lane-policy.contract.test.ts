import { describe, expect, it } from "vitest";
import {
  AI_V2_LANE_POLICIES,
  getAiLanePolicy,
  mapLegacyLaneToAiV2Lane,
} from "@/features/ai/v2OrchestrationPolicy";

describe("ai lane policy contract", () => {
  it("defines the required V2 lanes with explicit guardrails", () => {
    expect(AI_V2_LANE_POLICIES.map((lane) => lane.lane)).toEqual([
      "standard",
      "material_extraction",
      "feed_signal",
      "themenradar_cluster",
      "sealed_factcheck",
      "research_addon",
      "fallback_only",
    ]);
  });

  it("keeps research and public output blocked on standard V2 automation lanes", () => {
    for (const laneId of ["standard", "material_extraction", "feed_signal", "themenradar_cluster"] as const) {
      const lane = getAiLanePolicy(laneId);
      expect(lane.researchAllowed).toBe(false);
      expect(lane.reviewRequired).toBe(true);
      expect(lane.publicOutputAllowed).toBe(false);
      expect(lane.draftOnly).toBe(true);
    }
  });

  it("marks sealed factcheck and research addon as explicit cost- and review-gated lanes", () => {
    const factcheck = getAiLanePolicy("sealed_factcheck");
    const research = getAiLanePolicy("research_addon");

    expect(factcheck.researchAllowed).toBe(true);
    expect(factcheck.costApprovalRequired).toBe(true);
    expect(factcheck.sealEligible).toBe(true);
    expect(factcheck.publicOutputAllowed).toBe(false);

    expect(research.researchAllowed).toBe(true);
    expect(research.costApprovalRequired).toBe(true);
    expect(research.sealEligible).toBe(false);
    expect(research.publicOutputAllowed).toBe(false);
  });

  it("maps legacy admin smoke lanes onto the normalized V2 policy model", () => {
    expect(mapLegacyLaneToAiV2Lane("fast_draft")).toBe("fallback_only");
    expect(mapLegacyLaneToAiV2Lane("standard_analyze")).toBe("standard");
    expect(mapLegacyLaneToAiV2Lane("material_grounding")).toBe("material_extraction");
    expect(mapLegacyLaneToAiV2Lane("sealed_factcheck")).toBe("sealed_factcheck");
    expect(mapLegacyLaneToAiV2Lane("premium_deep_research")).toBe("research_addon");
  });
});
