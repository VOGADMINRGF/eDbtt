import type {
  OrganizationClaim,
  OrganizationProvisioningRequest,
  OrganizationProvisioningStatus,
  OrganizationType,
} from "@features/region";

function mapOrganizationTypeToProvisioningKind(
  type: OrganizationType,
): OrganizationProvisioningRequest["organizationKind"] {
  switch (type) {
    case "public_administration":
    case "city_administration":
    case "county_administration":
    case "ministry":
    case "agency":
    case "public_body":
    case "school":
      return "administration";
    case "municipality":
      return "municipality";
    case "district_office":
      return "district";
    case "association":
    case "ngo":
    case "foundation":
      return "association";
    case "media":
      return "media_partner";
    case "civic_initiative":
      return "civic_group";
    case "company":
    case "research_institution":
    case "custom":
    default:
      return "other";
  }
}

function inferProvisioningStatusFromVerificationStatus(
  status: OrganizationClaim["verificationStatus"],
): OrganizationProvisioningStatus {
  switch (status) {
    case "limited":
      return "limited";
    case "organization_verified":
    case "unit_verified":
    case "publication_approved":
      return "approved";
    case "suspended":
      return "suspended";
    case "rejected":
      return "rejected";
    case "revoked":
      return "suspended";
    case "email_verified":
      return "verification_required";
    case "pending_review":
      return "submitted";
    case "unverified":
    default:
      return "draft";
  }
}

function provisioningRequestReadyForOperatorReview(
  request: OrganizationProvisioningRequest,
): boolean {
  return Boolean(
    request.applicantName?.trim() &&
      request.requestedRegionId?.trim() &&
      request.requestedRoleLabel?.trim(),
  );
}

export function inferProvisioningRequestFromClaimView(
  claim: OrganizationClaim,
): OrganizationProvisioningRequest {
  const request = claim.provisioningRequest;
  if (request) return request;
  return {
    organizationKind: mapOrganizationTypeToProvisioningKind(claim.organizationType),
    status: inferProvisioningStatusFromVerificationStatus(claim.verificationStatus),
    latestDecision: null,
    source: claim.source === "fixture" ? "fixture" : claim.source === "migration" ? "migration" : claim.source === "self_declared" ? "self_service" : "operator_created",
    requestedRegionId: claim.regionId ?? null,
    requestedRegionLabel: claim.optionalLocation?.label ?? null,
    applicantName: claim.selfDeclaredProfile?.referencePersonName ?? null,
    applicantEmail: null,
    responsiblePersonName: claim.selfDeclaredProfile?.referencePersonName ?? null,
    responsiblePersonEmail: null,
    requestedRoleLabel: claim.roleLabel ?? null,
    note: claim.evidence.note ?? null,
    submittedAt:
      claim.verificationStatus === "pending_review" ||
      claim.verificationStatus === "email_verified" ||
      claim.verificationStatus === "organization_verified" ||
      claim.verificationStatus === "unit_verified" ||
      claim.verificationStatus === "publication_approved"
        ? claim.createdAt
        : null,
    decidedAt: claim.reviewedAt ?? null,
    decidedBy: claim.reviewedBy ?? null,
  };
}

export function resolveProvisioningRequestStatusView(
  claim: OrganizationClaim,
): OrganizationProvisioningStatus {
  const request = inferProvisioningRequestFromClaimView(claim);
  if (request.status === "submitted" && provisioningRequestReadyForOperatorReview(request)) {
    return "operator_review_required";
  }
  return request.status;
}
