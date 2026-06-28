export const ORGANIZATION_APPLICANT_TYPES = [
  "municipality",
  "public_authority",
  "association",
  "citizen_initiative",
  "media_partner",
  "participation_office",
  "agency_partner",
  "educational_institution",
  "other",
] as const;

export type OrganizationApplicantType =
  (typeof ORGANIZATION_APPLICANT_TYPES)[number];

export const ORGANIZATION_ONBOARDING_USE_CASES = [
  "participation_space",
  "dossier_workspace",
  "voxy_cocreation",
  "live_campaign",
  "source_monitoring",
  "editorial_review",
  "partner_distribution",
  "other",
] as const;

export type OrganizationOnboardingUseCase =
  (typeof ORGANIZATION_ONBOARDING_USE_CASES)[number];

export const ORGANIZATION_VERIFICATION_STATUSES = [
  "not_started",
  "needs_information",
  "pending_operator_review",
  "verified",
  "rejected",
] as const;

export type OrganizationVerificationStatus =
  (typeof ORGANIZATION_VERIFICATION_STATUSES)[number];

export const ORGANIZATION_PROVISIONING_STATUSES = [
  "not_requested",
  "requested",
  "approved_for_setup",
  "provisioned",
  "rejected",
] as const;

export type OrganizationProvisioningStatus =
  (typeof ORGANIZATION_PROVISIONING_STATUSES)[number];

export const ORGANIZATION_ENTITLEMENT_INTENTS = [
  "public_submitter",
  "member_workspace",
  "author_plus",
  "partner_workspace",
  "operator_workspace",
  "admin_managed",
] as const;

export type OrganizationEntitlementIntent =
  (typeof ORGANIZATION_ENTITLEMENT_INTENTS)[number];

export const ORGANIZATION_ONBOARDING_REVIEW_STATUSES = [
  "draft",
  "submitted",
  "needs_clarification",
  "in_review",
  "approved_for_setup",
  "rejected",
] as const;

export type OrganizationOnboardingReviewStatus =
  (typeof ORGANIZATION_ONBOARDING_REVIEW_STATUSES)[number];

export type SelfServiceOrgOnboardingRequest = {
  id: string;
  organizationName: string;
  applicantType: OrganizationApplicantType | null;
  useCases: OrganizationOnboardingUseCase[];
  contactName: string | null;
  contactEmail: string | null;
  websiteUrl?: string | null;
  registerReference?: string | null;
  region?: string | null;
  requestedEntitlements: OrganizationEntitlementIntent[];
  verificationStatus: OrganizationVerificationStatus;
  provisioningStatus: OrganizationProvisioningStatus;
  reviewStatus: OrganizationOnboardingReviewStatus;
  openQuestions: string[];
  createdAt: string;
  updatedAt: string;
};

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function unique(items: readonly string[]): string[] {
  return Array.from(
    new Set(items.map((item) => item.trim()).filter(Boolean)),
  );
}

function hasVerificationHint(
  request: Pick<
    SelfServiceOrgOnboardingRequest,
    "websiteUrl" | "registerReference"
  >,
): boolean {
  return hasValue(request.websiteUrl) || hasValue(request.registerReference);
}

function hasRequiredSubmissionFields(
  request: SelfServiceOrgOnboardingRequest,
): boolean {
  return (
    hasValue(request.organizationName) &&
    request.applicantType !== null &&
    request.useCases.length > 0 &&
    hasValue(request.contactName) &&
    hasValue(request.contactEmail) &&
    request.requestedEntitlements.length > 0 &&
    hasVerificationHint(request)
  );
}

function isRejectedRequest(
  request: Pick<
    SelfServiceOrgOnboardingRequest,
    "reviewStatus" | "verificationStatus" | "provisioningStatus"
  >,
): boolean {
  return (
    request.reviewStatus === "rejected" ||
    request.verificationStatus === "rejected" ||
    request.provisioningStatus === "rejected"
  );
}

export function createEmptySelfServiceOrgOnboardingRequest(
  id = "self-service-org-request",
): SelfServiceOrgOnboardingRequest {
  const timestamp = "2026-06-27T00:00:00.000Z";
  return {
    id,
    organizationName: "",
    applicantType: null,
    useCases: [],
    contactName: null,
    contactEmail: null,
    websiteUrl: null,
    registerReference: null,
    region: null,
    requestedEntitlements: [],
    verificationStatus: "not_started",
    provisioningStatus: "not_requested",
    reviewStatus: "draft",
    openQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getSelfServiceOrgOpenQuestions(
  request: SelfServiceOrgOnboardingRequest,
): string[] {
  const generated: string[] = [...request.openQuestions];

  if (!hasValue(request.organizationName)) {
    generated.push("organization_name_required");
  }
  if (request.applicantType === null) {
    generated.push("applicant_type_required");
  }
  if (request.useCases.length === 0) {
    generated.push("use_case_required");
  }
  if (!hasValue(request.contactName)) {
    generated.push("contact_name_required");
  }
  if (!hasValue(request.contactEmail)) {
    generated.push("contact_email_required");
  }
  if (request.requestedEntitlements.length === 0) {
    generated.push("requested_entitlement_intent_required");
  }
  if (!hasVerificationHint(request)) {
    generated.push("verification_reference_required");
  }
  if (request.verificationStatus === "needs_information") {
    generated.push("verification_information_required");
  }
  if (request.reviewStatus === "needs_clarification") {
    generated.push("operator_clarification_required");
  }

  return unique(generated);
}

export function canSubmitSelfServiceOrgRequest(
  request: SelfServiceOrgOnboardingRequest,
): boolean {
  if (isRejectedRequest(request)) {
    return false;
  }
  if (
    request.reviewStatus !== "draft" &&
    request.reviewStatus !== "needs_clarification"
  ) {
    return false;
  }
  if (request.provisioningStatus === "provisioned") {
    return false;
  }

  return hasRequiredSubmissionFields(request);
}

export function getSelfServiceOrgNextRequiredSteps(
  request: SelfServiceOrgOnboardingRequest,
): string[] {
  const steps: string[] = [];
  const openQuestions = getSelfServiceOrgOpenQuestions(request);

  if (openQuestions.includes("organization_name_required")) {
    steps.push("provide_organization_name");
  }
  if (openQuestions.includes("applicant_type_required")) {
    steps.push("select_applicant_type");
  }
  if (openQuestions.includes("use_case_required")) {
    steps.push("select_use_case");
  }
  if (
    openQuestions.includes("contact_name_required") ||
    openQuestions.includes("contact_email_required")
  ) {
    steps.push("provide_contact_person");
  }
  if (openQuestions.includes("requested_entitlement_intent_required")) {
    steps.push("select_requested_entitlements");
  }
  if (
    openQuestions.includes("verification_reference_required") ||
    openQuestions.includes("verification_information_required")
  ) {
    steps.push("provide_verification_information");
  }
  if (openQuestions.includes("operator_clarification_required")) {
    steps.push("answer_operator_questions");
  }
  if (canSubmitSelfServiceOrgRequest(request)) {
    steps.push("submit_request");
  }
  if (
    request.reviewStatus === "submitted" ||
    request.reviewStatus === "in_review"
  ) {
    steps.push("await_operator_review");
  }
  if (
    request.reviewStatus === "approved_for_setup" &&
    request.provisioningStatus !== "approved_for_setup" &&
    request.provisioningStatus !== "provisioned"
  ) {
    steps.push("await_provisioning_approval");
  }
  if (
    request.reviewStatus === "approved_for_setup" &&
    request.provisioningStatus === "approved_for_setup" &&
    request.verificationStatus === "verified"
  ) {
    steps.push("manual_provisioning_by_operator_required");
  }

  return unique(steps);
}

export function canOperatorApproveOrgSetup(
  request: SelfServiceOrgOnboardingRequest,
): boolean {
  if (isRejectedRequest(request)) {
    return false;
  }

  if (
    request.reviewStatus !== "submitted" &&
    request.reviewStatus !== "in_review"
  ) {
    return false;
  }

  if (
    request.verificationStatus !== "verified" &&
    request.verificationStatus !== "pending_operator_review"
  ) {
    return false;
  }

  return hasRequiredSubmissionFields(request);
}

export function canProvisionOrgWorkspace(
  request: SelfServiceOrgOnboardingRequest,
): boolean {
  if (isRejectedRequest(request)) {
    return false;
  }

  return (
    request.reviewStatus === "approved_for_setup" &&
    request.provisioningStatus === "approved_for_setup" &&
    request.verificationStatus === "verified"
  );
}
