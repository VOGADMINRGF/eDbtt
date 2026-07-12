import type {
  VoxyBriefingScriptCandidateModel,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import type {
  VoxyRenderApprovalSemanticsCommand,
  VoxyRenderApprovalSemanticsRecord,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import type {
  VoxyRenderAssetPackDraftPreviewCommand,
  VoxyRenderAssetPackDraftPreviewRecord,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import type {
  VoxyRenderCostCreditPolicyPreviewCommand,
  VoxyRenderCostCreditPolicyPreviewRecord,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import type {
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import type {
  VoxyRenderPreviewOutcomeHandoffCommand,
  VoxyRenderPreviewOutcomeHandoffRecord,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import type {
  VoxyRenderPreviewReviewFlowCommand,
  VoxyRenderPreviewReviewFlowRecord,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
  VoxyRenderProviderSelectionDraftCommand,
  VoxyRenderProviderSelectionDraftRecord,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import type {
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type {
  VoxyRenderQueuePreviewCommand,
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import type {
  VoxyRenderRuntimeCutoverGateCommand,
  VoxyRenderRuntimeCutoverGatePersistenceState,
  VoxyRenderRuntimeCutoverGateRecord,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";
import type {
  VoxyRenderRuntimeObservabilityCommand,
  VoxyRenderRuntimeObservabilityRecord,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";
import type {
  VoxyRenderSchedulingPolicyCommand,
  VoxyRenderSchedulingPolicyRecord,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import type {
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import type {
  VoxyRenderUploadTargetPolicyCommand,
  VoxyRenderUploadTargetPolicyRecord,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STATUSES = [
  "review_first_architecture_complete",
  "runtime_pending",
  "runtime_blocked",
  "master_closure_only",
  "noop_master_closure",
  "blocked_by_missing_cutover_gate",
  "blocked_by_missing_observability",
  "blocked_by_missing_scheduling_policy",
  "blocked_by_missing_upload_policy",
  "blocked_by_missing_media_truth",
  "blocked_by_missing_approval_semantics",
  "blocked_by_missing_script_candidate",
  "keep_as_script_only",
] as const;

export type VoxyVideoBriefingFlowMasterClosureStatus =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STATUSES)[number];

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_KEYS = [
  "scriptReadiness",
  "sourceClaimReadiness",
  "assetReadiness",
  "providerReadiness",
  "queueReadiness",
  "costCreditReadiness",
  "approvalReadiness",
  "mediaStorageReadiness",
  "uploadReadiness",
  "schedulingReadiness",
  "observabilityReadiness",
  "cutoverReadiness",
  "publishReadiness",
  "distributionReadiness",
] as const;

export type VoxyVideoBriefingFlowMasterReadinessAreaKey =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_KEYS)[number];

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_STATUSES = [
  "review_first_ready",
  "runtime_pending",
  "blocked",
  "missing",
  "not_applicable",
] as const;

export type VoxyVideoBriefingFlowMasterReadinessAreaStatus =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_READINESS_AREA_STATUSES)[number];

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_NEXT_STEPS = [
  "decide_runtime_path",
  "configure_provider_runtime",
  "configure_queue_worker",
  "configure_storage_runtime",
  "configure_monitoring_runtime",
  "configure_cost_metering_runtime",
  "create_first_preview_runtime_plan",
  "keep_runtime_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyVideoBriefingFlowMasterNextStep =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_NEXT_STEPS)[number];

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STORE_RESULT_STATUSES = [
  "persisted",
  "noop",
  "blocked",
] as const;

export type VoxyVideoBriefingFlowMasterClosureStoreResultStatus =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_STORE_RESULT_STATUSES)[number];

export const VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyVideoBriefingFlowMasterClosurePersistenceMode =
  (typeof VOXY_VIDEO_BRIEFING_FLOW_MASTER_CLOSURE_PERSISTENCE_MODES)[number];

type MasterClosureRef = {
  id: string;
  title: string;
  href?: string | null;
};

type PreviewReviewFlowPreview =
  | VoxyRenderPreviewReviewFlowCommand
  | VoxyRenderPreviewReviewFlowRecord;
type PreviewOutcomePreview =
  | VoxyRenderPreviewOutcomeHandoffCommand
  | VoxyRenderPreviewOutcomeHandoffRecord;
type PublishReadinessPreview =
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord;
type SocialDistributionPreview =
  | VoxyRenderSocialDistributionHandoffCommand
  | VoxyRenderSocialDistributionHandoffRecord;
type ApprovalPreview =
  | VoxyRenderApprovalSemanticsCommand
  | VoxyRenderApprovalSemanticsRecord;
type MediaStorageTruthPreview =
  | VoxyRenderMediaStorageTruthCommand
  | VoxyRenderMediaStorageTruthRecord;
type UploadTargetPolicyPreview =
  | VoxyRenderUploadTargetPolicyCommand
  | VoxyRenderUploadTargetPolicyRecord;
type SchedulingPolicyPreview =
  | VoxyRenderSchedulingPolicyCommand
  | VoxyRenderSchedulingPolicyRecord;
type RuntimeObservabilityPreview =
  | VoxyRenderRuntimeObservabilityCommand
  | VoxyRenderRuntimeObservabilityRecord;
type RuntimeCutoverPreview =
  | VoxyRenderRuntimeCutoverGateCommand
  | VoxyRenderRuntimeCutoverGateRecord;
type AssetPackPreview =
  | VoxyRenderAssetPackDraftPreviewCommand
  | VoxyRenderAssetPackDraftPreviewRecord;
type ProviderSelectionPreview =
  | VoxyRenderProviderSelectionDraftCommand
  | VoxyRenderProviderSelectionDraftRecord;
type QueuePreview =
  | VoxyRenderQueuePreviewCommand
  | VoxyRenderQueuePreviewRecord;
type CostCreditPreview =
  | VoxyRenderCostCreditPolicyPreviewCommand
  | VoxyRenderCostCreditPolicyPreviewRecord;

export type VoxyVideoBriefingFlowMasterClosureReadinessArea = {
  areaKey: VoxyVideoBriefingFlowMasterReadinessAreaKey;
  label: string;
  status: VoxyVideoBriefingFlowMasterReadinessAreaStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyVideoBriefingFlowMasterNextStep;
  runtimeEnabled: false;
  executionAllowed: false;
};

export type VoxyVideoBriefingFlowMasterClosureSemantics = {
  reviewFirstArchitectureComplete: boolean;
  runtimePending: true;
  runtimeEnabled: false;
  previewRendered: false;
  mediaFileAvailable: false;
  uploaded: false;
  scheduled: false;
  socialPosted: false;
  published: false;
  autoPublishAllowed: false;
};

export type VoxyVideoBriefingFlowMasterClosureExecutionFlags = {
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

export type VoxyVideoBriefingFlowMasterClosureCommand = {
  masterClosureId: string | null;
  runtimeCutoverGateId: string | null;
  runtimeObservabilityId: string | null;
  schedulingPolicyId: string | null;
  uploadTargetPolicyId: string | null;
  mediaStorageTruthId: string | null;
  approvalSemanticsId: string | null;
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  previewOutcomeHandoffId: string | null;
  previewReviewFlowId: string | null;
  renderRequestDraftId: string | null;
  scriptCandidateId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  queueContractId: string | null;
  costCreditPolicyId: string | null;
  contributionRef: MasterClosureRef | null;
  dossierRef: MasterClosureRef | null;
  reviewerRef: MasterClosureRef | null;
  scriptRef: MasterClosureRef | null;
  createdAt: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  masterStatus: VoxyVideoBriefingFlowMasterClosureStatus;
  readinessAreas: VoxyVideoBriefingFlowMasterClosureReadinessArea[];
  semantics: VoxyVideoBriefingFlowMasterClosureSemantics;
  executionFlags: VoxyVideoBriefingFlowMasterClosureExecutionFlags;
  topBlockers: string[];
  runtimePendingRequirements: string[];
  nextStep: VoxyVideoBriefingFlowMasterNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
};

export type VoxyVideoBriefingFlowMasterClosureRecord =
  VoxyVideoBriefingFlowMasterClosureCommand & {
    masterClosureId: string;
    persistedAt: string;
    persistedBy: string | null;
    idempotencyKey: string;
    previousMasterClosureRef: string | null;
    supersedesMasterClosureRef: string | null;
    masterClosureVersion: number;
  };

export type VoxyVideoBriefingFlowMasterClosurePersistenceState = {
  mode: VoxyVideoBriefingFlowMasterClosurePersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyVideoBriefingFlowMasterClosureRepository";
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyVideoBriefingFlowMasterClosureStoreResult = {
  ok: boolean;
  status: VoxyVideoBriefingFlowMasterClosureStoreResultStatus;
  record: VoxyVideoBriefingFlowMasterClosureRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyVideoBriefingFlowMasterNextStep;
};

export type VoxyVideoBriefingFlowMasterClosurePanelModel = {
  title: string;
  summary: string;
  preview:
    | VoxyVideoBriefingFlowMasterClosureCommand
    | VoxyVideoBriefingFlowMasterClosureRecord;
  masterStatusLabel: string;
  nextStepLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    masterClosureId: string;
    masterStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    masterClosureVersion: number | null;
    runtimeCutoverGateId: string | null;
  } | null;
  commandPreview: {
    createdAt: string | null;
    runtimeCutoverGateId: string | null;
    masterStatusLabel: string;
    nextStepLabel: string;
  };
  overallStatusLines: string[];
  readinessAreaLines: string[];
  blockerLines: string[];
  requirementLines: string[];
  nextActionLines: string[];
  semanticsLines: string[];
  executionLines: string[];
  auditLines: string[];
};

export type BuildVoxyVideoBriefingFlowMasterClosureInput = {
  latestRuntimeCutoverGateRecord?: RuntimeCutoverPreview | null;
  latestRuntimeObservabilityRecord?: RuntimeObservabilityPreview | null;
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestPreviewOutcomeHandoffRecord?: PreviewOutcomePreview | null;
  latestPreviewReviewFlowRecord?: PreviewReviewFlowPreview | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestScriptCandidate?: VoxyBriefingScriptCandidateModel | null;
  latestProviderSelectionDraft?: ProviderSelectionPreview | null;
  latestAssetPackDraft?: AssetPackPreview | null;
  latestQueueContract?: QueuePreview | null;
  latestCostCreditPolicy?: CostCreditPreview | null;
  contributionRef?: MasterClosureRef | null;
  dossierRef?: MasterClosureRef | null;
  reviewerRef?: MasterClosureRef | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function pickFirstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeOptionalString(value);
    if (normalized) return normalized;
  }
  return null;
}

function pickFirstRef<T extends MasterClosureRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeOptionalString(value.id);
    const title = normalizeOptionalString(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: normalizeOptionalString(value.href),
    } satisfies MasterClosureRef;
  }
  return null;
}

function pickScriptRef(script: VoxyBriefingScriptCandidateModel | null | undefined) {
  return pickFirstRef(
    script?.contributionRef ?? null,
    script?.dossierRef ?? null,
    script?.outputRef ?? null,
  );
}

function isRtlLanguage(language: string | null | undefined) {
  return ["ar", "fa", "he", "ur"].includes(normalizeText(language).toLowerCase());
}

function deriveScriptCandidateId(script: VoxyBriefingScriptCandidateModel | null | undefined) {
  if (!script) return null;
  const ref =
    script.contributionRef?.id ??
    script.dossierRef?.id ??
    script.outputRef?.id ??
    script.participationRef?.id ??
    "missing-ref";
  return `voxy-briefing-script-candidate:${normalizeText(ref)}:${normalizeText(script.scriptStatus || "script_preview")}`
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .slice(0, 200);
}

function buildMasterClosureId(input: {
  runtimeCutoverGateId: string | null;
  previewReviewFlowId: string | null;
  scriptCandidateId: string | null;
}) {
  return [
    "voxy-video-briefing-flow-master-closure",
    input.runtimeCutoverGateId ?? "missing-runtime-cutover-gate",
    input.previewReviewFlowId ?? "missing-preview-review-flow",
    input.scriptCandidateId ?? "missing-script-candidate",
  ]
    .join(":")
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .slice(0, 200);
}

function buildDefaultStoreState(): VoxyVideoBriefingFlowMasterClosurePersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Master-Closure-Store im Surface",
    summary:
      "Diese Oberfläche zeigt nur die read-only Master-Closure-Lesart. Es wird keine Runtime aktiviert, kein Render gestartet und kein Provider aufgerufen.",
    repositoryInterface: "VoxyVideoBriefingFlowMasterClosureRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

function statusHasBlockingRuntimeSignal(value: unknown) {
  const normalized = normalizeText(value);
  return normalized.includes("blocked_by_") || normalized === "runtime_blocked";
}

function masterStatusLabel(value: VoxyVideoBriefingFlowMasterClosureStatus) {
  if (value === "review_first_architecture_complete") {
    return "Review-first Architektur geschlossen";
  }
  if (value === "runtime_pending") return "Runtime bleibt ausstehend";
  if (value === "runtime_blocked") return "Runtime bleibt blockiert";
  if (value === "master_closure_only") return "Nur Master-Closure";
  if (value === "noop_master_closure") return "Noop Master-Closure";
  if (value === "blocked_by_missing_cutover_gate") return "Cutover Gate fehlt";
  if (value === "blocked_by_missing_observability") return "Observability fehlt";
  if (value === "blocked_by_missing_scheduling_policy") return "Scheduling-Policy fehlt";
  if (value === "blocked_by_missing_upload_policy") return "Upload-Policy fehlt";
  if (value === "blocked_by_missing_media_truth") return "Media-Truth fehlt";
  if (value === "blocked_by_missing_approval_semantics") return "Approval-Semantik fehlt";
  if (value === "blocked_by_missing_script_candidate") return "Script-Kandidat fehlt";
  return "Als Script-only offen halten";
}

function readinessAreaStatusLabel(value: VoxyVideoBriefingFlowMasterReadinessAreaStatus) {
  if (value === "review_first_ready") return "Review-first bereit";
  if (value === "runtime_pending") return "Runtime ausstehend";
  if (value === "blocked") return "Blockiert";
  if (value === "missing") return "Fehlt";
  return "Nicht anwendbar";
}

function nextStepLabel(value: VoxyVideoBriefingFlowMasterNextStep) {
  if (value === "decide_runtime_path") return "Runtime-Pfad entscheiden";
  if (value === "configure_provider_runtime") return "Provider-Runtime konfigurieren";
  if (value === "configure_queue_worker") return "Queue-/Worker-Runtime konfigurieren";
  if (value === "configure_storage_runtime") return "Storage-/Upload-Runtime konfigurieren";
  if (value === "configure_monitoring_runtime") return "Monitoring-Runtime konfigurieren";
  if (value === "configure_cost_metering_runtime") return "Cost-/Metering-Runtime konfigurieren";
  if (value === "create_first_preview_runtime_plan") return "Ersten Preview-Runtime-Plan erstellen";
  if (value === "keep_runtime_blocked") return "Runtime blockiert halten";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blockiert";
}

function areaLabel(value: VoxyVideoBriefingFlowMasterReadinessAreaKey) {
  if (value === "scriptReadiness") return "Script";
  if (value === "sourceClaimReadiness") return "Quellen & Claims";
  if (value === "assetReadiness") return "Assets";
  if (value === "providerReadiness") return "Provider";
  if (value === "queueReadiness") return "Queue";
  if (value === "costCreditReadiness") return "Kosten & Credits";
  if (value === "approvalReadiness") return "Approval";
  if (value === "mediaStorageReadiness") return "Media & Storage";
  if (value === "uploadReadiness") return "Upload";
  if (value === "schedulingReadiness") return "Scheduling";
  if (value === "observabilityReadiness") return "Observability";
  if (value === "cutoverReadiness") return "Cutover Gate";
  if (value === "publishReadiness") return "Publish Readiness";
  return "Distribution";
}

function buildExecutionFlags(): VoxyVideoBriefingFlowMasterClosureExecutionFlags {
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

function buildReadinessArea(input: {
  areaKey: VoxyVideoBriefingFlowMasterReadinessAreaKey;
  status: VoxyVideoBriefingFlowMasterReadinessAreaStatus;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextAction: VoxyVideoBriefingFlowMasterNextStep;
}) {
  return {
    areaKey: input.areaKey,
    label: areaLabel(input.areaKey),
    status: input.status,
    reviewerVisibleReason: input.reviewerVisibleReason,
    userVisibleReason: input.userVisibleReason,
    nextAction: input.nextAction,
    runtimeEnabled: false,
    executionAllowed: false,
  } satisfies VoxyVideoBriefingFlowMasterClosureReadinessArea;
}

function buildAreaStatusPresentReviewFirst(
  areaKey: VoxyVideoBriefingFlowMasterReadinessAreaKey,
  present: boolean,
  missingReason: string,
  readyReason: string,
  missingNextAction: VoxyVideoBriefingFlowMasterNextStep,
) {
  return present
    ? buildReadinessArea({
        areaKey,
        status: "review_first_ready",
        userVisibleReason: readyReason,
        reviewerVisibleReason: readyReason,
        nextAction: "keep_runtime_blocked",
      })
    : buildReadinessArea({
        areaKey,
        status: "missing",
        userVisibleReason: missingReason,
        reviewerVisibleReason: missingReason,
        nextAction: missingNextAction,
      });
}

function buildAreaStatusPresentRuntimePending(
  areaKey: VoxyVideoBriefingFlowMasterReadinessAreaKey,
  present: boolean,
  missingReason: string,
  readyReason: string,
  missingNextAction: VoxyVideoBriefingFlowMasterNextStep,
  readyNextAction: VoxyVideoBriefingFlowMasterNextStep,
) {
  return present
    ? buildReadinessArea({
        areaKey,
        status: "runtime_pending",
        userVisibleReason: readyReason,
        reviewerVisibleReason: readyReason,
        nextAction: readyNextAction,
      })
    : buildReadinessArea({
        areaKey,
        status: "missing",
        userVisibleReason: missingReason,
        reviewerVisibleReason: missingReason,
        nextAction: missingNextAction,
      });
}

function buildAreaStatusBlocked(
  areaKey: VoxyVideoBriefingFlowMasterReadinessAreaKey,
  reason: string,
  nextAction: VoxyVideoBriefingFlowMasterNextStep,
) {
  return buildReadinessArea({
    areaKey,
    status: "blocked",
    userVisibleReason: reason,
    reviewerVisibleReason: reason,
    nextAction,
  });
}

function semanticsLines(value: VoxyVideoBriefingFlowMasterClosureSemantics) {
  return [
    value.reviewFirstArchitectureComplete
      ? "Die Review-first Architektur kann als geschlossen markiert werden."
      : "Die Review-first Architektur ist noch nicht vollständig geschlossen.",
    "Die Runtime bleibt weiterhin ausstehend.",
    "Die Runtime bleibt deaktiviert.",
    "Es gibt kein gerendertes Preview.",
    "Es gibt keine verfügbare Mediendatei.",
    "Es gibt keinen Upload-Status.",
    "Es gibt keinen Scheduling-Status.",
    "Es gibt kein Social Posting.",
    "Es gibt keine Veröffentlichung.",
    "Automatisches Publish bleibt deaktiviert.",
  ];
}

function executionLines(value: VoxyVideoBriefingFlowMasterClosureExecutionFlags) {
  return [
    value.runtimeExecutionAllowed ? "Runtime wäre erlaubt" : "Runtime noch nicht aktiviert",
    value.providerExecutionAllowed ? "Provider dürfte laufen" : "Kein Providerlauf",
    value.uploadAllowed ? "Upload wäre erlaubt" : "Kein Upload",
    value.schedulingAllowed ? "Scheduling wäre erlaubt" : "Kein Scheduling",
    value.publishAllowed ? "Publish wäre erlaubt" : "Kein Publish",
    value.socialPostAllowed ? "Social Posting wäre erlaubt" : "Kein Social Posting",
    value.costDebitAllowed ? "Kosten dürften gebucht werden" : "Keine Kostenbuchung",
  ];
}

function summaryForStatus(status: VoxyVideoBriefingFlowMasterClosureStatus) {
  if (status === "review_first_architecture_complete") {
    return {
      userVisible:
        "Die Review-first Architektur ist geschlossen. Runtime, Render, Upload, Scheduling und Publish bleiben trotzdem deaktiviert.",
      reviewerVisible:
        "Die Voxy-Briefing-Kette ist als Master-Closure vollständig dokumentiert, bleibt aber weiterhin nur als ausstehender Runtime-Pfad markiert.",
    };
  }
  if (status === "runtime_pending") {
    return {
      userVisible:
        "Die Review-first Kette ist weitgehend vorbereitet, aber die echte Runtime bleibt noch ausstehend.",
      reviewerVisible:
        "Die Kette ist zusammengeführt, aber mindestens ein Runtime-Vorbereitungsbaustein fehlt noch für einen vollständigen Architekturabschluss.",
    };
  }
  if (status === "runtime_blocked") {
    return {
      userVisible:
        "Die Runtime bleibt blockiert. Es gibt bewusst keinen Render, keinen Upload und keine Veröffentlichung.",
      reviewerVisible:
        "Mindestens ein bestehender Upstream-Slice meldet weiterhin eine blockierte Runtime-Wahrheit oder Provider-Abhängigkeit.",
    };
  }
  if (status === "blocked_by_missing_cutover_gate") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil noch kein letzter Runtime-Cutover-Gate-Stand vorliegt.",
      reviewerVisible:
        "Ohne Runtime Cutover Gate fehlt der abschließende Noop-Layer vor jeder späteren Aktivierung.",
    };
  }
  if (status === "blocked_by_missing_observability") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil noch keine ehrliche Runtime-Observability-Lesart vorliegt.",
      reviewerVisible:
        "Observability fehlt als verpflichtender Vorbaustein vor dem Cutover.",
    };
  }
  if (status === "blocked_by_missing_scheduling_policy") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil noch keine Scheduling-Policy dokumentiert ist.",
      reviewerVisible:
        "Scheduling bleibt ein Pflichtbaustein vor Observability und Cutover.",
    };
  }
  if (status === "blocked_by_missing_upload_policy") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil noch keine Upload-Target-Policy vorliegt.",
      reviewerVisible:
        "Upload-Ziel, Access und Retention müssen vor Scheduling und Cutover belegt sein.",
    };
  }
  if (status === "blocked_by_missing_media_truth") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil Media- und Storage-Wahrheit noch fehlt.",
      reviewerVisible:
        "Ohne Media-/Storage-Truth fehlt der ehrliche Runtime-Bezug für Upload, Scheduling und Cutover.",
    };
  }
  if (status === "blocked_by_missing_approval_semantics") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil Approval-Semantik und Review-Freigaben noch nicht vollständig vorliegen.",
      reviewerVisible:
        "Approval bleibt ein Pflichtbaustein vor Media-/Upload-/Scheduling-Layern.",
    };
  }
  if (status === "blocked_by_missing_script_candidate") {
    return {
      userVisible:
        "Der Gesamtfluss bleibt blockiert, weil noch kein belastbarer Script-Kandidat vorliegt.",
      reviewerVisible:
        "Ohne Script-Kandidat gibt es keine saubere Master-Closure-Basis für den Video-Briefing-Pfad.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      userVisible:
        "Dieser Pfad bleibt bewusst Script-only. Es wird kein Video, kein Upload und keine Runtime behauptet.",
      reviewerVisible:
        "Mindestens ein Upstream-Slice verlangt explizit, den Pfad als Script-only zu halten.",
    };
  }
  if (status === "master_closure_only") {
    return {
      userVisible:
        "Es gibt bisher nur einen additiven Master-Closure-Rahmen. Die eigentlichen Review-first Bausteine sind noch nicht vollständig verdrahtet.",
      reviewerVisible:
        "Nur der Closure-Rahmen ist vorhanden; die Kette ist noch nicht ausreichend belegt.",
    };
  }
  return {
    userVisible:
      "Die Master-Closure liegt nur als Noop-Rahmen vor. Runtime und Render bleiben vollständig ausgeschaltet.",
    reviewerVisible:
      "Es ist bewusst nur ein noop_master_closure dokumentiert; keine Runtime-Aussage wird daraus abgeleitet.",
  };
}

function determineNextStep(status: VoxyVideoBriefingFlowMasterClosureStatus) {
  if (status === "review_first_architecture_complete") return "decide_runtime_path";
  if (status === "blocked_by_missing_observability") return "configure_monitoring_runtime";
  if (status === "blocked_by_missing_scheduling_policy") return "create_first_preview_runtime_plan";
  if (status === "blocked_by_missing_upload_policy") return "configure_storage_runtime";
  if (status === "blocked_by_missing_media_truth") return "configure_storage_runtime";
  if (status === "runtime_pending") return "create_first_preview_runtime_plan";
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (status === "blocked_by_missing_script_candidate") return "keep_as_script_only";
  if (status === "runtime_blocked") return "keep_runtime_blocked";
  if (status === "blocked_by_missing_approval_semantics") return "keep_runtime_blocked";
  if (status === "blocked_by_missing_cutover_gate") return "decide_runtime_path";
  return "blocked";
}

function pickPreviewReviewFlowCreatedAt(previewReviewFlow: PreviewReviewFlowPreview | null) {
  if (!previewReviewFlow) return null;
  return "createdAt" in previewReviewFlow ? previewReviewFlow.createdAt : previewReviewFlow.persistedAt;
}

export function voxyVideoBriefingFlowMasterClosureStatusLabel(
  value: VoxyVideoBriefingFlowMasterClosureStatus,
) {
  return masterStatusLabel(value);
}

export function voxyVideoBriefingFlowMasterClosureNextStepLabel(
  value: VoxyVideoBriefingFlowMasterNextStep,
) {
  return nextStepLabel(value);
}

export function buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels(
  input: BuildVoxyVideoBriefingFlowMasterClosureInput,
) {
  const scriptCandidate = input.latestScriptCandidate ?? null;
  const previewReviewFlow = input.latestPreviewReviewFlowRecord ?? null;
  const previewOutcome = input.latestPreviewOutcomeHandoffRecord ?? null;
  const publishReadiness = input.latestPublishReadinessGuardRecord ?? null;
  const socialDistribution = input.latestSocialDistributionHandoffRecord ?? null;
  const approval = input.latestApprovalSemanticsRecord ?? null;
  const mediaStorageTruth = input.latestMediaStorageTruthRecord ?? null;
  const uploadTargetPolicy = input.latestUploadTargetPolicyRecord ?? null;
  const schedulingPolicy = input.latestSchedulingPolicyRecord ?? null;
  const runtimeObservability = input.latestRuntimeObservabilityRecord ?? null;
  const runtimeCutoverGate = input.latestRuntimeCutoverGateRecord ?? null;
  const requestDraft = input.latestRequestDraft ?? null;
  const providerSelection = input.latestProviderSelectionDraft ?? null;
  const assetPackDraft = input.latestAssetPackDraft ?? null;
  const queueContract = input.latestQueueContract ?? null;
  const costCreditPolicy = input.latestCostCreditPolicy ?? null;

  const scriptCandidateId = deriveScriptCandidateId(scriptCandidate);
  const scriptRef = pickScriptRef(scriptCandidate);
  const contributionRef = pickFirstRef(
    input.contributionRef ?? null,
    scriptCandidate?.contributionRef ?? null,
    scriptRef,
  );
  const dossierRef = pickFirstRef(
    input.dossierRef ?? null,
    scriptCandidate?.dossierRef ?? null,
    previewOutcome?.dossierRef ?? null,
  );
  const reviewerRef = pickFirstRef(input.reviewerRef ?? null);

  const runtimeCutoverGateId = normalizeOptionalString(runtimeCutoverGate?.runtimeCutoverGateId);
  const runtimeObservabilityId = normalizeOptionalString(
    runtimeObservability?.runtimeObservabilityId,
  );
  const schedulingPolicyId = normalizeOptionalString(schedulingPolicy?.schedulingPolicyId);
  const uploadTargetPolicyId = normalizeOptionalString(
    uploadTargetPolicy?.uploadTargetPolicyId,
  );
  const mediaStorageTruthId = normalizeOptionalString(
    mediaStorageTruth?.mediaStorageTruthId,
  );
  const approvalSemanticsId = normalizeOptionalString(approval?.approvalSemanticsId);
  const socialDistributionHandoffId = normalizeOptionalString(
    socialDistribution?.socialDistributionHandoffId,
  );
  const publishReadinessGuardId = normalizeOptionalString(
    publishReadiness?.publishReadinessGuardId,
  );
  const previewOutcomeHandoffId = normalizeOptionalString(
    previewOutcome?.outcomeHandoffId,
  );
  const previewReviewFlowId = normalizeOptionalString(
    previewReviewFlow?.previewReviewFlowId,
  );
  const renderRequestDraftId = normalizeOptionalString(requestDraft?.requestDraftId);
  const providerSelectionDraftId = normalizeOptionalString(
    providerSelection?.providerSelectionDraftId,
  );
  const assetPackDraftId = normalizeOptionalString(assetPackDraft?.assetPackDraftId);
  const queueContractId = normalizeOptionalString(
    queueContract?.queuePreviewId,
  );
  const costCreditPolicyId = normalizeOptionalString(
    costCreditPolicy?.policyPreviewId,
  );

  const hasScript = Boolean(scriptCandidateId);
  const hasPreviewReviewFlow = Boolean(previewReviewFlowId);
  const hasPreviewOutcome = Boolean(previewOutcomeHandoffId);
  const hasPublishReadiness = Boolean(publishReadinessGuardId);
  const hasSocialDistribution = Boolean(socialDistributionHandoffId);
  const hasApproval = Boolean(approvalSemanticsId);
  const hasMediaTruth = Boolean(mediaStorageTruthId);
  const hasUploadPolicy = Boolean(uploadTargetPolicyId);
  const hasSchedulingPolicy = Boolean(schedulingPolicyId);
  const hasObservability = Boolean(runtimeObservabilityId);
  const hasCutoverGate = Boolean(runtimeCutoverGateId);
  const hasRequestDraft = Boolean(renderRequestDraftId);
  const hasProviderSelection = Boolean(providerSelectionDraftId);
  const hasAssetPack = Boolean(assetPackDraftId);
  const hasQueueContract = Boolean(queueContractId);
  const hasCostCreditPolicy = Boolean(costCreditPolicyId);

  const completeReviewFirstArchitecture =
    hasScript &&
    hasPreviewReviewFlow &&
    hasPreviewOutcome &&
    hasPublishReadiness &&
    hasSocialDistribution &&
    hasApproval &&
    hasMediaTruth &&
    hasUploadPolicy &&
    hasSchedulingPolicy &&
    hasObservability &&
    hasCutoverGate &&
    hasRequestDraft &&
    hasProviderSelection &&
    hasAssetPack &&
    hasQueueContract &&
    hasCostCreditPolicy;

  const anyRelevantSignal = [
    hasScript,
    hasPreviewReviewFlow,
    hasPreviewOutcome,
    hasPublishReadiness,
    hasSocialDistribution,
    hasApproval,
    hasMediaTruth,
    hasUploadPolicy,
    hasSchedulingPolicy,
    hasObservability,
    hasCutoverGate,
    hasRequestDraft,
    hasProviderSelection,
    hasAssetPack,
    hasQueueContract,
    hasCostCreditPolicy,
  ].some(Boolean);

  const runtimeBlocked =
    statusHasBlockingRuntimeSignal(scriptCandidate?.scriptStatus) ||
    statusHasBlockingRuntimeSignal(previewReviewFlow?.previewStatus) ||
    statusHasBlockingRuntimeSignal(previewOutcome?.handoffStatus) ||
    statusHasBlockingRuntimeSignal(publishReadiness?.guardStatus) ||
    statusHasBlockingRuntimeSignal(socialDistribution?.handoffStatus) ||
    statusHasBlockingRuntimeSignal(approval?.approvalStatus) ||
    statusHasBlockingRuntimeSignal(mediaStorageTruth?.mediaStorageTruthStatus) ||
    statusHasBlockingRuntimeSignal(uploadTargetPolicy?.uploadTargetPolicyStatus) ||
    statusHasBlockingRuntimeSignal(schedulingPolicy?.schedulingPolicyStatus) ||
    statusHasBlockingRuntimeSignal(runtimeObservability?.runtimeObservabilityStatus) ||
    statusHasBlockingRuntimeSignal(runtimeCutoverGate?.runtimeCutoverGateStatus);

  const keepAsScriptOnly =
    normalizeText(runtimeCutoverGate?.runtimeCutoverGateStatus) === "keep_as_script_only" ||
    normalizeText(runtimeObservability?.runtimeObservabilityStatus) === "keep_as_script_only" ||
    normalizeText(schedulingPolicy?.schedulingPolicyStatus) === "keep_as_script_only";

  const masterStatus: VoxyVideoBriefingFlowMasterClosureStatus = keepAsScriptOnly
    ? "keep_as_script_only"
    : completeReviewFirstArchitecture
      ? "review_first_architecture_complete"
      : runtimeBlocked
        ? "runtime_blocked"
        : !hasScript && anyRelevantSignal
          ? "blocked_by_missing_script_candidate"
          : hasScript && !hasApproval
            ? "blocked_by_missing_approval_semantics"
            : hasScript && hasApproval && !hasMediaTruth
              ? "blocked_by_missing_media_truth"
              : hasScript && hasApproval && hasMediaTruth && !hasUploadPolicy
                ? "blocked_by_missing_upload_policy"
                : hasScript && hasApproval && hasMediaTruth && hasUploadPolicy && !hasSchedulingPolicy
                  ? "blocked_by_missing_scheduling_policy"
                  : hasScript &&
                      hasApproval &&
                      hasMediaTruth &&
                      hasUploadPolicy &&
                      hasSchedulingPolicy &&
                      !hasObservability
                    ? "blocked_by_missing_observability"
                    : hasScript &&
                        hasApproval &&
                        hasMediaTruth &&
                        hasUploadPolicy &&
                        hasSchedulingPolicy &&
                        hasObservability &&
                        !hasCutoverGate
                      ? "blocked_by_missing_cutover_gate"
                      : anyRelevantSignal
                        ? "runtime_pending"
                        : contributionRef || dossierRef
                          ? "master_closure_only"
                          : "noop_master_closure";

  const nextStep = determineNextStep(masterStatus);
  const summary = summaryForStatus(masterStatus);

  const readinessAreas = [
    buildAreaStatusPresentReviewFirst(
      "scriptReadiness",
      hasScript,
      "Noch kein Script-Kandidat sichtbar.",
      "Der Script-Kandidat ist als review-first Vorschau vorhanden.",
      "keep_as_script_only",
    ),
    buildAreaStatusPresentReviewFirst(
      "sourceClaimReadiness",
      hasScript,
      "Quellen- und Claim-Lesart fehlt noch.",
      "Originalsprache bleibt erhalten und Übersetzung bleibt reine Lesefassung.",
      "blocked",
    ),
    buildAreaStatusPresentRuntimePending(
      "assetReadiness",
      hasAssetPack,
      "Noch kein Asset-Pack-Entwurf sichtbar.",
      "Assets sind nur als review-first Draft sichtbar, nicht als renderbare Runtime.",
      "create_first_preview_runtime_plan",
      "configure_provider_runtime",
    ),
    buildAreaStatusPresentRuntimePending(
      "providerReadiness",
      hasProviderSelection,
      "Noch keine Provider-Auswahl sichtbar.",
      "Provider-Readiness bleibt dokumentiert, aber nicht aktiviert.",
      "decide_runtime_path",
      "configure_provider_runtime",
    ),
    buildAreaStatusPresentRuntimePending(
      "queueReadiness",
      hasQueueContract,
      "Noch kein Queue-Vertrag sichtbar.",
      "Queue und Worker bleiben nur als Noop-Vertrag dokumentiert.",
      "create_first_preview_runtime_plan",
      "configure_queue_worker",
    ),
    buildAreaStatusPresentRuntimePending(
      "costCreditReadiness",
      hasCostCreditPolicy,
      "Noch keine Cost-/Credit-Policy sichtbar.",
      "Kosten und Credits sind nur als Policy-Lesart vorhanden, nicht als Buchungsruntime.",
      "create_first_preview_runtime_plan",
      "configure_cost_metering_runtime",
    ),
    hasScript && !hasApproval
      ? buildAreaStatusBlocked(
          "approvalReadiness",
          "Approval-Semantik fehlt noch als expliziter Review- und Freigabebaustein.",
          "keep_runtime_blocked",
        )
      : buildAreaStatusPresentReviewFirst(
          "approvalReadiness",
          hasApproval,
          "Noch keine Approval-Semantik sichtbar.",
          "Approval-Semantik ist review-first dokumentiert und bleibt nicht-ausführend.",
          "keep_runtime_blocked",
        ),
    hasApproval && !hasMediaTruth
      ? buildAreaStatusBlocked(
          "mediaStorageReadiness",
          "Media- und Storage-Wahrheit fehlt noch für den Gesamtfluss.",
          "configure_storage_runtime",
        )
      : buildAreaStatusPresentRuntimePending(
          "mediaStorageReadiness",
          hasMediaTruth,
          "Noch keine Media-/Storage-Truth sichtbar.",
          "Media & Storage bleiben dokumentiert, aber ohne Datei, Upload oder Storage-Write.",
          "configure_storage_runtime",
          "configure_storage_runtime",
        ),
    hasMediaTruth && !hasUploadPolicy
      ? buildAreaStatusBlocked(
          "uploadReadiness",
          "Upload-Policy fehlt noch als explizite Runtime-Vorbedingung.",
          "configure_storage_runtime",
        )
      : buildAreaStatusPresentRuntimePending(
          "uploadReadiness",
          hasUploadPolicy,
          "Noch keine Upload-Target-Policy sichtbar.",
          "Upload bleibt als Policy-Lesart vorhanden, aber nicht erlaubt.",
          "configure_storage_runtime",
          "configure_storage_runtime",
        ),
    hasUploadPolicy && !hasSchedulingPolicy
      ? buildAreaStatusBlocked(
          "schedulingReadiness",
          "Scheduling-Policy fehlt noch für den Gesamtfluss.",
          "create_first_preview_runtime_plan",
        )
      : buildAreaStatusPresentRuntimePending(
          "schedulingReadiness",
          hasSchedulingPolicy,
          "Noch keine Scheduling-Policy sichtbar.",
          "Scheduling bleibt dokumentiert, aber ohne Job, Kalender oder Publish-Zeit.",
          "create_first_preview_runtime_plan",
          "create_first_preview_runtime_plan",
        ),
    hasSchedulingPolicy && !hasObservability
      ? buildAreaStatusBlocked(
          "observabilityReadiness",
          "Runtime-Observability fehlt noch vor jedem späteren Cutover.",
          "configure_monitoring_runtime",
        )
      : buildAreaStatusPresentRuntimePending(
          "observabilityReadiness",
          hasObservability,
          "Noch keine Runtime-Observability sichtbar.",
          "Observability bleibt als Audit-/Metric-/Alert-Plan vorhanden, nicht als laufende Runtime.",
          "configure_monitoring_runtime",
          "configure_monitoring_runtime",
        ),
    hasObservability && !hasCutoverGate
      ? buildAreaStatusBlocked(
          "cutoverReadiness",
          "Der letzte Runtime-Cutover-Gate-Baustein fehlt noch.",
          "decide_runtime_path",
        )
      : buildAreaStatusPresentRuntimePending(
          "cutoverReadiness",
          hasCutoverGate,
          "Noch kein Runtime Cutover Gate sichtbar.",
          "Der Cutover bleibt nur als letzter read-only Noop vor jeder späteren Aktivierung vorhanden.",
          "decide_runtime_path",
          "decide_runtime_path",
        ),
    buildAreaStatusPresentReviewFirst(
      "publishReadiness",
      hasPublishReadiness,
      "Noch kein Publish-Readiness-Guard sichtbar.",
      "Publish bleibt review-first vorbereitet und weiterhin ungleich veröffentlicht.",
      "keep_runtime_blocked",
    ),
    buildAreaStatusPresentReviewFirst(
      "distributionReadiness",
      hasSocialDistribution,
      "Noch kein Distribution-Handoff sichtbar.",
      "Distribution bleibt als Handoff vorbereitet und weiterhin ungepostet.",
      "keep_runtime_blocked",
    ),
  ];

  const topBlockers = readinessAreas
    .filter((area) => area.status === "blocked" || area.status === "missing")
    .slice(0, 5)
    .map((area) => `${area.label}: ${area.userVisibleReason}`);

  if (topBlockers.length === 0) {
    topBlockers.push(
      "Runtime noch nicht aktiviert: review-first Architektur ist geschlossen, aber jede Runtime bleibt absichtlich ausgeschaltet.",
    );
  }

  const runtimePendingRequirements = [
    ...readinessAreas
      .filter(
        (area) =>
          area.status === "runtime_pending" ||
          area.status === "blocked" ||
          area.status === "missing",
      )
      .map((area) => `${area.label}: ${nextStepLabel(area.nextAction)}`),
    "Keine Videodatei erzeugen",
    "Keinen Upload starten",
    "Kein Scheduling starten",
    "Keinen Publish auslösen",
  ].slice(0, 8);

  return {
    masterClosureId:
      buildMasterClosureId({
        runtimeCutoverGateId,
        previewReviewFlowId,
        scriptCandidateId,
      }) ?? null,
    runtimeCutoverGateId,
    runtimeObservabilityId,
    schedulingPolicyId,
    uploadTargetPolicyId,
    mediaStorageTruthId,
    approvalSemanticsId,
    socialDistributionHandoffId,
    publishReadinessGuardId,
    previewOutcomeHandoffId,
    previewReviewFlowId,
    renderRequestDraftId,
    scriptCandidateId,
    providerSelectionDraftId,
    assetPackDraftId,
    queueContractId,
    costCreditPolicyId,
    contributionRef,
    dossierRef,
    reviewerRef,
    scriptRef,
    createdAt: pickFirstString(
      runtimeCutoverGate?.createdAt,
      runtimeObservability?.createdAt,
      schedulingPolicy?.createdAt,
      uploadTargetPolicy?.createdAt,
      mediaStorageTruth?.createdAt,
      approval?.createdAt,
      pickPreviewReviewFlowCreatedAt(previewReviewFlow),
    ),
    sourceLanguage:
      pickFirstString(
        scriptCandidate?.sourceLanguage,
        runtimeCutoverGate?.sourceLanguage,
        runtimeObservability?.sourceLanguage,
        previewReviewFlow?.sourceLanguage,
      ) ?? "de",
    readingLanguage:
      pickFirstString(
        scriptCandidate?.readingLanguage,
        runtimeCutoverGate?.readingLanguage,
        runtimeObservability?.readingLanguage,
        previewReviewFlow?.readingLanguage,
      ) ?? "de",
    scriptLanguage:
      pickFirstString(
        scriptCandidate?.scriptLanguage,
        runtimeCutoverGate?.scriptLanguage,
        previewReviewFlow?.scriptLanguage,
      ) ?? "de",
    renderLanguage:
      pickFirstString(
        runtimeCutoverGate?.renderLanguage,
        runtimeObservability?.renderLanguage,
        schedulingPolicy?.renderLanguage,
        scriptCandidate?.scriptLanguage,
      ) ?? "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      scriptCandidate?.rtlDisplayHint ??
      runtimeCutoverGate?.rtlRequired ??
      runtimeObservability?.rtlRequired ??
      isRtlLanguage(scriptCandidate?.readingLanguage ?? runtimeCutoverGate?.readingLanguage),
    masterStatus,
    readinessAreas,
    semantics: {
      reviewFirstArchitectureComplete: completeReviewFirstArchitecture,
      runtimePending: true,
      runtimeEnabled: false,
      previewRendered: false,
      mediaFileAvailable: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      published: false,
      autoPublishAllowed: false,
    },
    executionFlags: buildExecutionFlags(),
    topBlockers,
    runtimePendingRequirements,
    nextStep,
    userVisibleSummary: summary.userVisible,
    reviewerVisibleSummary: summary.reviewerVisible,
  } satisfies VoxyVideoBriefingFlowMasterClosureCommand;
}

function buildAuditLines(
  preview:
    | VoxyVideoBriefingFlowMasterClosureCommand
    | VoxyVideoBriefingFlowMasterClosureRecord,
) {
  return [
    preview.scriptCandidateId
      ? `Script-Kandidat: ${preview.scriptCandidateId}`
      : "Noch kein Script-Kandidat referenziert.",
    preview.previewReviewFlowId
      ? `Preview Review: ${preview.previewReviewFlowId}`
      : "Noch kein Preview-Review-Flow referenziert.",
    preview.runtimeCutoverGateId
      ? `Runtime Cutover Gate: ${preview.runtimeCutoverGateId}`
      : "Noch kein Runtime-Cutover-Gate referenziert.",
    `Sprache: ${preview.sourceLanguage} → ${preview.readingLanguage} → ${preview.scriptLanguage}`,
    preview.originalPreserved
      ? "Originalsprache bleibt erhalten."
      : "Originalsprache wäre nicht korrekt markiert.",
    preview.translationIsEvidence
      ? "Übersetzung wäre fälschlich als Beleg markiert."
      : "Übersetzung bleibt Lesefassung und kein Beleg.",
  ];
}

export function buildVoxyVideoBriefingFlowMasterClosurePanelModel(input: {
  latestRuntimeCutoverGateRecord?: RuntimeCutoverPreview | null;
  latestRuntimeObservabilityRecord?: RuntimeObservabilityPreview | null;
  latestSchedulingPolicyRecord?: SchedulingPolicyPreview | null;
  latestUploadTargetPolicyRecord?: UploadTargetPolicyPreview | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestPreviewOutcomeHandoffRecord?: PreviewOutcomePreview | null;
  latestPreviewReviewFlowRecord?: PreviewReviewFlowPreview | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestScriptCandidate?: VoxyBriefingScriptCandidateModel | null;
  latestProviderSelectionDraft?: ProviderSelectionPreview | null;
  latestAssetPackDraft?: AssetPackPreview | null;
  latestQueueContract?: QueuePreview | null;
  latestCostCreditPolicy?: CostCreditPreview | null;
  contributionRef?: MasterClosureRef | null;
  dossierRef?: MasterClosureRef | null;
  reviewerRef?: MasterClosureRef | null;
  latestRecord?: VoxyVideoBriefingFlowMasterClosureRecord | null;
  storeState?: VoxyVideoBriefingFlowMasterClosurePersistenceState | null;
  runtimeCutoverGateStoreState?: VoxyRenderRuntimeCutoverGatePersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      latestRuntimeCutoverGateRecord: input.latestRuntimeCutoverGateRecord ?? null,
      latestRuntimeObservabilityRecord: input.latestRuntimeObservabilityRecord ?? null,
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
      latestPreviewReviewFlowRecord: input.latestPreviewReviewFlowRecord ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      latestScriptCandidate: input.latestScriptCandidate ?? null,
      latestProviderSelectionDraft: input.latestProviderSelectionDraft ?? null,
      latestAssetPackDraft: input.latestAssetPackDraft ?? null,
      latestQueueContract: input.latestQueueContract ?? null,
      latestCostCreditPolicy: input.latestCostCreditPolicy ?? null,
      contributionRef: input.contributionRef ?? null,
      dossierRef: input.dossierRef ?? null,
      reviewerRef: input.reviewerRef ?? null,
    });

  const storeState = input.storeState ?? buildDefaultStoreState();
  const active = input.latestRecord ?? preview;
  const upstreamStoreLabel =
    input.runtimeCutoverGateStoreState?.label ?? "Kein Runtime-Cutover-Gate-Store im Surface";

  return {
    title: "Voxy Video Briefing Flow",
    summary:
      "Dieser Master-Closure-Layer führt die Voxy-Briefing-Kette review-first zusammen. Er schließt keine Runtime auf, erzeugt kein Video und löst weder Upload, Scheduling noch Publish aus.",
    preview,
    masterStatusLabel: masterStatusLabel(active.masterStatus),
    nextStepLabel: nextStepLabel(active.nextStep),
    storeStateLabel: storeState.label,
    storeStateSummary: `${storeState.summary} Upstream: ${upstreamStoreLabel}.`,
    latestRecord: input.latestRecord
      ? {
          masterClosureId: input.latestRecord.masterClosureId,
          masterStatusLabel: masterStatusLabel(input.latestRecord.masterStatus),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          masterClosureVersion: input.latestRecord.masterClosureVersion,
          runtimeCutoverGateId: input.latestRecord.runtimeCutoverGateId,
        }
      : null,
    commandPreview: {
      createdAt: preview.createdAt,
      runtimeCutoverGateId: preview.runtimeCutoverGateId,
      masterStatusLabel: masterStatusLabel(preview.masterStatus),
      nextStepLabel: nextStepLabel(preview.nextStep),
    },
    overallStatusLines: [
      masterStatusLabel(preview.masterStatus),
      preview.userVisibleSummary,
      preview.reviewerVisibleSummary,
    ],
    readinessAreaLines: preview.readinessAreas.map(
      (area) =>
        `${area.label} · ${readinessAreaStatusLabel(area.status)} · ${area.userVisibleReason}`,
    ),
    blockerLines: preview.topBlockers,
    requirementLines: preview.runtimePendingRequirements,
    nextActionLines: [
      nextStepLabel(preview.nextStep),
      ...preview.readinessAreas
        .filter((area) => area.status !== "review_first_ready" && area.status !== "not_applicable")
        .slice(0, 5)
        .map((area) => `${area.label}: ${nextStepLabel(area.nextAction)}`),
    ],
    semanticsLines: semanticsLines(preview.semantics),
    executionLines: executionLines(preview.executionFlags),
    auditLines: buildAuditLines(preview),
  } satisfies VoxyVideoBriefingFlowMasterClosurePanelModel;
}
