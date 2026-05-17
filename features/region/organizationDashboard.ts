import {
  REGION_ALLOWED_ACTIONS,
  canReadRegionDashboard,
  type RegionAllowedAction,
  type RegionAccessContext,
} from "./access";
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
  type RegionDashboardOpenReviewItem,
  type RegionalAdminCockpitReadModel,
} from "./store";
import type {
  Organization,
  OrganizationClaim,
  OrganizationMembership,
  OrganizationType,
  VerificationStatus,
} from "./organizationOnboarding";
import {
  buildPersistedRegionAccessContext,
  getRegionOrganizationRuntimeRepo,
} from "./server/membershipRuntime";
import {
  getRegionEntitlementRuntimeRepo,
  type PaidDashboardEntitlement,
} from "./server/paidEntitlements";

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
  state: "aktiv" | "Testzugang" | "fehlt" | "abgelaufen";
  hasActiveEntitlement: boolean;
  hasTrialEntitlement: boolean;
  hasMissingEntitlement: boolean;
  hasExpiredEntitlement: boolean;
  planLabels: string[];
  organizationIds: string[];
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

export type OrganizationDashboardReviewItem = RegionDashboardOpenReviewItem & {
  regionId: string;
  regionName: string;
};

export type OrganizationDashboardStartingPoint = {
  regionId: string;
  regionName: string;
  summary: string;
  topicClusters: string[];
  openQuestions: string[];
  sourceStatus: string;
  sourcesCount: number;
  dossierSuggestionCount: number;
  anlassraumSuggestionCount: number;
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
  regionSummary: OrganizationDashboardRegionSummary[];
  entitlementSummary: OrganizationDashboardEntitlementSummary;
  allowedActions: RegionAllowedAction[];
  pendingOrganizationClaims: OrganizationClaim[];
  verifiedMemberships: OrganizationMembership[];
  openReviewItems: OrganizationDashboardReviewItem[];
  regionalStartingPoints: OrganizationDashboardStartingPoint[];
  dossierDrafts: OrganizationDashboardDraftSummary[];
  anlassraumDrafts: OrganizationDashboardDraftSummary[];
  participationSignals: OrganizationDashboardParticipationSignal[];
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

function isVerifiedMembershipStatus(
  status: OrganizationMembership["verificationStatus"],
): boolean {
  return (
    status === "organization_verified" ||
    status === "unit_verified" ||
    status === "publication_approved"
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
    case "email_verified":
      return 40;
    case "pending_review":
      return 30;
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
  entitlements: PaidDashboardEntitlement[],
  regionContexts: Array<{ accessContext: RegionAccessContext }>,
): OrganizationDashboardEntitlementSummary {
  const active = entitlements.some((entry) => entry.status === "active");
  const trial = entitlements.some((entry) => entry.status === "trial");
  const expired = entitlements.some((entry) =>
    entry.status === "expired" ||
    entry.status === "cancelled" ||
    entry.status === "revoked" ||
    entry.status === "suspended" ||
    entry.status === "past_due",
  );
  const missing = regionContexts.some(
    (entry) =>
      entry.accessContext.organization.entitlementReason === "missing_entitlement" ||
      entry.accessContext.organization.entitlementReason === "not_checked",
  );

  return {
    state: active ? "aktiv" : trial ? "Testzugang" : expired ? "abgelaufen" : "fehlt",
    hasActiveEntitlement: active,
    hasTrialEntitlement: trial,
    hasMissingEntitlement: !active && !trial,
    hasExpiredEntitlement: expired,
    planLabels: uniqueNonEmpty(entitlements.map((entry) => entry.planLabel)),
    organizationIds: uniqueNonEmpty(entitlements.map((entry) => entry.organizationId)),
    guardrails: {
      noPaymentClaim: true,
      noCheckout: true,
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
    sourceStatus:
      entry.cockpit.feedSignals.length > 0 || entry.cockpit.communitySourceHints.length > 0
        ? "Kuratierte Startlage mit reviewpflichtigen Quellenhinweisen vorhanden."
        : "Noch keine kuratierte Startlage vorbereitet.",
    sourcesCount: entry.cockpit.feedSignals.length + entry.cockpit.communitySourceHints.length,
    dossierSuggestionCount: entry.cockpit.suggestedDossiers.length,
    anlassraumSuggestionCount: entry.cockpit.suggestedAnlassraeume.length,
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

function buildNextActions(params: {
  pendingClaims: OrganizationClaim[];
  hasVerifiedMembership: boolean;
  hasReadableRegion: boolean;
  hasEntitlement: boolean;
  dossierDrafts: OrganizationDashboardDraftSummary[];
  anlassraumDrafts: OrganizationDashboardDraftSummary[];
  regionalStartingPoints: OrganizationDashboardStartingPoint[];
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

  return actions;
}

export async function buildOrganizationDashboardReadModel(input: {
  userId: string;
  roles: string[];
  isAdmin: boolean;
  actorRole?: string | null;
}): Promise<OrganizationDashboardReadModel> {
  const repo = getRegionOrganizationRuntimeRepo();
  const entitlementRepo = getRegionEntitlementRuntimeRepo();
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

  const reviewItems = readableCockpits.flatMap((cockpit) =>
    cockpit.openReviewItems.map((item) => ({
      ...item,
      regionId: cockpit.region.id,
      regionName: cockpit.region.name,
    })),
  );

  const draftsVisibleRegionIds = new Set(
    regionContexts
      .filter((entry) => entry.dashboardAccess)
      .map((entry) => entry.regionId),
  );
  const visibleDrafts = draftRecords.filter(
    (record) =>
      draftsVisibleRegionIds.has(record.regionId) ||
      record.createdByUserId === input.userId ||
      input.isAdmin,
  );
  const dossierDrafts = buildDraftSummaries({
    records: visibleDrafts.filter((record) => record.draftType === "dossier"),
    regionMap,
  });
  const anlassraumDrafts = buildDraftSummaries({
    records: visibleDrafts.filter((record) => record.draftType === "anlassraum"),
    regionMap,
  });

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
  const entitlementSummary = buildEntitlementSummary(entitlements, regionContexts);
  const allowedActions = uniqueNonEmpty([
    ...(input.isAdmin ? REGION_ALLOWED_ACTIONS : []),
    ...activeMemberships.flatMap((membership) => membership.allowedActions),
    ...regionContexts.flatMap((entry) => entry.accessContext.allowedActions),
  ]) as RegionAllowedAction[];
  const nextActions = buildNextActions({
    pendingClaims,
    hasVerifiedMembership: verifiedMemberships.length > 0,
    hasReadableRegion: readableCockpits.length > 0 || regionSummary.some((entry) => entry.source === "verified_membership"),
    hasEntitlement: entitlementSummary.hasActiveEntitlement || entitlementSummary.hasTrialEntitlement,
    dossierDrafts,
    anlassraumDrafts,
    regionalStartingPoints,
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
    regionSummary,
    entitlementSummary,
    allowedActions,
    pendingOrganizationClaims: pendingClaims,
    verifiedMemberships: verifiedMemberships.map((membership) => clone(membership)),
    openReviewItems: reviewItems,
    regionalStartingPoints,
    dossierDrafts,
    anlassraumDrafts,
    participationSignals,
    nextActions,
    guardrails: DASHBOARD_GUARDRAILS,
  };
}
