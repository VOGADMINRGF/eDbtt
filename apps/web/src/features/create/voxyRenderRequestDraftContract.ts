import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderDecisionRecordStatus,
  VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
  type VoxyRenderAdapterNoopModel,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
  type VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
  type VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
  type VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
  type VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";

export const VOXY_RENDER_REQUEST_DRAFT_STATUSES = [
  "draft_only",
  "audit_preview",
  "ready_for_future_runtime_review",
  "blocked_by_missing_decision",
  "blocked_by_missing_review",
  "blocked_by_missing_provider",
  "blocked_by_missing_assets",
  "blocked_by_missing_cost_policy",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderRequestDraftStatus =
  (typeof VOXY_RENDER_REQUEST_DRAFT_STATUSES)[number];

export const VOXY_RENDER_REQUEST_DRAFT_STORE_RESULT_STATUSES = [
  "stored_draft",
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderRequestDraftStoreResultStatus =
  (typeof VOXY_RENDER_REQUEST_DRAFT_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_REQUEST_DRAFT_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderRequestDraftPersistenceMode =
  (typeof VOXY_RENDER_REQUEST_DRAFT_PERSISTENCE_MODES)[number];

export const VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES = [
  "ready",
  "needs_review",
  "requirement_only",
  "missing",
  "blocked",
] as const;

export type VoxyRenderRequestDraftRequirementStatus =
  (typeof VOXY_RENDER_REQUEST_DRAFT_REQUIREMENT_STATUSES)[number];

type RequestSurface = "create" | "account" | "admin" | "workspace";

type RequestRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderRequestDraftRequirementItem = {
  id: string;
  label: string;
  status: VoxyRenderRequestDraftRequirementStatus;
  statusLabel: string;
  reason: string;
};

export type VoxyRenderRequestDraftExecutionFlags = {
  createsRenderJob: false;
  queueAllowed: false;
  providerExecutionAllowed: false;
  mediaFileCreationAllowed: false;
  costDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderRequestDraftRecord = {
  requestDraftId: string;
  decisionId: string | null;
  decisionGateId: string | null;
  surface: RequestSurface;
  contributionRef: RequestRef | null;
  dossierRef: RequestRef | null;
  scriptRef: RequestRef | null;
  handoffRef: RequestRef | null;
  preflightRef: RequestRef | null;
  registryRef: RequestRef | null;
  adapterRef: RequestRef | null;
  videoFormat: "briefing_video";
  requestStatus: VoxyRenderRequestDraftStatus;
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
  sourceFactcheckRequirements: VoxyRenderRequestDraftRequirementItem[];
  reviewerNote: string | null;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  decisionStatusSnapshot: VoxyRenderDecisionRecordStatus | null;
  execution: VoxyRenderRequestDraftExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousRequestDraftRef: string | null;
  supersedesRequestDraftRef: string | null;
  requestVersion: number | null;
};

export type VoxyRenderRequestDraftCommand = Omit<
  VoxyRenderRequestDraftRecord,
  "persistedAt" | "persistedBy" | "idempotencyKey" | "previousRequestDraftRef" | "supersedesRequestDraftRef" | "requestVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderRequestDraftStoreResult = {
  ok: boolean;
  status: VoxyRenderRequestDraftStoreResultStatus;
  record: VoxyRenderRequestDraftRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderRequestDraftPersistenceState = {
  mode: VoxyRenderRequestDraftPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderRequestDraftRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderRequestDraftPanelModel = {
  title: string;
  summary: string;
  draft: VoxyRenderRequestDraftRecord;
  requestStatusLabel: string;
  videoFormatLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    requestDraftId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    reviewerNote: string | null;
    requestVersion: number | null;
  } | null;
  blockedReasons: string[];
  auditLines: string[];
  nextStep: string;
  executionFlags: VoxyRenderRequestDraftExecutionFlags;
};

type BuildRequestDraftInput = {
  surface: RequestSurface;
  gate: VoxyRenderReviewDecisionGateModel | null;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  reviewerNote?: string | null;
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

function isRtlLanguage(language: string | null | undefined) {
  const normalized = normalizeText(language).toLowerCase();
  return normalized === "ar" || normalized === "fa" || normalized === "he" || normalized === "ur";
}

function requirementStatusLabel(value: VoxyRenderRequestDraftRequirementStatus) {
  if (value === "ready") return "Bereit";
  if (value === "needs_review") return "Review nötig";
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "missing") return "Fehlt";
  return "Blockiert";
}

export function voxyRenderRequestDraftStatusLabel(value: VoxyRenderRequestDraftStatus) {
  if (value === "draft_only") return "Nur Draft";
  if (value === "audit_preview") return "Audit-Vorschau";
  if (value === "ready_for_future_runtime_review") {
    return "Formal vorbereitet für spätere Runtime-Prüfung";
  }
  if (value === "blocked_by_missing_decision") return "Ohne Review-Entscheidung blockiert";
  if (value === "blocked_by_missing_review") return "Ohne Review-Freigaben blockiert";
  if (value === "blocked_by_missing_provider") return "Ohne Provider-Anforderungen blockiert";
  if (value === "blocked_by_missing_assets") return "Ohne Pflichtassets blockiert";
  if (value === "blocked_by_missing_cost_policy") return "Ohne Cost-Policy blockiert";
  if (value === "blocked_by_runtime_truth") return "Ohne Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

export function buildVoxyRenderRequestDraftExecutionFlags(): VoxyRenderRequestDraftExecutionFlags {
  return {
    createsRenderJob: false,
    queueAllowed: false,
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

function mapGateStatusToRequirementStatus(status: string): VoxyRenderRequestDraftRequirementStatus {
  if (status === "ready" || status === "approved" || status === "available" || status === "prepared") {
    return "ready";
  }
  if (
    status === "requirements_only" ||
    status === "requirement_only" ||
    status === "none_configured" ||
    status === "candidate_needed" ||
    status === "adapter_needed" ||
    status === "configuration_needed"
  ) {
    return "requirement_only";
  }
  if (status === "missing") return "missing";
  if (status === "blocked") return "blocked";
  return "needs_review";
}

function buildRequirementItem(input: {
  id: string;
  label: string;
  status: VoxyRenderRequestDraftRequirementStatus;
  reason: string;
}) {
  return {
    id: input.id,
    label: input.label,
    status: input.status,
    statusLabel: requirementStatusLabel(input.status),
    reason: normalizeText(input.reason) || "Review-first Anforderung.",
  } satisfies VoxyRenderRequestDraftRequirementItem;
}

function defaultPersistenceState(): VoxyRenderRequestDraftPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Request-Draft-Store im Surface",
    summary:
      "Dieses Surface zeigt nur den prüfbaren Render-Request-Draft. Echte Draft-Persistenz bleibt server-only und admin-only.",
    repositoryInterface: "VoxyRenderRequestDraftRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function buildPreviewRequestDraftId(input: {
  gate: VoxyRenderReviewDecisionGateModel | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  surface: RequestSurface;
}) {
  return `voxy-render-request-draft:${sanitizeIdFragment(
    input.latestDecisionRecord?.decisionId ??
      input.gate?.decisionGateId ??
      `${input.surface}-preview`,
  )}`;
}

function mapProviderRequirements(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
}) {
  return [
    ...(input.handoffModel?.providerTargets ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.adapterModel?.providerGateItems ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.registryModel?.providerRegistry ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reviewerVisibleReason,
      }),
    ),
  ];
}

function mapAssetRequirements(input: {
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
}) {
  return [
    ...(input.preflightModel?.requiredAssets ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.adapterModel?.requiredAssets ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.registryModel?.assetInventory ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reviewerVisibleReason,
      }),
    ),
  ];
}

function mapCostRequirements(input: {
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
}) {
  const items: VoxyRenderRequestDraftRequirementItem[] = [];
  if (input.preflightModel) {
    items.push(
      buildRequirementItem({
        id: "preflight-cost-status",
        label: input.preflightModel.costStatusLabel,
        status: mapGateStatusToRequirementStatus(input.preflightModel.costStatus),
        reason: input.preflightModel.reviewerVisibleReason,
      }),
    );
  }
  items.push(
    ...(input.adapterModel?.costGateItems ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
  );
  return items;
}

function mapReviewRequirements(input: {
  gate: VoxyRenderReviewDecisionGateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
}) {
  return [
    ...(input.gate?.reviewGates ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.handoffModel?.reviewGates ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
    ...(input.preflightModel?.reviewReadiness ?? []).map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    ),
  ];
}

function mapPublicSafetyRequirements(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
}) {
  const items: VoxyRenderRequestDraftRequirementItem[] = [
    buildRequirementItem({
      id: "no_auto_publish",
      label: "Keine Veröffentlichung",
      status: "requirement_only",
      reason:
        "Dieser Draft bleibt strikt unterhalb von Publish, Social Posting und Scheduling.",
    }),
  ];
  const publishGate = input.handoffModel?.reviewGates.find((item) => item.id === "publish_review");
  if (publishGate) {
    items.push(
      buildRequirementItem({
        id: publishGate.id,
        label: publishGate.label,
        status: mapGateStatusToRequirementStatus(publishGate.status),
        reason: publishGate.reason,
      }),
    );
  }
  if (input.gate) {
    items.push(
      buildRequirementItem({
        id: "public_safe_label",
        label: input.gate.publicSafeLabel,
        status: "requirement_only",
        reason:
          "Öffentliche Sicherheit bleibt ein Review-Hinweis und keine Veröffentlichungsfreigabe.",
      }),
    );
  }
  return items;
}

function mapSourceFactcheckRequirements(input: {
  gate: VoxyRenderReviewDecisionGateModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
}) {
  const fromPreflight = (input.preflightModel?.reviewReadiness ?? [])
    .filter((item) => item.id === "sourceReview" || item.id === "factcheckReview")
    .map((item) =>
      buildRequirementItem({
        id: item.id,
        label: item.label,
        status: mapGateStatusToRequirementStatus(item.status),
        reason: item.reason,
      }),
    );
  const blockedReasons = (input.gate?.blockedReasons ?? [])
    .filter((item) => item.toLowerCase().includes("quelle") || item.toLowerCase().includes("factcheck"))
    .map((item, index) =>
      buildRequirementItem({
        id: `gate-blocked-${index + 1}`,
        label: "Quellen- oder Factcheck-Hinweis",
        status: "needs_review",
        reason: item,
      }),
    );
  return [...fromPreflight, ...blockedReasons];
}

function hasAnyRequirementStatus(
  items: VoxyRenderRequestDraftRequirementItem[],
  statuses: VoxyRenderRequestDraftRequirementStatus[],
) {
  return items.some((item) => statuses.includes(item.status));
}

function buildStatus(input: {
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  providerRequirements: VoxyRenderRequestDraftRequirementItem[];
  assetRequirements: VoxyRenderRequestDraftRequirementItem[];
  costRequirements: VoxyRenderRequestDraftRequirementItem[];
  reviewRequirements: VoxyRenderRequestDraftRequirementItem[];
  runtimeTruthMissing: boolean;
}) {
  if (!input.latestDecisionRecord) return "blocked_by_missing_decision";
  if (
    input.latestDecisionRecord.selectedDecision === "keep_as_script_only" ||
    input.latestDecisionRecord.selectedDecision === "block_render_path"
  ) {
    return "keep_as_script_only";
  }
  if (
    input.gate?.decisionStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (
    hasAnyRequirementStatus(input.reviewRequirements, ["needs_review", "missing", "blocked"])
  ) {
    return "blocked_by_missing_review";
  }
  if (
    hasAnyRequirementStatus(input.providerRequirements, ["missing", "blocked"]) ||
    input.gate?.decisionStatus === "needs_provider_decision"
  ) {
    return "blocked_by_missing_provider";
  }
  if (
    hasAnyRequirementStatus(input.assetRequirements, ["missing", "blocked"]) ||
    input.gate?.decisionStatus === "needs_asset_decision" ||
    input.gate?.decisionStatus === "needs_brand_review"
  ) {
    return "blocked_by_missing_assets";
  }
  if (
    hasAnyRequirementStatus(input.costRequirements, ["needs_review", "missing", "blocked"]) ||
    input.gate?.decisionStatus === "needs_cost_decision"
  ) {
    return "blocked_by_missing_cost_policy";
  }
  if (input.runtimeTruthMissing) return "blocked_by_runtime_truth";
  return "ready_for_future_runtime_review";
}

function draftSummary(status: VoxyRenderRequestDraftStatus) {
  if (status === "ready_for_future_runtime_review") {
    return "Der Draft beschreibt den vollständigen, prüfbaren Renderauftrag für eine spätere, separat freizugebende Runtime. Er queued nichts.";
  }
  if (status === "keep_as_script_only") {
    return "Der Draft hält bewusst beim Script an. Es entsteht kein Renderauftrag für eine spätere Runtime.";
  }
  return "Der Draft zeigt nur, was ein späterer Renderauftrag vollständig enthalten müsste. Er startet keinen Renderjob.";
}

function buildBlockedReasons(input: {
  status: VoxyRenderRequestDraftStatus;
  providerRequirements: VoxyRenderRequestDraftRequirementItem[];
  assetRequirements: VoxyRenderRequestDraftRequirementItem[];
  costRequirements: VoxyRenderRequestDraftRequirementItem[];
  reviewRequirements: VoxyRenderRequestDraftRequirementItem[];
  gate: VoxyRenderReviewDecisionGateModel | null;
}) {
  if (input.status === "blocked_by_missing_decision") {
    return ["Ohne persistierte Review-Entscheidung bleibt der Render-Request-Draft nur Vorschau."];
  }
  if (input.status === "keep_as_script_only") {
    return ["Die dokumentierte Render-Entscheidung hält bewusst bei Script-only an."];
  }
  if (input.status === "blocked_by_missing_review") {
    return uniqueStrings([
      ...input.reviewRequirements
        .filter((item) => item.status !== "ready")
        .map((item) => `${item.label}: ${item.reason}`),
      ...(input.gate?.blockedReasons ?? []),
    ]);
  }
  if (input.status === "blocked_by_missing_provider") {
    return input.providerRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (input.status === "blocked_by_missing_assets") {
    return input.assetRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (input.status === "blocked_by_missing_cost_policy") {
    return input.costRequirements
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`);
  }
  if (input.status === "blocked_by_runtime_truth") {
    return ["Ohne echte Queue-, Provider-, Secret- und Runtime-Wahrheit bleibt der Draft rein audit- und review-first."];
  }
  return ["Der Draft bleibt vollständig ohne Queue, Providerlauf, Datei, Kostenbuchung und Veröffentlichung."];
}

export function buildVoxyRenderRequestDraftFromReadmodels(
  input: BuildRequestDraftInput,
): VoxyRenderRequestDraftRecord | null {
  if (!input.gate && !input.latestDecisionRecord) return null;

  const gate = input.gate;
  const latestDecisionRecord = input.latestDecisionRecord ?? null;
  const providerRequirements = mapProviderRequirements({
    handoffModel: input.handoffModel,
    adapterModel: input.adapterModel,
    registryModel: input.registryModel,
  });
  const assetRequirements = mapAssetRequirements({
    preflightModel: input.preflightModel,
    adapterModel: input.adapterModel,
    registryModel: input.registryModel,
  });
  const costRequirements = mapCostRequirements({
    preflightModel: input.preflightModel,
    adapterModel: input.adapterModel,
  });
  const reviewRequirements = mapReviewRequirements({
    gate,
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
  });
  const publicSafetyRequirements = mapPublicSafetyRequirements({
    handoffModel: input.handoffModel,
    gate,
  });
  const sourceFactcheckRequirements = mapSourceFactcheckRequirements({
    gate,
    preflightModel: input.preflightModel,
  });
  const runtimeTruthMissing =
    gate?.decisionStatus === "blocked_by_runtime_truth" ||
    input.handoffModel?.handoffStatus === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth" ||
    input.registryModel?.registryStatus === "blocked_by_runtime_truth" ||
    input.adapterModel?.adapterStatus === "blocked_by_runtime_truth";
  const requestStatus = buildStatus({
    latestDecisionRecord,
    gate,
    providerRequirements,
    assetRequirements,
    costRequirements,
    reviewRequirements,
    runtimeTruthMissing,
  });
  const sourceLanguage =
    latestDecisionRecord?.sourceLanguage ??
    gate?.sourceLanguage ??
    input.preflightModel?.sourceLanguage ??
    input.handoffModel?.sourceLanguage ??
    "de";
  const readingLanguage =
    latestDecisionRecord?.readingLanguage ??
    gate?.readingLanguage ??
    input.preflightModel?.readingLanguage ??
    input.handoffModel?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    latestDecisionRecord?.scriptLanguage ??
    gate?.scriptLanguage ??
    input.handoffModel?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    latestDecisionRecord?.renderLanguage ??
    gate?.renderLanguage ??
    input.preflightModel?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    latestDecisionRecord?.subtitleLanguage ??
    gate?.subtitleLanguage ??
    input.preflightModel?.subtitleLanguage ??
    null;
  const rtlRequired =
    isRtlLanguage(renderLanguage) ||
    isRtlLanguage(subtitleLanguage) ||
    isRtlLanguage(sourceLanguage) ||
    Boolean(gate?.rtlDecisionHint);
  const reviewerNote =
    normalizeText(input.reviewerNote) ||
    latestDecisionRecord?.reviewerNote ||
    null;
  const nextStep =
    requestStatus === "ready_for_future_runtime_review"
      ? "Admin-only Draft speichern und spätere Runtime-Grenzen separat prüfen"
      : requestStatus === "keep_as_script_only"
        ? "Script-only Review dokumentiert lassen"
        : "Blocker im Review, Provider-, Asset-, Cost- oder Runtime-Pfad klären";

  return {
    requestDraftId: buildPreviewRequestDraftId({
      gate,
      latestDecisionRecord,
      surface: input.surface,
    }),
    decisionId: latestDecisionRecord?.decisionId ?? null,
    decisionGateId: gate?.decisionGateId ?? latestDecisionRecord?.decisionGateId ?? null,
    surface: input.surface,
    contributionRef: gate?.contributionRef ?? latestDecisionRecord?.contributionRef ?? null,
    dossierRef: gate?.dossierRef ?? latestDecisionRecord?.dossierRef ?? null,
    scriptRef: gate?.scriptRef ?? latestDecisionRecord?.scriptRef ?? null,
    handoffRef: gate?.handoffRef ?? latestDecisionRecord?.handoffRef ?? null,
    preflightRef: gate?.preflightRef ?? latestDecisionRecord?.preflightRef ?? null,
    registryRef: gate?.registryRef ?? latestDecisionRecord?.registryRef ?? null,
    adapterRef: gate?.adapterRef ?? latestDecisionRecord?.adapterRef ?? null,
    videoFormat: "briefing_video",
    requestStatus,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired,
    providerRequirements,
    assetRequirements,
    costRequirements,
    reviewRequirements,
    publicSafetyRequirements,
    sourceFactcheckRequirements,
    reviewerNote,
    userVisibleReason:
      "Dieser Render-Request-Draft beschreibt nur den vollständigen, prüfbaren Auftrag für einen später separat freizugebenden Lauf. Es wird nichts ausgeführt.",
    reviewerVisibleReason:
      "Der Draft bündelt Decision, Handoff, Preflight, Registry und Adapter zu einem auditierbaren Paket ohne Queue, Providerlauf, Datei, Kostenbuchung oder Publishing.",
    nextStep,
    decisionStatusSnapshot: latestDecisionRecord?.status ?? null,
    execution: buildVoxyRenderRequestDraftExecutionFlags(),
    persistedAt: normalizeText(input.persistedAt) || null,
    persistedBy: normalizeText(input.persistedBy) || null,
    idempotencyKey: null,
    previousRequestDraftRef: null,
    supersedesRequestDraftRef: null,
    requestVersion: null,
  };
}

export function buildVoxyRenderRequestDraftCommandFromDraft(
  draft: VoxyRenderRequestDraftRecord,
  options?: {
    createdAt?: string | null;
    createdBy?: string | null;
  },
): VoxyRenderRequestDraftCommand {
  return {
    ...draft,
    createdAt: normalizeText(options?.createdAt) || null,
    createdBy: normalizeText(options?.createdBy) || null,
  };
}

export function buildVoxyRenderRequestDraftFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const gate = buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model);
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: "create",
    gate,
    latestDecisionRecord: null,
    handoffModel: buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model),
    preflightModel: buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model),
    registryModel: buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model),
    adapterModel: buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderRequestDraftFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience: "admin" | "workspace";
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    contributionRef?: RequestRef | null;
    dossierRef?: RequestRef | null;
    outputRef?: RequestRef | null;
  },
) {
  const gate = buildVoxyRenderReviewDecisionGateFromReviewContext(context, {
    audience: options?.audience ?? "admin",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: options?.audience ?? "admin",
    gate,
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
    handoffModel: buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience: options?.audience ?? "admin",
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromReviewContext(context, {
      audience: options?.audience ?? "admin",
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
      audience: options?.audience ?? "admin",
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromReviewContext(context, {
      audience: options?.audience ?? "admin",
      contributionRef: options?.contributionRef ?? null,
      dossierRef: options?.dossierRef ?? null,
      outputRef: options?.outputRef ?? null,
    }),
  });
}

export function buildVoxyRenderRequestDraftFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    contributionRef?: RequestRef | null;
    dossierRef?: RequestRef | null;
    outputRef?: RequestRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  const gate = buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, {
    contributionRef,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep,
  });
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: "account",
    gate,
    latestDecisionRecord: options?.latestDecisionRecord ?? null,
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

export function buildVoxyRenderRequestDraftPanelModel(input: {
  draft: VoxyRenderRequestDraftRecord | null;
  latestRecord?: VoxyRenderRequestDraftRecord | null;
  storeState?: VoxyRenderRequestDraftPersistenceState | null;
}) {
  if (!input.draft) return null;
  const latestRecord = input.latestRecord ?? null;
  const storeState = input.storeState ?? defaultPersistenceState();
  const blockedReasons = buildBlockedReasons({
    status: input.draft.requestStatus,
    providerRequirements: input.draft.providerRequirements,
    assetRequirements: input.draft.assetRequirements,
    costRequirements: input.draft.costRequirements,
    reviewRequirements: input.draft.reviewRequirements,
    gate: null,
  });

  return {
    title: "Render-Request-Draft",
    summary: draftSummary(input.draft.requestStatus),
    draft: input.draft,
    requestStatusLabel: voxyRenderRequestDraftStatusLabel(input.draft.requestStatus),
    videoFormatLabel: "Briefing-Video",
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          requestDraftId: latestRecord.requestDraftId,
          statusLabel: voxyRenderRequestDraftStatusLabel(latestRecord.requestStatus),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          reviewerNote: latestRecord.reviewerNote,
          requestVersion: latestRecord.requestVersion,
        }
      : null,
    blockedReasons,
    auditLines: uniqueStrings([
      `Videoformat: Briefing-Video`,
      `Status: ${voxyRenderRequestDraftStatusLabel(input.draft.requestStatus)}`,
      latestRecord?.persistedAt ? `Zuletzt gespeichert: ${latestRecord.persistedAt}` : null,
      latestRecord?.persistedBy ? `Von: ${latestRecord.persistedBy}` : null,
      input.draft.reviewerNote ? `Notiz: ${input.draft.reviewerNote}` : null,
      "Kein Renderjob, keine Queue, kein Providerlauf, keine Datei, keine Kostenbuchung, kein Publish.",
    ]),
    nextStep: input.draft.nextStep,
    executionFlags: input.draft.execution,
  } satisfies VoxyRenderRequestDraftPanelModel;
}
