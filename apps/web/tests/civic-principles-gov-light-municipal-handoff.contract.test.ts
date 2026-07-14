import { describe, expect, it } from "vitest";
import {
  buildCivicPrinciplesGovLightMunicipalHandoffContract,
  usesGovLightActiveSlot,
} from "@/features/agenticRuntime/civicPrinciplesGovLightMunicipalHandoffContract";

describe("civic principles / gov-light / municipal handoff contract", () => {
  it("keeps public discourse away from binary outrage defaults", () => {
    const contract = buildCivicPrinciplesGovLightMunicipalHandoffContract();

    expect(contract.publicDiscourse.notABinaryOutrageMachine).toBe(true);
    expect(contract.publicDiscourse.preferredFormats).toContain("weighing_question");
    expect(contract.publicDiscourse.preferredFormats).toContain("option_comparison");
    expect(contract.publicDiscourse.disallowedDefaultFormats).toContain("yes_no_poll");
    expect(contract.publicDiscourse.disallowedDefaultFormats).toContain("suggestive_question");
    expect(contract.publicDiscourse.binaryReviewGatesRemainInternalOnly).toBe(true);
    expect(contract.majorityWithinPrinciples.principleOverridesForbidden).toContain(
      "hide_minority_arguments",
    );
  });

  it("keeps civic principles, public reading and authority continuation guardrails explicit", () => {
    const contract = buildCivicPrinciplesGovLightMunicipalHandoffContract();

    expect(contract.civicPrinciples.map((entry) => entry.id)).toContain(
      "public_debate_status_remains_free",
    );
    expect(contract.noPremiumVoteWeighting).toBe(true);
    expect(contract.noFakeSources).toBe(true);
    expect(contract.noFakeParticipation).toBe(true);
    expect(contract.authorityContinuation.govVerifiedAuthorityRequired).toBe(true);
    expect(contract.authorityContinuation.automaticImplementation).toBe(false);
    expect(contract.authorityContinuation.bindingReferendumCreated).toBe(false);
  });

  it("counts gov-light slots only for active publication or activation", () => {
    expect(usesGovLightActiveSlot("read_public_debate_status")).toBe(false);
    expect(usesGovLightActiveSlot("review_agent_suggestion")).toBe(false);
    expect(usesGovLightActiveSlot("publish_gov_light_topic")).toBe(true);
    expect(usesGovLightActiveSlot("activate_gov_light_topic")).toBe(true);

    const contract = buildCivicPrinciplesGovLightMunicipalHandoffContract({
      activePublishedTopics: 2,
      govLightUsageAction: "publish_gov_light_topic",
    });

    expect(contract.govLight.activeSlotLimit).toBe(3);
    expect(contract.govLight.activeSlotsRemaining).toBe(1);
    expect(contract.govLight.slotConsumedByAction).toBe(true);
    expect(contract.govLight.excludedCapabilities).toContain("export_package");
    expect(contract.govLight.hardClosePressureAllowed).toBe(false);
  });

  it("requires a conscious verified publisher click and blocks agent auto publish", () => {
    const contract = buildCivicPrinciplesGovLightMunicipalHandoffContract({
      publisherType: "verified_media_house",
      verifiedPublisherPreflightStatus: "red_blocked_manual_review",
    });

    expect(contract.verifiedPublisherPreflight.publisherType).toBe("verified_media_house");
    expect(contract.verifiedPublisherPreflight.consciousPublishClickRequired).toBe(true);
    expect(contract.verifiedPublisherPreflight.agentMayAutoPublish).toBe(false);
    expect(contract.verifiedPublisherPreflight.status).toBe("red_blocked_manual_review");
    expect(contract.verifiedPublisherPreflight.outcomes.red).toBe(
      "blocked_manual_review_required",
    );
  });

  it("limits municipal handoff to pipeline preparation instead of external automation", () => {
    const contract = buildCivicPrinciplesGovLightMunicipalHandoffContract();

    expect(contract.municipalHandoff.humanApprovalRequired).toBe(true);
    expect(contract.municipalHandoff.externalNotificationAutomatic).toBe(false);
    expect(contract.municipalHandoff.adoptionAutomatic).toBe(false);
    expect(contract.municipalHandoff.entitlementActivationAutomatic).toBe(false);
    expect(contract.municipalHandoff.crmPipelineSupports).toContain("contact_draft");
    expect(contract.municipalHandoff.agentMayPrepare).toContain("decision_templates");
    expect(contract.municipalHandoff.agentMayNot).toContain("send_external_message");
  });
});
