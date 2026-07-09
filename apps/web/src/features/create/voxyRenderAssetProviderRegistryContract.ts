import voxyManifest from "../../../public/brand/voxy/manifest.json";
import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyBriefingScriptCandidateModel,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyBriefingScriptCandidateFromCreateCandidatePreview,
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
} from "@/features/create/voxyBriefingScriptCandidateContract";
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
import { VOXY_ASSET_MAP, VOXY_MANIFEST_PATH, VOXY_OVERLAYS } from "@/features/voxy/voxyAssets";

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_STATUSES = [
  "readmodel_only",
  "inventory_preview",
  "requirements_only",
  "partially_configured",
  "needs_asset_inventory",
  "needs_provider_registry",
  "needs_provider_configuration",
  "blocked_by_missing_assets",
  "blocked_by_missing_provider",
  "blocked_by_runtime_truth",
] as const;

export type VoxyRenderAssetProviderRegistryStatus =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_STATUSES)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSETS = [
  "voxy_avatar",
  "voice_profile",
  "brand_logo",
  "background_template",
  "subtitle_template",
  "lower_third_template",
  "source_caption_template",
  "export_preset",
] as const;

export type VoxyRenderAssetProviderRegistryAsset =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSETS)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSET_STATUSES = [
  "available",
  "missing",
  "requirement_only",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderAssetProviderRegistryAssetStatus =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSET_STATUSES)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSET_SOURCES = [
  "repo",
  "manifest",
  "requirement",
  "unknown",
] as const;

export type VoxyRenderAssetProviderRegistryAssetSource =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_ASSET_SOURCES)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_CAPABILITIES = [
  "avatar_video",
  "voiceover",
  "subtitles",
  "multilingual_voice",
  "rtl_subtitles",
  "brand_overlay",
  "lower_thirds",
  "background_scene",
  "logo_lockup",
  "caption_export",
  "review_preview",
  "render_queue",
  "usage_cost_estimate",
] as const;

export type VoxyRenderAssetProviderRegistryCapability =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_CAPABILITIES)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_PROVIDER_STATUSES = [
  "missing",
  "requirement_only",
  "adapter_needed",
  "configuration_needed",
  "blocked",
] as const;

export type VoxyRenderAssetProviderRegistryProviderStatus =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_PROVIDER_STATUSES)[number];

export const VOXY_RENDER_ASSET_PROVIDER_REGISTRY_DECISIONS = [
  "inventory_assets",
  "prepare_assets",
  "configure_provider",
  "create_adapter_contract",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderAssetProviderRegistryDecision =
  (typeof VOXY_RENDER_ASSET_PROVIDER_REGISTRY_DECISIONS)[number];

type RegistrySurface = "create" | "account" | "admin" | "workspace";

type RegistryRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderAssetProviderRegistryAssetItem = {
  id: VoxyRenderAssetProviderRegistryAsset;
  label: string;
  status: VoxyRenderAssetProviderRegistryAssetStatus;
  statusLabel: string;
  source: VoxyRenderAssetProviderRegistryAssetSource;
  sourceLabel: string;
  publicPath: string | null;
  reviewerVisibleReason: string;
};

export type VoxyRenderAssetProviderRegistryProviderItem = {
  id: VoxyRenderAssetProviderRegistryCapability;
  label: string;
  status: VoxyRenderAssetProviderRegistryProviderStatus;
  statusLabel: string;
  providerName: string | null;
  executionAllowed: false;
  reviewerVisibleReason: string;
};

export type VoxyRenderAssetProviderRegistryModel = {
  title: string;
  summary: string;
  surface: RegistrySurface;
  manifestPath: string;
  contributionRef: RegistryRef | null;
  dossierRef: RegistryRef | null;
  outputRef: RegistryRef | null;
  registryStatus: VoxyRenderAssetProviderRegistryStatus;
  registryStatusLabel: string;
  assetInventory: VoxyRenderAssetProviderRegistryAssetItem[];
  providerRegistry: VoxyRenderAssetProviderRegistryProviderItem[];
  languageRequirements: {
    sourceLanguage: string;
    readingLanguage: string;
    scriptLanguage: string;
    renderLanguage: string;
    subtitleLanguage: string | null;
    rtlRequired: boolean;
    translationIsEvidence: false;
    originalPreserved: true;
    label: string;
  };
  blockers: string[];
  registryDecision: {
    id: VoxyRenderAssetProviderRegistryDecision;
    label: string;
    reason: string;
  };
  nextStep: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  publicSafeLabel: string;
  noRenderAction: true;
  noProviderExecution: true;
  noCostDebit: true;
  noPublishAction: true;
  noRuntimeClaim: true;
};

type BuildRegistryInput = {
  surface: RegistrySurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  contributionRef?: RegistryRef | null;
  dossierRef?: RegistryRef | null;
  outputRef?: RegistryRef | null;
  nextStep: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
};

type ManifestAssetRecord = {
  id?: string;
  png?: string;
  webp?: string;
  role?: string;
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

function registryStatusLabel(value: VoxyRenderAssetProviderRegistryStatus): string {
  if (value === "inventory_preview") return "Inventur-Vorschau";
  if (value === "requirements_only") return "Nur Anforderungen sichtbar";
  if (value === "partially_configured") return "Teilweise konfiguriert";
  if (value === "needs_asset_inventory") return "Asset-Inventur fehlt";
  if (value === "needs_provider_registry") return "Provider-Registry fehlt";
  if (value === "needs_provider_configuration") return "Provider-Konfiguration fehlt";
  if (value === "blocked_by_missing_assets") return "Ohne Pflichtassets blockiert";
  if (value === "blocked_by_missing_provider") return "Ohne Providertruth blockiert";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

function assetLabel(value: VoxyRenderAssetProviderRegistryAsset): string {
  if (value === "voxy_avatar") return "Voxy-Avatar";
  if (value === "voice_profile") return "Voice-Profil";
  if (value === "brand_logo") return "Brand-Logo";
  if (value === "background_template") return "Background-Template";
  if (value === "subtitle_template") return "Subtitle-Template";
  if (value === "lower_third_template") return "Lower-Third-Template";
  if (value === "source_caption_template") return "Source-Caption-Template";
  return "Export-Preset";
}

function assetStatusLabel(value: VoxyRenderAssetProviderRegistryAssetStatus): string {
  if (value === "available") return "Vorhanden";
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "needs_review") return "Review nötig";
  if (value === "blocked") return "Blockiert";
  return "Fehlt";
}

function assetSourceLabel(value: VoxyRenderAssetProviderRegistryAssetSource): string {
  if (value === "repo") return "Repo";
  if (value === "manifest") return "Manifest";
  if (value === "requirement") return "Anforderung";
  return "Unklar";
}

function capabilityLabel(value: VoxyRenderAssetProviderRegistryCapability): string {
  if (value === "avatar_video") return "Avatar-Video";
  if (value === "voiceover") return "Voiceover";
  if (value === "subtitles") return "Untertitel";
  if (value === "multilingual_voice") return "Mehrsprachige Voice";
  if (value === "rtl_subtitles") return "RTL-Untertitel";
  if (value === "brand_overlay") return "Brand-Overlay";
  if (value === "lower_thirds") return "Lower Thirds";
  if (value === "background_scene") return "Hintergrundszene";
  if (value === "logo_lockup") return "Logo-Lockup";
  if (value === "caption_export") return "Caption-Export";
  if (value === "review_preview") return "Review-Vorschau";
  if (value === "render_queue") return "Render-Queue";
  return "Usage-/Kostenschätzung";
}

function providerStatusLabel(value: VoxyRenderAssetProviderRegistryProviderStatus): string {
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "adapter_needed") return "Adapter fehlt";
  if (value === "configuration_needed") return "Konfiguration fehlt";
  if (value === "blocked") return "Blockiert";
  return "Fehlt";
}

function registryDecisionLabel(value: VoxyRenderAssetProviderRegistryDecision): string {
  if (value === "inventory_assets") return "Asset-Inventur schärfen";
  if (value === "prepare_assets") return "Pflichtassets vorbereiten";
  if (value === "configure_provider") return "Provider-Konfiguration vorbereiten";
  if (value === "create_adapter_contract") return "Adapter-Vertrag anlegen";
  if (value === "keep_as_script_only") return "Vorerst beim Script bleiben";
  return "Vorläufig blockiert";
}

function manifestAssetMap(): Map<string, ManifestAssetRecord> {
  const records = Array.isArray(voxyManifest.assets) ? voxyManifest.assets : [];
  return new Map(
    records
      .map((item) => [normalizeText((item as ManifestAssetRecord).id).toLowerCase(), item as ManifestAssetRecord] as const)
      .filter(([id]) => Boolean(id)),
  );
}

function hasRequiredCapability(
  preflightModel: VoxyRenderPreflightReadinessModel | null,
  capability: VoxyRenderAssetProviderRegistryCapability,
) {
  return (
    preflightModel?.requiredCapabilities.some((item) => item.id === capability) ?? false
  );
}

function buildAssetInventory(input: {
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
}) {
  const manifestAssets = manifestAssetMap();
  const crossLingual =
    input.scriptModel?.sourceLanguage !== input.scriptModel?.scriptLanguage ||
    input.scriptModel?.sourceLanguage !== input.scriptModel?.readingLanguage;
  const rtlRequired = Boolean(input.scriptModel?.rtlDisplayHint);
  const subtitleRequired =
    hasRequiredCapability(input.preflightModel, "subtitles") ||
    hasRequiredCapability(input.preflightModel, "rtl_subtitles");
  const lowerThirdRequired = hasRequiredCapability(input.preflightModel, "lower_thirds");
  const captionRequired = hasRequiredCapability(input.preflightModel, "caption_export") || crossLingual;
  const renderFlowVisible = Boolean(input.scriptModel || input.handoffModel || input.preflightModel);
  const hasManifestBackgroundNotes = Boolean(
    normalizeText(voxyManifest?.usage_notes?.background),
  );

  const voxyAvatarRecord = manifestAssets.get("confident");
  const miniAvatarRecord = manifestAssets.get("mini-avatar");
  const hasVoxyAvatar = Boolean(
    VOXY_ASSET_MAP.confident?.png &&
      VOXY_ASSET_MAP.miniAvatar?.png &&
      voxyAvatarRecord?.png &&
      miniAvatarRecord?.png,
  );
  const hasBrandLogo = Boolean(
    VOXY_OVERLAYS.voxyWordmark.path &&
      VOXY_OVERLAYS.edebatteGradient.path &&
      VOXY_OVERLAYS.vogPin.path,
  );

  const items: VoxyRenderAssetProviderRegistryAssetItem[] = [
    {
      id: "voxy_avatar",
      label: assetLabel("voxy_avatar"),
      status: hasVoxyAvatar ? "available" : "missing",
      statusLabel: assetStatusLabel(hasVoxyAvatar ? "available" : "missing"),
      source: hasVoxyAvatar ? "repo" : "unknown",
      sourceLabel: assetSourceLabel(hasVoxyAvatar ? "repo" : "unknown"),
      publicPath: hasVoxyAvatar ? VOXY_ASSET_MAP.confident.png : null,
      reviewerVisibleReason: hasVoxyAvatar
        ? "Im Repo liegen statische Voxy-Figuren und Mini-Avatar-Varianten vor. Das ist Asset-Wahrheit, aber noch keine render-sichere Medienpipeline."
        : "Es ist kein belastbarer Voxy-Avatar im sichtbaren Repo-/Manifest-Bestand belegbar.",
    },
    {
      id: "voice_profile",
      label: assetLabel("voice_profile"),
      status: renderFlowVisible ? "missing" : "requirement_only",
      statusLabel: assetStatusLabel(renderFlowVisible ? "missing" : "requirement_only"),
      source: renderFlowVisible ? "requirement" : "unknown",
      sourceLabel: assetSourceLabel(renderFlowVisible ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason:
        "Es gibt nur das `VoiceProvider`-Interface im Vertrag. Ein echtes Voice-Profil, eine Preset-Datei oder eine Provider-Konfiguration ist im Repo nicht belegt.",
    },
    {
      id: "brand_logo",
      label: assetLabel("brand_logo"),
      status: hasBrandLogo ? "available" : "missing",
      statusLabel: assetStatusLabel(hasBrandLogo ? "available" : "missing"),
      source: hasBrandLogo ? "repo" : "unknown",
      sourceLabel: assetSourceLabel(hasBrandLogo ? "repo" : "unknown"),
      publicPath: hasBrandLogo ? VOXY_OVERLAYS.voxyWordmark.path : null,
      reviewerVisibleReason: hasBrandLogo
        ? "Wordmark, Gradient und VOG-Pin liegen als statische Overlays im Repo. Ihre Nutzung bleibt trotzdem review-first und noch nicht render-konfiguriert."
        : "Kein belastbarer Brand-Lockup ist als Overlay-Asset sichtbar belegbar.",
    },
    {
      id: "background_template",
      label: assetLabel("background_template"),
      status: hasManifestBackgroundNotes ? "requirement_only" : "missing",
      statusLabel: assetStatusLabel(hasManifestBackgroundNotes ? "requirement_only" : "missing"),
      source: hasManifestBackgroundNotes ? "manifest" : "unknown",
      sourceLabel: assetSourceLabel(hasManifestBackgroundNotes ? "manifest" : "unknown"),
      publicPath: null,
      reviewerVisibleReason: hasManifestBackgroundNotes
        ? "Das Manifest beschreibt nur Platzierungs- und Hintergrundregeln. Ein echtes Background-Template oder Szenen-Asset ist nicht im Repo vorhanden."
        : "Für den Renderhintergrund ist weder Asset- noch Manifest-Wahrheit sichtbar.",
    },
    {
      id: "subtitle_template",
      label: assetLabel("subtitle_template"),
      status: subtitleRequired ? "missing" : "requirement_only",
      statusLabel: assetStatusLabel(subtitleRequired ? "missing" : "requirement_only"),
      source: subtitleRequired ? "requirement" : "unknown",
      sourceLabel: assetSourceLabel(subtitleRequired ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason: rtlRequired
        ? "RTL- oder Subtitle-Bedarf ist sichtbar, aber es gibt kein Untertitel-Template, keine Stildefinition und keine exportierbare Render-Konfiguration."
        : "Sobald Untertitel gebraucht werden, fehlt ein echtes Subtitle-Template im Repo.",
    },
    {
      id: "lower_third_template",
      label: assetLabel("lower_third_template"),
      status: lowerThirdRequired ? "missing" : "requirement_only",
      statusLabel: assetStatusLabel(lowerThirdRequired ? "missing" : "requirement_only"),
      source: lowerThirdRequired ? "requirement" : "unknown",
      sourceLabel: assetSourceLabel(lowerThirdRequired ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason:
        "Es gibt kein echtes Lower-Third-Template, keine Render-Komposition und keine Preset-Datei für kontextuelle Bauchbinden.",
    },
    {
      id: "source_caption_template",
      label: assetLabel("source_caption_template"),
      status: captionRequired ? "missing" : "requirement_only",
      statusLabel: assetStatusLabel(captionRequired ? "missing" : "requirement_only"),
      source: captionRequired ? "requirement" : "unknown",
      sourceLabel: assetSourceLabel(captionRequired ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason: crossLingual
        ? "Cross-linguale oder quellennahe Caption-Flächen bleiben notwendig, aber im Repo ist kein Source-Caption-Template vorhanden."
        : "Ein source-nahe Caption-Layout ist nicht als reales Asset oder Preset belegt.",
    },
    {
      id: "export_preset",
      label: assetLabel("export_preset"),
      status: renderFlowVisible ? "missing" : "requirement_only",
      statusLabel: assetStatusLabel(renderFlowVisible ? "missing" : "requirement_only"),
      source: renderFlowVisible ? "requirement" : "unknown",
      sourceLabel: assetSourceLabel(renderFlowVisible ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason:
        "Für Export, Seitenverhältnis, Caption-Ausgabe oder Review-Renders gibt es kein echtes Preset, keine JSON-Konfiguration und keine Medienpipeline im Repo.",
    },
  ];

  return items;
}

function buildProviderRegistry(input: {
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
}) {
  const crossLingual =
    input.scriptModel?.sourceLanguage !== input.scriptModel?.scriptLanguage ||
    input.scriptModel?.sourceLanguage !== input.scriptModel?.readingLanguage;
  const rtlRequired = Boolean(input.scriptModel?.rtlDisplayHint);
  const hasRenderContract = Boolean(input.handoffModel || input.preflightModel || input.scriptModel);
  const runtimeBlocked = input.handoffModel?.handoffStatus === "blocked_by_runtime_truth";

  function providerItem(
    id: VoxyRenderAssetProviderRegistryCapability,
    status: VoxyRenderAssetProviderRegistryProviderStatus,
    reviewerVisibleReason: string,
  ): VoxyRenderAssetProviderRegistryProviderItem {
    return {
      id,
      label: capabilityLabel(id),
      status,
      statusLabel: providerStatusLabel(status),
      providerName: null,
      executionAllowed: false,
      reviewerVisibleReason,
    };
  }

  return [
    providerItem(
      "avatar_video",
      runtimeBlocked ? "blocked" : hasRenderContract ? "adapter_needed" : "missing",
      runtimeBlocked
        ? "Es gibt keine belastbare Runtime-Wahrheit für einen Avatar-Renderpfad. Das `AvatarProvider`-Interface allein reicht nicht."
        : hasRenderContract
          ? "Ein `AvatarProvider`-Interface ist definiert, aber kein konkreter Adapter, kein Providername und keine Konfiguration sind im Code belegt."
          : "Ohne Renderkontext gibt es keine belegte Avatar-Provider-Wahrheit.",
    ),
    providerItem(
      "voiceover",
      runtimeBlocked ? "blocked" : hasRenderContract ? "adapter_needed" : "missing",
      runtimeBlocked
        ? "Die Runtime-Wahrheit für Voiceover fehlt vollständig. Ein `VoiceProvider`-Interface ist noch kein ausführbarer Provider."
        : hasRenderContract
          ? "Es gibt nur das `VoiceProvider`-Interface. Kein real konfigurierter Provider oder Voice-Adapter ist im Repo belegt."
          : "Es gibt keinen konkreten Voiceover-Provider im sichtbaren Code.",
    ),
    providerItem(
      "subtitles",
      hasRequiredCapability(input.preflightModel, "subtitles") ? "requirement_only" : "missing",
      hasRequiredCapability(input.preflightModel, "subtitles")
        ? "Untertitel werden als Capability gebraucht, aber es gibt keinen Subtitle-Adapter, keine Template-Konfiguration und keinen Exportpfad."
        : "Kein echter Subtitle-Pfad ist aktuell belegt.",
    ),
    providerItem(
      "multilingual_voice",
      crossLingual ? "requirement_only" : "missing",
      crossLingual
        ? "Mehrsprachige Voice ist als Bedarf sichtbar, aber es gibt keinen real konfigurierten Voice-Provider oder Sprachrouting-Pfad für Voxy-Rendering."
        : "Ohne mehrsprachigen Bedarf bleibt diese Capability unkonfiguriert.",
    ),
    providerItem(
      "rtl_subtitles",
      rtlRequired ? "requirement_only" : "missing",
      rtlRequired
        ? "RTL-Untertitel sind als Requirement sichtbar. Es gibt aber keine Render- oder Exportkonfiguration für RTL-Layouts."
        : "Kein eigener RTL-Subtitle-Pfad ist im Code belegt.",
    ),
    providerItem(
      "brand_overlay",
      VOXY_OVERLAYS.voxyWordmark.path ? "configuration_needed" : "missing",
      VOXY_OVERLAYS.voxyWordmark.path
        ? "Statische Overlay-Assets liegen im Repo, aber ihre Render-Bindung bleibt unkonfiguriert und reviewpflichtig."
        : "Es gibt keinen belegten Brand-Overlay-Pfad.",
    ),
    providerItem(
      "lower_thirds",
      hasRequiredCapability(input.preflightModel, "lower_thirds") ? "requirement_only" : "missing",
      hasRequiredCapability(input.preflightModel, "lower_thirds")
        ? "Lower Thirds werden als Capability gebraucht, aber weder Adapter noch Template noch Preset sind im Repo belegt."
        : "Kein Lower-Third-Pfad ist aktuell sichtbar.",
    ),
    providerItem(
      "background_scene",
      hasRequiredCapability(input.preflightModel, "background_scene") ? "requirement_only" : "missing",
      hasRequiredCapability(input.preflightModel, "background_scene")
        ? "Es gibt nur Szenen- und Hintergrundanforderungen aus dem Manifest, aber keine echte Scene- oder Background-Konfiguration."
        : "Keine belegte Hintergrundszene vorhanden.",
    ),
    providerItem(
      "logo_lockup",
      VOXY_OVERLAYS.voxyWordmark.path ? "configuration_needed" : "missing",
      VOXY_OVERLAYS.voxyWordmark.path
        ? "Wordmark und Pin sind da, aber kein renderbarer Lockup, keine Positionskonfiguration und kein Exportprofil sind belegt."
        : "Kein Logo-Lockup ist als Renderkonfiguration belegt.",
    ),
    providerItem(
      "caption_export",
      hasRequiredCapability(input.preflightModel, "caption_export") ? "requirement_only" : "missing",
      hasRequiredCapability(input.preflightModel, "caption_export")
        ? "Caption-Export wird als Bedarf sichtbar, aber es gibt kein reales Exportformat und keinen Caption-Adapter."
        : "Kein Caption-Exportpfad ist im Code belegt.",
    ),
    providerItem(
      "review_preview",
      hasRenderContract ? "requirement_only" : "missing",
      hasRenderContract
        ? "Review-Vorschauen existieren als UI-Readmodels in den Surfaces. Sie sind aber keine Render- oder Medienpreview mit ausführbarer Providertruth."
        : "Ohne Renderkontext gibt es auch keine Review-Vorschau-Wahrheit.",
    ),
    providerItem(
      "render_queue",
      runtimeBlocked ? "blocked" : hasRenderContract ? "adapter_needed" : "missing",
      runtimeBlocked
        ? "Die Queue bleibt ohne Runtime-Wahrheit blockiert. `render_queue` ist im Vertrag nur ein zukünftiger Adapterpunkt."
        : hasRenderContract
          ? "Ein `RenderProvider`-Interface und `render_queue` als Capability sind sichtbar, aber kein echter Queue-Adapter oder Provider ist konfiguriert."
          : "Kein echter Render-Queue-Pfad ist vorhanden.",
    ),
    providerItem(
      "usage_cost_estimate",
      hasRenderContract ? "requirement_only" : "missing",
      hasRenderContract
        ? "Generische Usage- und AI-Cost-Helfer existieren im Repo, aber keine render-spezifische Voxy-Kostenschätzung oder Credit-Buchung."
        : "Kein render-spezifischer Usage- oder Cost-Pfad ist belegt.",
    ),
  ];
}

function resolveRegistryStatus(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  assetInventory: VoxyRenderAssetProviderRegistryAssetItem[];
  providerRegistry: VoxyRenderAssetProviderRegistryProviderItem[];
}): VoxyRenderAssetProviderRegistryStatus {
  if (!input.handoffModel && !input.preflightModel) return "readmodel_only";
  if (!input.handoffModel) return "blocked_by_runtime_truth";

  const availableAssets = input.assetInventory.filter((item) => item.status === "available").length;
  const missingAssets = input.assetInventory.filter((item) => item.status === "missing").length;
  const providerBlocked = input.providerRegistry.some((item) => item.status === "blocked");
  const providerConfigurationNeeded = input.providerRegistry.some(
    (item) => item.status === "adapter_needed" || item.status === "configuration_needed",
  );
  const providerRequirementsOnly = input.providerRegistry.every(
    (item) => item.status === "requirement_only" || item.status === "missing",
  );

  if (input.handoffModel.handoffStatus === "blocked_by_runtime_truth") {
    return "blocked_by_runtime_truth";
  }
  if (availableAssets === 0) return "needs_asset_inventory";
  if (providerBlocked) return "blocked_by_missing_provider";
  if (providerRequirementsOnly) return "needs_provider_registry";
  if (providerConfigurationNeeded) return "needs_provider_configuration";
  if (missingAssets > 0 && availableAssets > 0) return "inventory_preview";
  if (missingAssets > 0) return "blocked_by_missing_assets";
  return "partially_configured";
}

function buildRegistryDecision(input: {
  registryStatus: VoxyRenderAssetProviderRegistryStatus;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  assetInventory: VoxyRenderAssetProviderRegistryAssetItem[];
  providerRegistry: VoxyRenderAssetProviderRegistryProviderItem[];
}) {
  const missingAssets = input.assetInventory.filter((item) => item.status === "missing");
  const adapterNeeded = input.providerRegistry.some((item) => item.status === "adapter_needed");
  const configurationNeeded = input.providerRegistry.some(
    (item) => item.status === "configuration_needed",
  );

  if (input.preflightModel?.preflightStatus === "keep_as_script_only") {
    return {
      id: "keep_as_script_only" as const,
      reason: "Quellen-, Factcheck- oder Risiko-Lage sprechen aktuell gegen einen Schritt Richtung Render-Setup.",
    };
  }
  if (input.registryStatus === "needs_asset_inventory") {
    return {
      id: "inventory_assets" as const,
      reason: "Zuerst muss eindeutig sichtbar werden, welche Asset-Dateien und Overlays real im Repo liegen.",
    };
  }
  if (missingAssets.length > 0) {
    return {
      id: "prepare_assets" as const,
      reason: "Pflichtassets wie Voice-Profil, Subtitle-Template, Source-Caption und Export-Preset fehlen noch als echte Repo- oder Konfigurationswahrheit.",
    };
  }
  if (adapterNeeded) {
    return {
      id: "create_adapter_contract" as const,
      reason: "Es gibt nur Provider-Interfaces. Der nächste ehrliche Schritt wäre ein expliziter Adapter-Vertrag statt einer Fake-Konfiguration.",
    };
  }
  if (configurationNeeded) {
    return {
      id: "configure_provider" as const,
      reason: "Vorhandene Overlay- oder Vertragsbausteine brauchen eine sichtbare, review-first Konfiguration, bevor mehr behauptet werden darf.",
    };
  }
  return {
    id: "blocked" as const,
    reason: "Die Registry bleibt readmodel-only und löst keine Runtime-Aktion aus.",
  };
}

function buildBlockers(input: {
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  assetInventory: VoxyRenderAssetProviderRegistryAssetItem[];
  providerRegistry: VoxyRenderAssetProviderRegistryProviderItem[];
}) {
  const blockers = [
    ...(input.preflightModel?.blockers ?? []),
    "Vorhandene Repo-Assets sind noch keine render-sichere Medienpipeline.",
    "Provider-Interfaces sind keine ausführbaren Provider.",
    "Es gibt keine echte Voxy-Render-Queue, keine Secret-Wahrheit und keine Provider-Ausführung.",
    "Es existiert keine render-spezifische Cost-, Credit- oder Usage-Buchung für Voxy.",
    ...input.assetInventory
      .filter((item) => item.status === "missing")
      .map((item) => `${item.label}: ${item.reviewerVisibleReason}`),
    ...input.providerRegistry
      .filter((item) => item.status !== "missing")
      .map((item) => `${item.label}: ${item.reviewerVisibleReason}`),
  ];

  return uniqueStrings(blockers);
}

function buildModelFromInput(input: BuildRegistryInput): VoxyRenderAssetProviderRegistryModel | null {
  const sourceLanguage =
    input.preflightModel?.sourceLanguage ??
    input.scriptModel?.sourceLanguage ??
    input.handoffModel?.sourceLanguage ??
    "de";
  const readingLanguage =
    input.preflightModel?.readingLanguage ??
    input.scriptModel?.readingLanguage ??
    input.handoffModel?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    input.preflightModel?.scriptLanguage ??
    input.scriptModel?.scriptLanguage ??
    input.handoffModel?.scriptLanguage ??
    readingLanguage;
  const renderLanguage = input.preflightModel?.renderLanguage ?? scriptLanguage;
  const subtitleLanguage = input.preflightModel?.subtitleLanguage ?? null;
  const rtlRequired = Boolean(input.preflightModel?.rtlPreflightHint || input.scriptModel?.rtlDisplayHint);

  const assetInventory = buildAssetInventory({
    scriptModel: input.scriptModel,
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
  });
  const providerRegistry = buildProviderRegistry({
    scriptModel: input.scriptModel,
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
  });
  const registryStatus = resolveRegistryStatus({
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
    assetInventory,
    providerRegistry,
  });
  const registryDecision = buildRegistryDecision({
    registryStatus,
    preflightModel: input.preflightModel,
    assetInventory,
    providerRegistry,
  });
  const blockers = buildBlockers({
    preflightModel: input.preflightModel,
    assetInventory,
    providerRegistry,
  });

  return {
    title: "Asset- & Provider-Registry",
    summary:
      "Diese Registry zeigt nur, welche Voxy-Assets, Overlays, Provider-Interfaces und Render-Anforderungen im Repo wirklich belegbar sind. Sie startet nichts und behauptet keine Medienruntime.",
    surface: input.surface,
    manifestPath: VOXY_MANIFEST_PATH,
    contributionRef: input.contributionRef ?? input.handoffModel?.contributionRef ?? null,
    dossierRef: input.dossierRef ?? input.handoffModel?.dossierRef ?? null,
    outputRef: input.outputRef ?? input.handoffModel?.outputRef ?? null,
    registryStatus,
    registryStatusLabel: registryStatusLabel(registryStatus),
    assetInventory,
    providerRegistry,
    languageRequirements: {
      sourceLanguage,
      readingLanguage,
      scriptLanguage,
      renderLanguage,
      subtitleLanguage,
      rtlRequired,
      translationIsEvidence: false,
      originalPreserved: true,
      label: [
        `Original: ${languageName(sourceLanguage)}`,
        `Lesefassung: ${languageName(readingLanguage)}`,
        `Script: ${languageName(scriptLanguage)}`,
        `Render: ${languageName(renderLanguage)}`,
        subtitleLanguage ? `Untertitel: ${languageName(subtitleLanguage)}` : "Untertitel: noch offen",
        rtlRequired ? "RTL-Prüfung erforderlich" : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    blockers,
    registryDecision: {
      id: registryDecision.id,
      label: registryDecisionLabel(registryDecision.id),
      reason: registryDecision.reason,
    },
    nextStep: input.nextStep,
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    publicSafeLabel: "Kein Rendering möglich",
    noRenderAction: true,
    noProviderExecution: true,
    noCostDebit: true,
    noPublishAction: true,
    noRuntimeClaim: true,
  };
}

export function buildVoxyRenderAssetProviderRegistryFromPreflight(params: {
  surface: RegistrySurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  contributionRef?: RegistryRef | null;
  dossierRef?: RegistryRef | null;
  outputRef?: RegistryRef | null;
  nextStep?: string;
  userVisibleReason?: string;
  reviewerVisibleReason?: string;
}) {
  return buildModelFromInput({
    surface: params.surface,
    scriptModel: params.scriptModel,
    handoffModel: params.handoffModel,
    preflightModel: params.preflightModel,
    contributionRef: params.contributionRef ?? null,
    dossierRef: params.dossierRef ?? null,
    outputRef: params.outputRef ?? null,
    nextStep: params.nextStep ?? "Registry-Wahrheit prüfen",
    userVisibleReason:
      params.userVisibleReason ??
      "Hier wird nur sichtbar, welche Assets und Providerbausteine real vorhanden oder noch offen sind. Es wird kein Video erzeugt.",
    reviewerVisibleReason:
      params.reviewerVisibleReason ??
      "Die Registry bleibt readmodel-only. Repo-Assets und Verträge werden gezeigt, aber keine Runtime oder Providerausführung behauptet.",
  });
}

export function buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);
  const handoffModel = buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const preflightModel = buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model);

  return buildVoxyRenderAssetProviderRegistryFromPreflight({
    surface: "create",
    scriptModel,
    handoffModel,
    preflightModel,
    contributionRef: handoffModel?.contributionRef ?? scriptModel?.contributionRef ?? null,
    dossierRef: handoffModel?.dossierRef ?? null,
    outputRef: handoffModel?.outputRef ?? scriptModel?.outputRef ?? null,
    nextStep: "Asset- und Providertruth im Preview prüfen",
    userVisibleReason:
      "In /create bleibt diese Registry eine reine Vorprüfung. Sie zeigt nur, was im Repo oder in Verträgen sichtbar ist.",
    reviewerVisibleReason:
      "Create zeigt keine Medienruntime, sondern nur Asset- und Providertruth aus bestehenden V3-Readmodels.",
  });
}

export function buildVoxyRenderAssetProviderRegistryFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: RegistryRef | null;
    outputRef?: RegistryRef | null;
    nextStep?: string;
  },
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Registry prüfen",
  });
  const handoffModel = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Registry prüfen",
  });
  const preflightModel = buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Registry prüfen",
  });

  return buildVoxyRenderAssetProviderRegistryFromPreflight({
    surface: "account",
    scriptModel,
    handoffModel,
    preflightModel,
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Registry prüfen",
    userVisibleReason:
      "Im Account wird nur transparent, welche Asset- und Providerbausteine für einen späteren Renderpfad fehlen oder nur als Anforderung existieren.",
    reviewerVisibleReason:
      "Lokale und resume-fähige Arbeitsstände behalten die Registry strikt als readmodel-only Inventur.",
  });
}

export function buildVoxyRenderAssetProviderRegistryFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: RegistryRef | null;
    dossierRef?: RegistryRef | null;
    outputRef?: RegistryRef | null;
  },
) {
  const surface: Extract<RegistrySurface, "admin" | "workspace"> =
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

  return buildVoxyRenderAssetProviderRegistryFromPreflight({
    surface,
    scriptModel,
    handoffModel,
    preflightModel,
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep:
      options?.audience === "admin"
        ? "Registry-Lücken für Assets und Adapter prüfen"
        : "Registry-Wahrheit im Studio prüfen",
    userVisibleReason:
      "Diese Registry zeigt nur belastbare Asset- und Vertragswahrheit. Weder Provider noch Rendering noch Publish werden ausgelöst.",
    reviewerVisibleReason:
      "Admin- und Studio-Kontexte sehen nur Repo-, Manifest- und Vertragsinventur statt ausführbarer Medienruntime.",
  });
}
