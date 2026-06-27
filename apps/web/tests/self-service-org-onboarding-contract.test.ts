import { describe, expect, it } from "vitest";

import {
  canOperatorApproveOrgSetup,
  canProvisionOrgWorkspace,
  canSubmitSelfServiceOrgRequest,
  createEmptySelfServiceOrgOnboardingRequest,
  getSelfServiceOrgNextRequiredSteps,
  getSelfServiceOrgOpenQuestions,
  type SelfServiceOrgOnboardingRequest,
} from "@/features/organization/selfServiceOrgOnboardingContract";
import { SELF_SERVICE_ORG_ONBOARDING_FIXTURES } from "@/features/organization/selfServiceOrgOnboardingFixtures";

function withOverrides(
  overrides: Partial<SelfServiceOrgOnboardingRequest>,
): SelfServiceOrgOnboardingRequest {
  return {
    ...SELF_SERVICE_ORG_ONBOARDING_FIXTURES.municipalityPendingOperatorReview,
    ...overrides,
  };
}

describe("self service org onboarding contract", () => {
  it("generates open questions for incomplete requests", () => {
    const request = createEmptySelfServiceOrgOnboardingRequest("incomplete-org");

    expect(getSelfServiceOrgOpenQuestions(request)).toEqual([
      "organization_name_required",
      "applicant_type_required",
      "use_case_required",
      "contact_name_required",
      "contact_email_required",
      "requested_entitlement_intent_required",
      "verification_reference_required",
    ]);
    expect(getSelfServiceOrgNextRequiredSteps(request)).toEqual([
      "provide_organization_name",
      "select_applicant_type",
      "select_use_case",
      "provide_contact_person",
      "select_requested_entitlements",
      "provide_verification_information",
    ]);
    expect(canSubmitSelfServiceOrgRequest(request)).toBe(false);
  });

  it("allows complete requests to be submitted without automatic approval or provisioning", () => {
    const draftRequest = withOverrides({
      reviewStatus: "draft",
      verificationStatus: "pending_operator_review",
      provisioningStatus: "not_requested",
    });

    expect(canSubmitSelfServiceOrgRequest(draftRequest)).toBe(true);
    expect(getSelfServiceOrgNextRequiredSteps(draftRequest)).toContain("submit_request");

    const submittedRequest = { ...draftRequest, reviewStatus: "submitted" as const };
    expect(canSubmitSelfServiceOrgRequest(submittedRequest)).toBe(false);
    expect(canOperatorApproveOrgSetup(submittedRequest)).toBe(true);
    expect(canProvisionOrgWorkspace(submittedRequest)).toBe(false);
  });

  it("keeps verified distinct from provisioned", () => {
    const request = withOverrides({
      verificationStatus: "verified",
      reviewStatus: "in_review",
      provisioningStatus: "requested",
    });

    expect(canOperatorApproveOrgSetup(request)).toBe(true);
    expect(canProvisionOrgWorkspace(request)).toBe(false);
  });

  it("treats approved_for_setup as separate from provisioning until provisioning approval exists", () => {
    const request = {
      ...SELF_SERVICE_ORG_ONBOARDING_FIXTURES.mediaPartnerApprovedForSetup,
      provisioningStatus: "requested" as const,
    };

    expect(request.reviewStatus).toBe("approved_for_setup");
    expect(canProvisionOrgWorkspace(request)).toBe(false);
    expect(getSelfServiceOrgNextRequiredSteps(request)).toContain(
      "await_provisioning_approval",
    );
  });

  it("permits provisioning only after verified review approval and provisioning approval align", () => {
    const request = {
      ...SELF_SERVICE_ORG_ONBOARDING_FIXTURES.mediaPartnerApprovedForSetup,
      provisioningStatus: "approved_for_setup" as const,
    };

    expect(canProvisionOrgWorkspace(request)).toBe(true);
    expect(getSelfServiceOrgNextRequiredSteps(request)).toContain(
      "manual_provisioning_by_operator_required",
    );
  });

  it("keeps requested entitlements as intent instead of runtime grants or roles", () => {
    const request = {
      ...SELF_SERVICE_ORG_ONBOARDING_FIXTURES.mediaPartnerApprovedForSetup,
      requestedEntitlements: ["admin_managed", "operator_workspace"] as const,
      provisioningStatus: "approved_for_setup" as const,
    };

    expect(request.requestedEntitlements).toEqual([
      "admin_managed",
      "operator_workspace",
    ]);
    expect("grantedEntitlements" in request).toBe(false);
    expect("runtimeRoles" in request).toBe(false);
    expect(canProvisionOrgWorkspace(request)).toBe(true);
  });

  it("blocks approval and provisioning for rejected requests", () => {
    const rejected = withOverrides({
      reviewStatus: "rejected",
      verificationStatus: "rejected",
      provisioningStatus: "rejected",
    });

    expect(canSubmitSelfServiceOrgRequest(rejected)).toBe(false);
    expect(canOperatorApproveOrgSetup(rejected)).toBe(false);
    expect(canProvisionOrgWorkspace(rejected)).toBe(false);
  });

  it("allows operator review on pending_operator_review but not automatic provisioning", () => {
    const request = SELF_SERVICE_ORG_ONBOARDING_FIXTURES.municipalityPendingOperatorReview;

    expect(request.verificationStatus).toBe("pending_operator_review");
    expect(canOperatorApproveOrgSetup(request)).toBe(true);
    expect(canProvisionOrgWorkspace(request)).toBe(false);
    expect(getSelfServiceOrgNextRequiredSteps(request)).toContain("await_operator_review");
  });

  it("keeps clarification and missing verification hints visible as review-first follow-up", () => {
    const request = SELF_SERVICE_ORG_ONBOARDING_FIXTURES.associationNeedsInformation;

    expect(getSelfServiceOrgOpenQuestions(request)).toEqual([
      "Bitte Nachweis zur Organisationsform ergänzen.",
      "verification_reference_required",
      "verification_information_required",
      "operator_clarification_required",
    ]);
    expect(getSelfServiceOrgNextRequiredSteps(request)).toEqual([
      "provide_verification_information",
      "answer_operator_questions",
    ]);
    expect(canOperatorApproveOrgSetup(request)).toBe(false);
    expect(canProvisionOrgWorkspace(request)).toBe(false);
  });
});
