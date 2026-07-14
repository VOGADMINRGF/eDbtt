import { describe, expect, it } from "vitest";
import {
  buildMunicipalHandoffThreeAdoptionTrialContract,
  usesMunicipalHandoffTrialActiveSlot,
} from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";

describe("municipal handoff three adoption trial contract", () => {
  it("keeps the three-slot state model explicit and only counts active publication toward capacity", () => {
    const contract = buildMunicipalHandoffThreeAdoptionTrialContract({
      slotStates: ["available", "reserved_internal_draft", "active"],
    });

    expect(contract.govLightTrial.slotLimit).toBe(3);
    expect(contract.govLightTrial.slots.map((slot) => slot.state)).toEqual([
      "available",
      "reserved_internal_draft",
      "active",
    ]);
    expect(contract.govLightTrial.slots.map((slot) => slot.consumesActiveCapacity)).toEqual([
      false,
      false,
      true,
    ]);
    expect(contract.govLightTrial.activeCount).toBe(1);
    expect(contract.govLightTrial.remainingSlots).toBe(2);
    expect(usesMunicipalHandoffTrialActiveSlot("publish_gov_light_topic")).toBe(true);
    expect(usesMunicipalHandoffTrialActiveSlot("activate_gov_light_topic")).toBe(true);
    expect(usesMunicipalHandoffTrialActiveSlot("open_gov_light_teaser")).toBe(false);
    expect(usesMunicipalHandoffTrialActiveSlot("bookmark_internal_topic")).toBe(false);
  });

  it("keeps gov-light reporting light and excludes export, full report and deep segmentation", () => {
    const contract = buildMunicipalHandoffThreeAdoptionTrialContract();

    expect(contract.govLightReport.mode).toBe("light");
    expect(contract.govLightReport.exportPackageAvailable).toBe(false);
    expect(contract.govLightReport.fullReportAvailable).toBe(false);
    expect(contract.govLightReport.deepSegmentationAvailable).toBe(false);
    expect(contract.govLightTrial.excludedCapabilities).toEqual(
      expect.arrayContaining(["export_package", "full_report", "deep_evaluation"]),
    );
  });

  it("keeps preflight, continuation candidate and handoff boundaries review-first", () => {
    const contract = buildMunicipalHandoffThreeAdoptionTrialContract();

    expect(contract.verifiedPublisherPreflight.consciousPublishClickRequired).toBe(true);
    expect(contract.verifiedPublisherPreflight.agentMayAutoPublish).toBe(false);
    expect(contract.verifiedPublisherPreflight.summary).toContain("bewusstem Publish-Klick");
    expect(contract.authorityContinuationCandidate.continuationCandidateOnly).toBe(true);
    expect(contract.authorityContinuationCandidate.officialAuthorityProcessCreated).toBe(false);
    expect(contract.handoffBoundary.internalCrmPipelineOnly).toBe(true);
    expect(contract.handoffBoundary.externalNotificationAutomatic).toBe(false);
    expect(contract.handoffBoundary.entitlementActivationAutomatic).toBe(false);
    expect(contract.handoffBoundary.recipientVerificationAutomatic).toBe(false);
    expect(contract.handoffBoundary.agentMayAutoPublish).toBe(false);
    expect(contract.publicReading.readOnlyViewingConsumesSlot).toBe(false);
  });
});
