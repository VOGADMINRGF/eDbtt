import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderApprovalSemanticsCommand,
  VoxyRenderApprovalSemanticsRecord,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  voxyRenderApprovalSemanticsStatusLabel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import type {
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  voxyRenderMediaStorageTruthStatusLabel,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import type {
  VoxyRenderPreviewOutcomeHandoffCommand,
  VoxyRenderPreviewOutcomeHandoffRecord,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  voxyRenderPreviewOutcomeHandoffStatusLabel,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import type { VoxyRenderPreviewReviewFlowRecord } from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type { VoxyRenderRequestDraftRecord } from "@/features/create/voxyRenderRequestDraftContract";
import type { VoxyRenderReviewDecisionGateModel } from "@/features/create/voxyRenderReviewDecisionGateContract";
import type { VoxyRenderRuntimeEnablementBacklogRecord } from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview,
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog,
  voxyRenderRuntimeEnablementBacklogStatusLabel,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type { VoxyRenderRuntimeGoNogoMatrixRecord } from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview,
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
  voxyRenderRuntimeGoNogoMatrixStatusLabel,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import type {
  VoxyRenderSchedulingPolicyCommand,
  VoxyRenderSchedulingPolicyPersistenceState,
  VoxyRenderSchedulingPolicyRecord,
  VoxyRenderSchedulingPolicyStatus,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import {
  buildVoxyRenderSchedulingPolicyFromCreateCandidatePreview,
  buildVoxyRenderSchedulingPolicyFromReviewContext,
  buildVoxyRenderSchedulingPolicyFromVoxyDialog,
  voxyRenderSchedulingPolicyStatusLabel,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import type {
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  voxyRenderSocialDistributionHandoffStatusLabel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import type {
  VoxyRenderUploadTargetPolicyCommand,
  VoxyRenderUploadTargetPolicyRecord,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";
import {
  voxyRenderUploadTargetPolicyStatusLabel,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_STATUSES = [
  "runtime_observability_plan_only",
  "noop_observability",
  "no_runtime_trace",
  "audit_event_candidates_only",
  "metric_candidates_only",
  "alert_candidates_only",
  "monitoring_provider_needed",
  "trace_policy_needed",
  "metric_policy_needed",
  "alert_policy_needed",
  "blocked_by_missing_scheduling_policy",
  "blocked_by_missing_upload_target_policy",
  "blocked_by_missing_media_file",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderRuntimeObservabilityStatus =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_CANDIDATE_STATUSES = [
  "candidate_only",
  "policy_needed",
  "emitter_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeObservabilityEventCandidateStatus =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_DESCRIPTORS = [
  "render_requested",
  "provider_selected",
  "render_started",
  "render_failed",
  "render_completed",
  "preview_available",
  "approval_changed",
  "upload_requested",
  "upload_failed",
  "upload_completed",
  "schedule_requested",
  "schedule_failed",
  "schedule_completed",
  "publish_requested",
  "publish_failed",
  "publish_completed",
  "cost_debit_requested",
  "cost_debit_failed",
  "cost_debit_completed",
  "unknown",
] as const;

export type VoxyRenderRuntimeObservabilityEventDescriptor =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_EVENT_DESCRIPTORS)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_CANDIDATE_STATUSES = [
  "candidate_only",
  "policy_needed",
  "stream_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeObservabilityMetricCandidateStatus =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_KINDS = [
  "counter",
  "gauge",
  "histogram",
  "duration",
  "error_rate",
  "cost_estimate",
  "unknown",
] as const;

export type VoxyRenderRuntimeObservabilityMetricKind =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_METRIC_KINDS)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_CANDIDATE_STATUSES = [
  "candidate_only",
  "policy_needed",
  "provider_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeObservabilityAlertCandidateStatus =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_SEVERITIES = [
  "info",
  "warning",
  "critical",
  "unknown",
] as const;

export type VoxyRenderRuntimeObservabilityAlertSeverity =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_ALERT_SEVERITIES)[number];

export const VOXY_RENDER_RUNTIME_TRACE_CANDIDATE_STATUSES = [
  "candidate_only",
  "trace_policy_needed",
  "runtime_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeTraceCandidateStatus =
  (typeof VOXY_RENDER_RUNTIME_TRACE_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_NEXT_STEPS = [
  "define_audit_event_schema",
  "define_trace_policy",
  "define_metric_policy",
  "define_alert_policy",
  "configure_monitoring_provider",
  "configure_runtime_event_emitter",
  "require_real_media_file",
  "require_runtime_worker",
  "keep_observability_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderRuntimeObservabilityNextStep =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_NEXT_STEPS)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_STORE_RESULT_STATUSES = [
  "persisted",
  "noop",
  "blocked",
] as const;

export type VoxyRenderRuntimeObservabilityStoreResultStatus =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_OBSERVABILITY_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderRuntimeObservabilityPersistenceMode =
  (typeof VOXY_RENDER_RUNTIME_OBSERVABILITY_PERSISTENCE_MODES)[number];

type RuntimeObservabilityRef = {
  id: string;
  title: string;
  href?: string | null;
};

type SchedulingPolicyPreview =
  | VoxyRenderSchedulingPolicyCommand
  | VoxyRenderSchedulingPolicyRecord;

type UploadTargetPolicyPreview =
  | VoxyRenderUploadTargetPolicyCommand
  | VoxyRenderUploadTargetPolicyRecord;

type MediaStorageTruthPreview =
  | VoxyRenderMediaStorageTruthCommand
  | VoxyRenderMediaStorageTruthRecord;

type ApprovalPreview =
  | VoxyRenderApprovalSemanticsCommand
  | VoxyRenderApprovalSemanticsRecord;

type SocialDistributionPreview =
  | VoxyRenderSocialDistributionHandoffCommand
  | VoxyRenderSocialDistributionHandoffRecord;

type PublishReadinessPreview =
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord;

type PreviewOutcomePreview =
  | VoxyRenderPreviewOutcomeHandoffCommand
  | VoxyRenderPreviewOutcomeHandoffRecord;

export type VoxyRenderRuntimeObservabilityEventCandidate = {
  eventCandidateId: string | null;
  eventKey: string;
  status: VoxyRenderRuntimeObservabilityEventCandidateStatus;
  wouldDescribe: VoxyRenderRuntimeObservabilityEventDescriptor;
  emitted: false;
  emitterAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderRuntimeObservabilityMetricCandidate = {
  metricCandidateId: string | null;
  metricKey: string;
  status: VoxyRenderRuntimeObservabilityMetricCandidateStatus;
  metricKind: VoxyRenderRuntimeObservabilityMetricKind;
  metricStreamCreated: false;
  metricEmitted: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderRuntimeObservabilityAlertCandidate = {
  alertCandidateId: string | null;
  alertKey: string;
  status: VoxyRenderRuntimeObservabilityAlertCandidateStatus;
  severity: VoxyRenderRuntimeObservabilityAlertSeverity;
  alertCreated: false;
  alertEmitted: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderRuntimeTraceCandidate = {
  traceCandidateId: string | null;
  status: VoxyRenderRuntimeTraceCandidateStatus;
  traceId: null;
  executionStarted: false;
  executionCompleted: false;
  executionFailed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderRuntimeObservabilitySemantics = {
  observabilityPlan: true;
  runtimeTraceAvailable: false;
  auditEventsEmitted: false;
  metricsEmitted: false;
  alertsEmitted: false;
  monitoringRuntimeEnabled: false;
  runtimeEnabled: false;
  renderExecuted: false;
  uploadExecuted: false;
  schedulingExecuted: false;
  publishExecuted: false;
  socialPostExecuted: false;
};

export type VoxyRenderRuntimeObservabilityExecutionFlags = {
  auditEventEmissionAllowed: false;
  metricEmissionAllowed: false;
  alertEmissionAllowed: false;
  monitoringProviderCallAllowed: false;
  traceCreationAllowed: false;
  runtimeExecutionAllowed: false;
  schedulingAllowed: false;
  schedulerJobAllowed: false;
  calendarWriteAllowed: false;
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

export type VoxyRenderRuntimeObservabilityCommand = {
  runtimeObservabilityId: string | null;
  schedulingPolicyId: string | null;
  uploadTargetPolicyId: string | null;
  mediaStorageTruthId: string | null;
  approvalSemanticsId: string | null;
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  previewReviewFlowId: string | null;
  enablementBacklogId: string | null;
  matrixId: string | null;
  requestDraftId: string | null;
  scriptRef: RuntimeObservabilityRef | null;
  contributionRef: RuntimeObservabilityRef | null;
  dossierRef: RuntimeObservabilityRef | null;
  reviewerRef: RuntimeObservabilityRef | null;
  createdAt: string | null;
  updatedAt: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  runtimeObservabilityStatus: VoxyRenderRuntimeObservabilityStatus;
  auditEventCandidates: VoxyRenderRuntimeObservabilityEventCandidate[];
  metricCandidates: VoxyRenderRuntimeObservabilityMetricCandidate[];
  alertCandidates: VoxyRenderRuntimeObservabilityAlertCandidate[];
  runtimeTraceCandidate: VoxyRenderRuntimeTraceCandidate;
  semantics: VoxyRenderRuntimeObservabilitySemantics;
  executionFlags: VoxyRenderRuntimeObservabilityExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderRuntimeObservabilityNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  schedulingPolicyStatusHint: VoxyRenderSchedulingPolicyStatus | null;
  uploadTargetPolicyStatusHint: UploadTargetPolicyPreview["uploadTargetPolicyStatus"] | null;
  mediaStorageTruthStatusHint: MediaStorageTruthPreview["mediaStorageTruthStatus"] | null;
  approvalStatusHint: ApprovalPreview["approvalStatus"] | null;
  socialDistributionHandoffStatusHint: SocialDistributionPreview["handoffStatus"] | null;
  publishReadinessGuardStatusHint: PublishReadinessPreview["guardStatus"] | null;
  previewOutcomeHandoffStatusHint: PreviewOutcomePreview["handoffStatus"] | null;
  backlogStatusHint: VoxyRenderRuntimeEnablementBacklogRecord["backlogStatus"] | null;
  matrixStatusHint: VoxyRenderRuntimeGoNogoMatrixRecord["matrixStatus"] | null;
};

export type VoxyRenderRuntimeObservabilityRecord = VoxyRenderRuntimeObservabilityCommand & {
  runtimeObservabilityId: string;
  persistedAt: string;
  persistedBy: string | null;
  idempotencyKey: string;
  previousRuntimeObservabilityRef: string | null;
  supersedesRuntimeObservabilityRef: string | null;
  runtimeObservabilityVersion: number;
};

export type VoxyRenderRuntimeObservabilityPersistenceState = {
  mode: VoxyRenderRuntimeObservabilityPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderRuntimeObservabilityRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyRenderRuntimeObservabilityStoreResult = {
  ok: boolean;
  status: VoxyRenderRuntimeObservabilityStoreResultStatus;
  record: VoxyRenderRuntimeObservabilityRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderRuntimeObservabilityNextStep;
};

export type VoxyRenderRuntimeObservabilityPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderRuntimeObservabilityCommand | VoxyRenderRuntimeObservabilityRecord;
  runtimeObservabilityStatusLabel: string;
  nextStepLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    runtimeObservabilityId: string;
    runtimeObservabilityStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    runtimeObservabilityVersion: number | null;
    schedulingPolicyId: string | null;
  } | null;
  commandPreview: {
    createdAt: string | null;
    schedulingPolicyId: string | null;
    runtimeObservabilityStatusLabel: string;
    nextStepLabel: string;
  };
  auditEventLines: string[];
  metricLines: string[];
  alertLines: string[];
  runtimeTraceLine: string;
  semanticsLines: string[];
  executionLines: string[];
  blockerLines: string[];
  nextActionLines: string[];
  auditLines: string[];
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pickFirstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return null;
}

function pickFirstRef<T extends RuntimeObservabilityRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeText(value.id);
    const title = normalizeText(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: value.href ? normalizeText(value.href) || null : null,
    } satisfies RuntimeObservabilityRef;
  }
  return null;
}

function previewStatusLabel(value: VoxyRenderRuntimeObservabilityStatus) {
  if (value === "runtime_observability_plan_only") return "Nur Observability-Plan";
  if (value === "noop_observability") return "Noop Observability";
  if (value === "no_runtime_trace") return "Keine Runtime Trace";
  if (value === "audit_event_candidates_only") return "Nur Audit-Event-Kandidaten";
  if (value === "metric_candidates_only") return "Nur Metric-Kandidaten";
  if (value === "alert_candidates_only") return "Nur Alert-Kandidaten";
  if (value === "monitoring_provider_needed") return "Monitoring Provider fehlt";
  if (value === "trace_policy_needed") return "Trace-Policy fehlt";
  if (value === "metric_policy_needed") return "Metric-Policy fehlt";
  if (value === "alert_policy_needed") return "Alert-Policy fehlt";
  if (value === "blocked_by_missing_scheduling_policy") return "Scheduling-Policy fehlt";
  if (value === "blocked_by_missing_upload_target_policy") return "Upload-Target-Policy fehlt";
  if (value === "blocked_by_missing_media_file") return "Medien-Datei fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Script-only";
}

function nextStepLabel(value: VoxyRenderRuntimeObservabilityNextStep) {
  if (value === "define_audit_event_schema") return "Audit-Event-Schema definieren";
  if (value === "define_trace_policy") return "Trace-Policy definieren";
  if (value === "define_metric_policy") return "Metric-Policy definieren";
  if (value === "define_alert_policy") return "Alert-Policy definieren";
  if (value === "configure_monitoring_provider") return "Monitoring Provider konfigurieren";
  if (value === "configure_runtime_event_emitter") return "Runtime-Event-Emitter definieren";
  if (value === "require_real_media_file") return "Echte Medien-Datei verlangen";
  if (value === "require_runtime_worker") return "Runtime-Worker verlangen";
  if (value === "keep_observability_blocked") return "Observability blockiert halten";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blockiert";
}

function eventCandidateStatusLabel(value: VoxyRenderRuntimeObservabilityEventCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "emitter_needed") return "Emitter fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function metricCandidateStatusLabel(value: VoxyRenderRuntimeObservabilityMetricCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "stream_needed") return "Stream fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function alertCandidateStatusLabel(value: VoxyRenderRuntimeObservabilityAlertCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "provider_needed") return "Provider fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function traceCandidateStatusLabel(value: VoxyRenderRuntimeTraceCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "trace_policy_needed") return "Trace-Policy fehlt";
  if (value === "runtime_needed") return "Runtime fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function eventDescriptorLabel(value: VoxyRenderRuntimeObservabilityEventDescriptor) {
  if (value === "render_requested") return "Render angefragt";
  if (value === "preview_available") return "Preview verfügbar";
  if (value === "upload_requested") return "Upload angefragt";
  if (value === "schedule_requested") return "Scheduling angefragt";
  if (value === "publish_requested") return "Publish angefragt";
  if (value === "approval_changed") return "Approval geändert";
  return "Unbekannter Runtime-Schritt";
}

function metricKindLabel(value: VoxyRenderRuntimeObservabilityMetricKind) {
  if (value === "counter") return "Counter";
  if (value === "gauge") return "Gauge";
  if (value === "histogram") return "Histogramm";
  if (value === "duration") return "Dauer";
  if (value === "error_rate") return "Fehlerrate";
  if (value === "cost_estimate") return "Kostenschätzung";
  return "Unbekannt";
}

function alertSeverityLabel(value: VoxyRenderRuntimeObservabilityAlertSeverity) {
  if (value === "info") return "Info";
  if (value === "warning") return "Warnung";
  if (value === "critical") return "Kritisch";
  return "Unbekannt";
}

function mediaFileAvailable(value: MediaStorageTruthPreview | null | undefined) {
  return value?.mediaSemantics?.mediaFileAvailable ?? false;
}

function buildRuntimeObservabilityId(input: {
  schedulingPolicyId: string | null;
  previewReviewFlowId: string | null;
  requestDraftId: string | null;
}) {
  return [
    "voxy-render-runtime-observability",
    input.schedulingPolicyId ?? "missing-scheduling-policy",
    input.previewReviewFlowId ?? "missing-preview-review-flow",
    input.requestDraftId ?? "missing-request-draft",
  ]
    .join(":")
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .slice(0, 200);
}

function buildStatus(input: {
  schedulingPolicy: SchedulingPolicyPreview | null;
  uploadTargetPolicy: UploadTargetPolicyPreview | null;
  mediaStorageTruth: MediaStorageTruthPreview | null;
  latestBacklog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  const schedulingStatus = input.schedulingPolicy?.schedulingPolicyStatus ?? null;
  if (schedulingStatus === "keep_as_script_only") {
    return "keep_as_script_only" satisfies VoxyRenderRuntimeObservabilityStatus;
  }
  if (!input.schedulingPolicy?.schedulingPolicyId) {
    return "blocked_by_missing_scheduling_policy" satisfies VoxyRenderRuntimeObservabilityStatus;
  }
  if (!input.schedulingPolicy.uploadTargetPolicyId && !input.uploadTargetPolicy?.uploadTargetPolicyId) {
    return "blocked_by_missing_upload_target_policy" satisfies VoxyRenderRuntimeObservabilityStatus;
  }
  if (
    schedulingStatus === "blocked_by_missing_media_file" ||
    (input.mediaStorageTruth && !mediaFileAvailable(input.mediaStorageTruth))
  ) {
    return "blocked_by_missing_media_file" satisfies VoxyRenderRuntimeObservabilityStatus;
  }
  if (
    schedulingStatus === "blocked_by_runtime_truth" ||
    input.latestBacklog?.backlogStatus === "blocked_by_runtime_truth" ||
    input.latestMatrix?.matrixStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth" satisfies VoxyRenderRuntimeObservabilityStatus;
  }
  return "monitoring_provider_needed" satisfies VoxyRenderRuntimeObservabilityStatus;
}

function buildNextStep(
  status: VoxyRenderRuntimeObservabilityStatus,
): VoxyRenderRuntimeObservabilityNextStep {
  if (status === "blocked_by_missing_media_file") return "require_real_media_file";
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (
    status === "blocked_by_missing_scheduling_policy" ||
    status === "blocked_by_missing_upload_target_policy"
  ) {
    return "blocked";
  }
  if (status === "blocked_by_runtime_truth") return "keep_observability_blocked";
  if (status === "trace_policy_needed") return "define_trace_policy";
  if (status === "metric_policy_needed") return "define_metric_policy";
  if (status === "alert_policy_needed") return "define_alert_policy";
  return "configure_monitoring_provider";
}

function blockedReasonForStatus(status: VoxyRenderRuntimeObservabilityStatus) {
  if (status === "blocked_by_missing_scheduling_policy") {
    return "Ohne Scheduling-Policy bleibt Runtime Observability vollständig blockiert.";
  }
  if (status === "blocked_by_missing_upload_target_policy") {
    return "Ohne Upload-Target-Policy fehlt der nächste ehrliche Runtime-Anknüpfungspunkt.";
  }
  if (status === "blocked_by_missing_media_file") {
    return "Ohne echte Medien-Datei bleibt jede Observability-Aussage hypothetisch.";
  }
  if (status === "blocked_by_runtime_truth") {
    return "Ohne Runtime-Wahrheit werden keine Traces, Metrics oder Alerts behauptet.";
  }
  if (status === "keep_as_script_only") {
    return "Der Pfad bleibt bewusst Script-only und erzeugt keinerlei Runtime.";
  }
  return "Es gibt bewusst keinen Monitoring Provider, keinen Emitter und keine Runtime.";
}

function buildAuditEventCandidates(input: {
  status: VoxyRenderRuntimeObservabilityStatus;
  schedulingPolicy: SchedulingPolicyPreview | null;
}) {
  const baseReason = blockedReasonForStatus(input.status);
  const candidateStatus =
    input.status === "monitoring_provider_needed"
      ? "policy_needed"
      : input.status === "keep_as_script_only"
        ? "not_applicable"
        : input.status === "blocked_by_missing_scheduling_policy" ||
            input.status === "blocked_by_missing_upload_target_policy" ||
            input.status === "blocked_by_missing_media_file" ||
            input.status === "blocked_by_runtime_truth"
          ? "blocked"
          : "candidate_only";
  const platform = input.schedulingPolicy?.scheduleCandidate?.platform ?? "ohne Plattform";
  return [
    {
      eventCandidateId: null,
      eventKey: "voxy.render.requested",
      status: candidateStatus,
      wouldDescribe: "render_requested",
      emitted: false,
      emitterAllowed: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: `Render-Anfrage bliebe nur als Audit-Kandidat sichtbar (${platform}).`,
    },
    {
      eventCandidateId: null,
      eventKey: "voxy.preview.available",
      status: candidateStatus,
      wouldDescribe: "preview_available",
      emitted: false,
      emitterAllowed: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Preview-Verfügbarkeit bleibt ein Kandidat und kein emittiertes Event.",
    },
    {
      eventCandidateId: null,
      eventKey: "voxy.publish.requested",
      status: candidateStatus,
      wouldDescribe: "publish_requested",
      emitted: false,
      emitterAllowed: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Publish-Anfrage bleibt review-first und ohne Event-Emitter.",
    },
  ] satisfies VoxyRenderRuntimeObservabilityEventCandidate[];
}

function buildMetricCandidates(status: VoxyRenderRuntimeObservabilityStatus) {
  const baseReason = blockedReasonForStatus(status);
  const candidateStatus =
    status === "keep_as_script_only"
      ? "not_applicable"
      : status === "blocked_by_missing_scheduling_policy" ||
          status === "blocked_by_missing_upload_target_policy" ||
          status === "blocked_by_missing_media_file" ||
          status === "blocked_by_runtime_truth"
        ? "blocked"
        : "policy_needed";
  return [
    {
      metricCandidateId: null,
      metricKey: "voxy.render.request.count",
      status: candidateStatus,
      metricKind: "counter",
      metricStreamCreated: false,
      metricEmitted: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Es gibt keine Counter-Emission für Render-Anfragen.",
    },
    {
      metricCandidateId: null,
      metricKey: "voxy.render.runtime.blocked",
      status: candidateStatus,
      metricKind: "error_rate",
      metricStreamCreated: false,
      metricEmitted: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Runtime-Blocker bleiben rein lesbar und ohne Metric-Stream.",
    },
    {
      metricCandidateId: null,
      metricKey: "voxy.render.estimated.cost",
      status: candidateStatus,
      metricKind: "cost_estimate",
      metricStreamCreated: false,
      metricEmitted: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Kostensignale bleiben Planung und keine emittierte Metric.",
    },
  ] satisfies VoxyRenderRuntimeObservabilityMetricCandidate[];
}

function buildAlertCandidates(status: VoxyRenderRuntimeObservabilityStatus) {
  const baseReason = blockedReasonForStatus(status);
  const candidateStatus =
    status === "keep_as_script_only"
      ? "not_applicable"
      : status === "blocked_by_missing_scheduling_policy" ||
          status === "blocked_by_missing_upload_target_policy" ||
          status === "blocked_by_missing_media_file" ||
          status === "blocked_by_runtime_truth"
        ? "blocked"
        : "provider_needed";
  return [
    {
      alertCandidateId: null,
      alertKey: "voxy.runtime.provider.missing",
      status: candidateStatus,
      severity: "warning",
      alertCreated: false,
      alertEmitted: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Provider-Alert bleibt Kandidat und wird nicht erzeugt.",
    },
    {
      alertCandidateId: null,
      alertKey: "voxy.runtime.render.failed",
      status: candidateStatus,
      severity: "critical",
      alertCreated: false,
      alertEmitted: false,
      reviewerVisibleReason: baseReason,
      userVisibleReason: "Ein möglicher Render-Fehler bleibt ohne Alert-Runtime unsichtbar.",
    },
  ] satisfies VoxyRenderRuntimeObservabilityAlertCandidate[];
}

function buildRuntimeTraceCandidate(status: VoxyRenderRuntimeObservabilityStatus) {
  if (status === "keep_as_script_only") {
    return {
      traceCandidateId: null,
      status: "not_applicable",
      traceId: null,
      executionStarted: false,
      executionCompleted: false,
      executionFailed: false,
      reviewerVisibleReason: "Script-only-Pfade erzeugen bewusst keine Runtime Trace.",
      userVisibleReason: "Im Script-only-Pfad gibt es keine Trace.",
    } satisfies VoxyRenderRuntimeTraceCandidate;
  }
  if (
    status === "blocked_by_missing_scheduling_policy" ||
    status === "blocked_by_missing_upload_target_policy" ||
    status === "blocked_by_missing_media_file" ||
    status === "blocked_by_runtime_truth"
  ) {
    return {
      traceCandidateId: null,
      status: "blocked",
      traceId: null,
      executionStarted: false,
      executionCompleted: false,
      executionFailed: false,
      reviewerVisibleReason: blockedReasonForStatus(status),
      userVisibleReason: "Ohne echte Runtime bleibt die Trace blockiert.",
    } satisfies VoxyRenderRuntimeTraceCandidate;
  }
  return {
    traceCandidateId: null,
    status: "trace_policy_needed",
    traceId: null,
    executionStarted: false,
    executionCompleted: false,
    executionFailed: false,
    reviewerVisibleReason: "Es gibt noch keine Trace-Policy und keine Runtime Trace.",
    userVisibleReason: "Noch keine Runtime Trace.",
  } satisfies VoxyRenderRuntimeTraceCandidate;
}

function buildSemantics(): VoxyRenderRuntimeObservabilitySemantics {
  return {
    observabilityPlan: true,
    runtimeTraceAvailable: false,
    auditEventsEmitted: false,
    metricsEmitted: false,
    alertsEmitted: false,
    monitoringRuntimeEnabled: false,
    runtimeEnabled: false,
    renderExecuted: false,
    uploadExecuted: false,
    schedulingExecuted: false,
    publishExecuted: false,
    socialPostExecuted: false,
  };
}

function buildExecutionFlags(): VoxyRenderRuntimeObservabilityExecutionFlags {
  return {
    auditEventEmissionAllowed: false,
    metricEmissionAllowed: false,
    alertEmissionAllowed: false,
    monitoringProviderCallAllowed: false,
    traceCreationAllowed: false,
    runtimeExecutionAllowed: false,
    schedulingAllowed: false,
    schedulerJobAllowed: false,
    calendarWriteAllowed: false,
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

function buildSummary(status: VoxyRenderRuntimeObservabilityStatus) {
  if (status === "blocked_by_missing_scheduling_policy") {
    return {
      userVisible:
        "Runtime Observability bleibt blockiert, weil noch keine Scheduling Policy als ehrlicher Andockpunkt existiert.",
      reviewerVisible:
        "Ohne Scheduling-Policy wird keine Observability-Runtime, kein Event-Emitter und kein Monitoring behauptet.",
    };
  }
  if (status === "blocked_by_missing_upload_target_policy") {
    return {
      userVisible:
        "Runtime Observability bleibt ohne Upload-Target-Policy ein rein planerischer Noop-Layer.",
      reviewerVisible:
        "Ohne Upload-Target-Policy bleibt Observability audit-only und trennt Monitoring klar von Runtime.",
    };
  }
  if (status === "blocked_by_missing_media_file") {
    return {
      userVisible:
        "Ohne echte Medien-Datei gibt es keine belastbare Runtime-Beobachtung, sondern nur Kandidaten.",
      reviewerVisible:
        "Media-Wahrheit fehlt weiterhin; Event-, Metric-, Alert- und Trace-Kandidaten bleiben hypothetisch.",
    };
  }
  if (status === "blocked_by_runtime_truth") {
    return {
      userVisible:
        "Runtime Observability bleibt blockiert, weil die eigentliche Runtime-Wahrheit noch fehlt.",
      reviewerVisible:
        "Ohne Runtime-Wahrheit werden weder Traces noch Metrics noch Alerts oder Events emittiert.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      userVisible:
        "Runtime Observability bleibt Script-only, audit-only und ohne Monitoring-Runtime.",
      reviewerVisible:
        "Script-only-Pfade erzeugen bewusst keine Runtime, keine Trace und keinen Providerkontakt.",
    };
  }
  return {
    userVisible:
      "Runtime Observability beschreibt nur spätere Event-, Metric-, Alert- und Trace-Kandidaten. Es wird heute nichts emittiert, gemessen, alarmiert oder ausgeführt.",
    reviewerVisible:
      "Der Layer bleibt observability_plan_only: kein Monitoring Provider, kein Event-Emitter, keine Runtime Trace und keine Ausführung.",
  };
}

function buildTopBlockers(status: VoxyRenderRuntimeObservabilityStatus) {
  const blockers = [blockedReasonForStatus(status)];
  if (
    status !== "blocked_by_missing_scheduling_policy" &&
    status !== "keep_as_script_only"
  ) {
    blockers.push("Kein Monitoring Provider konfiguriert.");
    blockers.push("Trace-Policy fehlt.");
    blockers.push("Metric-Policy fehlt.");
    blockers.push("Alert-Policy fehlt.");
  }
  return blockers;
}

function buildAuditLines(
  command: VoxyRenderRuntimeObservabilityCommand | VoxyRenderRuntimeObservabilityRecord,
) {
  return [
    command.schedulingPolicyId
      ? `Scheduling Policy: ${command.schedulingPolicyId}`
      : "Noch keine Scheduling-Policy referenziert.",
    command.schedulingPolicyStatusHint
      ? `Scheduling-Status: ${voxyRenderSchedulingPolicyStatusLabel(
          command.schedulingPolicyStatusHint,
        )}`
      : "Noch kein Scheduling-Status-Hinweis sichtbar.",
    command.uploadTargetPolicyStatusHint
      ? `Upload-Target-Status: ${voxyRenderUploadTargetPolicyStatusLabel(
          command.uploadTargetPolicyStatusHint,
        )}`
      : "Noch kein Upload-Target-Hinweis sichtbar.",
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
    command.previewOutcomeHandoffStatusHint
      ? `Preview Outcome: ${voxyRenderPreviewOutcomeHandoffStatusLabel(
          command.previewOutcomeHandoffStatusHint,
        )}`
      : "Noch kein Preview-Outcome-Hinweis sichtbar.",
    command.backlogStatusHint
      ? `Enablement Backlog: ${voxyRenderRuntimeEnablementBacklogStatusLabel(
          command.backlogStatusHint,
        )}`
      : "Noch kein Enablement-Backlog-Hinweis sichtbar.",
    command.matrixStatusHint
      ? `Go/No-Go-Matrix: ${voxyRenderRuntimeGoNogoMatrixStatusLabel(command.matrixStatusHint)}`
      : "Noch kein Go/No-Go-Hinweis sichtbar.",
  ];
}

function buildDefaultStoreState(): VoxyRenderRuntimeObservabilityPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Runtime-Observability-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Readmodel-Vorschau. Es entstehen keine Events, keine Metrics, keine Alerts und keine Trace.",
    repositoryInterface: "VoxyRenderRuntimeObservabilityRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

export function buildVoxyRenderRuntimeObservabilityCommandFromReadmodels(input: {
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestPreviewOutcomeHandoffRecord?: PreviewOutcomePreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
}) {
  const schedulingPolicy = input.latestSchedulingPolicyRecord ?? null;
  const uploadTargetPolicy = input.latestUploadTargetPolicyRecord ?? null;
  const mediaStorageTruth = input.latestMediaStorageTruthRecord ?? null;
  const status = buildStatus({
    schedulingPolicy,
    uploadTargetPolicy,
    mediaStorageTruth,
    latestBacklog: input.latestBacklog ?? null,
    latestMatrix: input.latestMatrix ?? null,
  });
  const summary = buildSummary(status);
  const nextStep = buildNextStep(status);
  const runtimeObservabilityId = buildRuntimeObservabilityId({
    schedulingPolicyId: schedulingPolicy?.schedulingPolicyId ?? null,
    previewReviewFlowId:
      schedulingPolicy?.previewReviewFlowId ?? input.previewFlow?.previewReviewFlowId ?? null,
    requestDraftId: schedulingPolicy?.requestDraftId ?? input.latestRequestDraft?.requestDraftId ?? null,
  });

  return {
    runtimeObservabilityId,
    schedulingPolicyId: schedulingPolicy?.schedulingPolicyId ?? null,
    uploadTargetPolicyId:
      schedulingPolicy?.uploadTargetPolicyId ??
      input.latestUploadTargetPolicyRecord?.uploadTargetPolicyId ??
      null,
    mediaStorageTruthId:
      schedulingPolicy?.mediaStorageTruthId ??
      input.latestMediaStorageTruthRecord?.mediaStorageTruthId ??
      null,
    approvalSemanticsId:
      schedulingPolicy?.approvalSemanticsId ??
      input.latestApprovalSemanticsRecord?.approvalSemanticsId ??
      null,
    socialDistributionHandoffId:
      schedulingPolicy?.socialDistributionHandoffId ??
      input.latestSocialDistributionHandoffRecord?.socialDistributionHandoffId ??
      null,
    publishReadinessGuardId:
      schedulingPolicy?.publishReadinessGuardId ??
      input.latestPublishReadinessGuardRecord?.publishReadinessGuardId ??
      null,
    previewOutcomeHandoffId:
      schedulingPolicy?.previewOutcomeHandoffId ??
      input.latestPreviewOutcomeHandoffRecord?.outcomeHandoffId ??
      null,
    previewReviewFlowId:
      schedulingPolicy?.previewReviewFlowId ?? input.previewFlow?.previewReviewFlowId ?? null,
    enablementBacklogId:
      schedulingPolicy?.enablementBacklogId ?? input.latestBacklog?.backlogId ?? null,
    matrixId: schedulingPolicy?.matrixId ?? input.latestMatrix?.matrixId ?? null,
    requestDraftId:
      schedulingPolicy?.requestDraftId ?? input.latestRequestDraft?.requestDraftId ?? null,
    scriptRef: pickFirstRef(
      schedulingPolicy?.scriptRef ?? null,
      input.latestRequestDraft?.scriptRef ?? null,
      input.gate?.contributionRef ?? null,
    ),
    contributionRef: pickFirstRef(
      schedulingPolicy?.contributionRef ?? null,
      input.latestRequestDraft?.contributionRef ?? null,
      input.gate?.contributionRef ?? null,
    ),
    dossierRef: pickFirstRef(
      schedulingPolicy?.dossierRef ?? null,
      input.latestRequestDraft?.dossierRef ?? null,
      input.gate?.dossierRef ?? null,
    ),
    reviewerRef: schedulingPolicy?.reviewerRef ?? null,
    createdAt: pickFirstString(
      schedulingPolicy?.createdAt,
      input.latestRequestDraft?.persistedAt,
    ),
    updatedAt: schedulingPolicy?.updatedAt ?? null,
    sourceLanguage:
      schedulingPolicy?.sourceLanguage ?? input.previewFlow?.sourceLanguage ?? "de",
    readingLanguage:
      schedulingPolicy?.readingLanguage ?? input.previewFlow?.readingLanguage ?? "de",
    scriptLanguage:
      schedulingPolicy?.scriptLanguage ?? input.previewFlow?.scriptLanguage ?? "de",
    renderLanguage:
      schedulingPolicy?.renderLanguage ?? input.previewFlow?.renderLanguage ?? "de",
    subtitleLanguage:
      schedulingPolicy?.subtitleLanguage ?? input.previewFlow?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      schedulingPolicy?.rtlRequired ??
      input.previewFlow?.rtlRequired ??
      input.latestRequestDraft?.rtlRequired ??
      false,
    runtimeObservabilityStatus: status,
    auditEventCandidates: buildAuditEventCandidates({ status, schedulingPolicy }),
    metricCandidates: buildMetricCandidates(status),
    alertCandidates: buildAlertCandidates(status),
    runtimeTraceCandidate: buildRuntimeTraceCandidate(status),
    semantics: buildSemantics(),
    executionFlags: buildExecutionFlags(),
    topBlockers: buildTopBlockers(status),
    nextStep,
    userVisibleSummary: summary.userVisible,
    reviewerVisibleSummary: summary.reviewerVisible,
    schedulingPolicyStatusHint: schedulingPolicy?.schedulingPolicyStatus ?? null,
    uploadTargetPolicyStatusHint:
      schedulingPolicy?.uploadTargetPolicyStatusHint ??
      input.latestUploadTargetPolicyRecord?.uploadTargetPolicyStatus ??
      null,
    mediaStorageTruthStatusHint:
      schedulingPolicy?.mediaStorageTruthStatusHint ??
      input.latestMediaStorageTruthRecord?.mediaStorageTruthStatus ??
      null,
    approvalStatusHint:
      schedulingPolicy?.approvalStatusHint ??
      input.latestApprovalSemanticsRecord?.approvalStatus ??
      null,
    socialDistributionHandoffStatusHint:
      schedulingPolicy?.socialDistributionHandoffStatusHint ??
      input.latestSocialDistributionHandoffRecord?.handoffStatus ??
      null,
    publishReadinessGuardStatusHint:
      schedulingPolicy?.publishReadinessGuardStatusHint ??
      input.latestPublishReadinessGuardRecord?.guardStatus ??
      null,
    previewOutcomeHandoffStatusHint:
      input.latestPreviewOutcomeHandoffRecord?.handoffStatus ?? null,
    backlogStatusHint: input.latestBacklog?.backlogStatus ?? null,
    matrixStatusHint: input.latestMatrix?.matrixStatus ?? null,
  } satisfies VoxyRenderRuntimeObservabilityCommand;
}

export function buildVoxyRenderRuntimeObservabilityFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
    latestSchedulingPolicyRecord: buildVoxyRenderSchedulingPolicyFromCreateCandidatePreview(model),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderRuntimeObservabilityFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestPreviewOutcomeHandoffRecord?: PreviewOutcomePreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
}) {
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
  return buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
    latestSchedulingPolicyRecord:
      input.latestSchedulingPolicyRecord ??
      buildVoxyRenderSchedulingPolicyFromReviewContext({
        reviewContext: input.reviewContext,
        surface: input.surface ?? "admin",
        latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
        latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
        latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
        latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
        latestSocialDistributionHandoffRecord:
          input.latestSocialDistributionHandoffRecord ?? null,
        latestBacklog,
        latestMatrix,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
    latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
    latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
    latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
    latestSocialDistributionHandoffRecord:
      input.latestSocialDistributionHandoffRecord ?? null,
    latestPublishReadinessGuardRecord:
      input.latestPublishReadinessGuardRecord ?? null,
    latestPreviewOutcomeHandoffRecord:
      input.latestPreviewOutcomeHandoffRecord ?? null,
    latestBacklog,
    latestMatrix,
    latestRequestDraft: input.latestRequestDraft ?? null,
  });
}

export function buildVoxyRenderRuntimeObservabilityFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account";
    contributionRef?: RuntimeObservabilityRef | null;
    nextStep?: string | null;
  },
) {
  return buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
    latestSchedulingPolicyRecord: buildVoxyRenderSchedulingPolicyFromVoxyDialog(dialog, options),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options),
  });
}

function eventLines(
  candidates: VoxyRenderRuntimeObservabilityEventCandidate[],
) {
  return candidates.map(
    (candidate) =>
      `${eventDescriptorLabel(candidate.wouldDescribe)} · ${eventCandidateStatusLabel(candidate.status)} · ${candidate.userVisibleReason}`,
  );
}

function metricLines(
  candidates: VoxyRenderRuntimeObservabilityMetricCandidate[],
) {
  return candidates.map(
    (candidate) =>
      `${metricKindLabel(candidate.metricKind)} · ${metricCandidateStatusLabel(candidate.status)} · ${candidate.userVisibleReason}`,
  );
}

function alertLines(
  candidates: VoxyRenderRuntimeObservabilityAlertCandidate[],
) {
  return candidates.map(
    (candidate) =>
      `${alertSeverityLabel(candidate.severity)} · ${alertCandidateStatusLabel(candidate.status)} · ${candidate.userVisibleReason}`,
  );
}

function semanticsLines(value: VoxyRenderRuntimeObservabilitySemantics) {
  return [
    value.observabilityPlan
      ? "Observability Plan bleibt sichtbar"
      : "Kein Observability-Plan sichtbar",
    "runtime_trace_available bleibt false",
    "audit_events_emitted bleibt false",
    "metrics_emitted bleibt false",
    "alerts_emitted bleibt false",
    "runtime_enabled bleibt false",
    "render_executed bleibt false",
    "upload_executed bleibt false",
    "scheduling_executed bleibt false",
    "publish_executed bleibt false",
    "social_post_executed bleibt false",
  ];
}

function executionLines(value: VoxyRenderRuntimeObservabilityExecutionFlags) {
  return [
    value.auditEventEmissionAllowed
      ? "Audit-Emission wäre erlaubt"
      : "Keine Events emittiert",
    value.metricEmissionAllowed ? "Metrics wären erlaubt" : "Keine Metrics gesendet",
    value.alertEmissionAllowed ? "Alerts wären erlaubt" : "Keine Alerts ausgelöst",
    value.monitoringProviderCallAllowed
      ? "Monitoring Provider wäre erlaubt"
      : "Kein Monitoring Provider",
    value.runtimeExecutionAllowed
      ? "Runtime wäre erlaubt"
      : "Keine Ausführung",
  ];
}

export function buildVoxyRenderRuntimeObservabilityPanelModel(input: {
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestPreviewOutcomeHandoffRecord?: PreviewOutcomePreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderRuntimeObservabilityRecord | null;
  storeState?: VoxyRenderRuntimeObservabilityPersistenceState | null;
  schedulingPolicyStoreState?: VoxyRenderSchedulingPolicyPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
      latestSchedulingPolicyRecord: input.latestSchedulingPolicyRecord ?? null,
      latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
      latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
      latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
      latestSocialDistributionHandoffRecord:
        input.latestSocialDistributionHandoffRecord ?? null,
      latestPublishReadinessGuardRecord:
        input.latestPublishReadinessGuardRecord ?? null,
      latestPreviewOutcomeHandoffRecord:
        input.latestPreviewOutcomeHandoffRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      previewFlow: input.previewFlow ?? null,
      gate: input.gate ?? null,
    });
  if (!preview) return null;

  const storeState = input.storeState ?? buildDefaultStoreState();
  const active = input.latestRecord ?? preview;
  const schedulingStateLabel =
    input.schedulingPolicyStoreState?.label ?? "Kein Scheduling-Policy-Store im Surface";

  return {
    title: "Runtime Observability",
    summary:
      "Dieser Layer beschreibt nur spätere Audit-Event-, Metric-, Alert- und Trace-Kandidaten für Voxy. Er aktiviert weder Monitoring Runtime noch Event-Emitter noch Rendering, Upload, Scheduling oder Publishing.",
    preview,
    runtimeObservabilityStatusLabel: previewStatusLabel(active.runtimeObservabilityStatus),
    nextStepLabel: nextStepLabel(active.nextStep),
    storeStateLabel: storeState.label,
    storeStateSummary: `${storeState.summary} Upstream: ${schedulingStateLabel}.`,
    latestRecord: input.latestRecord
      ? {
          runtimeObservabilityId: input.latestRecord.runtimeObservabilityId,
          runtimeObservabilityStatusLabel: previewStatusLabel(
            input.latestRecord.runtimeObservabilityStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          runtimeObservabilityVersion: input.latestRecord.runtimeObservabilityVersion,
          schedulingPolicyId: input.latestRecord.schedulingPolicyId,
        }
      : null,
    commandPreview: {
      createdAt: preview.createdAt,
      schedulingPolicyId: preview.schedulingPolicyId,
      runtimeObservabilityStatusLabel: previewStatusLabel(preview.runtimeObservabilityStatus),
      nextStepLabel: nextStepLabel(preview.nextStep),
    },
    auditEventLines: eventLines(active.auditEventCandidates),
    metricLines: metricLines(active.metricCandidates),
    alertLines: alertLines(active.alertCandidates),
    runtimeTraceLine: `${traceCandidateStatusLabel(active.runtimeTraceCandidate.status)} · ${active.runtimeTraceCandidate.userVisibleReason}`,
    semanticsLines: semanticsLines(active.semantics),
    executionLines: executionLines(active.executionFlags),
    blockerLines: active.topBlockers,
    nextActionLines: [nextStepLabel(active.nextStep)],
    auditLines: buildAuditLines(active),
  } satisfies VoxyRenderRuntimeObservabilityPanelModel;
}
