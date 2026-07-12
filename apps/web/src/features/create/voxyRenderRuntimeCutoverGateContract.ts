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
  VoxyRenderCostCreditPolicyPreviewRecord,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
  buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog,
  voxyRenderCostCreditPolicyStatusLabel,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import type {
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  voxyRenderMediaStorageTruthStatusLabel,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import type { VoxyRenderPreviewReviewFlowRecord } from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
  VoxyRenderProviderSelectionDraftRecord,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import {
  buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview,
  buildVoxyRenderProviderSelectionDraftFromReviewContext,
  buildVoxyRenderProviderSelectionDraftFromVoxyDialog,
  voxyRenderProviderSelectionDraftStatusLabel,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import type {
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type {
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
  voxyRenderQueuePreviewStatusLabel,
} from "@/features/create/voxyRenderQueueContract";
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
  VoxyRenderRuntimeObservabilityCommand,
  VoxyRenderRuntimeObservabilityPersistenceState,
  VoxyRenderRuntimeObservabilityRecord,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";
import {
  buildVoxyRenderRuntimeObservabilityFromCreateCandidatePreview,
  buildVoxyRenderRuntimeObservabilityFromReviewContext,
  buildVoxyRenderRuntimeObservabilityFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";
import type {
  VoxyRenderSchedulingPolicyCommand,
  VoxyRenderSchedulingPolicyRecord,
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

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_STATUSES = [
  "runtime_cutover_gate_only",
  "noop_cutover",
  "cutover_candidate_only",
  "runtime_not_enabled",
  "runtime_prerequisites_missing",
  "feature_flag_policy_needed",
  "provider_runtime_needed",
  "queue_worker_needed",
  "storage_runtime_needed",
  "upload_runtime_needed",
  "scheduling_runtime_needed",
  "observability_runtime_needed",
  "cost_metering_runtime_needed",
  "rollback_policy_needed",
  "runbook_needed",
  "blocked_by_missing_observability",
  "blocked_by_missing_scheduling_policy",
  "blocked_by_missing_upload_target_policy",
  "blocked_by_missing_media_file",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderRuntimeCutoverGateStatus =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_CANDIDATE_STATUSES = [
  "candidate_only",
  "prerequisites_missing",
  "policy_needed",
  "runtime_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeCutoverCandidateStatus =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_KEYS = [
  "featureFlagGate",
  "providerRuntimeGate",
  "queueWorkerGate",
  "mediaStorageGate",
  "uploadRuntimeGate",
  "schedulingRuntimeGate",
  "observabilityGate",
  "costCreditGate",
  "approvalGate",
  "publishGuardGate",
  "socialDistributionGate",
  "securitySecretsGate",
  "legalSafetyGate",
  "rollbackGate",
  "runbookGate",
  "operatorGate",
] as const;

export type VoxyRenderRuntimeCutoverGateKey =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_KEYS)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_ITEM_STATUSES = [
  "ready_candidate",
  "policy_needed",
  "runtime_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeCutoverGateItemStatus =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_ITEM_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_NEXT_STEPS = [
  "define_feature_flag_policy",
  "configure_provider_runtime",
  "configure_queue_worker",
  "configure_storage_runtime",
  "configure_upload_runtime",
  "configure_scheduling_runtime",
  "configure_observability_runtime",
  "configure_cost_metering_runtime",
  "define_rollback_policy",
  "define_operator_runbook",
  "require_real_media_file",
  "keep_cutover_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderRuntimeCutoverGateNextStep =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_NEXT_STEPS)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_STORE_RESULT_STATUSES = [
  "persisted",
  "noop",
  "blocked",
] as const;

export type VoxyRenderRuntimeCutoverGateStoreResultStatus =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_CUTOVER_GATE_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderRuntimeCutoverGatePersistenceMode =
  (typeof VOXY_RENDER_RUNTIME_CUTOVER_GATE_PERSISTENCE_MODES)[number];

type RuntimeCutoverGateRef = {
  id: string;
  title: string;
  href?: string | null;
};

type RuntimeObservabilityPreview =
  | VoxyRenderRuntimeObservabilityCommand
  | VoxyRenderRuntimeObservabilityRecord;
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

export type VoxyRenderRuntimeCutoverCandidate = {
  cutoverCandidateId: string | null;
  status: VoxyRenderRuntimeCutoverCandidateStatus;
  runtimeCutoverCandidate: boolean;
  runtimeEnabled: false;
  featureFlagCandidate: boolean;
  featureFlagEnabled: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderRuntimeCutoverGateItem = {
  gateKey: VoxyRenderRuntimeCutoverGateKey;
  label: string;
  status: VoxyRenderRuntimeCutoverGateItemStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderRuntimeCutoverGateNextStep;
  executionAllowed: false;
};

export type VoxyRenderRuntimeCutoverGateSemantics = {
  runtimeCutoverCandidate: boolean;
  runtimeEnabled: false;
  featureFlagCandidate: boolean;
  featureFlagEnabled: false;
  providerRuntimeEnabled: false;
  queueWorkerEnabled: false;
  storageRuntimeEnabled: false;
  uploadRuntimeEnabled: false;
  schedulingRuntimeEnabled: false;
  observabilityRuntimeEnabled: false;
  costRuntimeEnabled: false;
  rollbackReady: false;
  runbookReady: false;
  publishAllowed: false;
};

export type VoxyRenderRuntimeCutoverGateExecutionFlags = {
  runtimeExecutionAllowed: false;
  featureFlagWriteAllowed: false;
  providerExecutionAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  schedulerJobAllowed: false;
  calendarWriteAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  auditEventEmissionAllowed: false;
  metricEmissionAllowed: false;
  alertEmissionAllowed: false;
  monitoringProviderCallAllowed: false;
  createsMediaFile: false;
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  secretsAccessed: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderRuntimeCutoverGateCommand = {
  runtimeCutoverGateId: string | null;
  runtimeObservabilityId: string | null;
  schedulingPolicyId: string | null;
  uploadTargetPolicyId: string | null;
  mediaStorageTruthId: string | null;
  approvalSemanticsId: string | null;
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  enablementBacklogId: string | null;
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  queueContractId: string | null;
  costCreditPolicyId: string | null;
  requestDraftId: string | null;
  previewReviewFlowId: string | null;
  scriptRef: RuntimeCutoverGateRef | null;
  contributionRef: RuntimeCutoverGateRef | null;
  dossierRef: RuntimeCutoverGateRef | null;
  reviewerRef: RuntimeCutoverGateRef | null;
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
  runtimeCutoverGateStatus: VoxyRenderRuntimeCutoverGateStatus;
  cutoverCandidate: VoxyRenderRuntimeCutoverCandidate;
  gates: VoxyRenderRuntimeCutoverGateItem[];
  semantics: VoxyRenderRuntimeCutoverGateSemantics;
  executionFlags: VoxyRenderRuntimeCutoverGateExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderRuntimeCutoverGateNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  runtimeObservabilityStatusHint: RuntimeObservabilityPreview["runtimeObservabilityStatus"] | null;
  schedulingPolicyStatusHint: SchedulingPolicyPreview["schedulingPolicyStatus"] | null;
  uploadTargetPolicyStatusHint: UploadTargetPolicyPreview["uploadTargetPolicyStatus"] | null;
  mediaStorageTruthStatusHint: MediaStorageTruthPreview["mediaStorageTruthStatus"] | null;
  approvalStatusHint: ApprovalPreview["approvalStatus"] | null;
  socialDistributionHandoffStatusHint: SocialDistributionPreview["handoffStatus"] | null;
  publishReadinessGuardStatusHint: PublishReadinessPreview["guardStatus"] | null;
  providerSelectionStatusHint: VoxyRenderProviderSelectionDraftRecord["providerSelectionStatus"] | null;
  queueStatusHint: VoxyRenderQueuePreviewRecord["queueStatus"] | null;
  costCreditPolicyStatusHint: VoxyRenderCostCreditPolicyPreviewRecord["policyStatus"] | null;
  backlogStatusHint: VoxyRenderRuntimeEnablementBacklogRecord["backlogStatus"] | null;
  matrixStatusHint: VoxyRenderRuntimeGoNogoMatrixRecord["matrixStatus"] | null;
};

export type VoxyRenderRuntimeCutoverGateRecord = VoxyRenderRuntimeCutoverGateCommand & {
  runtimeCutoverGateId: string;
  persistedAt: string;
  persistedBy: string | null;
  idempotencyKey: string;
  previousRuntimeCutoverGateRef: string | null;
  supersedesRuntimeCutoverGateRef: string | null;
  runtimeCutoverGateVersion: number;
};

export type VoxyRenderRuntimeCutoverGatePersistenceState = {
  mode: VoxyRenderRuntimeCutoverGatePersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderRuntimeCutoverGateRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyRenderRuntimeCutoverGateStoreResult = {
  ok: boolean;
  status: VoxyRenderRuntimeCutoverGateStoreResultStatus;
  record: VoxyRenderRuntimeCutoverGateRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderRuntimeCutoverGateNextStep;
};

export type VoxyRenderRuntimeCutoverGatePanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderRuntimeCutoverGateCommand | VoxyRenderRuntimeCutoverGateRecord;
  runtimeCutoverGateStatusLabel: string;
  nextStepLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    runtimeCutoverGateId: string;
    runtimeCutoverGateStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    runtimeCutoverGateVersion: number | null;
    runtimeObservabilityId: string | null;
  } | null;
  commandPreview: {
    createdAt: string | null;
    runtimeObservabilityId: string | null;
    runtimeCutoverGateStatusLabel: string;
    nextStepLabel: string;
  };
  cutoverCandidateLines: string[];
  gateLines: string[];
  blockerLines: string[];
  nextActionLines: string[];
  semanticsLines: string[];
  executionLines: string[];
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

function pickFirstRef<T extends RuntimeCutoverGateRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeText(value.id);
    const title = normalizeText(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: value.href ? normalizeText(value.href) || null : null,
    } satisfies RuntimeCutoverGateRef;
  }
  return null;
}

function mediaFileAvailable(value: MediaStorageTruthPreview | null | undefined) {
  return value?.mediaSemantics?.mediaFileAvailable ?? false;
}

export function voxyRenderRuntimeCutoverGateStatusLabel(
  value: VoxyRenderRuntimeCutoverGateStatus,
) {
  if (value === "runtime_cutover_gate_only") return "Nur Runtime Cutover Gate";
  if (value === "noop_cutover") return "Noop Cutover";
  if (value === "cutover_candidate_only") return "Nur Cutover-Kandidat";
  if (value === "runtime_not_enabled") return "Runtime noch nicht aktiviert";
  if (value === "runtime_prerequisites_missing") return "Prüfbausteine fehlen";
  if (value === "feature_flag_policy_needed") return "Feature-Flag-Policy fehlt";
  if (value === "provider_runtime_needed") return "Provider-Runtime fehlt";
  if (value === "queue_worker_needed") return "Queue-/Worker-Runtime fehlt";
  if (value === "storage_runtime_needed") return "Storage-Runtime fehlt";
  if (value === "upload_runtime_needed") return "Upload-Runtime fehlt";
  if (value === "scheduling_runtime_needed") return "Scheduling-Runtime fehlt";
  if (value === "observability_runtime_needed") return "Observability-Runtime fehlt";
  if (value === "cost_metering_runtime_needed") return "Cost-/Metering-Runtime fehlt";
  if (value === "rollback_policy_needed") return "Rollback-Policy fehlt";
  if (value === "runbook_needed") return "Runbook fehlt";
  if (value === "blocked_by_missing_observability") return "Observability fehlt";
  if (value === "blocked_by_missing_scheduling_policy") return "Scheduling-Policy fehlt";
  if (value === "blocked_by_missing_upload_target_policy") return "Upload-Target-Policy fehlt";
  if (value === "blocked_by_missing_media_file") return "Medien-Datei fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Bewusst Script-only";
}

function cutoverCandidateStatusLabel(value: VoxyRenderRuntimeCutoverCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "prerequisites_missing") return "Voraussetzungen fehlen";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "runtime_needed") return "Runtime fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function cutoverGateItemStatusLabel(value: VoxyRenderRuntimeCutoverGateItemStatus) {
  if (value === "ready_candidate") return "Bereiter Kandidat";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "runtime_needed") return "Runtime fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function cutoverGateKeyLabel(value: VoxyRenderRuntimeCutoverGateKey) {
  if (value === "featureFlagGate") return "Feature Flag";
  if (value === "providerRuntimeGate") return "Provider Runtime";
  if (value === "queueWorkerGate") return "Queue/Worker";
  if (value === "mediaStorageGate") return "Media/Storage";
  if (value === "uploadRuntimeGate") return "Upload Runtime";
  if (value === "schedulingRuntimeGate") return "Scheduling Runtime";
  if (value === "observabilityGate") return "Observability Runtime";
  if (value === "costCreditGate") return "Cost/Credit Runtime";
  if (value === "approvalGate") return "Approval";
  if (value === "publishGuardGate") return "Publish Guard";
  if (value === "socialDistributionGate") return "Social Distribution";
  if (value === "securitySecretsGate") return "Security/Secrets";
  if (value === "legalSafetyGate") return "Legal/Safety";
  if (value === "rollbackGate") return "Rollback";
  if (value === "runbookGate") return "Runbook";
  return "Operator";
}

export function voxyRenderRuntimeCutoverGateNextStepLabel(
  value: VoxyRenderRuntimeCutoverGateNextStep,
) {
  if (value === "define_feature_flag_policy") return "Feature-Flag-Policy definieren";
  if (value === "configure_provider_runtime") return "Provider-Runtime konfigurieren";
  if (value === "configure_queue_worker") return "Queue-Worker konfigurieren";
  if (value === "configure_storage_runtime") return "Storage-Runtime konfigurieren";
  if (value === "configure_upload_runtime") return "Upload-Runtime konfigurieren";
  if (value === "configure_scheduling_runtime") return "Scheduling-Runtime konfigurieren";
  if (value === "configure_observability_runtime") return "Observability-Runtime konfigurieren";
  if (value === "configure_cost_metering_runtime") return "Cost-/Metering-Runtime konfigurieren";
  if (value === "define_rollback_policy") return "Rollback-Policy definieren";
  if (value === "define_operator_runbook") return "Operator-Runbook definieren";
  if (value === "require_real_media_file") return "Echte Medien-Datei verlangen";
  if (value === "keep_cutover_blocked") return "Cutover blockiert halten";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blockiert";
}

function runtimeObservabilityStatusLabel(value: RuntimeObservabilityPreview["runtimeObservabilityStatus"]) {
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
  return "Bewusst Script-only";
}

function buildRuntimeCutoverGateId(input: {
  runtimeObservabilityId: string | null;
  previewReviewFlowId: string | null;
  requestDraftId: string | null;
}) {
  return [
    "voxy-render-runtime-cutover-gate",
    input.runtimeObservabilityId ?? "missing-runtime-observability",
    input.previewReviewFlowId ?? "missing-preview-review-flow",
    input.requestDraftId ?? "missing-request-draft",
  ]
    .join(":")
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .slice(0, 200);
}

function keepAsScriptOnly(input: {
  runtimeObservability: RuntimeObservabilityPreview | null;
  schedulingPolicy: SchedulingPolicyPreview | null;
  providerSelection: VoxyRenderProviderSelectionDraftRecord | null;
  queueContract: VoxyRenderQueuePreviewRecord | null;
  costPolicy: VoxyRenderCostCreditPolicyPreviewRecord | null;
  backlog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  return (
    input.runtimeObservability?.runtimeObservabilityStatus === "keep_as_script_only" ||
    input.schedulingPolicy?.schedulingPolicyStatus === "keep_as_script_only" ||
    input.providerSelection?.providerSelectionStatus === "keep_as_script_only" ||
    input.queueContract?.queueStatus === "keep_as_script_only" ||
    input.costPolicy?.policyStatus === "keep_as_script_only" ||
    input.backlog?.backlogStatus === "keep_as_script_only" ||
    input.matrix?.matrixStatus === "keep_as_script_only"
  );
}

function blockedByRuntimeTruth(input: {
  runtimeObservability: RuntimeObservabilityPreview | null;
  schedulingPolicy: SchedulingPolicyPreview | null;
  providerSelection: VoxyRenderProviderSelectionDraftRecord | null;
  queueContract: VoxyRenderQueuePreviewRecord | null;
  costPolicy: VoxyRenderCostCreditPolicyPreviewRecord | null;
  backlog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  return (
    input.runtimeObservability?.runtimeObservabilityStatus === "blocked_by_runtime_truth" ||
    input.schedulingPolicy?.schedulingPolicyStatus === "blocked_by_runtime_truth" ||
    input.providerSelection?.providerSelectionStatus === "blocked_by_runtime_truth" ||
    input.queueContract?.queueStatus === "blocked_by_runtime_truth" ||
    input.costPolicy?.policyStatus === "blocked_by_runtime_truth" ||
    input.backlog?.backlogStatus === "blocked_by_runtime_truth" ||
    input.matrix?.matrixStatus === "blocked_by_runtime_truth"
  );
}

function summaryForStatus(status: VoxyRenderRuntimeCutoverGateStatus) {
  if (status === "blocked_by_missing_observability") {
    return {
      userVisible:
        "Der Runtime Cutover Gate bleibt blockiert, solange nicht einmal eine ehrliche Runtime-Observability-Vorschau existiert.",
      reviewerVisible:
        "Ohne Runtime Observability gibt es keinen belastbaren letzten Noop-Andockpunkt vor einem echten Runtime-Cutover.",
    };
  }
  if (status === "blocked_by_missing_scheduling_policy") {
    return {
      userVisible:
        "Ohne Scheduling-Policy bleibt der Runtime Cutover Gate vor jeder Aktivierungsfrage blockiert.",
      reviewerVisible:
        "Scheduling bleibt der nötige Upstream-Anker; vorher wird keine Runtime-, Feature-Flag- oder Worker-Aktivierung behauptet.",
    };
  }
  if (status === "blocked_by_missing_upload_target_policy") {
    return {
      userVisible:
        "Ohne Upload-Target-Policy bleibt der Cutover ein reiner Prüfabschnitt ohne Aktivierung.",
      reviewerVisible:
        "Upload-Ziel und Guardrails fehlen weiterhin; Runtime-Cutover bleibt ausdrücklich blockiert.",
    };
  }
  if (status === "blocked_by_missing_media_file") {
    return {
      userVisible:
        "Ohne echte Medien-Datei bleibt jeder Cutover hypothetisch und wird nicht aktiviert.",
      reviewerVisible:
        "Media-/Storage-Wahrheit fehlt; Render, Upload, Scheduling und Publish bleiben rein theoretisch.",
    };
  }
  if (status === "blocked_by_runtime_truth") {
    return {
      userVisible:
        "Die eigentliche Runtime-Wahrheit fehlt weiterhin, deshalb bleibt der Cutover blockiert.",
      reviewerVisible:
        "Kein Providerlauf, kein Worker, kein Upload, kein Scheduling und kein Publish werden aus Readmodels heraus behauptet.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      userVisible:
        "Dieser Pfad bleibt bewusst Script-only. Runtime, Feature Flag, Providerlauf und Publish bleiben ausgeschaltet.",
      reviewerVisible:
        "Script-only gewinnt vor jeder Cutover-Frage; der Gate dokumentiert nur, was für eine spätere Runtime fehlen würde.",
    };
  }
  return {
    userVisible:
      "Der Runtime Cutover Gate bleibt ein read-only Prüfpunkt. Runtime, Feature Flag, Provider, Worker, Upload, Scheduling und Publish bleiben deaktiviert.",
    reviewerVisible:
      "Der Gate beantwortet nur, welche Voraussetzungen für einen späteren Cutover fehlen. Alle Aktivierungs- und Ausführungsflags bleiben false.",
    };
}

function gateStatusForCoreInput(input: {
  missingPrerequisite: boolean;
  blocked: boolean;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) return "not_applicable" satisfies VoxyRenderRuntimeCutoverGateItemStatus;
  if (input.missingPrerequisite || input.blocked) {
    return "blocked" satisfies VoxyRenderRuntimeCutoverGateItemStatus;
  }
  return "runtime_needed" satisfies VoxyRenderRuntimeCutoverGateItemStatus;
}

function buildGate(
  gateKey: VoxyRenderRuntimeCutoverGateKey,
  status: VoxyRenderRuntimeCutoverGateItemStatus,
  userVisibleReason: string,
  reviewerVisibleReason: string,
  nextAction: VoxyRenderRuntimeCutoverGateNextStep,
): VoxyRenderRuntimeCutoverGateItem {
  return {
    gateKey,
    label: cutoverGateKeyLabel(gateKey),
    status,
    userVisibleReason,
    reviewerVisibleReason,
    nextAction,
    executionAllowed: false,
  };
}

function buildGates(input: {
  status: VoxyRenderRuntimeCutoverGateStatus;
  runtimeObservability: RuntimeObservabilityPreview | null;
  schedulingPolicy: SchedulingPolicyPreview | null;
  uploadTargetPolicy: UploadTargetPolicyPreview | null;
  mediaStorageTruth: MediaStorageTruthPreview | null;
  approval: ApprovalPreview | null;
  socialDistribution: SocialDistributionPreview | null;
  publishReadiness: PublishReadinessPreview | null;
  providerSelection: VoxyRenderProviderSelectionDraftRecord | null;
  queueContract: VoxyRenderQueuePreviewRecord | null;
  costPolicy: VoxyRenderCostCreditPolicyPreviewRecord | null;
  keepScriptOnly: boolean;
  runtimeTruthBlocked: boolean;
}) {
  const observabilityMissing = !input.runtimeObservability?.runtimeObservabilityId;
  const schedulingMissing = !input.schedulingPolicy?.schedulingPolicyId;
  const uploadMissing = !input.uploadTargetPolicy?.uploadTargetPolicyId;
  const mediaMissing = !mediaFileAvailable(input.mediaStorageTruth);
  const providerBlocked =
    input.providerSelection?.providerSelectionStatus === "blocked_by_runtime_truth" ||
    input.providerSelection?.providerSelectionStatus === "blocked_by_missing_request_draft" ||
    input.providerSelection?.providerSelectionStatus === "blocked_by_missing_asset_pack" ||
    input.providerSelection?.providerSelectionStatus === "blocked_by_missing_cost_policy" ||
    input.providerSelection?.providerSelectionStatus === "blocked_by_missing_registry";
  const queueBlocked =
    input.queueContract?.queueStatus === "blocked_by_runtime_truth" ||
    input.queueContract?.queueStatus === "blocked_by_missing_request_draft" ||
    input.queueContract?.queueStatus === "blocked_by_missing_review" ||
    input.queueContract?.queueStatus === "blocked_by_missing_provider" ||
    input.queueContract?.queueStatus === "blocked_by_missing_assets" ||
    input.queueContract?.queueStatus === "blocked_by_missing_cost_policy";
  const costPolicyStatus = input.costPolicy?.policyStatus ?? null;
  const costBlocked =
    costPolicyStatus === "blocked_by_runtime_truth" ||
    costPolicyStatus === "blocked_by_missing_request_draft" ||
    costPolicyStatus === "blocked_by_missing_queue_contract" ||
    costPolicyStatus === "blocked_by_missing_provider" ||
    costPolicyStatus === "blocked_by_missing_assets";
  const costGateStatus = input.keepScriptOnly
    ? "not_applicable"
    : costBlocked
      ? "blocked"
      : costPolicyStatus === "needs_runtime_metering"
        ? "runtime_needed"
        : "policy_needed";

  return [
    buildGate(
      "featureFlagGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Feature Flag nicht aktiviert.",
      "Vor jedem Runtime-Cutover braucht es eine dokumentierte Feature-Flag-Policy mit Rollout- und Rollback-Grenzen.",
      "define_feature_flag_policy",
    ),
    buildGate(
      "providerRuntimeGate",
      gateStatusForCoreInput({
        missingPrerequisite: false,
        blocked: input.runtimeTruthBlocked || providerBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      "Provider nicht ausgeführt.",
      "Providerlauf bleibt deaktiviert; Provider-Selection ist noch kein echter Runtime-Provider.",
      "configure_provider_runtime",
    ),
    buildGate(
      "queueWorkerGate",
      gateStatusForCoreInput({
        missingPrerequisite: false,
        blocked: input.runtimeTruthBlocked || queueBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      "Kein Worker gestartet.",
      "Queue-Vertrag und Worker-Runtime bleiben getrennt; es läuft bewusst kein Hintergrundjob.",
      "configure_queue_worker",
    ),
    buildGate(
      "mediaStorageGate",
      gateStatusForCoreInput({
        missingPrerequisite: mediaMissing,
        blocked: input.runtimeTruthBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      mediaMissing ? "Es fehlt weiterhin eine echte Medien-Datei." : "Storage-Runtime nicht aktiviert.",
      mediaMissing
        ? "Ohne echte Medien-Datei bleibt Storage nur dokumentierte Vorbedingung."
        : "Media-/Storage-Wahrheit ist sichtbar, aber keine Storage-Runtime ist freigeschaltet.",
      mediaMissing ? "require_real_media_file" : "configure_storage_runtime",
    ),
    buildGate(
      "uploadRuntimeGate",
      gateStatusForCoreInput({
        missingPrerequisite: uploadMissing,
        blocked: input.runtimeTruthBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      uploadMissing ? "Upload-Ziel fehlt." : "Kein Upload erlaubt.",
      uploadMissing
        ? "Ohne Upload-Target-Policy bleibt Upload vollständig blockiert."
        : "Upload-Ziele sind lesbar, aber die Upload-Runtime bleibt ausgeschaltet.",
      uploadMissing ? "blocked" : "configure_upload_runtime",
    ),
    buildGate(
      "schedulingRuntimeGate",
      gateStatusForCoreInput({
        missingPrerequisite: schedulingMissing,
        blocked: input.runtimeTruthBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      schedulingMissing ? "Scheduling-Policy fehlt." : "Scheduling-Runtime nicht aktiviert.",
      schedulingMissing
        ? "Ohne Scheduling-Policy gibt es keinen ehrlichen nächsten Runtime-Anker."
        : "Scheduling-Policy ist vorhanden, aber keine Scheduler-Runtime und kein Kalender-Write sind aktiv.",
      schedulingMissing ? "blocked" : "configure_scheduling_runtime",
    ),
    buildGate(
      "observabilityGate",
      gateStatusForCoreInput({
        missingPrerequisite: observabilityMissing,
        blocked: input.runtimeTruthBlocked,
        keepAsScriptOnly: input.keepScriptOnly,
      }),
      observabilityMissing ? "Runtime Observability fehlt." : "Observability-Runtime nicht aktiviert.",
      observabilityMissing
        ? "Ohne Observability-Noop fehlt die letzte ehrliche Vorstufe vor Runtime-Cutover."
        : "Observability ist als Noop sichtbar, aber es gibt keine echte Monitoring-, Metrics-, Alert- oder Trace-Runtime.",
      observabilityMissing ? "blocked" : "configure_observability_runtime",
    ),
    buildGate(
      "costCreditGate",
      costGateStatus,
      "Keine Cost-/Credit-Debits erlaubt.",
      "Cost-/Credit-Policies bleiben ohne Metering-Runtime, Debit-Pfade und Runtime-Claims rein planerisch.",
      costGateStatus === "runtime_needed"
        ? "configure_cost_metering_runtime"
        : "define_feature_flag_policy",
    ),
    buildGate(
      "approvalGate",
      input.keepScriptOnly
        ? "not_applicable"
        : input.approval?.approvalSemanticsId
          ? "ready_candidate"
          : "blocked",
      input.approval?.approvalSemanticsId
        ? "Approval-Semantik ist als Kandidat sichtbar."
        : "Approval-Semantik fehlt.",
      input.approval?.approvalSemanticsId
        ? "Approval ist sichtbar, bleibt aber kein Runtime-Enablement."
        : "Ohne Approval-Semantik bleibt der Cutover inhaltlich unvollständig.",
      input.approval?.approvalSemanticsId ? "keep_cutover_blocked" : "blocked",
    ),
    buildGate(
      "publishGuardGate",
      input.keepScriptOnly
        ? "not_applicable"
        : input.publishReadiness?.publishReadinessGuardId
          ? "ready_candidate"
          : "blocked",
      input.publishReadiness?.publishReadinessGuardId
        ? "Publish Guard ist als Kandidat sichtbar."
        : "Publish Guard fehlt.",
      input.publishReadiness?.publishReadinessGuardId
        ? "Publish Guard bleibt read-only und gibt keinen Publish frei."
        : "Ohne Publish Guard fehlt eine zentrale Cutover-Vorbedingung.",
      input.publishReadiness?.publishReadinessGuardId ? "keep_cutover_blocked" : "blocked",
    ),
    buildGate(
      "socialDistributionGate",
      input.keepScriptOnly
        ? "not_applicable"
        : input.socialDistribution?.socialDistributionHandoffId
          ? "ready_candidate"
          : "blocked",
      input.socialDistribution?.socialDistributionHandoffId
        ? "Social Distribution ist als Handoff sichtbar."
        : "Social Distribution fehlt.",
      input.socialDistribution?.socialDistributionHandoffId
        ? "Distribution bleibt Handoff-only und ohne Posting-Runtime."
        : "Ohne Social-Distribution-Handoff bleibt der spätere Publish-Übergang unvollständig.",
      input.socialDistribution?.socialDistributionHandoffId ? "keep_cutover_blocked" : "blocked",
    ),
    buildGate(
      "securitySecretsGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Secrets bleiben unzugänglich.",
      "Vor Runtime-Cutover braucht es eine dokumentierte Secrets- und Key-Handling-Policy.",
      "define_feature_flag_policy",
    ),
    buildGate(
      "legalSafetyGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Legal-/Safety-Policy nicht abgeschlossen.",
      "Provider-, Upload-, Scheduling- und Publish-Risiken brauchen eine explizite Legal-/Safety-Freigabelogik.",
      "define_feature_flag_policy",
    ),
    buildGate(
      "rollbackGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Rollback-Policy fehlt.",
      "Ohne Rollback-Policy darf kein Runtime-Cutover freigeschaltet werden.",
      "define_rollback_policy",
    ),
    buildGate(
      "runbookGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Runbook fehlt.",
      "Operator brauchen vor Aktivierung ein explizites Runbook für Start, Stopp, Incident und Rücknahme.",
      "define_operator_runbook",
    ),
    buildGate(
      "operatorGate",
      input.keepScriptOnly ? "not_applicable" : "policy_needed",
      "Operator-Freigabe nicht vorbereitet.",
      "Es gibt noch keinen operatorischen Freigabepfad für Runtime, Worker, Upload und Publish.",
      "define_operator_runbook",
    ),
  ] satisfies VoxyRenderRuntimeCutoverGateItem[];
}

function nextStepFromStatus(
  status: VoxyRenderRuntimeCutoverGateStatus,
): VoxyRenderRuntimeCutoverGateNextStep {
  if (status === "blocked_by_missing_media_file") return "require_real_media_file";
  if (status === "provider_runtime_needed") return "configure_provider_runtime";
  if (status === "queue_worker_needed") return "configure_queue_worker";
  if (status === "storage_runtime_needed") return "configure_storage_runtime";
  if (status === "upload_runtime_needed") return "configure_upload_runtime";
  if (status === "scheduling_runtime_needed") return "configure_scheduling_runtime";
  if (status === "observability_runtime_needed") return "configure_observability_runtime";
  if (status === "cost_metering_runtime_needed") return "configure_cost_metering_runtime";
  if (status === "rollback_policy_needed") return "define_rollback_policy";
  if (status === "runbook_needed") return "define_operator_runbook";
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (status === "runtime_not_enabled" || status === "cutover_candidate_only") {
    return "define_feature_flag_policy";
  }
  if (status === "runtime_prerequisites_missing") return "keep_cutover_blocked";
  return "blocked";
}

function topBlockersForStatus(
  status: VoxyRenderRuntimeCutoverGateStatus,
  gates: VoxyRenderRuntimeCutoverGateItem[],
) {
  const blockers = new Set<string>();
  const summary = summaryForStatus(status);
  blockers.add(summary.userVisible);
  for (const gate of gates) {
    if (gate.status === "ready_candidate" || gate.status === "not_applicable") continue;
    blockers.add(`${gate.label}: ${gate.userVisibleReason}`);
  }
  return Array.from(blockers);
}

function buildStatus(input: {
  runtimeObservability: RuntimeObservabilityPreview | null;
  schedulingPolicy: SchedulingPolicyPreview | null;
  uploadTargetPolicy: UploadTargetPolicyPreview | null;
  mediaStorageTruth: MediaStorageTruthPreview | null;
  providerSelection: VoxyRenderProviderSelectionDraftRecord | null;
  queueContract: VoxyRenderQueuePreviewRecord | null;
  costPolicy: VoxyRenderCostCreditPolicyPreviewRecord | null;
  backlog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  if (
    keepAsScriptOnly({
      runtimeObservability: input.runtimeObservability,
      schedulingPolicy: input.schedulingPolicy,
      providerSelection: input.providerSelection,
      queueContract: input.queueContract,
      costPolicy: input.costPolicy,
      backlog: input.backlog,
      matrix: input.matrix,
    })
  ) {
    return "keep_as_script_only" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.runtimeObservability?.runtimeObservabilityId) {
    return "blocked_by_missing_observability" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.schedulingPolicy?.schedulingPolicyId) {
    return "blocked_by_missing_scheduling_policy" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.uploadTargetPolicy?.uploadTargetPolicyId) {
    return "blocked_by_missing_upload_target_policy" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!mediaFileAvailable(input.mediaStorageTruth)) {
    return "blocked_by_missing_media_file" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (
    blockedByRuntimeTruth({
      runtimeObservability: input.runtimeObservability,
      schedulingPolicy: input.schedulingPolicy,
      providerSelection: input.providerSelection,
      queueContract: input.queueContract,
      costPolicy: input.costPolicy,
      backlog: input.backlog,
      matrix: input.matrix,
    })
  ) {
    return "blocked_by_runtime_truth" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.providerSelection || input.providerSelection.providerSelectionStatus !== "noop_provider_selection") {
    return "provider_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.queueContract || input.queueContract.queueStatus !== "queue_contract_only") {
    return "queue_worker_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.mediaStorageTruth?.mediaStorageTruthId) {
    return "storage_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.uploadTargetPolicy?.uploadTargetPolicyId) {
    return "upload_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (!input.schedulingPolicy?.schedulingPolicyId) {
    return "scheduling_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (
    !input.runtimeObservability ||
    input.runtimeObservability.runtimeObservabilityStatus !== "monitoring_provider_needed"
  ) {
    return "observability_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  if (
    !input.costPolicy ||
    (input.costPolicy.policyStatus !== "needs_runtime_metering" &&
      input.costPolicy.policyStatus !== "noop_billing")
  ) {
    return "cost_metering_runtime_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
  }
  return "feature_flag_policy_needed" satisfies VoxyRenderRuntimeCutoverGateStatus;
}

function buildCutoverCandidate(
  status: VoxyRenderRuntimeCutoverGateStatus,
  runtimeCutoverGateId: string | null,
): VoxyRenderRuntimeCutoverCandidate {
  const summary = summaryForStatus(status);
  const candidateStatus: VoxyRenderRuntimeCutoverCandidateStatus =
    status === "keep_as_script_only"
      ? "not_applicable"
      : status === "blocked_by_missing_observability" ||
          status === "blocked_by_missing_scheduling_policy" ||
          status === "blocked_by_missing_upload_target_policy" ||
          status === "blocked_by_missing_media_file" ||
          status === "blocked_by_runtime_truth"
        ? "blocked"
        : status === "feature_flag_policy_needed" ||
            status === "rollback_policy_needed" ||
            status === "runbook_needed" ||
            status === "runtime_prerequisites_missing"
          ? "policy_needed"
          : status === "provider_runtime_needed" ||
              status === "queue_worker_needed" ||
              status === "storage_runtime_needed" ||
              status === "upload_runtime_needed" ||
              status === "scheduling_runtime_needed" ||
              status === "observability_runtime_needed" ||
              status === "cost_metering_runtime_needed"
            ? "runtime_needed"
            : "candidate_only";

  return {
    cutoverCandidateId: runtimeCutoverGateId ? `${runtimeCutoverGateId}:candidate` : null,
    status: candidateStatus,
    runtimeCutoverCandidate: status !== "keep_as_script_only",
    runtimeEnabled: false,
    featureFlagCandidate: status !== "keep_as_script_only",
    featureFlagEnabled: false,
    reviewerVisibleReason: summary.reviewerVisible,
    userVisibleReason: summary.userVisible,
  };
}

function buildSemantics(
  candidate: VoxyRenderRuntimeCutoverCandidate,
): VoxyRenderRuntimeCutoverGateSemantics {
  return {
    runtimeCutoverCandidate: candidate.runtimeCutoverCandidate,
    runtimeEnabled: false,
    featureFlagCandidate: candidate.featureFlagCandidate,
    featureFlagEnabled: false,
    providerRuntimeEnabled: false,
    queueWorkerEnabled: false,
    storageRuntimeEnabled: false,
    uploadRuntimeEnabled: false,
    schedulingRuntimeEnabled: false,
    observabilityRuntimeEnabled: false,
    costRuntimeEnabled: false,
    rollbackReady: false,
    runbookReady: false,
    publishAllowed: false,
  };
}

function buildExecutionFlags(): VoxyRenderRuntimeCutoverGateExecutionFlags {
  return {
    runtimeExecutionAllowed: false,
    featureFlagWriteAllowed: false,
    providerExecutionAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    schedulerJobAllowed: false,
    calendarWriteAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    auditEventEmissionAllowed: false,
    metricEmissionAllowed: false,
    alertEmissionAllowed: false,
    monitoringProviderCallAllowed: false,
    createsMediaFile: false,
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    secretsAccessed: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildDefaultStoreState(): VoxyRenderRuntimeCutoverGatePersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Runtime-Cutover-Gate-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Readmodel-Vorschau. Runtime, Feature Flag, Provider, Worker, Upload, Scheduling und Publish bleiben aus.",
    repositoryInterface: "VoxyRenderRuntimeCutoverGateRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

export function buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels(input: {
  latestRuntimeObservabilityRecord?: RuntimeObservabilityPreview | null;
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestQueueContract?: VoxyRenderQueuePreviewRecord | null;
  latestCostCreditPolicy?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
}) {
  const runtimeObservability = input.latestRuntimeObservabilityRecord ?? null;
  const schedulingPolicy = input.latestSchedulingPolicyRecord ?? null;
  const uploadTargetPolicy = input.latestUploadTargetPolicyRecord ?? null;
  const mediaStorageTruth = input.latestMediaStorageTruthRecord ?? null;
  const approval = input.latestApprovalSemanticsRecord ?? null;
  const socialDistribution = input.latestSocialDistributionHandoffRecord ?? null;
  const publishReadiness = input.latestPublishReadinessGuardRecord ?? null;
  const providerSelection = input.latestProviderSelectionDraft ?? null;
  const queueContract = input.latestQueueContract ?? null;
  const costPolicy = input.latestCostCreditPolicy ?? null;
  const backlog = input.latestBacklog ?? null;
  const matrix = input.latestMatrix ?? null;

  const status = buildStatus({
    runtimeObservability,
    schedulingPolicy,
    uploadTargetPolicy,
    mediaStorageTruth,
    providerSelection,
    queueContract,
    costPolicy,
    backlog,
    matrix,
  });
  const runtimeCutoverGateId = buildRuntimeCutoverGateId({
    runtimeObservabilityId: runtimeObservability?.runtimeObservabilityId ?? null,
    previewReviewFlowId:
      runtimeObservability?.previewReviewFlowId ??
      schedulingPolicy?.previewReviewFlowId ??
      input.previewFlow?.previewReviewFlowId ??
      null,
    requestDraftId:
      runtimeObservability?.requestDraftId ??
      schedulingPolicy?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      null,
  });
  const keepScriptOnly = status === "keep_as_script_only";
  const runtimeTruthBlocked = status === "blocked_by_runtime_truth";
  const gates = buildGates({
    status,
    runtimeObservability,
    schedulingPolicy,
    uploadTargetPolicy,
    mediaStorageTruth,
    approval,
    socialDistribution,
    publishReadiness,
    providerSelection,
    queueContract,
    costPolicy,
    keepScriptOnly,
    runtimeTruthBlocked,
  });
  const cutoverCandidate = buildCutoverCandidate(status, runtimeCutoverGateId);
  const summary = summaryForStatus(status);

  return {
    runtimeCutoverGateId,
    runtimeObservabilityId: runtimeObservability?.runtimeObservabilityId ?? null,
    schedulingPolicyId: schedulingPolicy?.schedulingPolicyId ?? null,
    uploadTargetPolicyId:
      schedulingPolicy?.uploadTargetPolicyId ??
      uploadTargetPolicy?.uploadTargetPolicyId ??
      null,
    mediaStorageTruthId:
      schedulingPolicy?.mediaStorageTruthId ??
      mediaStorageTruth?.mediaStorageTruthId ??
      null,
    approvalSemanticsId:
      schedulingPolicy?.approvalSemanticsId ?? approval?.approvalSemanticsId ?? null,
    socialDistributionHandoffId:
      schedulingPolicy?.socialDistributionHandoffId ??
      socialDistribution?.socialDistributionHandoffId ??
      null,
    publishReadinessGuardId:
      schedulingPolicy?.publishReadinessGuardId ??
      publishReadiness?.publishReadinessGuardId ??
      null,
    enablementBacklogId:
      runtimeObservability?.enablementBacklogId ??
      schedulingPolicy?.enablementBacklogId ??
      backlog?.backlogId ??
      null,
    matrixId:
      runtimeObservability?.matrixId ?? schedulingPolicy?.matrixId ?? matrix?.matrixId ?? null,
    providerSelectionDraftId: providerSelection?.providerSelectionDraftId ?? null,
    queueContractId: queueContract?.queuePreviewId ?? null,
    costCreditPolicyId: costPolicy?.policyPreviewId ?? null,
    requestDraftId:
      runtimeObservability?.requestDraftId ??
      schedulingPolicy?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      null,
    previewReviewFlowId:
      runtimeObservability?.previewReviewFlowId ??
      schedulingPolicy?.previewReviewFlowId ??
      input.previewFlow?.previewReviewFlowId ??
      null,
    scriptRef: pickFirstRef(
      runtimeObservability?.scriptRef ?? null,
      schedulingPolicy?.scriptRef ?? null,
      input.latestRequestDraft?.scriptRef ?? null,
      input.gate?.contributionRef ?? null,
    ),
    contributionRef: pickFirstRef(
      runtimeObservability?.contributionRef ?? null,
      schedulingPolicy?.contributionRef ?? null,
      input.latestRequestDraft?.contributionRef ?? null,
      input.gate?.contributionRef ?? null,
    ),
    dossierRef: pickFirstRef(
      runtimeObservability?.dossierRef ?? null,
      schedulingPolicy?.dossierRef ?? null,
      input.latestRequestDraft?.dossierRef ?? null,
      input.gate?.dossierRef ?? null,
    ),
    reviewerRef:
      runtimeObservability?.reviewerRef ?? schedulingPolicy?.reviewerRef ?? null,
    createdAt: pickFirstString(
      runtimeObservability?.createdAt,
      schedulingPolicy?.createdAt,
      input.latestRequestDraft?.persistedAt,
    ),
    updatedAt: runtimeObservability?.updatedAt ?? schedulingPolicy?.updatedAt ?? null,
    sourceLanguage:
      runtimeObservability?.sourceLanguage ??
      schedulingPolicy?.sourceLanguage ??
      input.previewFlow?.sourceLanguage ??
      "de",
    readingLanguage:
      runtimeObservability?.readingLanguage ??
      schedulingPolicy?.readingLanguage ??
      input.previewFlow?.readingLanguage ??
      "de",
    scriptLanguage:
      runtimeObservability?.scriptLanguage ??
      schedulingPolicy?.scriptLanguage ??
      input.previewFlow?.scriptLanguage ??
      "de",
    renderLanguage:
      runtimeObservability?.renderLanguage ??
      schedulingPolicy?.renderLanguage ??
      input.previewFlow?.renderLanguage ??
      "de",
    subtitleLanguage:
      runtimeObservability?.subtitleLanguage ??
      schedulingPolicy?.subtitleLanguage ??
      input.previewFlow?.subtitleLanguage ??
      null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      runtimeObservability?.rtlRequired ??
      schedulingPolicy?.rtlRequired ??
      input.previewFlow?.rtlRequired ??
      false,
    runtimeCutoverGateStatus: status,
    cutoverCandidate,
    gates,
    semantics: buildSemantics(cutoverCandidate),
    executionFlags: buildExecutionFlags(),
    topBlockers: topBlockersForStatus(status, gates),
    nextStep: nextStepFromStatus(status),
    userVisibleSummary: summary.userVisible,
    reviewerVisibleSummary: summary.reviewerVisible,
    runtimeObservabilityStatusHint: runtimeObservability?.runtimeObservabilityStatus ?? null,
    schedulingPolicyStatusHint: schedulingPolicy?.schedulingPolicyStatus ?? null,
    uploadTargetPolicyStatusHint:
      uploadTargetPolicy?.uploadTargetPolicyStatus ??
      runtimeObservability?.uploadTargetPolicyStatusHint ??
      null,
    mediaStorageTruthStatusHint:
      mediaStorageTruth?.mediaStorageTruthStatus ??
      runtimeObservability?.mediaStorageTruthStatusHint ??
      null,
    approvalStatusHint:
      approval?.approvalStatus ?? runtimeObservability?.approvalStatusHint ?? null,
    socialDistributionHandoffStatusHint:
      socialDistribution?.handoffStatus ??
      runtimeObservability?.socialDistributionHandoffStatusHint ??
      null,
    publishReadinessGuardStatusHint:
      publishReadiness?.guardStatus ??
      runtimeObservability?.publishReadinessGuardStatusHint ??
      null,
    providerSelectionStatusHint: providerSelection?.providerSelectionStatus ?? null,
    queueStatusHint: queueContract?.queueStatus ?? null,
    costCreditPolicyStatusHint: costPolicy?.policyStatus ?? null,
    backlogStatusHint: backlog?.backlogStatus ?? null,
    matrixStatusHint: matrix?.matrixStatus ?? null,
  } satisfies VoxyRenderRuntimeCutoverGateCommand;
}

export function buildVoxyRenderRuntimeCutoverGateFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
    latestRuntimeObservabilityRecord:
      buildVoxyRenderRuntimeObservabilityFromCreateCandidatePreview(model),
    latestSchedulingPolicyRecord: buildVoxyRenderSchedulingPolicyFromCreateCandidatePreview(model),
    latestProviderSelectionDraft:
      buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview(model),
    latestQueueContract: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
    latestCostCreditPolicy:
      buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderRuntimeCutoverGateFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestRuntimeObservabilityRecord?: RuntimeObservabilityPreview | null;
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestQueueContract?: VoxyRenderQueuePreviewRecord | null;
  latestCostCreditPolicy?: VoxyRenderCostCreditPolicyPreviewRecord | null;
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
  return buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
    latestRuntimeObservabilityRecord:
      input.latestRuntimeObservabilityRecord ??
      buildVoxyRenderRuntimeObservabilityFromReviewContext({
        reviewContext: input.reviewContext,
        surface: input.surface ?? "admin",
        latestSchedulingPolicyRecord: input.latestSchedulingPolicyRecord ?? null,
        latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
        latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
        latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
        latestSocialDistributionHandoffRecord:
          input.latestSocialDistributionHandoffRecord ?? null,
        latestPublishReadinessGuardRecord:
          input.latestPublishReadinessGuardRecord ?? null,
        latestBacklog,
        latestMatrix,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
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
    latestSocialDistributionHandoffRecord: input.latestSocialDistributionHandoffRecord ?? null,
    latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
    latestProviderSelectionDraft:
      input.latestProviderSelectionDraft ??
      buildVoxyRenderProviderSelectionDraftFromReviewContext(input.reviewContext, {
        audience: input.surface ?? "admin",
        latestRequestDraftRecord: input.latestRequestDraft ?? null,
        latestQueuePreviewRecord: input.latestQueueContract ?? null,
        latestCostPolicyPreviewRecord: input.latestCostCreditPolicy ?? null,
      }),
    latestQueueContract:
      input.latestQueueContract ??
      buildVoxyRenderQueuePreviewFromReviewContext(input.reviewContext, {
        audience: input.surface ?? "admin",
        latestRequestDraftRecord: input.latestRequestDraft ?? null,
      }),
    latestCostCreditPolicy:
      input.latestCostCreditPolicy ??
      buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(input.reviewContext, {
        audience: input.surface ?? "admin",
        latestRequestDraftRecord: input.latestRequestDraft ?? null,
        latestQueuePreviewRecord: input.latestQueueContract ?? null,
      }),
    latestBacklog,
    latestMatrix,
    latestRequestDraft: input.latestRequestDraft ?? null,
  });
}

export function buildVoxyRenderRuntimeCutoverGateFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account";
    contributionRef?: RuntimeCutoverGateRef | null;
    nextStep?: string | null;
  },
) {
  return buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
    latestRuntimeObservabilityRecord:
      buildVoxyRenderRuntimeObservabilityFromVoxyDialog(dialog, options),
    latestSchedulingPolicyRecord: buildVoxyRenderSchedulingPolicyFromVoxyDialog(dialog, options),
    latestProviderSelectionDraft:
      buildVoxyRenderProviderSelectionDraftFromVoxyDialog(dialog, options),
    latestQueueContract: buildVoxyRenderQueuePreviewFromVoxyDialog(dialog, options),
    latestCostCreditPolicy: buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(dialog, options),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options),
  });
}

function semanticsLines(value: VoxyRenderRuntimeCutoverGateSemantics) {
  return [
    value.runtimeCutoverCandidate
      ? "Cutover-Kandidat bleibt sichtbar"
      : "Kein Cutover-Kandidat im Script-only-Pfad",
    "runtime_enabled bleibt false",
    "feature_flag_enabled bleibt false",
    "provider_runtime_enabled bleibt false",
    "queue_worker_enabled bleibt false",
    "storage_runtime_enabled bleibt false",
    "upload_runtime_enabled bleibt false",
    "scheduling_runtime_enabled bleibt false",
    "observability_runtime_enabled bleibt false",
    "cost_runtime_enabled bleibt false",
    "rollback_ready bleibt false",
    "runbook_ready bleibt false",
    "publish_allowed bleibt false",
  ];
}

function executionLines(value: VoxyRenderRuntimeCutoverGateExecutionFlags) {
  return [
    value.runtimeExecutionAllowed ? "Runtime wäre erlaubt" : "Runtime noch nicht aktiviert",
    value.featureFlagWriteAllowed ? "Feature Flag dürfte geschrieben werden" : "Feature Flag nicht aktiviert",
    value.providerExecutionAllowed ? "Provider dürfte laufen" : "Provider nicht ausgeführt",
    value.workerAllowed ? "Worker dürfte laufen" : "Kein Worker gestartet",
    value.uploadAllowed ? "Upload wäre erlaubt" : "Kein Upload erlaubt",
    value.publishAllowed ? "Publish wäre erlaubt" : "Kein Publish erlaubt",
  ];
}

function buildAuditLines(
  preview: VoxyRenderRuntimeCutoverGateCommand | VoxyRenderRuntimeCutoverGateRecord,
) {
  return [
    preview.runtimeObservabilityId
      ? `Runtime Observability: ${preview.runtimeObservabilityId}`
      : "Noch keine Runtime Observability referenziert.",
    preview.runtimeObservabilityStatusHint
      ? `Observability-Status: ${runtimeObservabilityStatusLabel(
          preview.runtimeObservabilityStatusHint,
        )}`
      : "Noch kein Observability-Status sichtbar.",
    preview.schedulingPolicyStatusHint
      ? `Scheduling: ${voxyRenderSchedulingPolicyStatusLabel(preview.schedulingPolicyStatusHint)}`
      : "Noch kein Scheduling-Status sichtbar.",
    preview.uploadTargetPolicyStatusHint
      ? `Upload Target: ${voxyRenderUploadTargetPolicyStatusLabel(
          preview.uploadTargetPolicyStatusHint,
        )}`
      : "Noch kein Upload-Target-Status sichtbar.",
    preview.mediaStorageTruthStatusHint
      ? `Media/Storage: ${voxyRenderMediaStorageTruthStatusLabel(
          preview.mediaStorageTruthStatusHint,
        )}`
      : "Noch kein Media-/Storage-Status sichtbar.",
    preview.approvalStatusHint
      ? `Approval: ${voxyRenderApprovalSemanticsStatusLabel(preview.approvalStatusHint)}`
      : "Noch kein Approval-Status sichtbar.",
    preview.publishReadinessGuardStatusHint
      ? `Publish Guard: ${voxyRenderPublishReadinessGuardStatusLabel(
          preview.publishReadinessGuardStatusHint,
        )}`
      : "Noch kein Publish-Guard-Status sichtbar.",
    preview.socialDistributionHandoffStatusHint
      ? `Social Distribution: ${voxyRenderSocialDistributionHandoffStatusLabel(
          preview.socialDistributionHandoffStatusHint,
        )}`
      : "Noch kein Social-Distribution-Status sichtbar.",
    preview.providerSelectionStatusHint
      ? `Provider Selection: ${voxyRenderProviderSelectionDraftStatusLabel(
          preview.providerSelectionStatusHint,
        )}`
      : "Noch kein Provider-Selection-Status sichtbar.",
    preview.queueStatusHint
      ? `Queue Contract: ${voxyRenderQueuePreviewStatusLabel(preview.queueStatusHint)}`
      : "Noch kein Queue-Status sichtbar.",
    preview.costCreditPolicyStatusHint
      ? `Cost/Credit: ${voxyRenderCostCreditPolicyStatusLabel(
          preview.costCreditPolicyStatusHint,
        )}`
      : "Noch kein Cost-/Credit-Status sichtbar.",
    preview.backlogStatusHint
      ? `Enablement Backlog: ${voxyRenderRuntimeEnablementBacklogStatusLabel(
          preview.backlogStatusHint,
        )}`
      : "Noch kein Enablement-Backlog-Status sichtbar.",
    preview.matrixStatusHint
      ? `Go/No-Go-Matrix: ${voxyRenderRuntimeGoNogoMatrixStatusLabel(preview.matrixStatusHint)}`
      : "Noch kein Go/No-Go-Status sichtbar.",
  ];
}

export function buildVoxyRenderRuntimeCutoverGatePanelModel(input: {
  latestRuntimeObservabilityRecord?: RuntimeObservabilityPreview | null;
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestQueueContract?: VoxyRenderQueuePreviewRecord | null;
  latestCostCreditPolicy?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderRuntimeCutoverGateRecord | null;
  storeState?: VoxyRenderRuntimeCutoverGatePersistenceState | null;
  runtimeObservabilityStoreState?: VoxyRenderRuntimeObservabilityPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
      latestRuntimeObservabilityRecord: input.latestRuntimeObservabilityRecord ?? null,
      latestSchedulingPolicyRecord: input.latestSchedulingPolicyRecord ?? null,
      latestUploadTargetPolicyRecord: input.latestUploadTargetPolicyRecord ?? null,
      latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
      latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
      latestSocialDistributionHandoffRecord:
        input.latestSocialDistributionHandoffRecord ?? null,
      latestPublishReadinessGuardRecord:
        input.latestPublishReadinessGuardRecord ?? null,
      latestProviderSelectionDraft: input.latestProviderSelectionDraft ?? null,
      latestQueueContract: input.latestQueueContract ?? null,
      latestCostCreditPolicy: input.latestCostCreditPolicy ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      previewFlow: input.previewFlow ?? null,
      gate: input.gate ?? null,
    });

  const storeState = input.storeState ?? buildDefaultStoreState();
  const active = input.latestRecord ?? preview;
  const observabilityStoreLabel =
    input.runtimeObservabilityStoreState?.label ?? "Kein Runtime-Observability-Store im Surface";

  return {
    title: "Runtime Cutover Gate",
    summary:
      "Dieser Layer beantwortet nur, welche Voraussetzungen vor einem späteren Runtime-Cutover noch fehlen. Runtime, Feature Flag, Provider, Queue, Worker, Upload, Scheduling und Publish bleiben ausgeschaltet.",
    preview,
    runtimeCutoverGateStatusLabel: voxyRenderRuntimeCutoverGateStatusLabel(
      active.runtimeCutoverGateStatus,
    ),
    nextStepLabel: voxyRenderRuntimeCutoverGateNextStepLabel(active.nextStep),
    storeStateLabel: storeState.label,
    storeStateSummary: `${storeState.summary} Upstream: ${observabilityStoreLabel}.`,
    latestRecord: input.latestRecord
      ? {
          runtimeCutoverGateId: input.latestRecord.runtimeCutoverGateId,
          runtimeCutoverGateStatusLabel: voxyRenderRuntimeCutoverGateStatusLabel(
            input.latestRecord.runtimeCutoverGateStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          runtimeCutoverGateVersion: input.latestRecord.runtimeCutoverGateVersion,
          runtimeObservabilityId: input.latestRecord.runtimeObservabilityId,
        }
      : null,
    commandPreview: {
      createdAt: preview.createdAt,
      runtimeObservabilityId: preview.runtimeObservabilityId,
      runtimeCutoverGateStatusLabel: voxyRenderRuntimeCutoverGateStatusLabel(
        preview.runtimeCutoverGateStatus,
      ),
      nextStepLabel: voxyRenderRuntimeCutoverGateNextStepLabel(preview.nextStep),
    },
    cutoverCandidateLines: [
      `${cutoverCandidateStatusLabel(preview.cutoverCandidate.status)} · ${preview.cutoverCandidate.userVisibleReason}`,
      `Runtime Candidate: ${preview.cutoverCandidate.runtimeCutoverCandidate ? "ja" : "nein"} · Feature Flag Candidate: ${preview.cutoverCandidate.featureFlagCandidate ? "ja" : "nein"}`,
      "runtimeEnabled bleibt false · featureFlagEnabled bleibt false",
    ],
    gateLines: preview.gates.map(
      (gateItem) =>
        `${gateItem.label} · ${cutoverGateItemStatusLabel(gateItem.status)} · ${gateItem.userVisibleReason}`,
    ),
    blockerLines: preview.topBlockers,
    nextActionLines: [
      voxyRenderRuntimeCutoverGateNextStepLabel(preview.nextStep),
      ...preview.gates
        .filter((gateItem) => gateItem.status !== "ready_candidate" && gateItem.status !== "not_applicable")
        .slice(0, 4)
        .map(
          (gateItem) =>
            `${gateItem.label}: ${voxyRenderRuntimeCutoverGateNextStepLabel(gateItem.nextAction)}`,
        ),
    ],
    semanticsLines: semanticsLines(preview.semantics),
    executionLines: executionLines(preview.executionFlags),
    auditLines: buildAuditLines(preview),
  } satisfies VoxyRenderRuntimeCutoverGatePanelModel;
}
