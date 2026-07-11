import type {
  VoxyRenderPreviewOutcomeHandoffCommand,
  VoxyRenderPreviewOutcomeHandoffRecord,
  VoxyRenderPreviewOutcomeHandoffStatus,
  VoxyRenderPreviewOutcomeHandoffType,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import type {
  VoxyRenderPreviewReviewDecisionRecord,
  VoxyRenderPreviewReviewDecisionStatus,
  VoxyRenderPreviewReviewDecisionType,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import type {
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStatus,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type { VoxyRenderRequestDraftRecord } from "@/features/create/voxyRenderRequestDraftContract";
import type { VoxyRenderReviewDecisionGateModel } from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderPublishReadinessGate,
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
  VoxyRenderPublishReadinessGuardStatus,
  VoxyRenderPublishReadinessPersistenceState,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderPublishReadinessEffects,
  buildVoxyRenderPublishReadinessExecutionFlags,
  buildVoxyRenderPublishReadinessGuardCommandFromReadmodels,
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type {
  VoxyRenderRuntimeEnablementBacklogRecord,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type {
  VoxyRenderRuntimeGoNogoMatrixRecord,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES = [
  "social_distribution_handoff_only",
  "noop_distribution",
  "not_distribution_ready",
  "blocked_by_publish_guard",
  "blocked_by_missing_publish_readiness_guard",
  "blocked_by_missing_media",
  "blocked_by_upload_guard",
  "blocked_by_scheduling_guard",
  "blocked_by_social_posting_guard",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderSocialDistributionHandoffStatus =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_HANDOFF_STATUSES)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_TARGETS = [
  "website",
  "newsletter",
  "linkedin",
  "x_twitter",
  "instagram",
  "tiktok",
  "youtube",
  "internal_review",
  "none",
] as const;

export type VoxyRenderSocialDistributionTarget =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_TARGETS)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_PLATFORM_STATUSES = [
  "candidate_only",
  "needs_review",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderSocialDistributionPlatformStatus =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_PLATFORM_STATUSES)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_COPY_STATUSES = [
  "draft_only",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderSocialDistributionCopyStatus =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_COPY_STATUSES)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_SCHEDULE_STATUSES = [
  "no_schedule",
  "candidate_only",
  "needs_policy",
  "blocked",
] as const;

export type VoxyRenderSocialDistributionScheduleStatus =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_SCHEDULE_STATUSES)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_NEXT_STEPS = [
  "keep_distribution_blocked",
  "prepare_copy_review",
  "require_real_media_file",
  "require_upload_runtime",
  "require_social_review",
  "require_scheduling_policy",
  "require_platform_configuration",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderSocialDistributionNextStep =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_NEXT_STEPS)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderSocialDistributionStoreResultStatus =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_SOCIAL_DISTRIBUTION_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderSocialDistributionPersistenceMode =
  (typeof VOXY_RENDER_SOCIAL_DISTRIBUTION_PERSISTENCE_MODES)[number];

type SocialDistributionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderSocialDistributionPlatformCandidate = {
  platform: VoxyRenderSocialDistributionTarget;
  label: string;
  status: VoxyRenderSocialDistributionPlatformStatus;
  platformApiCallAllowed: false;
  uploadAllowed: false;
  postAllowed: false;
  scheduleAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderSocialDistributionCopyVariant = {
  variantId: string;
  platform: VoxyRenderSocialDistributionTarget;
  label: string;
  status: VoxyRenderSocialDistributionCopyStatus;
  headline: string | null;
  body: string | null;
  hashtags: string[];
  cta: string | null;
  sourceCaptionRequired: boolean;
  languageReviewRequired: boolean;
  legalReviewRequired: boolean;
  posted: false;
  scheduled: false;
  platformApiCallAllowed: false;
};

export type VoxyRenderSocialDistributionScheduleCandidate = {
  scheduleCandidateId: string | null;
  status: VoxyRenderSocialDistributionScheduleStatus;
  suggestedWindow: string | null;
  scheduled: false;
  schedulingAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderSocialDistributionSemantics = {
  publishReady: false;
  published: false;
  uploaded: false;
  scheduled: false;
  socialPosted: false;
  platformApiCalled: false;
  autoPublishAllowed: false;
};

export type VoxyRenderSocialDistributionEffects = {
  blocksUpload: true;
  blocksScheduling: true;
  blocksSocialPosting: true;
  blocksPublish: true;
  createsUpload: false;
  createsSchedule: false;
  createsSocialPost: false;
  triggersPublish: false;
  createsRenderJob: false;
  triggersRerender: false;
  triggersProvider: false;
  createsQueueJob: false;
  createsMediaFile: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderSocialDistributionExecutionFlags = {
  publishAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  platformApiCallAllowed: false;
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  previewFileAvailable: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderSocialDistributionHandoffCommand = {
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: SocialDistributionRef | null;
  contributionRef?: SocialDistributionRef | null;
  dossierRef?: SocialDistributionRef | null;
  reviewerRef?: SocialDistributionRef | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  handoffStatus: VoxyRenderSocialDistributionHandoffStatus;
  platformCandidates: VoxyRenderSocialDistributionPlatformCandidate[];
  copyVariants: VoxyRenderSocialDistributionCopyVariant[];
  scheduleCandidate: VoxyRenderSocialDistributionScheduleCandidate;
  distributionSemantics: VoxyRenderSocialDistributionSemantics;
  guardEffects: VoxyRenderSocialDistributionEffects;
  executionFlags: VoxyRenderSocialDistributionExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderSocialDistributionNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  publishGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  previewOutcomeStatusHint?: VoxyRenderPreviewOutcomeHandoffStatus | null;
  previewReviewDecisionTypeHint?: VoxyRenderPreviewReviewDecisionType | null;
  previewReviewDecisionStatusHint?: VoxyRenderPreviewReviewDecisionStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderSocialDistributionHandoffRecord =
  VoxyRenderSocialDistributionHandoffCommand & {
    socialDistributionHandoffId: string;
    persistedAt: string | null;
    persistedBy: string | null;
    idempotencyKey: string | null;
    previousSocialDistributionHandoffRef: string | null;
    supersedesSocialDistributionHandoffRef: string | null;
    handoffVersion: number | null;
  };

export type VoxyRenderSocialDistributionStoreResult = {
  ok: boolean;
  status: VoxyRenderSocialDistributionStoreResultStatus;
  record: VoxyRenderSocialDistributionHandoffRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderSocialDistributionNextStep;
};

export type VoxyRenderSocialDistributionPersistenceState = {
  mode: VoxyRenderSocialDistributionPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderSocialDistributionHandoffRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderSocialDistributionHandoffPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderSocialDistributionHandoffCommand | VoxyRenderSocialDistributionHandoffRecord;
  handoffStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    socialDistributionHandoffId: string;
    handoffStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    handoffVersion: number | null;
    publishReadinessGuardId: string | null | undefined;
  } | null;
  commandPreview: {
    handoffStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    publishReadinessGuardId: string | null | undefined;
  };
  platformLines: string[];
  copyVariantLines: string[];
  scheduleLines: string[];
  semanticsLines: string[];
  effectLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

type BuildSocialDistributionInput = {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestPublishReadinessGuardRecord?: VoxyRenderPublishReadinessGuardRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: SocialDistributionRef | null;
  createdAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function sanitizeIdFragment(value: string) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function defaultStoreState(): VoxyRenderSocialDistributionPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Social-Distribution-Handoff-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Social-Distribution-Vorschau. Echte Audit-Persistenz bleibt auf dem server-only Admin-Pfad.",
    repositoryInterface: "VoxyRenderSocialDistributionHandoffRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function pickFirstRef<T extends SocialDistributionRef | null | undefined>(...values: T[]) {
  return values.find((value) => Boolean(value?.id && value?.title)) ?? null;
}

function platformLabel(value: VoxyRenderSocialDistributionTarget) {
  if (value === "x_twitter") return "X/Twitter";
  if (value === "internal_review") return "Interne Prüfung";
  if (value === "linkedin") return "LinkedIn";
  if (value === "instagram") return "Instagram";
  if (value === "tiktok") return "TikTok";
  if (value === "youtube") return "YouTube";
  if (value === "newsletter") return "Newsletter";
  if (value === "website") return "Website";
  return "Kein Kanal";
}

function platformStatusLabel(value: VoxyRenderSocialDistributionPlatformStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "needs_review") return "Review nötig";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function copyStatusLabel(value: VoxyRenderSocialDistributionCopyStatus) {
  if (value === "draft_only") return "Nur Draft";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function scheduleStatusLabel(value: VoxyRenderSocialDistributionScheduleStatus) {
  if (value === "no_schedule") return "Kein Schedule";
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "needs_policy") return "Policy fehlt";
  return "Blockiert";
}

export function voxyRenderSocialDistributionHandoffStatusLabel(
  value: VoxyRenderSocialDistributionHandoffStatus,
) {
  if (value === "social_distribution_handoff_only") return "Nur Social-Distribution-Handoff";
  if (value === "noop_distribution") return "Noop Distribution";
  if (value === "not_distribution_ready") return "Noch nicht distributionsbereit";
  if (value === "blocked_by_publish_guard") return "Vom Publish-Guard blockiert";
  if (value === "blocked_by_missing_publish_readiness_guard") {
    return "Ohne Publish-Readiness-Guard blockiert";
  }
  if (value === "blocked_by_missing_media") return "Reale Medien-Datei fehlt";
  if (value === "blocked_by_upload_guard") return "Upload blockiert";
  if (value === "blocked_by_scheduling_guard") return "Scheduling blockiert";
  if (value === "blocked_by_social_posting_guard") return "Social Posting blockiert";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

export function voxyRenderSocialDistributionNextStepLabel(
  value: VoxyRenderSocialDistributionNextStep,
) {
  if (value === "keep_distribution_blocked") return "Distribution blockiert halten";
  if (value === "prepare_copy_review") return "Copy Review vorbereiten";
  if (value === "require_real_media_file") return "Reale Medien-Datei erforderlich";
  if (value === "require_upload_runtime") return "Upload-Runtime erforderlich";
  if (value === "require_social_review") return "Social Review erforderlich";
  if (value === "require_scheduling_policy") return "Scheduling-Policy erforderlich";
  if (value === "require_platform_configuration") return "Plattform-Konfiguration erforderlich";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blocker klären";
}

export function buildVoxyRenderSocialDistributionExecutionFlags(): VoxyRenderSocialDistributionExecutionFlags {
  return {
    publishAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    platformApiCallAllowed: false,
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderSocialDistributionEffects(): VoxyRenderSocialDistributionEffects {
  return {
    blocksUpload: true,
    blocksScheduling: true,
    blocksSocialPosting: true,
    blocksPublish: true,
    createsUpload: false,
    createsSchedule: false,
    createsSocialPost: false,
    triggersPublish: false,
    createsRenderJob: false,
    triggersRerender: false,
    triggersProvider: false,
    createsQueueJob: false,
    createsMediaFile: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildDistributionSemantics(): VoxyRenderSocialDistributionSemantics {
  return {
    publishReady: false,
    published: false,
    uploaded: false,
    scheduled: false,
    socialPosted: false,
    platformApiCalled: false,
    autoPublishAllowed: false,
  };
}

function resolvePublishGuardPreview(
  input: BuildSocialDistributionInput,
):
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord
  | null {
  if (input.latestPublishReadinessGuardRecord) return input.latestPublishReadinessGuardRecord;
  if (!input.previewFlow) return null;
  return buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
    previewFlow: input.previewFlow,
    latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
    latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
    latestBacklog: input.latestBacklog ?? null,
    latestMatrix: input.latestMatrix ?? null,
    latestRequestDraft: input.latestRequestDraft ?? null,
    gate: input.gate ?? null,
    reviewerRef: input.reviewerRef ?? null,
    createdAt: input.createdAt ?? null,
  });
}

function buildPlatformCandidates(input: {
  contributionTitle: string;
}): VoxyRenderSocialDistributionPlatformCandidate[] {
  const baseReason =
    `Kanal bleibt nur Kandidat für "${input.contributionTitle}" und startet weder Upload noch Posting noch Scheduling.`;
  const platforms: VoxyRenderSocialDistributionTarget[] = [
    "internal_review",
    "website",
    "newsletter",
    "linkedin",
    "x_twitter",
    "instagram",
    "tiktok",
    "youtube",
  ];
  return [
    ...platforms,
  ].map((platform) => ({
    platform,
    label: platformLabel(platform),
    status: "candidate_only",
    platformApiCallAllowed: false,
    uploadAllowed: false,
    postAllowed: false,
    scheduleAllowed: false,
    reviewerVisibleReason: baseReason,
    userVisibleReason: baseReason,
  }));
}

function buildCopyVariants(input: {
  title: string;
  rtlRequired: boolean;
}): VoxyRenderSocialDistributionCopyVariant[] {
  const candidates: Array<{
    platform: VoxyRenderSocialDistributionTarget;
    status: VoxyRenderSocialDistributionCopyStatus;
    suffix: string;
  }> = [
    { platform: "internal_review", status: "draft_only", suffix: "Review-Draft" },
    { platform: "website", status: "draft_only", suffix: "Website-Hinweis" },
    { platform: "newsletter", status: "needs_review", suffix: "Newsletter-Entwurf" },
    { platform: "linkedin", status: "needs_review", suffix: "LinkedIn-Entwurf" },
    { platform: "x_twitter", status: "needs_review", suffix: "Kurzpost-Entwurf" },
  ];

  return candidates.map((candidate) => ({
    variantId: `social-copy-${sanitizeIdFragment(candidate.platform)}-${sanitizeIdFragment(
      input.title || "draft",
    )}`,
    platform: candidate.platform,
    label: platformLabel(candidate.platform),
    status: input.rtlRequired && candidate.platform !== "internal_review"
      ? "needs_review"
      : candidate.status,
    headline: `${input.title} · ${candidate.suffix}`.trim(),
    body:
      candidate.platform === "internal_review"
        ? "Interner Review-Draft. Kein Posting, kein Upload, kein Scheduling."
        : "Review-Draft für spätere Distribution. Noch kein Posting, kein Upload, kein Scheduling.",
    hashtags: [],
    cta: null,
    sourceCaptionRequired: true,
    languageReviewRequired: candidate.platform !== "internal_review" || input.rtlRequired,
    legalReviewRequired: candidate.platform !== "internal_review",
    posted: false,
    scheduled: false,
    platformApiCallAllowed: false,
  }));
}

function buildScheduleCandidate(
  handoffStatus: VoxyRenderSocialDistributionHandoffStatus,
): VoxyRenderSocialDistributionScheduleCandidate {
  if (handoffStatus === "keep_as_script_only") {
    return {
      scheduleCandidateId: null,
      status: "no_schedule",
      suggestedWindow: null,
      scheduled: false,
      schedulingAllowed: false,
      reviewerVisibleReason: "Script-only-Fall: Es wird kein Schedule vorbereitet.",
      userVisibleReason: "Script-only-Fall: Es wird kein Schedule vorbereitet.",
    };
  }
  if (handoffStatus === "blocked_by_missing_publish_readiness_guard") {
    return {
      scheduleCandidateId: null,
      status: "blocked",
      suggestedWindow: null,
      scheduled: false,
      schedulingAllowed: false,
      reviewerVisibleReason:
        "Ohne Publish-Readiness-Guard gibt es keinen belastbaren Ausgangspunkt für Schedule-Kandidaten.",
      userVisibleReason:
        "Ohne Publish-Readiness-Guard wird kein Schedule vorbereitet.",
    };
  }
  return {
    scheduleCandidateId: null,
    status: "needs_policy",
    suggestedWindow: null,
    scheduled: false,
    schedulingAllowed: false,
    reviewerVisibleReason:
      "Es gibt bewusst keine echte Scheduling-Policy und keine belastbare Zeitquelle.",
    userVisibleReason:
      "Noch keine Scheduling-Policy. Es wird kein Termin geplant.",
  };
}

export function deriveVoxyRenderSocialDistributionHandoffStatus(input: {
  publishReadinessGuardId?: string | null;
  publishGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  reviewGate?: Pick<VoxyRenderPublishReadinessGate, "status"> | null;
  mediaGate?: Pick<VoxyRenderPublishReadinessGate, "status"> | null;
  uploadGate?: Pick<VoxyRenderPublishReadinessGate, "status"> | null;
  schedulingGate?: Pick<VoxyRenderPublishReadinessGate, "status"> | null;
  socialPostingGate?: Pick<VoxyRenderPublishReadinessGate, "status"> | null;
}) {
  if (!normalizeText(input.publishReadinessGuardId)) {
    return "blocked_by_missing_publish_readiness_guard";
  }
  if (
    input.publishGuardStatusHint === "keep_as_script_only" ||
    input.previewOutcomeTypeHint === "keep_as_script_only"
  ) {
    return "keep_as_script_only";
  }
  if (input.publishGuardStatusHint === "blocked_by_runtime_truth") {
    return "blocked_by_runtime_truth";
  }
  if (input.publishGuardStatusHint === "blocked_by_missing_preview_outcome") {
    return "blocked_by_publish_guard";
  }
  if (input.publishGuardStatusHint === "downstream_blocked") {
    return "blocked_by_publish_guard";
  }
  if (input.publishGuardStatusHint === "not_publish_ready") {
    return "blocked_by_publish_guard";
  }
  if (input.publishGuardStatusHint === "media_required") {
    return "blocked_by_missing_media";
  }
  if (input.publishGuardStatusHint === "upload_blocked") {
    return "blocked_by_upload_guard";
  }
  if (input.publishGuardStatusHint === "scheduling_blocked") {
    return "blocked_by_scheduling_guard";
  }
  if (input.publishGuardStatusHint === "social_posting_blocked") {
    return "blocked_by_social_posting_guard";
  }
  if (input.mediaGate?.status === "blocked" || input.mediaGate?.status === "no_go") {
    return "blocked_by_missing_media";
  }
  if (input.uploadGate?.status === "blocked" || input.uploadGate?.status === "no_go") {
    return "blocked_by_upload_guard";
  }
  if (input.schedulingGate?.status === "blocked" || input.schedulingGate?.status === "no_go") {
    return "blocked_by_scheduling_guard";
  }
  if (
    input.socialPostingGate?.status === "blocked" ||
    input.socialPostingGate?.status === "no_go"
  ) {
    return "blocked_by_social_posting_guard";
  }
  if (input.reviewGate?.status === "needs_review" || input.reviewGate?.status === "blocked") {
    return "blocked_by_publish_guard";
  }
  if (
    input.publishGuardStatusHint === "review_ready_only" ||
    input.publishGuardStatusHint === "approval_required"
  ) {
    return "not_distribution_ready";
  }
  return "social_distribution_handoff_only";
}

function nextStepForStatus(
  value: VoxyRenderSocialDistributionHandoffStatus,
): VoxyRenderSocialDistributionNextStep {
  if (value === "blocked_by_missing_publish_readiness_guard") return "blocked";
  if (value === "blocked_by_missing_media") return "require_real_media_file";
  if (value === "blocked_by_upload_guard") return "require_upload_runtime";
  if (value === "blocked_by_scheduling_guard") return "require_scheduling_policy";
  if (value === "blocked_by_social_posting_guard") return "require_social_review";
  if (value === "keep_as_script_only") return "keep_as_script_only";
  if (value === "blocked_by_runtime_truth") return "require_platform_configuration";
  if (value === "not_distribution_ready") return "prepare_copy_review";
  return "keep_distribution_blocked";
}

function summaryForStatus(value: VoxyRenderSocialDistributionHandoffStatus) {
  if (value === "blocked_by_missing_publish_readiness_guard") {
    return "Ohne Publish-Readiness-Guard bleibt die Distribution rein hypothetisch und blockiert.";
  }
  if (value === "blocked_by_publish_guard") {
    return "Der Publish-Guard blockiert Distribution weiterhin. Es gibt noch keine belastbare Veröffentlichungsnähe.";
  }
  if (value === "blocked_by_missing_media") {
    return "Es gibt keine echte Medien-Datei. Distribution bleibt audit-only und blockiert.";
  }
  if (value === "blocked_by_upload_guard") {
    return "Es gibt keine Upload-Runtime. Plattform-Kandidaten bleiben reine Review-Kandidaten.";
  }
  if (value === "blocked_by_scheduling_guard") {
    return "Es gibt keine Scheduling-Policy. Schedule-Kandidaten bleiben bewusst ungebucht.";
  }
  if (value === "blocked_by_social_posting_guard") {
    return "Es gibt keine Social-Posting-Runtime. Copy bleibt reiner Review-Draft.";
  }
  if (value === "blocked_by_runtime_truth") {
    return "Runtime-Wahrheit fehlt. Distribution bleibt rein lesend und ohne API- oder Upload-Behauptung.";
  }
  if (value === "keep_as_script_only") {
    return "Der Fall bleibt bewusst Script-only und erzeugt keinen Distribution-Folgepfad.";
  }
  if (value === "not_distribution_ready") {
    return "Review-ready oder Approval-Hinweise reichen nicht für Distribution. Es bleibt beim review-first Handoff.";
  }
  return "Die Distribution wird nur als review-first Handoff vorbereitet. Es entsteht kein Upload, kein Posting, kein Scheduling und keine Veröffentlichung.";
}

function reviewerSummaryForStatus(value: VoxyRenderSocialDistributionHandoffStatus) {
  return `${summaryForStatus(value)} Keine Plattform-API, keine Fake-URL und keine Runtime-Wahrheit.`;
}

function buildTopBlockers(input: {
  handoffStatus: VoxyRenderSocialDistributionHandoffStatus;
  publishGuardStatusLabel: string | null;
}) {
  const blockers: string[] = [];
  if (input.publishGuardStatusLabel) {
    blockers.push(`Publish Readiness: ${input.publishGuardStatusLabel}`);
  }
  if (input.handoffStatus === "blocked_by_missing_publish_readiness_guard") {
    blockers.push("Ohne Publish-Readiness-Guard bleibt Distribution blockiert.");
  }
  if (input.handoffStatus === "blocked_by_publish_guard") {
    blockers.push("Der Publish-Guard hält Upload, Posting, Scheduling und Veröffentlichung weiter blockiert.");
  }
  if (input.handoffStatus === "blocked_by_missing_media") {
    blockers.push("Es gibt keine echte Medien-Datei.");
  }
  if (input.handoffStatus === "blocked_by_upload_guard") {
    blockers.push("Es gibt keine Upload-Runtime.");
  }
  if (input.handoffStatus === "blocked_by_scheduling_guard") {
    blockers.push("Es gibt keine Scheduling-Policy.");
  }
  if (input.handoffStatus === "blocked_by_social_posting_guard") {
    blockers.push("Es gibt keine Social-Posting-Runtime.");
  }
  if (input.handoffStatus === "blocked_by_runtime_truth") {
    blockers.push("Runtime-Wahrheit darf nicht behauptet werden.");
  }
  if (input.handoffStatus === "keep_as_script_only") {
    blockers.push("Der Fall bleibt bewusst Script-only.");
  }
  return uniqueStrings(blockers);
}

export function buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels(
  input: BuildSocialDistributionInput,
): VoxyRenderSocialDistributionHandoffCommand {
  const publishGuardPreview = resolvePublishGuardPreview(input);
  const publishGuardStatusLabel = publishGuardPreview?.guardStatus
    ? voxyRenderPublishReadinessGuardStatusLabel(publishGuardPreview.guardStatus)
    : null;
  const handoffStatus = deriveVoxyRenderSocialDistributionHandoffStatus({
    publishReadinessGuardId: publishGuardPreview?.publishReadinessGuardId ?? null,
    publishGuardStatusHint: publishGuardPreview?.guardStatus ?? null,
    previewOutcomeTypeHint:
      publishGuardPreview?.previewOutcomeTypeHint ??
      input.latestPreviewOutcomeHandoffRecord?.outcomeType ??
      null,
    reviewGate: publishGuardPreview?.reviewGate ?? null,
    mediaGate: publishGuardPreview?.mediaGate ?? null,
    uploadGate: publishGuardPreview?.uploadGate ?? null,
    schedulingGate: publishGuardPreview?.schedulingGate ?? null,
    socialPostingGate: publishGuardPreview?.socialPostingGate ?? null,
  });
  const nextStep = nextStepForStatus(handoffStatus);
  const contributionRef = pickFirstRef(
    publishGuardPreview?.contributionRef ?? null,
    input.latestPreviewOutcomeHandoffRecord?.contributionRef ?? null,
    input.previewFlow?.contributionRef ?? null,
  );
  const dossierRef = pickFirstRef(
    publishGuardPreview?.dossierRef ?? null,
    input.latestPreviewOutcomeHandoffRecord?.dossierRef ?? null,
    input.previewFlow?.dossierRef ?? null,
  );
  const scriptRef = pickFirstRef(
    publishGuardPreview?.scriptRef ?? null,
    input.latestPreviewOutcomeHandoffRecord?.scriptRef ?? null,
    input.previewFlow?.scriptRef ?? null,
  );
  const reviewerRef = pickFirstRef(
    input.reviewerRef ?? null,
    publishGuardPreview?.reviewerRef ?? null,
    input.latestPreviewOutcomeHandoffRecord?.reviewerRef ?? null,
  );
  const title =
    contributionRef?.title ??
    dossierRef?.title ??
    scriptRef?.title ??
    "Voxy Distribution Draft";
  const platformCandidates = buildPlatformCandidates({ contributionTitle: title });
  const copyVariants = buildCopyVariants({
    title,
    rtlRequired: publishGuardPreview?.rtlRequired ?? input.previewFlow?.rtlRequired ?? false,
  });
  const scheduleCandidate = buildScheduleCandidate(handoffStatus);
  const topBlockers = buildTopBlockers({
    handoffStatus,
    publishGuardStatusLabel,
  });

  return {
    socialDistributionHandoffId: null,
    publishReadinessGuardId: publishGuardPreview?.publishReadinessGuardId ?? null,
    previewOutcomeHandoffId: publishGuardPreview?.previewOutcomeHandoffId ?? null,
    previewReviewDecisionRecordId:
      publishGuardPreview?.previewReviewDecisionRecordId ??
      input.latestPreviewReviewDecisionRecord?.decisionRecordId ??
      null,
    previewReviewFlowId:
      publishGuardPreview?.previewReviewFlowId ?? input.previewFlow?.previewReviewFlowId ?? null,
    enablementBacklogId:
      publishGuardPreview?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      input.previewFlow?.enablementBacklogId ??
      null,
    matrixId:
      publishGuardPreview?.matrixId ??
      input.latestMatrix?.matrixId ??
      input.previewFlow?.matrixId ??
      null,
    requestDraftId:
      publishGuardPreview?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      input.previewFlow?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef,
    createdAt:
      normalizeText(input.createdAt) ||
      publishGuardPreview?.createdAt ||
      input.latestPreviewOutcomeHandoffRecord?.createdAt ||
      null,
    updatedAt:
      publishGuardPreview?.updatedAt ??
      input.latestPreviewOutcomeHandoffRecord?.updatedAt ??
      null,
    sourceLanguage: publishGuardPreview?.sourceLanguage ?? input.previewFlow?.sourceLanguage ?? "de",
    readingLanguage:
      publishGuardPreview?.readingLanguage ?? input.previewFlow?.readingLanguage ?? "de",
    scriptLanguage: publishGuardPreview?.scriptLanguage ?? input.previewFlow?.scriptLanguage ?? "de",
    renderLanguage: publishGuardPreview?.renderLanguage ?? input.previewFlow?.renderLanguage ?? "de",
    subtitleLanguage:
      publishGuardPreview?.subtitleLanguage ?? input.previewFlow?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: publishGuardPreview?.rtlRequired ?? input.previewFlow?.rtlRequired ?? false,
    handoffStatus,
    platformCandidates,
    copyVariants,
    scheduleCandidate,
    distributionSemantics: buildDistributionSemantics(),
    guardEffects: buildVoxyRenderSocialDistributionEffects(),
    executionFlags: buildVoxyRenderSocialDistributionExecutionFlags(),
    topBlockers,
    nextStep,
    userVisibleSummary: summaryForStatus(handoffStatus),
    reviewerVisibleSummary: reviewerSummaryForStatus(handoffStatus),
    publishGuardStatusHint: publishGuardPreview?.guardStatus ?? null,
    previewOutcomeTypeHint:
      publishGuardPreview?.previewOutcomeTypeHint ??
      input.latestPreviewOutcomeHandoffRecord?.outcomeType ??
      null,
    previewOutcomeStatusHint:
      publishGuardPreview?.previewOutcomeStatusHint ??
      input.latestPreviewOutcomeHandoffRecord?.handoffStatus ??
      null,
    previewReviewDecisionTypeHint:
      publishGuardPreview?.previewReviewDecisionTypeHint ??
      input.latestPreviewReviewDecisionRecord?.decisionType ??
      null,
    previewReviewDecisionStatusHint:
      publishGuardPreview?.previewReviewDecisionStatusHint ??
      input.latestPreviewReviewDecisionRecord?.decisionStatus ??
      null,
    previewReviewFlowStatusHint:
      publishGuardPreview?.previewReviewFlowStatusHint ?? input.previewFlow?.previewStatus ?? null,
  };
}

export function buildVoxyRenderSocialDistributionHandoffPanelModel(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPublishReadinessGuardRecord?: VoxyRenderPublishReadinessGuardRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestRecord?: VoxyRenderSocialDistributionHandoffRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  storeState?: VoxyRenderSocialDistributionPersistenceState | VoxyRenderPublishReadinessPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow: input.previewFlow,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });

  const storeState = input.storeState
    ? {
        ...input.storeState,
        repositoryInterface: "VoxyRenderSocialDistributionHandoffRepository" as const,
      }
    : defaultStoreState();

  const platformLines = preview.platformCandidates.map(
    (item) =>
      `${item.label}: ${platformStatusLabel(item.status)} · Kein Upload · Kein Posting · Keine Plattform-API`,
  );
  const copyVariantLines = preview.copyVariants.map((item) => {
    const title = item.headline ?? item.label;
    return `${item.label}: ${copyStatusLabel(item.status)} · ${title} · Nicht gepostet`;
  });
  const scheduleLines = [
    `${scheduleStatusLabel(preview.scheduleCandidate.status)} · ${
      preview.scheduleCandidate.suggestedWindow ?? "Keine Zeitquelle"
    } · Nicht geplant`,
  ];
  const semanticsLines = [
    "publish_ready bleibt false",
    "published bleibt false",
    "uploaded bleibt false",
    "scheduled bleibt false",
    "social_posted bleibt false",
    "platform_api_called bleibt false",
  ];
  const effectLines = [
    "Kein Upload wird erzeugt",
    "Kein Social Post wird erzeugt",
    "Kein Schedule wird erzeugt",
    "Kein Publish wird ausgelöst",
    "Kein Render, kein Re-Render, keine Queue, kein Provider",
  ];
  const auditLines = uniqueStrings([
    preview.publishReadinessGuardId
      ? `Publish Guard: ${preview.publishReadinessGuardId}`
      : "Noch kein Publish Guard",
    preview.previewOutcomeHandoffId
      ? `Preview Outcome: ${preview.previewOutcomeHandoffId}`
      : "Noch kein Preview Outcome",
    preview.previewReviewDecisionRecordId
      ? `Preview Review Decision: ${preview.previewReviewDecisionRecordId}`
      : "Noch keine persistierte Preview-Decision",
    preview.publishGuardStatusHint
      ? `Publish Readiness: ${voxyRenderPublishReadinessGuardStatusLabel(
          preview.publishGuardStatusHint,
        )}`
      : null,
    "distribution_handoff ist kein social_post",
    "platform_candidate ist kein platform_api_call",
    "schedule_candidate ist nicht scheduled",
  ]);

  return {
    title: "Social Distribution",
    summary: preview.userVisibleSummary,
    preview,
    handoffStatusLabel: voxyRenderSocialDistributionHandoffStatusLabel(preview.handoffStatus),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          socialDistributionHandoffId: input.latestRecord.socialDistributionHandoffId,
          handoffStatusLabel: voxyRenderSocialDistributionHandoffStatusLabel(
            input.latestRecord.handoffStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          handoffVersion: input.latestRecord.handoffVersion,
          publishReadinessGuardId: input.latestRecord.publishReadinessGuardId,
        }
      : null,
    commandPreview: {
      handoffStatusLabel: voxyRenderSocialDistributionHandoffStatusLabel(preview.handoffStatus),
      nextStepLabel: voxyRenderSocialDistributionNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      publishReadinessGuardId: preview.publishReadinessGuardId,
    },
    platformLines,
    copyVariantLines,
    scheduleLines,
    semanticsLines,
    effectLines,
    auditLines,
    topBlockers: preview.topBlockers,
    nextStep: voxyRenderSocialDistributionNextStepLabel(preview.nextStep),
  } satisfies VoxyRenderSocialDistributionHandoffPanelModel;
}
