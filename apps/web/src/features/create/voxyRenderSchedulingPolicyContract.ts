import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderApprovalSemanticsCommand,
  VoxyRenderApprovalSemanticsRecord,
  VoxyRenderApprovalSemanticsStatus,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview,
  buildVoxyRenderApprovalSemanticsFromReviewContext,
  buildVoxyRenderApprovalSemanticsFromVoxyDialog,
  voxyRenderApprovalSemanticsStatusLabel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import type {
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
  VoxyRenderMediaStorageTruthStatus,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  buildVoxyRenderMediaStorageTruthCommandFromReadmodels,
  voxyRenderMediaStorageTruthStatusLabel,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import type {
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStatus,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview,
  buildVoxyRenderPreviewReviewFlowFromReviewContext,
  buildVoxyRenderPreviewReviewFlowFromVoxyDialog,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
  VoxyRenderPublishReadinessGuardStatus,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderPublishReadinessGuardCommandFromReadmodels,
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type { VoxyRenderRequestDraftRecord } from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
} from "@/features/create/voxyRenderRequestDraftContract";
import type { VoxyRenderReviewDecisionGateModel } from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type { VoxyRenderRuntimeEnablementBacklogRecord } from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview,
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type { VoxyRenderRuntimeGoNogoMatrixRecord } from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview,
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import type {
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
  VoxyRenderSocialDistributionHandoffStatus,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels,
  voxyRenderSocialDistributionHandoffStatusLabel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import type {
  VoxyRenderUploadTargetPolicyCommand,
  VoxyRenderUploadTargetPolicyRecord,
  VoxyRenderUploadTargetPolicyStatus,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";
import {
  buildVoxyRenderUploadTargetPolicyCommandFromReadmodels,
  voxyRenderUploadTargetPolicyStatusLabel,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";

export const VOXY_RENDER_SCHEDULING_POLICY_STATUSES = [
  "scheduling_policy_only",
  "noop_scheduling",
  "no_schedule_candidate",
  "schedule_candidate_only",
  "publish_window_needed",
  "timezone_policy_needed",
  "platform_timing_policy_needed",
  "calendar_policy_needed",
  "scheduler_runtime_needed",
  "blocked_by_missing_upload_target_policy",
  "blocked_by_missing_approval_semantics",
  "blocked_by_missing_media_file",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderSchedulingPolicyStatus =
  (typeof VOXY_RENDER_SCHEDULING_POLICY_STATUSES)[number];

export const VOXY_RENDER_SCHEDULE_CANDIDATE_STATUSES = [
  "candidate_only",
  "no_schedule",
  "policy_needed",
  "runtime_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderScheduleCandidateStatus =
  (typeof VOXY_RENDER_SCHEDULE_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_PUBLISH_WINDOW_STATUSES = [
  "candidate_only",
  "policy_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderPublishWindowStatus =
  (typeof VOXY_RENDER_PUBLISH_WINDOW_STATUSES)[number];

export const VOXY_RENDER_CALENDAR_HINT_STATUSES = [
  "hint_only",
  "no_calendar_event",
  "policy_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderCalendarHintStatus =
  (typeof VOXY_RENDER_CALENDAR_HINT_STATUSES)[number];

export const VOXY_RENDER_SCHEDULING_POLICY_NEXT_STEPS = [
  "define_publish_window_policy",
  "define_timezone_policy",
  "define_platform_timing_policy",
  "define_calendar_policy",
  "configure_scheduler_runtime",
  "require_real_media_file",
  "require_upload_runtime",
  "keep_scheduling_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderSchedulingPolicyNextStep =
  (typeof VOXY_RENDER_SCHEDULING_POLICY_NEXT_STEPS)[number];

export const VOXY_RENDER_SCHEDULING_POLICY_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderSchedulingPolicyStoreResultStatus =
  (typeof VOXY_RENDER_SCHEDULING_POLICY_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_SCHEDULING_POLICY_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderSchedulingPolicyPersistenceMode =
  (typeof VOXY_RENDER_SCHEDULING_POLICY_PERSISTENCE_MODES)[number];

type SchedulingPolicyRef = {
  id: string;
  title: string;
  href?: string | null;
};

type UploadTargetPolicyPreview =
  | VoxyRenderUploadTargetPolicyCommand
  | VoxyRenderUploadTargetPolicyRecord;

type MediaStorageTruthPreview =
  | VoxyRenderMediaStorageTruthCommand
  | VoxyRenderMediaStorageTruthRecord;

type ApprovalPreview =
  | VoxyRenderApprovalSemanticsCommand
  | VoxyRenderApprovalSemanticsRecord;

type PublishReadinessPreview =
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord;

type SocialDistributionPreview =
  | VoxyRenderSocialDistributionHandoffCommand
  | VoxyRenderSocialDistributionHandoffRecord;

export type VoxyRenderScheduleCandidate = {
  scheduleCandidateId: string | null;
  status: VoxyRenderScheduleCandidateStatus;
  suggestedWindow: string | null;
  timezone: string | null;
  platform: string | null;
  scheduledAt: string | null;
  scheduled: false;
  schedulingAllowed: false;
  schedulerJobCreated: false;
  calendarEventCreated: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderPublishWindow = {
  publishWindowId: string | null;
  status: VoxyRenderPublishWindowStatus;
  earliestPublishAt: string | null;
  latestPublishAt: string | null;
  timezonePolicyNeeded: boolean;
  platformTimingPolicyNeeded: boolean;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderCalendarHint = {
  calendarHintId: string | null;
  status: VoxyRenderCalendarHintStatus;
  calendarEventCreated: false;
  calendarWriteAllowed: false;
  reminderCreated: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderSchedulingSemantics = {
  scheduleCandidate: boolean;
  scheduled: false;
  schedulerJobCreated: false;
  calendarEventCreated: false;
  postedAtAvailable: false;
  distributionTimeFinal: false;
  uploadReady: false;
  published: false;
  socialPosted: false;
};

export type VoxyRenderSchedulingExecutionFlags = {
  schedulingAllowed: false;
  schedulerJobAllowed: false;
  calendarWriteAllowed: false;
  reminderAllowed: false;
  publishAllowed: false;
  uploadAllowed: false;
  storageWriteAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  createsMediaFile: false;
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderSchedulingPolicyCommand = {
  schedulingPolicyId?: string | null;
  uploadTargetPolicyId?: string | null;
  mediaStorageTruthId?: string | null;
  approvalSemanticsId?: string | null;
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: SchedulingPolicyRef | null;
  contributionRef?: SchedulingPolicyRef | null;
  dossierRef?: SchedulingPolicyRef | null;
  reviewerRef?: SchedulingPolicyRef | null;
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
  schedulingPolicyStatus: VoxyRenderSchedulingPolicyStatus;
  scheduleCandidate: VoxyRenderScheduleCandidate;
  publishWindow: VoxyRenderPublishWindow;
  calendarHint: VoxyRenderCalendarHint;
  schedulingSemantics: VoxyRenderSchedulingSemantics;
  executionFlags: VoxyRenderSchedulingExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderSchedulingPolicyNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  uploadTargetPolicyStatusHint?: VoxyRenderUploadTargetPolicyStatus | null;
  mediaStorageTruthStatusHint?: VoxyRenderMediaStorageTruthStatus | null;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  publishReadinessGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionHandoffStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderSchedulingPolicyRecord = VoxyRenderSchedulingPolicyCommand & {
  schedulingPolicyId: string;
  persistedAt: string;
  persistedBy: string | null;
  idempotencyKey: string;
  previousSchedulingPolicyRef: string | null;
  supersedesSchedulingPolicyRef: string | null;
  schedulingPolicyVersion: number | null;
};

export type VoxyRenderSchedulingPolicyPersistenceState = {
  mode: VoxyRenderSchedulingPolicyPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: string;
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyRenderSchedulingPolicyStoreResult = {
  ok: boolean;
  status: VoxyRenderSchedulingPolicyStoreResultStatus;
  record: VoxyRenderSchedulingPolicyRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderSchedulingPolicyNextStep;
};

export type VoxyRenderSchedulingPolicyPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderSchedulingPolicyCommand | VoxyRenderSchedulingPolicyRecord;
  schedulingPolicyStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    schedulingPolicyId: string;
    schedulingPolicyStatusLabel: string;
    persistedAt: string;
    persistedBy: string | null;
    schedulingPolicyVersion: number | null;
    uploadTargetPolicyId: string | null;
  } | null;
  commandPreview: {
    schedulingPolicyStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    uploadTargetPolicyId: string | null | undefined;
  };
  scheduleCandidateLine: string;
  publishWindowLine: string;
  timezonePolicyLine: string;
  platformTimingPolicyLine: string;
  calendarHintLine: string;
  semanticsLines: string[];
  executionLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

export type BuildSchedulingPolicyInput = {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: SchedulingPolicyRef | null;
  publishWindowPolicyDefined?: boolean;
  timezonePolicyDefined?: boolean;
  platformTimingPolicyDefined?: boolean;
  calendarPolicyDefined?: boolean;
  schedulerRuntimeDefined?: boolean;
  createdAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sanitizeIdFragment(value: string) {
  return normalizeText(value).replace(/[^a-zA-Z0-9:_-]+/g, "-");
}

function pickFirstRef<T extends SchedulingPolicyRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeText(value.id);
    const title = normalizeText(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: normalizeText(value.href) || null,
    } satisfies SchedulingPolicyRef;
  }
  return null;
}

function asPublishReadinessRecord(
  value: PublishReadinessPreview | null | undefined,
): VoxyRenderPublishReadinessGuardRecord | null {
  if (!value) return null;
  return "persistedAt" in value ? value : null;
}

function firstPlatformLabel(value: SocialDistributionPreview | null | undefined) {
  const platform =
    value?.platformCandidates.find((candidate) => candidate.platform !== "none") ?? null;
  return platform?.label ?? null;
}

export function voxyRenderSchedulingPolicyStatusLabel(
  value: VoxyRenderSchedulingPolicyStatus,
) {
  if (value === "scheduling_policy_only") return "Nur Scheduling-Policy";
  if (value === "noop_scheduling") return "Noop Scheduling";
  if (value === "no_schedule_candidate") return "Noch kein Schedule-Kandidat";
  if (value === "schedule_candidate_only") return "Nur Schedule-Kandidat";
  if (value === "publish_window_needed") return "Publish Window fehlt";
  if (value === "timezone_policy_needed") return "Timezone-Policy fehlt";
  if (value === "platform_timing_policy_needed") return "Plattform-Timing fehlt";
  if (value === "calendar_policy_needed") return "Kalender-Policy fehlt";
  if (value === "scheduler_runtime_needed") return "Scheduler-Runtime fehlt";
  if (value === "blocked_by_missing_upload_target_policy") {
    return "Ohne Upload-Target-Policy blockiert";
  }
  if (value === "blocked_by_missing_approval_semantics") {
    return "Ohne Approval-Semantik blockiert";
  }
  if (value === "blocked_by_missing_media_file") return "Medien-Datei fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Als Script pausiert";
}

export function scheduleCandidateStatusLabel(value: VoxyRenderScheduleCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "no_schedule") return "Kein Schedule";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "runtime_needed") return "Runtime fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function publishWindowStatusLabel(value: VoxyRenderPublishWindowStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function calendarHintStatusLabel(value: VoxyRenderCalendarHintStatus) {
  if (value === "hint_only") return "Nur Hinweis";
  if (value === "no_calendar_event") return "Kein Kalendertermin";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function voxyRenderSchedulingPolicyNextStepLabel(
  value: VoxyRenderSchedulingPolicyNextStep,
) {
  if (value === "define_publish_window_policy") return "Publish Window definieren";
  if (value === "define_timezone_policy") return "Timezone-Policy definieren";
  if (value === "define_platform_timing_policy") return "Plattform-Timing definieren";
  if (value === "define_calendar_policy") return "Kalender-Policy definieren";
  if (value === "configure_scheduler_runtime") return "Scheduler-Runtime konfigurieren";
  if (value === "require_real_media_file") return "Echte Medien-Datei verlangen";
  if (value === "require_upload_runtime") return "Upload-Runtime verlangen";
  if (value === "keep_scheduling_blocked") return "Scheduling blockiert halten";
  if (value === "keep_as_script_only") return "Als Script-only belassen";
  return "Blockiert";
}

function previewReviewFlowStatusLabel(value: VoxyRenderPreviewReviewFlowStatus) {
  if (value === "preview_review_flow_only") return "Preview-Review-Flow";
  if (value === "noop_preview_review") return "Noop-Preview-Review";
  if (value === "no_preview_available") return "Noch kein Preview";
  if (value === "needs_render_runtime") return "Render-Runtime fehlt";
  if (value === "needs_preview_asset") return "Preview-Asset fehlt";
  if (value === "blocked_by_missing_backlog") return "Backlog fehlt";
  if (value === "blocked_by_missing_matrix") return "Matrix fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Als Script pausiert";
}

export function buildVoxyRenderSchedulingExecutionFlags(): VoxyRenderSchedulingExecutionFlags {
  return {
    schedulingAllowed: false,
    schedulerJobAllowed: false,
    calendarWriteAllowed: false,
    reminderAllowed: false,
    publishAllowed: false,
    uploadAllowed: false,
    storageWriteAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    createsMediaFile: false,
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderSchedulingSemantics(input?: {
  scheduleCandidate?: boolean;
}): VoxyRenderSchedulingSemantics {
  return {
    scheduleCandidate: input?.scheduleCandidate ?? false,
    scheduled: false,
    schedulerJobCreated: false,
    calendarEventCreated: false,
    postedAtAvailable: false,
    distributionTimeFinal: false,
    uploadReady: false,
    published: false,
    socialPosted: false,
  };
}

export function deriveVoxyRenderSchedulingPolicyStatus(input: {
  uploadTargetPolicyId: string | null | undefined;
  approvalSemanticsId: string | null | undefined;
  uploadTargetPolicyStatusHint?: VoxyRenderUploadTargetPolicyStatus | null;
  mediaStorageTruthStatusHint?: VoxyRenderMediaStorageTruthStatus | null;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  publishReadinessGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionHandoffStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
  mediaFileAvailable: boolean;
  scheduleCandidateStatus: VoxyRenderScheduleCandidateStatus;
  publishWindowPolicyDefined: boolean;
  timezonePolicyDefined: boolean;
  platformTimingPolicyDefined: boolean;
  calendarPolicyDefined: boolean;
  schedulerRuntimeDefined: boolean;
}) {
  const uploadTargetPolicyId = normalizeText(input.uploadTargetPolicyId);
  const approvalSemanticsId = normalizeText(input.approvalSemanticsId);
  if (!uploadTargetPolicyId) {
    return "blocked_by_missing_upload_target_policy" as const;
  }
  if (
    input.uploadTargetPolicyStatusHint === "keep_as_script_only" ||
    input.mediaStorageTruthStatusHint === "keep_as_script_only" ||
    input.approvalStatusHint === "keep_as_script_only" ||
    input.previewReviewFlowStatusHint === "keep_as_script_only"
  ) {
    return "keep_as_script_only" as const;
  }
  if (
    input.uploadTargetPolicyStatusHint === "blocked_by_runtime_truth" ||
    input.mediaStorageTruthStatusHint === "blocked_by_runtime_truth" ||
    input.approvalStatusHint === "blocked_by_runtime_truth" ||
    input.publishReadinessGuardStatusHint === "blocked_by_runtime_truth" ||
    input.socialDistributionHandoffStatusHint === "blocked_by_runtime_truth" ||
    input.previewReviewFlowStatusHint === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth" as const;
  }
  if (!approvalSemanticsId) {
    return "blocked_by_missing_approval_semantics" as const;
  }
  if (!input.mediaFileAvailable) {
    return "blocked_by_missing_media_file" as const;
  }
  if (input.scheduleCandidateStatus === "not_applicable" || input.scheduleCandidateStatus === "no_schedule") {
    return "no_schedule_candidate" as const;
  }
  if (input.scheduleCandidateStatus === "blocked") {
    return "schedule_candidate_only" as const;
  }
  if (!input.publishWindowPolicyDefined) {
    return "publish_window_needed" as const;
  }
  if (!input.timezonePolicyDefined) {
    return "timezone_policy_needed" as const;
  }
  if (!input.platformTimingPolicyDefined) {
    return "platform_timing_policy_needed" as const;
  }
  if (!input.calendarPolicyDefined) {
    return "calendar_policy_needed" as const;
  }
  if (!input.schedulerRuntimeDefined) {
    return "scheduler_runtime_needed" as const;
  }
  if (input.scheduleCandidateStatus === "candidate_only" || input.scheduleCandidateStatus === "policy_needed") {
    return "schedule_candidate_only" as const;
  }
  return "noop_scheduling" as const;
}

function buildScheduleCandidate(input: {
  uploadTargetPolicyId: string | null;
  keepAsScriptOnly: boolean;
  mediaFileAvailable: boolean;
  socialDistributionPreview: SocialDistributionPreview | null;
}) {
  if (input.keepAsScriptOnly) {
    return {
      scheduleCandidateId: null,
      status: "not_applicable",
      suggestedWindow: null,
      timezone: null,
      platform: null,
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Der Video-Folgepfad bleibt als Script-only pausiert.",
      userVisibleReason: "Solange der Flow Script-only bleibt, gibt es keinen Schedule-Kandidaten.",
    } satisfies VoxyRenderScheduleCandidate;
  }
  if (!input.uploadTargetPolicyId) {
    return {
      scheduleCandidateId: null,
      status: "blocked",
      suggestedWindow: null,
      timezone: null,
      platform: null,
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Ohne Upload-Target-Policy bleibt Scheduling blockiert.",
      userVisibleReason: "Erst mit Upload-Target-Policy kann ein späteres Scheduling beschrieben werden.",
    } satisfies VoxyRenderScheduleCandidate;
  }
  if (!input.mediaFileAvailable) {
    return {
      scheduleCandidateId: null,
      status: "blocked",
      suggestedWindow: null,
      timezone: null,
      platform: firstPlatformLabel(input.socialDistributionPreview),
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Ohne echte Medien-Datei bleibt Scheduling ein Audit-Hinweis.",
      userVisibleReason: "Solange keine echte Medien-Datei vorliegt, wird nichts geplant.",
    } satisfies VoxyRenderScheduleCandidate;
  }
  const socialSchedule = input.socialDistributionPreview?.scheduleCandidate ?? null;
  if (!socialSchedule || socialSchedule.status === "no_schedule") {
    return {
      scheduleCandidateId: null,
      status: "no_schedule",
      suggestedWindow: null,
      timezone: null,
      platform: firstPlatformLabel(input.socialDistributionPreview),
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Es gibt bisher nur Distribution-Hinweise, aber keinen echten Schedule-Kandidaten.",
      userVisibleReason: "Noch kein Veröffentlichungsfenster beschrieben.",
    } satisfies VoxyRenderScheduleCandidate;
  }
  if (socialSchedule.status === "blocked") {
    return {
      scheduleCandidateId: socialSchedule.scheduleCandidateId,
      status: "blocked",
      suggestedWindow: null,
      timezone: null,
      platform: firstPlatformLabel(input.socialDistributionPreview),
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: socialSchedule.reviewerVisibleReason,
      userVisibleReason: socialSchedule.userVisibleReason,
    } satisfies VoxyRenderScheduleCandidate;
  }
  return {
    scheduleCandidateId: socialSchedule.scheduleCandidateId,
    status: socialSchedule.status === "needs_policy" ? "policy_needed" : "candidate_only",
    suggestedWindow: null,
    timezone: null,
    platform: firstPlatformLabel(input.socialDistributionPreview),
    scheduledAt: null,
    scheduled: false,
    schedulingAllowed: false,
    schedulerJobCreated: false,
    calendarEventCreated: false,
    reviewerVisibleReason:
      "Es gibt nur einen Distribution-Time-Kandidaten ohne Publish Window, Timezone- oder Scheduler-Policy.",
    userVisibleReason:
      "Ein möglicher Veröffentlichungszeitpunkt bleibt nur Kandidat und löst nichts aus.",
  } satisfies VoxyRenderScheduleCandidate;
}

function buildPublishWindow(input: {
  scheduleCandidateStatus: VoxyRenderScheduleCandidateStatus;
  keepAsScriptOnly: boolean;
  uploadTargetPolicyId: string | null;
  approvalSemanticsId: string | null;
  publishWindowPolicyDefined: boolean;
  timezonePolicyDefined: boolean;
  platformTimingPolicyDefined: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return {
      publishWindowId: null,
      status: "not_applicable",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: false,
      platformTimingPolicyNeeded: false,
      reviewerVisibleReason: "Script-only pausiert den Scheduling-Folgepfad.",
      userVisibleReason: "Solange der Flow Script-only bleibt, gibt es kein Publish Window.",
    } satisfies VoxyRenderPublishWindow;
  }
  if (!input.uploadTargetPolicyId || !input.approvalSemanticsId) {
    return {
      publishWindowId: null,
      status: "blocked",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: true,
      platformTimingPolicyNeeded: true,
      reviewerVisibleReason: "Ohne Upload-Target-Policy und Approval-Semantik bleibt das Publish Window blockiert.",
      userVisibleReason: "Vor einer späteren Planung fehlen noch grundlegende Review-Gates.",
    } satisfies VoxyRenderPublishWindow;
  }
  if (
    input.scheduleCandidateStatus === "not_applicable" ||
    input.scheduleCandidateStatus === "no_schedule"
  ) {
    return {
      publishWindowId: null,
      status: "not_applicable",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: false,
      platformTimingPolicyNeeded: false,
      reviewerVisibleReason: "Ohne Schedule-Kandidat gibt es auch kein Publish Window.",
      userVisibleReason: "Noch kein Zeitfenster vorbereitet.",
    } satisfies VoxyRenderPublishWindow;
  }
  if (input.scheduleCandidateStatus === "blocked") {
    return {
      publishWindowId: null,
      status: "blocked",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: true,
      platformTimingPolicyNeeded: true,
      reviewerVisibleReason: "Blockierte Upstream-Gates verhindern ein Publish Window.",
      userVisibleReason: "Vor einem späteren Zeitfenster müssen erst die Blocker geklärt werden.",
    } satisfies VoxyRenderPublishWindow;
  }
  return {
    publishWindowId: null,
    status: input.publishWindowPolicyDefined ? "candidate_only" : "policy_needed",
    earliestPublishAt: null,
    latestPublishAt: null,
    timezonePolicyNeeded: !input.timezonePolicyDefined,
    platformTimingPolicyNeeded: !input.platformTimingPolicyDefined,
    reviewerVisibleReason: input.publishWindowPolicyDefined
      ? "Ein Publish Window wäre künftig referenzierbar, bleibt hier aber ohne Termin und ohne Job."
      : "Es fehlt weiterhin eine echte Publish-Window-Policy.",
    userVisibleReason: input.publishWindowPolicyDefined
      ? "Ein späteres Zeitfenster bliebe nur Hinweis und plant noch nichts."
      : "Vor einer echten Planung fehlt ein belastbares Veröffentlichungsfenster.",
  } satisfies VoxyRenderPublishWindow;
}

function buildCalendarHint(input: {
  scheduleCandidateStatus: VoxyRenderScheduleCandidateStatus;
  keepAsScriptOnly: boolean;
  calendarPolicyDefined: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return {
      calendarHintId: null,
      status: "not_applicable",
      calendarEventCreated: false,
      calendarWriteAllowed: false,
      reminderCreated: false,
      reviewerVisibleReason: "Script-only erzeugt keinen Kalenderhinweis.",
      userVisibleReason: "Kein Kalenderhinweis im Script-only-Pfad.",
    } satisfies VoxyRenderCalendarHint;
  }
  if (
    input.scheduleCandidateStatus === "not_applicable" ||
    input.scheduleCandidateStatus === "no_schedule"
  ) {
    return {
      calendarHintId: null,
      status: "no_calendar_event",
      calendarEventCreated: false,
      calendarWriteAllowed: false,
      reminderCreated: false,
      reviewerVisibleReason: "Es entsteht bewusst kein Kalendertermin.",
      userVisibleReason: "Noch kein Kalenderhinweis und kein Termin.",
    } satisfies VoxyRenderCalendarHint;
  }
  if (input.scheduleCandidateStatus === "blocked") {
    return {
      calendarHintId: null,
      status: "blocked",
      calendarEventCreated: false,
      calendarWriteAllowed: false,
      reminderCreated: false,
      reviewerVisibleReason: "Blockierte Upstream-Gates verhindern selbst einen Kalenderhinweis.",
      userVisibleReason: "Es wird kein Termin und kein Reminder erzeugt.",
    } satisfies VoxyRenderCalendarHint;
  }
  return {
    calendarHintId: null,
    status: input.calendarPolicyDefined ? "hint_only" : "policy_needed",
    calendarEventCreated: false,
    calendarWriteAllowed: false,
    reminderCreated: false,
    reviewerVisibleReason: input.calendarPolicyDefined
      ? "Ein Kalenderhinweis bliebe audit-only und erzeugt keinen Termin."
      : "Es fehlt weiterhin eine echte Kalender-Policy.",
    userVisibleReason: input.calendarPolicyDefined
      ? "Ein späterer Kalenderhinweis bleibt nur Hinweis ohne Event."
      : "Vor einem späteren Kalenderhinweis fehlt eine belastbare Regel.",
  } satisfies VoxyRenderCalendarHint;
}

function buildTopBlockers(input: {
  status: VoxyRenderSchedulingPolicyStatus;
  scheduleCandidate: VoxyRenderScheduleCandidate;
  publishWindow: VoxyRenderPublishWindow;
  calendarHint: VoxyRenderCalendarHint;
}) {
  const blockers = [
    input.scheduleCandidate.reviewerVisibleReason,
    input.publishWindow.reviewerVisibleReason,
    input.calendarHint.reviewerVisibleReason,
  ];
  if (input.status === "blocked_by_missing_upload_target_policy") {
    blockers.unshift("Ohne Upload-Target-Policy bleibt der Scheduling-Layer blockiert.");
  }
  if (input.status === "blocked_by_missing_approval_semantics") {
    blockers.unshift("Ohne Approval-Semantik bleibt Scheduling nur hypothetisch.");
  }
  if (input.status === "blocked_by_missing_media_file") {
    blockers.unshift("Es gibt noch keine echte Medien-Datei.");
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.unshift("Runtime-Wahrheit fehlt weiterhin.");
  }
  return Array.from(new Set(blockers.map(normalizeText).filter(Boolean))).slice(0, 10);
}

function deriveNextStep(input: {
  status: VoxyRenderSchedulingPolicyStatus;
  publishWindow: VoxyRenderPublishWindow;
}) {
  if (input.status === "keep_as_script_only") return "keep_as_script_only" as const;
  if (input.status === "blocked_by_missing_upload_target_policy") {
    return "require_upload_runtime" as const;
  }
  if (input.status === "blocked_by_missing_approval_semantics") {
    return "keep_scheduling_blocked" as const;
  }
  if (input.status === "blocked_by_missing_media_file") {
    return "require_real_media_file" as const;
  }
  if (input.status === "publish_window_needed") return "define_publish_window_policy" as const;
  if (input.status === "timezone_policy_needed") return "define_timezone_policy" as const;
  if (input.status === "platform_timing_policy_needed") {
    return "define_platform_timing_policy" as const;
  }
  if (input.status === "calendar_policy_needed") return "define_calendar_policy" as const;
  if (input.status === "scheduler_runtime_needed") {
    return "configure_scheduler_runtime" as const;
  }
  if (input.publishWindow.timezonePolicyNeeded) return "define_timezone_policy" as const;
  if (input.publishWindow.platformTimingPolicyNeeded) {
    return "define_platform_timing_policy" as const;
  }
  if (input.status === "schedule_candidate_only" || input.status === "no_schedule_candidate") {
    return "keep_scheduling_blocked" as const;
  }
  return "blocked" as const;
}

function buildSummary(input: { status: VoxyRenderSchedulingPolicyStatus }) {
  if (input.status === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Scheduling Policy bleibt pausiert, weil der Voxy-Video-Folgepfad aktuell nur Script-only bleibt.",
      reviewerVisibleSummary:
        "Scheduling Policy bleibt ein pausierter Script-only-Layer ohne Termin, Job oder Event.",
    };
  }
  if (input.status === "blocked_by_missing_upload_target_policy") {
    return {
      userVisibleSummary:
        "Vor einer späteren Planung fehlt weiterhin die Upload-Target-Policy als ehrlicher Upstream-Kontext.",
      reviewerVisibleSummary:
        "Scheduling Policy bleibt ohne Upload-Target-Policy blockiert und erzeugt weder Job noch Kalendertermin.",
    };
  }
  if (input.status === "blocked_by_missing_approval_semantics") {
    return {
      userVisibleSummary:
        "Vor einer späteren Planung fehlt weiterhin die menschliche Freigabe-Semantik.",
      reviewerVisibleSummary:
        "Scheduling Policy bleibt ohne Approval-Semantik audit-only und trennt Review klar von Planung.",
    };
  }
  if (input.status === "blocked_by_missing_media_file") {
    return {
      userVisibleSummary:
        "Solange keine echte Medien-Datei vorliegt, bleibt Scheduling nur ein Review-Hinweis.",
      reviewerVisibleSummary:
        "Scheduling Policy trennt Medienverfügbarkeit sauber von Terminierung und erzeugt keinerlei Job.",
    };
  }
  return {
    userVisibleSummary:
      "Scheduling Policy beschreibt nur spätere Veröffentlichungsfenster, Timezone-Hinweise, Kalender- und Distribution-Time-Kandidaten. Es wird heute nichts geplant, gepostet oder veröffentlicht.",
    reviewerVisibleSummary:
      "Scheduling Policy bleibt ein review-first Noop-Layer ohne Schedule, Job, Kalendertermin, Posting oder Publish-Ausführung.",
  };
}

function buildSchedulingPolicyId(input: {
  uploadTargetPolicyId: string | null;
  previewReviewFlowId: string | null;
}) {
  const seed = input.uploadTargetPolicyId ?? input.previewReviewFlowId ?? "scheduling-policy";
  return `voxy-render-scheduling-policy:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderSchedulingPolicyCommandFromReadmodels(
  input: BuildSchedulingPolicyInput,
): VoxyRenderSchedulingPolicyCommand | null {
  const previewFlow = input.previewFlow ?? null;
  const effectiveApprovalPreview = input.latestApprovalSemanticsRecord ?? null;
  const effectivePublishReadinessPreview =
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  const effectiveSocialDistributionPreview =
    input.latestSocialDistributionHandoffRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPublishReadinessGuardRecord: asPublishReadinessRecord(
        effectivePublishReadinessPreview,
      ),
      latestPreviewReviewDecisionRecord: null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  const effectiveMediaStoragePreview =
    input.latestMediaStorageTruthRecord ??
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord: effectiveApprovalPreview,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  const effectiveUploadTargetPreview =
    input.latestUploadTargetPolicyRecord ??
    buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow,
      latestMediaStorageTruthRecord: effectiveMediaStoragePreview,
      latestApprovalSemanticsRecord: effectiveApprovalPreview,
      latestPublishReadinessGuardRecord: effectivePublishReadinessPreview,
      latestSocialDistributionHandoffRecord: effectiveSocialDistributionPreview,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });

  const hasAnyUpstream = Boolean(
    effectiveUploadTargetPreview ||
      effectiveMediaStoragePreview ||
      effectiveApprovalPreview ||
      effectivePublishReadinessPreview ||
      effectiveSocialDistributionPreview ||
      previewFlow ||
      input.latestRequestDraft ||
      input.gate,
  );
  if (!hasAnyUpstream) return null;

  const uploadTargetPolicyId = effectiveUploadTargetPreview?.uploadTargetPolicyId ?? null;
  const approvalSemanticsId =
    effectiveUploadTargetPreview?.approvalSemanticsId ??
    effectiveApprovalPreview?.approvalSemanticsId ??
    null;
  const mediaFileAvailable =
    effectiveMediaStoragePreview?.mediaSemantics.mediaFileAvailable ?? false;
  const keepAsScriptOnly =
    effectiveUploadTargetPreview?.uploadTargetPolicyStatus === "keep_as_script_only" ||
    effectiveMediaStoragePreview?.mediaStorageTruthStatus === "keep_as_script_only" ||
    effectiveApprovalPreview?.approvalStatus === "keep_as_script_only" ||
    previewFlow?.previewStatus === "keep_as_script_only";

  const scriptRef = pickFirstRef(
    effectiveUploadTargetPreview?.scriptRef ?? null,
    effectiveMediaStoragePreview?.scriptRef ?? null,
    effectiveApprovalPreview?.scriptRef ?? null,
    input.latestRequestDraft?.scriptRef ?? null,
    input.gate?.scriptRef ?? null,
  );
  const contributionRef = pickFirstRef(
    effectiveUploadTargetPreview?.contributionRef ?? null,
    effectiveMediaStoragePreview?.contributionRef ?? null,
    effectiveApprovalPreview?.contributionRef ?? null,
    input.latestRequestDraft?.contributionRef ?? null,
    input.gate?.contributionRef ?? null,
  );
  const dossierRef = pickFirstRef(
    effectiveUploadTargetPreview?.dossierRef ?? null,
    effectiveMediaStoragePreview?.dossierRef ?? null,
    effectiveApprovalPreview?.dossierRef ?? null,
    input.latestRequestDraft?.dossierRef ?? null,
    input.gate?.dossierRef ?? null,
  );
  const reviewerRef = pickFirstRef(
    input.reviewerRef ?? null,
    effectiveUploadTargetPreview?.reviewerRef ?? null,
    effectiveMediaStoragePreview?.reviewerRef ?? null,
    effectiveApprovalPreview?.reviewerRef ?? null,
  );

  const scheduleCandidate = buildScheduleCandidate({
    uploadTargetPolicyId,
    keepAsScriptOnly,
    mediaFileAvailable,
    socialDistributionPreview: effectiveSocialDistributionPreview,
  });
  const publishWindow = buildPublishWindow({
    scheduleCandidateStatus: scheduleCandidate.status,
    keepAsScriptOnly,
    uploadTargetPolicyId,
    approvalSemanticsId,
    publishWindowPolicyDefined: input.publishWindowPolicyDefined ?? false,
    timezonePolicyDefined: input.timezonePolicyDefined ?? false,
    platformTimingPolicyDefined: input.platformTimingPolicyDefined ?? false,
  });
  const calendarHint = buildCalendarHint({
    scheduleCandidateStatus: scheduleCandidate.status,
    keepAsScriptOnly,
    calendarPolicyDefined: input.calendarPolicyDefined ?? false,
  });
  const schedulingPolicyStatus = deriveVoxyRenderSchedulingPolicyStatus({
    uploadTargetPolicyId,
    approvalSemanticsId,
    uploadTargetPolicyStatusHint:
      effectiveUploadTargetPreview?.uploadTargetPolicyStatus ?? null,
    mediaStorageTruthStatusHint:
      effectiveMediaStoragePreview?.mediaStorageTruthStatus ?? null,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    publishReadinessGuardStatusHint:
      effectivePublishReadinessPreview?.guardStatus ?? null,
    socialDistributionHandoffStatusHint:
      effectiveSocialDistributionPreview?.handoffStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
    mediaFileAvailable,
    scheduleCandidateStatus: scheduleCandidate.status,
    publishWindowPolicyDefined: input.publishWindowPolicyDefined ?? false,
    timezonePolicyDefined: input.timezonePolicyDefined ?? false,
    platformTimingPolicyDefined: input.platformTimingPolicyDefined ?? false,
    calendarPolicyDefined: input.calendarPolicyDefined ?? false,
    schedulerRuntimeDefined: input.schedulerRuntimeDefined ?? false,
  });
  const nextStep = deriveNextStep({
    status: schedulingPolicyStatus,
    publishWindow,
  });
  const summary = buildSummary({ status: schedulingPolicyStatus });

  return {
    schedulingPolicyId: buildSchedulingPolicyId({
      uploadTargetPolicyId,
      previewReviewFlowId:
        effectiveUploadTargetPreview?.previewReviewFlowId ??
        previewFlow?.previewReviewFlowId ??
        null,
    }),
    uploadTargetPolicyId,
    mediaStorageTruthId: effectiveUploadTargetPreview?.mediaStorageTruthId ?? null,
    approvalSemanticsId,
    socialDistributionHandoffId:
      effectiveUploadTargetPreview?.socialDistributionHandoffId ??
      effectiveApprovalPreview?.socialDistributionHandoffId ??
      effectiveSocialDistributionPreview?.socialDistributionHandoffId ??
      null,
    publishReadinessGuardId:
      effectiveUploadTargetPreview?.publishReadinessGuardId ??
      effectiveApprovalPreview?.publishReadinessGuardId ??
      effectivePublishReadinessPreview?.publishReadinessGuardId ??
      null,
    previewOutcomeHandoffId:
      effectiveUploadTargetPreview?.previewOutcomeHandoffId ??
      effectiveApprovalPreview?.previewOutcomeHandoffId ??
      effectivePublishReadinessPreview?.previewOutcomeHandoffId ??
      effectiveSocialDistributionPreview?.previewOutcomeHandoffId ??
      null,
    previewReviewFlowId:
      effectiveUploadTargetPreview?.previewReviewFlowId ??
      previewFlow?.previewReviewFlowId ??
      null,
    enablementBacklogId:
      effectiveUploadTargetPreview?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      previewFlow?.enablementBacklogId ??
      null,
    matrixId:
      effectiveUploadTargetPreview?.matrixId ??
      input.latestMatrix?.matrixId ??
      previewFlow?.matrixId ??
      null,
    requestDraftId:
      effectiveUploadTargetPreview?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      previewFlow?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef,
    createdAt:
      normalizeText(input.createdAt) ||
      effectiveUploadTargetPreview?.createdAt ||
      effectiveMediaStoragePreview?.createdAt ||
      effectiveApprovalPreview?.createdAt ||
      null,
    updatedAt:
      effectiveUploadTargetPreview?.updatedAt ??
      effectiveMediaStoragePreview?.updatedAt ??
      effectiveApprovalPreview?.updatedAt ??
      null,
    sourceLanguage:
      effectiveUploadTargetPreview?.sourceLanguage ??
      effectiveMediaStoragePreview?.sourceLanguage ??
      effectiveApprovalPreview?.sourceLanguage ??
      previewFlow?.sourceLanguage ??
      "de",
    readingLanguage:
      effectiveUploadTargetPreview?.readingLanguage ??
      effectiveMediaStoragePreview?.readingLanguage ??
      effectiveApprovalPreview?.readingLanguage ??
      previewFlow?.readingLanguage ??
      "de",
    scriptLanguage:
      effectiveUploadTargetPreview?.scriptLanguage ??
      effectiveMediaStoragePreview?.scriptLanguage ??
      effectiveApprovalPreview?.scriptLanguage ??
      previewFlow?.scriptLanguage ??
      "de",
    renderLanguage:
      effectiveUploadTargetPreview?.renderLanguage ??
      effectiveMediaStoragePreview?.renderLanguage ??
      effectiveApprovalPreview?.renderLanguage ??
      previewFlow?.renderLanguage ??
      "de",
    subtitleLanguage:
      effectiveUploadTargetPreview?.subtitleLanguage ??
      effectiveMediaStoragePreview?.subtitleLanguage ??
      effectiveApprovalPreview?.subtitleLanguage ??
      previewFlow?.subtitleLanguage ??
      null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      effectiveUploadTargetPreview?.rtlRequired ??
      effectiveMediaStoragePreview?.rtlRequired ??
      effectiveApprovalPreview?.rtlRequired ??
      previewFlow?.rtlRequired ??
      false,
    schedulingPolicyStatus,
    scheduleCandidate,
    publishWindow,
    calendarHint,
    schedulingSemantics: buildVoxyRenderSchedulingSemantics({
      scheduleCandidate:
        scheduleCandidate.status !== "no_schedule" &&
        scheduleCandidate.status !== "not_applicable",
    }),
    executionFlags: buildVoxyRenderSchedulingExecutionFlags(),
    topBlockers: buildTopBlockers({
      status: schedulingPolicyStatus,
      scheduleCandidate,
      publishWindow,
      calendarHint,
    }),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    uploadTargetPolicyStatusHint:
      effectiveUploadTargetPreview?.uploadTargetPolicyStatus ?? null,
    mediaStorageTruthStatusHint:
      effectiveMediaStoragePreview?.mediaStorageTruthStatus ?? null,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    publishReadinessGuardStatusHint:
      effectivePublishReadinessPreview?.guardStatus ?? null,
    socialDistributionHandoffStatusHint:
      effectiveSocialDistributionPreview?.handoffStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
  };
}

export function buildVoxyRenderSchedulingPolicyFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(model);
  const latestBacklog =
    buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model);
  const latestMatrix = buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model);
  const latestRequestDraft = buildVoxyRenderRequestDraftFromCreateCandidatePreview(model);
  const gate = buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model);
  const latestApprovalSemanticsRecord =
    buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview(model);
  const latestPublishReadinessGuardRecord =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPublishReadinessGuardRecord: asPublishReadinessRecord(
        latestPublishReadinessGuardRecord,
      ),
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestMediaStorageTruthRecord =
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestUploadTargetPolicyRecord =
    buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow,
      latestMediaStorageTruthRecord,
      latestApprovalSemanticsRecord,
      latestPublishReadinessGuardRecord,
      latestSocialDistributionHandoffRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
    previewFlow,
    latestUploadTargetPolicyRecord,
    latestMediaStorageTruthRecord,
    latestApprovalSemanticsRecord,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
  });
}

export function buildVoxyRenderSchedulingPolicyFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestPreviewReviewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
}) {
  const previewFlow =
    input.latestPreviewReviewFlow ??
    buildVoxyRenderPreviewReviewFlowFromReviewContext({
      reviewContext: input.reviewContext,
      surface: input.surface ?? "admin",
      latestMatrix: input.latestMatrix ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestBacklog =
    input.latestBacklog ??
    buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
      reviewContext: input.reviewContext,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestMatrix =
    input.latestMatrix ??
    buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
      reviewContext: input.reviewContext,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestRequestDraft =
    input.latestRequestDraft ??
    buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext);
  const gate = buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext);
  const latestApprovalSemanticsRecord =
    input.latestApprovalSemanticsRecord ??
    buildVoxyRenderApprovalSemanticsFromReviewContext({
      reviewContext: input.reviewContext,
      surface: input.surface ?? "admin",
      latestPreviewReviewFlow: previewFlow,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
    });
  const latestPublishReadinessGuardRecord =
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    input.latestSocialDistributionHandoffRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPublishReadinessGuardRecord: asPublishReadinessRecord(
        latestPublishReadinessGuardRecord,
      ),
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestMediaStorageTruthRecord =
    input.latestMediaStorageTruthRecord ??
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestUploadTargetPolicyRecord =
    input.latestUploadTargetPolicyRecord ??
    buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow,
      latestMediaStorageTruthRecord,
      latestApprovalSemanticsRecord,
      latestPublishReadinessGuardRecord,
      latestSocialDistributionHandoffRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
    previewFlow,
    latestUploadTargetPolicyRecord,
    latestMediaStorageTruthRecord,
    latestApprovalSemanticsRecord,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
  });
}

export function buildVoxyRenderSchedulingPolicyFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account";
    contributionRef?: SchedulingPolicyRef | null;
    nextStep?: string | null;
  },
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromVoxyDialog(dialog, options);
  const approvalOptions = {
    ...options,
    surface: options?.surface === "create" ? "account" : options?.surface,
  } as const;
  const latestBacklog = buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options);
  const latestMatrix = buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options);
  const latestRequestDraft = buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options);
  const gate = buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options);
  const latestApprovalSemanticsRecord = buildVoxyRenderApprovalSemanticsFromVoxyDialog(
    dialog,
    approvalOptions,
  );
  const latestPublishReadinessGuardRecord =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPublishReadinessGuardRecord: asPublishReadinessRecord(
        latestPublishReadinessGuardRecord,
      ),
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestMediaStorageTruthRecord =
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestUploadTargetPolicyRecord =
    buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow,
      latestMediaStorageTruthRecord,
      latestApprovalSemanticsRecord,
      latestPublishReadinessGuardRecord,
      latestSocialDistributionHandoffRecord,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
    previewFlow,
    latestUploadTargetPolicyRecord,
    latestMediaStorageTruthRecord,
    latestApprovalSemanticsRecord,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
  });
}

function defaultStoreState(): VoxyRenderSchedulingPolicyPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Scheduling-Policy-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Readmodel-Vorschau. Es entsteht weder Schedule noch Job noch Kalendertermin.",
    repositoryInterface: "VoxyRenderSchedulingPolicyRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

function semanticsLines(value: VoxyRenderSchedulingSemantics) {
  return [
    value.scheduleCandidate
      ? "Schedule-Kandidat bleibt sichtbar"
      : "Noch kein Schedule-Kandidat sichtbar",
    "scheduled bleibt false",
    "scheduler_job_created bleibt false",
    "calendar_event_created bleibt false",
    "posted_at_available bleibt false",
    "distribution_time_final bleibt false",
    "published bleibt false",
    "social_posted bleibt false",
  ];
}

function executionLines(value: VoxyRenderSchedulingExecutionFlags) {
  return [
    "Kein Scheduling ist erlaubt",
    "Kein Scheduler-Job wird erzeugt",
    "Kein Kalendertermin und kein Reminder werden erzeugt",
    "Kein Publish, kein Upload und kein Social Posting sind erlaubt",
    value.providerExecutionAllowed
      ? "Provider wäre erlaubt"
      : "Kein Providerlauf, keine Queue und kein Worker sind erlaubt",
  ];
}

function auditLines(
  command: VoxyRenderSchedulingPolicyCommand | VoxyRenderSchedulingPolicyRecord,
) {
  return [
    command.uploadTargetPolicyId
      ? `Upload-Target-Policy: ${command.uploadTargetPolicyId}`
      : "Noch keine Upload-Target-Policy referenziert.",
    command.uploadTargetPolicyStatusHint
      ? `Upload-Target-Status: ${voxyRenderUploadTargetPolicyStatusLabel(
          command.uploadTargetPolicyStatusHint,
        )}`
      : "Noch kein Upload-Target-Status-Hinweis sichtbar.",
    command.mediaStorageTruthStatusHint
      ? `Media-/Storage-Status: ${voxyRenderMediaStorageTruthStatusLabel(
          command.mediaStorageTruthStatusHint,
        )}`
      : "Noch kein Media-/Storage-Hinweis sichtbar.",
    command.approvalStatusHint
      ? `Approval-Status: ${voxyRenderApprovalSemanticsStatusLabel(command.approvalStatusHint)}`
      : "Noch kein Approval-Hinweis sichtbar.",
    command.publishReadinessGuardStatusHint
      ? `Publish Readiness: ${voxyRenderPublishReadinessGuardStatusLabel(
          command.publishReadinessGuardStatusHint,
        )}`
      : "Noch kein Publish-Readiness-Hinweis sichtbar.",
    command.socialDistributionHandoffStatusHint
      ? `Distribution: ${voxyRenderSocialDistributionHandoffStatusLabel(
          command.socialDistributionHandoffStatusHint,
        )}`
      : "Noch kein Distribution-Hinweis sichtbar.",
    command.previewReviewFlowStatusHint
      ? `Preview Review: ${previewReviewFlowStatusLabel(command.previewReviewFlowStatusHint)}`
      : "Noch kein Preview-Review-Hinweis sichtbar.",
  ];
}

export function buildVoxyRenderSchedulingPolicyPanelModel(input: {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderSchedulingPolicyRecord | null;
  storeState?: VoxyRenderSchedulingPolicyPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
      latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
      latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
      latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
      latestSocialDistributionHandoffRecord:
        input.latestSocialDistributionHandoffRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  if (!preview) return null;

  const active = input.latestRecord ?? preview;
  const storeState = input.storeState ?? defaultStoreState();

  return {
    title: "Scheduling Policy",
    summary:
      "Dieser Layer beschreibt nur, welche späteren Veröffentlichungsfenster, Review-Fristen, Plattform-Zeitfenster, Kalender-Hinweise und Distribution-Time-Kandidaten für Voxy fehlen würden. Er plant heute nichts, erzeugt keinen Job, keinen Kalendertermin und keine Veröffentlichung.",
    preview,
    schedulingPolicyStatusLabel: voxyRenderSchedulingPolicyStatusLabel(
      active.schedulingPolicyStatus,
    ),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          schedulingPolicyId: input.latestRecord.schedulingPolicyId,
          schedulingPolicyStatusLabel: voxyRenderSchedulingPolicyStatusLabel(
            input.latestRecord.schedulingPolicyStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          schedulingPolicyVersion: input.latestRecord.schedulingPolicyVersion,
          uploadTargetPolicyId: input.latestRecord.uploadTargetPolicyId ?? null,
        }
      : null,
    commandPreview: {
      schedulingPolicyStatusLabel: voxyRenderSchedulingPolicyStatusLabel(
        preview.schedulingPolicyStatus,
      ),
      nextStepLabel: voxyRenderSchedulingPolicyNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      uploadTargetPolicyId: preview.uploadTargetPolicyId,
    },
    scheduleCandidateLine: `${scheduleCandidateStatusLabel(active.scheduleCandidate.status)} · ${active.scheduleCandidate.platform ?? "ohne Plattform"} · ${active.scheduleCandidate.userVisibleReason}`,
    publishWindowLine: `${publishWindowStatusLabel(active.publishWindow.status)} · ${active.publishWindow.userVisibleReason}`,
    timezonePolicyLine: active.publishWindow.timezonePolicyNeeded
      ? "Timezone-Policy fehlt weiterhin."
      : "Keine zusätzliche Timezone-Policy offen.",
    platformTimingPolicyLine: active.publishWindow.platformTimingPolicyNeeded
      ? "Plattform-Timing-Policy fehlt weiterhin."
      : "Keine zusätzliche Plattform-Timing-Policy offen.",
    calendarHintLine: `${calendarHintStatusLabel(active.calendarHint.status)} · ${active.calendarHint.userVisibleReason}`,
    semanticsLines: semanticsLines(active.schedulingSemantics),
    executionLines: executionLines(active.executionFlags),
    auditLines: auditLines(active),
    topBlockers: active.topBlockers,
    nextStep: voxyRenderSchedulingPolicyNextStepLabel(active.nextStep),
  } satisfies VoxyRenderSchedulingPolicyPanelModel;
}
