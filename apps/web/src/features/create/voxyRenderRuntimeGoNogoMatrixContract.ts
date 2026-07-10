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
  buildVoxyRenderAssetPackDraftPreviewFromReadmodels,
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
  buildVoxyRenderCostCreditPolicyPreviewFromReadmodels,
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
  buildVoxyRenderProviderSelectionDraftFromReadmodels,
  buildVoxyRenderProviderSelectionDraftFromReviewContext,
  buildVoxyRenderProviderSelectionDraftFromVoxyDialog,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import type {
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReadmodels,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReadmodels,
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

export const VOXY_RENDER_RUNTIME_GO_NOGO_MATRIX_STATUSES = [
  "go_nogo_preview_only",
  "runtime_no_go",
  "blocked_by_review",
  "blocked_by_provider",
  "blocked_by_assets",
  "blocked_by_queue",
  "blocked_by_cost_credit",
  "blocked_by_language",
  "blocked_by_runtime_truth",
  "blocked_by_publish_guard",
  "keep_as_script_only",
] as const;

export type VoxyRenderRuntimeGoNogoMatrixStatus =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_MATRIX_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_GATE_KEYS = [
  "review",
  "provider",
  "assets",
  "queue",
  "cost_credit",
  "language",
  "runtime",
  "publish",
] as const;

export type VoxyRenderRuntimeGoNogoGateKey =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_GATE_KEYS)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_GATE_STATUSES = [
  "go",
  "no_go",
  "warning",
  "unknown",
  "not_applicable",
] as const;

export type VoxyRenderRuntimeGoNogoGateStatus =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_GATE_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_BLOCKER_SEVERITIES = [
  "none",
  "info",
  "warning",
  "blocker",
] as const;

export type VoxyRenderRuntimeGoNogoBlockerSeverity =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_BLOCKER_SEVERITIES)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_OVERALL_DECISIONS = [
  "no_go",
  "review_needed",
  "keep_as_script_only",
  "runtime_not_available",
  "future_runtime_review_only",
] as const;

export type VoxyRenderRuntimeGoNogoOverallDecision =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_OVERALL_DECISIONS)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_NEXT_ACTIONS = [
  "review_script",
  "review_sources",
  "review_language",
  "prepare_assets",
  "configure_provider",
  "define_cost_policy",
  "keep_as_script_only",
  "wait_for_runtime",
  "blocked",
] as const;

export type VoxyRenderRuntimeGoNogoNextAction =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_NEXT_ACTIONS)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderRuntimeGoNogoStoreResultStatus =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_GO_NOGO_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderRuntimeGoNogoPersistenceMode =
  (typeof VOXY_RENDER_RUNTIME_GO_NOGO_PERSISTENCE_MODES)[number];

type MatrixSurface = "create" | "account" | "admin" | "workspace";

type MatrixRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderRuntimeGoNogoGate = {
  gateKey: VoxyRenderRuntimeGoNogoGateKey;
  label: string;
  status: VoxyRenderRuntimeGoNogoGateStatus;
  blockerSeverity: VoxyRenderRuntimeGoNogoBlockerSeverity;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  evidenceRefs: string[];
  nextAction: VoxyRenderRuntimeGoNogoNextAction;
  executionAllowed: false;
};

export type VoxyRenderRuntimeGoNogoExecutionFlags = {
  renderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderRuntimeGoNogoMatrixRecord = {
  matrixId: string;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  handoffRef: MatrixRef | null;
  preflightRef: MatrixRef | null;
  registryRef: MatrixRef | null;
  adapterRef: MatrixRef | null;
  scriptRef: MatrixRef | null;
  contributionRef: MatrixRef | null;
  dossierRef: MatrixRef | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  surface: MatrixSurface;
  matrixStatus: VoxyRenderRuntimeGoNogoMatrixStatus;
  reviewGate: VoxyRenderRuntimeGoNogoGate;
  providerGate: VoxyRenderRuntimeGoNogoGate;
  assetGate: VoxyRenderRuntimeGoNogoGate;
  queueGate: VoxyRenderRuntimeGoNogoGate;
  costCreditGate: VoxyRenderRuntimeGoNogoGate;
  languageGate: VoxyRenderRuntimeGoNogoGate;
  runtimeGate: VoxyRenderRuntimeGoNogoGate;
  publishGate: VoxyRenderRuntimeGoNogoGate;
  overallDecision: VoxyRenderRuntimeGoNogoOverallDecision;
  topBlockers: string[];
  nextRecommendedAction: VoxyRenderRuntimeGoNogoNextAction;
  nextStep: string;
  execution: VoxyRenderRuntimeGoNogoExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousMatrixRef: string | null;
  supersedesMatrixRef: string | null;
  matrixVersion: number | null;
};

export type VoxyRenderRuntimeGoNogoMatrixCommand = Omit<
  VoxyRenderRuntimeGoNogoMatrixRecord,
  "persistedAt" | "persistedBy" | "idempotencyKey" | "previousMatrixRef" | "supersedesMatrixRef" | "matrixVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderRuntimeGoNogoStoreResult = {
  ok: boolean;
  status: VoxyRenderRuntimeGoNogoStoreResultStatus;
  record: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderRuntimeGoNogoMatrixPersistenceState = {
  mode: VoxyRenderRuntimeGoNogoPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderRuntimeGoNogoMatrixRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderRuntimeGoNogoMatrixPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderRuntimeGoNogoMatrixRecord;
  matrixStatusLabel: string;
  overallDecisionLabel: string;
  nextRecommendedActionLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    matrixId: string;
    statusLabel: string;
    overallDecisionLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    matrixVersion: number | null;
    requestDraftId: string | null;
  } | null;
  blockedReasons: string[];
  auditLines: string[];
  nextStep: string;
  gateRows: VoxyRenderRuntimeGoNogoGate[];
  executionFlags: VoxyRenderRuntimeGoNogoExecutionFlags;
};

type BuildMatrixInput = {
  surface: MatrixSurface;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  assetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  providerSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  handoffModel?: VoxyRenderProviderHandoffModel | null;
  preflightModel?: VoxyRenderPreflightReadinessModel | null;
  registryModel?: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel?: VoxyRenderAdapterNoopModel | null;
  persistedAt?: string | null;
  persistedBy?: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
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

function isRtlLanguage(language: string | null | undefined) {
  const normalized = normalizeText(language).toLowerCase();
  return normalized === "ar" || normalized === "fa" || normalized === "he" || normalized === "ur";
}

function buildExecutionFlags(): VoxyRenderRuntimeGoNogoExecutionFlags {
  return {
    renderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function defaultPersistenceState(): VoxyRenderRuntimeGoNogoMatrixPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Runtime-Go/No-Go-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine review-first Go/No-Go-Matrix. Es gibt hier bewusst keinen Render-, Queue-, Provider-, Kosten- oder Publish-Start.",
    repositoryInterface: "VoxyRenderRuntimeGoNogoMatrixRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

export function voxyRenderRuntimeGoNogoMatrixStatusLabel(
  value: VoxyRenderRuntimeGoNogoMatrixStatus,
) {
  if (value === "go_nogo_preview_only") return "Go/No-Go nur als Vorschau";
  if (value === "runtime_no_go") return "Runtime-No-Go";
  if (value === "blocked_by_review") return "Durch Review blockiert";
  if (value === "blocked_by_provider") return "Durch Provider blockiert";
  if (value === "blocked_by_assets") return "Durch Assets blockiert";
  if (value === "blocked_by_queue") return "Durch Queue blockiert";
  if (value === "blocked_by_cost_credit") return "Durch Kosten & Credits blockiert";
  if (value === "blocked_by_language") return "Durch Sprache & Untertitel blockiert";
  if (value === "blocked_by_runtime_truth") return "Durch Runtime-Wahrheit blockiert";
  if (value === "blocked_by_publish_guard") return "Durch Publish-Guard blockiert";
  return "Bewusst Script-only";
}

export function voxyRenderRuntimeGoNogoGateStatusLabel(
  value: VoxyRenderRuntimeGoNogoGateStatus,
) {
  if (value === "go") return "Go";
  if (value === "no_go") return "No-Go";
  if (value === "warning") return "Warnung";
  if (value === "not_applicable") return "Nicht anwendbar";
  return "Unklar";
}

export function voxyRenderRuntimeGoNogoOverallDecisionLabel(
  value: VoxyRenderRuntimeGoNogoOverallDecision,
) {
  if (value === "review_needed") return "Review nötig";
  if (value === "keep_as_script_only") return "Bewusst Script-only";
  if (value === "runtime_not_available") return "Runtime nicht verfügbar";
  if (value === "future_runtime_review_only") return "Nur für spätere Runtime-Prüfung";
  return "No-Go";
}

export function voxyRenderRuntimeGoNogoNextActionLabel(
  value: VoxyRenderRuntimeGoNogoNextAction,
) {
  if (value === "review_script") return "Script prüfen";
  if (value === "review_sources") return "Quellen prüfen";
  if (value === "review_language") return "Sprache & Untertitel prüfen";
  if (value === "prepare_assets") return "Assets vorbereiten";
  if (value === "configure_provider") return "Provider konfigurieren";
  if (value === "define_cost_policy") return "Kosten & Credits klären";
  if (value === "keep_as_script_only") return "Bei Script-only bleiben";
  if (value === "wait_for_runtime") return "Auf Runtime warten";
  return "Blocker manuell klären";
}

function gateLabel(value: VoxyRenderRuntimeGoNogoGateKey) {
  if (value === "cost_credit") return "Kosten & Credits";
  return {
    review: "Review",
    provider: "Provider",
    assets: "Assets",
    queue: "Queue",
    language: "Sprache & Untertitel",
    runtime: "Runtime",
    publish: "Veröffentlichung",
  }[value];
}

function buildGate(input: {
  gateKey: VoxyRenderRuntimeGoNogoGateKey;
  status: VoxyRenderRuntimeGoNogoGateStatus;
  blockerSeverity: VoxyRenderRuntimeGoNogoBlockerSeverity;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  evidenceRefs?: Array<string | null | undefined>;
  nextAction: VoxyRenderRuntimeGoNogoNextAction;
}) {
  return {
    gateKey: input.gateKey,
    label: gateLabel(input.gateKey),
    status: input.status,
    blockerSeverity: input.blockerSeverity,
    reviewerVisibleReason:
      normalizeText(input.reviewerVisibleReason) || "Gate bleibt im Preview-Kontext offen.",
    userVisibleReason:
      normalizeText(input.userVisibleReason) || "Gate bleibt im Preview-Kontext offen.",
    evidenceRefs: uniqueStrings(input.evidenceRefs ?? []),
    nextAction: input.nextAction,
    executionAllowed: false,
  } satisfies VoxyRenderRuntimeGoNogoGate;
}

function buildLanguages(input: {
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  assetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  providerSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  handoffModel?: VoxyRenderProviderHandoffModel | null;
  preflightModel?: VoxyRenderPreflightReadinessModel | null;
}) {
  const sourceLanguage =
    input.providerSelectionDraft?.sourceLanguage ??
    input.assetPackDraft?.sourceLanguage ??
    input.costPolicyPreview?.sourceLanguage ??
    input.queuePreview?.sourceLanguage ??
    input.requestDraft?.sourceLanguage ??
    input.latestDecisionRecord?.sourceLanguage ??
    input.gate?.sourceLanguage ??
    input.handoffModel?.sourceLanguage ??
    input.preflightModel?.sourceLanguage ??
    "de";
  const readingLanguage =
    input.providerSelectionDraft?.readingLanguage ??
    input.assetPackDraft?.readingLanguage ??
    input.costPolicyPreview?.readingLanguage ??
    input.queuePreview?.readingLanguage ??
    input.requestDraft?.readingLanguage ??
    input.latestDecisionRecord?.readingLanguage ??
    input.gate?.readingLanguage ??
    input.handoffModel?.readingLanguage ??
    input.preflightModel?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    input.providerSelectionDraft?.scriptLanguage ??
    input.assetPackDraft?.scriptLanguage ??
    input.costPolicyPreview?.scriptLanguage ??
    input.queuePreview?.scriptLanguage ??
    input.requestDraft?.scriptLanguage ??
    input.latestDecisionRecord?.scriptLanguage ??
    input.gate?.scriptLanguage ??
    input.handoffModel?.scriptLanguage ??
    input.preflightModel?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    input.providerSelectionDraft?.renderLanguage ??
    input.assetPackDraft?.renderLanguage ??
    input.costPolicyPreview?.renderLanguage ??
    input.queuePreview?.renderLanguage ??
    input.requestDraft?.renderLanguage ??
    input.latestDecisionRecord?.renderLanguage ??
    input.gate?.renderLanguage ??
    input.preflightModel?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    input.providerSelectionDraft?.subtitleLanguage ??
    input.assetPackDraft?.subtitleLanguage ??
    input.costPolicyPreview?.subtitleLanguage ??
    input.queuePreview?.subtitleLanguage ??
    input.requestDraft?.subtitleLanguage ??
    input.latestDecisionRecord?.subtitleLanguage ??
    input.gate?.subtitleLanguage ??
    input.preflightModel?.subtitleLanguage ??
    null;
  const rtlRequired =
    input.providerSelectionDraft?.rtlRequired ??
    input.assetPackDraft?.rtlRequired ??
    input.costPolicyPreview?.rtlRequired ??
    input.queuePreview?.rtlRequired ??
    input.requestDraft?.rtlRequired ??
    Boolean(
      input.gate?.rtlDecisionHint ||
        input.preflightModel?.rtlPreflightHint ||
        isRtlLanguage(sourceLanguage) ||
        isRtlLanguage(scriptLanguage) ||
        isRtlLanguage(renderLanguage) ||
        isRtlLanguage(subtitleLanguage),
    );
  const crossLingual =
    uniqueStrings([
      sourceLanguage,
      readingLanguage,
      scriptLanguage,
      renderLanguage,
      subtitleLanguage,
    ]).length > 1;
  return {
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    rtlRequired,
    crossLingual,
  };
}

function buildNextStep(action: VoxyRenderRuntimeGoNogoNextAction) {
  return `${voxyRenderRuntimeGoNogoNextActionLabel(action)}. Kein Render, keine Queue, kein Providerlauf, keine Secrets und kein Publish entstehen in diesem Schritt.`;
}

function buildReviewGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  keepAsScriptOnly: boolean;
}) {
  if (!input.requestDraft) {
    return buildGate({
      gateKey: "review",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Ohne Render-Request-Draft gibt es keine belastbare Review-Basis für einen Runtime-Start.",
      userVisibleReason: "Der Renderpfad bleibt ohne Request-Draft im No-Go.",
      evidenceRefs: [input.gate?.decisionGateId],
      nextAction: "review_script",
    });
  }
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "review",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Der Upstream-Pfad ist bewusst als Script-only markiert.",
      userVisibleReason: "Dieser Pfad bleibt vorerst bewusst beim Script-only-Stand.",
      evidenceRefs: [input.requestDraft.requestDraftId, input.gate?.decisionGateId],
      nextAction: "keep_as_script_only",
    });
  }
  if (!input.gate) {
    return buildGate({
      gateKey: "review",
      status: "unknown",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Kein Review-Decision-Gate sichtbar.",
      userVisibleReason: "Die Review-Wahrheit ist noch unklar.",
      evidenceRefs: [input.requestDraft.requestDraftId],
      nextAction: "review_script",
    });
  }
  if (
    input.gate.decisionStatus === "blocked_by_runtime_truth" ||
    input.gate.decisionStatus === "blocked"
  ) {
    return buildGate({
      gateKey: "review",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: input.gate.reviewerVisibleReason,
      userVisibleReason: input.gate.userVisibleReason,
      evidenceRefs: [input.gate.decisionGateId, input.latestDecisionRecord?.decisionId],
      nextAction: "blocked",
    });
  }
  const reviewOpen =
    !input.latestDecisionRecord ||
    input.gate.decisionStatus === "readmodel_only" ||
    input.gate.decisionStatus === "needs_persistence" ||
    input.gate.reviewGates.some((item) => item.status !== "ready") ||
    input.gate.decisionStatus.startsWith("needs_");
  if (reviewOpen) {
    const nextAction =
      input.gate.decisionStatus === "needs_source_review"
        ? "review_sources"
        : input.gate.decisionStatus === "needs_language_review"
          ? "review_language"
          : "review_script";
    return buildGate({
      gateKey: "review",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: input.gate.reviewerVisibleReason,
      userVisibleReason: input.gate.userVisibleReason,
      evidenceRefs: [input.gate.decisionGateId, input.latestDecisionRecord?.decisionId],
      nextAction,
    });
  }
  return buildGate({
    gateKey: "review",
    status: "go",
    blockerSeverity: "none",
    reviewerVisibleReason: "Review-Entscheidung und sichtbare Review-Gates liegen vor, ohne daraus eine Runtime-Freigabe abzuleiten.",
    userVisibleReason: "Review-Bausteine liegen vor, aber es entsteht noch kein Renderstart.",
    evidenceRefs: [input.gate.decisionGateId, input.latestDecisionRecord?.decisionId],
    nextAction: "wait_for_runtime",
  });
}

function buildProviderGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  keepAsScriptOnly: boolean;
}) {
  if (!input.requestDraft || !input.providerSelectionDraft) {
    return buildGate({
      gateKey: "provider",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Ohne Request-Draft und Provider-Auswahl-Draft gibt es keine belastbare Provider-Readiness.",
      userVisibleReason: "Der Provider-Pfad bleibt aktuell blockiert.",
      evidenceRefs: [input.requestDraft?.requestDraftId, input.providerSelectionDraft?.providerSelectionDraftId],
      nextAction: "configure_provider",
    });
  }
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "provider",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Script-only sperrt jede Provider-Ausführung bewusst.",
      userVisibleReason: "Es wird bewusst kein Provider vorbereitet oder gestartet.",
      evidenceRefs: [input.providerSelectionDraft.providerSelectionDraftId],
      nextAction: "keep_as_script_only",
    });
  }
  const status = input.providerSelectionDraft.providerSelectionStatus;
  const hasConcreteProvider = input.providerSelectionDraft.candidates.some((item) =>
    Boolean(normalizeText(item.providerName)),
  );
  const hasCapabilityGap = input.providerSelectionDraft.candidates.some(
    (item) =>
      item.missingCapabilities.length > 0 ||
      item.status === "missing" ||
      item.status === "adapter_needed" ||
      item.status === "configuration_needed" ||
      item.status === "secrets_needed" ||
      item.status === "pricing_needed" ||
      item.status === "blocked",
  );
  const adapterNotReady = input.adapterModel?.providerGateItems.some((item) => item.status !== "ready");
  const explicitRuntimeTruthBlocked =
    status === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth" ||
    input.adapterModel?.adapterStatus === "blocked_by_runtime_truth";
  const languageOwnedProviderGap =
    status === "needs_language_capability" || status === "needs_subtitle_capability";
  if (explicitRuntimeTruthBlocked) {
    return buildGate({
      gateKey: "provider",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Provider-Readiness scheitert an fehlender Runtime-Wahrheit für Konfiguration, Secrets oder Queue.",
      userVisibleReason: "Provider-Laufzeit fehlt weiterhin.",
      evidenceRefs: [
        input.providerSelectionDraft.providerSelectionDraftId,
        input.preflightModel?.handoffRef?.id,
        input.adapterModel?.summary,
      ],
      nextAction: "wait_for_runtime",
    });
  }
  if (
    (status.startsWith("needs_") && !languageOwnedProviderGap) ||
    status === "blocked_by_missing_request_draft" ||
    status === "blocked_by_missing_asset_pack" ||
    status === "blocked_by_missing_cost_policy" ||
    status === "blocked_by_missing_registry" ||
    !hasConcreteProvider ||
    (hasCapabilityGap && !languageOwnedProviderGap) ||
    adapterNotReady
  ) {
    return buildGate({
      gateKey: "provider",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason:
        input.providerSelectionDraft.decision.reviewerVisibleReason ||
        "Provider-Selection bleibt auf Requirements, fehlender Konfiguration oder Capability-Lücken stehen.",
      userVisibleReason:
        input.providerSelectionDraft.decision.userVisibleReason ||
        "Der Provider-Pfad bleibt ohne belastbare Konfiguration und Capability-Nachweise im No-Go.",
      evidenceRefs: [
        input.providerSelectionDraft.providerSelectionDraftId,
        input.preflightModel?.handoffRef?.id,
        input.adapterModel?.summary,
      ],
      nextAction: "configure_provider",
    });
  }
  return buildGate({
    gateKey: "provider",
    status: "warning",
    blockerSeverity: "warning",
    reviewerVisibleReason: "Formale Provider-Bausteine sind vorbereitet, aber dies bleibt bewusst eine no-execution Vorschau ohne Fake-Green.",
    userVisibleReason: "Provider-Readiness bleibt sichtbar, startet aber nichts.",
    evidenceRefs: [input.providerSelectionDraft.providerSelectionDraftId],
    nextAction: "wait_for_runtime",
  });
}

function buildAssetGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null;
  keepAsScriptOnly: boolean;
}) {
  if (!input.requestDraft || !input.assetPackDraft) {
    return buildGate({
      gateKey: "assets",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Ohne Request-Draft und Asset-Pack-Draft fehlt die Asset-Basis für einen späteren Renderlauf.",
      userVisibleReason: "Es fehlen noch belastbare Asset-Angaben.",
      evidenceRefs: [input.requestDraft?.requestDraftId, input.assetPackDraft?.assetPackDraftId],
      nextAction: "prepare_assets",
    });
  }
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "assets",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Script-only hält den Asset-Pfad bewusst unterhalb jeder Medienerzeugung.",
      userVisibleReason: "Es wird bewusst kein Render-Asset-Pack ausgeführt.",
      evidenceRefs: [input.assetPackDraft.assetPackDraftId],
      nextAction: "keep_as_script_only",
    });
  }
  const missingAssets = input.assetPackDraft.assetEntries.some(
    (entry) => entry.status === "missing" || entry.status === "blocked",
  );
  const explicitRuntimeTruthBlocked = input.assetPackDraft.assetPackStatus === "blocked_by_runtime_truth";
  if (explicitRuntimeTruthBlocked) {
    return buildGate({
      gateKey: "assets",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Asset-Wahrheit bleibt auf Runtime- oder Template-Blockern stehen.",
      userVisibleReason: "Die Asset-Runtime fehlt weiterhin.",
      evidenceRefs: [input.assetPackDraft.assetPackDraftId],
      nextAction: "wait_for_runtime",
    });
  }
  if (
    input.assetPackDraft.assetPackStatus.startsWith("needs_") ||
    input.assetPackDraft.assetPackStatus === "blocked_by_missing_request_draft" ||
    input.assetPackDraft.assetPackStatus === "blocked_by_missing_registry" ||
    input.assetPackDraft.assetPackStatus === "blocked_by_missing_required_assets" ||
    missingAssets
  ) {
    return buildGate({
      gateKey: "assets",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: input.assetPackDraft.reviewerVisibleReason,
      userVisibleReason: input.assetPackDraft.userVisibleReason,
      evidenceRefs: [input.assetPackDraft.assetPackDraftId],
      nextAction: "prepare_assets",
    });
  }
  return buildGate({
    gateKey: "assets",
    status: "warning",
    blockerSeverity: "warning",
    reviewerVisibleReason: "Asset-Bausteine sind sichtbar, bleiben aber weiterhin ungleich `render_safe` oder `media_file`.",
    userVisibleReason: "Assets sind vorbereitet, aber noch keine Renderfreigabe.",
    evidenceRefs: [input.assetPackDraft.assetPackDraftId],
    nextAction: "wait_for_runtime",
  });
}

function buildQueueGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  keepAsScriptOnly: boolean;
}) {
  if (!input.requestDraft || !input.queuePreview) {
    return buildGate({
      gateKey: "queue",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Ohne Queue-Preview gibt es keine belastbare Queue-Readiness.",
      userVisibleReason: "Es existiert weiterhin keine Queue-Basis.",
      evidenceRefs: [input.requestDraft?.requestDraftId, input.queuePreview?.queuePreviewId],
      nextAction: "wait_for_runtime",
    });
  }
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "queue",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Script-only verhindert bewusst jede Queue-Aktivierung.",
      userVisibleReason: "Es wird bewusst keine Queue gestartet.",
      evidenceRefs: [input.queuePreview.queuePreviewId],
      nextAction: "keep_as_script_only",
    });
  }
  return buildGate({
    gateKey: "queue",
    status: "no_go",
    blockerSeverity:
      input.queuePreview.queueStatus === "blocked_by_runtime_truth" ? "blocker" : "warning",
    reviewerVisibleReason:
      input.queuePreview.reviewerVisibleReason ||
      "Der Queue-Vertrag bleibt disabled und erzeugt keinen Worker- oder Jobstart.",
    userVisibleReason:
      input.queuePreview.userVisibleReason ||
      "Die Queue bleibt weiterhin nur Vorschau und startet nichts.",
    evidenceRefs: [input.queuePreview.queuePreviewId],
    nextAction: "wait_for_runtime",
  });
}

function buildCostCreditGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  keepAsScriptOnly: boolean;
}) {
  if (!input.requestDraft || !input.costPolicyPreview) {
    return buildGate({
      gateKey: "cost_credit",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Ohne Cost-/Credit-Policy gibt es keine belastbare Kosten- oder Credit-Readiness.",
      userVisibleReason: "Kosten & Credits bleiben aktuell blockiert.",
      evidenceRefs: [input.requestDraft?.requestDraftId, input.costPolicyPreview?.policyPreviewId],
      nextAction: "define_cost_policy",
    });
  }
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "cost_credit",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Script-only hält Billing-, Credit- und Metering-Fragen bewusst unterhalb jeder Ausführung.",
      userVisibleReason: "Es werden bewusst keine Kosten oder Credits aktiviert.",
      evidenceRefs: [input.costPolicyPreview.policyPreviewId],
      nextAction: "keep_as_script_only",
    });
  }
  const previewCanAdvanceAsWarning =
    input.costPolicyPreview.providerPricingStatus === "available" &&
    input.costPolicyPreview.estimatedCostAmount !== null &&
    input.costPolicyPreview.policyStatus !== "blocked_by_runtime_truth" &&
    !input.costPolicyPreview.policyStatus.startsWith("needs_");
  if (previewCanAdvanceAsWarning) {
    return buildGate({
      gateKey: "cost_credit",
      status: "warning",
      blockerSeverity: "warning",
      reviewerVisibleReason:
        "Pricing- und Policy-Hinweise sind sichtbar, bleiben aber ausdrücklich unterhalb von Billing-, Debit- und Metering-Runtime.",
      userVisibleReason:
        "Kosten & Credits sind nur als Vorschau sichtbar. Es wird nichts gebucht oder abgezogen.",
      evidenceRefs: [input.costPolicyPreview.policyPreviewId],
      nextAction: "wait_for_runtime",
    });
  }
  return buildGate({
    gateKey: "cost_credit",
    status: "no_go",
    blockerSeverity:
      input.costPolicyPreview.policyStatus === "blocked_by_runtime_truth" ? "blocker" : "warning",
    reviewerVisibleReason:
      input.costPolicyPreview.reviewerVisibleReason ||
      "Kosten- und Credit-Policy bleibt im Preview- oder Noop-Stand.",
    userVisibleReason:
      input.costPolicyPreview.userVisibleReason ||
      "Kosten & Credits sind noch nicht belastbar geklärt.",
    evidenceRefs: [input.costPolicyPreview.policyPreviewId],
    nextAction: "define_cost_policy",
  });
}

function buildLanguageGate(input: {
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  rtlRequired: boolean;
  crossLingual: boolean;
}) {
  const providerLanguageBlocked =
    input.providerSelectionDraft?.providerSelectionStatus === "needs_language_capability" ||
    input.providerSelectionDraft?.providerSelectionStatus === "needs_subtitle_capability";
  const explicitLanguageReview =
    input.gate?.decisionStatus === "needs_language_review" || Boolean(input.gate?.rtlDecisionHint);
  if (providerLanguageBlocked || (input.rtlRequired && explicitLanguageReview)) {
    const languageLine = `Quelle: ${languageName(input.sourceLanguage)} · Lesefassung: ${languageName(input.readingLanguage)} · Script: ${languageName(input.scriptLanguage)} · Render: ${languageName(input.renderLanguage)}${input.subtitleLanguage ? ` · Untertitel: ${languageName(input.subtitleLanguage)}` : ""}`;
    return buildGate({
      gateKey: "language",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason:
        input.providerSelectionDraft?.decision.reviewerVisibleReason ||
        input.gate?.reviewerVisibleReason ||
        "Cross-lingual- oder RTL-Faelle bleiben ohne sichtbare Capability-Nachweise im No-Go.",
      userVisibleReason:
        input.providerSelectionDraft?.decision.userVisibleReason ||
        input.gate?.userVisibleReason ||
        "Sprache, Untertitel oder RTL bleiben weiter prüfpflichtig.",
      evidenceRefs: [input.providerSelectionDraft?.providerSelectionDraftId, languageLine],
      nextAction: "review_language",
    });
  }
  if (input.crossLingual || input.rtlRequired) {
    return buildGate({
      gateKey: "language",
      status: "warning",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Mehrsprachigkeit oder RTL bleiben sichtbar, ohne daraus eine automatische Capability- oder Publish-Freigabe abzuleiten.",
      userVisibleReason: "Mehrsprachiger oder RTL-naher Kontext bleibt unter Review.",
      evidenceRefs: [input.providerSelectionDraft?.providerSelectionDraftId, input.gate?.decisionGateId],
      nextAction: "review_language",
    });
  }
  return buildGate({
    gateKey: "language",
    status: "not_applicable",
    blockerSeverity: "info",
    reviewerVisibleReason: "Kein zusätzlicher Cross-lingual- oder RTL-Blocker sichtbar.",
    userVisibleReason: "Keine zusätzlichen Sprach- oder RTL-Blocker sichtbar.",
    evidenceRefs: [input.providerSelectionDraft?.providerSelectionDraftId],
    nextAction: "wait_for_runtime",
  });
}

function buildRuntimeGate(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null;
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return buildGate({
      gateKey: "runtime",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Script-only stoppt jede Runtime bewusst vor Queue, Worker, Provider und Publish.",
      userVisibleReason: "Dieser Pfad bleibt bewusst unterhalb jeder Runtime.",
      evidenceRefs: [input.requestDraft?.requestDraftId],
      nextAction: "keep_as_script_only",
    });
  }
  const explicitRuntimeTruthBlocked =
    input.requestDraft?.requestStatus === "blocked_by_runtime_truth" ||
    input.queuePreview?.queueStatus === "blocked_by_runtime_truth" ||
    input.costPolicyPreview?.policyStatus === "blocked_by_runtime_truth" ||
    input.assetPackDraft?.assetPackStatus === "blocked_by_runtime_truth" ||
    input.providerSelectionDraft?.providerSelectionStatus === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth" ||
    input.adapterModel?.adapterStatus === "blocked_by_runtime_truth";
  return buildGate({
    gateKey: "runtime",
    status: "no_go",
    blockerSeverity: explicitRuntimeTruthBlocked ? "blocker" : "warning",
    reviewerVisibleReason: explicitRuntimeTruthBlocked
      ? "Mehrere Upstream-Bausteine markieren fehlende Runtime-Wahrheit ausdrücklich."
      : "Alle Execution-Flags bleiben `false`: kein Render, keine Queue, kein Worker, kein Providerlauf, keine Kosten und kein Upload.",
    userVisibleReason: explicitRuntimeTruthBlocked
      ? "Die Runtime-Wahrheit fehlt weiterhin."
      : "Es gibt weiterhin keine aktive Runtime für diesen Pfad.",
    evidenceRefs: [
      input.requestDraft?.requestDraftId,
      input.queuePreview?.queuePreviewId,
      input.costPolicyPreview?.policyPreviewId,
      input.assetPackDraft?.assetPackDraftId,
      input.providerSelectionDraft?.providerSelectionDraftId,
    ],
    nextAction: "wait_for_runtime",
  });
}

function buildPublishGate(input: {
  gate: VoxyRenderReviewDecisionGateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
}) {
  return buildGate({
    gateKey: "publish",
    status: "no_go",
    blockerSeverity: "info",
    reviewerVisibleReason:
      input.gate?.publicSafeLabel ||
      input.handoffModel?.publicSafeLabel ||
      "Veröffentlichung bleibt in diesem Slice immer blockiert und ist nicht Teil der Runtime-Freigabe.",
    userVisibleReason:
      "Dieser Slice ist keine Veröffentlichung, kein Upload, kein Social Posting und kein Scheduling.",
    evidenceRefs: [input.gate?.decisionGateId, input.handoffModel?.summary],
    nextAction: "wait_for_runtime",
  });
}

function buildMatrixStatus(input: {
  keepAsScriptOnly: boolean;
  explicitRuntimeTruthBlocked: boolean;
  reviewGate: VoxyRenderRuntimeGoNogoGate;
  providerGate: VoxyRenderRuntimeGoNogoGate;
  assetGate: VoxyRenderRuntimeGoNogoGate;
  queueGate: VoxyRenderRuntimeGoNogoGate;
  costCreditGate: VoxyRenderRuntimeGoNogoGate;
  languageGate: VoxyRenderRuntimeGoNogoGate;
  runtimeGate: VoxyRenderRuntimeGoNogoGate;
  publishGate: VoxyRenderRuntimeGoNogoGate;
}) {
  if (input.keepAsScriptOnly) return "keep_as_script_only" as const;
  if (input.explicitRuntimeTruthBlocked) return "blocked_by_runtime_truth" as const;
  const domainBlockers = [
    input.reviewGate,
    input.providerGate,
    input.assetGate,
    input.costCreditGate,
    input.languageGate,
  ].some((gate) => gate.status === "no_go");
  if (input.reviewGate.status === "no_go") return "blocked_by_review" as const;
  if (input.providerGate.status === "no_go") return "blocked_by_provider" as const;
  if (input.assetGate.status === "no_go") return "blocked_by_assets" as const;
  if (input.costCreditGate.status === "no_go") return "blocked_by_cost_credit" as const;
  if (input.languageGate.status === "no_go") return "blocked_by_language" as const;
  if (!domainBlockers && input.runtimeGate.status === "no_go") return "runtime_no_go" as const;
  if (input.queueGate.status === "no_go") return "blocked_by_queue" as const;
  if (input.publishGate.status === "no_go") return "blocked_by_publish_guard" as const;
  return "go_nogo_preview_only" as const;
}

function buildOverallDecision(input: {
  keepAsScriptOnly: boolean;
  reviewGate: VoxyRenderRuntimeGoNogoGate;
  providerGate: VoxyRenderRuntimeGoNogoGate;
  assetGate: VoxyRenderRuntimeGoNogoGate;
  queueGate: VoxyRenderRuntimeGoNogoGate;
  costCreditGate: VoxyRenderRuntimeGoNogoGate;
  languageGate: VoxyRenderRuntimeGoNogoGate;
  runtimeGate: VoxyRenderRuntimeGoNogoGate;
}) {
  if (input.keepAsScriptOnly) return "keep_as_script_only" as const;
  if (input.reviewGate.status === "no_go") return "review_needed" as const;
  const domainNoGo =
    input.providerGate.status === "no_go" ||
    input.assetGate.status === "no_go" ||
    input.costCreditGate.status === "no_go" ||
    input.languageGate.status === "no_go";
  const structuralOnly =
    !domainNoGo &&
    input.queueGate.status === "no_go" &&
    input.runtimeGate.status === "no_go";
  if (structuralOnly) return "runtime_not_available" as const;
  if (domainNoGo || input.queueGate.status === "no_go") return "no_go" as const;
  return "future_runtime_review_only" as const;
}

function buildNextRecommendedAction(input: {
  keepAsScriptOnly: boolean;
  reviewGate: VoxyRenderRuntimeGoNogoGate;
  providerGate: VoxyRenderRuntimeGoNogoGate;
  assetGate: VoxyRenderRuntimeGoNogoGate;
  costCreditGate: VoxyRenderRuntimeGoNogoGate;
  languageGate: VoxyRenderRuntimeGoNogoGate;
  queueGate: VoxyRenderRuntimeGoNogoGate;
  runtimeGate: VoxyRenderRuntimeGoNogoGate;
}) {
  if (input.keepAsScriptOnly) return "keep_as_script_only" as const;
  if (input.reviewGate.status === "no_go") return input.reviewGate.nextAction;
  if (input.languageGate.status === "no_go") return "review_language" as const;
  if (input.providerGate.status === "no_go") return "configure_provider" as const;
  if (input.assetGate.status === "no_go") return "prepare_assets" as const;
  if (input.costCreditGate.status === "no_go") return "define_cost_policy" as const;
  if (input.queueGate.status === "no_go" || input.runtimeGate.status === "no_go") {
    return "wait_for_runtime" as const;
  }
  return "blocked" as const;
}

function compactGateLine(gate: VoxyRenderRuntimeGoNogoGate) {
  return `${gate.label}: ${voxyRenderRuntimeGoNogoGateStatusLabel(gate.status)} · ${gate.userVisibleReason}`;
}

function buildTopBlockers(gates: VoxyRenderRuntimeGoNogoGate[]) {
  return uniqueStrings(
    gates
      .filter((gate) => gate.status === "no_go")
      .flatMap((gate) => [gate.userVisibleReason, gate.reviewerVisibleReason])
      .slice(0, 12),
  );
}

export function buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels(
  input: BuildMatrixInput,
): VoxyRenderRuntimeGoNogoMatrixRecord {
  const requestDraft =
    input.requestDraft === undefined
      ? buildVoxyRenderRequestDraftFromReadmodels({
          surface: input.surface,
          gate: input.gate ?? null,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
          adapterModel: input.adapterModel ?? null,
        })
      : input.requestDraft;
  const queuePreview =
    input.queuePreview === undefined
      ? buildVoxyRenderQueuePreviewFromReadmodels({
          surface: input.surface,
          requestDraft,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          gate: input.gate ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
          adapterModel: input.adapterModel ?? null,
        })
      : input.queuePreview;
  const costPolicyPreview =
    input.costPolicyPreview === undefined
      ? buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
          surface: input.surface,
          requestDraft,
          queuePreview,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
          adapterModel: input.adapterModel ?? null,
          gate: input.gate ?? null,
        })
      : input.costPolicyPreview;
  const assetPackDraft =
    input.assetPackDraft === undefined
      ? buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
          surface: input.surface,
          requestDraft,
          queuePreview,
          costPolicyPreview,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          gate: input.gate ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
        })
      : input.assetPackDraft;
  const providerSelectionDraft =
    input.providerSelectionDraft === undefined
      ? buildVoxyRenderProviderSelectionDraftFromReadmodels({
          surface: input.surface,
          requestDraft,
          queuePreview,
          costPolicyPreview,
          assetPackDraft,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          gate: input.gate ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
          adapterModel: input.adapterModel ?? null,
        })
      : input.providerSelectionDraft;

  const languages = buildLanguages({
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate: input.gate ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
  });
  const keepAsScriptOnly =
    requestDraft?.requestStatus === "keep_as_script_only" ||
    queuePreview?.queueStatus === "keep_as_script_only" ||
    costPolicyPreview?.policyStatus === "keep_as_script_only" ||
    assetPackDraft?.assetPackStatus === "keep_as_script_only" ||
    providerSelectionDraft?.providerSelectionStatus === "keep_as_script_only" ||
    input.gate?.decisionStatus === "keep_as_script_only" ||
    input.preflightModel?.preflightStatus === "keep_as_script_only" ||
    input.adapterModel?.adapterStatus === "keep_as_script_only";

  const reviewGate = buildReviewGate({
    requestDraft,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate: input.gate ?? null,
    keepAsScriptOnly,
  });
  const providerGate = buildProviderGate({
    requestDraft,
    providerSelectionDraft,
    preflightModel: input.preflightModel ?? null,
    adapterModel: input.adapterModel ?? null,
    keepAsScriptOnly,
  });
  const assetGate = buildAssetGate({
    requestDraft,
    assetPackDraft,
    keepAsScriptOnly,
  });
  const queueGate = buildQueueGate({
    requestDraft,
    queuePreview,
    keepAsScriptOnly,
  });
  const costCreditGate = buildCostCreditGate({
    requestDraft,
    costPolicyPreview,
    keepAsScriptOnly,
  });
  const languageGate = buildLanguageGate({
    providerSelectionDraft,
    gate: input.gate ?? null,
    sourceLanguage: languages.sourceLanguage,
    readingLanguage: languages.readingLanguage,
    scriptLanguage: languages.scriptLanguage,
    renderLanguage: languages.renderLanguage,
    subtitleLanguage: languages.subtitleLanguage,
    rtlRequired: languages.rtlRequired,
    crossLingual: languages.crossLingual,
  });
  const runtimeGate = buildRuntimeGate({
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    preflightModel: input.preflightModel ?? null,
    adapterModel: input.adapterModel ?? null,
    keepAsScriptOnly,
  });
  const publishGate = buildPublishGate({
    gate: input.gate ?? null,
    handoffModel: input.handoffModel ?? null,
  });
  const explicitRuntimeTruthBlocked =
    runtimeGate.blockerSeverity === "blocker" &&
    runtimeGate.reviewerVisibleReason.includes("Runtime-Wahrheit");
  const matrixStatus = buildMatrixStatus({
    keepAsScriptOnly,
    explicitRuntimeTruthBlocked,
    reviewGate,
    providerGate,
    assetGate,
    queueGate,
    costCreditGate,
    languageGate,
    runtimeGate,
    publishGate,
  });
  const overallDecision = buildOverallDecision({
    keepAsScriptOnly,
    reviewGate,
    providerGate,
    assetGate,
    queueGate,
    costCreditGate,
    languageGate,
    runtimeGate,
  });
  const nextRecommendedAction = buildNextRecommendedAction({
    keepAsScriptOnly,
    reviewGate,
    providerGate,
    assetGate,
    costCreditGate,
    languageGate,
    queueGate,
    runtimeGate,
  });
  const topBlockers = buildTopBlockers([
    reviewGate,
    providerGate,
    assetGate,
    queueGate,
    costCreditGate,
    languageGate,
    runtimeGate,
    publishGate,
  ]);
  const persistedAt = input.persistedAt ?? null;
  const primaryRefSource =
    requestDraft ?? queuePreview ?? costPolicyPreview ?? assetPackDraft ?? providerSelectionDraft;
  return {
    matrixId: `voxy-render-runtime-go-nogo-matrix:${sanitizeIdFragment(
      `${input.surface}:${requestDraft?.requestDraftId ?? requestDraft?.decisionGateId ?? primaryRefSource?.decisionGateId ?? "preview"}:${matrixStatus}`,
    )}`,
    providerSelectionDraftId: providerSelectionDraft?.providerSelectionDraftId ?? null,
    assetPackDraftId: assetPackDraft?.assetPackDraftId ?? null,
    costPolicyPreviewId: costPolicyPreview?.policyPreviewId ?? null,
    queuePreviewId: queuePreview?.queuePreviewId ?? null,
    requestDraftId: requestDraft?.requestDraftId ?? null,
    decisionId: input.latestDecisionRecord?.decisionId ?? requestDraft?.decisionId ?? null,
    decisionGateId: input.gate?.decisionGateId ?? requestDraft?.decisionGateId ?? primaryRefSource?.decisionGateId ?? null,
    handoffRef: requestDraft?.handoffRef ?? null,
    preflightRef: requestDraft?.preflightRef ?? null,
    registryRef: requestDraft?.registryRef ?? null,
    adapterRef: requestDraft?.adapterRef ?? null,
    scriptRef: requestDraft?.scriptRef ?? null,
    contributionRef: requestDraft?.contributionRef ?? null,
    dossierRef: requestDraft?.dossierRef ?? null,
    videoFormat: "briefing_video",
    sourceLanguage: languages.sourceLanguage,
    readingLanguage: languages.readingLanguage,
    scriptLanguage: languages.scriptLanguage,
    renderLanguage: languages.renderLanguage,
    subtitleLanguage: languages.subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: languages.rtlRequired,
    surface: input.surface,
    matrixStatus,
    reviewGate,
    providerGate,
    assetGate,
    queueGate,
    costCreditGate,
    languageGate,
    runtimeGate,
    publishGate,
    overallDecision,
    topBlockers,
    nextRecommendedAction,
    nextStep: buildNextStep(nextRecommendedAction),
    execution: buildExecutionFlags(),
    persistedAt,
    persistedBy: input.persistedBy ?? null,
    idempotencyKey: null,
    previousMatrixRef: null,
    supersedesMatrixRef: null,
    matrixVersion: null,
  };
}

export function buildVoxyRenderRuntimeGoNogoMatrixCommandFromPreview(
  preview: VoxyRenderRuntimeGoNogoMatrixRecord,
  overrides?: Partial<Pick<VoxyRenderRuntimeGoNogoMatrixCommand, "createdAt" | "createdBy">>,
): VoxyRenderRuntimeGoNogoMatrixCommand {
  return {
    ...preview,
    createdAt: overrides?.createdAt ?? preview.persistedAt ?? null,
    createdBy: overrides?.createdBy ?? preview.persistedBy ?? null,
  };
}

export function buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(
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
  return buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels({
    surface: "create",
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    gate,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
  });
}

export function buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestQueuePreview?: VoxyRenderQueuePreviewRecord | null;
  latestCostPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestAssetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
}) {
  const handoffModel = buildVoxyRenderProviderHandoffFromReviewContext(input.reviewContext);
  const preflightModel = buildVoxyRenderPreflightReadinessFromReviewContext(input.reviewContext);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromReviewContext(input.reviewContext);
  const adapterModel = buildVoxyRenderAdapterNoopFromReviewContext(input.reviewContext);
  const gate = buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext);
  return buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels({
    surface: "admin",
    requestDraft:
      input.latestRequestDraft ?? buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext),
    queuePreview:
      input.latestQueuePreview ?? buildVoxyRenderQueuePreviewFromReviewContext(input.reviewContext),
    costPolicyPreview:
      input.latestCostPolicyPreview ??
      buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(input.reviewContext),
    assetPackDraft:
      input.latestAssetPackDraft ??
      buildVoxyRenderAssetPackDraftPreviewFromReviewContext(input.reviewContext),
    providerSelectionDraft:
      input.latestProviderSelectionDraft ??
      buildVoxyRenderProviderSelectionDraftFromReviewContext(input.reviewContext),
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
  });
}

export function buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    contributionRef?: MatrixRef | null;
    nextStep?: string;
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
  return buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels({
    surface: "account",
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    gate,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
  });
}

export function buildVoxyRenderRuntimeGoNogoMatrixPanelModel(input: {
  preview: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  persistenceState?: VoxyRenderRuntimeGoNogoMatrixPersistenceState | null;
  latestRecord?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  if (!input.preview) return null;
  const persistenceState = input.persistenceState ?? defaultPersistenceState();
  const gateRows = [
    input.preview.reviewGate,
    input.preview.providerGate,
    input.preview.assetGate,
    input.preview.queueGate,
    input.preview.costCreditGate,
    input.preview.languageGate,
    input.preview.runtimeGate,
    input.preview.publishGate,
  ];
  return {
    title: "Runtime Go/No-Go",
    summary:
      "Die Matrix verdichtet Review, Provider, Assets, Queue, Kosten & Credits, Sprache, Runtime und Veröffentlichung zu einer ehrlichen No-Execution-Lesart.",
    preview: input.preview,
    matrixStatusLabel: voxyRenderRuntimeGoNogoMatrixStatusLabel(input.preview.matrixStatus),
    overallDecisionLabel: voxyRenderRuntimeGoNogoOverallDecisionLabel(
      input.preview.overallDecision,
    ),
    nextRecommendedActionLabel: voxyRenderRuntimeGoNogoNextActionLabel(
      input.preview.nextRecommendedAction,
    ),
    storeStateLabel: persistenceState.label,
    storeStateSummary: persistenceState.summary,
    latestRecord: input.latestRecord
      ? {
          matrixId: input.latestRecord.matrixId,
          statusLabel: voxyRenderRuntimeGoNogoMatrixStatusLabel(input.latestRecord.matrixStatus),
          overallDecisionLabel: voxyRenderRuntimeGoNogoOverallDecisionLabel(
            input.latestRecord.overallDecision,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          matrixVersion: input.latestRecord.matrixVersion,
          requestDraftId: input.latestRecord.requestDraftId,
        }
      : null,
    blockedReasons: input.preview.topBlockers,
    auditLines: [
      `Matrix: ${voxyRenderRuntimeGoNogoMatrixStatusLabel(input.preview.matrixStatus)}`,
      `Gesamtentscheidung: ${voxyRenderRuntimeGoNogoOverallDecisionLabel(input.preview.overallDecision)}`,
      ...gateRows.map(compactGateLine),
    ],
    nextStep: input.preview.nextStep,
    gateRows,
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderRuntimeGoNogoMatrixPanelModel;
}
