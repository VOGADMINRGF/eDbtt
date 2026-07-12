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
  VoxyRenderCostCreditPolicyPreviewRecord,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
  buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
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
  VoxyRenderRuntimeCutoverGateCommand,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";
import {
  buildVoxyRenderRuntimeCutoverGateFromCreateCandidatePreview,
  buildVoxyRenderRuntimeCutoverGateFromReviewContext,
  buildVoxyRenderRuntimeCutoverGateFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";
import type {
  VoxyHybridRuntimeConfigRequirement,
  VoxyHybridRuntimeConfigRequirementKey,
  VoxyHybridRuntimePath,
  VoxyHybridRuntimeSecretRequirement,
  VoxyHybridRuntimeSecretRequirementKey,
} from "@/features/voxyVideo/contracts";
import {
  VOXY_HYBRID_RUNTIME_CONFIG_REQUIREMENT_KEYS,
  VOXY_HYBRID_RUNTIME_SECRET_REQUIREMENT_KEYS,
} from "@/features/voxyVideo/contracts";

export const VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_STATUSES = [
  "foundation_ready",
  "requirements_only",
  "blocked_by_missing_request_draft",
  "blocked_by_missing_provider_selection",
  "blocked_by_missing_queue_contract",
  "blocked_by_missing_adapter_contract",
  "keep_as_script_only",
] as const;

export type VoxyRenderHybridRuntimeFoundationStatus =
  (typeof VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_STATUSES)[number];

export const VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_GATE_KEYS = [
  "adapterInterfaceGate",
  "providerNeutralRuntimeGate",
  "configRequirementsGate",
  "secretRequirementsGate",
  "queueWorkerBoundaryGate",
  "storageUploadBoundaryGate",
  "runtimeBoundaryGate",
] as const;

export type VoxyRenderHybridRuntimeFoundationGateKey =
  (typeof VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_GATE_KEYS)[number];

export const VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_GATE_STATUSES = [
  "foundation_defined",
  "requirement_only",
  "blocked",
] as const;

export type VoxyRenderHybridRuntimeFoundationGateStatus =
  (typeof VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_GATE_STATUSES)[number];

export const VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_NEXT_STEPS = [
  "keep_runtime_disabled",
  "define_config_requirements",
  "define_secret_requirements",
  "define_queue_worker_boundary",
  "define_storage_upload_boundary",
  "blocked",
  "keep_as_script_only",
] as const;

export type VoxyRenderHybridRuntimeFoundationNextStep =
  (typeof VOXY_RENDER_HYBRID_RUNTIME_FOUNDATION_NEXT_STEPS)[number];

type FoundationSurface = "create" | "account" | "admin" | "workspace";

type FoundationRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderHybridRuntimeFoundationRequirementItem<T extends string> = {
  key: T;
  label: string;
  status: "requirement_only";
  reviewRequired: true;
  runtimeEnabled: false;
  reason: string;
};

export type VoxyRenderHybridRuntimeFoundationGateItem = {
  gateKey: VoxyRenderHybridRuntimeFoundationGateKey;
  label: string;
  status: VoxyRenderHybridRuntimeFoundationGateStatus;
  statusLabel: string;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderHybridRuntimeFoundationContract = {
  adapterKind: VoxyHybridRuntimePath;
  requestContract: "voxy_hybrid_runtime_adapter_request";
  resultContract: "disabled_noop";
  providerNeutral: true;
  foundationReady: boolean;
  runtimeEnabled: false;
  executionBoundary: "server_only_future_runtime";
  externalApiCallsAllowed: false;
  queueExecutionAllowed: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  publishAllowed: false;
  socialPostingAllowed: false;
};

export type VoxyRenderHybridRuntimeFoundationSemantics = {
  selectedPath: "hybrid_external_render_adapter";
  foundationReady: boolean;
  runtimeEnabled: false;
  providerNeutral: true;
  adapterOnly: true;
  configRequirementOnly: true;
  secretRequirementOnly: true;
  providerConfigured: false;
  secretsAccessed: false;
  queueWorkerRunning: false;
  storageWritten: false;
  uploadTriggered: false;
  schedulingTriggered: false;
  published: false;
  socialPosted: false;
};

export type VoxyRenderHybridRuntimeFoundationExecutionFlags = {
  executionAllowed: false;
  providerExecutionAllowed: false;
  externalApiCalled: false;
  queueAllowed: false;
  workerAllowed: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  renderAllowed: false;
  secretsAccessed: false;
  runtimeEnabled: false;
};

export type VoxyRenderHybridRuntimeFoundationRecord = {
  foundationId: string;
  pathChoiceId: "V3-VOXY-RUNTIME-PATH-CHOICE-02";
  selectedPath: "hybrid_external_render_adapter";
  requestDraftId: string | null;
  providerSelectionDraftId: string | null;
  queuePreviewId: string | null;
  costPolicyPreviewId: string | null;
  runtimeCutoverGateId: string | null;
  contributionRef: FoundationRef | null;
  dossierRef: FoundationRef | null;
  scriptRef: FoundationRef | null;
  surface: FoundationSurface;
  sourceLanguage: string;
  readingLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  foundationStatus: VoxyRenderHybridRuntimeFoundationStatus;
  foundationContract: VoxyRenderHybridRuntimeFoundationContract;
  configRequirements: Array<
    VoxyRenderHybridRuntimeFoundationRequirementItem<VoxyHybridRuntimeConfigRequirementKey>
  >;
  secretRequirements: Array<
    VoxyRenderHybridRuntimeFoundationRequirementItem<VoxyHybridRuntimeSecretRequirementKey>
  >;
  gates: VoxyRenderHybridRuntimeFoundationGateItem[];
  semantics: VoxyRenderHybridRuntimeFoundationSemantics;
  executionFlags: VoxyRenderHybridRuntimeFoundationExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderHybridRuntimeFoundationNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
};

export type VoxyRenderHybridRuntimeFoundationPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderHybridRuntimeFoundationRecord;
  foundationStatusLabel: string;
  nextStepLabel: string;
  gateLines: string[];
  configRequirementLines: string[];
  secretRequirementLines: string[];
  semanticsLines: string[];
  executionLines: string[];
  blockerLines: string[];
  auditLines: string[];
};

type BuildFoundationInput = {
  surface: FoundationSurface;
  requestDraft: VoxyRenderRequestDraftRecord | null;
  providerSelectionDraft: VoxyRenderProviderSelectionDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  runtimeCutoverGate: VoxyRenderRuntimeCutoverGateCommand | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function sanitizeIdFragment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function refOrNull(
  ref: { id: string; title: string; href?: string | null } | null | undefined,
): FoundationRef | null {
  if (!ref) return null;
  const id = normalizeText(ref.id);
  const title = normalizeText(ref.title);
  if (!id || !title) return null;
  return {
    id,
    title,
    href: normalizeOptionalString(ref.href),
  };
}

function configRequirementLabel(key: VoxyHybridRuntimeConfigRequirementKey) {
  if (key === "provider_adapter_endpoint") return "Adapter-Endpunkt";
  if (key === "provider_adapter_timeout_policy") return "Timeout-Policy";
  if (key === "provider_adapter_model_mapping") return "Model-Mapping";
  if (key === "runtime_idempotency_namespace") return "Idempotency-Namespace";
  if (key === "queue_routing_contract") return "Queue-Routing-Vertrag";
  if (key === "preview_storage_policy") return "Preview-Storage-Policy";
  if (key === "upload_access_policy") return "Upload-/Access-Policy";
  return "Observability-Mapping";
}

function secretRequirementLabel(key: VoxyHybridRuntimeSecretRequirementKey) {
  if (key === "provider_api_key") return "Provider API Key";
  if (key === "provider_signing_secret") return "Provider Signing Secret";
  if (key === "storage_signing_secret") return "Storage Signing Secret";
  return "Queue Connection Secret";
}

function gateStatusLabel(status: VoxyRenderHybridRuntimeFoundationGateStatus) {
  if (status === "foundation_defined") return "Foundation definiert";
  if (status === "requirement_only") return "Nur Anforderung";
  return "Blockiert";
}

export function voxyRenderHybridRuntimeFoundationStatusLabel(
  status: VoxyRenderHybridRuntimeFoundationStatus,
) {
  if (status === "foundation_ready") return "Foundation bereit";
  if (status === "requirements_only") return "Nur Requirements";
  if (status === "blocked_by_missing_request_draft") return "Request-Draft fehlt";
  if (status === "blocked_by_missing_provider_selection") return "Provider-Auswahl fehlt";
  if (status === "blocked_by_missing_queue_contract") return "Queue-Vertrag fehlt";
  if (status === "blocked_by_missing_adapter_contract") return "Adapter-Vertrag fehlt";
  return "Script-only beibehalten";
}

function nextStepLabel(step: VoxyRenderHybridRuntimeFoundationNextStep) {
  if (step === "define_config_requirements") return "Config-Requirements dokumentieren";
  if (step === "define_secret_requirements") return "Secret-Requirements dokumentieren";
  if (step === "define_queue_worker_boundary") return "Queue-/Worker-Grenze definieren";
  if (step === "define_storage_upload_boundary") return "Storage-/Upload-Grenze definieren";
  if (step === "keep_as_script_only") return "Script-only beibehalten";
  if (step === "blocked") return "Blocker klären";
  return "Runtime deaktiviert lassen";
}

function buildConfigRequirements(): Array<
  VoxyRenderHybridRuntimeFoundationRequirementItem<VoxyHybridRuntimeConfigRequirementKey>
> {
  return VOXY_HYBRID_RUNTIME_CONFIG_REQUIREMENT_KEYS.map((key) => ({
    key,
    label: configRequirementLabel(key),
    status: "requirement_only",
    reviewRequired: true,
    runtimeEnabled: false,
    reason:
      "Die Hybrid-Foundation dokumentiert nur die Anforderung. Keine Konfiguration wird aktiv eingetragen oder ausgeführt.",
  }));
}

function buildSecretRequirements(): Array<
  VoxyRenderHybridRuntimeFoundationRequirementItem<VoxyHybridRuntimeSecretRequirementKey>
> {
  return VOXY_HYBRID_RUNTIME_SECRET_REQUIREMENT_KEYS.map((key) => ({
    key,
    label: secretRequirementLabel(key),
    status: "requirement_only",
    reviewRequired: true,
    runtimeEnabled: false,
    reason:
      "Secrets bleiben bewusst nur Requirement-Wahrheit. Es wird nichts gelesen, gesetzt oder weitergegeben.",
  }));
}

function buildFoundationStatus(input: BuildFoundationInput): VoxyRenderHybridRuntimeFoundationStatus {
  if (
    input.requestDraft &&
    input.providerSelectionDraft &&
    input.queuePreview &&
    input.adapterModel
  ) {
    return "foundation_ready";
  }
  if (input.adapterModel?.adapterStatus === "keep_as_script_only") {
    return "keep_as_script_only";
  }
  if (input.providerSelectionDraft?.providerSelectionStatus === "keep_as_script_only") {
    return "keep_as_script_only";
  }
  if (!input.requestDraft) return "blocked_by_missing_request_draft";
  if (!input.providerSelectionDraft) return "blocked_by_missing_provider_selection";
  if (!input.queuePreview) return "blocked_by_missing_queue_contract";
  return "blocked_by_missing_adapter_contract";
}

function buildNextStep(
  status: VoxyRenderHybridRuntimeFoundationStatus,
): VoxyRenderHybridRuntimeFoundationNextStep {
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (status === "blocked_by_missing_request_draft") return "blocked";
  if (status === "blocked_by_missing_provider_selection") return "blocked";
  if (status === "blocked_by_missing_queue_contract") return "define_queue_worker_boundary";
  if (status === "blocked_by_missing_adapter_contract") return "blocked";
  return "keep_runtime_disabled";
}

function buildGates(input: {
  status: VoxyRenderHybridRuntimeFoundationStatus;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  runtimeCutoverGate: VoxyRenderRuntimeCutoverGateCommand | null;
}): VoxyRenderHybridRuntimeFoundationGateItem[] {
  const adapterDefined = Boolean(input.adapterModel);
  const queueDefined = Boolean(input.queuePreview);
  const runtimeBoundaryDefined = Boolean(input.runtimeCutoverGate);
  return [
    {
      gateKey: "adapterInterfaceGate",
      label: "Adapter-Schnittstelle",
      status: adapterDefined ? "foundation_defined" : "blocked",
      statusLabel: gateStatusLabel(adapterDefined ? "foundation_defined" : "blocked"),
      reviewerVisibleReason: adapterDefined
        ? "Der Noop-/Disabled-Adapter beschreibt den austauschbaren Render-Rand bereits provider-neutral."
        : "Ohne Adapter-Schnittstelle ist keine Hybrid-Foundation belastbar.",
      userVisibleReason: adapterDefined
        ? "Der Render-Rand ist nur als austauschbarer Vertrag definiert."
        : "Die Adapter-Schnittstelle fehlt noch.",
    },
    {
      gateKey: "providerNeutralRuntimeGate",
      label: "Provider-neutraler Runtime-Vertrag",
      status: input.status === "foundation_ready" ? "foundation_defined" : "requirement_only",
      statusLabel: gateStatusLabel(
        input.status === "foundation_ready" ? "foundation_defined" : "requirement_only",
      ),
      reviewerVisibleReason:
        "Script, Review, Approval, Queue-Vertrag und Distribution-Handoff bleiben im Repo; externer Render bleibt nur Adapter-Rand.",
      userVisibleReason:
        "Die Foundation trennt Produktkern und späteren Render-Adapter sichtbar voneinander.",
    },
    {
      gateKey: "configRequirementsGate",
      label: "Config-Requirements",
      status: "requirement_only",
      statusLabel: gateStatusLabel("requirement_only"),
      reviewerVisibleReason:
        "Config wird nur als Requirement dokumentiert. Es gibt keine aktive Adapter-, Queue-, Storage- oder Upload-Konfiguration.",
      userVisibleReason:
        "Konfiguration bleibt nur als spätere Anforderung sichtbar.",
    },
    {
      gateKey: "secretRequirementsGate",
      label: "Secret-Requirements",
      status: "requirement_only",
      statusLabel: gateStatusLabel("requirement_only"),
      reviewerVisibleReason:
        "Secrets bleiben bewusst nur Requirement-Wahrheit. Kein Secret wird gelesen oder eingetragen.",
      userVisibleReason:
        "Secrets bleiben gesperrt und werden hier nicht verwendet.",
    },
    {
      gateKey: "queueWorkerBoundaryGate",
      label: "Queue-/Worker-Grenze",
      status: queueDefined ? "foundation_defined" : "blocked",
      statusLabel: gateStatusLabel(queueDefined ? "foundation_defined" : "blocked"),
      reviewerVisibleReason: queueDefined
        ? "Der Queue-Vertrag bleibt disabled/noop und markiert die spätere server-only Grenze ohne Worker-Ausführung."
        : "Ohne Queue-Vertrag fehlt die server-only Ausführungsgrenze.",
      userVisibleReason: queueDefined
        ? "Queue und Worker bleiben aus, aber die Grenze ist beschrieben."
        : "Die Queue-/Worker-Grenze fehlt noch.",
    },
    {
      gateKey: "storageUploadBoundaryGate",
      label: "Storage-/Upload-Grenze",
      status: "foundation_defined",
      statusLabel: gateStatusLabel("foundation_defined"),
      reviewerVisibleReason:
        "Preview-Datei, Storage, Upload und Access bleiben als spätere Boundary dokumentiert, nicht als aktive Runtime.",
      userVisibleReason:
        "Es wird nichts gespeichert oder hochgeladen; nur die spätere Grenze ist beschrieben.",
    },
    {
      gateKey: "runtimeBoundaryGate",
      label: "Runtime-Grenze",
      status: runtimeBoundaryDefined ? "foundation_defined" : "requirement_only",
      statusLabel: gateStatusLabel(runtimeBoundaryDefined ? "foundation_defined" : "requirement_only"),
      reviewerVisibleReason: runtimeBoundaryDefined
        ? "Foundation Ready ist explizit von Runtime Enabled getrennt und am bestehenden Cutover-Gate verankert."
        : "Die Foundation trennt Runtime bereits semantisch, auch wenn noch kein eigener Runtime-Gate-Readmodel vorliegt.",
      userVisibleReason:
        "Foundation kann bereit sein, während Runtime weiter deaktiviert bleibt.",
    },
  ];
}

function buildContract(
  foundationReady: boolean,
): VoxyRenderHybridRuntimeFoundationContract {
  return {
    adapterKind: "hybrid_external_render_adapter",
    requestContract: "voxy_hybrid_runtime_adapter_request",
    resultContract: "disabled_noop",
    providerNeutral: true,
    foundationReady,
    runtimeEnabled: false,
    executionBoundary: "server_only_future_runtime",
    externalApiCallsAllowed: false,
    queueExecutionAllowed: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    publishAllowed: false,
    socialPostingAllowed: false,
  };
}

function buildSummary(status: VoxyRenderHybridRuntimeFoundationStatus) {
  if (status === "foundation_ready") {
    return {
      user: "Die Hybrid Runtime Foundation ist vorbereitet. Runtime, Secrets, Queue, Storage, Upload, Scheduling und Publish bleiben deaktiviert.",
      reviewer:
        "Adapter-Schnittstelle, provider-neutraler Runtime-Vertrag, requirement-only Config-/Secret-Bedarf und klare Disabled-Gates sind definiert, ohne Providerlauf oder Runtime-Ausführung.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      user: "Der Pfad bleibt aktuell bewusst script-only.",
      reviewer: "Die vorhandenen Readmodels markieren weiter keep_as_script_only statt Hybrid-Foundation.",
    };
  }
  return {
    user: "Die Hybrid Runtime Foundation ist noch nicht vollständig beschrieben.",
    reviewer: "Es fehlen noch Pflichtbausteine fuer Request-Draft, Adapter, Provider-Auswahl oder Queue-Vertrag.",
  };
}

export function buildVoxyRenderHybridRuntimeFoundationFromReadmodels(
  input: BuildFoundationInput,
): VoxyRenderHybridRuntimeFoundationRecord {
  const status = buildFoundationStatus(input);
  const foundationReady = status === "foundation_ready";
  const summaries = buildSummary(status);
  const gates = buildGates({
    status,
    adapterModel: input.adapterModel,
    queuePreview: input.queuePreview,
    runtimeCutoverGate: input.runtimeCutoverGate,
  });
  const sourceLanguage =
    input.requestDraft?.sourceLanguage ??
    input.providerSelectionDraft?.sourceLanguage ??
    input.queuePreview?.sourceLanguage ??
    "de";
  const readingLanguage =
    input.requestDraft?.readingLanguage ??
    input.providerSelectionDraft?.readingLanguage ??
    input.queuePreview?.readingLanguage ??
    sourceLanguage;
  const renderLanguage =
    input.requestDraft?.renderLanguage ??
    input.providerSelectionDraft?.renderLanguage ??
    input.queuePreview?.renderLanguage ??
    readingLanguage;
  const subtitleLanguage =
    input.requestDraft?.subtitleLanguage ??
    input.providerSelectionDraft?.subtitleLanguage ??
    input.queuePreview?.subtitleLanguage ??
    null;
  const contributionRef =
    refOrNull(input.requestDraft?.contributionRef) ??
    refOrNull(input.providerSelectionDraft?.contributionRef) ??
    refOrNull(input.queuePreview?.contributionRef);
  const dossierRef =
    refOrNull(input.requestDraft?.dossierRef) ??
    refOrNull(input.providerSelectionDraft?.dossierRef) ??
    refOrNull(input.queuePreview?.dossierRef);
  const scriptRef =
    refOrNull(input.requestDraft?.scriptRef) ??
    refOrNull(input.providerSelectionDraft?.scriptRef) ??
    refOrNull(input.queuePreview?.scriptRef);
  const foundationId = `voxy-render-hybrid-runtime-foundation:${sanitizeIdFragment(
    [
      input.surface,
      contributionRef?.id ?? dossierRef?.id ?? input.requestDraft?.requestDraftId ?? "foundation",
      status,
    ].join(":"),
  )}`;

  return {
    foundationId,
    pathChoiceId: "V3-VOXY-RUNTIME-PATH-CHOICE-02",
    selectedPath: "hybrid_external_render_adapter",
    requestDraftId: input.requestDraft?.requestDraftId ?? null,
    providerSelectionDraftId:
      input.providerSelectionDraft?.providerSelectionDraftId ?? null,
    queuePreviewId: input.queuePreview?.queuePreviewId ?? null,
    costPolicyPreviewId: input.costPolicyPreview?.policyPreviewId ?? null,
    runtimeCutoverGateId: input.runtimeCutoverGate?.runtimeCutoverGateId ?? null,
    contributionRef,
    dossierRef,
    scriptRef,
    surface: input.surface,
    sourceLanguage,
    readingLanguage,
    renderLanguage,
    subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      input.requestDraft?.rtlRequired ??
      input.providerSelectionDraft?.rtlRequired ??
      input.queuePreview?.rtlRequired ??
      false,
    foundationStatus: status,
    foundationContract: buildContract(foundationReady),
    configRequirements: buildConfigRequirements(),
    secretRequirements: buildSecretRequirements(),
    gates,
    semantics: {
      selectedPath: "hybrid_external_render_adapter",
      foundationReady,
      runtimeEnabled: false,
      providerNeutral: true,
      adapterOnly: true,
      configRequirementOnly: true,
      secretRequirementOnly: true,
      providerConfigured: false,
      secretsAccessed: false,
      queueWorkerRunning: false,
      storageWritten: false,
      uploadTriggered: false,
      schedulingTriggered: false,
      published: false,
      socialPosted: false,
    },
    executionFlags: {
      executionAllowed: false,
      providerExecutionAllowed: false,
      externalApiCalled: false,
      queueAllowed: false,
      workerAllowed: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      schedulingAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      renderAllowed: false,
      secretsAccessed: false,
      runtimeEnabled: false,
    },
    topBlockers: gates
      .filter((gate) => gate.status === "blocked")
      .map((gate) => gate.userVisibleReason),
    nextStep: buildNextStep(status),
    userVisibleSummary: summaries.user,
    reviewerVisibleSummary: summaries.reviewer,
  };
}

export function buildVoxyRenderHybridRuntimeFoundationFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderHybridRuntimeFoundationFromReadmodels({
    surface: "create",
    requestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    providerSelectionDraft:
      buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview(model),
    queuePreview: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
    costPolicyPreview:
      buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model),
    runtimeCutoverGate: buildVoxyRenderRuntimeCutoverGateFromCreateCandidatePreview(model),
    adapterModel: buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderHybridRuntimeFoundationFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    surface?: FoundationSurface;
  },
) {
  return buildVoxyRenderHybridRuntimeFoundationFromReadmodels({
    surface: options?.surface ?? "admin",
    requestDraft: buildVoxyRenderRequestDraftFromReviewContext(context),
    providerSelectionDraft:
      buildVoxyRenderProviderSelectionDraftFromReviewContext(context),
    queuePreview: buildVoxyRenderQueuePreviewFromReviewContext(context),
    costPolicyPreview:
      buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(context),
    runtimeCutoverGate: buildVoxyRenderRuntimeCutoverGateFromReviewContext({
      reviewContext: context,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromReviewContext(context),
  });
}

export function buildVoxyRenderHybridRuntimeFoundationFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    contributionRef?: FoundationRef | null;
    nextStep?: string;
  },
) {
  return buildVoxyRenderHybridRuntimeFoundationFromReadmodels({
    surface: "account",
    requestDraft: buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options),
    providerSelectionDraft:
      buildVoxyRenderProviderSelectionDraftFromVoxyDialog(dialog, options),
    queuePreview: buildVoxyRenderQueuePreviewFromVoxyDialog(dialog, options),
    costPolicyPreview:
      buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(dialog, options),
    runtimeCutoverGate: buildVoxyRenderRuntimeCutoverGateFromVoxyDialog(dialog, options),
    adapterModel: buildVoxyRenderAdapterNoopFromVoxyDialog(dialog, options),
  });
}

export function buildVoxyRenderHybridRuntimeFoundationPanelModel(input: {
  preview: VoxyRenderHybridRuntimeFoundationRecord | null;
}) {
  if (!input.preview) return null;
  return {
    title: "Hybrid Runtime Foundation",
    summary: input.preview.userVisibleSummary,
    preview: input.preview,
    foundationStatusLabel: voxyRenderHybridRuntimeFoundationStatusLabel(
      input.preview.foundationStatus,
    ),
    nextStepLabel: nextStepLabel(input.preview.nextStep),
    gateLines: input.preview.gates.map(
      (gate) => `${gate.label}: ${gate.statusLabel} · ${gate.userVisibleReason}`,
    ),
    configRequirementLines: input.preview.configRequirements.map(
      (item) => `${item.label}: Nur Requirement · ${item.reason}`,
    ),
    secretRequirementLines: input.preview.secretRequirements.map(
      (item) => `${item.label}: Nur Requirement · ${item.reason}`,
    ),
    semanticsLines: [
      `selected_path = ${input.preview.selectedPath}`,
      `foundationReady = ${input.preview.semantics.foundationReady ? "true" : "false"}`,
      "runtimeEnabled = false",
      "providerNeutral = true",
      "adapterOnly = true",
      "configRequirementOnly = true",
      "secretRequirementOnly = true",
    ],
    executionLines: [
      "Keine Provider-Ausführung",
      "Keine externen API-Calls",
      "Keine Queue/Worker-Ausführung",
      "Kein Storage-Write",
      "Kein Upload",
      "Kein Scheduling",
      "Kein Publish",
      "Kein Social Posting",
    ],
    blockerLines: input.preview.topBlockers,
    auditLines: [
      `Pfadentscheidung: ${input.preview.pathChoiceId}`,
      `Request-Draft: ${input.preview.requestDraftId ?? "fehlend"}`,
      `Provider-Auswahl: ${input.preview.providerSelectionDraftId ?? "fehlend"}`,
      `Queue-Vertrag: ${input.preview.queuePreviewId ?? "fehlend"}`,
      `Runtime Cutover Gate: ${input.preview.runtimeCutoverGateId ?? "nur Requirement"}`,
      "Keine Secrets gelesen, keine Credentials eingetragen, keine Runtime aktiviert.",
    ],
  } satisfies VoxyRenderHybridRuntimeFoundationPanelModel;
}
