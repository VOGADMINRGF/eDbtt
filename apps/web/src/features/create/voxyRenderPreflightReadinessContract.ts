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
  VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  VOXY_ASSET_MAP,
  VOXY_OVERLAYS,
} from "@/features/voxy/voxyAssets";

export const VOXY_RENDER_PREFLIGHT_READINESS_STATUSES = [
  "readmodel_only",
  "preflight_preview",
  "needs_review",
  "needs_provider_configuration",
  "needs_asset_configuration",
  "needs_cost_configuration",
  "needs_credit_policy",
  "needs_usage_limit_check",
  "blocked_by_missing_script",
  "blocked_by_missing_review",
  "blocked_by_missing_provider",
  "blocked_by_missing_assets",
  "blocked_by_unknown_cost",
  "blocked_by_language_review",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderPreflightReadinessStatus =
  (typeof VOXY_RENDER_PREFLIGHT_READINESS_STATUSES)[number];

export const VOXY_RENDER_PREFLIGHT_PROVIDER_SELECTION_STATUSES = [
  "none_configured",
  "requirement_only",
  "candidate_needed",
  "adapter_needed",
  "configuration_needed",
  "blocked",
] as const;

export type VoxyRenderPreflightProviderSelectionStatus =
  (typeof VOXY_RENDER_PREFLIGHT_PROVIDER_SELECTION_STATUSES)[number];

export const VOXY_RENDER_PREFLIGHT_REQUIRED_CAPABILITIES = [
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

export type VoxyRenderPreflightRequiredCapability =
  (typeof VOXY_RENDER_PREFLIGHT_REQUIRED_CAPABILITIES)[number];

export const VOXY_RENDER_PREFLIGHT_ASSET_STATUSES = [
  "unknown",
  "requirements_only",
  "needs_inventory",
  "missing_required_assets",
  "partially_available",
  "blocked",
] as const;

export type VoxyRenderPreflightAssetStatus =
  (typeof VOXY_RENDER_PREFLIGHT_ASSET_STATUSES)[number];

export const VOXY_RENDER_PREFLIGHT_REQUIRED_ASSETS = [
  "voxy_avatar",
  "voice_profile",
  "brand_logo",
  "background_template",
  "subtitle_template",
  "lower_third_template",
  "source_caption_template",
  "export_preset",
] as const;

export type VoxyRenderPreflightRequiredAsset =
  (typeof VOXY_RENDER_PREFLIGHT_REQUIRED_ASSETS)[number];

export const VOXY_RENDER_PREFLIGHT_COST_STATUSES = [
  "unknown",
  "estimate_needed",
  "credit_policy_needed",
  "limit_check_needed",
  "blocked_by_missing_runtime",
  "blocked_by_missing_account_context",
] as const;

export type VoxyRenderPreflightCostStatus =
  (typeof VOXY_RENDER_PREFLIGHT_COST_STATUSES)[number];

export const VOXY_RENDER_PREFLIGHT_REVIEW_KEYS = [
  "scriptReview",
  "sourceReview",
  "factcheckReview",
  "languageReview",
  "brandReview",
  "assetReview",
  "providerReview",
  "costReview",
  "publishingReview",
] as const;

export type VoxyRenderPreflightReviewKey =
  (typeof VOXY_RENDER_PREFLIGHT_REVIEW_KEYS)[number];

export const VOXY_RENDER_PREFLIGHT_REVIEW_STATUSES = [
  "ready",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderPreflightReviewStatus =
  (typeof VOXY_RENDER_PREFLIGHT_REVIEW_STATUSES)[number];

export const VOXY_RENDER_PREFLIGHT_NEXT_DECISIONS = [
  "review_script",
  "review_sources",
  "review_factcheck",
  "review_language",
  "prepare_assets",
  "select_provider",
  "configure_provider",
  "estimate_cost",
  "check_credits",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreflightNextDecision =
  (typeof VOXY_RENDER_PREFLIGHT_NEXT_DECISIONS)[number];

type PreflightSurface = "create" | "account" | "admin" | "workspace";

type PreflightRef = {
  id: string;
  title: string;
  href?: string | null;
};

type PreflightTag<T extends string> = {
  id: T;
  label: string;
  reason: string;
};

export type VoxyRenderPreflightRequiredAssetItem = {
  id: VoxyRenderPreflightRequiredAsset;
  label: string;
  status: "available" | "missing" | "requirements_only";
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyRenderPreflightReviewItem = {
  id: VoxyRenderPreflightReviewKey;
  label: string;
  status: VoxyRenderPreflightReviewStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyRenderPreflightReadinessModel = {
  title: string;
  summary: string;
  surface: PreflightSurface;
  handoffRef: PreflightRef | null;
  scriptRef: PreflightRef | null;
  contributionRef: PreflightRef | null;
  dossierRef: PreflightRef | null;
  participationRef: PreflightRef | null;
  outputRef: PreflightRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlPreflightHint: string | null;
  languageLabel: string;
  preflightStatus: VoxyRenderPreflightReadinessStatus;
  preflightStatusLabel: string;
  providerSelectionStatus: VoxyRenderPreflightProviderSelectionStatus;
  providerSelectionStatusLabel: string;
  requiredCapabilities: PreflightTag<VoxyRenderPreflightRequiredCapability>[];
  providerExecutionAllowed: false;
  assetStatus: VoxyRenderPreflightAssetStatus;
  assetStatusLabel: string;
  requiredAssets: VoxyRenderPreflightRequiredAssetItem[];
  assetExecutionAllowed: false;
  costStatus: VoxyRenderPreflightCostStatus;
  costStatusLabel: string;
  costDebitAllowed: false;
  usageBookingAllowed: false;
  pricingClaimAllowed: false;
  reviewReadiness: VoxyRenderPreflightReviewItem[];
  blockers: string[];
  nextPreflightDecision: {
    id: VoxyRenderPreflightNextDecision;
    label: string;
    reason: string;
  };
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  noRenderAction: true;
  noProviderExecution: true;
  noCostDebit: true;
  noPublishAction: true;
  noSocialPostAction: true;
  noRuntimeClaim: true;
};

type BuildModelInput = {
  surface: PreflightSurface;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  contributionRef?: PreflightRef | null;
  dossierRef?: PreflightRef | null;
  participationRef?: PreflightRef | null;
  outputRef?: PreflightRef | null;
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

function preflightStatusLabel(value: VoxyRenderPreflightReadinessStatus): string {
  if (value === "preflight_preview") return "Preflight-Vorschau";
  if (value === "needs_review") return "Review nötig";
  if (value === "needs_provider_configuration") return "Provider-Konfiguration nötig";
  if (value === "needs_asset_configuration") return "Asset-Konfiguration nötig";
  if (value === "needs_cost_configuration") return "Kostenprüfung vorbereiten";
  if (value === "needs_credit_policy") return "Credit-Policy klären";
  if (value === "needs_usage_limit_check") return "Usage-Limits prüfen";
  if (value === "blocked_by_missing_script") return "Ohne Script blockiert";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_missing_provider") return "Provider fehlt";
  if (value === "blocked_by_missing_assets") return "Assets fehlen";
  if (value === "blocked_by_unknown_cost") return "Kostenlage unbekannt";
  if (value === "blocked_by_language_review") return "Sprachreview fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  if (value === "keep_as_script_only") return "Vorerst nur Script";
  return "Nur Readmodel";
}

function providerSelectionStatusLabel(value: VoxyRenderPreflightProviderSelectionStatus): string {
  if (value === "none_configured") return "Nichts konfiguriert";
  if (value === "requirement_only") return "Nur Anforderungen sichtbar";
  if (value === "candidate_needed") return "Provider-Kandidat fehlt";
  if (value === "adapter_needed") return "Adapter fehlt";
  if (value === "configuration_needed") return "Konfiguration fehlt";
  return "Blockiert";
}

function capabilityLabel(value: VoxyRenderPreflightRequiredCapability): string {
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
  if (value === "render_queue") return "Spätere Render-Queue";
  return "Usage-/Kostenschätzung";
}

function assetStatusLabel(value: VoxyRenderPreflightAssetStatus): string {
  if (value === "requirements_only") return "Nur Anforderungen sichtbar";
  if (value === "needs_inventory") return "Inventur fehlt";
  if (value === "missing_required_assets") return "Pflichtassets fehlen";
  if (value === "partially_available") return "Teilweise vorhanden";
  if (value === "blocked") return "Blockiert";
  return "Unklar";
}

function assetLabel(value: VoxyRenderPreflightRequiredAsset): string {
  if (value === "voxy_avatar") return "Voxy-Avatar";
  if (value === "voice_profile") return "Voice-Profil";
  if (value === "brand_logo") return "Brand-Logo";
  if (value === "background_template") return "Background-Template";
  if (value === "subtitle_template") return "Subtitle-Template";
  if (value === "lower_third_template") return "Lower-Third-Template";
  if (value === "source_caption_template") return "Source-Caption-Template";
  return "Export-Preset";
}

function assetAvailabilityLabel(value: VoxyRenderPreflightRequiredAssetItem["status"]): string {
  if (value === "available") return "Vorhanden";
  if (value === "requirements_only") return "Nur Anforderung";
  return "Fehlt";
}

function costStatusLabel(value: VoxyRenderPreflightCostStatus): string {
  if (value === "estimate_needed") return "Kostenschätzung nötig";
  if (value === "credit_policy_needed") return "Credit-Policy fehlt";
  if (value === "limit_check_needed") return "Usage-Limit-Check fehlt";
  if (value === "blocked_by_missing_runtime") return "Ohne Runtime blockiert";
  if (value === "blocked_by_missing_account_context") return "Ohne Account-Kontext blockiert";
  return "Unklar";
}

function reviewLabel(value: VoxyRenderPreflightReviewKey): string {
  if (value === "scriptReview") return "Script-Review";
  if (value === "sourceReview") return "Quellenreview";
  if (value === "factcheckReview") return "Factcheck-Review";
  if (value === "languageReview") return "Sprachreview";
  if (value === "brandReview") return "Brand-Review";
  if (value === "assetReview") return "Asset-Review";
  if (value === "providerReview") return "Provider-Review";
  if (value === "costReview") return "Kosten-/Credit-Review";
  return "Publishing-Review";
}

function reviewStatusLabel(value: VoxyRenderPreflightReviewStatus): string {
  if (value === "ready") return "Bereit";
  if (value === "blocked") return "Blockiert";
  return "Review nötig";
}

function nextDecisionLabel(value: VoxyRenderPreflightNextDecision): string {
  if (value === "review_script") return "Script prüfen";
  if (value === "review_sources") return "Quellen prüfen";
  if (value === "review_factcheck") return "Factcheck prüfen";
  if (value === "review_language") return "Sprache und Untertitel prüfen";
  if (value === "prepare_assets") return "Assets vorbereiten";
  if (value === "select_provider") return "Providerbedarf klären";
  if (value === "configure_provider") return "Provider-Konfiguration vorbereiten";
  if (value === "estimate_cost") return "Kostenlage vorbereiten";
  if (value === "check_credits") return "Credits und Limits prüfen";
  if (value === "keep_as_script_only") return "Vorerst beim Script bleiben";
  return "Vorläufig blockiert";
}

function buildCapability(
  id: VoxyRenderPreflightRequiredCapability,
  reason: string,
): PreflightTag<VoxyRenderPreflightRequiredCapability> {
  return {
    id,
    label: capabilityLabel(id),
    reason,
  };
}

function buildReviewItem(
  id: VoxyRenderPreflightReviewKey,
  status: VoxyRenderPreflightReviewStatus,
  reason: string,
): VoxyRenderPreflightReviewItem {
  return {
    id,
    label: reviewLabel(id),
    status,
    statusLabel: reviewStatusLabel(status),
    reason,
    reviewRequired: true,
  };
}

function buildAssetInventory(scriptModel: VoxyBriefingScriptCandidateModel | null) {
  const voxyAvatarAvailable = Boolean(VOXY_ASSET_MAP.confident?.png && VOXY_ASSET_MAP.miniAvatar?.png);
  const brandLogoAvailable = Boolean(VOXY_OVERLAYS.voxyWordmark.path && VOXY_OVERLAYS.edebatteGradient.path);
  const needsRtlSubtitle = Boolean(scriptModel?.rtlDisplayHint);
  const hasCrossLingual =
    scriptModel?.sourceLanguage !== scriptModel?.scriptLanguage ||
    scriptModel?.sourceLanguage !== scriptModel?.readingLanguage;

  const items: VoxyRenderPreflightRequiredAssetItem[] = [
    {
      id: "voxy_avatar",
      label: assetLabel("voxy_avatar"),
      status: voxyAvatarAvailable ? "available" : "missing",
      statusLabel: assetAvailabilityLabel(voxyAvatarAvailable ? "available" : "missing"),
      reason: voxyAvatarAvailable
        ? "Statische Voxy-Varianten liegen als Branding-Assets vor."
        : "Es ist kein belastbares Voxy-Avatar-Asset inventarisiert.",
      reviewRequired: true,
    },
    {
      id: "voice_profile",
      label: assetLabel("voice_profile"),
      status: "missing",
      statusLabel: assetAvailabilityLabel("missing"),
      reason: "Es gibt keine inventarisierte Voice-Profil-Wahrheit für spätere Renderpfade.",
      reviewRequired: true,
    },
    {
      id: "brand_logo",
      label: assetLabel("brand_logo"),
      status: brandLogoAvailable ? "available" : "missing",
      statusLabel: assetAvailabilityLabel(brandLogoAvailable ? "available" : "missing"),
      reason: brandLogoAvailable
        ? "Logo- und Wordmark-Overlays sind als Brand-Assets vorhanden."
        : "Ein sauberes Brand-Logo ist für den Renderpfad nicht sichtbar inventarisiert.",
      reviewRequired: true,
    },
    {
      id: "background_template",
      label: assetLabel("background_template"),
      status: "requirements_only",
      statusLabel: assetAvailabilityLabel("requirements_only"),
      reason: "Im Manifest gibt es nur Platzierungsregeln, aber kein belastbares Render-Background-Template.",
      reviewRequired: true,
    },
    {
      id: "subtitle_template",
      label: assetLabel("subtitle_template"),
      status: "missing",
      statusLabel: assetAvailabilityLabel("missing"),
      reason: needsRtlSubtitle
        ? "RTL-Untertitel brauchen ein eigenes Template, das aktuell nicht inventarisiert ist."
        : "Es gibt kein sichtbares Untertitel-Template für einen späteren Renderpfad.",
      reviewRequired: true,
    },
    {
      id: "lower_third_template",
      label: assetLabel("lower_third_template"),
      status: "missing",
      statusLabel: assetAvailabilityLabel("missing"),
      reason: "Ein Lower-Third-Template ist im aktuellen Voxy-Pfad nicht als Asset sichtbar.",
      reviewRequired: true,
    },
    {
      id: "source_caption_template",
      label: assetLabel("source_caption_template"),
      status: "missing",
      statusLabel: assetAvailabilityLabel("missing"),
      reason: hasCrossLingual
        ? "Quellen- oder Übersetzungs-Captions bleiben mehrsprachig reviewpflichtig und sind noch nicht template-fähig."
        : "Es gibt kein sichtbares Source-Caption-Template für diesen Renderpfad.",
      reviewRequired: true,
    },
    {
      id: "export_preset",
      label: assetLabel("export_preset"),
      status: "missing",
      statusLabel: assetAvailabilityLabel("missing"),
      reason: "Ein video-spezifisches Export-Preset ist im bestehenden Readmodel nicht vorhanden.",
      reviewRequired: true,
    },
  ];

  const availableCount = items.filter((item) => item.status === "available").length;
  const missingCount = items.filter((item) => item.status === "missing").length;
  let status: VoxyRenderPreflightAssetStatus = "unknown";
  if (!scriptModel) {
    status = "requirements_only";
  } else if (availableCount === 0 && missingCount > 0) {
    status = "needs_inventory";
  } else if (availableCount > 0 && missingCount > 0) {
    status = "partially_available";
  } else if (missingCount > 0) {
    status = "missing_required_assets";
  } else {
    status = "partially_available";
  }

  return { status, items };
}

function buildRequiredCapabilities(input: {
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
}): PreflightTag<VoxyRenderPreflightRequiredCapability>[] {
  if (!input.scriptModel) return [];
  const items: PreflightTag<VoxyRenderPreflightRequiredCapability>[] = [
    buildCapability("avatar_video", "Eine spätere Avatar-Komposition bleibt Grundvoraussetzung für den Voxy-Renderpfad."),
    buildCapability("voiceover", "Das Script braucht später eine getrennt reviewte Voiceover-Fähigkeit."),
    buildCapability("review_preview", "Vor jedem echten Renderpfad muss eine sichtbare Review-Vorschau möglich bleiben."),
    buildCapability("brand_overlay", "Voxy- und eDebatte-Branding dürfen nur als überprüfbare Overlays eingebunden werden."),
    buildCapability("logo_lockup", "Logo und Brand-Lockup müssen als eigenständige Ebene geprüft werden."),
    buildCapability("render_queue", "Ein späterer Renderpfad braucht eine getrennte Queue-Wahrheit, die hier noch nicht existiert."),
    buildCapability("usage_cost_estimate", "Preflight darf höchstens Anforderungen an eine spätere Kosten- oder Usage-Schätzung zeigen."),
  ];

  if (input.scriptModel.scriptSegments.length > 0) {
    items.push(
      buildCapability("subtitles", "Script und Segmentstruktur legen einen späteren Untertitelpfad nahe."),
      buildCapability("caption_export", "Für Social- und Review-Folgeschritte bleibt ein Caption-Export erforderlich."),
    );
  }
  if (
    input.scriptModel.sourceLanguage !== input.scriptModel.scriptLanguage ||
    input.scriptModel.sourceLanguage !== input.scriptModel.readingLanguage
  ) {
    items.push(
      buildCapability("multilingual_voice", "Cross-linguale Fälle brauchen eine getrennt reviewte mehrsprachige Voice-Logik."),
    );
  }
  if (input.scriptModel.rtlDisplayHint) {
    items.push(
      buildCapability("rtl_subtitles", "RTL-Kontexte brauchen ein eigenes Subtitle-Handling."),
    );
  }
  if (
    input.handoffModel?.handoffPacket.targetHints.length ||
    input.scriptModel.scriptFormat === "participation_invitation" ||
    input.scriptModel.scriptFormat === "poll_explainer"
  ) {
    items.push(
      buildCapability("lower_thirds", "Kontext- und Beteiligungshinweise brauchen später getrennte Lower-Third-Flächen."),
      buildCapability("background_scene", "Für eine spätere Szene fehlt bisher nur eine Anforderung, keine fertige Render-Bühne."),
    );
  }

  return uniqueStrings(items.map((item) => item.id)).map((id) => items.find((item) => item.id === id)!);
}

function buildProviderSelectionStatus(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  surface: PreflightSurface;
}) {
  let status: VoxyRenderPreflightProviderSelectionStatus = "none_configured";
  let reason = "Es liegt noch keine belastbare Provider- oder Adapter-Wahrheit vor.";
  if (input.scriptModel && !input.handoffModel) {
    status = "candidate_needed";
    reason = "Ein Script ist sichtbar, aber der spätere Render-Handoff ist noch nicht einmal als Readmodel aufgebaut.";
  } else if (input.handoffModel?.handoffStatus === "blocked_by_provider") {
    status = "configuration_needed";
    reason = "Der Handoff zeigt klar, dass ein Provider-Adapter oder seine Konfiguration fehlt.";
  } else if (input.handoffModel?.handoffStatus === "blocked_by_runtime_truth") {
    status = "blocked";
    reason = "Ohne Runtime-Wahrheit bleibt jede Provider-Auswahl blockiert.";
  } else if (input.handoffModel?.handoffStatus === "blocked_by_secret") {
    status = "blocked";
    reason = "Secret- und Zugangswahrheit fehlen; ein Provider darf daraus nicht abgeleitet werden.";
  } else if (input.handoffModel) {
    status = input.surface === "admin" || input.surface === "workspace" ? "adapter_needed" : "requirement_only";
    reason =
      input.surface === "admin" || input.surface === "workspace"
        ? "Der Handoff ist sichtbar, aber es gibt noch keine echte Adapter-Implementierung oder Freigabe."
        : "Beitragende sehen nur Anforderungen, keine echte Provider-Auswahl.";
  }
  return { status, reason };
}

function buildCostStatus(input: {
  surface: PreflightSurface;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
}) {
  let status: VoxyRenderPreflightCostStatus = "unknown";
  let reason = "Es liegt keine belastbare Kosten- oder Credit-Wahrheit für Video-Rendering vor.";
  if (!input.scriptModel) {
    status = "unknown";
    reason = "Ohne Script bleibt auch jede Kostenfrage nur hypothetisch.";
  } else if (input.surface === "create") {
    status = "blocked_by_missing_account_context";
    reason = "Im Create-Preview ist kein render-spezifischer Account- oder Billing-Kontext sichtbar.";
  } else if (input.surface === "account") {
    status = "credit_policy_needed";
    reason = "Es gibt generelle Credits im Produkt, aber keine render-spezifische Credit-Policy für diesen Pfad.";
  } else if (input.handoffModel?.handoffStatus === "blocked_by_runtime_truth") {
    status = "blocked_by_missing_runtime";
    reason = "Ohne Runtime-Wahrheit bleibt jede Kostenschätzung unehrlich.";
  } else {
    status = "estimate_needed";
    reason = "Es gibt keine video-spezifische Kosten- oder Usage-Schätzung, nur den Bedarf an einem späteren Cost Gate.";
  }
  return { status, reason };
}

function buildReviewReadiness(input: {
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  providerStatus: VoxyRenderPreflightProviderSelectionStatus;
  assetStatus: VoxyRenderPreflightAssetStatus;
  costStatus: VoxyRenderPreflightCostStatus;
}): VoxyRenderPreflightReviewItem[] {
  const scriptBlocked = !input.scriptModel;
  const sourceNeeded = input.scriptModel?.readinessSignals.some((item) => item.id === "source_review_needed") ?? false;
  const factcheckNeeded = input.scriptModel?.readinessSignals.some((item) => item.id === "factcheck_needed") ?? false;
  const languageNeeded =
    Boolean(input.scriptModel?.rtlDisplayHint) ||
    input.scriptModel?.sourceLanguage !== input.scriptModel?.scriptLanguage ||
    input.scriptModel?.sourceLanguage !== input.scriptModel?.readingLanguage;
  const providerBlocked =
    input.providerStatus === "blocked" ||
    input.providerStatus === "candidate_needed" ||
    input.providerStatus === "configuration_needed" ||
    input.providerStatus === "adapter_needed";
  const assetBlocked =
    input.assetStatus === "missing_required_assets" ||
    input.assetStatus === "needs_inventory" ||
    input.assetStatus === "blocked";
  const costBlocked =
    input.costStatus === "blocked_by_missing_account_context" ||
    input.costStatus === "blocked_by_missing_runtime";

  return [
    buildReviewItem(
      "scriptReview",
      scriptBlocked
        ? "blocked"
        : input.scriptModel?.scriptStatus === "script_preview"
          ? "ready"
          : "needs_review",
      scriptBlocked
        ? "Ohne Script-Kandidat bleibt jeder Preflight blockiert."
        : `Aktueller Script-Stand: ${input.scriptModel?.scriptStatusLabel}.`,
    ),
    buildReviewItem(
      "sourceReview",
      sourceNeeded ? "needs_review" : "ready",
      sourceNeeded
        ? "Quellenkontext und Source-Pack müssen vor jedem echten Renderpfad belastbar bleiben."
        : "Kein zusätzlicher Quellenblocker aus dem Script-Kandidaten sichtbar.",
    ),
    buildReviewItem(
      "factcheckReview",
      factcheckNeeded ? "needs_review" : "ready",
      factcheckNeeded
        ? "Offene Factcheck-Fragen sprechen gegen jeden voreiligen Renderpfad."
        : "Kein zusätzlicher Factcheck-Blocker sichtbar.",
    ),
    buildReviewItem(
      "languageReview",
      languageNeeded ? "needs_review" : "ready",
      languageNeeded
        ? "Render-Sprache, Untertitel und Übersetzungsgrenzen müssen sichtbar getrennt geprüft werden."
        : "Keine zusätzliche Sprach- oder Untertitelprüfung sichtbar.",
    ),
    buildReviewItem(
      "brandReview",
      "needs_review",
      "Branding bleibt auch mit vorhandenen Overlays ein eigener Review-Schritt und keine automatische Asset-Freigabe.",
    ),
    buildReviewItem(
      "assetReview",
      assetBlocked ? "blocked" : input.assetStatus === "partially_available" ? "needs_review" : "ready",
      assetBlocked
        ? "Ohne belastbare Templates und Export-Presets bleibt der Renderpfad asset-seitig blockiert."
        : input.assetStatus === "partially_available"
          ? "Statische Avatar- und Brand-Assets reichen noch nicht für Render-Sicherheit."
          : "Keine zusätzliche Asset-Blockade sichtbar.",
    ),
    buildReviewItem(
      "providerReview",
      providerBlocked ? "blocked" : "needs_review",
      providerBlocked
        ? "Adapter, Providerkonfiguration oder Runtime-Wahrheit fehlen sichtbar."
        : "Provider dürfen später nur nach separater Review-Freigabe ausgewählt werden.",
    ),
    buildReviewItem(
      "costReview",
      costBlocked ? "blocked" : "needs_review",
      costBlocked
        ? "Ohne render-spezifische Runtime- oder Account-Wahrheit bleibt das Cost Gate blockiert."
        : "Kosten- und Credit-Fragen bleiben vor jedem echten Renderlauf separat reviewpflichtig.",
    ),
    buildReviewItem(
      "publishingReview",
      input.handoffModel?.reviewGates.find((item) => item.id === "publish_review")?.status === "approved"
        ? "ready"
        : "needs_review",
      "Publish bleibt auch im Preflight ein getrennter, nicht automatisch aktivierter Pfad.",
    ),
  ];
}

function resolvePreflightStatus(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  providerStatus: VoxyRenderPreflightProviderSelectionStatus;
  assetStatus: VoxyRenderPreflightAssetStatus;
  costStatus: VoxyRenderPreflightCostStatus;
  reviewReadiness: VoxyRenderPreflightReviewItem[];
}) {
  if (!input.scriptModel) return "blocked_by_missing_script" as const;
  if (!input.handoffModel) return "blocked_by_runtime_truth" as const;

  const sourceNeeded = input.reviewReadiness.some((item) => item.id === "sourceReview" && item.status === "needs_review");
  const factcheckNeeded = input.reviewReadiness.some((item) => item.id === "factcheckReview" && item.status === "needs_review");
  const languageBlocked = input.reviewReadiness.some((item) => item.id === "languageReview" && item.status === "needs_review");
  const highRisk =
    input.scriptModel.scriptRisks.length >= 3 ||
    input.scriptModel.scriptStatus === "needs_compliance_review" ||
    input.scriptModel.scriptStatus === "needs_human_input";
  const blockedReview = input.reviewReadiness.some((item) => item.id === "scriptReview" && item.status === "blocked");

  if (highRisk || sourceNeeded || factcheckNeeded) {
    return "keep_as_script_only" as const;
  }
  if (languageBlocked) {
    return "blocked_by_language_review" as const;
  }
  if (blockedReview || input.handoffModel.handoffStatus === "needs_script_review") {
    return "blocked_by_missing_review" as const;
  }
  if (input.providerStatus === "blocked") {
    return "blocked_by_missing_provider" as const;
  }
  if (input.providerStatus === "configuration_needed" || input.providerStatus === "adapter_needed") {
    return "needs_provider_configuration" as const;
  }
  if (input.assetStatus === "missing_required_assets" || input.assetStatus === "blocked") {
    return "blocked_by_missing_assets" as const;
  }
  if (input.assetStatus === "needs_inventory" || input.assetStatus === "partially_available") {
    return "needs_asset_configuration" as const;
  }
  if (input.costStatus === "blocked_by_missing_runtime" || input.costStatus === "blocked_by_missing_account_context") {
    return "blocked_by_unknown_cost" as const;
  }
  if (input.costStatus === "credit_policy_needed") return "needs_credit_policy" as const;
  if (input.costStatus === "limit_check_needed") return "needs_usage_limit_check" as const;
  if (input.costStatus === "estimate_needed") return "needs_cost_configuration" as const;
  if (
    input.handoffModel.handoffStatus === "needs_editorial_review" ||
    input.handoffModel.handoffStatus === "needs_compliance_review" ||
    input.handoffModel.handoffStatus === "needs_render_review" ||
    input.handoffModel.handoffStatus === "needs_publish_review"
  ) {
    return "needs_review" as const;
  }
  return "preflight_preview" as const;
}

function buildBlockers(input: {
  status: VoxyRenderPreflightReadinessStatus;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  reviewReadiness: VoxyRenderPreflightReviewItem[];
  assetItems: VoxyRenderPreflightRequiredAssetItem[];
  costReason: string;
  providerReason: string;
}) {
  const blockers = [
    ...(input.handoffModel?.blockers ?? []),
    ...(input.scriptModel?.scriptRisks.map((item) => item.label) ?? []),
    ...input.reviewReadiness
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
  ];
  if (input.assetItems.some((item) => item.status === "missing")) {
    blockers.push(
      "Asset-Inventur bleibt unvollständig: " +
        input.assetItems
          .filter((item) => item.status === "missing")
          .map((item) => item.label)
          .join(" · "),
    );
  }
  if (
    input.status === "blocked_by_missing_provider" ||
    input.status === "needs_provider_configuration"
  ) {
    blockers.push(input.providerReason);
  }
  if (
    input.status === "blocked_by_unknown_cost" ||
    input.status === "needs_cost_configuration" ||
    input.status === "needs_credit_policy"
  ) {
    blockers.push(input.costReason);
  }
  if (input.status === "blocked_by_missing_script") {
    blockers.push("Ohne Script-Kandidat kann nicht einmal ehrlich geprüft werden, ob ein Renderpfad später tragfähig wäre.");
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.push("Es gibt noch keinen belastbaren Render-Handoff oder keine Runtime-Wahrheit für den nächsten Schritt.");
  }
  return uniqueStrings(blockers);
}

function buildNextDecision(status: VoxyRenderPreflightReadinessStatus) {
  if (status === "blocked_by_missing_script" || status === "blocked_by_missing_review") {
    return {
      id: "review_script" as const,
      reason: "Vor jedem weiteren Preflight-Schritt muss das Script selbst belastbar und reviewt sein.",
    };
  }
  if (status === "keep_as_script_only") {
    return {
      id: "keep_as_script_only" as const,
      reason: "Quellen-, Factcheck- oder Risiko-Lage sprechen aktuell gegen einen Schritt Richtung Render.",
    };
  }
  if (status === "blocked_by_language_review") {
    return {
      id: "review_language" as const,
      reason: "Render-Sprache, Untertitel und Übersetzungsgrenzen bleiben vor jedem Handoff vorrangig.",
    };
  }
  if (status === "blocked_by_missing_provider") {
    return {
      id: "select_provider" as const,
      reason: "Zuerst muss klar werden, ob überhaupt ein belastbarer Adapterpfad vorgesehen ist.",
    };
  }
  if (status === "needs_provider_configuration") {
    return {
      id: "configure_provider" as const,
      reason: "Adapter- und Konfigurationsanforderungen müssen sichtbar definiert werden, ohne etwas auszuführen.",
    };
  }
  if (status === "blocked_by_missing_assets" || status === "needs_asset_configuration") {
    return {
      id: "prepare_assets" as const,
      reason: "Templates, Overlays und Export-Vorgaben müssen vor jedem echten Renderpfad inventarisiert sein.",
    };
  }
  if (status === "needs_credit_policy") {
    return {
      id: "check_credits" as const,
      reason: "Render-spezifische Credit- oder Billing-Policies fehlen noch vollständig.",
    };
  }
  if (status === "needs_cost_configuration" || status === "blocked_by_unknown_cost") {
    return {
      id: "estimate_cost" as const,
      reason: "Ohne belastbare Cost- und Usage-Wahrheit bleibt ein Renderpfad wirtschaftlich ungeklärt.",
    };
  }
  if (status === "needs_review") {
    return {
      id: "review_sources" as const,
      reason: "Die verbleibenden Review-Gates müssen abgeschlossen sein, bevor Provider oder Assets überhaupt relevant werden.",
    };
  }
  if (status === "needs_usage_limit_check") {
    return {
      id: "check_credits" as const,
      reason: "Usage-Limits müssen separat geklärt werden, bevor ein späterer Renderpfad verantwortbar wäre.",
    };
  }
  return {
    id: "blocked" as const,
    reason: "Der Preflight bleibt bewusst readmodel-only und löst keine Folgeaktion aus.",
  };
}

function buildModelFromInput(input: BuildModelInput): VoxyRenderPreflightReadinessModel | null {
  const sourceLanguage = input.scriptModel?.sourceLanguage ?? input.handoffModel?.sourceLanguage ?? "de";
  const readingLanguage = input.scriptModel?.readingLanguage ?? input.handoffModel?.readingLanguage ?? sourceLanguage;
  const scriptLanguage = input.scriptModel?.scriptLanguage ?? input.handoffModel?.scriptLanguage ?? readingLanguage;
  const renderLanguage = scriptLanguage;
  const subtitleLanguage =
    sourceLanguage !== renderLanguage || input.scriptModel?.rtlDisplayHint ? readingLanguage : null;
  const rtlPreflightHint = input.scriptModel?.rtlDisplayHint
    ? "RTL-Fälle brauchen eigene Subtitle-, Layout- und Review-Regeln."
    : null;

  const { status: assetStatus, items: assetItems } = buildAssetInventory(input.scriptModel);
  const { status: providerSelectionStatus, reason: providerReason } = buildProviderSelectionStatus({
    handoffModel: input.handoffModel,
    scriptModel: input.scriptModel,
    surface: input.surface,
  });
  const { status: costStatus, reason: costReason } = buildCostStatus({
    surface: input.surface,
    handoffModel: input.handoffModel,
    scriptModel: input.scriptModel,
  });
  const reviewReadiness = buildReviewReadiness({
    scriptModel: input.scriptModel,
    handoffModel: input.handoffModel,
    providerStatus: providerSelectionStatus,
    assetStatus,
    costStatus,
  });
  const preflightStatus = resolvePreflightStatus({
    handoffModel: input.handoffModel,
    scriptModel: input.scriptModel,
    providerStatus: providerSelectionStatus,
    assetStatus,
    costStatus,
    reviewReadiness,
  });
  const blockers = buildBlockers({
    status: preflightStatus,
    handoffModel: input.handoffModel,
    scriptModel: input.scriptModel,
    reviewReadiness,
    assetItems,
    costReason,
    providerReason,
  });
  const nextDecision = buildNextDecision(preflightStatus);
  const requiredCapabilities = buildRequiredCapabilities({
    scriptModel: input.scriptModel,
    handoffModel: input.handoffModel,
  });
  const languageLine = [
    `Original: ${languageName(sourceLanguage)}`,
    `Lesefassung: ${languageName(readingLanguage)}`,
    `Render: ${languageName(renderLanguage)}`,
    subtitleLanguage ? `Untertitel: ${languageName(subtitleLanguage)}` : "Untertitel: noch offen",
    rtlPreflightHint ? "RTL-Hinweis aktiv" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: "Render-Preflight",
    summary:
      "Diese Schicht prüft nur, ob ein späterer Voxy-Renderpfad grundsätzlich vorbereitet werden könnte und welche Voraussetzungen sichtbar fehlen. Es wird nichts gerendert, hochgeladen oder gebucht.",
    surface: input.surface,
    handoffRef: input.handoffModel?.contributionRef ?? input.contributionRef ?? null,
    scriptRef: input.scriptModel
      ? {
          id: `${normalizeText(input.scriptModel.scriptDraft.title).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "script"}-candidate`,
          title: input.scriptModel.scriptDraft.title,
          href: input.contributionRef?.href ?? null,
        }
      : null,
    contributionRef: input.contributionRef ?? input.handoffModel?.contributionRef ?? null,
    dossierRef: input.dossierRef ?? input.handoffModel?.dossierRef ?? null,
    participationRef: input.participationRef ?? null,
    outputRef: input.outputRef ?? input.handoffModel?.outputRef ?? null,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlPreflightHint,
    languageLabel: languageLine,
    preflightStatus,
    preflightStatusLabel: preflightStatusLabel(preflightStatus),
    providerSelectionStatus,
    providerSelectionStatusLabel: providerSelectionStatusLabel(providerSelectionStatus),
    requiredCapabilities,
    providerExecutionAllowed: false,
    assetStatus,
    assetStatusLabel: assetStatusLabel(assetStatus),
    requiredAssets: assetItems,
    assetExecutionAllowed: false,
    costStatus,
    costStatusLabel: costStatusLabel(costStatus),
    costDebitAllowed: false,
    usageBookingAllowed: false,
    pricingClaimAllowed: false,
    reviewReadiness,
    blockers,
    nextPreflightDecision: {
      id: nextDecision.id,
      label: nextDecisionLabel(nextDecision.id),
      reason: nextDecision.reason,
    },
    publicSafeLabel: "Noch kein Rendering",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    noRenderAction: true,
    noProviderExecution: true,
    noCostDebit: true,
    noPublishAction: true,
    noSocialPostAction: true,
    noRuntimeClaim: true,
  };
}

export function buildVoxyRenderPreflightReadinessFromProviderHandoff(params: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  surface: PreflightSurface;
  contributionRef?: PreflightRef | null;
  dossierRef?: PreflightRef | null;
  participationRef?: PreflightRef | null;
  outputRef?: PreflightRef | null;
  userVisibleReason?: string;
  reviewerVisibleReason?: string;
  nextStep?: string;
}) {
  return buildModelFromInput({
    surface: params.surface,
    handoffModel: params.handoffModel,
    scriptModel: params.scriptModel,
    contributionRef: params.contributionRef ?? null,
    dossierRef: params.dossierRef ?? null,
    participationRef: params.participationRef ?? null,
    outputRef: params.outputRef ?? null,
    userVisibleReason:
      params.userVisibleReason ??
      "Der Render-Preflight zeigt nur Voraussetzungen und Blocker. Es wird kein Video erzeugt.",
    reviewerVisibleReason:
      params.reviewerVisibleReason ??
      "Provider, Assets, Kosten und Limits bleiben im Preflight readmodel-only und lösen nichts aus.",
    nextStep: params.nextStep ?? "Preflight-Voraussetzungen prüfen",
  });
}

export function buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const handoffModel = buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const scriptModel = buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);

  return buildVoxyRenderPreflightReadinessFromProviderHandoff({
    handoffModel,
    scriptModel,
    surface: "create",
    contributionRef: handoffModel?.contributionRef ?? scriptModel?.contributionRef ?? null,
    dossierRef: handoffModel?.dossierRef ?? null,
    outputRef: handoffModel?.outputRef ?? scriptModel?.outputRef ?? null,
    userVisibleReason:
      "In /create bleibt dieser Preflight eine ehrliche Vorschau auf spätere Rendervoraussetzungen. Es wird nichts gestartet.",
    reviewerVisibleReason:
      "Create zeigt nur eine readmodel-only Preflight-Schicht auf Basis des bestehenden Handoff- und Script-Kontexts.",
    nextStep: "Review-Handoff und Preflight prüfen",
  });
}

export function buildVoxyRenderPreflightReadinessFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: PreflightRef | null;
    outputRef?: PreflightRef | null;
    nextStep?: string;
  },
) {
  const handoffModel = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Preflight prüfen",
  });
  const scriptModel = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Preflight prüfen",
  });

  return buildVoxyRenderPreflightReadinessFromProviderHandoff({
    handoffModel,
    scriptModel,
    surface: "account",
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    userVisibleReason:
      "Im Account zeigt der Preflight nur, was für einen späteren Renderpfad fehlen würde. Es wird kein Provider kontaktiert.",
    reviewerVisibleReason:
      "Lokale oder resume-fähige Arbeitsstände behalten den Preflight strikt als readmodel-only Layer.",
    nextStep: options?.nextStep ?? "Preflight prüfen",
  });
}

export function buildVoxyRenderPreflightReadinessFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: PreflightRef | null;
    dossierRef?: PreflightRef | null;
    participationRef?: PreflightRef | null;
    outputRef?: PreflightRef | null;
  },
) {
  const surface: Extract<PreflightSurface, "admin" | "workspace"> =
    options?.audience === "admin" ? "admin" : "workspace";
  const handoffModel = buildVoxyRenderProviderHandoffFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  const scriptModel = buildVoxyBriefingScriptCandidateFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    participationRef: options?.participationRef ?? null,
    outputRef: options?.outputRef ?? null,
  });

  return buildVoxyRenderPreflightReadinessFromProviderHandoff({
    handoffModel,
    scriptModel,
    surface,
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    participationRef: options?.participationRef ?? null,
    outputRef: options?.outputRef ?? null,
    userVisibleReason:
      "Dieser Preflight zeigt nur Voraussetzungen für einen späteren Renderpfad. Weder Provider noch Kosten noch Publish werden ausgelöst.",
    reviewerVisibleReason:
      "Admin- und Studio-Kontexte sehen Render-, Asset- und Cost-Gates nur als readmodel-only Vorprüfung.",
    nextStep:
      options?.audience === "admin"
        ? "Provider-, Asset- und Review-Gates prüfen"
        : "Render-Preflight im Studio prüfen",
  });
}
