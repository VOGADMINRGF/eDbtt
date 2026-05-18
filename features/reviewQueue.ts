import type { GovernanceActor } from "@features/trust/types";
import {
  getDossierStudioWorkspaceRepo,
  type DossierStudioWorkspace,
} from "@features/dossier/server/studioPersistence";
import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import { listCreatePrepareAttachDraftQueue } from "@/features/create/attachDraftReviewQueue";
import type { Region } from "./region/contracts";
import {
  publicationVisibilityLabel,
  type RegionPublicationVisibilityState,
} from "./region/publicationRiskLadder";
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
  createdAt: string;
  updatedAt: string;
  reviewRequired: true;
  publicOfficialCandidate: boolean;
  reviewAuthority:
    | "standard_review"
    | "publication_approved_or_admin"
    | "apply_followup";
  reviewAuthorityLabel: string;
};

export type ReviewQueueSummaryEntry = {
  domain: ReviewQueueDomain;
  label: string;
  count: number;
};

export type ReviewQueueReadModel = {
  items: ReviewQueueItem[];
  summary: {
    total: number;
    officialApprovalCount: number;
    byDomain: ReviewQueueSummaryEntry[];
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

function priorityFor(item: ReviewQueueItem) {
  switch (item.workflowState) {
    case "official_approval_required":
      return 0;
    case "region_confirmation_required":
      return 1;
    case "output_review_required":
      return 2;
    case "draft_review_required":
      return 3;
    case "review_required":
      return 4;
    case "apply_pending":
      return 5;
    default:
      return 9;
  }
}

function byPriorityAndTime(left: ReviewQueueItem, right: ReviewQueueItem) {
  const priorityDelta = priorityFor(left) - priorityFor(right);
  if (priorityDelta !== 0) return priorityDelta;
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function scopeAllowsRegion(params: {
  scope: ReviewQueueScope;
  regionIds: Array<string | null | undefined>;
}) {
  if (params.scope.mode === "global_operator") return true;
  const visible = new Set(params.scope.visibleRegionIds);
  return params.regionIds.some((regionId) => visible.has(String(regionId ?? "").trim()));
}

function scopeAllowsWorkspace(params: {
  scope: ReviewQueueScope;
  workspace: DossierStudioWorkspace;
}) {
  if (params.scope.mode === "global_operator") return true;
  if (params.workspace.createdBy === params.scope.userId) return true;
  const regionId = String(params.workspace.regionId ?? "").trim();
  if (regionId && params.scope.visibleRegionIds.includes(regionId)) return true;
  const organizationId = String(params.workspace.organizationId ?? "").trim();
  if (organizationId && params.scope.organizationIds.includes(organizationId)) return true;
  return false;
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
}): ReviewQueueItem | null {
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
  };
}

function mapParticipationOfficialApprovalItem(params: {
  record: RegionParticipationSignalRecord;
  regionMap: Map<string, Region>;
}): ReviewQueueItem | null {
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
  };
}

function mapRegionSignalDraftItem(params: {
  record: RegionSignalDraftRecord;
  regionMap: Map<string, Region>;
}): ReviewQueueItem {
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
  };
}

function mapRegionIntelligenceSuggestionItem(params: {
  regionId: string;
  regionName: string;
  suggestion: Awaited<
    ReturnType<typeof getRegionalAdminCockpitReadModel>
  >["intelligenceReviewSuggestions"][number];
}): ReviewQueueItem {
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
  };
}

function mapRegionSourceResultItem(params: {
  result: Awaited<ReturnType<typeof listRegionSourceTestResults>>[number];
  regionMap: Map<string, Region>;
}): ReviewQueueItem {
  const sourceSummary =
    params.result.reviewTaskSummary?.label
      ? `${params.result.reviewTaskSummary.label}. ${params.result.summary}`
      : params.result.summary;
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
    organizationId: null,
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
}): ReviewQueueItem | null {
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
  };
}

function mapWorkspaceOfficialApprovalItem(params: {
  workspace: DossierStudioWorkspace;
  regionMap: Map<string, Region>;
}): ReviewQueueItem | null {
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
  };
}

function mapWorkspaceOutputItems(params: {
  workspace: DossierStudioWorkspace;
  regionMap: Map<string, Region>;
}): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = [];
  const base = {
    domain: "output_artifact" as const,
    domainLabel: domainLabelFor("output_artifact"),
    workflowState: "output_review_required" as const,
    workflowLabel: workflowLabelFor("output_review_required"),
    href: workspaceLink(params.workspace.dossierId),
    regionId: params.workspace.regionId ?? null,
    regionName: regionNameFor(params.regionMap, params.workspace.regionId),
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

function mapCreateAttachItem(item: CreatePrepareAttachDraftQueueItem): ReviewQueueItem {
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
  };
}

export async function buildReviewQueueReadModel(
  scope: ReviewQueueScope,
): Promise<ReviewQueueReadModel> {
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

  const items: ReviewQueueItem[] = [];

  for (const record of participationRecords) {
    const recordRegionIds = uniqueNonEmpty([
      record.regionId,
      record.proposedRegionId,
      ...record.matchedRegionIds,
    ]);
    if (!scopeAllowsRegion({ scope, regionIds: recordRegionIds })) continue;

    const reviewItem = mapParticipationReviewItem({ record, regionMap });
    if (reviewItem) items.push(reviewItem);

    if (scope.canApproveOfficial) {
      const officialItem = mapParticipationOfficialApprovalItem({ record, regionMap });
      if (officialItem) items.push(officialItem);
    }
  }

  for (const record of draftRecords) {
    if (
      scope.mode !== "global_operator" &&
      record.createdByUserId !== scope.userId &&
      !scope.visibleRegionIds.includes(record.regionId)
    ) {
      continue;
    }
    items.push(mapRegionSignalDraftItem({ record, regionMap }));
  }

  for (const result of sourceResults) {
    if (!scopeAllowsRegion({ scope, regionIds: [result.regionId] })) continue;
    items.push(mapRegionSourceResultItem({ result, regionMap }));
  }

  for (const workspace of workspaces) {
    if (!scopeAllowsWorkspace({ scope, workspace })) continue;
    const workspaceItem = mapWorkspaceItem({ workspace, regionMap });
    if (workspaceItem) items.push(workspaceItem);
    items.push(...mapWorkspaceOutputItems({ workspace, regionMap }));
    if (scope.canApproveOfficial) {
      const officialItem = mapWorkspaceOfficialApprovalItem({ workspace, regionMap });
      if (officialItem) items.push(officialItem);
    }
  }

  if (scope.mode === "global_operator" && scope.governanceActor) {
    const queue = await listCreatePrepareAttachDraftQueue({
      actor: scope.governanceActor,
      reviewState: "all",
      page: 1,
      pageSize: 200,
      q: "",
    }).catch(() => ({ items: [] as CreatePrepareAttachDraftQueueItem[], total: 0 }));

    for (const item of queue.items.filter(includeCreateAttachItem)) {
      items.push(mapCreateAttachItem(item));
    }
  }

  const intelligenceRegionIds =
    scope.mode === "global_operator"
      ? regions.map((region) => region.id)
      : uniqueNonEmpty(scope.visibleRegionIds);

  for (const regionId of intelligenceRegionIds) {
    const cockpit = await getRegionalAdminCockpitReadModel(regionId).catch(() => null);
    if (!cockpit) continue;
    for (const suggestion of cockpit.intelligenceReviewSuggestions) {
      items.push(
        mapRegionIntelligenceSuggestionItem({
          regionId: cockpit.region.id,
          regionName: cockpit.region.name,
          suggestion,
        }),
      );
    }
  }

  const sorted = [...items].sort(byPriorityAndTime);
  const counts = new Map<ReviewQueueDomain, number>();
  for (const item of sorted) {
    counts.set(item.domain, (counts.get(item.domain) ?? 0) + 1);
  }

  return {
    items: sorted,
    summary: {
      total: sorted.length,
      officialApprovalCount: sorted.filter((item) => item.publicOfficialCandidate).length,
      byDomain: REVIEW_QUEUE_DOMAINS.map((domain) => ({
        domain,
        label: domainLabelFor(domain),
        count: counts.get(domain) ?? 0,
      })).filter((entry) => entry.count > 0),
    },
    guardrails: REVIEW_QUEUE_GUARDRAILS,
  };
}
