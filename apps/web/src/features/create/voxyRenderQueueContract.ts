import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import type {
  VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import type {
  VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import type {
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderAdapterNoopModel,
} from "@/features/create/voxyRenderAdapterNoopContract";
import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReadmodels,
  buildVoxyRenderRequestDraftFromVoxyDialog,
  type VoxyRenderRequestDraftRecord,
  type VoxyRenderRequestDraftRequirementItem,
} from "@/features/create/voxyRenderRequestDraftContract";

export const VOXY_RENDER_QUEUE_PREVIEW_STATUSES = [
  "queue_contract_only",
  "disabled_preview",
  "blocked_by_missing_request_draft",
  "blocked_by_missing_review",
  "blocked_by_missing_provider",
  "blocked_by_missing_assets",
  "blocked_by_missing_cost_policy",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderQueuePreviewStatus =
  (typeof VOXY_RENDER_QUEUE_PREVIEW_STATUSES)[number];

export const VOXY_RENDER_QUEUE_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "disabled",
  "blocked",
] as const;

export type VoxyRenderQueueStoreResultStatus =
  (typeof VOXY_RENDER_QUEUE_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_QUEUE_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderQueuePersistenceMode =
  (typeof VOXY_RENDER_QUEUE_PERSISTENCE_MODES)[number];

type QueueSurface = "create" | "account" | "admin" | "workspace";

type QueueRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderQueueExecutionFlags = {
  queueEnabled: false;
  createsQueueJob: false;
  workerExecutionAllowed: false;
  providerExecutionAllowed: false;
  mediaFileCreationAllowed: false;
  costDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderQueuePreviewRecord = {
  queuePreviewId: string;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  handoffRef: QueueRef | null;
  preflightRef: QueueRef | null;
  registryRef: QueueRef | null;
  adapterRef: QueueRef | null;
  scriptRef: QueueRef | null;
  contributionRef: QueueRef | null;
  dossierRef: QueueRef | null;
  surface: QueueSurface;
  videoFormat: "briefing_video";
  queueStatus: VoxyRenderQueuePreviewStatus;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  providerRequirements: VoxyRenderRequestDraftRequirementItem[];
  assetRequirements: VoxyRenderRequestDraftRequirementItem[];
  costRequirements: VoxyRenderRequestDraftRequirementItem[];
  reviewRequirements: VoxyRenderRequestDraftRequirementItem[];
  publicSafetyRequirements: VoxyRenderRequestDraftRequirementItem[];
  estimatedRuntimeRequirements: VoxyRenderRequestDraftRequirementItem[];
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  execution: VoxyRenderQueueExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousQueuePreviewRef: string | null;
  supersedesQueuePreviewRef: string | null;
  queueVersion: number | null;
};

export type VoxyRenderQueuePreviewCommand = Omit<
  VoxyRenderQueuePreviewRecord,
  "persistedAt" | "persistedBy" | "idempotencyKey" | "previousQueuePreviewRef" | "supersedesQueuePreviewRef" | "queueVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderQueueStoreResult = {
  ok: boolean;
  status: VoxyRenderQueueStoreResultStatus;
  record: VoxyRenderQueuePreviewRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderQueuePersistenceState = {
  mode: VoxyRenderQueuePersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderQueuePreviewRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderQueuePanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderQueuePreviewRecord;
  queueStatusLabel: string;
  videoFormatLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    queuePreviewId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    queueVersion: number | null;
    requestDraftId: string | null;
  } | null;
  blockedReasons: string[];
  auditLines: string[];
  nextStep: string;
  executionFlags: VoxyRenderQueueExecutionFlags;
};

type BuildQueuePreviewInput = {
  surface: QueueSurface;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  allowRequestDraftSynthesis?: boolean;
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

function requirementStatusLabel(value: VoxyRenderRequestDraftRequirementItem["status"]) {
  if (value === "ready") return "Bereit";
  if (value === "needs_review") return "Review nötig";
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "missing") return "Fehlt";
  return "Blockiert";
}

function buildRequirementItem(input: {
  id: string;
  label: string;
  status: VoxyRenderRequestDraftRequirementItem["status"];
  reason: string;
}) {
  return {
    id: input.id,
    label: input.label,
    status: input.status,
    statusLabel: requirementStatusLabel(input.status),
    reason: normalizeText(input.reason) || "Runtime-Anforderung bleibt offen.",
  } satisfies VoxyRenderRequestDraftRequirementItem;
}

function defaultPersistenceState(): VoxyRenderQueuePersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Queue-Preview-Store im Surface",
    summary:
      "Dieses Surface zeigt nur den disabled Render-Queue-Vertrag. Echte Queue- oder Worker-Runtime existiert hier bewusst nicht.",
    repositoryInterface: "VoxyRenderQueuePreviewRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

export function voxyRenderQueuePreviewStatusLabel(value: VoxyRenderQueuePreviewStatus) {
  if (value === "queue_contract_only") return "Nur Queue-Vertrag";
  if (value === "disabled_preview") return "Disabled Preview";
  if (value === "blocked_by_missing_request_draft") return "Ohne Request-Draft blockiert";
  if (value === "blocked_by_missing_review") return "Ohne Review-Freigaben blockiert";
  if (value === "blocked_by_missing_provider") return "Ohne Provider-Anforderungen blockiert";
  if (value === "blocked_by_missing_assets") return "Ohne Pflichtassets blockiert";
  if (value === "blocked_by_missing_cost_policy") return "Ohne Cost-Policy blockiert";
  if (value === "blocked_by_runtime_truth") return "Ohne Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

export function buildVoxyRenderQueueExecutionFlags(): VoxyRenderQueueExecutionFlags {
  return {
    queueEnabled: false,
    createsQueueJob: false,
    workerExecutionAllowed: false,
    providerExecutionAllowed: false,
    mediaFileCreationAllowed: false,
    costDebitAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildPreviewQueueId(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  surface: QueueSurface;
}) {
  return `voxy-render-queue-preview:${sanitizeIdFragment(
    input.requestDraft?.requestDraftId ??
      input.latestDecisionRecord?.decisionId ??
      input.gate?.decisionGateId ??
      `${input.surface}-preview`,
  )}`;
}

function buildEstimatedRuntimeRequirements() {
  return [
    buildRequirementItem({
      id: "queue_runtime_missing",
      label: "Queue-Runtime fehlt",
      status: "missing",
      reason: "Es existiert bewusst keine echte Voxy-Render-Queue in diesem Slice.",
    }),
    buildRequirementItem({
      id: "worker_runtime_missing",
      label: "Worker-Runtime fehlt",
      status: "missing",
      reason: "Es existiert bewusst kein Voxy-Render-Worker und kein Hintergrundlauf.",
    }),
    buildRequirementItem({
      id: "provider_runtime_missing",
      label: "Provider-Ausführung fehlt",
      status: "missing",
      reason: "Avatar-, Voice- und Render-Provider bleiben unverdrahtet und ohne Calls.",
    }),
    buildRequirementItem({
      id: "media_runtime_missing",
      label: "Medien-Output fehlt",
      status: "missing",
      reason: "Es gibt keine Video-, Audio- oder Asset-Dateierzeugung in diesem Slice.",
    }),
    buildRequirementItem({
      id: "cost_runtime_missing",
      label: "Kosten- und Credit-Runtime fehlt",
      status: "missing",
      reason: "Es gibt keine Billing-, Credit- oder Cost-Debit-Runtime.",
    }),
    buildRequirementItem({
      id: "publish_runtime_missing",
      label: "Upload- und Publish-Runtime fehlt",
      status: "missing",
      reason: "Upload, Veröffentlichung, Social Posting und Scheduling bleiben bewusst unverdrahtet.",
    }),
  ];
}

function hasAnyRequirementStatus(
  items: VoxyRenderRequestDraftRequirementItem[],
  statuses: VoxyRenderRequestDraftRequirementItem["status"][],
) {
  return items.some((item) => statuses.includes(item.status));
}

function buildQueueStatus(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
}) {
  if (!input.requestDraft) return "blocked_by_missing_request_draft";
  if (
    input.requestDraft.requestStatus === "keep_as_script_only" ||
    input.latestDecisionRecord?.selectedDecision === "keep_as_script_only" ||
    input.latestDecisionRecord?.selectedDecision === "block_render_path"
  ) {
    return "keep_as_script_only";
  }
  if (input.requestDraft.requestStatus === "blocked_by_missing_review") {
    return "blocked_by_missing_review";
  }
  if (input.requestDraft.requestStatus === "blocked_by_missing_provider") {
    return "blocked_by_missing_provider";
  }
  if (input.requestDraft.requestStatus === "blocked_by_missing_assets") {
    return "blocked_by_missing_assets";
  }
  if (input.requestDraft.requestStatus === "blocked_by_missing_cost_policy") {
    return "blocked_by_missing_cost_policy";
  }
  if (
    input.requestDraft.requestStatus === "blocked_by_runtime_truth" ||
    input.gate?.decisionStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (
    input.requestDraft.requestStatus === "draft_only" ||
    input.requestDraft.requestStatus === "audit_preview"
  ) {
    return "disabled_preview";
  }
  if (
    hasAnyRequirementStatus(input.requestDraft.reviewRequirements, ["needs_review", "missing", "blocked"])
  ) {
    return "blocked_by_missing_review";
  }
  if (
    hasAnyRequirementStatus(input.requestDraft.providerRequirements, ["missing", "blocked"])
  ) {
    return "blocked_by_missing_provider";
  }
  if (hasAnyRequirementStatus(input.requestDraft.assetRequirements, ["missing", "blocked"])) {
    return "blocked_by_missing_assets";
  }
  if (
    hasAnyRequirementStatus(input.requestDraft.costRequirements, ["needs_review", "missing", "blocked"])
  ) {
    return "blocked_by_missing_cost_policy";
  }
  return "queue_contract_only";
}

function buildSummary(queueStatus: VoxyRenderQueuePreviewStatus) {
  if (queueStatus === "queue_contract_only") {
    return "Der Vertrag beschreibt nur, wie ein späterer Render-Job technisch geprüft und in eine Queue überführt würde. Heute bleibt alles disabled.";
  }
  if (queueStatus === "disabled_preview") {
    return "Die Queue-Lesart bleibt eine disabled Vorschau. Es wird nichts eingereiht und kein Worker gestartet.";
  }
  if (queueStatus === "keep_as_script_only") {
    return "Die dokumentierte Entscheidung hält bewusst vor Queue, Worker und Render-Lauf an.";
  }
  return "Der Queue-Vertrag zeigt nur den blockierten technischen Jobrahmen und startet nichts.";
}

function buildBlockedReasons(preview: VoxyRenderQueuePreviewRecord) {
  if (preview.queueStatus === "blocked_by_missing_request_draft") {
    return [
      "Ohne Render-Request-Draft bleibt der Queue-Vertrag rein hypothetisch und schreibt keinen Job vor.",
    ];
  }
  if (preview.queueStatus === "keep_as_script_only") {
    return ["Die dokumentierte Entscheidung hält bewusst vor Queue und Render-Lauf an."];
  }
  if (preview.queueStatus === "blocked_by_missing_review") {
    return preview.reviewRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.queueStatus === "blocked_by_missing_provider") {
    return preview.providerRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.queueStatus === "blocked_by_missing_assets") {
    return preview.assetRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.queueStatus === "blocked_by_missing_cost_policy") {
    return preview.costRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (preview.queueStatus === "blocked_by_runtime_truth") {
    return [
      "Es fehlen echte Queue-, Worker-, Provider-, Medien-, Kosten- und Publish-Runtimes.",
    ];
  }
  return [
    "Der Vertrag bleibt bewusst disabled: keine Queue, kein Worker, kein Providerlauf, keine Datei, keine Kosten, keine Veröffentlichung.",
  ];
}

function fallbackRequestDraft(input: BuildQueuePreviewInput) {
  if (input.allowRequestDraftSynthesis === false) return null;
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: input.surface,
    gate: input.gate ?? null,
    latestDecisionRecord: input.latestDecisionRecord ?? null,
    handoffModel: input.handoffModel ?? null,
    preflightModel: input.preflightModel ?? null,
    registryModel: input.registryModel ?? null,
    adapterModel: input.adapterModel ?? null,
    persistedAt: input.persistedAt ?? null,
    persistedBy: input.persistedBy ?? null,
  });
}

export function buildVoxyRenderQueuePreviewFromReadmodels(
  input: BuildQueuePreviewInput,
): VoxyRenderQueuePreviewRecord | null {
  const requestDraft = input.requestDraft ?? fallbackRequestDraft(input);
  if (!requestDraft && !input.gate && !input.latestDecisionRecord) return null;

  const gate = input.gate ?? null;
  const latestDecisionRecord = input.latestDecisionRecord ?? null;
  const queueStatus = buildQueueStatus({
    requestDraft,
    latestDecisionRecord,
    gate,
  });
  const nextStep =
    queueStatus === "queue_contract_only"
      ? "Queue-Vertrag prüfen und spätere Runtime separat freigeben"
      : queueStatus === "keep_as_script_only"
        ? "Script-only dokumentiert lassen"
        : "Blocker im Request-Draft oder in der fehlenden Runtime klären";

  return {
    queuePreviewId: buildPreviewQueueId({
      requestDraft,
      latestDecisionRecord,
      gate,
      surface: input.surface,
    }),
    requestDraftId: requestDraft?.requestDraftId ?? null,
    decisionId: requestDraft?.decisionId ?? latestDecisionRecord?.decisionId ?? null,
    decisionGateId:
      requestDraft?.decisionGateId ??
      gate?.decisionGateId ??
      latestDecisionRecord?.decisionGateId ??
      null,
    handoffRef: requestDraft?.handoffRef ?? gate?.handoffRef ?? latestDecisionRecord?.handoffRef ?? null,
    preflightRef:
      requestDraft?.preflightRef ?? gate?.preflightRef ?? latestDecisionRecord?.preflightRef ?? null,
    registryRef:
      requestDraft?.registryRef ?? gate?.registryRef ?? latestDecisionRecord?.registryRef ?? null,
    adapterRef:
      requestDraft?.adapterRef ?? gate?.adapterRef ?? latestDecisionRecord?.adapterRef ?? null,
    scriptRef: requestDraft?.scriptRef ?? gate?.scriptRef ?? latestDecisionRecord?.scriptRef ?? null,
    contributionRef:
      requestDraft?.contributionRef ?? gate?.contributionRef ?? latestDecisionRecord?.contributionRef ?? null,
    dossierRef: requestDraft?.dossierRef ?? gate?.dossierRef ?? latestDecisionRecord?.dossierRef ?? null,
    surface: input.surface,
    videoFormat: "briefing_video",
    queueStatus,
    sourceLanguage: requestDraft?.sourceLanguage ?? gate?.sourceLanguage ?? latestDecisionRecord?.sourceLanguage ?? "de",
    readingLanguage:
      requestDraft?.readingLanguage ?? gate?.readingLanguage ?? latestDecisionRecord?.readingLanguage ?? "de",
    scriptLanguage:
      requestDraft?.scriptLanguage ?? gate?.scriptLanguage ?? latestDecisionRecord?.scriptLanguage ?? "de",
    renderLanguage:
      requestDraft?.renderLanguage ?? gate?.renderLanguage ?? latestDecisionRecord?.renderLanguage ?? "de",
    subtitleLanguage:
      requestDraft?.subtitleLanguage ?? gate?.subtitleLanguage ?? latestDecisionRecord?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: requestDraft?.rtlRequired ?? false,
    providerRequirements: requestDraft?.providerRequirements ?? [],
    assetRequirements: requestDraft?.assetRequirements ?? [],
    costRequirements: requestDraft?.costRequirements ?? [],
    reviewRequirements: requestDraft?.reviewRequirements ?? [],
    publicSafetyRequirements: requestDraft?.publicSafetyRequirements ?? [],
    estimatedRuntimeRequirements: buildEstimatedRuntimeRequirements(),
    userVisibleReason:
      "Dieser Queue-Vertrag beschreibt nur den späteren technischen Jobrahmen. Es wird nichts eingereiht oder gestartet.",
    reviewerVisibleReason:
      "Der Vertrag bündelt Request-Draft, Decision, Handoff, Preflight, Registry und Adapter zu einem disabled Queue-Preview ohne Queue, Worker, Provider, Medien, Kosten oder Publishing.",
    nextStep,
    execution: buildVoxyRenderQueueExecutionFlags(),
    persistedAt: normalizeText(input.persistedAt) || null,
    persistedBy: normalizeText(input.persistedBy) || null,
    idempotencyKey: null,
    previousQueuePreviewRef: null,
    supersedesQueuePreviewRef: null,
    queueVersion: null,
  };
}

export function buildVoxyRenderQueuePreviewCommandFromPreview(
  preview: VoxyRenderQueuePreviewRecord,
  options?: {
    createdAt?: string | null;
    createdBy?: string | null;
  },
): VoxyRenderQueuePreviewCommand {
  return {
    ...preview,
    createdAt: normalizeText(options?.createdAt) || null,
    createdBy: normalizeText(options?.createdBy) || null,
  };
}

export function buildVoxyRenderQueuePreviewFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderQueuePreviewFromReadmodels({
    surface: "create",
    requestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
    handoffModel: buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model),
    preflightModel: buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model),
    registryModel: buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model),
    adapterModel: buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderQueuePreviewFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience: "admin" | "workspace";
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    contributionRef?: QueueRef | null;
    dossierRef?: QueueRef | null;
    outputRef?: QueueRef | null;
  },
) {
  const audience = options?.audience ?? "admin";
  return buildVoxyRenderQueuePreviewFromReadmodels({
    surface: audience,
    requestDraft: options?.latestRequestDraftRecord ?? null,
    allowRequestDraftSynthesis: false,
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
    gate: buildVoxyRenderReviewDecisionGateFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromReviewContext(context, {
      audience,
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
  });
}

export function buildVoxyRenderQueuePreviewFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    contributionRef?: QueueRef | null;
    dossierRef?: QueueRef | null;
    outputRef?: QueueRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  return buildVoxyRenderQueuePreviewFromReadmodels({
    surface: "account",
    requestDraft:
      options?.latestRequestDraftRecord ??
      buildVoxyRenderRequestDraftFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        contributionRef,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
        nextStep: options?.nextStep,
      }),
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
    gate: buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, {
      contributionRef,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromVoxyDialog(dialog, {
      contributionRef,
      outputRef: options?.outputRef ?? null,
      nextStep: options?.nextStep,
    }),
  });
}

export function buildVoxyRenderQueuePanelModel(input: {
  preview: VoxyRenderQueuePreviewRecord | null;
  latestRecord?: VoxyRenderQueuePreviewRecord | null;
  storeState?: VoxyRenderQueuePersistenceState | null;
}) {
  if (!input.preview) return null;
  const latestRecord = input.latestRecord ?? null;
  const storeState = input.storeState ?? defaultPersistenceState();
  const blockedReasons = buildBlockedReasons(input.preview);

  return {
    title: "Render-Queue-Vertrag",
    summary: buildSummary(input.preview.queueStatus),
    preview: input.preview,
    queueStatusLabel: voxyRenderQueuePreviewStatusLabel(input.preview.queueStatus),
    videoFormatLabel: "Briefing-Video",
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          queuePreviewId: latestRecord.queuePreviewId,
          statusLabel: voxyRenderQueuePreviewStatusLabel(latestRecord.queueStatus),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          queueVersion: latestRecord.queueVersion,
          requestDraftId: latestRecord.requestDraftId,
        }
      : null,
    blockedReasons,
    auditLines: uniqueStrings([
      `Videoformat: Briefing-Video`,
      `Status: ${voxyRenderQueuePreviewStatusLabel(input.preview.queueStatus)}`,
      input.preview.requestDraftId ? `Request-Draft: ${input.preview.requestDraftId}` : null,
      input.preview.decisionGateId ? `Decision-Gate: ${input.preview.decisionGateId}` : null,
      latestRecord?.persistedAt ? `Zuletzt gespeichert: ${latestRecord.persistedAt}` : null,
      latestRecord?.persistedBy ? `Von: ${latestRecord.persistedBy}` : null,
      "Keine Queue, kein Worker, kein Providerlauf, keine Datei, keine Kosten, kein Upload, kein Publish.",
    ]),
    nextStep: input.preview.nextStep,
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderQueuePanelModel;
}
