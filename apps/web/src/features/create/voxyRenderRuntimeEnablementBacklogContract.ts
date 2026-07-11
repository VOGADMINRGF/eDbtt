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
  VoxyRenderRuntimeGoNogoGateKey,
  VoxyRenderRuntimeGoNogoMatrixPersistenceState,
  VoxyRenderRuntimeGoNogoMatrixRecord,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview,
  buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels,
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
  voxyRenderRuntimeGoNogoMatrixStatusLabel,
  voxyRenderRuntimeGoNogoOverallDecisionLabel,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_STATUSES = [
  "enablement_backlog_only",
  "runtime_planning_only",
  "no_runtime_enabled",
  "blocked_by_missing_matrix",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderRuntimeEnablementBacklogStatus =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_CATEGORIES = [
  "provider",
  "secrets",
  "adapter",
  "assets",
  "voice",
  "subtitles",
  "lower_thirds",
  "source_captions",
  "export_preset",
  "language_rtl",
  "cost_pricing",
  "credits_limits",
  "metering",
  "queue",
  "worker",
  "admin_gate",
  "preview_review",
  "publish_guard",
  "observability",
  "security",
  "documentation",
] as const;

export type VoxyRenderRuntimeEnablementBacklogCategory =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_CATEGORIES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_ITEM_STATUSES = [
  "todo",
  "blocked",
  "needs_decision",
  "needs_runtime",
  "needs_review",
  "requirement_only",
] as const;

export type VoxyRenderRuntimeEnablementBacklogItemStatus =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_ITEM_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_PRIORITIES = [
  "p0",
  "p1",
  "p2",
  "p3",
] as const;

export type VoxyRenderRuntimeEnablementBacklogPriority =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_PRIORITIES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_SOURCE_GATES = [
  "review",
  "provider",
  "assets",
  "queue",
  "cost_credit",
  "language",
  "runtime",
  "publish",
] as const;

export type VoxyRenderRuntimeEnablementBacklogSourceGate =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_BACKLOG_SOURCE_GATES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_RUNTIME_IMPACTS = [
  "none",
  "requires_config",
  "requires_secret",
  "requires_worker",
  "requires_provider",
  "requires_billing",
  "requires_media_storage",
  "requires_admin_approval",
] as const;

export type VoxyRenderRuntimeEnablementRuntimeImpact =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_RUNTIME_IMPACTS)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_NEXT_ACTIONS = [
  "define_provider_strategy",
  "prepare_asset_templates",
  "define_cost_metering",
  "define_queue_worker_architecture",
  "define_admin_enablement_gate",
  "define_preview_review_flow",
  "keep_as_script_only",
  "wait_for_runtime",
  "blocked",
] as const;

export type VoxyRenderRuntimeEnablementNextAction =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_NEXT_ACTIONS)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderRuntimeEnablementStoreResultStatus =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_RUNTIME_ENABLEMENT_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderRuntimeEnablementPersistenceMode =
  (typeof VOXY_RENDER_RUNTIME_ENABLEMENT_PERSISTENCE_MODES)[number];

type BacklogSurface = "create" | "account" | "admin" | "workspace";

type BacklogRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderRuntimeEnablementBacklogItem = {
  itemId: string;
  category: VoxyRenderRuntimeEnablementBacklogCategory;
  title: string;
  status: VoxyRenderRuntimeEnablementBacklogItemStatus;
  priority: VoxyRenderRuntimeEnablementBacklogPriority;
  dependencyKeys: string[];
  sourceGate: VoxyRenderRuntimeEnablementBacklogSourceGate;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  acceptanceCriteria: string[];
  nonGoals: string[];
  runtimeImpact: VoxyRenderRuntimeEnablementRuntimeImpact;
  executionAllowed: false;
  implemented: false;
};

export type VoxyRenderRuntimeEnablementExecutionFlags = {
  runtimeEnabled: false;
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

export type VoxyRenderRuntimeEnablementBacklogRecord = {
  backlogId: string;
  matrixId: string | null;
  providerSelectionDraftId: string | null;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  scriptRef: BacklogRef | null;
  contributionRef: BacklogRef | null;
  dossierRef: BacklogRef | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  surface: BacklogSurface;
  backlogStatus: VoxyRenderRuntimeEnablementBacklogStatus;
  items: VoxyRenderRuntimeEnablementBacklogItem[];
  topP0Items: string[];
  nextRecommendedAction: VoxyRenderRuntimeEnablementNextAction;
  reviewerVisibleSummary: string;
  userVisibleSummary: string;
  execution: VoxyRenderRuntimeEnablementExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousBacklogRef: string | null;
  supersedesBacklogRef: string | null;
  backlogVersion: number | null;
};

export type VoxyRenderRuntimeEnablementBacklogCommand = Omit<
  VoxyRenderRuntimeEnablementBacklogRecord,
  "persistedAt" | "persistedBy" | "idempotencyKey" | "previousBacklogRef" | "supersedesBacklogRef" | "backlogVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderRuntimeEnablementStoreResult = {
  ok: boolean;
  status: VoxyRenderRuntimeEnablementStoreResultStatus;
  record: VoxyRenderRuntimeEnablementBacklogRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderRuntimeEnablementBacklogPersistenceState = {
  mode: VoxyRenderRuntimeEnablementPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderRuntimeEnablementBacklogRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderRuntimeEnablementBacklogPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderRuntimeEnablementBacklogRecord;
  backlogStatusLabel: string;
  nextRecommendedActionLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    backlogId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    backlogVersion: number | null;
    matrixId: string | null;
  } | null;
  topP0Items: string[];
  blockedReasons: string[];
  nextStep: string;
  categorySections: Array<{
    key: string;
    title: string;
    items: Array<
      VoxyRenderRuntimeEnablementBacklogItem & {
        categoryLabel: string;
        statusLabel: string;
        priorityLabel: string;
        runtimeImpactLabel: string;
        sourceGateLabel: string;
      }
    >;
  }>;
  auditLines: string[];
  executionFlags: VoxyRenderRuntimeEnablementExecutionFlags;
};

type BuildBacklogInput = {
  surface: BacklogSurface;
  matrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
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

const COMMON_NON_GOALS = [
  "Kein Rendering",
  "Kein Provider-Aufruf",
  "Keine Queue-Ausführung",
  "Keine Secrets lesen",
  "Keine Kostenbuchung",
  "Keine Veröffentlichung",
] as const;

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

function buildExecutionFlags(): VoxyRenderRuntimeEnablementExecutionFlags {
  return {
    runtimeEnabled: false,
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

function defaultPersistenceState(): VoxyRenderRuntimeEnablementBacklogPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Runtime-Enablement-Backlog-Store im Surface",
    summary:
      "Dieses Surface zeigt nur einen review-first Enablement-Backlog. Es gibt bewusst keine Runtime, keine Queue, keinen Providerlauf, keine Secrets und kein Publishing.",
    repositoryInterface: "VoxyRenderRuntimeEnablementBacklogRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function buildPersistenceStateFromMatrix(
  matrixPersistenceState: VoxyRenderRuntimeGoNogoMatrixPersistenceState | null | undefined,
): VoxyRenderRuntimeEnablementBacklogPersistenceState {
  if (!matrixPersistenceState) return defaultPersistenceState();
  return {
    mode: matrixPersistenceState.mode,
    label:
      matrixPersistenceState.mode === "persistent_primary"
        ? "Persistenter Runtime-Enablement-Backlog"
        : matrixPersistenceState.mode === "in_memory_fallback"
          ? "In-Memory-Fallback für Runtime-Enablement-Backlog"
          : "Kein Runtime-Enablement-Backlog-Store im Surface",
    summary:
      matrixPersistenceState.mode === "persistent_primary"
        ? "Enablement-Backlogs und Audit-Spuren werden getrennt von Render, Queue, Provider, Kosten und Publishing gespeichert."
        : matrixPersistenceState.mode === "in_memory_fallback"
          ? "Nur Dev-/Test-/Fallback: Enablement-Backlogs leben pro Prozess und sind keine belastbare Produktionswahrheit."
          : defaultPersistenceState().summary,
    repositoryInterface: "VoxyRenderRuntimeEnablementBacklogRepository",
    storeKind: matrixPersistenceState.storeKind,
    productionTruth: matrixPersistenceState.productionTruth,
    restartReconstructable: matrixPersistenceState.restartReconstructable,
    deploymentReconstructable: matrixPersistenceState.deploymentReconstructable,
    adminWritePath: matrixPersistenceState.adminWritePath,
  };
}

export function voxyRenderRuntimeEnablementBacklogStatusLabel(
  value: VoxyRenderRuntimeEnablementBacklogStatus,
) {
  if (value === "runtime_planning_only") return "Nur Runtime-Planung";
  if (value === "no_runtime_enabled") return "Noch keine Runtime";
  if (value === "blocked_by_missing_matrix") return "Ohne Matrix blockiert";
  if (value === "blocked_by_runtime_truth") return "Durch Runtime-Wahrheit blockiert";
  if (value === "keep_as_script_only") return "Bewusst Script-only";
  return "Enablement-Backlog";
}

export function voxyRenderRuntimeEnablementItemStatusLabel(
  value: VoxyRenderRuntimeEnablementBacklogItemStatus,
) {
  if (value === "todo") return "Offen";
  if (value === "blocked") return "Blockiert";
  if (value === "needs_decision") return "Entscheidung nötig";
  if (value === "needs_runtime") return "Braucht Runtime";
  if (value === "needs_review") return "Review nötig";
  return "Nur Anforderung";
}

export function voxyRenderRuntimeEnablementPriorityLabel(
  value: VoxyRenderRuntimeEnablementBacklogPriority,
) {
  if (value === "p0") return "P0";
  if (value === "p1") return "P1";
  if (value === "p2") return "P2";
  return "P3";
}

export function voxyRenderRuntimeEnablementCategoryLabel(
  value: VoxyRenderRuntimeEnablementBacklogCategory,
) {
  return {
    provider: "Provider",
    secrets: "Secrets & Konfiguration",
    adapter: "Adapter",
    assets: "Assets",
    voice: "Voice",
    subtitles: "Untertitel",
    lower_thirds: "Lower Thirds",
    source_captions: "Source Captions",
    export_preset: "Export-Preset",
    language_rtl: "Sprache & RTL",
    cost_pricing: "Kosten & Pricing",
    credits_limits: "Credits & Limits",
    metering: "Metering",
    queue: "Queue",
    worker: "Worker",
    admin_gate: "Admin-Gate",
    preview_review: "Preview Review",
    publish_guard: "Publish-Guard",
    observability: "Observability",
    security: "Security",
    documentation: "Dokumentation",
  }[value];
}

export function voxyRenderRuntimeEnablementRuntimeImpactLabel(
  value: VoxyRenderRuntimeEnablementRuntimeImpact,
) {
  return {
    none: "Kein Laufzeitbedarf",
    requires_config: "Braucht Konfiguration",
    requires_secret: "Braucht Secret-Pfad",
    requires_worker: "Braucht Worker/Queue",
    requires_provider: "Braucht Provider",
    requires_billing: "Braucht Billing/Metering",
    requires_media_storage: "Braucht Medien-/Template-Pfad",
    requires_admin_approval: "Braucht Admin-Freigabe",
  }[value];
}

export function voxyRenderRuntimeEnablementSourceGateLabel(
  value: VoxyRenderRuntimeEnablementBacklogSourceGate,
) {
  if (value === "cost_credit") return "Kosten & Credits";
  return {
    review: "Review",
    provider: "Provider",
    assets: "Assets",
    queue: "Queue",
    language: "Sprache & RTL",
    runtime: "Runtime",
    publish: "Veröffentlichung",
  }[value];
}

export function voxyRenderRuntimeEnablementNextActionLabel(
  value: VoxyRenderRuntimeEnablementNextAction,
) {
  return {
    define_provider_strategy: "Provider-Strategie definieren",
    prepare_asset_templates: "Asset-Templates vorbereiten",
    define_cost_metering: "Kosten & Metering definieren",
    define_queue_worker_architecture: "Queue- & Worker-Architektur definieren",
    define_admin_enablement_gate: "Admin-Enablement-Gate definieren",
    define_preview_review_flow: "Preview-Review-Flow definieren",
    keep_as_script_only: "Bei Script-only bleiben",
    wait_for_runtime: "Auf Runtime warten",
    blocked: "Blocker manuell klären",
  }[value];
}

function buildLanguages(input: {
  matrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
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
    input.matrix?.sourceLanguage ??
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
    input.matrix?.readingLanguage ??
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
    input.matrix?.scriptLanguage ??
    input.providerSelectionDraft?.scriptLanguage ??
    input.assetPackDraft?.scriptLanguage ??
    input.costPolicyPreview?.scriptLanguage ??
    input.queuePreview?.scriptLanguage ??
    input.requestDraft?.scriptLanguage ??
    input.latestDecisionRecord?.scriptLanguage ??
    input.gate?.scriptLanguage ??
    input.handoffModel?.scriptLanguage ??
    input.preflightModel?.scriptLanguage ??
    sourceLanguage;
  const renderLanguage =
    input.matrix?.renderLanguage ??
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
    input.matrix?.subtitleLanguage ??
    input.providerSelectionDraft?.subtitleLanguage ??
    input.assetPackDraft?.subtitleLanguage ??
    input.costPolicyPreview?.subtitleLanguage ??
    input.queuePreview?.subtitleLanguage ??
    input.requestDraft?.subtitleLanguage ??
    input.latestDecisionRecord?.subtitleLanguage ??
    input.gate?.subtitleLanguage ??
    input.preflightModel?.subtitleLanguage ??
    readingLanguage;
  const rtlRequired =
    input.matrix?.rtlRequired ??
    input.providerSelectionDraft?.rtlRequired ??
    input.assetPackDraft?.rtlRequired ??
    input.costPolicyPreview?.rtlRequired ??
    input.queuePreview?.rtlRequired ??
    input.requestDraft?.rtlRequired ??
    (isRtlLanguage(sourceLanguage) ||
      isRtlLanguage(readingLanguage) ||
      isRtlLanguage(scriptLanguage) ||
      isRtlLanguage(renderLanguage) ||
      isRtlLanguage(subtitleLanguage));
  return {
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    rtlRequired,
    crossLingual:
      sourceLanguage !== readingLanguage ||
      sourceLanguage !== scriptLanguage ||
      renderLanguage !== scriptLanguage ||
      (subtitleLanguage != null && subtitleLanguage !== renderLanguage),
  } as const;
}

function buildBaseDependencies(
  input: {
    matrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
    requestDraft?: VoxyRenderRequestDraftRecord | null;
    queuePreview?: VoxyRenderQueuePreviewRecord | null;
    costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
    assetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
    providerSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  },
  sourceGate: VoxyRenderRuntimeEnablementBacklogSourceGate,
) {
  return uniqueStrings([
    input.matrix?.matrixId ? `matrix:${input.matrix.matrixId}` : null,
    sourceGate ? `gate:${sourceGate}` : null,
    input.providerSelectionDraft?.providerSelectionDraftId
      ? `provider-selection:${input.providerSelectionDraft.providerSelectionDraftId}`
      : null,
    input.assetPackDraft?.assetPackDraftId
      ? `asset-pack:${input.assetPackDraft.assetPackDraftId}`
      : null,
    input.costPolicyPreview?.policyPreviewId
      ? `cost-policy:${input.costPolicyPreview.policyPreviewId}`
      : null,
    input.queuePreview?.queuePreviewId ? `queue-preview:${input.queuePreview.queuePreviewId}` : null,
    input.requestDraft?.requestDraftId ? `request-draft:${input.requestDraft.requestDraftId}` : null,
  ]);
}

function buildItem(
  input: {
    category: VoxyRenderRuntimeEnablementBacklogCategory;
    title: string;
    status: VoxyRenderRuntimeEnablementBacklogItemStatus;
    priority: VoxyRenderRuntimeEnablementBacklogPriority;
    sourceGate: VoxyRenderRuntimeEnablementBacklogSourceGate;
    userVisibleReason: string;
    reviewerVisibleReason: string;
    dependencyKeys: string[];
    acceptanceCriteria: string[];
    nonGoals?: string[];
    runtimeImpact: VoxyRenderRuntimeEnablementRuntimeImpact;
  },
  scopeId: string,
) {
  return {
    itemId: `voxy-render-runtime-enablement-item:${sanitizeIdFragment(
      `${scopeId}:${input.category}:${input.sourceGate}:${input.title}`,
    )}`,
    category: input.category,
    title: normalizeText(input.title) || voxyRenderRuntimeEnablementCategoryLabel(input.category),
    status: input.status,
    priority: input.priority,
    dependencyKeys: uniqueStrings(input.dependencyKeys),
    sourceGate: input.sourceGate,
    userVisibleReason:
      normalizeText(input.userVisibleReason) ||
      "Dieses Enablement-Thema bleibt bewusst offen und aktiviert keine Runtime.",
    reviewerVisibleReason:
      normalizeText(input.reviewerVisibleReason) ||
      "Dieses Enablement-Thema bleibt review-first offen und aktiviert keine Runtime.",
    acceptanceCriteria: uniqueStrings(input.acceptanceCriteria),
    nonGoals: uniqueStrings([...(input.nonGoals ?? []), ...COMMON_NON_GOALS]),
    runtimeImpact: input.runtimeImpact,
    executionAllowed: false,
    implemented: false,
  } satisfies VoxyRenderRuntimeEnablementBacklogItem;
}

function priorityRank(value: VoxyRenderRuntimeEnablementBacklogPriority) {
  if (value === "p0") return 0;
  if (value === "p1") return 1;
  if (value === "p2") return 2;
  return 3;
}

function gateBlocked(
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord,
  gateKey: VoxyRenderRuntimeEnablementBacklogSourceGate,
) {
  const gate =
    gateKey === "review"
      ? matrix.reviewGate
      : gateKey === "provider"
        ? matrix.providerGate
        : gateKey === "assets"
          ? matrix.assetGate
          : gateKey === "queue"
            ? matrix.queueGate
            : gateKey === "cost_credit"
              ? matrix.costCreditGate
              : gateKey === "language"
                ? matrix.languageGate
                : gateKey === "runtime"
                  ? matrix.runtimeGate
                  : matrix.publishGate;
  return gate.status === "no_go" || gate.status === "warning" || gate.status === "unknown";
}

function addUniqueItem(
  items: VoxyRenderRuntimeEnablementBacklogItem[],
  item: VoxyRenderRuntimeEnablementBacklogItem,
) {
  if (!items.some((candidate) => candidate.itemId === item.itemId)) {
    items.push(item);
  }
}

function buildBacklogItems(input: {
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
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
  languages: ReturnType<typeof buildLanguages>;
}) {
  if (!input.matrix) return [];

  const items: VoxyRenderRuntimeEnablementBacklogItem[] = [];
  const scopeId = input.matrix.decisionGateId ?? input.matrix.matrixId ?? input.matrix.surface;
  const keepAsScriptOnly = input.matrix.overallDecision === "keep_as_script_only";
  if (keepAsScriptOnly) return items;

  const providerReason = uniqueStrings([
    input.matrix.providerGate.userVisibleReason,
    input.providerSelectionDraft?.decision?.userVisibleReason,
    ...(input.providerSelectionDraft?.blockers ?? []),
    ...(input.providerSelectionDraft?.inventoryFindings ?? []),
    input.preflightModel?.userVisibleReason,
  ]).join(" ");
  const providerReviewerReason = uniqueStrings([
    input.matrix.providerGate.reviewerVisibleReason,
    input.providerSelectionDraft?.decision?.reviewerVisibleReason,
    ...(input.providerSelectionDraft?.gateHints ?? []),
    ...(input.providerSelectionDraft?.inventoryFindings ?? []),
    input.preflightModel?.reviewerVisibleReason,
    input.adapterModel?.reviewerVisibleReason,
  ]).join(" ");

  const assetReason = uniqueStrings([
    input.matrix.assetGate.userVisibleReason,
    input.assetPackDraft?.userVisibleReason,
  ]).join(" ");
  const assetReviewerReason = uniqueStrings([
    input.matrix.assetGate.reviewerVisibleReason,
    input.assetPackDraft?.reviewerVisibleReason,
  ]).join(" ");

  const costReason = uniqueStrings([
    input.matrix.costCreditGate.userVisibleReason,
    input.costPolicyPreview?.userVisibleReason,
  ]).join(" ");
  const costReviewerReason = uniqueStrings([
    input.matrix.costCreditGate.reviewerVisibleReason,
    input.costPolicyPreview?.reviewerVisibleReason,
  ]).join(" ");

  const queueReason = uniqueStrings([
    input.matrix.queueGate.userVisibleReason,
    input.queuePreview?.userVisibleReason,
  ]).join(" ");
  const queueReviewerReason = uniqueStrings([
    input.matrix.queueGate.reviewerVisibleReason,
    input.queuePreview?.reviewerVisibleReason,
  ]).join(" ");

  const reviewReason = uniqueStrings([
    input.matrix.reviewGate.userVisibleReason,
    input.gate?.userVisibleReason,
  ]).join(" ");
  const reviewReviewerReason = uniqueStrings([
    input.matrix.reviewGate.reviewerVisibleReason,
    input.gate?.reviewerVisibleReason,
  ]).join(" ");

  const languageReason = uniqueStrings([
    input.matrix.languageGate.userVisibleReason,
    input.providerSelectionDraft?.decision?.userVisibleReason,
  ]).join(" ");
  const languageReviewerReason = uniqueStrings([
    input.matrix.languageGate.reviewerVisibleReason,
    input.providerSelectionDraft?.decision?.reviewerVisibleReason,
  ]).join(" ");

  const runtimeReason = uniqueStrings([
    input.matrix.runtimeGate.userVisibleReason,
    input.preflightModel?.userVisibleReason,
    input.adapterModel?.userVisibleReason,
  ]).join(" ");
  const runtimeReviewerReason = uniqueStrings([
    input.matrix.runtimeGate.reviewerVisibleReason,
    input.preflightModel?.reviewerVisibleReason,
    input.adapterModel?.reviewerVisibleReason,
  ]).join(" ");

  const publishReason = uniqueStrings([
    input.matrix.publishGate.userVisibleReason,
    input.gate?.publicSafeLabel,
  ]).join(" ");
  const publishReviewerReason = uniqueStrings([
    input.matrix.publishGate.reviewerVisibleReason,
    input.gate?.reviewerVisibleReason,
  ]).join(" ");

  if (gateBlocked(input.matrix, "provider")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "provider",
          title: "Provider-Strategie für Avatar-, Voice- und Preview-Render definieren",
          status: "needs_decision",
          priority: "p0",
          sourceGate: "provider",
          userVisibleReason:
            providerReason ||
            "Ohne definierte Provider-Strategie bleibt jeder spätere Renderlauf verboten.",
          reviewerVisibleReason:
            providerReviewerReason ||
            "Provider-Strategie, Zuständigkeit und Scope sind noch nicht reviewbar definiert.",
          dependencyKeys: buildBaseDependencies(input, "provider"),
          acceptanceCriteria: [
            "Mindestens ein erlaubter Providerpfad ist reviewbar dokumentiert, ohne Provider aufzurufen.",
            "Provider-Zuständigkeit, Scope und Guardrails sind vom späteren Runtime-Pfad getrennt beschrieben.",
          ],
          runtimeImpact: "requires_provider",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "adapter",
          title: "Adapter-Vertrag für spätere Provider-Ausführung konkretisieren",
          status: "todo",
          priority: "p1",
          sourceGate: "provider",
          userVisibleReason:
            providerReason ||
            "Der Adapter bleibt Noop und braucht einen echten Enablement-Folgepfad.",
          reviewerVisibleReason:
            providerReviewerReason ||
            "Adapter-Schnittstelle, Fehlerpfade und Review-Grenzen bleiben unterhalb jeder Ausführung offen.",
          dependencyKeys: buildBaseDependencies(input, "provider"),
          acceptanceCriteria: [
            "Adapter-Ein-/Ausgaben, Fehlerpfade und Nicht-Ziele sind typed und reviewbar beschrieben.",
            "Kein Adapterpfad behauptet Provider-Konfiguration oder Ausführung.",
          ],
          runtimeImpact: "requires_config",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "secrets",
          title: "Secret- und Konfigurationspfad für spätere Provider-Freigabe definieren",
          status: "needs_runtime",
          priority: "p0",
          sourceGate: "provider",
          userVisibleReason:
            providerReason ||
            "Ohne Secret- und Konfigurationspfad darf kein Providerlauf entstehen.",
          reviewerVisibleReason:
            providerReviewerReason ||
            "Secret-Zuständigkeit, Betriebsgrenze und Admin-Freigabe sind noch nicht belastbar beschrieben.",
          dependencyKeys: buildBaseDependencies(input, "provider"),
          acceptanceCriteria: [
            "Benötigte Secret-Arten, Betreiberpfad und Audit-Grenzen sind dokumentiert, ohne Secrets zu lesen.",
            "Ein späterer Runtime-Pfad bleibt explizit getrennt von dieser Backlog-Schicht.",
          ],
          runtimeImpact: "requires_secret",
        },
        scopeId,
      ),
    );
    if (!gateBlocked(input.matrix, "cost_credit")) {
      addUniqueItem(
        items,
        buildItem(
          {
            category: "cost_pricing",
            title: "Provider-spezifische Preisquelle für spätere Renderläufe definieren",
            status: "needs_decision",
            priority: "p1",
            sourceGate: "provider",
            userVisibleReason:
              providerReason ||
              "Ohne belastbare Preisquelle bleibt auch ein formaler Providerpfad unvollständig.",
            reviewerVisibleReason:
              providerReviewerReason ||
              "Providerwahl und Preisquelle sind noch nicht belastbar gekoppelt.",
            dependencyKeys: buildBaseDependencies(input, "provider"),
            acceptanceCriteria: [
              "Eine belastbare Preisquelle ist pro erlaubtem Providerpfad dokumentiert.",
              "Die Preisquelle behauptet weder Billing-Runtime noch Debit.",
            ],
            runtimeImpact: "requires_billing",
          },
          scopeId,
        ),
      );
    }
  }

  if (gateBlocked(input.matrix, "assets")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "assets",
          title: "Asset-Paket und Template-Inventar für Render-Preview konkretisieren",
          status: "todo",
          priority: "p0",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Ohne belastbares Asset-Paket bleibt der Renderpfad rein planerisch.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Asset-Inventar, Template-Lücken und Abhängigkeiten sind noch nicht runtime-fähig vorbereitet.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Benötigte Assets, Vorlagen und fehlende Lücken sind je Kategorie reviewbar dokumentiert.",
            "Kein Asset-Eintrag behauptet erzeugte Datei-, Export- oder Upload-Wahrheit.",
          ],
          runtimeImpact: "requires_media_storage",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "voice",
          title: "Voice-Profil- und Sprachpfad für spätere Render-Preview definieren",
          status: "todo",
          priority: "p1",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Voice-Profile fehlen weiter und werden in diesem Slice nicht erzeugt.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Voice-Presets, Sprachprofile und ihre Review-Grenzen fehlen weiter.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Voice-Profilanforderungen sind je Sprache dokumentiert.",
            "Kein Voice-Eintrag behauptet erzeugte Audio-Dateien oder Provider-Voice.",
          ],
          runtimeImpact: "requires_provider",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "subtitles",
          title: "Untertitel-Template und Caption-Regeln vorbereiten",
          status: "todo",
          priority: "p1",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Ohne Untertitel-Template bleibt die Preview-Planung unvollständig.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Subtitle-Vorlage, Einblendungsregeln und Reviewgrenzen fehlen noch.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Untertitel-Vorlage und Caption-Regeln sind typed beschrieben.",
            "Es wird keine Untertitel-Datei erzeugt oder hochgeladen.",
          ],
          runtimeImpact: "requires_media_storage",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "lower_thirds",
          title: "Lower-Third-Template für spätere Preview-Läufe definieren",
          status: "todo",
          priority: "p2",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Lower-Third-Vorlagen sind weiter nur als Bedarf sichtbar.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Lower-Third-Design und Regelwerk bleiben Requirement-only.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Lower-Third-Felder, Platzhalter und Review-Grenzen sind dokumentiert.",
            "Es entsteht kein gerendertes Bauchbinden-Asset.",
          ],
          runtimeImpact: "requires_media_storage",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "source_captions",
          title: "Source-Caption-Vorlage für quellennahe Einblendungen definieren",
          status: "todo",
          priority: "p2",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Quellennahe Einblendungen bleiben ohne feste Vorlage offen.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Source-Caption-Regeln, Beleggrenzen und Layout fehlen weiter.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Source-Caption-Slots und Evidenzgrenzen sind beschrieben.",
            "Translation bleibt Lesehilfe und kein Evidence-Ersatz.",
          ],
          runtimeImpact: "requires_media_storage",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "export_preset",
          title: "Export-Preset und Ausgabeformat für spätere Preview-Renders definieren",
          status: "todo",
          priority: "p2",
          sourceGate: "assets",
          userVisibleReason:
            assetReason || "Ohne Export-Preset bleibt der Medienpfad rein planerisch.",
          reviewerVisibleReason:
            assetReviewerReason ||
            "Export-Eigenschaften, Grenzen und Nicht-Ziele sind noch nicht strukturiert beschrieben.",
          dependencyKeys: buildBaseDependencies(input, "assets"),
          acceptanceCriteria: [
            "Ein typed Export-Preset ist beschrieben, ohne Medien zu erzeugen.",
            "Kein Export-Eintrag behauptet Datei-, Upload- oder Publish-Wahrheit.",
          ],
          runtimeImpact: "requires_media_storage",
        },
        scopeId,
      ),
    );
  }

  if (gateBlocked(input.matrix, "queue")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "queue",
          title: "Review-first Queue-Architektur für spätere Preview-Renders definieren",
          status: "needs_runtime",
          priority: "p0",
          sourceGate: "queue",
          userVisibleReason:
            queueReason || "Die Queue bleibt disabled und darf heute nicht starten.",
          reviewerVisibleReason:
            queueReviewerReason ||
            "Queue-Vertrag, Freigabegate und Betriebsgrenzen bleiben disabled.",
          dependencyKeys: buildBaseDependencies(input, "queue"),
          acceptanceCriteria: [
            "Queue-Eingang, Admin-Gates und Fehlerpfade sind dokumentiert.",
            "Kein Queue-Item startet Jobs, Scheduling oder Providerläufe.",
          ],
          runtimeImpact: "requires_worker",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "worker",
          title: "Worker- und Retry-Modell für spätere Preview-Renders definieren",
          status: "needs_runtime",
          priority: "p1",
          sourceGate: "queue",
          userVisibleReason:
            queueReason || "Ohne Worker-Modell bleibt jeder Renderpfad nur geplant.",
          reviewerVisibleReason:
            queueReviewerReason ||
            "Worker, Retry, Dead-Letter und Audit-Grenzen sind nicht implementiert.",
          dependencyKeys: buildBaseDependencies(input, "queue"),
          acceptanceCriteria: [
            "Worker-Lifecycle, Retry und Fehlerzustände sind reviewbar beschrieben.",
            "Kein Worker läuft an und kein Medienjob wird erzeugt.",
          ],
          runtimeImpact: "requires_worker",
        },
        scopeId,
      ),
    );
  }

  if (gateBlocked(input.matrix, "cost_credit")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "cost_pricing",
          title: "Pricing-Modell für Preview-Renders definieren",
          status: "needs_decision",
          priority: "p0",
          sourceGate: "cost_credit",
          userVisibleReason:
            costReason || "Kosten bleiben ohne Pricing-Quelle rein planerisch.",
          reviewerVisibleReason:
            costReviewerReason ||
            "Pricing-Quelle, Preisformat und Scope sind noch nicht reviewbar definiert.",
          dependencyKeys: buildBaseDependencies(input, "cost_credit"),
          acceptanceCriteria: [
            "Preismodell und Quelle sind dokumentiert, ohne Kosten zu buchen.",
            "Pricing bleibt klar von Billing, Debit und Publish getrennt.",
          ],
          runtimeImpact: "requires_billing",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "credits_limits",
          title: "Credit-, Limit- und Kontingentregeln für spätere Render-Preview definieren",
          status: "needs_decision",
          priority: "p1",
          sourceGate: "cost_credit",
          userVisibleReason:
            costReason || "Limits und Credits bleiben ohne klare Policy offen.",
          reviewerVisibleReason:
            costReviewerReason ||
            "Credit- und Limitpolitik ist noch nicht getrennt von Billing-Runtime festgelegt.",
          dependencyKeys: buildBaseDependencies(input, "cost_credit"),
          acceptanceCriteria: [
            "Credit-, Limit- und Kontingentlogik ist dokumentiert.",
            "Keine Policy behauptet Debit, Abrechnung oder Zugriffsentitlement.",
          ],
          runtimeImpact: "requires_billing",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "metering",
          title: "Runtime-Metering und Audit-Telemetrie für spätere Renderläufe definieren",
          status: "needs_runtime",
          priority: "p1",
          sourceGate: "cost_credit",
          userVisibleReason:
            costReason || "Ohne Metering bleibt jede Kostenaussage unvollständig.",
          reviewerVisibleReason:
            costReviewerReason ||
            "Metering- und Abrechnungsgrenzen fehlen weiter komplett.",
          dependencyKeys: buildBaseDependencies(input, "cost_credit"),
          acceptanceCriteria: [
            "Metering-Events, Verantwortlichkeit und Auditspur sind dokumentiert.",
            "Es wird weder gemessen noch abgerechnet.",
          ],
          runtimeImpact: "requires_billing",
        },
        scopeId,
      ),
    );
  }

  if (gateBlocked(input.matrix, "language")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "language_rtl",
          title: "Mehrsprachige und RTL-fähige Preview-Regeln definieren",
          status: input.languages.rtlRequired ? "needs_review" : "todo",
          priority: input.languages.rtlRequired ? "p0" : "p1",
          sourceGate: "language",
          userVisibleReason:
            languageReason ||
            "Sprach- und RTL-Fähigkeiten bleiben sichtbar, aber ohne Runtime-Beleg.",
          reviewerVisibleReason:
            languageReviewerReason ||
            "Multilingual-, Subtitle- und RTL-Annahmen brauchen belastbare Review-Grenzen.",
          dependencyKeys: buildBaseDependencies(input, "language"),
          acceptanceCriteria: [
            `Sprachen (${languageName(input.languages.sourceLanguage)} / ${languageName(input.languages.renderLanguage)}) und Untertitelregeln sind definiert.`,
            "RTL-Regeln bleiben von echter Provider- oder Subtitle-Runtime getrennt.",
          ],
          runtimeImpact: "requires_provider",
        },
        scopeId,
      ),
    );
  }

  if (gateBlocked(input.matrix, "runtime")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "admin_gate",
          title: "Admin-Enablement-Gate für spätere Preview-Renders definieren",
          status: "needs_review",
          priority: "p0",
          sourceGate: "runtime",
          userVisibleReason:
            runtimeReason || "Ohne Admin-Gate darf kein Runtime-Pfad aktiviert werden.",
          reviewerVisibleReason:
            runtimeReviewerReason ||
            "Enablement-Freigabe, Zuständigkeit und Rollback-Grenzen fehlen weiter.",
          dependencyKeys: buildBaseDependencies(input, "runtime"),
          acceptanceCriteria: [
            "Admin-Gate, Freigabezustände und Auditpflicht sind dokumentiert.",
            "Das Gate aktiviert weder Queue noch Provider noch Rendering.",
          ],
          runtimeImpact: "requires_admin_approval",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "observability",
          title: "Observability- und Failure-Signale für spätere Runtime definieren",
          status: "todo",
          priority: "p2",
          sourceGate: "runtime",
          userVisibleReason:
            runtimeReason || "Ohne Observability bleibt ein späterer Betrieb unkontrollierbar.",
          reviewerVisibleReason:
            runtimeReviewerReason ||
            "Health-Signale, Audit-Telemetrie und Failure-Kommunikation fehlen noch.",
          dependencyKeys: buildBaseDependencies(input, "runtime"),
          acceptanceCriteria: [
            "Metriken, Logs und Failure-Signale sind beschrieben.",
            "Es wird keine Monitoring-Runtime aktiviert.",
          ],
          runtimeImpact: "requires_config",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "security",
          title: "Security- und Access-Grenzen für spätere Runtime beschreiben",
          status: "todo",
          priority: "p1",
          sourceGate: "runtime",
          userVisibleReason:
            runtimeReason || "Ohne Security-Grenzen darf kein Runtime-Pfad freigeschaltet werden.",
          reviewerVisibleReason:
            runtimeReviewerReason ||
            "Zugriff, Secret-Zuständigkeit und Betreibergrenzen bleiben offen.",
          dependencyKeys: buildBaseDependencies(input, "runtime"),
          acceptanceCriteria: [
            "RBAC-, Secret- und Betreibergrenzen sind klar dokumentiert.",
            "Es werden weder Secrets gelesen noch Provider gestartet.",
          ],
          runtimeImpact: "requires_admin_approval",
        },
        scopeId,
      ),
    );
    addUniqueItem(
      items,
      buildItem(
        {
          category: "documentation",
          title: "Runtime-Enablement-Runbook und Nicht-Ziele pflegen",
          status: "requirement_only",
          priority: "p2",
          sourceGate: "runtime",
          userVisibleReason:
            runtimeReason || "Die Runtime bleibt nur als dokumentierter Folgepfad sichtbar.",
          reviewerVisibleReason:
            runtimeReviewerReason ||
            "Runbook, Nicht-Ziele und Freigabepfade brauchen eine belastbare Dokumentation.",
          dependencyKeys: buildBaseDependencies(input, "runtime"),
          acceptanceCriteria: [
            "Runbook, Guardrails und Folgepfade sind dokumentiert.",
            "Dokumentation behauptet keine aktive Runtime-Wahrheit.",
          ],
          runtimeImpact: "none",
        },
        scopeId,
      ),
    );
  }

  if (gateBlocked(input.matrix, "review") || gateBlocked(input.matrix, "publish")) {
    addUniqueItem(
      items,
      buildItem(
        {
          category: "preview_review",
          title: "Preview-Review-Flow für spätere Render-Vorschauen definieren",
          status: "needs_review",
          priority: "p0",
          sourceGate: gateBlocked(input.matrix, "review") ? "review" : "publish",
          userVisibleReason:
            reviewReason || publishReason || "Ohne Preview-Review bleibt jeder spätere Renderlauf blockiert.",
          reviewerVisibleReason:
            reviewReviewerReason ||
            publishReviewerReason ||
            "Review- und Publish-Grenzen sind noch nicht bis zur Runtime-Freigabe beschrieben.",
          dependencyKeys: uniqueStrings([
            ...buildBaseDependencies(
              input,
              gateBlocked(input.matrix, "review") ? "review" : "publish",
            ),
            "gate:preview-review",
          ]),
          acceptanceCriteria: [
            "Preview-Review-Zustände, Verantwortlichkeit und Ablehnungspfade sind dokumentiert.",
            "Review-Freigabe bleibt getrennt von Providerlauf, Queue und Publish.",
          ],
          runtimeImpact: "requires_admin_approval",
        },
        scopeId,
      ),
    );
    if (gateBlocked(input.matrix, "publish")) {
      addUniqueItem(
        items,
        buildItem(
          {
            category: "publish_guard",
            title: "Publish-Guard und Trennung zwischen Preview und Veröffentlichung definieren",
            status: "needs_review",
            priority: "p1",
            sourceGate: "publish",
            userVisibleReason:
              publishReason ||
              "Veröffentlichung bleibt bewusst getrennt von jeder späteren Preview-Runtime.",
            reviewerVisibleReason:
              publishReviewerReason ||
              "Publish-Guard, Sichtbarkeit und Exportgrenzen fehlen als belastbarer Freigabepfad.",
            dependencyKeys: buildBaseDependencies(input, "publish"),
            acceptanceCriteria: [
              "Publish-Guard und Sichtbarkeitsgrenzen sind dokumentiert.",
              "Kein Backlog-Item behauptet Publish-, Upload- oder Social-Runtime.",
            ],
            runtimeImpact: "requires_admin_approval",
          },
          scopeId,
        ),
      );
    }
  }

  return items.sort((left, right) => {
    const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return left.title.localeCompare(right.title, "de");
  });
}

function buildBacklogStatus(input: {
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
}) {
  if (!input.matrix) return "blocked_by_missing_matrix" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
  if (input.matrix.overallDecision === "keep_as_script_only") {
    return "keep_as_script_only" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
  }
  if (
    input.matrix.matrixStatus === "blocked_by_runtime_truth" ||
    input.matrix.runtimeGate.reviewerVisibleReason.includes("Runtime-Wahrheit")
  ) {
    return "blocked_by_runtime_truth" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
  }
  if (
    input.matrix.matrixStatus === "runtime_no_go" ||
    input.matrix.overallDecision === "runtime_not_available"
  ) {
    return "no_runtime_enabled" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
  }
  if (
    input.matrix.matrixStatus === "go_nogo_preview_only" ||
    input.matrix.overallDecision === "future_runtime_review_only" ||
    input.matrix.overallDecision === "review_needed"
  ) {
    return "runtime_planning_only" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
  }
  return "enablement_backlog_only" satisfies VoxyRenderRuntimeEnablementBacklogStatus;
}

function buildTopP0Items(items: VoxyRenderRuntimeEnablementBacklogItem[]) {
  return items
    .filter((item) => item.priority === "p0")
    .slice(0, 6)
    .map((item) => item.title);
}

function buildNextRecommendedAction(input: {
  backlogStatus: VoxyRenderRuntimeEnablementBacklogStatus;
  items: VoxyRenderRuntimeEnablementBacklogItem[];
}) {
  if (input.backlogStatus === "blocked_by_missing_matrix") return "blocked";
  if (input.backlogStatus === "keep_as_script_only") return "keep_as_script_only";
  if (input.backlogStatus === "blocked_by_runtime_truth") return "wait_for_runtime";
  const p0Categories = new Set(
    input.items.filter((item) => item.priority === "p0").map((item) => item.category),
  );
  if (p0Categories.has("provider") || p0Categories.has("secrets") || p0Categories.has("adapter")) {
    return "define_provider_strategy" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  if (
    p0Categories.has("assets") ||
    p0Categories.has("voice") ||
    p0Categories.has("subtitles") ||
    p0Categories.has("language_rtl")
  ) {
    return "prepare_asset_templates" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  if (
    p0Categories.has("cost_pricing") ||
    p0Categories.has("credits_limits") ||
    p0Categories.has("metering")
  ) {
    return "define_cost_metering" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  if (p0Categories.has("queue") || p0Categories.has("worker")) {
    return "define_queue_worker_architecture" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  if (
    p0Categories.has("admin_gate") ||
    p0Categories.has("security") ||
    p0Categories.has("observability")
  ) {
    return "define_admin_enablement_gate" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  if (p0Categories.has("preview_review") || p0Categories.has("publish_guard")) {
    return "define_preview_review_flow" satisfies VoxyRenderRuntimeEnablementNextAction;
  }
  return "blocked" satisfies VoxyRenderRuntimeEnablementNextAction;
}

function buildNextStep(action: VoxyRenderRuntimeEnablementNextAction) {
  return {
    define_provider_strategy:
      "Provider-Strategie, Adaptergrenzen und Secret-Pfad als reviewbare Nicht-Runtime beschreiben.",
    prepare_asset_templates:
      "Asset-, Voice-, Subtitle- und Export-Vorlagen als reine Planungsartefakte konkretisieren.",
    define_cost_metering:
      "Pricing, Limits und Metering als spätere Runtime-Abhängigkeit definieren, ohne etwas zu buchen.",
    define_queue_worker_architecture:
      "Queue- und Worker-Architektur als späteren Betriebsweg beschreiben, ohne Jobs oder Worker zu starten.",
    define_admin_enablement_gate:
      "Admin-Gate, Security und Observability für spätere Runtime-Freigaben spezifizieren.",
    define_preview_review_flow:
      "Preview-Review und Publish-Guard als klar getrennte, review-first Folgepfade definieren.",
    keep_as_script_only:
      "Beim Script-only-Pfad bleiben und keine Runtime-Versprechen aus diesem Backlog ableiten.",
    wait_for_runtime:
      "Runtime-Wahrheit fehlt weiterhin; der Backlog bleibt nur vorbereitender Folgepfad.",
    blocked:
      "Zuerst die Runtime-Go/No-Go-Matrix oder die vorgelagerten Gates belastbar vorbereiten.",
  }[action];
}

function buildSummaries(input: {
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  backlogStatus: VoxyRenderRuntimeEnablementBacklogStatus;
  items: VoxyRenderRuntimeEnablementBacklogItem[];
  languages: ReturnType<typeof buildLanguages>;
}) {
  if (!input.matrix) {
    return {
      userVisibleSummary:
        "Ohne zentrale Runtime-Go/No-Go-Matrix bleibt der Enablement-Backlog blockiert. Es wird nichts aktiviert.",
      reviewerVisibleSummary:
        "Der Backlog bleibt an der Eingangsbedingung hängen: Ohne Matrix gibt es keine belastbare Ableitung für spätere Runtime-Aufgaben.",
    };
  }
  const blockedGateLabels = [
    input.matrix.reviewGate,
    input.matrix.providerGate,
    input.matrix.assetGate,
    input.matrix.queueGate,
    input.matrix.costCreditGate,
    input.matrix.languageGate,
    input.matrix.runtimeGate,
    input.matrix.publishGate,
  ]
    .filter((gate) => gate.status === "no_go" || gate.status === "warning" || gate.status === "unknown")
    .map((gate) => gate.label);
  const p0Count = input.items.filter((item) => item.priority === "p0").length;
  const categoryCount = new Set(input.items.map((item) => item.category)).size;
  return {
    userVisibleSummary:
      input.backlogStatus === "keep_as_script_only"
        ? "Der Backlog bleibt bewusst Script-only. Fehlende Runtime-Aufgaben werden nur als späterer Folgepfad sichtbar gemacht."
        : `Der Enablement-Backlog sammelt ${input.items.length} offene Aufgaben aus ${categoryCount} Kategorien. ${p0Count} davon sind P0. Es entsteht weiterhin kein Render, keine Queue, kein Providerlauf und keine Veröffentlichung.`,
    reviewerVisibleSummary:
      input.backlogStatus === "keep_as_script_only"
        ? "Die Matrix bleibt bewusst Script-only; Enablement-Aufgaben dienen nur der späteren Planung."
        : `Ableitung aus ${voxyRenderRuntimeGoNogoMatrixStatusLabel(input.matrix.matrixStatus)} / ${voxyRenderRuntimeGoNogoOverallDecisionLabel(input.matrix.overallDecision)}. Blockierte Gate-Felder: ${blockedGateLabels.join(", ") || "keine"} · Sprache: ${languageName(input.languages.sourceLanguage)} -> ${languageName(input.languages.renderLanguage)}${input.languages.rtlRequired ? " · RTL sichtbar" : ""}.`,
  };
}

function buildBlockedReasons(items: VoxyRenderRuntimeEnablementBacklogItem[]) {
  return uniqueStrings(
    items
      .filter((item) => item.priority === "p0")
      .slice(0, 6)
      .map((item) => `${voxyRenderRuntimeEnablementCategoryLabel(item.category)}: ${item.userVisibleReason}`),
  );
}

function buildAuditLines(preview: VoxyRenderRuntimeEnablementBacklogRecord) {
  const p0Count = preview.items.filter((item) => item.priority === "p0").length;
  const runtimeImpacts = uniqueStrings(
    preview.items.map((item) => voxyRenderRuntimeEnablementRuntimeImpactLabel(item.runtimeImpact)),
  );
  return uniqueStrings([
    `Status: ${voxyRenderRuntimeEnablementBacklogStatusLabel(preview.backlogStatus)}`,
    `Top-P0: ${preview.topP0Items.length || 0}`,
    `Items: ${preview.items.length}`,
    `Runtime-Impacte: ${runtimeImpacts.join(", ") || "keine"}`,
    `P0 gesamt: ${p0Count}`,
  ]);
}

function buildCategorySections(preview: VoxyRenderRuntimeEnablementBacklogRecord) {
  const groups = [
    {
      key: "provider",
      title: "Provider & Adapter",
      categories: ["provider", "adapter"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "secrets",
      title: "Secrets & Konfiguration",
      categories: ["secrets"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "assets",
      title: "Assets & Templates",
      categories: ["assets", "lower_thirds", "source_captions", "export_preset", "documentation"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "voice",
      title: "Voice & Untertitel",
      categories: ["voice", "subtitles", "language_rtl"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "cost",
      title: "Kosten, Credits & Metering",
      categories: ["cost_pricing", "credits_limits", "metering"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "queue",
      title: "Queue & Worker",
      categories: ["queue", "worker"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "admin",
      title: "Admin-Gates",
      categories: ["admin_gate"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "preview",
      title: "Preview Review",
      categories: ["preview_review", "publish_guard"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
    {
      key: "security",
      title: "Security & Observability",
      categories: ["security", "observability"] satisfies VoxyRenderRuntimeEnablementBacklogCategory[],
    },
  ];

  return groups
    .map((group) => ({
      key: group.key,
      title: group.title,
      items: preview.items
        .filter((item) => group.categories.some((category) => category === item.category))
        .map((item) => ({
          ...item,
          categoryLabel: voxyRenderRuntimeEnablementCategoryLabel(item.category),
          statusLabel: voxyRenderRuntimeEnablementItemStatusLabel(item.status),
          priorityLabel: voxyRenderRuntimeEnablementPriorityLabel(item.priority),
          runtimeImpactLabel: voxyRenderRuntimeEnablementRuntimeImpactLabel(item.runtimeImpact),
          sourceGateLabel: voxyRenderRuntimeEnablementSourceGateLabel(item.sourceGate),
        })),
    }))
    .filter((section) => section.items.length > 0);
}

export function buildVoxyRenderRuntimeEnablementBacklogFromReadmodels(
  input: BuildBacklogInput,
): VoxyRenderRuntimeEnablementBacklogRecord {
  const matrix =
    input.matrix === undefined
      ? buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels({
          surface: input.surface,
          requestDraft: input.requestDraft,
          queuePreview: input.queuePreview,
          costPolicyPreview: input.costPolicyPreview,
          assetPackDraft: input.assetPackDraft,
          providerSelectionDraft: input.providerSelectionDraft,
          latestDecisionRecord: input.latestDecisionRecord ?? null,
          gate: input.gate ?? null,
          handoffModel: input.handoffModel ?? null,
          preflightModel: input.preflightModel ?? null,
          registryModel: input.registryModel ?? null,
          adapterModel: input.adapterModel ?? null,
        })
      : input.matrix;
  const languages = buildLanguages({
    matrix,
    requestDraft: input.requestDraft ?? null,
    queuePreview: input.queuePreview ?? null,
    costPolicyPreview: input.costPolicyPreview ?? null,
    assetPackDraft: input.assetPackDraft ?? null,
    providerSelectionDraft: input.providerSelectionDraft ?? null,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate: input.gate ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
  });
  const items = buildBacklogItems({
    matrix,
    requestDraft: input.requestDraft ?? null,
    queuePreview: input.queuePreview ?? null,
    costPolicyPreview: input.costPolicyPreview ?? null,
    assetPackDraft: input.assetPackDraft ?? null,
    providerSelectionDraft: input.providerSelectionDraft ?? null,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate: input.gate ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
    registryModel: input.registryModel ?? null,
    adapterModel: input.adapterModel ?? null,
    languages,
  });
  const backlogStatus = buildBacklogStatus({ matrix });
  const topP0Items = buildTopP0Items(items);
  const nextRecommendedAction = buildNextRecommendedAction({ backlogStatus, items });
  const summaries = buildSummaries({ matrix, backlogStatus, items, languages });
  const scopeId =
    matrix?.decisionGateId ??
    matrix?.matrixId ??
    input.requestDraft?.decisionGateId ??
    input.requestDraft?.requestDraftId ??
    input.surface;
  return {
    backlogId: `voxy-render-runtime-enablement-backlog:${sanitizeIdFragment(
      `${scopeId}:${backlogStatus}`,
    )}`,
    matrixId: matrix?.matrixId ?? null,
    providerSelectionDraftId: input.providerSelectionDraft?.providerSelectionDraftId ?? matrix?.providerSelectionDraftId ?? null,
    assetPackDraftId: input.assetPackDraft?.assetPackDraftId ?? matrix?.assetPackDraftId ?? null,
    costPolicyPreviewId: input.costPolicyPreview?.policyPreviewId ?? matrix?.costPolicyPreviewId ?? null,
    queuePreviewId: input.queuePreview?.queuePreviewId ?? matrix?.queuePreviewId ?? null,
    requestDraftId: input.requestDraft?.requestDraftId ?? matrix?.requestDraftId ?? null,
    decisionId: input.latestDecisionRecord?.decisionId ?? input.requestDraft?.decisionId ?? matrix?.decisionId ?? null,
    decisionGateId: input.gate?.decisionGateId ?? input.requestDraft?.decisionGateId ?? matrix?.decisionGateId ?? null,
    scriptRef: input.requestDraft?.scriptRef ?? matrix?.scriptRef ?? null,
    contributionRef: input.requestDraft?.contributionRef ?? matrix?.contributionRef ?? null,
    dossierRef: input.requestDraft?.dossierRef ?? matrix?.dossierRef ?? null,
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
    backlogStatus,
    items,
    topP0Items,
    nextRecommendedAction,
    reviewerVisibleSummary: summaries.reviewerVisibleSummary,
    userVisibleSummary: summaries.userVisibleSummary,
    execution: buildExecutionFlags(),
    persistedAt: input.persistedAt ?? null,
    persistedBy: input.persistedBy ?? null,
    idempotencyKey: null,
    previousBacklogRef: null,
    supersedesBacklogRef: null,
    backlogVersion: null,
  };
}

export function buildVoxyRenderRuntimeEnablementBacklogCommandFromPreview(
  preview: VoxyRenderRuntimeEnablementBacklogRecord,
  overrides?: Partial<Pick<VoxyRenderRuntimeEnablementBacklogCommand, "createdAt" | "createdBy">>,
): VoxyRenderRuntimeEnablementBacklogCommand {
  return {
    ...preview,
    createdAt: overrides?.createdAt ?? preview.persistedAt ?? null,
    createdBy: overrides?.createdBy ?? preview.persistedBy ?? null,
  };
}

export function buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(
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
  return buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
    surface: "create",
    matrix,
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

export function buildVoxyRenderRuntimeEnablementBacklogFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  latestQueuePreview?: VoxyRenderQueuePreviewRecord | null;
  latestCostPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestAssetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
  latestProviderSelectionDraft?: VoxyRenderProviderSelectionDraftRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
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
      latestDecisionRecord: input.latestDecisionRecord ?? null,
      latestRequestDraft: requestDraft,
      latestQueuePreview: queuePreview,
      latestCostPolicyPreview: costPolicyPreview,
      latestAssetPackDraft: assetPackDraft,
      latestProviderSelectionDraft: providerSelectionDraft,
    });
  return buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
    surface: "admin",
    matrix,
    requestDraft,
    queuePreview,
    costPolicyPreview,
    assetPackDraft,
    providerSelectionDraft,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    gate,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
  });
}

export function buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    contributionRef?: BacklogRef | null;
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
  const matrix = buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options);
  return buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
    surface: "account",
    matrix,
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

export function buildVoxyRenderRuntimeEnablementBacklogPanelModel(input: {
  preview: VoxyRenderRuntimeEnablementBacklogRecord | null;
  persistenceState?: VoxyRenderRuntimeEnablementBacklogPersistenceState | null;
  matrixPersistenceState?: VoxyRenderRuntimeGoNogoMatrixPersistenceState | null;
  latestRecord?: VoxyRenderRuntimeEnablementBacklogRecord | null;
}) {
  if (!input.preview) return null;
  const persistenceState =
    input.persistenceState ??
    buildPersistenceStateFromMatrix(input.matrixPersistenceState ?? null);
  return {
    title: "Runtime Enablement Backlog",
    summary: input.preview.userVisibleSummary,
    preview: input.preview,
    backlogStatusLabel: voxyRenderRuntimeEnablementBacklogStatusLabel(input.preview.backlogStatus),
    nextRecommendedActionLabel: voxyRenderRuntimeEnablementNextActionLabel(
      input.preview.nextRecommendedAction,
    ),
    storeStateLabel: persistenceState.label,
    storeStateSummary: persistenceState.summary,
    latestRecord: input.latestRecord
      ? {
          backlogId: input.latestRecord.backlogId,
          statusLabel: voxyRenderRuntimeEnablementBacklogStatusLabel(
            input.latestRecord.backlogStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          backlogVersion: input.latestRecord.backlogVersion,
          matrixId: input.latestRecord.matrixId,
        }
      : null,
    topP0Items: input.preview.topP0Items,
    blockedReasons: buildBlockedReasons(input.preview.items),
    nextStep: buildNextStep(input.preview.nextRecommendedAction),
    categorySections: buildCategorySections(input.preview),
    auditLines: buildAuditLines(input.preview),
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderRuntimeEnablementBacklogPanelModel;
}
