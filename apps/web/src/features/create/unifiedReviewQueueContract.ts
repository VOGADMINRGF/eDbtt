import {
  resolveCanonicalPublishGuard,
  type CanonicalPreparationStatus,
  type CanonicalPublishGuard,
} from "@/features/create/canonicalPreparationStatusContract";
import type {
  CanonicalLanguageBridgeRecord,
  CanonicalTrustState,
} from "@/features/create/languageBridgeTrustFormatContract";
import type {
  CanonicalSourcePack,
  CanonicalSourcePackEvidenceState,
} from "@/features/create/canonicalSourcePackContract";
import type {
  CreateHandoffReviewQueueItem,
  CreateHandoffReviewQueueItemStatus,
} from "@/features/create/createHandoffReviewQueue";
import type {
  DossierSocialOutputDraft,
} from "@/features/create/dossierSocialOutputDraftContract";
import type {
  ParticipationHandoffCandidate,
  ParticipationHandoffCandidateType,
} from "@/features/create/participationHandoffContract";
import type {
  RoleSpecificReviewType,
} from "@/features/create/roleSpecificReviewContract";
import {
  getRoleSpecificReviewRequirement,
} from "@/features/create/roleSpecificReviewContract";
import type {
  UserContributionLifecycleStatus,
} from "@/features/create/userContributionLifecycleContract";
import type { VoxyVideoBriefing } from "@/features/voxyVideo";
import type { GovernanceActorRole } from "@features/trust/types";

export const V3_UNIFIED_REVIEW_QUEUE_ITEM_SOURCES = [
  "create_handoff",
  "participation_candidate",
  "social_output_draft",
  "voxy_video_briefing",
] as const;

export type V3UnifiedReviewQueueItemSource =
  (typeof V3_UNIFIED_REVIEW_QUEUE_ITEM_SOURCES)[number];

export const V3_UNIFIED_REVIEW_QUEUE_STATES = [
  "draft",
  "queued_for_review",
  "in_review",
  "needs_clarification",
  "review_ready",
  "approval_required",
  "publish_ready",
  "approved",
  "archived",
] as const;

export type V3UnifiedReviewQueueState =
  (typeof V3_UNIFIED_REVIEW_QUEUE_STATES)[number];

export type V3UnifiedReviewQueueItem = {
  id: string;
  source: V3UnifiedReviewQueueItemSource;
  sourceId: string;
  title: string;
  summary: string;
  queueState: V3UnifiedReviewQueueState;
  requiredReviewType: RoleSpecificReviewType;
  requiredReviewerRoles: GovernanceActorRole[];
  lifecycleStatus: UserContributionLifecycleStatus;
  preparationStatus: CanonicalPreparationStatus;
  reviewReadyIsApproved: false;
  publishReadyIsPublished: false;
  reviewRequired: true;
  autoPublish: false;
  publishGuard: CanonicalPublishGuard;
  sourcePackId: string | null;
  sourcePackEvidenceState: CanonicalSourcePackEvidenceState | null;
  trustState: CanonicalTrustState | null;
  languageSummary: {
    originalLanguage: string | null;
    readingLanguage: string | null;
  };
  nextAllowedActions: string[];
  reviewWorld: "existing_review_queue";
};

export type BuildUnifiedReviewQueueContractInput = {
  id: string;
  source: V3UnifiedReviewQueueItemSource;
  sourceId: string;
  title: string;
  summary: string;
  queueState: V3UnifiedReviewQueueState;
  requiredReviewType: RoleSpecificReviewType;
  lifecycleStatus: UserContributionLifecycleStatus;
  preparationStatus: CanonicalPreparationStatus;
  approvalGranted?: boolean;
  blockers?: readonly string[];
  sourcePack?: CanonicalSourcePack | null;
  languageBridge?: CanonicalLanguageBridgeRecord | null;
  trustState?: CanonicalTrustState | null;
};

function getSourcePackEvidenceState(
  sourcePack: CanonicalSourcePack | null | undefined,
): CanonicalSourcePackEvidenceState | null {
  return sourcePack?.sources[0]?.evidenceState ?? null;
}

function getQueueStateFromCreateHandoffStatus(
  status: CreateHandoffReviewQueueItemStatus,
): V3UnifiedReviewQueueState {
  if (status === "queued_for_review") return "queued_for_review";
  if (status === "in_review") return "in_review";
  if (status === "needs_clarification") return "needs_clarification";
  if (status === "approved_for_setup") return "approval_required";
  if (status === "rejected") return "archived";
  if (status === "archived") return "archived";
  return "draft";
}

function getReviewTypeForParticipationCandidate(
  candidateType: ParticipationHandoffCandidateType,
): RoleSpecificReviewType {
  if (candidateType === "statement_candidate") return "editorial_review";
  if (candidateType === "participation_space_candidate") return "org_review";
  return "moderation_review";
}

function buildNextAllowedActions(
  requiredReviewType: RoleSpecificReviewType,
  queueState: V3UnifiedReviewQueueState,
  preparationStatus: CanonicalPreparationStatus,
): string[] {
  const actions = new Set<string>(["review"]);
  if (
    queueState === "approval_required" ||
    queueState === "publish_ready" ||
    preparationStatus === "publish_ready"
  ) {
    actions.add("approve");
  }
  if (
    requiredReviewType === "publish_review" &&
    preparationStatus === "publish_ready"
  ) {
    actions.add("publish_after_approval");
  }
  if (
    requiredReviewType === "voxy_render_review" &&
    queueState !== "archived"
  ) {
    actions.add("render_after_approval");
  }
  return [...actions];
}

export function buildUnifiedReviewQueueItemContract(
  input: BuildUnifiedReviewQueueContractInput,
): V3UnifiedReviewQueueItem {
  const requiredReviewerRoles = getRoleSpecificReviewRequirement(
    input.requiredReviewType,
  ).allowedRoles;
  const publishGuard = resolveCanonicalPublishGuard({
    status: input.preparationStatus,
    approvalGranted: input.approvalGranted,
    blockers: input.blockers,
  });

  return {
    id: input.id,
    source: input.source,
    sourceId: input.sourceId,
    title: input.title,
    summary: input.summary,
    queueState: input.queueState,
    requiredReviewType: input.requiredReviewType,
    requiredReviewerRoles,
    lifecycleStatus: input.lifecycleStatus,
    preparationStatus: input.preparationStatus,
    reviewReadyIsApproved: false,
    publishReadyIsPublished: false,
    reviewRequired: true,
    autoPublish: false,
    publishGuard,
    sourcePackId: input.sourcePack?.sourcePackId ?? null,
    sourcePackEvidenceState: getSourcePackEvidenceState(input.sourcePack),
    trustState: input.trustState ?? input.languageBridge?.sourceGrounding.trustState ?? null,
    languageSummary: {
      originalLanguage: input.languageBridge?.original.language ?? null,
      readingLanguage:
        input.languageBridge?.translation.language ??
        input.languageBridge?.summary.language ??
        null,
    },
    nextAllowedActions: buildNextAllowedActions(
      input.requiredReviewType,
      input.queueState,
      input.preparationStatus,
    ),
    reviewWorld: "existing_review_queue",
  };
}

export function buildUnifiedReviewQueueItemFromCreateHandoff(
  item: CreateHandoffReviewQueueItem,
  options?: {
    sourcePack?: CanonicalSourcePack | null;
    languageBridge?: CanonicalLanguageBridgeRecord | null;
    approvalGranted?: boolean;
    blockers?: readonly string[];
  },
): V3UnifiedReviewQueueItem {
  return buildUnifiedReviewQueueItemContract({
    id: item.id,
    source: "create_handoff",
    sourceId: item.sourceDraftId,
    title: item.title,
    summary: item.summary,
    queueState: getQueueStateFromCreateHandoffStatus(item.status),
    requiredReviewType: item.requiredReviewType,
    lifecycleStatus: item.lifecycleStatus,
    preparationStatus: item.preparationStatus,
    approvalGranted: options?.approvalGranted,
    blockers: options?.blockers,
    sourcePack: options?.sourcePack ?? null,
    languageBridge: options?.languageBridge ?? null,
  });
}

export function buildUnifiedReviewQueueItemFromParticipationCandidate(
  candidate: ParticipationHandoffCandidate,
): V3UnifiedReviewQueueItem {
  const requiredReviewType = getReviewTypeForParticipationCandidate(
    candidate.candidateType,
  );

  return buildUnifiedReviewQueueItemContract({
    id: candidate.id,
    source: "participation_candidate",
    sourceId: candidate.id,
    title: candidate.title,
    summary: candidate.prompt,
    queueState: "review_ready",
    requiredReviewType,
    lifecycleStatus: "review_ready",
    preparationStatus: "review_ready",
  });
}

export function buildUnifiedReviewQueueItemFromSocialOutputDraft(
  draft: DossierSocialOutputDraft,
): V3UnifiedReviewQueueItem {
  return buildUnifiedReviewQueueItemContract({
    id: draft.draftId,
    source: "social_output_draft",
    sourceId: draft.draftId,
    title: draft.title,
    summary: draft.summary,
    queueState:
      draft.preparationStatus === "publish_ready"
        ? "publish_ready"
        : "review_ready",
    requiredReviewType: "publish_review",
    lifecycleStatus: "review_ready",
    preparationStatus: draft.preparationStatus,
    sourcePack: draft.sourcePack,
    trustState: draft.trustState,
  });
}

export function buildUnifiedReviewQueueItemFromVoxyVideoBriefing(
  briefing: VoxyVideoBriefing,
): V3UnifiedReviewQueueItem {
  return buildUnifiedReviewQueueItemContract({
    id: briefing.briefingId,
    source: "voxy_video_briefing",
    sourceId: briefing.briefingId,
    title: briefing.title,
    summary: briefing.summary,
    queueState: "review_ready",
    requiredReviewType: "voxy_script_review",
    lifecycleStatus: "review_ready",
    preparationStatus: briefing.preparationStatus,
    sourcePack: briefing.sourcePackBridge.sourcePack,
    languageBridge: briefing.languageBridge,
    trustState: briefing.sourcePackBridge.trustState,
  });
}
