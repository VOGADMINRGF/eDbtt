import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderAdapterNoopModel,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import type {
  VoxyRenderAssetPackDraftPreviewRecord,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import {
  buildVoxyRenderAssetPackDraftPreviewFromCreateCandidatePreview,
  buildVoxyRenderAssetPackDraftPreviewFromReviewContext,
  buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import type {
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderCostCreditPolicyPreviewRecord,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
  buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import type {
  VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import type {
  VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import type {
  VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import type {
  VoxyRenderProviderSelectionDraftRecord,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import {
  buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview,
  buildVoxyRenderProviderSelectionDraftFromReviewContext,
  buildVoxyRenderProviderSelectionDraftFromVoxyDialog,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import type {
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
} from "@/features/create/voxyRenderRequestDraftContract";
import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderRuntimeEnablementBacklogPersistenceState,
  VoxyRenderRuntimeEnablementBacklogRecord,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview,
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type {
  VoxyRenderRuntimeGoNogoMatrixRecord,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview,
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES = [
  "preview_review_flow_only",
  "noop_preview_review",
  "no_preview_available",
  "needs_render_runtime",
  "needs_preview_asset",
  "needs_human_review",
  "needs_revision",
  "blocked_by_missing_backlog",
  "blocked_by_missing_matrix",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderPreviewReviewFlowStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_FLOW_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_CANDIDATE_STATUSES = [
  "no_media",
  "requirement_only",
  "missing",
  "blocked",
] as const;

export type VoxyRenderPreviewCandidateStatus =
  (typeof VOXY_RENDER_PREVIEW_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_ACTION_KEYS = [
  "comment_only",
  "request_revision",
  "reject_preview",
  "mark_review_ready",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewActionKey =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_ACTION_KEYS)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS = [
  "script_accuracy",
  "source_caption_accuracy",
  "claim_safety",
  "language_quality",
  "subtitle_readability",
  "rtl_layout",
  "brand_fit",
  "voxy_presence",
  "audio_voice_fit",
  "legal_safety",
  "publication_safety",
  "accessibility",
] as const;

export type VoxyRenderPreviewReviewCheckKey =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_CHECK_STATUSES = [
  "unchecked",
  "needs_review",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderPreviewReviewCheckStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_CHECK_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_OVERALL_DECISIONS = [
  "no_preview_available",
  "review_flow_ready_only",
  "revision_needed",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewOverallDecision =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_OVERALL_DECISIONS)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_NEXT_ACTIONS = [
  "wait_for_preview_runtime",
  "review_script_before_render",
  "prepare_preview_review_checklist",
  "request_revision_without_render",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewNextAction =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_NEXT_ACTIONS)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewStoreResultStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderPreviewReviewPersistenceMode =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_PERSISTENCE_MODES)[number];

type PreviewReviewSurface = "create" | "account" | "admin" | "workspace";

type PreviewReviewRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderPreviewCandidate = {
  previewCandidateId: string | null;
  status: VoxyRenderPreviewCandidateStatus;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  generated: false;
  rendered: false;
  uploaded: false;
  playable: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderPreviewReviewAction = {
  actionKey: VoxyRenderPreviewReviewActionKey;
  allowed: boolean;
  executionAllowed: false;
  createsRenderJob: false;
  triggersProvider: false;
  triggersPublish: false;
  userVisibleLabel: string;
  reviewerVisibleReason: string;
};

export type VoxyRenderPreviewReviewChecklistItem = {
  checkKey: VoxyRenderPreviewReviewCheckKey;
  status: VoxyRenderPreviewReviewCheckStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderPreviewReviewExecutionFlags = {
  previewRendered: false;
  renderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  previewFileAvailable: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPreviewReviewFlowRecord = {
  previewReviewFlowId: string;
  enablementBacklogId: string | null;
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  scriptRef: PreviewReviewRef | null;
  contributionRef: PreviewReviewRef | null;
  dossierRef: PreviewReviewRef | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  surface: PreviewReviewSurface;
  previewStatus: VoxyRenderPreviewReviewFlowStatus;
  previewCandidate: VoxyRenderPreviewCandidate;
  reviewActions: VoxyRenderPreviewReviewAction[];
  reviewChecklist: VoxyRenderPreviewReviewChecklistItem[];
  overallDecision: VoxyRenderPreviewReviewOverallDecision;
  topBlockers: string[];
  nextRecommendedAction: VoxyRenderPreviewReviewNextAction;
  reviewerVisibleSummary: string;
  userVisibleSummary: string;
  nextStep: string;
  execution: VoxyRenderPreviewReviewExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousPreviewReviewFlowRef: string | null;
  supersedesPreviewReviewFlowRef: string | null;
  previewReviewVersion: number | null;
};

export type VoxyRenderPreviewReviewFlowCommand = Omit<
  VoxyRenderPreviewReviewFlowRecord,
  | "persistedAt"
  | "persistedBy"
  | "idempotencyKey"
  | "previousPreviewReviewFlowRef"
  | "supersedesPreviewReviewFlowRef"
  | "previewReviewVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderPreviewReviewFlowStoreResult = {
  ok: boolean;
  status: VoxyRenderPreviewReviewStoreResultStatus;
  record: VoxyRenderPreviewReviewFlowRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderPreviewReviewFlowPersistenceState = {
  mode: VoxyRenderPreviewReviewPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderPreviewReviewFlowRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderPreviewReviewFlowPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderPreviewReviewFlowRecord;
  previewStatusLabel: string;
  overallDecisionLabel: string;
  nextRecommendedActionLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    previewReviewFlowId: string;
    statusLabel: string;
    overallDecisionLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    previewReviewVersion: number | null;
    enablementBacklogId: string | null;
  } | null;
  candidateStatusLabel: string;
  actionRows: Array<VoxyRenderPreviewReviewAction & { actionLabel: string }>;
  checklistRows: Array<VoxyRenderPreviewReviewChecklistItem & { checkLabel: string; statusLabel: string }>;
  topBlockers: string[];
  auditLines: string[];
  nextStep: string;
};

type BuildPreviewReviewInput = {
  surface: PreviewReviewSurface;
  backlog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  providerSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  assetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  handoffModel?: VoxyRenderProviderHandoffModel | null;
  preflightModel?: VoxyRenderPreflightReadinessModel | null;
  registryModel?: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel?: VoxyRenderAdapterNoopModel | null;
  persistedAt?: string | null;
  persistedBy?: string | null;
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

function languageName(language: string) {
  if (language === "de") return "Deutsch";
  if (language === "en") return "Englisch";
  if (language === "fr") return "Französisch";
  if (language === "tr") return "Türkisch";
  if (language === "ar") return "Arabisch";
  if (language === "fa") return "Persisch";
  if (language === "he") return "Hebräisch";
  if (language === "ur") return "Urdu";
  return language || "Unklar";
}

function previewStatusLabel(value: VoxyRenderPreviewReviewFlowStatus) {
  if (value === "preview_review_flow_only") return "Preview-Review-Flow vorbereitet";
  if (value === "noop_preview_review") return "Noop-Preview-Review";
  if (value === "no_preview_available") return "Noch kein Preview verfügbar";
  if (value === "needs_render_runtime") return "Render-Runtime fehlt";
  if (value === "needs_preview_asset") return "Preview-Asset fehlt";
  if (value === "needs_human_review") return "Menschliches Review nötig";
  if (value === "needs_revision") return "Revision angefragt";
  if (value === "blocked_by_missing_backlog") return "Ohne Backlog blockiert";
  if (value === "blocked_by_missing_matrix") return "Ohne Matrix blockiert";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

function candidateStatusLabel(value: VoxyRenderPreviewCandidateStatus) {
  if (value === "requirement_only") return "Nur Requirement, keine Datei";
  if (value === "missing") return "Fehlender Preview-Kandidat";
  if (value === "blocked") return "Preview-Kandidat blockiert";
  return "Keine Medien-Datei";
}

function actionLabel(value: VoxyRenderPreviewReviewActionKey) {
  if (value === "comment_only") return "Kommentar dokumentieren";
  if (value === "request_revision") return "Revision anfragen";
  if (value === "reject_preview") return "Preview ablehnen";
  if (value === "mark_review_ready") return "Als review-ready markieren";
  if (value === "keep_as_script_only") return "Bewusst Script-only lassen";
  return "Blockiert";
}

function checkLabel(value: VoxyRenderPreviewReviewCheckKey) {
  if (value === "script_accuracy") return "Script-Genauigkeit";
  if (value === "source_caption_accuracy") return "Quellen- und Caption-Treue";
  if (value === "claim_safety") return "Claim-Sicherheit";
  if (value === "language_quality") return "Sprachqualität";
  if (value === "subtitle_readability") return "Untertitel-Lesbarkeit";
  if (value === "rtl_layout") return "RTL-Layout";
  if (value === "brand_fit") return "Brand-Fit";
  if (value === "voxy_presence") return "Voxy-Präsenz";
  if (value === "audio_voice_fit") return "Audio- und Voice-Fit";
  if (value === "legal_safety") return "Rechtliche Sicherheit";
  if (value === "publication_safety") return "Publikationssicherheit";
  return "Barrierefreiheit";
}

function checklistStatusLabel(value: VoxyRenderPreviewReviewCheckStatus) {
  if (value === "needs_review") return "Review nötig";
  if (value === "blocked") return "Blockiert";
  if (value === "not_applicable") return "Nicht anwendbar";
  return "Noch ungeprüft";
}

function overallDecisionLabel(value: VoxyRenderPreviewReviewOverallDecision) {
  if (value === "review_flow_ready_only") return "Flow ist vorbereitet, Preview fehlt";
  if (value === "revision_needed") return "Revision ohne Render angefragt";
  if (value === "keep_as_script_only") return "Bewusst Script-only";
  if (value === "blocked") return "Der Flow bleibt blockiert";
  return "Noch kein Preview verfügbar";
}

function nextActionLabel(value: VoxyRenderPreviewReviewNextAction) {
  if (value === "wait_for_preview_runtime") return "Auf Preview-Runtime warten";
  if (value === "review_script_before_render") return "Script vor Render prüfen";
  if (value === "prepare_preview_review_checklist") return "Preview-Checklist vorbereiten";
  if (value === "request_revision_without_render") return "Revision ohne Render dokumentieren";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blocker klären";
}

function buildExecutionFlags(): VoxyRenderPreviewReviewExecutionFlags {
  return {
    previewRendered: false,
    renderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function pickFirstRef(
  ...values: Array<PreviewReviewRef | null | undefined>
): PreviewReviewRef | null {
  return values.find((value) => Boolean(value?.id && value?.title)) ?? null;
}

function buildFlowId(input: {
  decisionGateId: string | null;
  decisionId: string | null;
  contributionRef: PreviewReviewRef | null;
  scriptRef: PreviewReviewRef | null;
  status: VoxyRenderPreviewReviewFlowStatus;
}) {
  const seed =
    input.decisionGateId ??
    input.decisionId ??
    input.contributionRef?.id ??
    input.scriptRef?.id ??
    "preview-review";
  return `voxy-render-preview-review-flow:${sanitizeIdFragment(`${seed}-${input.status}`).slice(0, 48)}`;
}

function derivePreviewStatus(input: {
  backlog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
}) {
  if (!input.backlog) return "blocked_by_missing_backlog" as const;
  if (!input.matrix) return "blocked_by_missing_matrix" as const;

  const keepAsScriptOnly =
    input.backlog.backlogStatus === "keep_as_script_only" ||
    input.matrix.matrixStatus === "keep_as_script_only" ||
    input.providerSelectionDraft?.providerSelectionStatus === "keep_as_script_only" ||
    input.assetPackDraft?.assetPackStatus === "keep_as_script_only" ||
    input.latestDecisionRecord?.selectedDecision === "keep_as_script_only" ||
    input.gate?.decisionStatus === "keep_as_script_only";
  if (keepAsScriptOnly) return "keep_as_script_only" as const;

  if (input.matrix.runtimeGate.status === "no_go") {
    return "needs_render_runtime" as const;
  }

  if (
    input.backlog.backlogStatus === "blocked_by_runtime_truth" ||
    input.matrix.overallDecision === "runtime_not_available"
  ) {
    return "blocked_by_runtime_truth" as const;
  }

  if (
    input.assetPackDraft?.assetPackStatus === "blocked_by_missing_required_assets" ||
    input.assetPackDraft?.assetPackStatus === "needs_asset_review"
  ) {
    return "needs_preview_asset" as const;
  }

  if (
    input.gate?.decisionStatus === "needs_script_review" ||
    input.gate?.decisionStatus === "needs_source_review" ||
    input.gate?.decisionStatus === "needs_factcheck_review" ||
    input.gate?.decisionStatus === "needs_language_review"
  ) {
    return "preview_review_flow_only" as const;
  }

  return "no_preview_available" as const;
}

function buildPreviewCandidate(
  status: VoxyRenderPreviewReviewFlowStatus,
): VoxyRenderPreviewCandidate {
  if (status === "blocked_by_missing_backlog" || status === "blocked_by_missing_matrix") {
    return {
      previewCandidateId: null,
      status: "blocked",
      mediaUrl: null,
      thumbnailUrl: null,
      durationSeconds: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      reviewerVisibleReason:
        "Ohne Backlog oder Matrix darf kein Preview-Kandidat behauptet oder vorbereitet werden.",
      userVisibleReason:
        "Noch kein belastbarer Preview-Kandidat vorhanden, weil Planungsgrundlagen fehlen.",
    };
  }

  if (status === "needs_render_runtime" || status === "blocked_by_runtime_truth") {
    return {
      previewCandidateId: null,
      status: "blocked",
      mediaUrl: null,
      thumbnailUrl: null,
      durationSeconds: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      reviewerVisibleReason:
        "Die spätere Preview-Prüfung bleibt blockiert, solange Runtime, Queue und Provider nicht freigegeben sind.",
      userVisibleReason:
        "Noch kein Preview-Video, weil Render-Runtime und belastbare Preview-Wahrheit fehlen.",
    };
  }

  if (status === "needs_preview_asset") {
    return {
      previewCandidateId: null,
      status: "missing",
      mediaUrl: null,
      thumbnailUrl: null,
      durationSeconds: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      reviewerVisibleReason:
        "Es gibt noch keinen belastbaren Preview-Kandidaten, weil Asset- und Review-Vorbereitung unvollständig ist.",
      userVisibleReason:
        "Noch keine Medien-Datei und noch kein belastbarer Preview-Kandidat vorhanden.",
    };
  }

  if (status === "preview_review_flow_only" || status === "noop_preview_review") {
    return {
      previewCandidateId: null,
      status: "requirement_only",
      mediaUrl: null,
      thumbnailUrl: null,
      durationSeconds: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      reviewerVisibleReason:
        "Der Slice beschreibt nur den späteren Review-Ablauf. Es existiert noch kein gerendertes Preview.",
      userVisibleReason:
        "Noch kein Preview-Video vorhanden. Dieser Flow sammelt nur spätere Review-Schritte.",
    };
  }

  return {
    previewCandidateId: null,
    status: "no_media",
    mediaUrl: null,
    thumbnailUrl: null,
    durationSeconds: null,
    generated: false,
    rendered: false,
    uploaded: false,
    playable: false,
    reviewerVisibleReason:
      "Es gibt bewusst keine Preview-Datei, keine Thumbnail-URL und keine Laufzeitangabe in diesem Noop-Slice.",
    userVisibleReason:
      "Noch kein Preview-Video und keine Medien-Datei vorhanden. Der Review-Flow bleibt rein vorbereitend.",
  };
}

function buildAction(
  key: VoxyRenderPreviewReviewActionKey,
  allowed: boolean,
  reviewerVisibleReason: string,
): VoxyRenderPreviewReviewAction {
  return {
    actionKey: key,
    allowed,
    executionAllowed: false,
    createsRenderJob: false,
    triggersProvider: false,
    triggersPublish: false,
    userVisibleLabel: actionLabel(key),
    reviewerVisibleReason,
  };
}

function buildReviewActions(status: VoxyRenderPreviewReviewFlowStatus) {
  if (status === "keep_as_script_only") {
    return [
      buildAction("comment_only", true, "Kommentare bleiben erlaubt und lösen nichts aus."),
      buildAction(
        "request_revision",
        true,
        "Revision kann als Review-Notiz dokumentiert werden, ohne Render oder Provider zu starten.",
      ),
      buildAction(
        "reject_preview",
        false,
        "Ohne Preview-Datei wird keine Ablehnung einer Medien-Datei behauptet.",
      ),
      buildAction(
        "mark_review_ready",
        false,
        "Review-ready ist ohne Preview-Datei nicht gleichbedeutend mit Approval oder Publish.",
      ),
      buildAction(
        "keep_as_script_only",
        true,
        "Die Entscheidung bleibt bewusst auf Script-only begrenzt.",
      ),
      buildAction("blocked", false, "Der Flow bleibt lesbar, ist hier aber nicht zusätzlich blockiert."),
    ];
  }

  if (status === "blocked_by_missing_backlog" || status === "blocked_by_missing_matrix") {
    return [
      buildAction("comment_only", true, "Kommentare können den fehlenden Planungsstand dokumentieren."),
      buildAction(
        "request_revision",
        false,
        "Ohne Backlog oder Matrix sollte keine scheinbar belastbare Preview-Revision dokumentiert werden.",
      ),
      buildAction("reject_preview", false, "Es gibt kein Preview, das abgelehnt werden könnte."),
      buildAction("mark_review_ready", false, "Ohne Planungsgrundlagen bleibt review-ready gesperrt."),
      buildAction("keep_as_script_only", false, "Script-only braucht zuerst einen dokumentierten Gate-Stand."),
      buildAction("blocked", true, "Der Flow bleibt bis zur fehlenden Grundlage blockiert."),
    ];
  }

  if (status === "needs_render_runtime" || status === "blocked_by_runtime_truth") {
    return [
      buildAction("comment_only", true, "Kommentare dokumentieren Runtime-Blocker, ohne Nebenwirkungen."),
      buildAction(
        "request_revision",
        true,
        "Revisionen können auf Script-, Caption- oder Safety-Ebene dokumentiert werden.",
      ),
      buildAction("reject_preview", false, "Ohne Preview-Datei gibt es keine Medien-Ablehnung."),
      buildAction(
        "mark_review_ready",
        false,
        "Review-ready bleibt gesperrt, solange keine belastbare Preview-Wahrheit existiert.",
      ),
      buildAction(
        "keep_as_script_only",
        true,
        "Script-only kann als bewusste Zwischenentscheidung markiert werden.",
      ),
      buildAction("blocked", true, "Runtime und Preview-Datei fehlen weiterhin."),
    ];
  }

  return [
    buildAction("comment_only", true, "Kommentare bleiben rein auditierbare Review-Notizen."),
    buildAction(
      "request_revision",
      true,
      "Revisionen bleiben Review-Signale und erzeugen keinen Renderjob.",
    ),
    buildAction(
      "reject_preview",
      true,
      "Die Ablehnung bleibt ein Review-Signal, nicht ein Publish- oder Runtime-Ereignis.",
    ),
    buildAction(
      "mark_review_ready",
      true,
      "Review-ready markiert nur den Flow-Zustand und ist weder Approval noch Veröffentlichung.",
    ),
    buildAction(
      "keep_as_script_only",
      true,
      "Das Team kann bewusst beim Script-only-Zustand bleiben.",
    ),
    buildAction("blocked", false, "Im aktuellen Stand ist kein zusätzlicher Flow-Blocker gesetzt."),
  ];
}

function buildChecklistItem(
  key: VoxyRenderPreviewReviewCheckKey,
  status: VoxyRenderPreviewReviewCheckStatus,
  reviewerVisibleReason: string,
  userVisibleReason: string,
): VoxyRenderPreviewReviewChecklistItem {
  return {
    checkKey: key,
    status,
    reviewerVisibleReason,
    userVisibleReason,
  };
}

function buildChecklist(input: {
  previewStatus: VoxyRenderPreviewReviewFlowStatus;
  subtitleLanguage: string | null;
  rtlRequired: boolean;
}) {
  const blockedEverywhere =
    input.previewStatus === "blocked_by_missing_backlog" ||
    input.previewStatus === "blocked_by_missing_matrix";
  const blockedByRuntime =
    input.previewStatus === "needs_render_runtime" ||
    input.previewStatus === "blocked_by_runtime_truth";
  const scriptOnly = input.previewStatus === "keep_as_script_only";

  return VOXY_RENDER_PREVIEW_REVIEW_CHECK_KEYS.map((key) => {
    if (blockedEverywhere) {
      return buildChecklistItem(
        key,
        "blocked",
        "Ohne Backlog oder Matrix bleibt auch die spätere Preview-Checklist blockiert.",
        "Die Checklist kann erst mit dokumentierten Planungsgrundlagen belastbar geprüft werden.",
      );
    }

    if (key === "audio_voice_fit") {
      return buildChecklistItem(
        key,
        blockedByRuntime || scriptOnly ? "blocked" : "blocked",
        "Ohne gerendertes Preview und ohne Voice-Ausgabe gibt es keine Audio-Prüfung.",
        "Noch kein Audio vorhanden. Deshalb kann Audio- und Voice-Fit noch nicht geprüft werden.",
      );
    }

    if (key === "rtl_layout") {
      if (!input.rtlRequired) {
        return buildChecklistItem(
          key,
          "not_applicable",
          "Kein RTL-Pflichtfall sichtbar.",
          "Kein RTL-Layout erforderlich.",
        );
      }
      return buildChecklistItem(
        key,
        blockedByRuntime ? "blocked" : "needs_review",
        blockedByRuntime
          ? "RTL bleibt blockiert, solange keine belastbare Preview-Datei existiert."
          : "RTL-Layout soll bei einer späteren Preview explizit geprüft werden.",
        blockedByRuntime
          ? "RTL kann noch nicht geprüft werden, weil kein Preview vorliegt."
          : "RTL-Layout bleibt als eigener Review-Punkt sichtbar.",
      );
    }

    if (key === "subtitle_readability" && !input.subtitleLanguage) {
      return buildChecklistItem(
        key,
        blockedByRuntime ? "blocked" : "needs_review",
        blockedByRuntime
          ? "Ohne Untertitelquelle und ohne Preview bleibt die Lesbarkeit blockiert."
          : "Untertitel müssen später bewusst als Lesehilfe geprüft werden.",
        blockedByRuntime
          ? "Untertitel-Lesbarkeit kann noch nicht geprüft werden."
          : "Untertitel-Lesbarkeit bleibt als zukünftiger Review-Punkt sichtbar.",
      );
    }

    return buildChecklistItem(
      key,
      blockedByRuntime ? "needs_review" : "needs_review",
      blockedByRuntime
        ? "Die fachliche Prüfung kann vorbereitet werden, auch wenn noch kein Preview gerendert wird."
        : "Dieser Review-Punkt bleibt als spätere Preview-Checkliste sichtbar.",
      blockedByRuntime
        ? "Der Punkt kann schon fachlich vorbereitet werden, obwohl noch kein Preview vorliegt."
        : "Der Punkt bleibt für eine spätere Preview-Prüfung sichtbar.",
    );
  });
}

function deriveOverallDecision(status: VoxyRenderPreviewReviewFlowStatus) {
  if (status === "blocked_by_missing_backlog" || status === "blocked_by_missing_matrix") {
    return "blocked" as const;
  }
  if (status === "needs_render_runtime" || status === "blocked_by_runtime_truth") {
    return "blocked" as const;
  }
  if (status === "needs_revision") return "revision_needed" as const;
  if (status === "keep_as_script_only") return "keep_as_script_only" as const;
  if (status === "preview_review_flow_only" || status === "noop_preview_review") {
    return "review_flow_ready_only" as const;
  }
  return "no_preview_available" as const;
}

function deriveNextRecommendedAction(input: {
  status: VoxyRenderPreviewReviewFlowStatus;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
}) {
  if (
    input.status === "blocked_by_missing_backlog" ||
    input.status === "blocked_by_missing_matrix" ||
    input.status === "blocked_by_runtime_truth"
  ) {
    return "blocked" as const;
  }
  if (input.status === "needs_render_runtime") return "wait_for_preview_runtime" as const;
  if (input.status === "needs_revision") return "request_revision_without_render" as const;
  if (input.status === "keep_as_script_only") return "keep_as_script_only" as const;
  if (
    input.latestDecisionRecord?.selectedDecision === "review_script" ||
    input.gate?.decisionStatus === "needs_script_review"
  ) {
    return "review_script_before_render" as const;
  }
  return "prepare_preview_review_checklist" as const;
}

function buildBlockers(input: {
  status: VoxyRenderPreviewReviewFlowStatus;
  backlog: VoxyRenderRuntimeEnablementBacklogRecord | null;
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null;
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
}) {
  const blockers: string[] = [];
  if (!input.backlog) blockers.push("Der Runtime-Enablement-Backlog fehlt noch.");
  if (!input.matrix) blockers.push("Die Runtime-Go/No-Go-Matrix fehlt noch.");
  if (input.status === "needs_render_runtime") {
    blockers.push(
      input.matrix?.runtimeGate.reviewerVisibleReason ??
        "Ohne spätere Render-Runtime gibt es noch kein Preview-Video.",
    );
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.push("Es gibt noch keine belastbare Preview-, Runtime- oder Medien-Wahrheit.");
  }
  if (input.status === "needs_preview_asset") {
    blockers.push(
      input.assetPackDraft?.reviewerVisibleReason ??
        "Asset- und Template-Vorbereitung reicht noch nicht für eine spätere Preview-Prüfung.",
    );
  }
  if (input.providerSelectionDraft?.providerSelectionStatus === "blocked_by_runtime_truth") {
    blockers.push("Provider-Auswahl bleibt solange hypothetisch, bis Runtime freigegeben ist.");
  }
  blockers.push("Noch kein Preview-Video.");
  blockers.push("Keine Medien-Datei.");
  blockers.push("Keine Veröffentlichung.");
  return uniqueStrings(blockers);
}

function buildSummary(input: {
  status: VoxyRenderPreviewReviewFlowStatus;
  nextAction: VoxyRenderPreviewReviewNextAction;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  rtlRequired: boolean;
}) {
  const languageSummary = [
    `Quelle: ${languageName(input.sourceLanguage)}`,
    `Lesefassung: ${languageName(input.readingLanguage)}`,
    `Script: ${languageName(input.scriptLanguage)}`,
    `Render-Ziel: ${languageName(input.renderLanguage)}`,
    input.subtitleLanguage ? `Untertitel: ${languageName(input.subtitleLanguage)}` : null,
    input.rtlRequired ? "RTL bleibt sichtbar." : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const base =
    input.status === "keep_as_script_only"
      ? "Der Flow dokumentiert nur, wie ein späteres Preview geprüft würde, bleibt aber bewusst beim Script-only-Pfad."
      : "Der Flow zeigt nur den späteren Review-Ablauf für ein mögliches Preview. Es gibt noch kein gerendertes Preview, keine Datei und keine Runtime-Aktion.";

  return {
    reviewerVisibleSummary: `${base} ${languageSummary} Nächste Flow-Aktion: ${nextActionLabel(input.nextAction)}.`,
    userVisibleSummary: `${base} ${input.subtitleLanguage ? "Untertitel bleiben Lesehilfe." : "Untertitel sind noch offen."}`,
  };
}

export function buildVoxyRenderPreviewReviewFlowFromReadmodels(
  input: BuildPreviewReviewInput,
): VoxyRenderPreviewReviewFlowRecord {
  const backlog = input.backlog ?? null;
  const matrix = input.matrix ?? null;
  const providerSelectionDraft = input.providerSelectionDraft ?? null;
  const assetPackDraft = input.assetPackDraft ?? null;
  const costPolicyPreview = input.costPolicyPreview ?? null;
  const queuePreview = input.queuePreview ?? null;
  const requestDraft = input.requestDraft ?? null;
  const latestDecisionRecord = input.latestDecisionRecord ?? null;
  const gate = input.gate ?? null;

  const previewStatus = derivePreviewStatus({
    backlog,
    matrix,
    providerSelectionDraft,
    assetPackDraft,
    latestDecisionRecord,
    gate,
  });
  const previewCandidate = buildPreviewCandidate(previewStatus);
  const reviewActions = buildReviewActions(previewStatus);
  const reviewChecklist = buildChecklist({
    previewStatus,
    subtitleLanguage:
      backlog?.subtitleLanguage ??
      matrix?.subtitleLanguage ??
      requestDraft?.subtitleLanguage ??
      gate?.subtitleLanguage ??
      null,
    rtlRequired:
      backlog?.rtlRequired ??
      matrix?.rtlRequired ??
      requestDraft?.rtlRequired ??
      false,
  });
  const nextRecommendedAction = deriveNextRecommendedAction({
    status: previewStatus,
    latestDecisionRecord,
    gate,
  });
  const overallDecision = deriveOverallDecision(previewStatus);
  const topBlockers = buildBlockers({
    status: previewStatus,
    backlog,
    matrix,
    assetPackDraft,
    providerSelectionDraft,
  });

  const scriptRef = pickFirstRef(
    backlog?.scriptRef,
    matrix?.scriptRef,
    providerSelectionDraft?.scriptRef,
    assetPackDraft?.scriptRef,
    costPolicyPreview?.scriptRef,
    requestDraft?.scriptRef,
    latestDecisionRecord?.scriptRef,
    gate?.scriptRef,
  );
  const contributionRef = pickFirstRef(
    backlog?.contributionRef,
    matrix?.contributionRef,
    providerSelectionDraft?.contributionRef,
    assetPackDraft?.contributionRef,
    costPolicyPreview?.contributionRef,
    requestDraft?.contributionRef,
    latestDecisionRecord?.contributionRef,
    gate?.contributionRef,
  );
  const dossierRef = pickFirstRef(
    backlog?.dossierRef,
    matrix?.dossierRef,
    providerSelectionDraft?.dossierRef,
    assetPackDraft?.dossierRef,
    costPolicyPreview?.dossierRef,
    requestDraft?.dossierRef,
    latestDecisionRecord?.dossierRef,
    gate?.dossierRef,
  );

  const sourceLanguage =
    backlog?.sourceLanguage ??
    matrix?.sourceLanguage ??
    providerSelectionDraft?.sourceLanguage ??
    assetPackDraft?.sourceLanguage ??
    costPolicyPreview?.sourceLanguage ??
    queuePreview?.sourceLanguage ??
    requestDraft?.sourceLanguage ??
    latestDecisionRecord?.sourceLanguage ??
    gate?.sourceLanguage ??
    "de";
  const readingLanguage =
    backlog?.readingLanguage ??
    matrix?.readingLanguage ??
    providerSelectionDraft?.readingLanguage ??
    assetPackDraft?.readingLanguage ??
    costPolicyPreview?.readingLanguage ??
    queuePreview?.readingLanguage ??
    requestDraft?.readingLanguage ??
    latestDecisionRecord?.readingLanguage ??
    gate?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    backlog?.scriptLanguage ??
    matrix?.scriptLanguage ??
    providerSelectionDraft?.scriptLanguage ??
    assetPackDraft?.scriptLanguage ??
    costPolicyPreview?.scriptLanguage ??
    queuePreview?.scriptLanguage ??
    requestDraft?.scriptLanguage ??
    latestDecisionRecord?.scriptLanguage ??
    gate?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    backlog?.renderLanguage ??
    matrix?.renderLanguage ??
    providerSelectionDraft?.renderLanguage ??
    assetPackDraft?.renderLanguage ??
    costPolicyPreview?.renderLanguage ??
    queuePreview?.renderLanguage ??
    requestDraft?.renderLanguage ??
    latestDecisionRecord?.renderLanguage ??
    gate?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    backlog?.subtitleLanguage ??
    matrix?.subtitleLanguage ??
    providerSelectionDraft?.subtitleLanguage ??
    assetPackDraft?.subtitleLanguage ??
    costPolicyPreview?.subtitleLanguage ??
    queuePreview?.subtitleLanguage ??
    requestDraft?.subtitleLanguage ??
    latestDecisionRecord?.subtitleLanguage ??
    gate?.subtitleLanguage ??
    null;
  const gateRtlRequired = gate?.rtlDecisionHint != null;
  const rtlRequired =
    backlog?.rtlRequired ??
    matrix?.rtlRequired ??
    providerSelectionDraft?.rtlRequired ??
    assetPackDraft?.rtlRequired ??
    costPolicyPreview?.rtlRequired ??
    queuePreview?.rtlRequired ??
    requestDraft?.rtlRequired ??
    gateRtlRequired;

  const summary = buildSummary({
    status: previewStatus,
    nextAction: nextRecommendedAction,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    rtlRequired,
  });

  const nextStep =
    previewStatus === "blocked_by_missing_backlog"
      ? "Zuerst den Runtime-Enablement-Backlog dokumentieren."
      : previewStatus === "blocked_by_missing_matrix"
      ? "Zuerst die Runtime-Go/No-Go-Matrix dokumentieren."
      : previewStatus === "needs_render_runtime"
        ? "Runtime-, Queue- und Provider-Grenzen klären, bevor irgendein Preview behauptet wird."
        : previewStatus === "keep_as_script_only"
          ? "Script-only explizit festhalten und keinen Preview-Pfad behaupten."
          : nextRecommendedAction === "review_script_before_render"
            ? "Script, Claims und Quellen-Captions vor jedem späteren Render kritisch prüfen."
            : "Preview-Checklist und Guardrails vorbereiten, ohne eine Datei zu erzeugen.";

  return {
    previewReviewFlowId: buildFlowId({
      decisionGateId:
        backlog?.decisionGateId ??
        matrix?.decisionGateId ??
        providerSelectionDraft?.decisionGateId ??
        assetPackDraft?.decisionGateId ??
        costPolicyPreview?.decisionGateId ??
        queuePreview?.decisionGateId ??
        requestDraft?.decisionGateId ??
        latestDecisionRecord?.decisionGateId ??
        gate?.decisionGateId ??
        null,
      decisionId:
        backlog?.decisionId ??
        matrix?.decisionId ??
        providerSelectionDraft?.decisionId ??
        assetPackDraft?.decisionId ??
        costPolicyPreview?.decisionId ??
        queuePreview?.decisionId ??
        requestDraft?.decisionId ??
        latestDecisionRecord?.decisionId ??
        null,
      contributionRef,
      scriptRef,
      status: previewStatus,
    }),
    enablementBacklogId: backlog?.backlogId ?? null,
    matrixId: matrix?.matrixId ?? null,
    providerSelectionDraftId: providerSelectionDraft?.providerSelectionDraftId ?? null,
    assetPackDraftId: assetPackDraft?.assetPackDraftId ?? null,
    costPolicyPreviewId: costPolicyPreview?.policyPreviewId ?? null,
    queuePreviewId: queuePreview?.queuePreviewId ?? null,
    requestDraftId: requestDraft?.requestDraftId ?? null,
    decisionId:
      backlog?.decisionId ??
      matrix?.decisionId ??
      providerSelectionDraft?.decisionId ??
      assetPackDraft?.decisionId ??
      costPolicyPreview?.decisionId ??
      queuePreview?.decisionId ??
      requestDraft?.decisionId ??
      latestDecisionRecord?.decisionId ??
      null,
    decisionGateId:
      backlog?.decisionGateId ??
      matrix?.decisionGateId ??
      providerSelectionDraft?.decisionGateId ??
      assetPackDraft?.decisionGateId ??
      costPolicyPreview?.decisionGateId ??
      queuePreview?.decisionGateId ??
      requestDraft?.decisionGateId ??
      latestDecisionRecord?.decisionGateId ??
      gate?.decisionGateId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    videoFormat: "briefing_video",
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired,
    surface: input.surface,
    previewStatus,
    previewCandidate,
    reviewActions,
    reviewChecklist,
    overallDecision,
    topBlockers,
    nextRecommendedAction,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    userVisibleSummary: summary.userVisibleSummary,
    nextStep,
    execution: buildExecutionFlags(),
    persistedAt: input.persistedAt ?? null,
    persistedBy: input.persistedBy ?? null,
    idempotencyKey: null,
    previousPreviewReviewFlowRef: null,
    supersedesPreviewReviewFlowRef: null,
    previewReviewVersion: null,
  };
}

export function buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const handoffModel = buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const preflightModel = buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model);
  const adapterModel = buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model);
  const gate = buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model);
  const requestDraft = buildVoxyRenderRequestDraftFromCreateCandidatePreview(model);
  const queuePreview = buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model);
  const costPolicyPreview = buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model);
  const assetPackDraft = buildVoxyRenderAssetPackDraftPreviewFromCreateCandidatePreview(model);
  const providerSelectionDraft =
    buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview(model);
  const matrix = buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model);
  const backlog = buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model);
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: "create",
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    gate,
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    matrix,
    backlog,
  });
}

export function buildVoxyRenderPreviewReviewFlowFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: PreviewReviewSurface;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestQueuePreview?: VoxyRenderQueuePreviewRecord | null;
  latestCostPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestAssetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
}) {
  const handoffModel = buildVoxyRenderProviderHandoffFromReviewContext(input.reviewContext);
  const preflightModel = buildVoxyRenderPreflightReadinessFromReviewContext(input.reviewContext);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromReviewContext(input.reviewContext);
  const adapterModel = buildVoxyRenderAdapterNoopFromReviewContext(input.reviewContext);
  const gate = buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext);
  const requestDraft =
    input.latestRequestDraft ?? buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext);
  const queuePreview =
    input.latestQueuePreview ?? buildVoxyRenderQueuePreviewFromReviewContext(input.reviewContext);
  const costPolicyPreview =
    input.latestCostPolicyPreview ??
    buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(input.reviewContext);
  const assetPackDraft =
    input.latestAssetPackDraft ??
    buildVoxyRenderAssetPackDraftPreviewFromReviewContext(input.reviewContext);
  const providerSelectionDraft =
    input.latestProviderSelectionDraft ??
    buildVoxyRenderProviderSelectionDraftFromReviewContext(input.reviewContext);
  const matrix =
    input.latestMatrix ??
    buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
      reviewContext: input.reviewContext,
      latestDecisionRecord: input.latestDecisionRecord,
      latestRequestDraft: requestDraft,
      latestQueuePreview: queuePreview,
      latestCostPolicyPreview: costPolicyPreview,
      latestAssetPackDraft: assetPackDraft,
      latestProviderSelectionDraft: providerSelectionDraft,
    });
  const backlog =
    input.latestBacklog ??
    buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
      reviewContext: input.reviewContext,
      latestDecisionRecord: input.latestDecisionRecord,
      latestRequestDraft: requestDraft,
      latestQueuePreview: queuePreview,
      latestCostPolicyPreview: costPolicyPreview,
      latestAssetPackDraft: assetPackDraft,
      latestProviderSelectionDraft: providerSelectionDraft,
      latestMatrix: matrix,
    });
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: input.surface ?? "admin",
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    gate,
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    matrix,
    backlog,
    latestDecisionRecord: input.latestDecisionRecord,
  });
}

export function buildVoxyRenderPreviewReviewFlowFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: PreviewReviewSurface;
    contributionRef?: PreviewReviewRef | null;
    dossierRef?: PreviewReviewRef | null;
    nextStep?: string | null;
  },
) {
  const handoffModel = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, options);
  const preflightModel = buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, options);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, options);
  const adapterModel = buildVoxyRenderAdapterNoopFromVoxyDialog(dialog, options);
  const gate = buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options);
  const requestDraft = buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options);
  const queuePreview = buildVoxyRenderQueuePreviewFromVoxyDialog(dialog, options);
  const costPolicyPreview = buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(dialog, options);
  const assetPackDraft = buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog(dialog, options);
  const providerSelectionDraft = buildVoxyRenderProviderSelectionDraftFromVoxyDialog(
    dialog,
    options,
  );
  const matrix = buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options);
  const backlog = buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options);
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: options?.surface ?? "account",
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    gate,
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    matrix,
    backlog,
  });
}

function buildStoreStateLabel(state: VoxyRenderPreviewReviewFlowPersistenceState | null | undefined) {
  if (!state) return "Kein Preview-Review-Store im Surface";
  return state.label;
}

function buildStoreStateSummary(
  state: VoxyRenderPreviewReviewFlowPersistenceState | null | undefined,
) {
  if (!state) {
    return "Dieses Surface zeigt nur den vorbereiteten Review-Flow und behauptet keine persistente Preview-Review-Wahrheit.";
  }
  return state.summary;
}

export function buildVoxyRenderPreviewReviewFlowPanelModel(input: {
  preview: VoxyRenderPreviewReviewFlowRecord | null;
  latestRecord?: VoxyRenderPreviewReviewFlowRecord | null;
  persistenceState?: VoxyRenderPreviewReviewFlowPersistenceState | null;
  backlogStoreState?: VoxyRenderRuntimeEnablementBacklogPersistenceState | null;
}): VoxyRenderPreviewReviewFlowPanelModel | null {
  if (!input.preview) return null;

  const auditLines = uniqueStrings([
    `Preview-Status: ${previewStatusLabel(input.preview.previewStatus)}`,
    `Overall: ${overallDecisionLabel(input.preview.overallDecision)}`,
    `Preview-Kandidat: ${candidateStatusLabel(input.preview.previewCandidate.status)}`,
    input.preview.enablementBacklogId
      ? `Enablement-Backlog: ${input.preview.enablementBacklogId}`
      : "Noch kein Enablement-Backlog referenziert.",
    input.preview.matrixId ? `Matrix: ${input.preview.matrixId}` : "Noch keine Matrix referenziert.",
    input.latestRecord?.persistedAt
      ? `Persistiert: ${input.latestRecord.persistedAt}`
      : input.backlogStoreState?.mode === "persistent_primary"
        ? "Noch kein persistierter Preview-Review-Flow."
        : null,
  ]);

  return {
    title: "Preview Review",
    summary:
      "Dieser Flow zeigt nur, wie ein späteres Voxy-Preview geprüft, kommentiert, abgelehnt oder als review-ready markiert würde. Es wird nichts gerendert, erzeugt oder veröffentlicht.",
    preview: input.preview,
    previewStatusLabel: previewStatusLabel(input.preview.previewStatus),
    overallDecisionLabel: overallDecisionLabel(input.preview.overallDecision),
    nextRecommendedActionLabel: nextActionLabel(input.preview.nextRecommendedAction),
    storeStateLabel: buildStoreStateLabel(input.persistenceState),
    storeStateSummary: buildStoreStateSummary(input.persistenceState),
    latestRecord: input.latestRecord
      ? {
          previewReviewFlowId: input.latestRecord.previewReviewFlowId,
          statusLabel: previewStatusLabel(input.latestRecord.previewStatus),
          overallDecisionLabel: overallDecisionLabel(input.latestRecord.overallDecision),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          previewReviewVersion: input.latestRecord.previewReviewVersion,
          enablementBacklogId: input.latestRecord.enablementBacklogId,
        }
      : null,
    candidateStatusLabel: candidateStatusLabel(input.preview.previewCandidate.status),
    actionRows: input.preview.reviewActions.map((action) => ({
      ...action,
      actionLabel: action.userVisibleLabel,
    })),
    checklistRows: input.preview.reviewChecklist.map((item) => ({
      ...item,
      checkLabel: checkLabel(item.checkKey),
      statusLabel: checklistStatusLabel(item.status),
    })),
    topBlockers: input.preview.topBlockers,
    auditLines,
    nextStep: input.preview.nextStep,
  };
}
