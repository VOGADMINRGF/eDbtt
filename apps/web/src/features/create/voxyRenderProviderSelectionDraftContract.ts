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
  VoxyRenderAssetPackDraftPersistenceState,
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
  VoxyRenderCostCreditPolicyPersistenceState,
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
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftPersistenceState,
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

export const VOXY_RENDER_PROVIDER_SELECTION_DRAFT_STATUSES = [
  "provider_selection_draft_only",
  "noop_provider_selection",
  "requirements_only",
  "needs_provider_review",
  "needs_adapter_contract",
  "needs_provider_configuration",
  "needs_secret_configuration",
  "needs_provider_pricing",
  "needs_language_capability",
  "needs_subtitle_capability",
  "needs_voice_capability",
  "blocked_by_missing_request_draft",
  "blocked_by_missing_asset_pack",
  "blocked_by_missing_cost_policy",
  "blocked_by_missing_registry",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderProviderSelectionDraftStatus =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_DRAFT_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_STATUSES = [
  "requirement_only",
  "missing",
  "adapter_needed",
  "configuration_needed",
  "secrets_needed",
  "pricing_needed",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderProviderSelectionCandidateStatus =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_SOURCES = [
  "repo",
  "config",
  "requirement",
  "unknown",
] as const;

export type VoxyRenderProviderSelectionCandidateSource =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_CANDIDATE_SOURCES)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_REQUIRED_CAPABILITIES = [
  "avatar_video",
  "voiceover",
  "subtitles",
  "multilingual_voice",
  "rtl_subtitles",
  "brand_overlay",
  "lower_thirds",
  "source_captions",
  "export_preset",
  "preview_render",
  "cost_estimate",
] as const;

export type VoxyRenderProviderSelectionRequiredCapability =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_REQUIRED_CAPABILITIES)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_NEXT_DECISIONS = [
  "review_provider_requirements",
  "prepare_adapter_contract",
  "configure_provider",
  "configure_secrets",
  "define_provider_pricing",
  "verify_language_capabilities",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderProviderSelectionNextDecision =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_NEXT_DECISIONS)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderProviderSelectionStoreResultStatus =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_SELECTION_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderProviderSelectionPersistenceMode =
  (typeof VOXY_RENDER_PROVIDER_SELECTION_PERSISTENCE_MODES)[number];

type SelectionSurface = "create" | "account" | "admin" | "workspace";

type SelectionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderProviderSelectionCandidateEntry = {
  candidateId: string;
  label: string;
  status: VoxyRenderProviderSelectionCandidateStatus;
  statusLabel: string;
  source: VoxyRenderProviderSelectionCandidateSource;
  sourceLabel: string;
  providerName: string | null;
  requiredCapabilities: VoxyRenderProviderSelectionRequiredCapability[];
  missingCapabilities: VoxyRenderProviderSelectionRequiredCapability[];
  reviewerVisibleReason: string;
  userVisibleReason: string;
  executionAllowed: false;
  providerCalled: false;
  secretsAccessed: false;
  pricingClaimAllowed: false;
  renderSafe: false;
};

export type VoxyRenderProviderSelectionExecutionFlags = {
  providerExecutionAllowed: false;
  providerCalled: false;
  secretsAccessed: false;
  pricingClaimAllowed: false;
  queueEnabled: false;
  createsQueueJob: false;
  workerExecutionAllowed: false;
  mediaFileCreationAllowed: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderProviderSelectionDecision = {
  nextProviderDecision: VoxyRenderProviderSelectionNextDecision;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
};

export type VoxyRenderProviderSelectionDraftRecord = {
  providerSelectionDraftId: string;
  assetPackDraftId: string | null;
  costPolicyPreviewId: string | null;
  queuePreviewId: string | null;
  requestDraftId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  handoffRef: SelectionRef | null;
  preflightRef: SelectionRef | null;
  registryRef: SelectionRef | null;
  adapterRef: SelectionRef | null;
  scriptRef: SelectionRef | null;
  contributionRef: SelectionRef | null;
  dossierRef: SelectionRef | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  surface: SelectionSurface;
  providerSelectionStatus: VoxyRenderProviderSelectionDraftStatus;
  candidates: VoxyRenderProviderSelectionCandidateEntry[];
  inventoryFindings: string[];
  gateHints: string[];
  blockers: string[];
  decision: VoxyRenderProviderSelectionDecision;
  execution: VoxyRenderProviderSelectionExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousProviderSelectionDraftRef: string | null;
  supersedesProviderSelectionDraftRef: string | null;
  providerSelectionVersion: number | null;
};

export type VoxyRenderProviderSelectionDraftCommand = Omit<
  VoxyRenderProviderSelectionDraftRecord,
  | "persistedAt"
  | "persistedBy"
  | "idempotencyKey"
  | "previousProviderSelectionDraftRef"
  | "supersedesProviderSelectionDraftRef"
  | "providerSelectionVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderProviderSelectionStoreResult = {
  ok: boolean;
  status: VoxyRenderProviderSelectionStoreResultStatus;
  record: VoxyRenderProviderSelectionDraftRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderProviderSelectionPersistenceState = {
  mode: VoxyRenderProviderSelectionPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderProviderSelectionDraftRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderProviderSelectionDraftPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderProviderSelectionDraftRecord;
  providerSelectionStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    providerSelectionDraftId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    providerSelectionVersion: number | null;
    assetPackDraftId: string | null;
  } | null;
  blockedReasons: string[];
  auditLines: string[];
  nextStep: string;
  executionFlags: VoxyRenderProviderSelectionExecutionFlags;
};

type BuildSelectionDraftInput = {
  surface: SelectionSurface;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  assetPackDraft?: VoxyRenderAssetPackDraftPreviewRecord | null;
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

function uniqueCapabilities(
  values: Array<VoxyRenderProviderSelectionRequiredCapability | null | undefined>,
) {
  return Array.from(new Set(values.filter(Boolean))) as VoxyRenderProviderSelectionRequiredCapability[];
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

function capabilityLabel(value: VoxyRenderProviderSelectionRequiredCapability) {
  if (value === "avatar_video") return "Avatar-Video";
  if (value === "voiceover") return "Voiceover";
  if (value === "subtitles") return "Untertitel";
  if (value === "multilingual_voice") return "Mehrsprachige Voice";
  if (value === "rtl_subtitles") return "RTL-Untertitel";
  if (value === "brand_overlay") return "Brand-Overlay";
  if (value === "lower_thirds") return "Lower Thirds";
  if (value === "source_captions") return "Source-Captions";
  if (value === "export_preset") return "Export-Preset";
  if (value === "preview_render") return "Preview-Render";
  return "Kostenabschätzung";
}

function candidateStatusLabel(value: VoxyRenderProviderSelectionCandidateStatus) {
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "missing") return "Fehlt";
  if (value === "adapter_needed") return "Adapter fehlt";
  if (value === "configuration_needed") return "Konfiguration fehlt";
  if (value === "secrets_needed") return "Secrets fehlen";
  if (value === "pricing_needed") return "Pricing fehlt";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function candidateSourceLabel(value: VoxyRenderProviderSelectionCandidateSource) {
  if (value === "repo") return "Repo";
  if (value === "config") return "Konfiguration";
  if (value === "requirement") return "Anforderung";
  return "Unklar";
}

export function voxyRenderProviderSelectionDraftStatusLabel(
  value: VoxyRenderProviderSelectionDraftStatus,
) {
  if (value === "provider_selection_draft_only") return "Nur Provider-Auswahl-Draft";
  if (value === "noop_provider_selection") return "Noop-Providerauswahl";
  if (value === "requirements_only") return "Nur Anforderungen sichtbar";
  if (value === "needs_provider_review") return "Provider-Review nötig";
  if (value === "needs_adapter_contract") return "Adaptervertrag fehlt";
  if (value === "needs_provider_configuration") return "Provider-Konfiguration fehlt";
  if (value === "needs_secret_configuration") return "Secret-Konfiguration fehlt";
  if (value === "needs_provider_pricing") return "Provider-Pricing fehlt";
  if (value === "needs_language_capability") return "Sprachfähigkeit fehlt";
  if (value === "needs_subtitle_capability") return "Subtitle-Fähigkeit fehlt";
  if (value === "needs_voice_capability") return "Voice-Fähigkeit fehlt";
  if (value === "blocked_by_missing_request_draft") return "Ohne Request-Draft blockiert";
  if (value === "blocked_by_missing_asset_pack") return "Ohne Asset-Pack blockiert";
  if (value === "blocked_by_missing_cost_policy") return "Ohne Cost-Policy blockiert";
  if (value === "blocked_by_missing_registry") return "Ohne Registry blockiert";
  if (value === "blocked_by_runtime_truth") return "Ohne Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

function nextDecisionLabel(value: VoxyRenderProviderSelectionNextDecision) {
  if (value === "review_provider_requirements") return "Provider-Anforderungen prüfen";
  if (value === "prepare_adapter_contract") return "Adaptervertrag vorbereiten";
  if (value === "configure_provider") return "Provider konfigurieren";
  if (value === "configure_secrets") return "Secrets konfigurieren";
  if (value === "define_provider_pricing") return "Provider-Pricing definieren";
  if (value === "verify_language_capabilities") return "Sprach- und Subtitle-Fähigkeiten prüfen";
  if (value === "keep_as_script_only") return "Bewusst beim Script bleiben";
  return "Blockiert";
}

function buildExecutionFlags(): VoxyRenderProviderSelectionExecutionFlags {
  return {
    providerExecutionAllowed: false,
    providerCalled: false,
    secretsAccessed: false,
    pricingClaimAllowed: false,
    queueEnabled: false,
    createsQueueJob: false,
    workerExecutionAllowed: false,
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

function defaultPersistenceState(): VoxyRenderProviderSelectionPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Provider-Selection-Draft-Store im Surface",
    summary:
      "Dieses Surface zeigt nur den review-first Provider-Auswahl-Draft. Es gibt hier keinen Providerlauf, keine Secrets und keine Runtime-Wahrheit.",
    repositoryInterface: "VoxyRenderProviderSelectionDraftRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function resolveLanguageFields(input: BuildSelectionDraftInput) {
  const sourceLanguage =
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
    input.assetPackDraft?.renderLanguage ??
    input.costPolicyPreview?.renderLanguage ??
    input.queuePreview?.renderLanguage ??
    input.requestDraft?.renderLanguage ??
    input.latestDecisionRecord?.renderLanguage ??
    input.gate?.renderLanguage ??
    input.preflightModel?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    input.assetPackDraft?.subtitleLanguage ??
    input.costPolicyPreview?.subtitleLanguage ??
    input.queuePreview?.subtitleLanguage ??
    input.requestDraft?.subtitleLanguage ??
    input.latestDecisionRecord?.subtitleLanguage ??
    input.gate?.subtitleLanguage ??
    input.preflightModel?.subtitleLanguage ??
    null;
  const rtlRequired =
    input.assetPackDraft?.rtlRequired ??
    input.costPolicyPreview?.rtlRequired ??
    input.queuePreview?.rtlRequired ??
    input.requestDraft?.rtlRequired ??
    (input.gate?.rtlDecisionHint !== null ||
      input.preflightModel?.rtlPreflightHint !== null ||
      isRtlLanguage(sourceLanguage) ||
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
      sourceLanguage !== renderLanguage || sourceLanguage !== scriptLanguage || sourceLanguage !== readingLanguage,
  };
}

function buildRequiredCapabilities(input: {
  crossLingual: boolean;
  rtlRequired: boolean;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null | undefined;
}) {
  return uniqueCapabilities([
    "avatar_video",
    "voiceover",
    "subtitles",
    input.crossLingual ? "multilingual_voice" : null,
    input.rtlRequired ? "rtl_subtitles" : null,
    "brand_overlay",
    "lower_thirds",
    "source_captions",
    "export_preset",
    "preview_render",
    "cost_estimate",
  ]);
}

function capabilitySatisfied(
  capability: VoxyRenderProviderSelectionRequiredCapability,
  input: {
    registryModel: VoxyRenderAssetProviderRegistryModel | null | undefined;
    assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null | undefined;
    costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null | undefined;
    adapterModel: VoxyRenderAdapterNoopModel | null | undefined;
  },
) {
  const registryProvider = input.registryModel?.providerRegistry ?? [];
  const assetEntries = input.assetPackDraft?.assetEntries ?? [];
  if (capability === "avatar_video") {
    return registryProvider.some((item) => item.id === "avatar_video" && item.providerName);
  }
  if (capability === "voiceover") {
    return registryProvider.some((item) => item.id === "voiceover" && item.providerName);
  }
  if (capability === "subtitles") {
    return registryProvider.some((item) => item.id === "subtitles" && item.providerName);
  }
  if (capability === "multilingual_voice") {
    return registryProvider.some((item) => item.id === "multilingual_voice" && item.providerName);
  }
  if (capability === "rtl_subtitles") {
    return registryProvider.some((item) => item.id === "rtl_subtitles" && item.providerName);
  }
  if (capability === "brand_overlay") {
    return assetEntries.some((item) => item.assetKey === "brand_logo" && item.status === "available");
  }
  if (capability === "lower_thirds") {
    return assetEntries.some(
      (item) => item.assetKey === "lower_third_template" && item.status === "available",
    );
  }
  if (capability === "source_captions") {
    return assetEntries.some(
      (item) => item.assetKey === "source_caption_template" && item.status === "available",
    );
  }
  if (capability === "export_preset") {
    return assetEntries.some((item) => item.assetKey === "export_preset" && item.status === "available");
  }
  if (capability === "preview_render") {
    return input.adapterModel?.providerGateItems.some(
      (item) => item.id === "render_queue_runtime" && item.status === "ready",
    ) ?? false;
  }
  return input.costPolicyPreview?.providerPricingStatus === "available";
}

function buildCandidateEntry(input: {
  id: string;
  label: string;
  requiredCapabilities: VoxyRenderProviderSelectionRequiredCapability[];
  hardBlocked: boolean;
  adapterNeeded: boolean;
  providerConfigurationNeeded: boolean;
  secretConfigurationNeeded: boolean;
  pricingNeeded: boolean;
  registryModel: VoxyRenderAssetProviderRegistryModel | null | undefined;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null | undefined;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null | undefined;
  adapterModel: VoxyRenderAdapterNoopModel | null | undefined;
  preferPricing?: boolean;
}) {
  const missingCapabilities = input.requiredCapabilities.filter(
    (capability) =>
      !capabilitySatisfied(capability, {
        registryModel: input.registryModel,
        assetPackDraft: input.assetPackDraft,
        costPolicyPreview: input.costPolicyPreview,
        adapterModel: input.adapterModel,
      }),
  );
  const concreteProviderName =
    input.registryModel?.providerRegistry.find((item) => item.providerName)?.providerName ?? null;
  const status: VoxyRenderProviderSelectionCandidateStatus = input.hardBlocked
    ? "blocked"
    : input.adapterNeeded
      ? "adapter_needed"
      : input.preferPricing && input.pricingNeeded
        ? "pricing_needed"
        : input.providerConfigurationNeeded
          ? concreteProviderName
            ? "configuration_needed"
            : "requirement_only"
          : input.secretConfigurationNeeded
            ? "secrets_needed"
            : input.pricingNeeded
              ? "pricing_needed"
              : missingCapabilities.length > 0
                ? "needs_review"
                : "needs_review";
  const source: VoxyRenderProviderSelectionCandidateSource = concreteProviderName
    ? "config"
    : "requirement";
  const reviewerVisibleReason = uniqueStrings([
    concreteProviderName
      ? `Belegter Kandidat: ${concreteProviderName}. Ausführung bleibt dennoch gesperrt.`
      : "Im Repo gibt es keine belastbar konfigurierte Render-/Avatar-/Voice-Provider-Wahrheit für diesen Kandidaten.",
    input.adapterNeeded
      ? "Es fehlt weiterhin ein belastbarer Adapterpfad über den bestehenden Noop-Vertrag hinaus."
      : null,
    input.providerConfigurationNeeded
      ? "Provider-Konfiguration, Freigaben oder belegte Runtime-Zuordnung fehlen."
      : null,
    input.secretConfigurationNeeded
      ? "Secret- und Runtime-Freigaben bleiben unbelegt und werden in diesem Slice nicht gelesen."
      : null,
    input.pricingNeeded
      ? "Es gibt keine belastbare Provider-Pricing-Quelle für diesen Kandidaten."
      : null,
    missingCapabilities.length > 0
      ? `Fehlende Fähigkeiten: ${missingCapabilities.map(capabilityLabel).join(", ")}.`
      : null,
  ]).join(" ");
  return {
    candidateId: input.id,
    label: input.label,
    status,
    statusLabel: candidateStatusLabel(status),
    source,
    sourceLabel: candidateSourceLabel(source),
    providerName: concreteProviderName,
    requiredCapabilities: input.requiredCapabilities,
    missingCapabilities,
    reviewerVisibleReason,
    userVisibleReason: reviewerVisibleReason,
    executionAllowed: false,
    providerCalled: false,
    secretsAccessed: false,
    pricingClaimAllowed: false,
    renderSafe: false,
  } satisfies VoxyRenderProviderSelectionCandidateEntry;
}

function buildSelectionStatus(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null | undefined;
  assetPackDraft: VoxyRenderAssetPackDraftPreviewRecord | null | undefined;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null | undefined;
  registryModel: VoxyRenderAssetProviderRegistryModel | null | undefined;
  adapterModel: VoxyRenderAdapterNoopModel | null | undefined;
  preflightModel: VoxyRenderPreflightReadinessModel | null | undefined;
  queuePreview: VoxyRenderQueuePreviewRecord | null | undefined;
  crossLingual: boolean;
  rtlRequired: boolean;
  candidates: VoxyRenderProviderSelectionCandidateEntry[];
}) {
  if (!input.requestDraft) return "blocked_by_missing_request_draft" as const;
  if (!input.assetPackDraft) return "blocked_by_missing_asset_pack" as const;
  if (!input.costPolicyPreview) return "blocked_by_missing_cost_policy" as const;
  if (!input.registryModel) return "blocked_by_missing_registry" as const;
  if (
    input.requestDraft.requestStatus === "keep_as_script_only" ||
    input.queuePreview?.queueStatus === "keep_as_script_only" ||
    input.costPolicyPreview.policyStatus === "keep_as_script_only" ||
    input.assetPackDraft.assetPackStatus === "keep_as_script_only"
  ) {
    return "keep_as_script_only" as const;
  }
  if (!input.adapterModel) return "needs_adapter_contract" as const;
  const runtimeTruthBlocked =
    input.requestDraft.requestStatus === "blocked_by_runtime_truth" ||
    input.queuePreview?.queueStatus === "blocked_by_runtime_truth" ||
    input.costPolicyPreview.policyStatus === "blocked_by_runtime_truth" ||
    input.assetPackDraft.assetPackStatus === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth" ||
    input.adapterModel.adapterStatus === "blocked_by_runtime_truth";
  const hasConfiguredProvider = input.registryModel.providerRegistry.some((item) =>
    Boolean(normalizeText(item.providerName)),
  );
  const providerConfigurationGateNeeded = input.adapterModel.providerGateItems.some(
    (item) => item.id === "provider_configuration" && item.status !== "ready",
  );
  const providerConfigurationNeeded =
    !hasConfiguredProvider ||
    providerConfigurationGateNeeded ||
    ((!hasConfiguredProvider || providerConfigurationGateNeeded) &&
      (input.preflightModel?.providerSelectionStatus === "none_configured" ||
        input.preflightModel?.providerSelectionStatus === "requirement_only" ||
        input.preflightModel?.providerSelectionStatus === "candidate_needed" ||
        input.preflightModel?.providerSelectionStatus === "configuration_needed"));
  if (providerConfigurationNeeded) return "needs_provider_configuration" as const;
  const secretConfigurationNeeded =
    input.adapterModel.providerGateItems.some(
      (item) => item.id === "secret_runtime_truth" && item.status !== "ready",
    );
  if (secretConfigurationNeeded) return "needs_secret_configuration" as const;
  const pricingNeeded =
    input.costPolicyPreview.providerPricingStatus !== "available" ||
    input.costPolicyPreview.estimatedCostAmount === null;
  if (pricingNeeded) return "needs_provider_pricing" as const;
  const missingSubtitle = input.candidates.some(
    (candidate) =>
      candidate.missingCapabilities.includes("subtitles") ||
      candidate.missingCapabilities.includes("rtl_subtitles"),
  );
  if (input.rtlRequired && missingSubtitle) return "needs_subtitle_capability" as const;
  const missingLanguage = input.candidates.some((candidate) =>
    candidate.missingCapabilities.includes("multilingual_voice"),
  );
  if (input.crossLingual && missingLanguage) return "needs_language_capability" as const;
  const missingVoice = input.candidates.some((candidate) =>
    candidate.missingCapabilities.includes("voiceover"),
  );
  if (missingVoice) return "needs_voice_capability" as const;
  if (runtimeTruthBlocked) return "blocked_by_runtime_truth" as const;
  if (input.candidates.some((candidate) => candidate.status === "needs_review")) {
    return "needs_provider_review" as const;
  }
  if (input.candidates.every((candidate) => candidate.status === "requirement_only")) {
    return "requirements_only" as const;
  }
  return "provider_selection_draft_only" as const;
}

function buildDecision(
  status: VoxyRenderProviderSelectionDraftStatus,
): VoxyRenderProviderSelectionDecision {
  const nextProviderDecision: VoxyRenderProviderSelectionNextDecision =
    status === "needs_adapter_contract"
      ? "prepare_adapter_contract"
      : status === "needs_secret_configuration"
        ? "configure_secrets"
        : status === "needs_provider_pricing"
          ? "define_provider_pricing"
          : status === "needs_language_capability" ||
              status === "needs_subtitle_capability" ||
              status === "needs_voice_capability"
            ? "verify_language_capabilities"
            : status === "keep_as_script_only"
              ? "keep_as_script_only"
              : status.startsWith("blocked_")
                ? "blocked"
                : status === "needs_provider_configuration"
                  ? "configure_provider"
                  : "review_provider_requirements";
  const reviewerVisibleReason = voxyRenderProviderSelectionDraftStatusLabel(status);
  return {
    nextProviderDecision,
    userVisibleReason: reviewerVisibleReason,
    reviewerVisibleReason,
    nextStep: `${nextDecisionLabel(nextProviderDecision)}. Kein Providerlauf, keine Secrets und keine Kostenwahrheit entstehen in diesem Schritt.`,
  };
}

export function buildVoxyRenderProviderSelectionDraftFromReadmodels(
  input: BuildSelectionDraftInput,
): VoxyRenderProviderSelectionDraftRecord {
  const requestDraft = input.requestDraft ?? null;
  const queuePreview = input.queuePreview ?? null;
  const costPolicyPreview = input.costPolicyPreview ?? null;
  const assetPackDraft = input.assetPackDraft ?? null;
  const registryModel = input.registryModel ?? null;
  const adapterModel = input.adapterModel ?? null;
  const preflightModel = input.preflightModel ?? null;
  const gate = input.gate ?? null;
  const languages = resolveLanguageFields(input);
  const requiredCapabilities = buildRequiredCapabilities({
    crossLingual: languages.crossLingual,
    rtlRequired: languages.rtlRequired,
    assetPackDraft,
  });
  const providerConfigurationNeeded =
    !registryModel?.providerRegistry.some((item) => item.providerName) ||
    preflightModel?.providerSelectionStatus === "none_configured" ||
    preflightModel?.providerSelectionStatus === "requirement_only" ||
    preflightModel?.providerSelectionStatus === "candidate_needed" ||
    preflightModel?.providerSelectionStatus === "configuration_needed";
  const secretConfigurationNeeded =
    adapterModel?.providerGateItems.some(
      (item) => item.id === "secret_runtime_truth" && item.status !== "ready",
    ) ?? true;
  const pricingNeeded =
    costPolicyPreview?.providerPricingStatus !== "available" ||
    costPolicyPreview?.estimatedCostAmount === null;
  const hardBlocked =
    !requestDraft || !assetPackDraft || !costPolicyPreview || !registryModel;
  const adapterNeeded = !adapterModel;
  const candidates = [
    buildCandidateEntry({
      id: `provider-candidate:${sanitizeIdFragment(
        `${input.surface}:${languages.renderLanguage}:avatar-render`,
      )}`,
      label: "Avatar-Video & Render",
      requiredCapabilities: uniqueCapabilities([
        "avatar_video",
        "brand_overlay",
        "lower_thirds",
        "preview_render",
      ]),
      hardBlocked,
      adapterNeeded,
      providerConfigurationNeeded,
      secretConfigurationNeeded,
      pricingNeeded,
      registryModel,
      assetPackDraft,
      costPolicyPreview,
      adapterModel,
    }),
    buildCandidateEntry({
      id: `provider-candidate:${sanitizeIdFragment(
        `${input.surface}:${languages.renderLanguage}:voice-language`,
      )}`,
      label: "Voice & Sprache",
      requiredCapabilities: uniqueCapabilities([
        "voiceover",
        languages.crossLingual ? "multilingual_voice" : null,
      ]),
      hardBlocked,
      adapterNeeded,
      providerConfigurationNeeded,
      secretConfigurationNeeded,
      pricingNeeded,
      registryModel,
      assetPackDraft,
      costPolicyPreview,
      adapterModel,
    }),
    buildCandidateEntry({
      id: `provider-candidate:${sanitizeIdFragment(
        `${input.surface}:${languages.renderLanguage}:subtitle-caption`,
      )}`,
      label: "Untertitel, Captions & Export",
      requiredCapabilities: uniqueCapabilities([
        "subtitles",
        languages.rtlRequired ? "rtl_subtitles" : null,
        "source_captions",
        "export_preset",
      ]),
      hardBlocked,
      adapterNeeded,
      providerConfigurationNeeded,
      secretConfigurationNeeded,
      pricingNeeded,
      registryModel,
      assetPackDraft,
      costPolicyPreview,
      adapterModel,
    }),
    buildCandidateEntry({
      id: `provider-candidate:${sanitizeIdFragment(
        `${input.surface}:${languages.renderLanguage}:pricing-runtime`,
      )}`,
      label: "Pricing & Laufzeit",
      requiredCapabilities: ["cost_estimate", "preview_render"],
      hardBlocked,
      adapterNeeded,
      providerConfigurationNeeded,
      secretConfigurationNeeded,
      pricingNeeded,
      registryModel,
      assetPackDraft,
      costPolicyPreview,
      adapterModel,
      preferPricing: true,
    }),
  ];
  const providerSelectionStatus = buildSelectionStatus({
    requestDraft,
    assetPackDraft,
    costPolicyPreview,
    registryModel,
    adapterModel,
    preflightModel,
    queuePreview,
    crossLingual: languages.crossLingual,
    rtlRequired: languages.rtlRequired,
    candidates,
  });
  const decision = buildDecision(providerSelectionStatus);
  return {
    providerSelectionDraftId: `voxy-render-provider-selection-draft:${sanitizeIdFragment(
      [
        input.surface,
        gate?.decisionGateId ?? requestDraft?.decisionGateId ?? assetPackDraft?.decisionGateId ?? "preview",
        providerSelectionStatus,
      ].join(":"),
    ).slice(0, 96)}`,
    assetPackDraftId: assetPackDraft?.assetPackDraftId ?? null,
    costPolicyPreviewId: costPolicyPreview?.policyPreviewId ?? null,
    queuePreviewId: queuePreview?.queuePreviewId ?? null,
    requestDraftId: requestDraft?.requestDraftId ?? null,
    decisionId:
      assetPackDraft?.decisionId ??
      costPolicyPreview?.decisionId ??
      queuePreview?.decisionId ??
      requestDraft?.decisionId ??
      input.latestDecisionRecord?.decisionId ??
      null,
    decisionGateId:
      assetPackDraft?.decisionGateId ??
      costPolicyPreview?.decisionGateId ??
      queuePreview?.decisionGateId ??
      requestDraft?.decisionGateId ??
      gate?.decisionGateId ??
      input.latestDecisionRecord?.decisionGateId ??
      null,
    handoffRef:
      assetPackDraft?.handoffRef ??
      costPolicyPreview?.handoffRef ??
      queuePreview?.handoffRef ??
      requestDraft?.handoffRef ??
      gate?.handoffRef ??
      input.latestDecisionRecord?.handoffRef ??
      null,
    preflightRef:
      assetPackDraft?.preflightRef ??
      costPolicyPreview?.preflightRef ??
      queuePreview?.preflightRef ??
      requestDraft?.preflightRef ??
      gate?.preflightRef ??
      input.latestDecisionRecord?.preflightRef ??
      null,
    registryRef:
      assetPackDraft?.registryRef ??
      costPolicyPreview?.registryRef ??
      queuePreview?.registryRef ??
      requestDraft?.registryRef ??
      gate?.registryRef ??
      input.latestDecisionRecord?.registryRef ??
      null,
    adapterRef:
      assetPackDraft?.adapterRef ??
      costPolicyPreview?.adapterRef ??
      queuePreview?.adapterRef ??
      requestDraft?.adapterRef ??
      gate?.adapterRef ??
      input.latestDecisionRecord?.adapterRef ??
      null,
    scriptRef:
      assetPackDraft?.scriptRef ??
      costPolicyPreview?.scriptRef ??
      queuePreview?.scriptRef ??
      requestDraft?.scriptRef ??
      gate?.scriptRef ??
      input.latestDecisionRecord?.scriptRef ??
      null,
    contributionRef:
      assetPackDraft?.contributionRef ??
      costPolicyPreview?.contributionRef ??
      queuePreview?.contributionRef ??
      requestDraft?.contributionRef ??
      gate?.contributionRef ??
      input.latestDecisionRecord?.contributionRef ??
      null,
    dossierRef:
      assetPackDraft?.dossierRef ??
      costPolicyPreview?.dossierRef ??
      queuePreview?.dossierRef ??
      requestDraft?.dossierRef ??
      gate?.dossierRef ??
      input.latestDecisionRecord?.dossierRef ??
      null,
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
    providerSelectionStatus,
    candidates,
    inventoryFindings: uniqueStrings([
      requestDraft?.requestDraftId ? `Request-Draft: ${requestDraft.requestDraftId}` : null,
      queuePreview?.queuePreviewId ? `Queue-Preview: ${queuePreview.queuePreviewId}` : null,
      costPolicyPreview?.policyPreviewId
        ? `Cost-/Credit-Policy: ${costPolicyPreview.policyPreviewId}`
        : null,
      assetPackDraft?.assetPackDraftId ? `Asset-Pack-Draft: ${assetPackDraft.assetPackDraftId}` : null,
      "Repo-Wahrheit: VoiceProvider, AvatarProvider, RenderProvider und PublishProvider existieren nur als Interfaces.",
      registryModel?.providerRegistry.some((item) => item.providerName)
        ? "Es gibt belegte Providernamen in der Registry."
        : "Es gibt keine belegte Voxy-Render-Provider-Konfiguration mit konkretem Providernamen.",
      costPolicyPreview?.providerPricingStatus === "available"
        ? "Provider-Pricing ist belegt."
        : "Es gibt keine belastbare Provider-Pricing-Wahrheit für Voxy-Render.",
      adapterModel
        ? "Es gibt einen Noop-Adaptervertrag, aber keinen render-sicheren Ausführungspfad."
        : "Es gibt noch keinen belastbaren Adapterpfad für diesen Auswahl-Draft.",
      `Sprachen: Original ${languageName(languages.sourceLanguage)} · Lesefassung ${languageName(languages.readingLanguage)} · Script ${languageName(languages.scriptLanguage)} · Render ${languageName(languages.renderLanguage)}`,
      languages.subtitleLanguage
        ? `Untertitel: ${languageName(languages.subtitleLanguage)}`
        : "Untertitel bleiben offen.",
      languages.rtlRequired ? "RTL bleibt als harte Anforderung sichtbar." : null,
      languages.crossLingual ? "Cross-lingual bleibt als Sprach- und Voice-Anforderung sichtbar." : null,
      "Übersetzung bleibt Lesehilfe und kein Beleg.",
    ]),
    gateHints: uniqueStrings([
      preflightModel
        ? `Preflight: ${preflightModel.preflightStatusLabel} · Providerwahl: ${preflightModel.providerSelectionStatusLabel}`
        : null,
      costPolicyPreview
        ? `Pricing: ${costPolicyPreview.providerPricingLabel} · Metering: ${costPolicyPreview.runtimeMeteringLabel}`
        : null,
      adapterModel
        ? adapterModel.providerGateItems
            .map((item) => `${item.label}: ${item.statusLabel} · ${item.reason}`)
            .join(" | ")
        : null,
      assetPackDraft?.blockers.join(" · ") ?? null,
      registryModel?.providerRegistry
        .map((item) => `${item.label}: ${item.statusLabel} · ${item.reviewerVisibleReason}`)
        .join(" | "),
    ]),
    blockers: uniqueStrings([
      !requestDraft ? "Es gibt noch keinen Render-Request-Draft für eine belastbare Provider-Auswahl." : null,
      !assetPackDraft ? "Es gibt noch kein Render-Asset-Pack als Auswahlgrundlage." : null,
      !costPolicyPreview ? "Es gibt noch keine Cost-/Credit-Policy-Vorschau als Pricing-Grenze." : null,
      !registryModel ? "Es gibt noch keine ehrliche Asset-/Provider-Registry als Wahrheitsbasis." : null,
      providerSelectionStatus === "blocked_by_runtime_truth"
        ? "Runtime-Wahrheit bleibt weiterhin blockiert."
        : null,
      providerSelectionStatus === "needs_provider_configuration"
        ? "Konkrete Provider-Konfiguration fehlt."
        : null,
      providerSelectionStatus === "needs_secret_configuration"
        ? "Secret- und Runtime-Freigaben fehlen."
        : null,
      providerSelectionStatus === "needs_provider_pricing"
        ? "Belastbare Provider-Pricing-Wahrheit fehlt."
        : null,
      providerSelectionStatus === "needs_language_capability"
        ? "Mehrsprachige Voice-Fähigkeit bleibt unbelegt."
        : null,
      providerSelectionStatus === "needs_subtitle_capability"
        ? "Subtitle- oder RTL-Fähigkeit bleibt unbelegt."
        : null,
      providerSelectionStatus === "needs_voice_capability"
        ? "Voiceover-Fähigkeit bleibt unbelegt."
        : null,
      "Kein Providerlauf, keine API-Aufrufe, keine Secrets, keine Queue und keine Kostenbuchung.",
    ]),
    decision,
    execution: buildExecutionFlags(),
    persistedAt: normalizeText(input.persistedAt) || null,
    persistedBy: normalizeText(input.persistedBy) || null,
    idempotencyKey: null,
    previousProviderSelectionDraftRef: null,
    supersedesProviderSelectionDraftRef: null,
    providerSelectionVersion: null,
  };
}

export function buildVoxyRenderProviderSelectionDraftCommandFromPreview(
  preview: VoxyRenderProviderSelectionDraftRecord,
  options?: {
    createdAt?: string | null;
    createdBy?: string | null;
  },
): VoxyRenderProviderSelectionDraftCommand {
  return {
    ...preview,
    createdAt: normalizeText(options?.createdAt) || null,
    createdBy: normalizeText(options?.createdBy) || null,
  };
}

export function buildVoxyRenderProviderSelectionDraftFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderProviderSelectionDraftFromReadmodels({
    surface: "create",
    requestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    queuePreview: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
    costPolicyPreview: buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model),
    assetPackDraft: buildVoxyRenderAssetPackDraftPreviewFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
    handoffModel: buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model),
    preflightModel: buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model),
    registryModel: buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model),
    adapterModel: buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderProviderSelectionDraftFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience: "admin" | "workspace";
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    latestCostPolicyPreviewRecord?: VoxyRenderCostCreditPolicyPreviewRecord | null;
    latestAssetPackDraftRecord?: VoxyRenderAssetPackDraftPreviewRecord | null;
    contributionRef?: SelectionRef | null;
    dossierRef?: SelectionRef | null;
    outputRef?: SelectionRef | null;
  },
) {
  const audience = options?.audience ?? "admin";
  return buildVoxyRenderProviderSelectionDraftFromReadmodels({
    surface: audience,
    requestDraft:
      options?.latestRequestDraftRecord ??
      buildVoxyRenderRequestDraftFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
    queuePreview:
      options?.latestQueuePreviewRecord ??
      buildVoxyRenderQueuePreviewFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
    costPolicyPreview:
      options?.latestCostPolicyPreviewRecord ??
      buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        latestQueuePreviewRecord: options?.latestQueuePreviewRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
    assetPackDraft:
      options?.latestAssetPackDraftRecord ??
      buildVoxyRenderAssetPackDraftPreviewFromReviewContext(context, {
        audience,
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        latestQueuePreviewRecord: options?.latestQueuePreviewRecord ?? null,
        latestCostPolicyPreviewRecord: options?.latestCostPolicyPreviewRecord ?? null,
        contributionRef: options?.contributionRef ?? null,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
      }),
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

export function buildVoxyRenderProviderSelectionDraftFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    latestCostPolicyPreviewRecord?: VoxyRenderCostCreditPolicyPreviewRecord | null;
    latestAssetPackDraftRecord?: VoxyRenderAssetPackDraftPreviewRecord | null;
    contributionRef?: SelectionRef | null;
    dossierRef?: SelectionRef | null;
    outputRef?: SelectionRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  return buildVoxyRenderProviderSelectionDraftFromReadmodels({
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
    queuePreview:
      options?.latestQueuePreviewRecord ??
      buildVoxyRenderQueuePreviewFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        contributionRef,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
        nextStep: options?.nextStep,
      }),
    costPolicyPreview:
      options?.latestCostPolicyPreviewRecord ??
      buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        latestQueuePreviewRecord: options?.latestQueuePreviewRecord ?? null,
        contributionRef,
        dossierRef: options?.dossierRef ?? null,
        outputRef: options?.outputRef ?? null,
        nextStep: options?.nextStep,
      }),
    assetPackDraft:
      options?.latestAssetPackDraftRecord ??
      buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog(dialog, {
        latestDecisionRecord: options?.latestDecisionRecord ?? null,
        latestRequestDraftRecord: options?.latestRequestDraftRecord ?? null,
        latestQueuePreviewRecord: options?.latestQueuePreviewRecord ?? null,
        latestCostPolicyPreviewRecord: options?.latestCostPolicyPreviewRecord ?? null,
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

export function buildVoxyRenderProviderSelectionDraftPanelModel(input: {
  preview: VoxyRenderProviderSelectionDraftRecord | null;
  latestRecord?: VoxyRenderProviderSelectionDraftRecord | null;
  storeState?:
    | VoxyRenderProviderSelectionPersistenceState
    | VoxyRenderRequestDraftPersistenceState
    | VoxyRenderCostCreditPolicyPersistenceState
    | VoxyRenderAssetPackDraftPersistenceState
    | null;
}) {
  if (!input.preview) return null;
  const latestRecord = input.latestRecord ?? null;
  const storeState =
    (input.storeState as VoxyRenderProviderSelectionPersistenceState | null) ??
    defaultPersistenceState();
  return {
    title: "Provider-Auswahl",
    summary:
      "Dieser Draft zeigt nur, welche Provider-/Adapter-Optionen später grundsätzlich geeignet sein könnten und welche Konfigurations-, Secret-, Pricing-, Sprach- oder Subtitle-Gates noch fehlen. Er startet nichts.",
    preview: input.preview,
    providerSelectionStatusLabel: voxyRenderProviderSelectionDraftStatusLabel(
      input.preview.providerSelectionStatus,
    ),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          providerSelectionDraftId: latestRecord.providerSelectionDraftId,
          statusLabel: voxyRenderProviderSelectionDraftStatusLabel(
            latestRecord.providerSelectionStatus,
          ),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          providerSelectionVersion: latestRecord.providerSelectionVersion,
          assetPackDraftId: latestRecord.assetPackDraftId,
        }
      : null,
    blockedReasons: input.preview.blockers,
    auditLines: uniqueStrings([
      `Status: ${voxyRenderProviderSelectionDraftStatusLabel(
        input.preview.providerSelectionStatus,
      )}`,
      `Nächste Entscheidung: ${nextDecisionLabel(input.preview.decision.nextProviderDecision)}`,
      `Sprachen: ${languageName(input.preview.sourceLanguage)} -> ${languageName(input.preview.renderLanguage)}`,
      input.preview.subtitleLanguage
        ? `Untertitel: ${languageName(input.preview.subtitleLanguage)}`
        : "Untertitel: noch offen",
      input.preview.rtlRequired ? "RTL bleibt prüfpflichtig." : null,
      latestRecord?.persistedAt ? `Zuletzt gespeichert: ${latestRecord.persistedAt}` : null,
      "Kein Providerlauf, keine Secrets, keine API-Aufrufe, keine Queue, kein Render, keine Kostenbuchung und kein Publish.",
    ]),
    nextStep: input.preview.decision.nextStep,
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderProviderSelectionDraftPanelModel;
}
