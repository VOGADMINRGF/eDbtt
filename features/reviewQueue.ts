import type { GovernanceActor } from "@features/trust/types";
import {
  getDossierStudioWorkspaceRepo,
  type DossierStudioWorkspace,
} from "@features/dossier/server/studioPersistence";
import {
  buildContentReleaseWorkbenchTargets,
  buildContentReleaseWorkbenchTargetsForCreateHandoff,
  getContentReleasePersistenceState,
  type ContentReleasePersistenceState,
  type ContentReleaseWorkbenchTarget,
} from "@features/contentReleaseWorkbench";
import type { RegionSourceSnapshotTemplateResult } from "./region/sourceConnections";
import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import { listCreatePrepareAttachDraftQueue } from "@/features/create/attachDraftReviewQueue";
import {
  buildPersistedCreateHandoffSummary,
  listPersistedCreateHandoffRecords,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";
import type { Region } from "./region/contracts";
import {
  publicationVisibilityLabel,
  type RegionPublicationVisibilityState,
} from "./region/publicationRiskLadder";
import {
  buildReviewQueueScopeContext,
  canOperateReviewItem,
  canViewRegionResource,
  type ReviewQueueScopeContext,
} from "./region/scope";
import {
  listRegionSignalDraftRecords,
  type RegionSignalDraftRecord,
} from "./region/regionSignalDrafts";
import {
  getRegionalAdminCockpitReadModel,
  listOperationalRegions,
} from "./region/store";
import { listRegionSourceTestResults } from "./region/server/sourceConnectionRuntime";
import {
  listParticipationSignalsForReviewRuntime,
  type RegionParticipationSignalRecord,
} from "./region/server/participationSignalReviewRuntime";
import {
  REVIEW_QUEUE_OPERATION_STATUSES,
  getReviewQueueOperationPersistenceState,
  listReviewQueueOperationAuditEventsForItems,
  listReviewQueueOperationRecords,
  reviewQueueOperationActionLabel,
  reviewQueueOperationalStatusLabel,
  type ReviewQueueOperationAuditEvent,
  type ReviewQueueOperationPersistenceState,
  type ReviewQueueOperationalStatus,
} from "./reviewQueueOperations";
import {
  listUnifiedAuditEvents,
  type UnifiedAuditEvent,
} from "./unifiedAuditReadside";

export const REVIEW_QUEUE_DOMAINS = [
  "participation_signal",
  "anlassraum_public_input",
  "region_intelligence_suggestion",
  "region_source_result",
  "region_signal_draft",
  "dossier_workspace",
  "output_artifact",
  "create_handoff",
  "public_official_approval",
] as const;

export type ReviewQueueDomain = (typeof REVIEW_QUEUE_DOMAINS)[number];

export const REVIEW_QUEUE_STATES = [
  "review_required",
  "region_confirmation_required",
  "draft_review_required",
  "output_review_required",
  "apply_pending",
  "official_approval_required",
] as const;

export type ReviewQueueState = (typeof REVIEW_QUEUE_STATES)[number];

export type ReviewQueueItem = {
  id: string;
  domain: ReviewQueueDomain;
  domainLabel: string;
  workflowState: ReviewQueueState;
  workflowLabel: string;
  title: string;
  summary: string;
  href: string;
  regionId: string | null;
  regionName: string | null;
  organizationId: string | null;
  dossierId: string | null;
  draftId: string | null;
  sourceType: string | null;
  visibilityState: RegionPublicationVisibilityState;
  visibilityLabel: string;
  scopeLabel: string;
  ownerUserId: string | null;
  priorityScore: number;
  priorityBucket: ReviewQueuePriorityBucket;
  priorityLabel: string;
  pendingHours: number;
  operationalStatus: ReviewQueueOperationalStatus;
  operationalStatusLabel: string;
  assignedToUserId: string | null;
  assignedAt: string | null;
  assignedByUserId: string | null;
  noteCount: number;
  latestNote: {
    text: string;
    at: string;
  } | null;
  activityTrail: ReviewQueueActivityEntry[];
  unifiedAuditTrail: UnifiedAuditEvent[];
  createdAt: string;
  updatedAt: string;
  reviewRequired: true;
  publicOfficialCandidate: boolean;
  reviewAuthority:
    | "standard_review"
    | "publication_approved_or_admin"
    | "apply_followup";
  reviewAuthorityLabel: string;
  contentReleaseWorkbench?: {
    intro: string;
    sourceKind: "region_source_result" | "create_handoff";
    sourceId: string;
    targets: ContentReleaseWorkbenchTarget[];
  } | null;
  sourceSnapshotTemplate?: {
    label: string;
    seedKindLabel: string;
    isExampleSeed: boolean;
    reviewHint: string;
  } | null;
};

type ReviewQueueItemCore = Omit<
  ReviewQueueItem,
  | "scopeLabel"
  | "priorityScore"
  | "priorityBucket"
  | "priorityLabel"
  | "pendingHours"
  | "operationalStatus"
  | "operationalStatusLabel"
  | "assignedToUserId"
  | "assignedAt"
  | "assignedByUserId"
  | "noteCount"
  | "latestNote"
  | "activityTrail"
  | "unifiedAuditTrail"
>;

export type ReviewQueueActivityEntry = {
  id: string;
  action: ReviewQueueOperationAuditEvent["action"];
  actionLabel: string;
  byUserId: string;
  at: string;
  note: string | null;
  previousOperationalStatus: ReviewQueueOperationalStatus;
  previousOperationalStatusLabel: string;
  nextOperationalStatus: ReviewQueueOperationalStatus;
  nextOperationalStatusLabel: string;
  previousAssignedToUserId: string | null;
  nextAssignedToUserId: string | null;
};

export type ReviewQueueSummaryEntry = {
  domain: ReviewQueueDomain;
  label: string;
  count: number;
};

export const REVIEW_QUEUE_PRIORITY_BUCKETS = ["high", "medium", "low"] as const;
export type ReviewQueuePriorityBucket = (typeof REVIEW_QUEUE_PRIORITY_BUCKETS)[number];

export const REVIEW_QUEUE_SORTS = ["priority", "newest", "oldest", "type", "region"] as const;
export type ReviewQueueSort = (typeof REVIEW_QUEUE_SORTS)[number];

export type ReviewQueueStatusSummaryEntry = {
  status: ReviewQueueOperationalStatus;
  label: string;
  count: number;
};

export type ReviewQueueFilters = {
  domain: ReviewQueueDomain | "all";
  operationalStatus: ReviewQueueOperationalStatus | "all";
  regionId: string | "all";
  organizationId: string | "all";
  priority: ReviewQueuePriorityBucket | "all";
  assignedToUserId: string | "all" | "unassigned";
  visibilityState: RegionPublicationVisibilityState | "all";
  sort: ReviewQueueSort;
};

export type ReviewQueueFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type ReviewQueueQuery = Partial<ReviewQueueFilters>;

export type ReviewQueueReadModel = {
  items: ReviewQueueItem[];
  operationsPersistence: ReviewQueueOperationPersistenceState;
  contentReleasePersistence: ContentReleasePersistenceState;
  summary: {
    total: number;
    totalBeforeFilters: number;
    officialApprovalCount: number;
    highPriorityCount: number;
    assignedCount: number;
    blockedCount: number;
    readyCount: number;
    byDomain: ReviewQueueSummaryEntry[];
    byOperationalStatus: ReviewQueueStatusSummaryEntry[];
  };
  filters: {
    applied: ReviewQueueFilters;
    options: {
      domains: ReviewQueueFilterOption[];
      statuses: ReviewQueueFilterOption[];
      regions: ReviewQueueFilterOption[];
      organizations: ReviewQueueFilterOption[];
      priorities: ReviewQueueFilterOption[];
      assignees: ReviewQueueFilterOption[];
      visibilities: ReviewQueueFilterOption[];
      sorts: ReviewQueueFilterOption[];
    };
  };
  guardrails: {
    noBulkApprove: true;
    noAutoOfficialClaim: true;
    noAutoPublish: true;
    noAutoDossierFinalization: true;
    noAutoAnlassraumFinalization: true;
  };
};

export type ReviewQueueScope = {
  mode: "global_operator" | "organization";
  userId: string;
  isAdmin: boolean;
  visibleRegionIds: string[];
  organizationIds: string[];
  primaryOrganizationId?: string | null;
  status?: ReviewQueueScopeContext["status"];
  canApproveOfficial: boolean;
  governanceActor?: GovernanceActor | null;
};

const REVIEW_QUEUE_GUARDRAILS: ReviewQueueReadModel["guardrails"] = {
  noBulkApprove: true,
  noAutoOfficialClaim: true,
  noAutoPublish: true,
  noAutoDossierFinalization: true,
  noAutoAnlassraumFinalization: true,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function regionNameFor(regionMap: Map<string, Region>, regionId: string | null | undefined) {
  const normalized = String(regionId ?? "").trim();
  if (!normalized) return null;
  return regionMap.get(normalized)?.name ?? normalized;
}

function reviewLinkForRegion(regionId: string | null | undefined) {
  const normalized = String(regionId ?? "").trim();
  if (!normalized) return "/admin/region";
  return `/admin/region?regionId=${encodeURIComponent(normalized)}`;
}

function draftLinkForRecord(record: RegionSignalDraftRecord) {
  if (record.draftType === "dossier") {
    return `/dossier/${encodeURIComponent(record.draftId)}/studio`;
  }
  return `/runden?view=active&anlassraumId=${encodeURIComponent(record.draftId)}`;
}

function workspaceLink(dossierId: string) {
  return `/dossier/${encodeURIComponent(dossierId)}/studio`;
}

function domainLabelFor(domain: ReviewQueueDomain) {
  switch (domain) {
    case "participation_signal":
      return "Beteiligungssignal";
    case "anlassraum_public_input":
      return "Anlassraum Public Input";
    case "region_intelligence_suggestion":
      return "Region-Intelligence-Vorschlag";
    case "region_source_result":
      return "Quellen-Testresultat";
    case "region_signal_draft":
      return "RegionSignalDraft";
    case "dossier_workspace":
      return "Dossier Studio Workspace";
    case "output_artifact":
      return "Output-/Distribution-Artefakt";
    case "create_handoff":
      return "Create-Handoff";
    case "public_official_approval":
      return "Amtliche Freigabe";
    default:
      return domain;
  }
}

function workflowLabelFor(state: ReviewQueueState) {
  switch (state) {
    case "region_confirmation_required":
      return "Region bestätigen";
    case "draft_review_required":
      return "Entwurf prüfen";
    case "output_review_required":
      return "Output prüfen";
    case "apply_pending":
      return "Apply manuell ausführen";
    case "official_approval_required":
      return "Amtliche Freigabe prüfen";
    case "review_required":
    default:
      return "Review erforderlich";
  }
}

function workflowPriority(state: ReviewQueueState) {
  switch (state) {
    case "official_approval_required":
      return 92;
    case "region_confirmation_required":
      return 84;
    case "output_review_required":
      return 74;
    case "draft_review_required":
      return 68;
    case "review_required":
      return 56;
    case "apply_pending":
      return 62;
    default:
      return 40;
  }
}

function priorityBucketLabel(bucket: ReviewQueuePriorityBucket) {
  switch (bucket) {
    case "high":
      return "Hohe Priorität";
    case "medium":
      return "Mittlere Priorität";
    case "low":
    default:
      return "Niedrige Priorität";
  }
}

function scopeLabelFor(item: Pick<ReviewQueueItemCore, "regionName" | "organizationId">) {
  if (item.regionName && item.organizationId) return `${item.regionName} · Organisation`;
  if (item.regionName) return item.regionName;
  if (item.organizationId) return `Organisation ${item.organizationId}`;
  return "Übergreifend";
}

function pendingHoursFor(updatedAt: string) {
  const updated = Date.parse(updatedAt);
  if (!Number.isFinite(updated)) return 0;
  const diff = Math.max(0, Date.now() - updated);
  return Number((diff / 36e5).toFixed(1));
}

function priorityScoreFor(item: ReviewQueueItemCore, operationalStatus: ReviewQueueOperationalStatus) {
  const pendingHours = pendingHoursFor(item.updatedAt);
  let score = workflowPriority(item.workflowState);
  if (operationalStatus === "blocked") score += 16;
  if (operationalStatus === "request_changes") score += 10;
  if (operationalStatus === "ready") score += 8;
  if (operationalStatus === "in_review") score += 4;
  if (operationalStatus === "archived") score -= 40;
  if (pendingHours >= 72) score += 18;
  else if (pendingHours >= 24) score += 10;
  else if (pendingHours >= 8) score += 4;
  if (item.publicOfficialCandidate) score += 6;
  return score;
}

function priorityBucketFor(score: number): ReviewQueuePriorityBucket {
  if (score >= 90) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function sortReviewQueueItems(sort: ReviewQueueSort, items: ReviewQueueItem[]) {
  const sorted = [...items];
  sorted.sort((left, right) => {
    if (sort === "newest") {
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    }
    if (sort === "oldest") {
      return Date.parse(left.createdAt) - Date.parse(right.createdAt);
    }
    if (sort === "type") {
      const domainDelta = left.domainLabel.localeCompare(right.domainLabel, "de");
      if (domainDelta !== 0) return domainDelta;
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    }
    if (sort === "region") {
      const regionDelta = (left.regionName ?? "Übergreifend").localeCompare(
        right.regionName ?? "Übergreifend",
        "de",
      );
      if (regionDelta !== 0) return regionDelta;
      return right.priorityScore - left.priorityScore;
    }
    const priorityDelta = right.priorityScore - left.priorityScore;
    if (priorityDelta !== 0) return priorityDelta;
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  });
  return sorted;
}

function scopeAllowsRegion(params: {
  scope: ReviewQueueScopeContext;
  regionIds: Array<string | null | undefined>;
}) {
  return params.regionIds.some((regionId) =>
    canViewRegionResource(params.scope, { regionId }),
  );
}

function scopeAllowsWorkspace(params: {
  scope: ReviewQueueScopeContext;
  workspace: DossierStudioWorkspace;
}) {
  return canViewRegionResource(params.scope, {
    ownerUserId: params.workspace.createdBy,
    regionId: params.workspace.regionId ?? null,
    organizationId: params.workspace.organizationId ?? null,
  });
}

function scopeAllowsCreateHandoff(params: {
  scope: ReviewQueueScopeContext;
  record: PersistedCreateHandoffRecord;
}) {
  return canViewRegionResource(params.scope, {
    ownerUserId: params.record.createdByUserId,
    regionId: params.record.regionId,
    organizationId: params.record.organizationId,
  });
}

function signalCanBeOfficiallyApproved(record: RegionParticipationSignalRecord) {
  if (record.reviewStatus !== "accepted") return false;
  if (!record.regionId || record.needsRegionReview) return false;
  if (
    record.privacyMode === "review_restricted" &&
    (!String(record.publicSafeTitle ?? "").trim() ||
      !String(record.publicSafeSummary ?? "").trim())
  ) {
    return false;
  }
  return !record.officialApproval;
}

function workspaceCanBeOfficiallyApproved(workspace: DossierStudioWorkspace) {
  if (workspace.status === "draft" || workspace.status === "archived") return false;
  return !workspace.officialApproval;
}

function mapParticipationReviewItem(params: {
  record: RegionParticipationSignalRecord;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore | null {
  const { record } = params;
  if (
    record.reviewStatus !== "needs_review" &&
    record.reviewStatus !== "needs_region_review"
  ) {
    return null;
  }
  const domain: ReviewQueueDomain =
    record.relatedAnlassraumIds.length > 0
      ? "anlassraum_public_input"
      : "participation_signal";
  const regionId =
    String(record.regionId ?? "").trim() ||
    String(record.proposedRegionId ?? "").trim() ||
    record.matchedRegionIds[0] ||
    null;

  return {
    id: `${domain}:${record.id}`,
    domain,
    domainLabel: domainLabelFor(domain),
    workflowState:
      record.reviewStatus === "needs_region_review"
        ? "region_confirmation_required"
        : "review_required",
    workflowLabel: workflowLabelFor(
      record.reviewStatus === "needs_region_review"
        ? "region_confirmation_required"
        : "review_required",
    ),
    title: record.title,
    summary: record.summary,
    href: reviewLinkForRegion(regionId),
    regionId,
    regionName: regionNameFor(params.regionMap, regionId),
    ownerUserId: null,
    organizationId: null,
    dossierId: record.relatedDossierIds[0] ?? null,
    draftId: null,
    sourceType: record.sourceType,
    visibilityState: record.visibilityState,
    visibilityLabel: publicationVisibilityLabel(record.visibilityState),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapParticipationOfficialApprovalItem(params: {
  record: RegionParticipationSignalRecord;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore | null {
  if (!signalCanBeOfficiallyApproved(params.record)) return null;
  const regionId = params.record.regionId ?? null;
  return {
    id: `public_official_approval:signal:${params.record.id}`,
    domain: "public_official_approval",
    domainLabel: domainLabelFor("public_official_approval"),
    workflowState: "official_approval_required",
    workflowLabel: workflowLabelFor("official_approval_required"),
    title: params.record.title,
    summary:
      "Beteiligungssignal ist angenommen und kann jetzt nur über einen expliziten menschlichen Schritt amtlich freigegeben werden.",
    href: reviewLinkForRegion(regionId),
    regionId,
    regionName: regionNameFor(params.regionMap, regionId),
    ownerUserId: null,
    organizationId: null,
    dossierId: params.record.relatedDossierIds[0] ?? null,
    draftId: null,
    sourceType: params.record.sourceType,
    visibilityState: params.record.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.record.visibilityState),
    createdAt: params.record.createdAt,
    updatedAt: params.record.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: true,
    reviewAuthority: "publication_approved_or_admin",
    reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapRegionSignalDraftItem(params: {
  record: RegionSignalDraftRecord;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore {
  return {
    id: `region_signal_draft:${params.record.id}`,
    domain: "region_signal_draft",
    domainLabel: domainLabelFor("region_signal_draft"),
    workflowState: "draft_review_required",
    workflowLabel: workflowLabelFor("draft_review_required"),
    title: params.record.title,
    summary: params.record.summary,
    href: draftLinkForRecord(params.record),
    regionId: params.record.regionId,
    regionName: regionNameFor(params.regionMap, params.record.regionId),
    ownerUserId: params.record.createdByUserId,
    organizationId: null,
    dossierId: params.record.draftType === "dossier" ? params.record.draftId : null,
    draftId: params.record.draftId,
    sourceType: params.record.draftType,
    visibilityState: params.record.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.record.visibilityState),
    createdAt: params.record.createdAt,
    updatedAt: params.record.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapRegionIntelligenceSuggestionItem(params: {
  regionId: string;
  regionName: string;
  suggestion: Awaited<
    ReturnType<typeof getRegionalAdminCockpitReadModel>
  >["intelligenceReviewSuggestions"][number];
}): ReviewQueueItemCore {
  return {
    id: `region_intelligence_suggestion:${params.regionId}:${params.suggestion.id}`,
    domain: "region_intelligence_suggestion",
    domainLabel: domainLabelFor("region_intelligence_suggestion"),
    workflowState: "review_required",
    workflowLabel: workflowLabelFor("review_required"),
    title: params.suggestion.title,
    summary: params.suggestion.summary,
    href: `${reviewLinkForRegion(params.regionId)}#intelligence-review-suggestions`,
    regionId: params.regionId,
    regionName: params.regionName,
    ownerUserId: null,
    organizationId: null,
    dossierId: null,
    draftId: null,
    sourceType: params.suggestion.suggestionType,
    visibilityState: params.suggestion.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.suggestion.visibilityState),
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapSourceSnapshotTemplate(
  template: RegionSourceSnapshotTemplateResult | null | undefined,
) {
  if (!template) return null;
  return {
    label: template.label,
    seedKindLabel: template.seedKindLabel,
    isExampleSeed: template.isExampleSeed,
    reviewHint: template.reviewHint,
  };
}

async function mapRegionSourceResultItem(params: {
  result: Awaited<ReturnType<typeof listRegionSourceTestResults>>[number];
  regionMap: Map<string, Region>;
  scope: ReviewQueueScopeContext;
}): Promise<ReviewQueueItemCore> {
  const sourceSummary =
    params.result.reviewTaskSummary?.label
      ? `${params.result.reviewTaskSummary.label}. ${params.result.summary}`
      : params.result.summary;
  const targets = await buildContentReleaseWorkbenchTargets({
    sourceKind: "region_source_result",
    result: params.result,
    canPrepare: canOperateReviewItem(params.scope, {
      regionId: params.result.regionId,
      organizationId: params.result.organizationId ?? null,
      reviewAuthority: "standard_review",
    }),
    canPreparePublication: params.scope.canApproveOfficial || params.scope.isAdmin,
  });
  return {
    id: `region_source_result:${params.result.id}`,
    domain: "region_source_result",
    domainLabel: domainLabelFor("region_source_result"),
    workflowState: "review_required",
    workflowLabel: workflowLabelFor("review_required"),
    title: params.result.title,
    summary: sourceSummary,
    href: `${reviewLinkForRegion(params.result.regionId)}#source-results`,
    regionId: params.result.regionId,
    regionName: regionNameFor(params.regionMap, params.result.regionId),
    ownerUserId: params.result.testedBy ?? null,
    organizationId: params.result.organizationId ?? null,
    dossierId: null,
    draftId: params.result.connectionId,
    sourceType: params.result.sourceType,
    visibilityState: params.result.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.result.visibilityState),
    createdAt: params.result.createdAt,
    updatedAt: params.result.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: {
      intro:
        "eDebatte bereitet aus deinem Link veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
      sourceKind: "region_source_result",
      sourceId: params.result.id,
      targets,
    },
    sourceSnapshotTemplate: mapSourceSnapshotTemplate(params.result.sourceSnapshotTemplate),
  };
}

function workspaceSummary(workspace: DossierStudioWorkspace) {
  return (
    workspace.reviewNotes ??
    workspace.audienceNotes ??
    "Workspace bleibt reviewpflichtig und führt nicht automatisch zu Veröffentlichung oder amtlicher Freigabe."
  );
}

function mapWorkspaceItem(params: {
  workspace: DossierStudioWorkspace;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore | null {
  if (
    params.workspace.status !== "needs_review" &&
    params.workspace.status !== "locked"
  ) {
    return null;
  }
  return {
    id: `dossier_workspace:${params.workspace.id}`,
    domain: "dossier_workspace",
    domainLabel: domainLabelFor("dossier_workspace"),
    workflowState: "review_required",
    workflowLabel: workflowLabelFor("review_required"),
    title: params.workspace.title,
    summary: workspaceSummary(params.workspace),
    href: workspaceLink(params.workspace.dossierId),
    regionId: params.workspace.regionId ?? null,
    regionName: regionNameFor(params.regionMap, params.workspace.regionId),
    ownerUserId: params.workspace.createdBy,
    organizationId: params.workspace.organizationId ?? null,
    dossierId: params.workspace.dossierId,
    draftId: null,
    sourceType: params.workspace.source,
    visibilityState: params.workspace.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.workspace.visibilityState),
    createdAt: params.workspace.createdAt,
    updatedAt: params.workspace.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapWorkspaceOfficialApprovalItem(params: {
  workspace: DossierStudioWorkspace;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore | null {
  if (!workspaceCanBeOfficiallyApproved(params.workspace)) return null;
  return {
    id: `public_official_approval:workspace:${params.workspace.id}`,
    domain: "public_official_approval",
    domainLabel: domainLabelFor("public_official_approval"),
    workflowState: "official_approval_required",
    workflowLabel: workflowLabelFor("official_approval_required"),
    title: params.workspace.title,
    summary:
      "Dossier Studio Workspace kann jetzt nur über einen expliziten menschlichen Schritt amtlich freigegeben werden.",
    href: workspaceLink(params.workspace.dossierId),
    regionId: params.workspace.regionId ?? null,
    regionName: regionNameFor(params.regionMap, params.workspace.regionId),
    ownerUserId: params.workspace.createdBy,
    organizationId: params.workspace.organizationId ?? null,
    dossierId: params.workspace.dossierId,
    draftId: null,
    sourceType: params.workspace.source,
    visibilityState: params.workspace.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.workspace.visibilityState),
    createdAt: params.workspace.createdAt,
    updatedAt: params.workspace.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: true,
    reviewAuthority: "publication_approved_or_admin",
    reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

function mapWorkspaceOutputItems(params: {
  workspace: DossierStudioWorkspace;
  regionMap: Map<string, Region>;
}): ReviewQueueItemCore[] {
  const items: ReviewQueueItemCore[] = [];
  const base = {
    domain: "output_artifact" as const,
    domainLabel: domainLabelFor("output_artifact"),
    workflowState: "output_review_required" as const,
    workflowLabel: workflowLabelFor("output_review_required"),
    href: workspaceLink(params.workspace.dossierId),
    regionId: params.workspace.regionId ?? null,
    regionName: regionNameFor(params.regionMap, params.workspace.regionId),
    ownerUserId: params.workspace.createdBy,
    organizationId: params.workspace.organizationId ?? null,
    dossierId: params.workspace.dossierId,
    draftId: null,
    visibilityState: params.workspace.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.workspace.visibilityState),
    createdAt: params.workspace.createdAt,
    updatedAt: params.workspace.updatedAt,
    reviewRequired: true as const,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review" as const,
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };

  if (params.workspace.masterPostDraft?.reviewStatus === "review_required") {
    items.push({
      id: `output_artifact:master_post:${params.workspace.id}`,
      ...base,
      title: `${params.workspace.title} · Master-Post`,
      summary: "Master-Post wartet auf menschliches Review.",
      sourceType: "master_post",
    });
  }

  if (params.workspace.distributionDraft?.reviewRequired) {
    items.push({
      id: `output_artifact:distribution:${params.workspace.id}`,
      ...base,
      title: `${params.workspace.title} · Distribution`,
      summary: "Distribution-Plan bleibt reviewpflichtig und erzeugt kein externes Posting.",
      sourceType: "distribution",
    });
  }

  const carouselReviewStatus = params.workspace.carouselDraft?.reviewStatus;
  if (carouselReviewStatus === "draft" || carouselReviewStatus === "needs_review") {
    items.push({
      id: `output_artifact:carousel:${params.workspace.id}`,
      ...base,
      title: `${params.workspace.title} · Carousel`,
      summary: "Carousel-Output wartet auf menschliches Review.",
      sourceType: "social_carousel",
    });
  }

  return items;
}

function includeCreateAttachItem(item: CreatePrepareAttachDraftQueueItem) {
  if (item.reviewState === "pending") return true;
  if (item.reviewState === "accepted_for_apply" && item.applyState === "not_applied") return true;
  if (item.applyState === "apply_failed") return true;
  return false;
}

function mapCreateAttachItem(item: CreatePrepareAttachDraftQueueItem): ReviewQueueItemCore {
  const workflowState: ReviewQueueState =
    item.reviewState === "accepted_for_apply" || item.applyState === "apply_failed"
      ? "apply_pending"
      : "review_required";

  return {
    id: `create_handoff:${item.draftId}`,
    domain: "create_handoff",
    domainLabel: domainLabelFor("create_handoff"),
    workflowState,
    workflowLabel: workflowLabelFor(workflowState),
    title: item.attachTargetLabel ?? "Create-Handoff",
    summary: item.sourceSummary || item.reasons.join(" · ") || "Create-Handoff wartet auf Review oder Apply.",
    href: `/admin/create/attach-drafts?draftId=${encodeURIComponent(item.draftId)}`,
    regionId: null,
    regionName: null,
    ownerUserId: null,
    organizationId: null,
    dossierId: null,
    draftId: item.draftId,
    sourceType: item.attachTargetType ?? item.matchEntityType ?? null,
    visibilityState: "internal_review",
    visibilityLabel: publicationVisibilityLabel("internal_review"),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: workflowState === "apply_pending" ? "apply_followup" : "standard_review",
    reviewAuthorityLabel:
      workflowState === "apply_pending" ? "Manueller Apply-Schritt" : "Reviewpflichtig",
    contentReleaseWorkbench: null,
    sourceSnapshotTemplate: null,
  };
}

async function mapPersistedCreateHandoffItem(params: {
  record: PersistedCreateHandoffRecord;
  regionMap: Map<string, Region>;
  scope: ReviewQueueScopeContext;
}): Promise<ReviewQueueItemCore> {
  const targets = await buildContentReleaseWorkbenchTargetsForCreateHandoff({
    sourceKind: "create_handoff",
    record: params.record,
    canPrepare: canOperateReviewItem(params.scope, {
      ownerUserId: params.record.createdByUserId,
      regionId: params.record.regionId,
      organizationId: params.record.organizationId,
      reviewAuthority: "standard_review",
    }),
    canPreparePublication: params.scope.canApproveOfficial || params.scope.isAdmin,
  });

  const selectedActionLabel = (() => {
    switch (params.record.selectedAction) {
      case "append_to_dossier":
        return "Dossier-Vorschlag";
      case "prepare_anlassraum":
        return "Anlassraum-Vorschlag";
      case "request_factcheck":
        return "Faktencheck-Vorschlag";
      case "create_dossier":
        return "Dossier-Entwurf";
      case "prepare_vote":
        return "Abstimmungs-Vorbereitung";
      case "submit_draft":
        return "Arbeitsstand";
      case "request_review":
      default:
        return "Review-Aufgabe";
    }
  })();

  return {
    id: `create_handoff:persisted:${params.record.id}`,
    domain: "create_handoff",
    domainLabel: domainLabelFor("create_handoff"),
    workflowState: "review_required",
    workflowLabel: workflowLabelFor("review_required"),
    title: `${params.record.topicSeed.topicLabel} · ${selectedActionLabel}`,
    summary: buildPersistedCreateHandoffSummary(params.record),
    href: params.record.resumeHref,
    regionId: params.record.regionId,
    regionName: regionNameFor(params.regionMap, params.record.regionId),
    ownerUserId: params.record.createdByUserId,
    organizationId: params.record.organizationId,
    dossierId: params.record.dossierId,
    draftId: params.record.id,
    sourceType: params.record.selectedAction,
    visibilityState: params.record.visibilityState,
    visibilityLabel: publicationVisibilityLabel(params.record.visibilityState),
    createdAt: params.record.createdAt,
    updatedAt: params.record.updatedAt,
    reviewRequired: true,
    publicOfficialCandidate: false,
    reviewAuthority: "standard_review",
    reviewAuthorityLabel: "Reviewpflichtig",
    contentReleaseWorkbench: {
      intro:
        "eDebatte bereitet aus deinem Arbeitsstand veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
      sourceKind: "create_handoff",
      sourceId: params.record.id,
      targets,
    },
    sourceSnapshotTemplate: null,
  };
}

function normalizeFilterValue(value: string | undefined, fallback: "all") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeSort(sort: string | undefined): ReviewQueueSort {
  const normalized = String(sort ?? "").trim();
  return (REVIEW_QUEUE_SORTS as readonly string[]).includes(normalized) ? (normalized as ReviewQueueSort) : "priority";
}

function normalizeReviewQueueQuery(query?: ReviewQueueQuery): ReviewQueueFilters {
  return {
    domain: normalizeFilterValue(query?.domain, "all") as ReviewQueueFilters["domain"],
    operationalStatus: normalizeFilterValue(
      query?.operationalStatus,
      "all",
    ) as ReviewQueueFilters["operationalStatus"],
    regionId: normalizeFilterValue(query?.regionId, "all"),
    organizationId: normalizeFilterValue(query?.organizationId, "all"),
    priority: normalizeFilterValue(query?.priority, "all") as ReviewQueueFilters["priority"],
    assignedToUserId: normalizeFilterValue(
      query?.assignedToUserId,
      "all",
    ) as ReviewQueueFilters["assignedToUserId"],
    visibilityState: normalizeFilterValue(
      query?.visibilityState,
      "all",
    ) as ReviewQueueFilters["visibilityState"],
    sort: normalizeSort(query?.sort),
  };
}

function decorateReviewQueueItem(
  item: ReviewQueueItemCore,
  operation: Awaited<ReturnType<typeof listReviewQueueOperationRecords>>[number] | undefined,
  activityTrail: ReviewQueueActivityEntry[],
  unifiedAuditTrail: UnifiedAuditEvent[],
): ReviewQueueItem {
  const operationalStatus = operation?.operationalStatus ?? "open";
  const priorityScore = priorityScoreFor(item, operationalStatus);
  const priorityBucket = priorityBucketFor(priorityScore);
  const latestNoteText = String(operation?.latestNote ?? "").trim();
  const latestNoteAt = String(operation?.latestNoteAt ?? "").trim();
  return {
    ...item,
    scopeLabel: scopeLabelFor(item),
    priorityScore,
    priorityBucket,
    priorityLabel: priorityBucketLabel(priorityBucket),
    pendingHours: pendingHoursFor(item.updatedAt),
    operationalStatus,
    operationalStatusLabel: reviewQueueOperationalStatusLabel(operationalStatus),
    assignedToUserId: operation?.assignedToUserId ?? null,
    assignedAt: operation?.assignedAt ?? null,
    assignedByUserId: operation?.assignedByUserId ?? null,
    noteCount: operation?.noteCount ?? 0,
    latestNote:
      latestNoteText && latestNoteAt
        ? {
            text: latestNoteText,
            at: latestNoteAt,
          }
        : null,
    activityTrail,
    unifiedAuditTrail,
  };
}

function mapOperationActivityTrail(
  auditEvents: ReviewQueueOperationAuditEvent[] | undefined,
): ReviewQueueActivityEntry[] {
  return (auditEvents ?? []).map((event) => ({
    id: event.id,
    action: event.action,
    actionLabel: reviewQueueOperationActionLabel(event.action),
    byUserId: event.byUserId,
    at: event.at,
    note: event.note ?? null,
    previousOperationalStatus: event.previousOperationalStatus,
    previousOperationalStatusLabel: reviewQueueOperationalStatusLabel(
      event.previousOperationalStatus,
    ),
    nextOperationalStatus: event.nextOperationalStatus,
    nextOperationalStatusLabel: reviewQueueOperationalStatusLabel(event.nextOperationalStatus),
    previousAssignedToUserId: event.previousAssignedToUserId,
    nextAssignedToUserId: event.nextAssignedToUserId,
  }));
}

function itemMatchesFilters(item: ReviewQueueItem, filters: ReviewQueueFilters) {
  if (filters.domain !== "all" && item.domain !== filters.domain) return false;
  if (
    filters.operationalStatus !== "all" &&
    item.operationalStatus !== filters.operationalStatus
  ) {
    return false;
  }
  if (
    filters.regionId !== "all" &&
    ((filters.regionId === "overgreifend" && item.regionId !== null) ||
      (filters.regionId !== "overgreifend" && item.regionId !== filters.regionId))
  ) {
    return false;
  }
  if (
    filters.organizationId !== "all" &&
    (filters.organizationId === "ohne_organisation"
      ? item.organizationId !== null
      : item.organizationId !== filters.organizationId)
  ) {
    return false;
  }
  if (filters.priority !== "all" && item.priorityBucket !== filters.priority) return false;
  if (filters.assignedToUserId === "unassigned" && item.assignedToUserId) return false;
  if (
    filters.assignedToUserId !== "all" &&
    filters.assignedToUserId !== "unassigned" &&
    item.assignedToUserId !== filters.assignedToUserId
  ) {
    return false;
  }
  if (
    filters.visibilityState !== "all" &&
    item.visibilityState !== filters.visibilityState
  ) {
    return false;
  }
  return true;
}

function buildFilterOptions(items: ReviewQueueItem[]) {
  const countBy = (values: string[]) =>
    values.reduce<Map<string, number>>((acc, value) => {
      acc.set(value, (acc.get(value) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

  const domainCounts = countBy(items.map((item) => item.domain));
  const statusCounts = countBy(items.map((item) => item.operationalStatus));
  const regionCounts = countBy(items.map((item) => item.regionId ?? "overgreifend"));
  const organizationCounts = countBy(items.map((item) => item.organizationId ?? "ohne_organisation"));
  const priorityCounts = countBy(items.map((item) => item.priorityBucket));
  const assigneeCounts = countBy(items.map((item) => item.assignedToUserId ?? "unassigned"));
  const visibilityCounts = countBy(items.map((item) => item.visibilityState));
  const regionLabels = new Map(
    items
      .filter((item) => item.regionId)
      .map((item) => [item.regionId as string, item.regionName ?? (item.regionId as string)]),
  );
  const organizationLabels = new Map(
    items
      .filter((item) => item.organizationId)
      .map((item) => [item.organizationId as string, item.organizationId as string]),
  );

  return {
    domains: REVIEW_QUEUE_DOMAINS.map((domain) => ({
      value: domain,
      label: domainLabelFor(domain),
      count: domainCounts.get(domain) ?? 0,
    })).filter((entry) => entry.count > 0),
    statuses: REVIEW_QUEUE_OPERATION_STATUSES.map((status) => ({
      value: status,
      label: reviewQueueOperationalStatusLabel(status),
      count: statusCounts.get(status) ?? 0,
    })).filter((entry) => entry.count > 0),
    regions: Array.from(regionCounts.entries())
      .map(([value, count]) => ({
        value,
        label:
          value === "overgreifend"
            ? "Übergreifend"
            : regionLabels.get(value) ?? value,
        count,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "de")),
    organizations: Array.from(organizationCounts.entries())
      .map(([value, count]) => ({
        value,
        label:
          value === "ohne_organisation"
            ? "Ohne Organisation"
            : organizationLabels.get(value) ?? value,
        count,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "de")),
    priorities: REVIEW_QUEUE_PRIORITY_BUCKETS.map((bucket) => ({
      value: bucket,
      label: priorityBucketLabel(bucket),
      count: priorityCounts.get(bucket) ?? 0,
    })).filter((entry) => entry.count > 0),
    assignees: Array.from(assigneeCounts.entries())
      .map(([value, count]) => ({
        value,
        label: value === "unassigned" ? "Nicht zugewiesen" : value,
        count,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "de")),
    visibilities: Array.from(visibilityCounts.entries())
      .map(([value, count]) => ({
        value,
        label: publicationVisibilityLabel(value as RegionPublicationVisibilityState),
        count,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "de")),
    sorts: REVIEW_QUEUE_SORTS.map((sort) => ({
      value: sort,
      label:
        sort === "newest"
          ? "Neueste zuerst"
          : sort === "oldest"
            ? "Älteste zuerst"
            : sort === "type"
              ? "Typ"
              : sort === "region"
                ? "Region"
                : "Priorität",
      count: items.length,
    })),
  };
}

export async function buildReviewQueueReadModel(
  scope: ReviewQueueScope,
  query?: ReviewQueueQuery,
): Promise<ReviewQueueReadModel> {
  const scoped = buildReviewQueueScopeContext({
    userId: scope.userId,
    isAdmin: scope.isAdmin,
    organizationIds: scope.organizationIds,
    primaryOrganizationId: scope.primaryOrganizationId,
    visibleRegionIds: scope.visibleRegionIds,
    canApproveOfficial: scope.canApproveOfficial,
    status: scope.status,
    governanceActorPresent: Boolean(scope.governanceActor),
  });
  const filters = normalizeReviewQueueQuery(query);
  const regions = await listOperationalRegions();
  const regionMap = new Map(regions.map((region) => [region.id, clone(region)]));
  const [participationRecords, draftRecords, workspaces] = await Promise.all([
    listParticipationSignalsForReviewRuntime({
      regions,
      query: { reviewStatus: "all", limit: 400 },
    }),
    listRegionSignalDraftRecords(),
    getDossierStudioWorkspaceRepo().listDossierStudioWorkspaces(),
  ]);
  const sourceResults = await listRegionSourceTestResults({ limit: 200 });

  const coreItems: ReviewQueueItemCore[] = [];

  for (const record of participationRecords) {
    const recordRegionIds = uniqueNonEmpty([
      record.regionId,
      record.proposedRegionId,
      ...record.matchedRegionIds,
    ]);
    if (!scopeAllowsRegion({ scope: scoped, regionIds: recordRegionIds })) continue;

    const reviewItem = mapParticipationReviewItem({ record, regionMap });
    if (reviewItem) coreItems.push(reviewItem);

    if (scoped.canApproveOfficial) {
      const officialItem = mapParticipationOfficialApprovalItem({ record, regionMap });
      if (officialItem) coreItems.push(officialItem);
    }
  }

  for (const record of draftRecords) {
    if (
      !canViewRegionResource(scoped, {
        ownerUserId: record.createdByUserId,
        regionId: record.regionId,
      })
    ) {
      continue;
    }
    coreItems.push(mapRegionSignalDraftItem({ record, regionMap }));
  }

  for (const result of sourceResults) {
    if (
      !canViewRegionResource(scoped, {
        regionId: result.regionId,
        organizationId: result.organizationId ?? null,
      })
    ) {
      continue;
    }
    coreItems.push(await mapRegionSourceResultItem({ result, regionMap, scope: scoped }));
  }

  for (const workspace of workspaces) {
    if (!scopeAllowsWorkspace({ scope: scoped, workspace })) continue;
    const workspaceItem = mapWorkspaceItem({ workspace, regionMap });
    if (workspaceItem) coreItems.push(workspaceItem);
    coreItems.push(...mapWorkspaceOutputItems({ workspace, regionMap }));
    if (scoped.canApproveOfficial) {
      const officialItem = mapWorkspaceOfficialApprovalItem({ workspace, regionMap });
      if (officialItem) coreItems.push(officialItem);
    }
  }

  if (scoped.mode === "global_operator" && scope.governanceActor) {
    const queue = await listCreatePrepareAttachDraftQueue({
      actor: scope.governanceActor,
      reviewState: "all",
      page: 1,
      pageSize: 200,
      q: "",
    }).catch(() => ({ items: [] as CreatePrepareAttachDraftQueueItem[], total: 0 }));

    for (const item of queue.items.filter(includeCreateAttachItem)) {
      coreItems.push(mapCreateAttachItem(item));
    }
  }

  const persistedCreateHandoffs = await listPersistedCreateHandoffRecords().catch(
    () => [] as PersistedCreateHandoffRecord[],
  );
  for (const record of persistedCreateHandoffs) {
    if (!scopeAllowsCreateHandoff({ scope: scoped, record })) continue;
    coreItems.push(await mapPersistedCreateHandoffItem({ record, regionMap, scope: scoped }));
  }

  const intelligenceRegionIds =
    scoped.mode === "global_operator"
      ? regions.map((region) => region.id)
      : uniqueNonEmpty(scoped.visibleRegionIds);

  for (const regionId of intelligenceRegionIds) {
    const cockpit = await getRegionalAdminCockpitReadModel(regionId).catch(() => null);
    if (!cockpit) continue;
    for (const suggestion of cockpit.intelligenceReviewSuggestions) {
      coreItems.push(
        mapRegionIntelligenceSuggestionItem({
          regionId: cockpit.region.id,
          regionName: cockpit.region.name,
          suggestion,
        }),
      );
    }
  }

  const operationMap = new Map(
    (await listReviewQueueOperationRecords()).map((record) => [record.itemId, record]),
  );
  const operationAuditMap = await listReviewQueueOperationAuditEventsForItems(
    coreItems.map((item) => item.id),
    3,
  );
  const unifiedAuditReadModel = await listUnifiedAuditEvents({
    scope: scoped,
    itemIds: coreItems.map((item) => item.id),
    itemResources: Object.fromEntries(
      coreItems.map((item) => [
        item.id,
        {
          organizationId: item.organizationId,
          regionId: item.regionId,
          ownerUserId: item.ownerUserId,
        },
      ]),
    ),
    limit: Math.max(coreItems.length * 4, 12),
  });
  const unifiedAuditByItem = unifiedAuditReadModel.events.reduce<Record<string, UnifiedAuditEvent[]>>(
    (acc, event) => {
      if (!event.itemId) return acc;
      acc[event.itemId] ??= [];
      acc[event.itemId]?.push(clone(event));
      return acc;
    },
    {},
  );
  const decorated = coreItems.map((item) =>
    decorateReviewQueueItem(
      item,
      operationMap.get(item.id),
      mapOperationActivityTrail(operationAuditMap[item.id]),
      unifiedAuditByItem[item.id] ?? [],
    ),
  );
  const filtered = decorated.filter((item) => itemMatchesFilters(item, filters));
  const sorted = sortReviewQueueItems(filters.sort, filtered);
  const filterOptions = buildFilterOptions(decorated);
  const counts = new Map<ReviewQueueDomain, number>();
  const statusCounts = new Map<ReviewQueueOperationalStatus, number>();
  for (const item of sorted) {
    counts.set(item.domain, (counts.get(item.domain) ?? 0) + 1);
    statusCounts.set(item.operationalStatus, (statusCounts.get(item.operationalStatus) ?? 0) + 1);
  }

  return {
    items: sorted,
    operationsPersistence: getReviewQueueOperationPersistenceState(),
    contentReleasePersistence: getContentReleasePersistenceState(),
    summary: {
      total: sorted.length,
      totalBeforeFilters: decorated.length,
      officialApprovalCount: sorted.filter((item) => item.publicOfficialCandidate).length,
      highPriorityCount: sorted.filter((item) => item.priorityBucket === "high").length,
      assignedCount: sorted.filter((item) => Boolean(item.assignedToUserId)).length,
      blockedCount: sorted.filter((item) => item.operationalStatus === "blocked").length,
      readyCount: sorted.filter((item) => item.operationalStatus === "ready").length,
      byDomain: REVIEW_QUEUE_DOMAINS.map((domain) => ({
        domain,
        label: domainLabelFor(domain),
        count: counts.get(domain) ?? 0,
      })).filter((entry) => entry.count > 0),
      byOperationalStatus: REVIEW_QUEUE_OPERATION_STATUSES.map((status) => ({
        status,
        label: reviewQueueOperationalStatusLabel(status),
        count: statusCounts.get(status) ?? 0,
      })).filter((entry) => entry.count > 0),
    },
    filters: {
      applied: filters,
      options: filterOptions,
    },
    guardrails: REVIEW_QUEUE_GUARDRAILS,
  };
}
