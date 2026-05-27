import { describe, expect, it } from "vitest";
import {
  AI_EXECUTION_ACTORS,
  getAiExecutionActor,
} from "@/features/ai/v2OrchestrationPolicy";

describe("ai provider role routing contract", () => {
  it("keeps graph, orchestrator and validator as explicit system actors", () => {
    expect(getAiExecutionActor("system_graph").roles).toContain("graph_context");
    expect(getAiExecutionActor("policy_orchestrator").roles).toContain("fallback");
    expect(getAiExecutionActor("validator").roles).toContain("presentation_pass");
  });

  it("assigns clear roles to the main providers without silent publish rights", () => {
    const openai = getAiExecutionActor("openai");
    const anthropic = getAiExecutionActor("anthropic");
    const mistral = getAiExecutionActor("mistral");
    const gemini = getAiExecutionActor("gemini");

    expect(openai.roles).toEqual(
      expect.arrayContaining(["strict_analyze", "draft_analysis", "presentation_pass"]),
    );
    expect(anthropic.roles).toEqual(
      expect.arrayContaining(["editorial_perspective", "summarization", "draft_analysis"]),
    );
    expect(mistral.roles).toEqual(
      expect.arrayContaining(["material_extraction", "fallback", "draft_analysis"]),
    );
    expect(gemini.roles).toEqual(
      expect.arrayContaining(["material_extraction", "summarization"]),
    );

    for (const actor of [openai, anthropic, mistral, gemini]) {
      expect(actor.reviewFirstOnly).toBe(true);
    }
  });

  it("keeps research providers explicit and approval-gated", () => {
    const researchActors = AI_EXECUTION_ACTORS.filter((actor) =>
      actor.roles.includes("research_discovery"),
    );

    expect(researchActors.map((actor) => actor.actorId)).toEqual(
      expect.arrayContaining(["perplexity", "ari", "openai_deep_research"]),
    );
    for (const actor of researchActors) {
      expect(actor.requiresExplicitApproval).toBe(true);
      expect(actor.mayTriggerExternalCost).toBe(true);
      expect(actor.reviewFirstOnly).toBe(true);
    }
  });
});
