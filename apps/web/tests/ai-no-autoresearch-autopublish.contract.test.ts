import { describe, expect, it } from "vitest";
import {
  AI_EXECUTION_ACTORS,
  resolveAiFlowIntegration,
} from "@/features/ai/v2OrchestrationPolicy";

describe("ai no-autoresearch no-autopublish contract", () => {
  it("never exposes public output directly on V2 automation flows", () => {
    for (const flow of [
      "standard_analyze",
      "feed_signal",
      "themenradar",
      "material_extraction",
      "dossier_update",
      "sealed_factcheck",
    ] as const) {
      const integration = resolveAiFlowIntegration(flow);
      expect(integration.publicOutputAllowed).toBe(false);
    }
  });

  it("keeps external research providers explicit and never core orchestrators", () => {
    const researchActors = AI_EXECUTION_ACTORS.filter((actor) =>
      actor.roles.includes("research_discovery"),
    );

    for (const actor of researchActors) {
      expect(actor.requiresExplicitApproval).toBe(true);
      expect(actor.reviewFirstOnly).toBe(true);
      expect(actor.notes.join(" ")).toMatch(/nie|Nur|getrennt/i);
    }
  });

  it("treats standard analyze as review-first without premium research", () => {
    const standard = resolveAiFlowIntegration("standard_analyze");
    expect(standard.reviewRequired).toBe(true);
    expect(standard.draftOnly).toBe(true);
    expect(standard.researchAllowed).toBe(false);
    expect(standard.costApprovalRequired).toBe(false);
  });
});
