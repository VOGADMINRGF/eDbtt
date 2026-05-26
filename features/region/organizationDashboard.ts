import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  buildMaterialIntakeDashboardSummary,
  type MaterialIntakeDashboardSummary,
} from "@/features/material/materialIntakeContract";
import {
  listMaterialIntakeRecords,
  type MaterialIntakeRecord,
} from "@/features/material/materialIntakeRepository";
import {
  REGION_ALLOWED_ACTIONS,
  canReadRegionDashboard,
  type RegionAllowedAction,
  type RegionAccessContext,
} from "./access";
import {
  buildNonAdminModerationPermission,
  buildOrganizationScopeContext,
  buildRegionScopeContext,
  canViewRegionResource,
  type NonAdminModerationPermission,
} from "./scope";
import {
  type Region,
  type RegionalAnlassraum,
} from "./contracts";
import type { RegionPublicationVisibilityState } from "./publicationRiskLadder";
import {
  listRegionSignalDraftRecords,
  type RegionSignalDraftRecord,
} from "./regionSignalDrafts";
import {
  getOperationalRegionById,
  getRegionalAdminCockpitReadModel,
  listOperationalRegions,
  type RegionalAdminCockpitReadModel,
} from "./store";
import {
  buildReviewQueueReadModel,
  type ReviewQueueItem,
  type ReviewQueueReadModel,
} from "../reviewQueue";
import { listUnifiedAuditEvents, type UnifiedAuditEvent } from "../unifiedAuditReadside";
import type {
  DirectoryVerificationStatus,
  Organization,
  OrganizationClaim,
  OrganizationMembership,
  OrganizationProvisioningRequest,
  OrganizationProvisioningStatus,
  OrganizationType,
  VerificationStatus,
} from "./organizationOnboarding";
import {
  isVerificationAuditBacked,
  inferProvisioningRequestFromClaim,
  normalizeDirectoryVerificationStatus,
  resolveProvisioningRequestStatus,
} from "./organizationOnboarding";
import {
  buildOrganizationEntitlementSummary,
  organizationEntitlementAllowsScope,
  type OrganizationEntitlementGrant,
  type OrganizationEntitlementStatus,
} from "./organizationEntitlements";
import {
  buildOrganizationContractSummary,
  type OrganizationContractSummary,
} from "./organizationContracts";
import {
  buildOrganizationPartnerPackageSummary,
  type OrganizationPartnerPackageSummary,
} from "./organizationPartnerPackages";
import { listPricingOrdersForOrganizationRuntime } from "@features/pricing/orderContractsRuntime";
import {
  getSocialDistributionRepo,
  socialDistributionStatusLabel,
  type SocialDistributionPost,
  type SocialDistributionStatus,
} from "@features/outputEngine/socialDistributionRuntime";
import {
  regionSourceConnectionTypeLabel,
  sourceConnectionScopeLabel,
  sourceConnectionStatusLabel,
  sourceConnectionTestResultLabel,
  type RegionSourceConnection,
  type SourceConnectionStatus,
} from "./sourceConnections";
import {
  buildPersistedRegionAccessContext,
  getRegionOrganizationRuntimeRepo,
} from "./server/membershipRuntime";
import {
  getRegionEntitlementRuntimeRepo,
  type EntitlementAuditEvent,
  type PaidDashboardEntitlement,
} from "./server/paidEntitlements";
import { isRegionSourceConnectionProductionTruth } from "./server/sourceConnectionRuntime";

export type OrganizationDashboardGuardrails = {
  noAutoOfficialClaim: true;
  noAutoPublish: true;
  noAutoDossierFinalization: true;
  noAutoAnlassraumFinalization: true;
  reviewRequiredForOfficialStatus: true;
};

export type OrganizationDashboardRegionSummary = {
  regionId: string;
  regionName: string;
  source: "verified_membership" | "organization_claim";
  verificationStatus: VerificationStatus | "self_declared";
  dashboardAccess: boolean;
  roleLabel: string | null;
  entitlementStatus: RegionAccessContext["organization"]["entitlementStatus"] | null;
  entitlementReason: RegionAccessContext["organization"]["entitlementReason"] | "self_declared_only";
  entitlementPlanLabel: string | null;
};

export type OrganizationDashboardEntitlementSummary = {
  currentStatus: OrganizationEntitlementStatus;
  state:
    | "aktiv"
    | "Testzugang"
    | "fehlt"
    | "abgelaufen"
    | "eingeschränkt"
    | "in Entscheidung"
    | "gesperrt";
  hasActiveEntitlement: boolean;
  hasTrialEntitlement: boolean;
  hasMissingEntitlement: boolean;
  hasExpiredEntitlement: boolean;
  planLabels: string[];
  organizationIds: string[];
  grants: OrganizationEntitlementGrant[];
  operatorDecisionRequired: boolean;
  billingPending: boolean;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  productionTruth: boolean;
  guardrails: {
    noPaymentClaim: true;
    noCheckout: true;
  };
};

export type OrganizationDashboardMembershipStatus = {
  totalMemberships: number;
  verifiedMemberships: number;
  pendingClaims: number;
  highestVerificationStatus: VerificationStatus | "none" | "admin_fallback";
};

export type OrganizationDashboardDirectorySummary = {
  sourceOfTruth:
    | "session"
    | "persistent_membership_store"
    | "operator_verified_directory"
    | "external_directory_integrated"
    | "external_directory_pending"
    | "fixture_demo";
  confidence: "high" | "admin_fallback" | "limited";
  runtimeMarker:
    | "production_runtime"
    | "demo_or_test_runtime"
    | "external_directory_pending";
  productionTruth: boolean;
  auditBacked: boolean;
  verificationStatus: DirectoryVerificationStatus;
};

export type OrganizationDashboardProvisioningSummary = {
  currentStatus: OrganizationProvisioningStatus | "none";
  latestRequest: OrganizationProvisioningRequest | null;
  requests: OrganizationProvisioningRequest[];
  operatorReviewRequired: boolean;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  productionTruth: boolean;
};

export type OrganizationDashboardSourceConnectionItem = {
  id: string;
  regionId: string;
  regionName: string;
  label: string;
  sourceTypeLabel: string;
  status: SourceConnectionStatus;
  statusLabel: string;
  scopeLabel: string;
  latestTestLabel: string;
  latestTestSummary: string | null;
  productionTruth: boolean;
  reviewRequired: true;
  noAutoPublish: true;
  noPublicOfficial: true;
};

export type OrganizationDashboardSourceConnectionSummary = {
  currentState:
    | "not_enabled"
    | "requested"
    | "verification_required"
    | "testing"
    | "test_failed"
    | "active_review_required"
    | "paused_or_revoked";
  statusLabel: string;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  productionTruth: boolean;
  entitlementRequired: boolean;
  operatorReviewRequired: boolean;
  connections: OrganizationDashboardSourceConnectionItem[];
};

export type OrganizationDashboardSocialDistributionItem = {
  id: string;
  title: string;
  status: SocialDistributionStatus;
  statusLabel: string;
  channels: string[];
  sourceState: "review_only" | "approved_context" | "internal_only";
  sourceVisibilityState: RegionPublicationVisibilityState;
  approvalRequired: boolean;
  sealGranted: boolean;
  updatedAt: string;
};

export type OrganizationDashboardSocialDistributionSummary = {
  currentState:
    | "not_enabled"
    | "needs_review"
    | "review_requested"
    | "approved"
    | "queued"
    | "scheduled_ready"
    | "exported"
    | "copied"
    | "blocked"
    | "archived";
  statusLabel: string;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  productionTruth: boolean;
  reviewRequired: boolean;
  items: OrganizationDashboardSocialDistributionItem[];
};

export type OrganizationDashboardPartnerPackageSummary = OrganizationPartnerPackageSummary;

export type OrganizationDashboardReviewItem = ReviewQueueItem & {
  moderationPermission: NonAdminModerationPermission;
};

export type OrganizationDashboardReviewSummary = ReviewQueueReadModel["summary"];

export const ORGANIZATION_FIRST_RUN_STEP_STATUSES = [
  "locked",
  "available",
  "done",
  "needs_review",
  "optional",
] as const;

export type OrganizationFirstRunStepStatus =
  (typeof ORGANIZATION_FIRST_RUN_STEP_STATUSES)[number];

export type OrganizationFirstRunStepCta = {
  id: string;
  label: string;
  href: string;
};

export type OrganizationFirstRunStep = {
  id:
    | "organization"
    | "region"
    | "status"
    | "source"
    | "review"
    | "dossier"
    | "anlassraum"
    | "visibility";
  title: string;
  description: string;
  status: OrganizationFirstRunStepStatus;
  statusLabel: string;
  ctas: OrganizationFirstRunStepCta[];
};

export type OrganizationFirstRunReadModel = {
  intro: string;
  steps: OrganizationFirstRunStep[];
};

export type OrganizationDashboardStartingPoint = {
  regionId: string;
  regionName: string;
  summary: string;
  topicClusters: string[];
  openQuestions: string[];
  sourceStatus: string;
  productiveSourceStatus: string;
  curatedSourceStatus: string;
  manualSourceStatus: string;
  weightingLabel: string;
  sourcesCount: number;
  dossierSuggestionCount: number;
  anlassraumSuggestionCount: number;
  reviewSuggestionCount: number;
  reviewSuggestionLabels: string[];
};

export type OrganizationDashboardDraftSummary = {
  draftId: string;
  draftType: "dossier" | "anlassraum";
  regionId: string;
  regionName: string;
  title: string;
  summary: string;
  reviewStatus: "draft" | "needs_review";
  visibilityState: RegionPublicationVisibilityState;
  createdByRole: string;
  href: string;
};

export type OrganizationDashboardParticipationSignal = {
  id: string;
  regionId: string;
  regionName: string;
  title: string;
  summary: string;
  sourceType: string;
  visibilityState: RegionPublicationVisibilityState;
};

export type OrganizationDashboardNextAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type OrganizationDashboardPublishItem = {
  itemId: string;
  targetType: "dossier" | "anlassraum" | "topic_page";
  targetLabel: string;
  regionName: string | null;
  title: string;
  statusLabel: string;
  visibilityState: RegionPublicationVisibilityState;
  previewHref: string | null;
  publicHref: string | null;
  shareHref: string | null;
  qrHref: string | null;
  archived: boolean;
};

export type OrganizationDashboardPublishSummary = {
  totalPrepared: number;
  visibleCount: number;
  shareableCount: number;
  archivedCount: number;
  items: OrganizationDashboardPublishItem[];
};

export type OrganizationDashboardReadModel = {
  organization: {
    primaryOrganizationId: string | null;
    name: string | null;
    organizations: Organization[];
    roleLabel: string | null;
    isOperatorMode: boolean;
  };
  organizationType: OrganizationType | null;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  membershipStatus: OrganizationDashboardMembershipStatus;
  directorySummary: OrganizationDashboardDirectorySummary;
  provisioningSummary: OrganizationDashboardProvisioningSummary;
  contractSummary: OrganizationContractSummary;
  partnerPackageSummary: OrganizationPartnerPackageSummary;
  materialIntakeSummary: MaterialIntakeDashboardSummary;
  sourceConnectionSummary: OrganizationDashboardSourceConnectionSummary;
  socialDistributionSummary: OrganizationDashboardSocialDistributionSummary;
  regionSummary: OrganizationDashboardRegionSummary[];
  entitlementSummary: OrganizationDashboardEntitlementSummary;
  allowedActions: RegionAllowedAction[];
  pendingOrganizationClaims: OrganizationClaim[];
  verifiedMemberships: OrganizationMembership[];
  firstRun: OrganizationFirstRunReadModel;
  openReviewItems: OrganizationDashboardReviewItem[];
  reviewQueueSummary: OrganizationDashboardReviewSummary;
  reviewQueueOperationsPersistence: ReviewQueueReadModel["operationsPersistence"];
  contentReleasePersistence: ReviewQueueReadModel["contentReleasePersistence"];
  recentUnifiedAuditTrail: UnifiedAuditEvent[];
  regionalStartingPoints: OrganizationDashboardStartingPoint[];
  dossierDrafts: OrganizationDashboardDraftSummary[];
  anlassraumDrafts: OrganizationDashboardDraftSummary[];
  participationSignals: OrganizationDashboardParticipationSignal[];
  publishSummary: OrganizationDashboardPublishSummary;
  nextActions: OrganizationDashboardNextAction[];
  guardrails: OrganizationDashboardGuardrails;
};

const DASHBOARD_GUARDRAILS: OrganizationDashboardGuardrails = {
  noAutoOfficialClaim: true,
  noAutoPublish: true,
  noAutoDossierFinalization: true,
  noAutoAnlassraumFinalization: true,
  reviewRequiredForOfficialStatus: true,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function sortRecentAuditTrail(events: UnifiedAuditEvent[], limit: number) {
  return [...events]
    .sort((left, right) => String(left.at).localeCompare(String(right.at)))
    .slice(-limit);
}

function attachModerationPermission(params: {
  items: ReviewQueueItem[];
  scope: ReturnType<typeof buildRegionScopeContext>;
  verificationStatus: VerificationStatus | "none" | "admin_fallback";
  allowedActions: RegionAllowedAction[];
}): OrganizationDashboardReviewItem[] {
  return params.items.map((item) => ({
    ...item,
    moderationPermission: buildNonAdminModerationPermission({
      scope: params.scope,
      verificationStatus: params.verificationStatus,
      allowedActions: params.allowedActions,
      resource: {
        organizationId: item.organizationId,
        ownerUserId: item.ownerUserId,
        regionId: item.regionId,
        reviewAuthority: item.reviewAuthority,
      },
    }),
  }));
}

function isVerifiedMembershipStatus(
  status: OrganizationMembership["verificationStatus"],
): boolean {
  return (
    status === "organization_verified" ||
    status === "unit_verified" ||
    status === "publication_approved" ||
    status === "limited"
  );
}

function isMembershipActive(membership: OrganizationMembership): boolean {
  if (membership.revokedAt) return false;
  if (membership.expiresAt && Date.parse(membership.expiresAt) <= Date.now()) return false;
  return true;
}

function verificationRank(status: VerificationStatus | "none" | "admin_fallback"): number {
  switch (status) {
    case "admin_fallback":
      return 99;
    case "publication_approved":
      return 70;
    case "unit_verified":
      return 60;
    case "organization_verified":
      return 50;
    case "limited":
      return 45;
    case "email_verified":
      return 40;
    case "pending_review":
      return 30;
    case "suspended":
      return 15;
    case "unverified":
      return 20;
    case "rejected":
      return 10;
    case "revoked":
      return 5;
    default:
      return 0;
  }
}

function resolveHighestVerificationStatus(input: {
  memberships: OrganizationMembership[];
  claims: OrganizationClaim[];
  isAdmin: boolean;
}): VerificationStatus | "none" | "admin_fallback" {
  if (input.isAdmin) return "admin_fallback";
  const candidates = [
    ...input.memberships.map((membership) => membership.verificationStatus),
    ...input.claims.map((claim) => claim.verificationStatus),
  ];
  let best: VerificationStatus | "none" = "none";
  for (const status of candidates) {
    if (verificationRank(status) > verificationRank(best)) best = status;
  }
  return best;
}

function regionNameForId(regionMap: Map<string, Region>, regionId: string | null | undefined): string {
  const normalized = String(regionId ?? "").trim();
  if (!normalized) return "Noch keine Region bestätigt";
  return regionMap.get(normalized)?.name ?? normalized;
}

function pickPrimaryOrganization(params: {
  organizations: Organization[];
  memberships: OrganizationMembership[];
  claims: OrganizationClaim[];
}): Organization | null {
  if (params.organizations.length === 0) return null;
  const sorted = [...params.organizations].sort((left, right) => {
    const leftRank = Math.max(
      ...params.memberships
        .filter((membership) => membership.organizationId === left.id)
        .map((membership) => verificationRank(membership.verificationStatus)),
      ...params.claims
        .filter((claim) => claim.organizationId === left.id || claim.organizationName === left.name)
        .map((claim) => verificationRank(claim.verificationStatus)),
      verificationRank(left.verificationStatus),
    );
    const rightRank = Math.max(
      ...params.memberships
        .filter((membership) => membership.organizationId === right.id)
        .map((membership) => verificationRank(membership.verificationStatus)),
      ...params.claims
        .filter((claim) => claim.organizationId === right.id || claim.organizationName === right.name)
        .map((claim) => verificationRank(claim.verificationStatus)),
      verificationRank(right.verificationStatus),
    );
    if (leftRank !== rightRank) return rightRank - leftRank;
    return left.name.localeCompare(right.name);
  });
  return sorted[0] ?? null;
}

function toRoleLabel(memberships: OrganizationMembership[], isAdmin: boolean): string | null {
  if (isAdmin) return "Betreiber-Modus";
  const sorted = [...memberships].sort(
    (left, right) => verificationRank(right.verificationStatus) - verificationRank(left.verificationStatus),
  );
  return sorted[0]?.roleLabel ?? null;
}

function buildEntitlementSummary(
  params: {
    organization: Organization | null;
    claims: OrganizationClaim[];
    verifiedMemberships: OrganizationMembership[];
    entitlements: PaidDashboardEntitlement[];
    auditEvents: EntitlementAuditEvent[];
    contractSummary: OrganizationContractSummary | null;
  },
): OrganizationDashboardEntitlementSummary {
  const grantSummary = buildOrganizationEntitlementSummary({
    organization: params.organization,
    claims: params.claims,
    verifiedMemberships: params.verifiedMemberships,
    entitlements: params.entitlements,
    auditEvents: params.auditEvents,
    productionTruth: !shouldUseInMemoryMongoFallback(),
    contractSummary: params.contractSummary,
  });

  return {
    currentStatus: grantSummary.currentStatus,
    state: grantSummary.state,
    hasActiveEntitlement: grantSummary.hasActiveEntitlement,
    hasTrialEntitlement: grantSummary.hasTrialEntitlement,
    hasMissingEntitlement: grantSummary.hasMissingEntitlement,
    hasExpiredEntitlement: grantSummary.hasExpiredEntitlement,
    planLabels: grantSummary.planLabels,
    organizationIds: grantSummary.organizationIds,
    grants: grantSummary.grants,
    operatorDecisionRequired: grantSummary.operatorDecisionRequired,
    billingPending: grantSummary.billingPending,
    nextStepTitle: grantSummary.nextStepTitle,
    nextStepBody: grantSummary.nextStepBody,
    storeLabel: grantSummary.storeLabel,
    productionTruth: grantSummary.productionTruth,
    guardrails: {
      noPaymentClaim: grantSummary.noAutoPaymentClaim,
      noCheckout: grantSummary.noCheckout,
    },
  };
}

function buildPendingClaims(claims: OrganizationClaim[]): OrganizationClaim[] {
  return claims
    .filter(
      (claim) =>
        claim.verificationStatus !== "rejected" &&
        claim.verificationStatus !== "revoked" &&
        claim.verificationStatus !== "publication_approved",
    )
    .map((claim) => clone(claim));
}

function buildProvisioningRequestView(
  claim: OrganizationClaim,
): OrganizationProvisioningRequest {
  const request = inferProvisioningRequestFromClaim(claim);
  return {
    ...request,
    status: resolveProvisioningRequestStatus(claim),
  };
}

function buildProvisioningSummary(input: {
  claims: OrganizationClaim[];
  memberships: OrganizationMembership[];
  verifiedMemberships: OrganizationMembership[];
}): OrganizationDashboardProvisioningSummary {
  const requests = input.claims.map((claim) => buildProvisioningRequestView(claim));
  const latestRequest = requests[0] ?? null;
  const hasLimitedMembership = input.memberships.some(
    (membership) =>
      isMembershipActive(membership) && membership.verificationStatus === "limited",
  );
  const hasSuspendedMembership = input.memberships.some(
    (membership) =>
      membership.verificationStatus === "suspended" ||
      membership.verificationStatus === "revoked" ||
      Boolean(membership.revokedAt),
  );
  const currentStatus =
    hasSuspendedMembership
      ? "suspended"
      : hasLimitedMembership
        ? "limited"
      : input.verifiedMemberships.length > 0
      ? "approved"
      : latestRequest?.status ?? "none";
  const operatorReviewRequired = requests.some(
    (request) => request.status === "operator_review_required",
  );
  const productionTruth = !shouldUseInMemoryMongoFallback();

  switch (currentStatus) {
    case "draft":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Antrag gestartet",
        nextStepBody:
          "Dein Antrag ist als Entwurf gespeichert. Prüfe Organisation, Region oder Wirkraum und reiche ihn erst bewusst zur Prüfung ein.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "submitted":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Antrag eingegangen",
        nextStepBody:
          "Dein Antrag ist eingegangen, aber noch nicht vollständig reviewfähig. Ergänze sichere Nachweise oder warte auf den nächsten Hinweis.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "verification_required":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Prüfung erforderlich",
        nextStepBody:
          "Bevor Betreiber die Freischaltung entscheiden können, braucht der Antrag noch belastbare Angaben zu Antragsteller, Region oder verantwortlicher Person.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "operator_review_required":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Betreiberprüfung läuft",
        nextStepBody:
          "Der Antrag ist vollständig genug für die Betreiberprüfung. Bis zur bewussten Entscheidung entstehen keine Moderations-, Veröffentlichungs- oder Betreiberrechte.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "approved":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Freigeschaltet",
        nextStepBody:
          "Die Organisation ist freigeschaltet. Rechte entstehen nur im bestätigten Org-Scope; `publication_approved` und `public_official` bleiben getrennte, bewusste Entscheidungen.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "limited":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Eingeschränkt",
        nextStepBody:
          "Der Organisationszugang ist bewusst eingeschränkt. Leserechte oder enge Basisscopes können aktiv bleiben; Moderation, Veröffentlichung und größere Schreibpfade bleiben bewusst begrenzt.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "rejected":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Abgelehnt",
        nextStepBody:
          "Dieser Antrag wurde nicht freigeschaltet. Schreibrouten bleiben gesperrt, bis ein korrigierter Antrag bewusst neu eingereicht wird.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "suspended":
      return {
        currentStatus,
        latestRequest,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Gesperrt",
        nextStepBody:
          "Der Antrag oder die daraus entstandene Freischaltung ist ausgesetzt. Schreibrouten bleiben blockiert, bis Betreiber den Scope erneut freigeben.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
    case "none":
    default:
      return {
        currentStatus: "none",
        latestRequest: null,
        requests,
        operatorReviewRequired,
        nextStepTitle: "Sicherer Antragseinstieg",
        nextStepBody:
          "Du hast noch keine bestätigte Organisation. Starte einen Organisations- oder Wirkraum-Antrag; ohne Freigabe bleiben Review und Sichtbarkeit gesperrt.",
        storeLabel: productionTruth ? "Persistenter Claim-Store" : "In-Memory-/lokaler Fallback",
        productionTruth,
      };
  }
}

function buildDirectorySummary(input: {
  isAdmin: boolean;
  claims: OrganizationClaim[];
  memberships: OrganizationMembership[];
}): OrganizationDashboardDirectorySummary {
  const runtimeMarker = shouldUseInMemoryMongoFallback()
    ? "demo_or_test_runtime"
    : "production_runtime";
  if (input.isAdmin) {
    return {
      sourceOfTruth: "session",
      confidence: "admin_fallback",
      runtimeMarker,
      productionTruth: false,
      auditBacked: false,
      verificationStatus: "verified",
    };
  }

  const sortedMemberships = [...input.memberships].sort(
    (left, right) => verificationRank(right.verificationStatus) - verificationRank(left.verificationStatus),
  );
  const primaryMembership = sortedMemberships[0] ?? null;
  const latestClaim = input.claims[0] ?? null;
  const latestClaimStatus = latestClaim ? buildProvisioningRequestView(latestClaim).status : null;
  const auditBacked =
    input.memberships.some((membership) =>
      isVerificationAuditBacked({
        verifiedBy: membership.verifiedBy,
        verifiedAt: membership.verifiedAt,
        revokedAt: membership.revokedAt,
      }),
    ) ||
    input.claims.some((claim) =>
      isVerificationAuditBacked({
        reviewedBy: claim.reviewedBy,
        reviewedAt: claim.reviewedAt,
      }),
    );

  const verificationStatus = primaryMembership
    ? normalizeDirectoryVerificationStatus({
        verificationStatus: primaryMembership.verificationStatus,
        revokedAt: primaryMembership.revokedAt ?? null,
        expiresAt: primaryMembership.expiresAt ?? null,
      })
    : latestClaim
      ? normalizeDirectoryVerificationStatus({
          verificationStatus: latestClaim.verificationStatus,
          provisioningStatus: latestClaimStatus,
          hasRequiredEvidence: latestClaimStatus === "operator_review_required",
        })
      : "none";

  const sourceOfTruth =
    runtimeMarker === "demo_or_test_runtime"
      ? "fixture_demo"
      : auditBacked
        ? "operator_verified_directory"
        : input.memberships.length > 0 || input.claims.length > 0
          ? "persistent_membership_store"
          : "session";

  return {
    sourceOfTruth,
    confidence: input.memberships.length > 0 || input.claims.length > 0 ? "high" : "limited",
    runtimeMarker,
    productionTruth: sourceOfTruth === "operator_verified_directory",
    auditBacked,
    verificationStatus,
  };
}

function sourceConnectionPriority(status: SourceConnectionStatus | undefined): number {
  switch (status) {
    case "test_failed":
      return 70;
    case "testing":
      return 60;
    case "paused":
    case "revoked":
    case "archived":
      return 50;
    case "active_limited":
    case "active_review_required":
      return 40;
    case "submitted":
      return 30;
    case "draft":
    default:
      return 10;
  }
}

function buildSourceConnectionSummary(input: {
  verifiedMemberships: OrganizationMembership[];
  entitlementSummary: OrganizationDashboardEntitlementSummary;
  cockpits: RegionalAdminCockpitReadModel[];
}): OrganizationDashboardSourceConnectionSummary {
  const productionTruth = isRegionSourceConnectionProductionTruth();
  const hasVerifiedMembership = input.verifiedMemberships.length > 0;
  const hasSourceEntitlement = organizationEntitlementAllowsScope(
    input.entitlementSummary,
    "source_connection",
  );
  const connections = input.cockpits.flatMap((cockpit) =>
    cockpit.sourceConnections.map((connection) => ({
      id: connection.id,
      regionId: connection.regionId,
      regionName: cockpit.region.name,
      label: connection.label,
      sourceTypeLabel: regionSourceConnectionTypeLabel(connection.sourceType),
      status:
        connection.status ??
        (connection.enabled ? "active_review_required" : "draft"),
      statusLabel: sourceConnectionStatusLabel(
        connection.status ??
          (connection.enabled ? "active_review_required" : "draft"),
      ),
      scopeLabel: sourceConnectionScopeLabel(connection.scope ?? "organization_region"),
      latestTestLabel: sourceConnectionTestResultLabel(
        connection.latestTestResult?.status ?? "not_run",
      ),
      latestTestSummary: connection.latestTestResult?.summary ?? null,
      productionTruth: connection.productionTruth,
      reviewRequired: true as const,
      noAutoPublish: true as const,
      noPublicOfficial: true as const,
    })),
  );
  const primaryConnection =
    [...connections].sort(
      (left, right) => sourceConnectionPriority(right.status) - sourceConnectionPriority(left.status),
    )[0] ?? null;

  if (!hasVerifiedMembership) {
    return {
      currentState: "verification_required",
      statusLabel: "Prüfung erforderlich",
      nextStepTitle: "Prüfung erforderlich",
      nextStepBody:
        "Ohne verifizierte Organisation bleibt Quellenarbeit auf sichere Hinweise und den Antrag begrenzt. Produktive Tests oder Verbindungen werden nicht aktiviert.",
      storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
      productionTruth,
      entitlementRequired: true,
      operatorReviewRequired: false,
      connections,
    };
  }

  if (!hasSourceEntitlement && connections.length === 0) {
    return {
      currentState: "not_enabled",
      statusLabel: "Quellenzugang nicht freigeschaltet",
      nextStepTitle: "Quellenzugang nicht freigeschaltet",
      nextStepBody:
        "Ohne Entitlement `source_connection` bleibt der Organisationsbereich bei Antrag und Erklärung. Es gibt keine produktive Quellenverbindung, keinen automatischen Research-Lauf und keine Veröffentlichung.",
      storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
      productionTruth,
      entitlementRequired: true,
      operatorReviewRequired: input.entitlementSummary.operatorDecisionRequired,
      connections,
    };
  }

  if (!primaryConnection) {
    return {
      currentState: "requested",
      statusLabel: "Quelle beantragen",
      nextStepTitle: "Quelle beantragen oder testen",
      nextStepBody:
        "Mit verifizierter Organisation und passendem Scope kann eine explizite Quelle kontrolliert getestet werden. Alles bleibt reviewpflichtig; es gibt kein Auto-Publish und kein automatisches `public_official`.",
      storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
      productionTruth,
      entitlementRequired: !hasSourceEntitlement,
      operatorReviewRequired: false,
      connections,
    };
  }

  switch (primaryConnection.status) {
    case "testing":
      return {
        currentState: "testing",
        statusLabel: "Quelle wird getestet",
        nextStepTitle: "Quelle wird getestet",
        nextStepBody:
          "Der Test bleibt leichtgewichtig: nur Erreichbarkeit, Format und reviewpflichtiger Snapshot. Kein DeepSearch, kein automatischer Research-Lauf und keine Veröffentlichung.",
        storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
        productionTruth,
        entitlementRequired: true,
        operatorReviewRequired: true,
        connections,
      };
    case "test_failed":
      return {
        currentState: "test_failed",
        statusLabel: "Test fehlgeschlagen",
        nextStepTitle: "Test fehlgeschlagen",
        nextStepBody:
          "Die Quelle konnte nicht sauber gelesen werden. Ergänze eine erreichbare URL oder einen manuellen Snapshot; es wurde nichts veröffentlicht und kein Research-Kostenpfad gestartet.",
        storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
        productionTruth,
        entitlementRequired: true,
        operatorReviewRequired: true,
        connections,
      };
    case "paused":
    case "revoked":
    case "archived":
      return {
        currentState: "paused_or_revoked",
        statusLabel: "Quelle pausiert oder gesperrt",
        nextStepTitle: "Quelle pausiert oder gesperrt",
        nextStepBody:
          "Für diese Quelle sind neue Snapshots blockiert. Betreiber oder die zuständige Organisation müssen den Zustand bewusst klären, bevor wieder getestet werden darf.",
        storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
        productionTruth,
        entitlementRequired: true,
        operatorReviewRequired: true,
        connections,
      };
    case "active_limited":
    case "active_review_required":
      return {
        currentState: "active_review_required",
        statusLabel: "Quelle aktiv, aber reviewpflichtig",
        nextStepTitle: "Quelle aktiv, aber reviewpflichtig",
        nextStepBody:
          "Die Quelle darf kontrollierte Snapshots liefern, aber nichts mutiert automatisch Topic, Dossier oder Veröffentlichung. Review bleibt Pflicht, `public_official` bleibt getrennt.",
        storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
        productionTruth,
        entitlementRequired: true,
        operatorReviewRequired: true,
        connections,
      };
    case "submitted":
    case "draft":
    default:
      return {
        currentState: "requested",
        statusLabel: "Quelle beantragt",
        nextStepTitle: "Quelle beantragt",
        nextStepBody:
          "Die Quelle ist erfasst, aber noch nicht produktiv freigeschaltet. Ohne passende Freigabe bleibt sie bei sicherem Antrag, Review-Hinweisen und manueller Prüfung.",
        storeLabel: productionTruth ? "Persistenter Source-Store" : "Lokaler/In-Memory-Fallback",
        productionTruth,
        entitlementRequired: true,
        operatorReviewRequired: true,
        connections,
      };
  }
}

function buildOrganizationMaterialIntakeSummary(input: {
  verifiedMemberships: OrganizationMembership[];
  entitlementSummary: OrganizationDashboardEntitlementSummary;
  materialRecords: MaterialIntakeRecord[];
}): MaterialIntakeDashboardSummary {
  return buildMaterialIntakeDashboardSummary({
    hasVerifiedMembership: input.verifiedMemberships.length > 0,
    hasProductiveEntitlement: organizationEntitlementAllowsScope(
      input.entitlementSummary,
      "dossier_studio",
    ),
    productionTruth: input.materialRecords.some((record) => record.metadataPersisted),
    materialItems: input.materialRecords.map((record) => record.intakeItem),
  });
}

function buildClaimOnlyRegionSummaries(params: {
  claims: OrganizationClaim[];
  regionMap: Map<string, Region>;
  existingRegionIds: Set<string>;
}): OrganizationDashboardRegionSummary[] {
  return params.claims
    .filter((claim) => {
      const regionId = String(claim.regionId ?? "").trim();
      return regionId && !params.existingRegionIds.has(regionId);
    })
    .map((claim) => ({
      regionId: String(claim.regionId ?? "").trim(),
      regionName: regionNameForId(params.regionMap, claim.regionId),
      source: "organization_claim" as const,
      verificationStatus: "self_declared" as const,
      dashboardAccess: false,
      roleLabel: claim.roleLabel ?? null,
      entitlementStatus: null,
      entitlementReason: "self_declared_only" as const,
      entitlementPlanLabel: null,
    }));
}

function buildStartingPoint(entry: {
  cockpit: RegionalAdminCockpitReadModel;
  regionName: string;
}): OrganizationDashboardStartingPoint {
  const openQuestions = uniqueNonEmpty([
    ...entry.cockpit.suggestedDossiers.flatMap((item) => item.openQuestions),
    ...entry.cockpit.suggestedAnlassraeume.flatMap((item) => item.openQuestions),
    ...entry.cockpit.topicClusters.flatMap((item) => item.openQuestions),
  ]).slice(0, 5);

  return {
    regionId: entry.cockpit.region.id,
    regionName: entry.regionName,
    summary: entry.cockpit.cockpit.modules.themenlage.summary,
    topicClusters: entry.cockpit.topicClusters.map((item) => item.label).slice(0, 4),
    openQuestions,
    sourceStatus: entry.cockpit.intelligenceSourceStatus.overallLabel,
    productiveSourceStatus: entry.cockpit.intelligenceSourceStatus.productiveLabel,
    curatedSourceStatus: entry.cockpit.intelligenceSourceStatus.curatedLabel,
    manualSourceStatus: entry.cockpit.intelligenceSourceStatus.manualLabel,
    weightingLabel: entry.cockpit.intelligenceWeighting.label,
    sourcesCount: entry.cockpit.intelligenceSources.reduce(
      (sum, source) => sum + source.matchedSourceCount,
      0,
    ),
    dossierSuggestionCount: entry.cockpit.suggestedDossiers.length,
    anlassraumSuggestionCount: entry.cockpit.suggestedAnlassraeume.length,
    reviewSuggestionCount: entry.cockpit.intelligenceReviewSuggestions.length,
    reviewSuggestionLabels: entry.cockpit.intelligenceReviewSuggestions
      .map((suggestion) => suggestion.title)
      .slice(0, 4),
  };
}

function draftHref(record: RegionSignalDraftRecord): string {
  if (record.draftType === "dossier") return `/dossier/${record.draftId}/studio`;
  return `/runden?view=active&anlassraumId=${encodeURIComponent(record.draftId)}`;
}

function buildDraftSummaries(params: {
  records: RegionSignalDraftRecord[];
  regionMap: Map<string, Region>;
}): OrganizationDashboardDraftSummary[] {
  return params.records.map((record) => ({
    draftId: record.draftId,
    draftType: record.draftType,
    regionId: record.regionId,
    regionName: regionNameForId(params.regionMap, record.regionId),
    title: record.title,
    summary: record.summary,
    reviewStatus: record.reviewStatus,
    visibilityState: record.visibilityState,
    createdByRole: record.createdByRole,
    href: draftHref(record),
  }));
}

function buildParticipationSignals(params: {
  cockpits: RegionalAdminCockpitReadModel[];
  regionMap: Map<string, Region>;
}): OrganizationDashboardParticipationSignal[] {
  return params.cockpits.flatMap((cockpit) =>
    cockpit.participationSignals.slice(0, 4).map((signal) => ({
      id: signal.id,
      regionId: cockpit.region.id,
      regionName: regionNameForId(params.regionMap, cockpit.region.id),
      title: signal.title,
      summary: signal.summary,
      sourceType: signal.sourceType,
      visibilityState: signal.visibilityState,
    })),
  );
}

function firstRunStatusLabel(status: OrganizationFirstRunStepStatus) {
  switch (status) {
    case "available":
      return "Verfügbar";
    case "done":
      return "Erledigt";
    case "needs_review":
      return "In Prüfung";
    case "optional":
      return "Optional";
    case "locked":
    default:
      return "Gesperrt";
  }
}

function hasPublicVisibility(
  visibilityState: RegionPublicationVisibilityState | null | undefined,
) {
  return (
    visibilityState === "public_unverified" ||
    visibilityState === "public_reviewed" ||
    visibilityState === "public_official"
  );
}

function buildPublishSummary(
  openReviewItems: OrganizationDashboardReviewItem[],
): OrganizationDashboardPublishSummary {
  const items = openReviewItems.flatMap((item) =>
    (item.contentReleaseWorkbench?.targets ?? [])
      .filter((target) => target.prepared)
      .map((target) => ({
        itemId: item.id,
        targetType: target.targetType,
        targetLabel: target.targetLabel,
        regionName: item.regionName,
        title: target.suggestedTitle,
        statusLabel: target.statusLabel,
        visibilityState: target.visibilityState,
        previewHref: target.previewHref,
        publicHref: target.publicLink?.href ?? null,
        shareHref: target.publicLink?.shareHref ?? null,
        qrHref: target.publicLink?.qrHref ?? null,
        archived: target.visibilityState === "archived",
      })),
  );

  return {
    totalPrepared: items.length,
    visibleCount: items.filter((item) => hasPublicVisibility(item.visibilityState)).length,
    shareableCount: items.filter((item) => Boolean(item.publicHref)).length,
    archivedCount: items.filter((item) => item.archived).length,
    items,
  };
}

function buildOrganizationFirstRun(input: {
  primaryOrganizationId: string | null;
  hasPendingClaim: boolean;
  hasVerifiedMembership: boolean;
  hasReadableRegion: boolean;
  hasSelectedRegion: boolean;
  hasEntitlement: boolean;
  firstRegionId: string | null;
  openReviewItems: OrganizationDashboardReviewItem[];
  dossierDrafts: OrganizationDashboardDraftSummary[];
  anlassraumDrafts: OrganizationDashboardDraftSummary[];
}): OrganizationFirstRunReadModel {
  const firstRegionHref = input.firstRegionId
    ? `/admin/region?regionId=${encodeURIComponent(input.firstRegionId)}`
    : "/account/organization";
  const sourceWorkbenchItems = input.openReviewItems.filter(
    (item) =>
      item.domain === "region_source_result" ||
      item.domain === "create_handoff" ||
      item.domain === "region_signal_draft",
  );
  const hasSourceStart = sourceWorkbenchItems.some(
    (item) =>
      item.domain === "region_source_result" ||
      item.domain === "create_handoff",
  );
  const hasDossierPreparationPath =
    input.dossierDrafts.length > 0 ||
    input.openReviewItems.some((item) =>
      item.contentReleaseWorkbench?.targets.some((target) => target.targetType === "dossier"),
    );
  const hasAnlassraumPreparationPath =
    input.anlassraumDrafts.length > 0 ||
    input.openReviewItems.some((item) =>
      item.contentReleaseWorkbench?.targets.some((target) => target.targetType === "anlassraum"),
    );
  const hasPreparedVisibilityPath =
    input.dossierDrafts.some((draft) => hasPublicVisibility(draft.visibilityState)) ||
    input.anlassraumDrafts.some((draft) => hasPublicVisibility(draft.visibilityState)) ||
    input.openReviewItems.some((item) => hasPublicVisibility(item.visibilityState));
  const needsVisibilityReview = input.openReviewItems.some(
    (item) => item.visibilityState === "public_unverified",
  );

  const steps: OrganizationFirstRunStep[] = [
    {
      id: "organization",
      title: "Organisation anmelden",
      description:
        "Organisation, Rolle und Grunddaten vollständig hinterlegen. Ohne das bleibt der Einstieg auf Status und Antrag begrenzt.",
      status: input.hasVerifiedMembership
        ? "done"
        : input.hasPendingClaim || input.primaryOrganizationId
          ? "needs_review"
          : "available",
      statusLabel: firstRunStatusLabel(
        input.hasVerifiedMembership
          ? "done"
          : input.hasPendingClaim || input.primaryOrganizationId
            ? "needs_review"
            : "available",
      ),
      ctas: [
        {
          id: "complete-organization",
          label: "Organisation vervollständigen",
          href: "/account/organization",
        },
      ],
    },
    {
      id: "region",
      title: "Region wählen",
      description:
        "Region bewusst auswählen oder im Antrag bestätigen, damit eigene regionale Arbeitsstände sauber getrennt bleiben.",
      status: input.hasSelectedRegion
        ? input.hasVerifiedMembership
          ? "done"
          : "needs_review"
        : input.hasPendingClaim || input.primaryOrganizationId
          ? "available"
          : "locked",
      statusLabel: firstRunStatusLabel(
        input.hasSelectedRegion
          ? input.hasVerifiedMembership
            ? "done"
            : "needs_review"
          : input.hasPendingClaim || input.primaryOrganizationId
            ? "available"
            : "locked",
      ),
      ctas: [
        {
          id: "choose-region",
          label: "Region auswählen",
          href: "/account/organization",
        },
      ],
    },
    {
      id: "status",
      title: "Freischaltung verstehen",
      description:
        "Freischaltung zeigt den Arbeitszugang, nicht Checkout oder Payment. Sichtbarkeit und Veröffentlichung bleiben davon getrennt reviewpflichtig.",
      status: input.hasEntitlement
        ? "done"
        : input.hasSelectedRegion
          ? input.hasVerifiedMembership
            ? "available"
            : "needs_review"
          : "locked",
      statusLabel: firstRunStatusLabel(
        input.hasEntitlement
          ? "done"
          : input.hasSelectedRegion
            ? input.hasVerifiedMembership
              ? "available"
              : "needs_review"
            : "locked",
      ),
      ctas: [
        {
          id: "understand-status",
          label: "Freischaltung/Status verstehen",
          href: "/account/organization/dashboard#freischaltung",
        },
      ],
    },
    {
      id: "source",
      title: "Quelle oder Snapshot starten",
      description:
        "Explizite Quelle kontrolliert auswerten oder ein Beispiel-Snapshot laden. Kein Live-Crawler, kein Scraping und keine automatische Veröffentlichung.",
      status: hasSourceStart
        ? "done"
        : input.hasReadableRegion
          ? "available"
          : input.hasSelectedRegion
            ? "needs_review"
            : "locked",
      statusLabel: firstRunStatusLabel(
        hasSourceStart
          ? "done"
          : input.hasReadableRegion
            ? "available"
            : input.hasSelectedRegion
              ? "needs_review"
              : "locked",
      ),
      ctas: [
        {
          id: "evaluate-source",
          label: "Quelle auswerten",
          href: `${firstRegionHref}#source-results`,
        },
        {
          id: "load-example-snapshot",
          label: "Beispiel-Snapshot laden",
          href: `${firstRegionHref}#source-results`,
        },
      ],
    },
    {
      id: "review",
      title: "Erste Review-Aufgaben sehen",
      description:
        "Eigene reviewpflichtige Arbeitsstände erscheinen erst im passenden Scope. Unverified oder Pending sehen keine fremden Reviewdaten.",
      status: input.openReviewItems.length > 0
        ? "needs_review"
        : input.hasReadableRegion
          ? "available"
          : input.hasSelectedRegion
            ? "needs_review"
            : "locked",
      statusLabel: firstRunStatusLabel(
        input.openReviewItems.length > 0
          ? "needs_review"
          : input.hasReadableRegion
            ? "available"
            : input.hasSelectedRegion
              ? "needs_review"
              : "locked",
      ),
      ctas: [
        {
          id: "open-review-queue",
          label: "Review Queue öffnen",
          href: "/account/organization/dashboard#aufgaben",
        },
      ],
    },
    {
      id: "dossier",
      title: "Dossier vorbereiten",
      description:
        "Aus reviewpflichtigen Vorschlägen oder bestehenden Arbeitsständen bewusst einen Dossier-Entwurf weiterführen.",
      status: input.dossierDrafts.length > 0
        ? "done"
        : hasDossierPreparationPath
          ? "available"
          : input.hasReadableRegion
            ? "optional"
            : "locked",
      statusLabel: firstRunStatusLabel(
        input.dossierDrafts.length > 0
          ? "done"
          : hasDossierPreparationPath
            ? "available"
            : input.hasReadableRegion
              ? "optional"
              : "locked",
      ),
      ctas: [
        {
          id: "prepare-dossier",
          label: "Dossier vorbereiten",
          href:
            input.dossierDrafts[0]?.href ??
            "/account/organization/dashboard#aufgaben",
        },
      ],
    },
    {
      id: "anlassraum",
      title: "Anlassraum vorbereiten",
      description:
        "Anlassraum bleibt Gesprächsraum mit Review-Grenzen. Ein Entwurf entsteht nur über einen bewussten Schritt.",
      status: input.anlassraumDrafts.length > 0
        ? "done"
        : hasAnlassraumPreparationPath
          ? "available"
          : input.hasReadableRegion
            ? "optional"
            : "locked",
      statusLabel: firstRunStatusLabel(
        input.anlassraumDrafts.length > 0
          ? "done"
          : hasAnlassraumPreparationPath
            ? "available"
            : input.hasReadableRegion
              ? "optional"
              : "locked",
      ),
      ctas: [
        {
          id: "prepare-anlassraum",
          label: "Anlassraum vorbereiten",
          href:
            input.anlassraumDrafts[0]?.href ??
            "/account/organization/dashboard#aufgaben",
        },
      ],
    },
    {
      id: "visibility",
      title: "Sichtbarkeit vorbereiten",
      description:
        "Sichtbarkeit bleibt ein bewusster Review-Schritt. Kein Auto-Publish, kein automatisches public_official und keine automatische amtliche Antwort.",
      status: hasPreparedVisibilityPath
        ? needsVisibilityReview
          ? "needs_review"
          : "done"
        : hasDossierPreparationPath || hasAnlassraumPreparationPath
          ? "available"
          : input.hasReadableRegion
            ? "optional"
            : "locked",
      statusLabel: firstRunStatusLabel(
        hasPreparedVisibilityPath
          ? needsVisibilityReview
            ? "needs_review"
            : "done"
          : hasDossierPreparationPath || hasAnlassraumPreparationPath
            ? "available"
            : input.hasReadableRegion
              ? "optional"
              : "locked",
      ),
      ctas: [
        {
          id: "prepare-visibility",
          label: "Sichtbarkeit vorbereiten",
          href: "/account/organization/dashboard#aufgaben",
        },
      ],
    },
  ];

  return {
    intro:
      "Der Organisationsbereich führt review-first durch Region, Freischaltung, Quelle oder Snapshot, erste Review-Aufgaben sowie Dossier-, Anlassraum- und Sichtbarkeitsschritte.",
    steps,
  };
}

function buildNextActions(params: {
  pendingClaims: OrganizationClaim[];
  hasVerifiedMembership: boolean;
  hasReadableRegion: boolean;
  hasEntitlement: boolean;
  canApprovePublication: boolean;
  dossierDrafts: OrganizationDashboardDraftSummary[];
  anlassraumDrafts: OrganizationDashboardDraftSummary[];
  regionalStartingPoints: OrganizationDashboardStartingPoint[];
  participationSignals: OrganizationDashboardParticipationSignal[];
  publishSummary: OrganizationDashboardPublishSummary;
  socialDistributionSummary: OrganizationDashboardSocialDistributionSummary;
}): OrganizationDashboardNextAction[] {
  const actions: OrganizationDashboardNextAction[] = [];

  if (params.pendingClaims.length > 0 || !params.hasVerifiedMembership) {
    actions.push({
      id: "complete_claim",
      label: "Organisationsantrag vervollständigen",
      description: "Prüfe Antrag, Region und Rollenangabe oder warte auf Review.",
      href: "/account/organization",
    });
  }

  if (!params.hasEntitlement) {
    actions.push({
      id: "request_entitlement",
      label: "Freischaltung anfragen",
      description: "Ohne aktive Freischaltung bleibt der Organisationsbereich auf Status und nächste Schritte begrenzt.",
      href: "#freischaltung",
    });
  }

  if (params.hasReadableRegion) {
    actions.push({
      id: "open_region",
      label: "Region öffnen",
      description: "Prüfe die zugeordneten Regionen und was deine Organisation dort bereits sehen darf.",
      href: "#regionen",
    });
  }

  if (params.regionalStartingPoints.length > 0) {
    actions.push({
      id: "review_starting_point",
      label: "Startlage prüfen",
      description: "KI-vorqualifizierte und kuratierte Startlage auf Themencluster, offene Fragen und Quellenstatus prüfen.",
      href: "#startlage",
    });
  }

  if (
    params.canApprovePublication &&
    params.hasReadableRegion
  ) {
    actions.push({
      id: "review_official_release",
      label: "Amtliche Freigabe prüfen",
      description: "`public_official` bleibt ein expliziter menschlicher Freigabeschritt und wird nie automatisch vergeben.",
      href: "/admin/region",
    });
  }

  if (params.dossierDrafts.length > 0) {
    actions.push({
      id: "edit_dossier_draft",
      label: "Dossier-Draft bearbeiten",
      description: "Bestehenden reviewpflichtigen Dossier-Entwurf weiterführen.",
      href: params.dossierDrafts[0]?.href ?? "#dossiers",
    });
  }

  if (params.anlassraumDrafts.length > 0) {
    actions.push({
      id: "share_anlassraum",
      label: "Anlassraum teilen",
      description: "Bestehenden Anlassraum als öffentlichen Gesprächsraum weiterführen oder teilen.",
      href: params.anlassraumDrafts[0]?.href ?? "/runden",
    });
  }

  if (params.publishSummary.totalPrepared > 0 && params.publishSummary.visibleCount === 0) {
    actions.push({
      id: "review_publish_preview",
      label: "Veröffentlichung prüfen",
      description: "Vorschau, Sichtbarkeit und Review-Status im Content-Release-Workbench bewusst prüfen.",
      href: "#veroeffentlichung",
    });
  }

  if (params.publishSummary.shareableCount > 0) {
    actions.push({
      id: "share_visible_content",
      label: "Öffentlichen Link teilen",
      description: "Sichtbare Inhalte haben jetzt eine öffentliche URL, Share-Link und bei Bedarf einen QR-Pfad.",
      href: "#veroeffentlichung",
    });
  }

  if (params.socialDistributionSummary.items.length > 0) {
    actions.push({
      id: "review_distribution",
      label: "Verteilentwürfe prüfen",
      description:
        "Kanalweise Entwürfe bleiben review-first. Freigabe und manuelles Published-Marking sind getrennte Schritte.",
      href: "#social-distribution",
    });
  }

  return actions;
}

function buildSocialDistributionSummary(input: {
  items: SocialDistributionPost[];
}) : OrganizationDashboardSocialDistributionSummary {
  const items = input.items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    statusLabel: socialDistributionStatusLabel(item.status),
    channels: item.channels.map((channel) => String(channel)),
    sourceState: item.sourceState,
    sourceVisibilityState: item.sourceVisibilityState,
    approvalRequired: item.approval.reviewRequired,
    sealGranted: item.assets.some((asset) => asset.sealGranted),
    updatedAt: item.updatedAt,
  }));

  if (items.length === 0) {
    return {
      currentState: "not_enabled",
      statusLabel: "Keine Verteilentwürfe aktiv",
      nextStepTitle: "Review-first Verteilung startet erst nach Freigabe",
      nextStepBody:
        "Social Publishing bleibt im v1-Pfad kanalweiser Entwurf mit Review, Audit und manuellem Published-Marking. Ohne freigegebenen Kontext entsteht kein produktiver Draft.",
      storeLabel: shouldUseInMemoryMongoFallback()
        ? "In-Memory-/Test-Fallback"
        : "Persistente Distribution-Runtime",
      productionTruth: !shouldUseInMemoryMongoFallback(),
      reviewRequired: true,
      items,
    };
  }

  const primary = items[0]!;

  return {
    currentState:
      primary.status === "archived"
        ? "archived"
        : primary.status === "blocked"
          ? "blocked"
          : primary.status === "copied"
            ? "copied"
            : primary.status === "exported"
              ? "exported"
              : primary.status === "scheduled_ready"
                ? "scheduled_ready"
                : primary.status === "queued"
                  ? "queued"
                  : primary.status === "approved"
                    ? "approved"
                    : primary.status === "review_requested"
                      ? "review_requested"
                      : "needs_review",
    statusLabel: socialDistributionStatusLabel(primary.status),
    nextStepTitle:
      primary.status === "approved"
        ? "Queue, Export oder Planung bewusst wählen"
        : primary.status === "queued"
          ? "Zeitfenster und Kanalreihenfolge festlegen"
          : primary.status === "scheduled_ready"
            ? "Interne Planung dokumentieren"
            : primary.status === "exported" || primary.status === "copied"
              ? "Manuelle Weitergabe sauber nachhalten"
              : "Review und Kanalentscheidung stehen an",
    nextStepBody:
      primary.sourceState === "review_only"
        ? "Der zugrunde liegende Kontext ist noch review-only. Deshalb bleibt Verteilung auf sichere Entwurfs- und Nächste-Schritte-Hinweise begrenzt."
        : "Freigabe heißt nicht veröffentlicht. Queue-, Export- und Planungsstatus bleiben getrennt, auditierbar und ohne externes API-Posting.",
    storeLabel: shouldUseInMemoryMongoFallback()
      ? "In-Memory-/Test-Fallback"
      : "Persistente Distribution-Runtime",
    productionTruth: !shouldUseInMemoryMongoFallback(),
    reviewRequired: items.some((item) => item.approvalRequired),
    items,
  };
}

export async function buildOrganizationDashboardReadModel(input: {
  userId: string;
  roles: string[];
  isAdmin: boolean;
  actorRole?: string | null;
}): Promise<OrganizationDashboardReadModel> {
  const repo = getRegionOrganizationRuntimeRepo();
  const entitlementRepo = getRegionEntitlementRuntimeRepo();
  const socialDistributionRepo = getSocialDistributionRepo();
  const [claims, memberships, draftRecords, regions] = await Promise.all([
    repo.listOrganizationClaimsForUser(input.userId),
    repo.listMembershipsForUser(input.userId),
    listRegionSignalDraftRecords(),
    listOperationalRegions(),
  ]);

  const organizations = await repo.listOrganizationsByIds(memberships.map((membership) => membership.organizationId));
  const regionMap = new Map(regions.map((region) => [region.id, clone(region)]));
  const pendingClaims = buildPendingClaims(claims);
  const activeMemberships = memberships.filter(isMembershipActive);
  const verifiedMemberships = activeMemberships.filter((membership) =>
    isVerifiedMembershipStatus(membership.verificationStatus),
  );
  const primaryOrganization = pickPrimaryOrganization({ organizations, memberships: activeMemberships, claims });
  const verifiedRegionIds = uniqueNonEmpty(
    verifiedMemberships.map((membership) => membership.regionId).concat(
      organizations
        .filter((organization) =>
          verifiedMemberships.some((membership) => membership.organizationId === organization.id),
        )
        .map((organization) => organization.primaryRegionId),
    ),
  );

  const actorRole =
    input.actorRole?.trim() ||
    activeMemberships.sort(
      (left, right) => verificationRank(right.verificationStatus) - verificationRank(left.verificationStatus),
    )[0]?.roleType ||
    activeMemberships[0]?.roleLabel ||
    (input.isAdmin ? "admin" : "organization_member");

  const regionContexts = await Promise.all(
    verifiedRegionIds.map(async (regionId) => {
      const accessContext = await buildPersistedRegionAccessContext({
        userId: input.userId,
        actorRole,
        isAdmin: input.isAdmin,
        roles: input.roles,
        organizationIds: organizations.map((organization) => organization.id),
        regionId,
      });
      const region = await getOperationalRegionById(regionId);
      const dashboardAccess = region ? canReadRegionDashboard(accessContext, region.id) : false;
      const cockpit =
        region && dashboardAccess
          ? await getRegionalAdminCockpitReadModel(region.id, { accessContext })
          : null;
      return {
        regionId,
        region,
        accessContext,
        dashboardAccess,
        cockpit,
      };
    }),
  );

  const entitlements = (
    await Promise.all(
      organizations.map((organization) => entitlementRepo.getEntitlementsForOrganization(organization.id)),
    )
  ).flatMap((entries) => entries);
  const [entitlementAuditEvents, pricingOrders] = primaryOrganization
    ? await Promise.all([
        entitlementRepo.listEntitlementAuditEventsForOrganization(primaryOrganization.id),
        listPricingOrdersForOrganizationRuntime({
          organizationId: primaryOrganization.id,
          organizationName: primaryOrganization.name,
          limit: 100,
        }),
      ])
    : [[], []];
  const primaryOrganizationEntitlements = primaryOrganization
    ? entitlements.filter((entry) => entry.organizationId === primaryOrganization.id)
    : entitlements;
  const contractSummary = buildOrganizationContractSummary({
    organization: primaryOrganization,
    entitlements: primaryOrganizationEntitlements,
    entitlementAuditEvents,
    pricingOrders,
  });
  const partnerPackageSummary = buildOrganizationPartnerPackageSummary({
    contractSummary,
    pricingOrders,
  });

  const regionSummary: OrganizationDashboardRegionSummary[] = [
    ...regionContexts
      .filter((entry) => entry.region)
      .map((entry) => {
        const matchingMembership =
          verifiedMemberships.find((membership) => membership.regionId === entry.regionId) ??
          verifiedMemberships.find((membership) => membership.organizationId === primaryOrganization?.id);
        return {
          regionId: entry.regionId,
          regionName: entry.region?.name ?? entry.regionId,
          source: "verified_membership" as const,
          verificationStatus: matchingMembership?.verificationStatus ?? "organization_verified",
          dashboardAccess: entry.dashboardAccess,
          roleLabel: matchingMembership?.roleLabel ?? null,
          entitlementStatus: entry.accessContext.organization.entitlementStatus,
          entitlementReason: entry.accessContext.organization.entitlementReason,
          entitlementPlanLabel: entry.accessContext.organization.entitlementPlanLabel,
        };
      }),
    ...buildClaimOnlyRegionSummaries({
      claims: pendingClaims,
      regionMap,
      existingRegionIds: new Set(regionContexts.map((entry) => entry.regionId)),
    }),
  ];

  const readableCockpits = regionContexts
    .map((entry) => entry.cockpit)
    .filter((entry): entry is RegionalAdminCockpitReadModel => Boolean(entry));

  const regionalStartingPoints = readableCockpits.map((cockpit) =>
    buildStartingPoint({
      cockpit,
      regionName: cockpit.region.name,
    }),
  );

  const participationSignals = buildParticipationSignals({
    cockpits: readableCockpits,
    regionMap,
  });

  const verificationStatus = resolveHighestVerificationStatus({
    memberships: activeMemberships,
    claims,
    isAdmin: input.isAdmin,
  });
  const provisioningSummary = buildProvisioningSummary({
    claims,
    memberships: activeMemberships,
    verifiedMemberships,
  });
  const directorySummary = buildDirectorySummary({
    isAdmin: input.isAdmin,
    claims,
    memberships: activeMemberships,
  });
  const allowedActions = uniqueNonEmpty([
    ...(input.isAdmin ? REGION_ALLOWED_ACTIONS : []),
    ...activeMemberships.flatMap((membership) => membership.allowedActions),
    ...regionContexts.flatMap((entry) => entry.accessContext.allowedActions),
  ]) as RegionAllowedAction[];
  const organizationScope = buildOrganizationScopeContext({
    userId: input.userId,
    isAdmin: input.isAdmin,
    organizationIds: organizations.map((organization) => organization.id),
    primaryOrganizationId: primaryOrganization?.id ?? null,
    status:
      input.isAdmin
        ? "admin_fallback"
        : verifiedMemberships.length > 0
          ? "verified_membership"
          : "pending_or_unverified",
  });
  const visibleRegionIds = regionContexts
    .filter((entry) => entry.dashboardAccess)
    .map((entry) => entry.regionId);
  const regionScope = buildRegionScopeContext({
    userId: organizationScope.userId,
    isAdmin: organizationScope.isAdmin,
    organizationIds: organizationScope.organizationIds,
    primaryOrganizationId: organizationScope.primaryOrganizationId,
    status: organizationScope.status,
    visibleRegionIds,
    canApproveOfficial: allowedActions.includes("approve_publication"),
  });
  const entitlementSummary = buildEntitlementSummary(
    {
      organization: primaryOrganization,
      claims,
      verifiedMemberships,
      entitlements: primaryOrganizationEntitlements,
      auditEvents: entitlementAuditEvents,
      contractSummary,
    },
  );
  const sourceConnectionSummary = buildSourceConnectionSummary({
    verifiedMemberships,
    entitlementSummary,
    cockpits: readableCockpits,
  });
  const materialRecords = await listMaterialIntakeRecords({
    organizationIds: organizations.map((organization) => organization.id),
    actorId: verifiedMemberships.length > 0 ? null : input.userId,
    limit: 20,
  });
  const materialIntakeSummary = buildOrganizationMaterialIntakeSummary({
    verifiedMemberships,
    entitlementSummary,
    materialRecords,
  });
  const socialDistributionSummary = buildSocialDistributionSummary({
    items: await socialDistributionRepo.listPostsByOrganizationIds(
      organizations.map((organization) => organization.id),
    ),
  });
  const visibleDrafts = draftRecords.filter((record) =>
    canViewRegionResource(regionScope, {
      ownerUserId: record.createdByUserId,
      regionId: record.regionId,
    }),
  );
  const dossierDrafts = buildDraftSummaries({
    records: visibleDrafts.filter((record) => record.draftType === "dossier"),
    regionMap,
  });
  const anlassraumDrafts = buildDraftSummaries({
    records: visibleDrafts.filter((record) => record.draftType === "anlassraum"),
    regionMap,
  });
  const reviewQueue = await buildReviewQueueReadModel({
    mode: regionScope.mode,
    userId: input.userId,
    isAdmin: input.isAdmin,
    visibleRegionIds: regionScope.visibleRegionIds,
    organizationIds: regionScope.organizationIds,
    primaryOrganizationId: regionScope.primaryOrganizationId,
    status: regionScope.status,
    canApproveOfficial: regionScope.canApproveOfficial,
    governanceActor: input.isAdmin
      ? {
          userId: input.userId,
          role: "admin",
          isAdmin: true,
          scopedOwnerIds: uniqueNonEmpty([
            input.userId,
            ...organizations.map((organization) => organization.id),
          ]),
          scopedEntityIds: uniqueNonEmpty([
            input.userId,
            ...organizations.map((organization) => organization.id),
          ]),
          personTrust: null,
        }
      : null,
  });
  const queriedUnifiedAuditTrail = (
    await listUnifiedAuditEvents({
      scope: regionScope,
      itemIds: reviewQueue.items.map((item) => item.id),
      itemResources: Object.fromEntries(
        reviewQueue.items.map((item) => [
          item.id,
          {
            organizationId: item.organizationId,
            regionId: item.regionId,
            ownerUserId: item.ownerUserId,
          },
        ]),
      ),
      limit: 6,
    })
  ).events;
  const recentUnifiedAuditTrail =
    queriedUnifiedAuditTrail.length > 0
      ? queriedUnifiedAuditTrail
      : sortRecentAuditTrail(
          reviewQueue.items.flatMap((item) => item.unifiedAuditTrail ?? []),
          6,
        );
  const openReviewItems = attachModerationPermission({
    items: reviewQueue.items,
    scope: regionScope,
    verificationStatus,
    allowedActions,
  });
  const firstRun = buildOrganizationFirstRun({
    primaryOrganizationId: primaryOrganization?.id ?? null,
    hasPendingClaim: pendingClaims.length > 0,
    hasVerifiedMembership: verifiedMemberships.length > 0,
    hasReadableRegion:
      readableCockpits.length > 0 ||
      regionSummary.some((entry) => entry.dashboardAccess),
    hasSelectedRegion: regionSummary.length > 0,
    hasEntitlement:
      entitlementSummary.hasActiveEntitlement || entitlementSummary.hasTrialEntitlement,
    firstRegionId:
      readableCockpits[0]?.region.id ??
      regionSummary.find((entry) => entry.dashboardAccess)?.regionId ??
      regionSummary[0]?.regionId ??
      null,
    openReviewItems,
    dossierDrafts,
    anlassraumDrafts,
  });
  const publishSummary = buildPublishSummary(openReviewItems);
  const nextActions = buildNextActions({
    pendingClaims,
    hasVerifiedMembership: verifiedMemberships.length > 0,
    hasReadableRegion: readableCockpits.length > 0 || regionSummary.some((entry) => entry.source === "verified_membership"),
    hasEntitlement: entitlementSummary.hasActiveEntitlement || entitlementSummary.hasTrialEntitlement,
    canApprovePublication: allowedActions.includes("approve_publication"),
    dossierDrafts,
    anlassraumDrafts,
    regionalStartingPoints,
    participationSignals,
    publishSummary,
    socialDistributionSummary,
  });

  return {
    organization: {
      primaryOrganizationId: primaryOrganization?.id ?? null,
      name:
        primaryOrganization?.name ??
        pendingClaims[0]?.organizationName ??
        null,
      organizations: organizations.map((organization) => clone(organization)),
      roleLabel: toRoleLabel(activeMemberships, input.isAdmin),
      isOperatorMode: input.isAdmin,
    },
    organizationType:
      primaryOrganization?.type ??
      pendingClaims[0]?.organizationType ??
      null,
    verificationStatus,
    membershipStatus: {
      totalMemberships: activeMemberships.length,
      verifiedMemberships: verifiedMemberships.length,
      pendingClaims: pendingClaims.length,
      highestVerificationStatus: verificationStatus,
    },
    directorySummary,
    provisioningSummary,
    contractSummary,
    partnerPackageSummary,
    materialIntakeSummary,
    sourceConnectionSummary,
    socialDistributionSummary,
    regionSummary,
    entitlementSummary,
    allowedActions,
    pendingOrganizationClaims: pendingClaims,
    verifiedMemberships: verifiedMemberships.map((membership) => clone(membership)),
    firstRun,
    openReviewItems,
    reviewQueueSummary: reviewQueue.summary,
    reviewQueueOperationsPersistence: reviewQueue.operationsPersistence,
    contentReleasePersistence: reviewQueue.contentReleasePersistence,
    recentUnifiedAuditTrail,
    regionalStartingPoints,
    dossierDrafts,
    anlassraumDrafts,
    participationSignals,
    publishSummary,
    nextActions,
    guardrails: DASHBOARD_GUARDRAILS,
  };
}
