import { describe, expect, it } from "vitest";
import {
  buildCreateFrontendAiTransparencyReadModel,
  buildRundenFrontendAiTransparencyReadModel,
} from "@/features/create/frontendAiTransparency";

describe("frontend AI transparency contract", () => {
  it("keeps /runden/new explicitly no-ai by default and marks /create as only planned", () => {
    const model = buildRundenFrontendAiTransparencyReadModel();

    expect(model.surface).toBe("/runden/new");
    expect(model.steps.find((step) => step.id === "without_ai_save")).toMatchObject({
      status: "skipped_no_ai",
    });
    expect(model.steps.find((step) => step.id === "with_ai_continue")).toMatchObject({
      status: "planned_not_active",
    });
    expect(model.steps.find((step) => step.id === "review_guardrail")).toMatchObject({
      status: "review_required",
    });
    expect(model.traceSteps.map((step) => step.stepId)).toEqual([
      "runden_no_ai_draft",
      "runden_create_transition",
    ]);
    expect(model.traceSteps[0]).toMatchObject({
      aiActive: false,
      usageRecorded: false,
      graphTarget: "draft_pre_record",
      reviewState: "draft",
      publishState: "not_published",
    });
    expect(model.hiddenByPolicy.join(" ")).toContain("Modell");
  });

  it("shows /create as not started before any planner or analysis step runs", () => {
    const model = buildCreateFrontendAiTransparencyReadModel({
      hasStarted: false,
      isStarting: false,
      hasIntelligentFollowup: false,
      showAnalyzeWorkspace: false,
      isRetryPlannerPending: false,
      fromManualAnlassraumContinueCreate: false,
      startBusyStatusLabel: "Wir ordnen deinen Beitrag ein …",
    });

    expect(model.surface).toBe("/create");
    expect(model.steps.find((step) => step.id === "planner_preparation")).toMatchObject({
      status: "not_started",
    });
    expect(model.steps.find((step) => step.id === "analyze_workspace")).toMatchObject({
      status: "planned_not_active",
    });
    expect(model.traceSteps.map((step) => step.stepId)).toContain("create_planner_trace");
    expect(model.traceSteps.map((step) => step.stepId)).toContain("create_analyze_trace");
  });

  it("reflects real running and completed create states without inventing later automation", () => {
    const running = buildCreateFrontendAiTransparencyReadModel({
      hasStarted: true,
      isStarting: true,
      hasIntelligentFollowup: false,
      showAnalyzeWorkspace: false,
      isRetryPlannerPending: false,
      fromManualAnlassraumContinueCreate: true,
      startBusyStatusLabel: "Wir ordnen deinen Beitrag ein …",
    });
    const completed = buildCreateFrontendAiTransparencyReadModel({
      hasStarted: true,
      isStarting: false,
      hasIntelligentFollowup: true,
      showAnalyzeWorkspace: true,
      isRetryPlannerPending: false,
      fromManualAnlassraumContinueCreate: true,
      startBusyStatusLabel: "Wir ordnen deinen Beitrag ein …",
      hasCandidatePreview: true,
      hasCandidateReviewHandoff: true,
      hasClaimToDossierPipeline: true,
    });

    expect(running.steps.find((step) => step.id === "planner_preparation")).toMatchObject({
      status: "running",
    });
    expect(completed.steps.find((step) => step.id === "planner_preparation")).toMatchObject({
      status: "completed",
    });
    expect(completed.steps.find((step) => step.id === "analyze_workspace")).toMatchObject({
      status: "running",
    });
    expect(completed.steps.find((step) => step.id === "later_followups")).toMatchObject({
      status: "review_required",
    });
    expect(completed.steps.find((step) => step.id === "later_followups")?.detail).toContain(
      "typed Dossier-Handoff",
    );
    expect(completed.traceSteps.find((step) => step.stepId === "create_planner_trace")).toMatchObject({
      userVisibleLabel: "KI bereitet nächste Schritte vor",
    });
    expect(completed.traceSteps.find((step) => step.stepId === "claims_questions_review_handoff")).toMatchObject({
      outputType: "candidate_review_handoff",
    });
  });
});
