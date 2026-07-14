import { describe, expect, it } from "vitest";
import {
  AGENTIC_CIVIC_E2E_PILOT_TASK_ID,
  AGENTIC_CIVIC_E2E_STAGE_IDS,
  buildAgenticCivicE2EPilotContract,
  buildAgenticCivicE2EPilotSummaryCards,
} from "@/features/agenticRuntime/agenticCivicE2EPilotContract";

describe("agentic civic e2e pilot contract", () => {
  it("integrates the controlled-agentic contracts into one review-first stage model", () => {
    const contract = buildAgenticCivicE2EPilotContract();

    expect(contract.taskId).toBe(AGENTIC_CIVIC_E2E_PILOT_TASK_ID);
    expect(contract.stageOrder).toEqual(AGENTIC_CIVIC_E2E_STAGE_IDS);
    expect(contract.dependencyTasksSatisfied).toBe(true);
    expect(contract.integratedContractIds).toHaveLength(10);
    expect(contract.statusInOpenTasks).toBe("done");
    expect(contract.stages.map((stage) => stage.id)).toEqual(AGENTIC_CIVIC_E2E_STAGE_IDS);
    expect(contract.stages[0]).toMatchObject({
      id: "citizen_observation",
      primaryRole: "personal_voxy",
      state: "review_required",
    });
    expect(contract.stages[2]).toMatchObject({
      id: "safe_trace",
      state: "contract_ready",
      primaryRole: "governance_compliance",
    });
    expect(contract.stages[7]).toMatchObject({
      id: "verified_publisher_preflight",
      state: "publish_blocked_until_conscious_action",
    });
  });

  it("keeps the pilot inside the review-first, no-runtime, no-auto-publish guardrails", () => {
    const contract = buildAgenticCivicE2EPilotContract();

    expect(contract.publicDebattenstandRemainsFree).toBe(true);
    expect(contract.noYesNoPolarizationMachine).toBe(true);
    expect(contract.majorityWithinPrinciplesOnly).toBe(true);
    expect(contract.noAutoPublish).toBe(true);
    expect(contract.noExternalNotification).toBe(true);
    expect(contract.noAutomaticRecipientVerification).toBe(true);
    expect(contract.noAutomaticEntitlementActivation).toBe(true);
    expect(contract.noAutomaticAdoption).toBe(true);
    expect(contract.noParallelAgents).toBe(true);
    expect(contract.noRuntimeActivation).toBe(true);
    expect(contract.govLight).toMatchObject({
      slotLimit: 3,
      readOnlyActionsConsumeSlot: false,
      publishOrActivateConsumesSlot: true,
      internalDraftReservationConsumesSlot: false,
    });
    expect(contract.verifiedPublisherPreflight).toMatchObject({
      consciousPublishClickRequired: true,
      agentMayAutoPublish: false,
      statuses: [
        "green_direct_live",
        "yellow_adjust_or_review",
        "red_blocked_manual_review",
      ],
    });
    expect(contract.reviewPipeline).toMatchObject({
      reviewFirst: true,
      adminVisible: true,
      organizationVisible: true,
      publicStatusReadable: true,
    });
    expect(contract.remainingControlledAgenticCodexReadyTaskIds).toEqual([]);
    expect(contract.nextControlledAgenticTaskId).toBeNull();
  });

  it("summarizes stages, safe trace and publish boundaries for read-only surfaces", () => {
    const contract = buildAgenticCivicE2EPilotContract();
    const cards = buildAgenticCivicE2EPilotSummaryCards(contract);

    expect(cards).toHaveLength(4);
    expect(cards[0]?.body).toContain("review-first Stages");
    expect(cards[0]?.body).toContain("Safe Trace");
    expect(cards[1]?.body).toContain("keine Fake-Quellen");
    expect(cards[2]?.body).toContain("drei aktive Themen");
    expect(cards[3]?.body).toContain("bewusst auf Veröffentlichen");
    expect(contract.safeTrace.length).toBeGreaterThanOrEqual(9);
  });
});
