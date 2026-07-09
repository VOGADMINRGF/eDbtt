import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type {
  V3VoxyCocreationDialogModel,
} from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyBriefingScriptCandidateModel,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyBriefingScriptCandidateFromCreateCandidatePreview,
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import type {
  VoxyRenderAssetProviderRegistryAsset,
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderPreflightReadinessModel,
  VoxyRenderPreflightRequiredAsset,
  VoxyRenderPreflightRequiredCapability,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import type {
  VoxyRenderProviderHandoffModel,
  VoxyRenderProviderHandoffReviewGate,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";

export const VOXY_RENDER_ADAPTER_NOOP_STATUSES = [
  "adapter_contract_only",
  "noop_preview",
  "blocked_by_configuration",
  "blocked_by_missing_provider",
  "blocked_by_missing_assets",
  "blocked_by_missing_cost_policy",
  "blocked_by_missing_review",
  "blocked_by_language_review",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderAdapterNoopStatus =
  (typeof VOXY_RENDER_ADAPTER_NOOP_STATUSES)[number];

export const VOXY_RENDER_ADAPTER_NOOP_TYPES = [
  "noop_blocked",
  "provider_requirement_only",
  "adapter_contract_preview",
] as const;

export type VoxyRenderAdapterNoopType =
  (typeof VOXY_RENDER_ADAPTER_NOOP_TYPES)[number];

export const VOXY_RENDER_ADAPTER_RESULT_KINDS = [
  "not_executed",
  "blocked_preview",
  "adapter_contract_only",
] as const;

export type VoxyRenderAdapterResultKind =
  (typeof VOXY_RENDER_ADAPTER_RESULT_KINDS)[number];

export const VOXY_RENDER_ADAPTER_NEXT_DECISIONS = [
  "configure_provider",
  "prepare_adapter_contract",
  "prepare_assets",
  "review_script",
  "review_language",
  "define_cost_policy",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderAdapterNextDecision =
  (typeof VOXY_RENDER_ADAPTER_NEXT_DECISIONS)[number];

export const VOXY_RENDER_ADAPTER_PROVIDER_GATES = [
  "provider_contract",
  "provider_configuration",
  "secret_runtime_truth",
  "render_queue_runtime",
] as const;

export type VoxyRenderAdapterProviderGate =
  (typeof VOXY_RENDER_ADAPTER_PROVIDER_GATES)[number];

export const VOXY_RENDER_ADAPTER_COST_GATES = [
  "cost_policy",
  "credit_policy",
  "usage_limit_policy",
  "billing_runtime_truth",
] as const;

export type VoxyRenderAdapterCostGate =
  (typeof VOXY_RENDER_ADAPTER_COST_GATES)[number];

export const VOXY_RENDER_ADAPTER_GATE_STATUSES = [
  "ready",
  "needs_review",
  "configuration_needed",
  "missing",
  "blocked",
] as const;

export type VoxyRenderAdapterGateStatus =
  (typeof VOXY_RENDER_ADAPTER_GATE_STATUSES)[number];

type AdapterSurface = "create" | "account" | "admin" | "workspace";

type AdapterRef = {
  id: string;
  title: string;
  href?: string | null;
};

type AdapterGateItem<T extends string> = {
  id: T;
  label: string;
  status: VoxyRenderAdapterGateStatus;
  statusLabel: string;
  reason: string;
};

export type VoxyRenderAdapterRequestPreview = {
  adapterRequestId: string;
  handoffRef: string | null;
  preflightRef: string | null;
  registryRef: string | null;
  scriptRef: string | null;
  contributionRef: string | null;
  dossierRef: string | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  requestedCapabilities: VoxyRenderPreflightRequiredCapability[];
  requiredAssets: VoxyRenderPreflightRequiredAsset[];
  reviewGates: VoxyRenderProviderHandoffReviewGate[];
  costGates: VoxyRenderAdapterCostGate[];
  providerGates: VoxyRenderAdapterProviderGate[];
};

export type VoxyRenderAdapterNoopExecution = {
  executionAllowed: false;
  providerExecutionAllowed: false;
  renderQueueAllowed: false;
  mediaFileCreationAllowed: false;
  costDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
};

export type VoxyRenderAdapterNoopResult = {
  resultKind: VoxyRenderAdapterResultKind;
  resultKindLabel: string;
  rendered: false;
  providerCalled: false;
  queueCreated: false;
  mediaCreated: false;
  costDebited: false;
  published: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAdapterDecision: {
    id: VoxyRenderAdapterNextDecision;
    label: string;
    reason: string;
  };
};

export type VoxyRenderAdapterNoopModel = {
  title: string;
  summary: string;
  surface: AdapterSurface;
  contributionRef: AdapterRef | null;
  dossierRef: AdapterRef | null;
  handoffRef: AdapterRef | null;
  preflightRef: AdapterRef | null;
  registryRef: AdapterRef | null;
  scriptRef: AdapterRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  adapterStatus: VoxyRenderAdapterNoopStatus;
  adapterStatusLabel: string;
  adapterType: VoxyRenderAdapterNoopType;
  adapterTypeLabel: string;
  requestPreview: VoxyRenderAdapterRequestPreview;
  requestedCapabilities: Array<{ id: VoxyRenderPreflightRequiredCapability; label: string; reason: string }>;
  requiredAssets: AdapterGateItem<VoxyRenderPreflightRequiredAsset>[];
  reviewGateItems: AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[];
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[];
  costGateItems: AdapterGateItem<VoxyRenderAdapterCostGate>[];
  blockedReasons: string[];
  configurationNeeds: string[];
  execution: VoxyRenderAdapterNoopExecution;
  noopResult: VoxyRenderAdapterNoopResult;
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  noRuntimeClaim: true;
};

type BuildModelInput = {
  surface: AdapterSurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  contributionRef?: AdapterRef | null;
  dossierRef?: AdapterRef | null;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function languageName(language: string): string {
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

function sanitizeIdFragment(value: string): string {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function gateStatusLabel(value: VoxyRenderAdapterGateStatus): string {
  if (value === "ready") return "Vorbereitet";
  if (value === "needs_review") return "Review fehlt";
  if (value === "configuration_needed") return "Konfiguration fehlt";
  if (value === "missing") return "Fehlt";
  return "Blockiert";
}

function adapterStatusLabel(value: VoxyRenderAdapterNoopStatus): string {
  if (value === "adapter_contract_only") return "Adapter-Vertrag vorbereitet";
  if (value === "noop_preview") return "Noop-Vorschau";
  if (value === "blocked_by_configuration") return "Konfiguration fehlt";
  if (value === "blocked_by_missing_provider") return "Provider-Anschluss fehlt";
  if (value === "blocked_by_missing_assets") return "Pflichtassets fehlen";
  if (value === "blocked_by_missing_cost_policy") return "Kostenregel fehlt";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_language_review") return "Sprachreview fehlt";
  if (value === "keep_as_script_only") return "Vorerst Script-only";
  return "Runtime-Wahrheit fehlt";
}

function adapterTypeLabel(value: VoxyRenderAdapterNoopType): string {
  if (value === "provider_requirement_only") return "Provider-Anforderung";
  if (value === "adapter_contract_preview") return "Adapter-Vorschau";
  return "Noop-Adapter";
}

function resultKindLabel(value: VoxyRenderAdapterResultKind): string {
  if (value === "adapter_contract_only") return "Nur Adapter-Vertrag";
  if (value === "blocked_preview") return "Blockierte Vorschau";
  return "Nicht ausgeführt";
}

function nextDecisionLabel(value: VoxyRenderAdapterNextDecision): string {
  if (value === "configure_provider") return "Provider-Anschluss definieren";
  if (value === "prepare_adapter_contract") return "Adapter-Vertrag weiter präzisieren";
  if (value === "prepare_assets") return "Pflichtassets vorbereiten";
  if (value === "review_script") return "Script und Review-Gates klären";
  if (value === "review_language") return "Sprach- und RTL-Review klären";
  if (value === "define_cost_policy") return "Kosten- und Credit-Regeln definieren";
  if (value === "keep_as_script_only") return "Vorläufig beim Script bleiben";
  return "Blocker offenlegen";
}

function capabilityLabel(value: VoxyRenderPreflightRequiredCapability): string {
  if (value === "avatar_video") return "Avatar-Video";
  if (value === "voiceover") return "Voice-over";
  if (value === "subtitles") return "Untertitel";
  if (value === "multilingual_voice") return "Mehrsprachige Stimme";
  if (value === "rtl_subtitles") return "RTL-Untertitel";
  if (value === "brand_overlay") return "Brand-Overlay";
  if (value === "lower_thirds") return "Lower Thirds";
  if (value === "background_scene") return "Hintergrundszene";
  if (value === "logo_lockup") return "Logo-Lockup";
  if (value === "caption_export") return "Caption-Export";
  if (value === "review_preview") return "Review-Vorschau";
  if (value === "render_queue") return "Render-Queue";
  return "Kosten- und Nutzungsprüfung";
}

function assetLabel(value: VoxyRenderPreflightRequiredAsset | VoxyRenderAssetProviderRegistryAsset): string {
  if (value === "voxy_avatar") return "Voxy-Avatar";
  if (value === "voice_profile") return "Stimmprofil";
  if (value === "brand_logo") return "Brand-Logo";
  if (value === "background_template") return "Hintergrundvorlage";
  if (value === "subtitle_template") return "Untertitelvorlage";
  if (value === "lower_third_template") return "Lower-Third-Vorlage";
  if (value === "source_caption_template") return "Quellen-Caption-Vorlage";
  return "Export-Preset";
}

function providerGateLabel(value: VoxyRenderAdapterProviderGate): string {
  if (value === "provider_contract") return "Provider-Vertrag";
  if (value === "provider_configuration") return "Provider-Konfiguration";
  if (value === "secret_runtime_truth") return "Secrets und Runtime-Wahrheit";
  return "Queue- und Medienruntime";
}

function costGateLabel(value: VoxyRenderAdapterCostGate): string {
  if (value === "cost_policy") return "Kostenregel";
  if (value === "credit_policy") return "Credit-Regel";
  if (value === "usage_limit_policy") return "Nutzungslimit";
  return "Billing- und Buchungswahrheit";
}

function reviewGateLabel(value: VoxyRenderProviderHandoffReviewGate): string {
  if (value === "briefing_review") return "Briefing-Review";
  if (value === "script_review") return "Script-Review";
  if (value === "render_review") return "Render-Review";
  return "Publish-Review";
}

function buildAdapterRefs(params: {
  surface: AdapterSurface;
  contributionRef: AdapterRef | null;
  dossierRef: AdapterRef | null;
  scriptModel: VoxyBriefingScriptCandidateModel;
}): Pick<
  VoxyRenderAdapterNoopModel,
  "handoffRef" | "preflightRef" | "registryRef" | "scriptRef"
> {
  const seed = params.contributionRef?.id ?? params.dossierRef?.id ?? params.scriptModel.scriptDraft.title;
  const normalizedSeed = sanitizeIdFragment(seed);
  const buildRef = (suffix: string, title: string): AdapterRef => ({
    id: `${sanitizeIdFragment(params.surface)}-${normalizedSeed}-${suffix}`,
    title,
  });

  return {
    handoffRef: buildRef("handoff", "Voxy Render/Provider Handoff"),
    preflightRef: buildRef("preflight", "Voxy Render Preflight"),
    registryRef: buildRef("registry", "Voxy Asset- & Provider-Registry"),
    scriptRef: buildRef("script", "Voxy Script Candidate"),
  };
}

function buildRequestedCapabilities(
  model: VoxyRenderPreflightReadinessModel | null,
): Array<{ id: VoxyRenderPreflightRequiredCapability; label: string; reason: string }> {
  return (model?.requiredCapabilities ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    reason: item.reason,
  }));
}

function buildRequiredAssets(
  preflightModel: VoxyRenderPreflightReadinessModel | null,
  registryModel: VoxyRenderAssetProviderRegistryModel | null,
): AdapterGateItem<VoxyRenderPreflightRequiredAsset>[] {
  const registryById = new Map(
    (registryModel?.assetInventory ?? []).map((item) => [item.id, item]),
  );

  return (preflightModel?.requiredAssets ?? []).map((item) => {
    const registryItem = registryById.get(item.id);
    let status: VoxyRenderAdapterGateStatus = "configuration_needed";
    if (item.status === "available") status = "ready";
    if (item.status === "missing") status = "missing";
    if (item.status === "requirements_only") status = "configuration_needed";
    if (registryItem?.status === "blocked") status = "blocked";
    if (registryItem?.status === "missing") status = "missing";
    if (registryItem?.status === "available") status = status === "missing" ? "missing" : "ready";

    return {
      id: item.id,
      label: item.label,
      status,
      statusLabel: gateStatusLabel(status),
      reason: uniqueStrings([item.reason, registryItem?.reviewerVisibleReason]).join(" "),
    };
  });
}

function buildReviewGateItems(
  handoffModel: VoxyRenderProviderHandoffModel | null,
  preflightModel: VoxyRenderPreflightReadinessModel | null,
): AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[] {
  return (handoffModel?.reviewGates ?? []).map((item) => {
    const preflightItem =
      item.id === "script_review"
        ? preflightModel?.reviewReadiness.find((entry) => entry.id === "scriptReview")
        : item.id === "publish_review"
          ? preflightModel?.reviewReadiness.find((entry) => entry.id === "publishingReview")
          : item.id === "render_review"
            ? preflightModel?.reviewReadiness.find((entry) => entry.id === "providerReview")
            : null;
    let status: VoxyRenderAdapterGateStatus = "ready";
    if (item.status === "needs_review") status = "needs_review";
    if (item.status === "blocked") status = "blocked";
    if (preflightItem?.status === "needs_review") status = "needs_review";
    if (preflightItem?.status === "blocked") status = "blocked";

    return {
      id: item.id,
      label: item.label,
      status,
      statusLabel: gateStatusLabel(status),
      reason: uniqueStrings([item.reason, preflightItem?.reason]).join(" "),
    };
  });
}

function buildProviderGateItems(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
}): AdapterGateItem<VoxyRenderAdapterProviderGate>[] {
  const providerRegistry = input.registryModel?.providerRegistry ?? [];
  const hasExplicitMissingProvider =
    input.handoffModel?.handoffStatus === "blocked_by_provider" ||
    input.preflightModel?.providerSelectionStatus === "none_configured" ||
    input.preflightModel?.providerSelectionStatus === "blocked" ||
    providerRegistry.some((item) => item.status === "missing");
  const hasConfigurationGap =
    input.preflightModel?.providerSelectionStatus === "requirement_only" ||
    input.preflightModel?.providerSelectionStatus === "candidate_needed" ||
    input.preflightModel?.providerSelectionStatus === "adapter_needed" ||
    input.preflightModel?.providerSelectionStatus === "configuration_needed" ||
    providerRegistry.some((item) =>
      item.status === "requirement_only" ||
      item.status === "adapter_needed" ||
      item.status === "configuration_needed",
    );
  const runtimeBlocked =
    input.handoffModel?.handoffStatus === "blocked_by_secret" ||
    input.handoffModel?.handoffStatus === "blocked_by_runtime_truth" ||
    input.registryModel?.registryStatus === "blocked_by_runtime_truth";

  const providerContractStatus: VoxyRenderAdapterGateStatus =
    hasExplicitMissingProvider
      ? "missing"
      : hasConfigurationGap
        ? "configuration_needed"
        : "ready";
  const providerConfigStatus: VoxyRenderAdapterGateStatus =
    hasConfigurationGap
      ? "configuration_needed"
      : hasExplicitMissingProvider
        ? "missing"
        : "ready";
  const runtimeTruthStatus: VoxyRenderAdapterGateStatus = runtimeBlocked ? "blocked" : "configuration_needed";
  const queueRuntimeStatus: VoxyRenderAdapterGateStatus = "blocked";

  return [
    {
      id: "provider_contract",
      label: providerGateLabel("provider_contract"),
      status: providerContractStatus,
      statusLabel: gateStatusLabel(providerContractStatus),
      reason: hasExplicitMissingProvider
        ? "Es gibt keinen belegten Avatar-, Voice- oder Render-Provider als ausführbare Wahrheit."
        : hasConfigurationGap
          ? "Provider-Schnittstellen sind nur als Anforderung oder Adapterpunkt sichtbar."
          : "Provider-Vertrag wäre formal beschrieben, bleibt aber readmodel-only.",
    },
    {
      id: "provider_configuration",
      label: providerGateLabel("provider_configuration"),
      status: providerConfigStatus,
      statusLabel: gateStatusLabel(providerConfigStatus),
      reason:
        input.preflightModel?.providerSelectionStatusLabel ??
        "Konkrete Provider-Konfiguration bleibt offen.",
    },
    {
      id: "secret_runtime_truth",
      label: providerGateLabel("secret_runtime_truth"),
      status: runtimeTruthStatus,
      statusLabel: gateStatusLabel(runtimeTruthStatus),
      reason: runtimeBlocked
        ? "Secrets, Runtime-Wahrheit oder server-only Providerpfade fehlen weiterhin."
        : "Ohne echte Runtime- und Secret-Wahrheit bleibt der Adapter bewusst blockiert.",
    },
    {
      id: "render_queue_runtime",
      label: providerGateLabel("render_queue_runtime"),
      status: queueRuntimeStatus,
      statusLabel: gateStatusLabel(queueRuntimeStatus),
      reason: "Es gibt keine Voxy-Render-Queue, keinen Worker und keine Medienruntime.",
    },
  ];
}

function buildCostGateItems(
  model: VoxyRenderPreflightReadinessModel | null,
): AdapterGateItem<VoxyRenderAdapterCostGate>[] {
  const status = model?.costStatus ?? "unknown";
  const isBlocked =
    status === "blocked_by_missing_runtime" || status === "blocked_by_missing_account_context";
  const isConfig =
    status === "estimate_needed" ||
    status === "credit_policy_needed" ||
    status === "limit_check_needed";
  const isMissing = status === "unknown";

  const gateStatus: VoxyRenderAdapterGateStatus =
    isBlocked ? "blocked" : isMissing ? "missing" : isConfig ? "configuration_needed" : "ready";

  return [
    {
      id: "cost_policy",
      label: costGateLabel("cost_policy"),
      status: gateStatus,
      statusLabel: gateStatusLabel(gateStatus),
      reason:
        status === "estimate_needed"
          ? "Ein belastbarer Kostenrahmen für Rendering fehlt."
          : status === "unknown"
            ? "Es gibt noch keine dokumentierte Render-Kostenwahrheit."
            : "Kostenpfade bleiben readmodel-only.",
    },
    {
      id: "credit_policy",
      label: costGateLabel("credit_policy"),
      status:
        status === "credit_policy_needed" ? "configuration_needed" : gateStatus,
      statusLabel: gateStatusLabel(
        status === "credit_policy_needed" ? "configuration_needed" : gateStatus,
      ),
      reason:
        status === "credit_policy_needed"
          ? "Eine render-spezifische Credit-Regel ist nicht festgelegt."
          : "Es gibt keine Credit-Abbuchung für diesen Layer.",
    },
    {
      id: "usage_limit_policy",
      label: costGateLabel("usage_limit_policy"),
      status:
        status === "limit_check_needed" ? "configuration_needed" : gateStatus,
      statusLabel: gateStatusLabel(
        status === "limit_check_needed" ? "configuration_needed" : gateStatus,
      ),
      reason:
        status === "limit_check_needed"
          ? "Nutzungs- und Freigabelimits sind nicht als Render-Policy belegt."
          : "Es gibt keine aktive Render-Nutzung, daher auch keine verbuchte Limitprüfung.",
    },
    {
      id: "billing_runtime_truth",
      label: costGateLabel("billing_runtime_truth"),
      status: gateStatus === "ready" ? "ready" : isBlocked ? "blocked" : "configuration_needed",
      statusLabel: gateStatusLabel(
        gateStatus === "ready" ? "ready" : isBlocked ? "blocked" : "configuration_needed",
      ),
      reason: isBlocked
        ? "Billing- oder Account-Kontext fehlt für jede spätere Ausführung."
        : gateStatus === "ready"
          ? "Kosten- und Billing-Regeln wären formal beschrieben, Ausführung bleibt trotzdem deaktiviert."
          : "Es existiert keine Billing-, Debit- oder Buchungsruntime für Voxy-Renderings.",
    },
  ];
}

function determineStatus(input: {
  surface: AdapterSurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  reviewGateItems: AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[];
  requiredAssets: AdapterGateItem<VoxyRenderPreflightRequiredAsset>[];
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[];
  costGateItems: AdapterGateItem<VoxyRenderAdapterCostGate>[];
}): VoxyRenderAdapterNoopStatus {
  if (!input.scriptModel || !input.preflightModel) return "blocked_by_runtime_truth";

  const crossLingual =
    input.scriptModel.sourceLanguage !== input.scriptModel.readingLanguage ||
    input.scriptModel.scriptLanguage !== input.preflightModel.renderLanguage ||
    input.preflightModel.subtitleLanguage !== null;
  const languageReviewItem = input.preflightModel.reviewReadiness.find(
    (item) => item.id === "languageReview",
  );
  if (
    (input.scriptModel.rtlDisplayHint || crossLingual) &&
    languageReviewItem?.status !== "ready"
  ) {
    return "blocked_by_language_review";
  }

  if (input.reviewGateItems.some((item) => item.status === "needs_review" || item.status === "blocked")) {
    return "blocked_by_missing_review";
  }
  if (input.requiredAssets.some((item) => item.status === "missing" || item.status === "blocked")) {
    return "blocked_by_missing_assets";
  }
  if (input.costGateItems.some((item) => item.status !== "ready")) {
    return "blocked_by_missing_cost_policy";
  }
  if (input.providerGateItems.some((item) => item.status === "missing")) {
    return "blocked_by_missing_provider";
  }
  if (
    input.requiredAssets.some((item) => item.status === "configuration_needed") ||
    input.providerGateItems.some((item) => item.status === "configuration_needed") ||
    input.costGateItems.some((item) => item.status === "configuration_needed")
  ) {
    return input.surface === "create" ? "noop_preview" : "blocked_by_configuration";
  }
  if (input.preflightModel.preflightStatus === "keep_as_script_only") {
    return "keep_as_script_only";
  }
  return "adapter_contract_only";
}

function determineAdapterType(
  status: VoxyRenderAdapterNoopStatus,
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[],
): VoxyRenderAdapterNoopType {
  if (
    status === "blocked_by_missing_provider" ||
    providerGateItems.some((item) => item.status === "missing")
  ) {
    return "provider_requirement_only";
  }
  if (status === "adapter_contract_only" || status === "noop_preview") {
    return "adapter_contract_preview";
  }
  return "noop_blocked";
}

function buildNextDecision(
  status: VoxyRenderAdapterNoopStatus,
): { id: VoxyRenderAdapterNextDecision; reason: string } {
  if (status === "blocked_by_language_review") {
    return {
      id: "review_language",
      reason: "Cross-lingual oder RTL-Fälle brauchen erst ein sichtbares Sprachreview.",
    };
  }
  if (status === "blocked_by_missing_review") {
    return {
      id: "review_script",
      reason: "Briefing-, Script-, Render- oder Publish-Review ist noch offen.",
    };
  }
  if (status === "blocked_by_missing_assets") {
    return {
      id: "prepare_assets",
      reason: "Pflichtassets müssen real vorhanden und überprüfbar sein.",
    };
  }
  if (status === "blocked_by_missing_cost_policy") {
    return {
      id: "define_cost_policy",
      reason: "Kosten-, Credit- und Limitregeln dürfen nicht implizit bleiben.",
    };
  }
  if (status === "blocked_by_missing_provider" || status === "blocked_by_configuration") {
    return {
      id: "configure_provider",
      reason: "Provider-, Secret- und Runtime-Anschluss fehlen weiterhin als belastbare Wahrheit.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      id: "keep_as_script_only",
      reason: "Der Arbeitsstand bleibt vorerst bewusst beim Script statt beim Renderpfad.",
    };
  }
  if (status === "adapter_contract_only" || status === "noop_preview") {
    return {
      id: "prepare_adapter_contract",
      reason: "Der Adapter ist nur als Vertrag und Noop-Vorschau vorbereitet.",
    };
  }
  return {
    id: "blocked",
    reason: "Ohne belastbare Runtime-Wahrheit darf der Adapter nichts ausführen.",
  };
}

function buildBlockedReasons(params: {
  reviewGateItems: AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[];
  requiredAssets: AdapterGateItem<VoxyRenderPreflightRequiredAsset>[];
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[];
  costGateItems: AdapterGateItem<VoxyRenderAdapterCostGate>[];
  scriptModel: VoxyBriefingScriptCandidateModel;
  preflightModel: VoxyRenderPreflightReadinessModel;
}): string[] {
  const reasons = [
    ...params.reviewGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
    ...params.requiredAssets
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
    ...params.providerGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
    ...params.costGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
  ];

  if (params.scriptModel.rtlDisplayHint) {
    reasons.push("RTL-Fall bleibt reviewpflichtig und darf nicht blind in Untertitel- oder Layoutpfade laufen.");
  }
  if (
    params.scriptModel.sourceLanguage !== params.scriptModel.readingLanguage ||
    params.scriptModel.scriptLanguage !== params.preflightModel.renderLanguage
  ) {
    reasons.push("Originalsprache, Lesefassung und Render-Sprache bleiben getrennt und brauchen menschliche Prüfung.");
  }

  return uniqueStrings(reasons);
}

function buildConfigurationNeeds(params: {
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[];
  requiredAssets: AdapterGateItem<VoxyRenderPreflightRequiredAsset>[];
  costGateItems: AdapterGateItem<VoxyRenderAdapterCostGate>[];
  reviewGateItems: AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[];
}): string[] {
  return uniqueStrings([
    ...params.providerGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.statusLabel}`),
    ...params.requiredAssets
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.statusLabel}`),
    ...params.costGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.statusLabel}`),
    ...params.reviewGateItems
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.statusLabel}`),
  ]);
}

function buildRequestPreview(params: {
  surface: AdapterSurface;
  contributionRef: AdapterRef | null;
  dossierRef: AdapterRef | null;
  scriptModel: VoxyBriefingScriptCandidateModel;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  handoffRef: AdapterRef | null;
  preflightRef: AdapterRef | null;
  registryRef: AdapterRef | null;
  scriptRef: AdapterRef | null;
  reviewGateItems: AdapterGateItem<VoxyRenderProviderHandoffReviewGate>[];
  providerGateItems: AdapterGateItem<VoxyRenderAdapterProviderGate>[];
  costGateItems: AdapterGateItem<VoxyRenderAdapterCostGate>[];
}): VoxyRenderAdapterRequestPreview {
  const seed = params.contributionRef?.id ?? params.dossierRef?.id ?? params.scriptModel.scriptDraft.title;

  return {
    adapterRequestId: `${sanitizeIdFragment(params.surface)}-${sanitizeIdFragment(seed)}-render-adapter-request`,
    handoffRef: params.handoffRef?.id ?? null,
    preflightRef: params.preflightRef?.id ?? null,
    registryRef: params.registryRef?.id ?? null,
    scriptRef: params.scriptRef?.id ?? null,
    contributionRef: params.contributionRef?.id ?? null,
    dossierRef: params.dossierRef?.id ?? null,
    videoFormat: "briefing_video",
    sourceLanguage: params.scriptModel.sourceLanguage,
    readingLanguage: params.scriptModel.readingLanguage,
    scriptLanguage: params.scriptModel.scriptLanguage,
    renderLanguage: params.preflightModel?.renderLanguage ?? params.scriptModel.scriptLanguage,
    subtitleLanguage: params.preflightModel?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: params.scriptModel.rtlDisplayHint,
    requestedCapabilities: (params.preflightModel?.requiredCapabilities ?? []).map((item) => item.id),
    requiredAssets: (params.preflightModel?.requiredAssets ?? []).map((item) => item.id),
    reviewGates: params.reviewGateItems.map((item) => item.id),
    costGates: params.costGateItems.map((item) => item.id),
    providerGates: params.providerGateItems.map((item) => item.id),
  };
}

function buildModelFromInput(input: BuildModelInput): VoxyRenderAdapterNoopModel | null {
  if (!input.scriptModel) {
    return null;
  }

  const contributionRef =
    input.contributionRef ??
    input.scriptModel.contributionRef ??
    input.handoffModel?.contributionRef ??
    null;
  const dossierRef =
    input.dossierRef ??
    input.scriptModel.dossierRef ??
    input.handoffModel?.dossierRef ??
    input.registryModel?.dossierRef ??
    null;
  const derivedRefs = buildAdapterRefs({
    surface: input.surface,
    contributionRef,
    dossierRef,
    scriptModel: input.scriptModel,
  });
  const requestedCapabilities = buildRequestedCapabilities(input.preflightModel);
  const requiredAssets = buildRequiredAssets(input.preflightModel, input.registryModel);
  const reviewGateItems = buildReviewGateItems(input.handoffModel, input.preflightModel);
  const providerGateItems = buildProviderGateItems({
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
    registryModel: input.registryModel,
  });
  const costGateItems = buildCostGateItems(input.preflightModel);
  const adapterStatus = determineStatus({
    surface: input.surface,
    scriptModel: input.scriptModel,
    preflightModel: input.preflightModel,
    reviewGateItems,
    requiredAssets,
    providerGateItems,
    costGateItems,
  });
  const adapterType = determineAdapterType(adapterStatus, providerGateItems);
  const nextDecision = buildNextDecision(adapterStatus);
  const blockedReasons = buildBlockedReasons({
    reviewGateItems,
    requiredAssets,
    providerGateItems,
    costGateItems,
    scriptModel: input.scriptModel,
    preflightModel: input.preflightModel ?? {
      renderLanguage: input.scriptModel.scriptLanguage,
      subtitleLanguage: null,
    } as VoxyRenderPreflightReadinessModel,
  });
  const configurationNeeds = buildConfigurationNeeds({
    providerGateItems,
    requiredAssets,
    costGateItems,
    reviewGateItems,
  });
  const requestPreview = buildRequestPreview({
    surface: input.surface,
    contributionRef,
    dossierRef,
    scriptModel: input.scriptModel,
    preflightModel: input.preflightModel,
    handoffRef: derivedRefs.handoffRef,
    preflightRef: derivedRefs.preflightRef,
    registryRef: derivedRefs.registryRef,
    scriptRef: derivedRefs.scriptRef,
    reviewGateItems,
    providerGateItems,
    costGateItems,
  });
  const sourceLanguage = input.scriptModel.sourceLanguage;
  const readingLanguage = input.scriptModel.readingLanguage;
  const scriptLanguage = input.scriptModel.scriptLanguage;
  const renderLanguage = input.preflightModel?.renderLanguage ?? scriptLanguage;
  const subtitleLanguage = input.preflightModel?.subtitleLanguage ?? null;
  const languageLabel =
    `Original: ${languageName(sourceLanguage)} · Lesefassung: ${languageName(readingLanguage)} · ` +
    `Script: ${languageName(scriptLanguage)} · Render: ${languageName(renderLanguage)}` +
    (subtitleLanguage ? ` · Untertitel: ${languageName(subtitleLanguage)}` : "") +
    (input.scriptModel.rtlDisplayHint ? " · RTL-Hinweis aktiv" : "");

  const noopResultKind: VoxyRenderAdapterResultKind =
    adapterStatus === "adapter_contract_only"
      ? "adapter_contract_only"
      : adapterStatus === "noop_preview"
        ? "not_executed"
        : "blocked_preview";

  return {
    title: "Render-Adapter",
    summary:
      "Dieser Layer bereitet nur einen provider-neutralen Adapter-Vertrag vor. Er startet keinen Provider, kein Rendering, keine Queue, keine Datei und keine Veröffentlichung.",
    surface: input.surface,
    contributionRef,
    dossierRef,
    handoffRef: derivedRefs.handoffRef,
    preflightRef: derivedRefs.preflightRef,
    registryRef: derivedRefs.registryRef,
    scriptRef: derivedRefs.scriptRef,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    languageLabel,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: input.scriptModel.rtlDisplayHint,
    adapterStatus,
    adapterStatusLabel: adapterStatusLabel(adapterStatus),
    adapterType,
    adapterTypeLabel: adapterTypeLabel(adapterType),
    requestPreview,
    requestedCapabilities,
    requiredAssets,
    reviewGateItems,
    providerGateItems,
    costGateItems,
    blockedReasons,
    configurationNeeds,
    execution: {
      executionAllowed: false,
      providerExecutionAllowed: false,
      renderQueueAllowed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
    },
    noopResult: {
      resultKind: noopResultKind,
      resultKindLabel: resultKindLabel(noopResultKind),
      rendered: false,
      providerCalled: false,
      queueCreated: false,
      mediaCreated: false,
      costDebited: false,
      published: false,
      reviewerVisibleReason: input.reviewerVisibleReason,
      userVisibleReason: input.userVisibleReason,
      nextAdapterDecision: {
        id: nextDecision.id,
        label: nextDecisionLabel(nextDecision.id),
        reason: nextDecision.reason,
      },
    },
    publicSafeLabel:
      adapterStatus === "adapter_contract_only"
        ? "Adapter-Vertrag vorbereitet"
        : "Noch kein Providerlauf",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    noRuntimeClaim: true,
  };
}

export function buildVoxyRenderAdapterNoopFromReadmodels(params: {
  surface: AdapterSurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  contributionRef?: AdapterRef | null;
  dossierRef?: AdapterRef | null;
  userVisibleReason?: string;
  reviewerVisibleReason?: string;
  nextStep?: string;
}) {
  return buildModelFromInput({
    surface: params.surface,
    scriptModel: params.scriptModel,
    handoffModel: params.handoffModel,
    preflightModel: params.preflightModel,
    registryModel: params.registryModel,
    contributionRef: params.contributionRef ?? null,
    dossierRef: params.dossierRef ?? null,
    userVisibleReason:
      params.userVisibleReason ??
      "Es gibt noch keinen Providerlauf. Der Adapter bleibt eine sichere Noop-Vorschau ohne Rendern, Datei, Kosten oder Veröffentlichung.",
    reviewerVisibleReason:
      params.reviewerVisibleReason ??
      "Der Adapter ist nur als readmodel-only Vertrag vorbereitet. Alle Execution-Flags bleiben bewusst false.",
    nextStep: params.nextStep ?? "Render-Adapter prüfen",
  });
}

export function buildVoxyRenderAdapterNoopFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);
  const handoffModel = buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const preflightModel = buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model);

  return buildVoxyRenderAdapterNoopFromReadmodels({
    surface: "create",
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    contributionRef: scriptModel?.contributionRef ?? handoffModel?.contributionRef ?? null,
    dossierRef: handoffModel?.dossierRef ?? null,
    userVisibleReason:
      "In /create bleibt der Render-Adapter eine ehrliche Noop-Vorschau. Nichts wird gerendert, gebucht oder veröffentlicht.",
    reviewerVisibleReason:
      "Create zeigt nur den Adapter-Vertrag über Handoff, Preflight und Registry. Keine Queue, keine Secrets, keine Medienruntime.",
    nextStep: "Render-Adapter im Preview prüfen",
  });
}

export function buildVoxyRenderAdapterNoopFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: AdapterRef | null;
    dossierRef?: AdapterRef | null;
    outputRef?: AdapterRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  const scriptModel = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
    contributionRef,
    nextStep: options?.nextStep ?? "Render-Adapter prüfen",
  });
  const handoffModel = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Adapter prüfen",
  });
  const preflightModel = buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Adapter prüfen",
  });
  const registryModel = buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Adapter prüfen",
  });

  return buildVoxyRenderAdapterNoopFromReadmodels({
    surface: "account",
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    contributionRef,
    dossierRef: options?.dossierRef ?? null,
    userVisibleReason:
      "Im Account bleibt dieser Adapter ein lokaler oder resume-fähiger Noop-Vertrag. Kein Provider wird angerufen.",
    reviewerVisibleReason:
      "Lokale und resume-fähige Arbeitsstände zeigen nur den Adapter-Contract mit explizit deaktivierter Ausführung.",
    nextStep: options?.nextStep ?? "Render-Adapter prüfen",
  });
}

export function buildVoxyRenderAdapterNoopFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: AdapterRef | null;
    dossierRef?: AdapterRef | null;
    outputRef?: AdapterRef | null;
  },
) {
  const surface: Extract<AdapterSurface, "admin" | "workspace"> =
    options?.audience === "admin" ? "admin" : "workspace";
  const scriptModel = buildVoxyBriefingScriptCandidateFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  const handoffModel = buildVoxyRenderProviderHandoffFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  const preflightModel = buildVoxyRenderPreflightReadinessFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  const registryModel = buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });

  return buildVoxyRenderAdapterNoopFromReadmodels({
    surface,
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    userVisibleReason:
      options?.audience === "admin"
        ? "Admin sieht nur einen blockierten Adapter-Vertrag. Kein Providerlauf, keine Queue, keine Medien und keine Kostenbuchung werden ausgelöst."
        : "Im Studio bleibt der Adapter eine sichere Noop-Schicht. Er erklärt nur, was für einen späteren Anschluss fehlen würde.",
    reviewerVisibleReason:
      options?.audience === "admin"
        ? "Admin-Kontext zeigt nur den typed Noop-Adapter über Handoff, Preflight und Registry."
        : "Studio-Kontext zeigt nur den typed Noop-Adapter neben Handoff, Preflight und Registry.",
    nextStep:
      options?.audience === "admin"
        ? "Adapter-Gates im Review prüfen"
        : "Render-Adapter im Studio prüfen",
  });
}
