import { describe, expect, it } from "vitest";
import {
  buildDownstreamRuntimeHandoffRecord,
  resolveDownstreamRuntimeExecutionGate,
} from "@/features/create/downstreamRuntimeHandoffContract";

describe("downstream runtime handoff contract", () => {
  it("keeps downstream handoffs review-first and not auto-executed", () => {
    const handoff = buildDownstreamRuntimeHandoffRecord({
      handoffId: "h1",
      sourceContributionId: "c1",
      target: "dossier_runtime_record",
      preparationStatus: "publish_ready",
      requiredReviewType: "publish_review",
      runtimeTruthAvailable: true,
    });

    expect(handoff.autoCreate).toBe(false);
    expect(handoff.autoPublish).toBe(false);
    expect(handoff.autoGraphWrite).toBe(false);
    expect(handoff.state).toBe("planned_handoff");
  });

  it("marks missing runtime truth honestly", () => {
    const handoff = buildDownstreamRuntimeHandoffRecord({
      handoffId: "h2",
      sourceContributionId: "c2",
      target: "topic_graph_candidate",
      preparationStatus: "review_ready",
      requiredReviewType: "editorial_review",
    });

    expect(handoff.state).toBe("blocked_by_runtime_truth");
    expect(handoff.missingRuntimeTruth).toEqual(["missing_runtime_truth"]);
  });

  it("blocks execution until matching review is approved", () => {
    const handoff = buildDownstreamRuntimeHandoffRecord({
      handoffId: "h3",
      sourceContributionId: "c3",
      target: "participation_space_runtime_record",
      preparationStatus: "publish_ready",
      requiredReviewType: "org_review",
      runtimeTruthAvailable: true,
    });

    const blocked = resolveDownstreamRuntimeExecutionGate({
      actor: { userId: "u1", role: "institutional_actor" },
      handoff,
      completedReviews: [],
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("blocked_by_review_gate");
  });
});
