import voxyManifest from "../../../public/brand/voxy/manifest.json";
import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import type {
  VoxyRenderAssetProviderRegistryAssetItem,
  VoxyRenderAssetProviderRegistryModel,
  VoxyRenderAssetProviderRegistryProviderItem,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderCostCreditPolicyPersistenceState,
  VoxyRenderCostCreditPolicyPreviewRecord,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import type {
  VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import type {
  VoxyRenderProviderHandoffModel,
} from "@/features/create/voxyRenderProviderHandoffContract";
import type {
  VoxyRenderQueuePreviewRecord,
} from "@/features/create/voxyRenderQueueContract";
import type {
  VoxyRenderRequestDraftPersistenceState,
  VoxyRenderRequestDraftRequirementItem,
  VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
  buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
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
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import { VOXY_ASSET_MAP, VOXY_MANIFEST_PATH, VOXY_OVERLAYS } from "@/features/voxy/voxyAssets";

export const VOXY_RENDER_ASSET_PACK_DRAFT_STATUSES = [
  "asset_pack_draft_only",
  "noop_asset_pack",
  "requirements_only",
  "partially_available",
  "needs_asset_review",
  "needs_voice_profile",
  "needs_subtitle_template",
  "needs_lower_third_template",
  "needs_source_caption_template",
  "needs_export_preset",
  "blocked_by_missing_request_draft",
  "blocked_by_missing_registry",
  "blocked_by_missing_required_assets",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderAssetPackDraftStatus =
  (typeof VOXY_RENDER_ASSET_PACK_DRAFT_STATUSES)[number];

export const VOXY_RENDER_ASSET_PACK_DRAFT_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderAssetPackDraftStoreResultStatus =
  (typeof VOXY_RENDER_ASSET_PACK_DRAFT_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_ASSET_PACK_DRAFT_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderAssetPackDraftPersistenceMode =
  (typeof VOXY_RENDER_ASSET_PACK_DRAFT_PERSISTENCE_MODES)[number];

export const VOXY_RENDER_ASSET_PACK_ENTRY_KEYS = [
  "voxy_avatar",
  "voice_profile",
  "brand_logo",
  "background_template",
  "subtitle_template",
  "lower_third_template",
  "source_caption_template",
  "export_preset",
  "provider_asset_requirements",
  "rtl_subtitle_support",
  "multilingual_voice_support",
] as const;

export type VoxyRenderAssetPackEntryKey =
  (typeof VOXY_RENDER_ASSET_PACK_ENTRY_KEYS)[number];

export const VOXY_RENDER_ASSET_PACK_ENTRY_STATUSES = [
  "available",
  "missing",
  "requirement_only",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderAssetPackEntryStatus =
  (typeof VOXY_RENDER_ASSET_PACK_ENTRY_STATUSES)[number];

export const VOXY_RENDER_ASSET_PACK_ENTRY_SOURCES = [
  "repo",
  "manifest",
  "requirement",
  "unknown",
] as const;

export type VoxyRenderAssetPackEntrySource =
  (typeof VOXY_RENDER_ASSET_PACK_ENTRY_SOURCES)[number];

export const VOXY_RENDER_ASSET_PACK_NEXT_DECISIONS = [
  "review_assets",
  "prepare_voice_profile",
  "prepare_subtitle_template",
  "prepare_lower_thirds",
  "prepare_source_captions",
  "prepare_export_preset",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderAssetPackNextDecision =
  (typeof VOXY_RENDER_ASSET_PACK_NEXT_DECISIONS)[number];

type DraftSurface = "create" | "account" | "admin" | "workspace";

type DraftRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderAssetPackEntry = {
  assetKey: VoxyRenderAssetPackEntryKey;
  label: string;
  status: VoxyRenderAssetPackEntryStatus;
  statusLabel: string;
  source: VoxyRenderAssetPackEntrySource;
  sourceLabel: string;
  publicPath: string | null;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  renderSafe: false;
  generated: false;
  uploaded: false;
};

export type VoxyRenderAssetPackDraftExecutionFlags = {
  createsMediaFile: false;
  createsSubtitleFile: false;
  createsVoiceFile: false;
  createsExportPreset: false;
  callsProvider: false;
  queueEnabled: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderAssetPackDraftPreviewRecord = {
  assetPackDraftId: string;
  requestDraftId: string | null;
  queuePreviewId: string | null;
  costPolicyPreviewId: string | null;
  decisionId: string | null;
  decisionGateId: string | null;
  handoffRef: DraftRef | null;
  preflightRef: DraftRef | null;
  registryRef: DraftRef | null;
  adapterRef: DraftRef | null;
  scriptRef: DraftRef | null;
  contributionRef: DraftRef | null;
  dossierRef: DraftRef | null;
  videoFormat: "briefing_video";
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  surface: DraftSurface;
  assetPackStatus: VoxyRenderAssetPackDraftStatus;
  assetEntries: VoxyRenderAssetPackEntry[];
  providerRequirements: VoxyRenderRequestDraftRequirementItem[];
  assetRequirements: VoxyRenderRequestDraftRequirementItem[];
  costRequirements: VoxyRenderRequestDraftRequirementItem[];
  blockers: string[];
  evidenceLines: string[];
  nextAssetDecision: VoxyRenderAssetPackNextDecision;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  execution: VoxyRenderAssetPackDraftExecutionFlags;
  persistedAt: string | null;
  persistedBy: string | null;
  idempotencyKey: string | null;
  previousAssetPackDraftRef: string | null;
  supersedesAssetPackDraftRef: string | null;
  assetPackVersion: number | null;
};

export type VoxyRenderAssetPackDraftPreviewCommand = Omit<
  VoxyRenderAssetPackDraftPreviewRecord,
  | "persistedAt"
  | "persistedBy"
  | "idempotencyKey"
  | "previousAssetPackDraftRef"
  | "supersedesAssetPackDraftRef"
  | "assetPackVersion"
> & {
  createdAt: string | null;
  createdBy: string | null;
};

export type VoxyRenderAssetPackDraftStoreResult = {
  ok: boolean;
  status: VoxyRenderAssetPackDraftStoreResultStatus;
  record: VoxyRenderAssetPackDraftPreviewRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderAssetPackDraftPersistenceState = {
  mode: VoxyRenderAssetPackDraftPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderAssetPackDraftRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderAssetPackDraftPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderAssetPackDraftPreviewRecord;
  assetPackStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    assetPackDraftId: string;
    statusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    assetPackVersion: number | null;
    costPolicyPreviewId: string | null;
  } | null;
  blockedReasons: string[];
  evidenceLines: string[];
  auditLines: string[];
  nextStep: string;
  executionFlags: VoxyRenderAssetPackDraftExecutionFlags;
};

type BuildPreviewInput = {
  surface: DraftSurface;
  requestDraft?: VoxyRenderRequestDraftRecord | null;
  queuePreview?: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview?: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  handoffModel?: VoxyRenderProviderHandoffModel | null;
  preflightModel?: VoxyRenderPreflightReadinessModel | null;
  registryModel?: VoxyRenderAssetProviderRegistryModel | null;
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

function isRtlLanguage(language: string | null | undefined) {
  const normalized = normalizeText(language).toLowerCase();
  return normalized === "ar" || normalized === "fa" || normalized === "he" || normalized === "ur";
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

function assetKeyLabel(value: VoxyRenderAssetPackEntryKey) {
  if (value === "voxy_avatar") return "Voxy-Avatar";
  if (value === "voice_profile") return "Voice-Profil";
  if (value === "brand_logo") return "Brand-Logo";
  if (value === "background_template") return "Background-Template";
  if (value === "subtitle_template") return "Subtitle-Template";
  if (value === "lower_third_template") return "Lower-Third-Template";
  if (value === "source_caption_template") return "Source-Caption-Template";
  if (value === "export_preset") return "Export-Preset";
  if (value === "provider_asset_requirements") return "Provider-Asset-Anforderungen";
  if (value === "rtl_subtitle_support") return "RTL-Subtitle-Support";
  return "Mehrsprachiger Voice-Support";
}

function assetEntryStatusLabel(value: VoxyRenderAssetPackEntryStatus) {
  if (value === "available") return "Vorhanden";
  if (value === "missing") return "Fehlt";
  if (value === "requirement_only") return "Nur Anforderung";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function assetEntrySourceLabel(value: VoxyRenderAssetPackEntrySource) {
  if (value === "repo") return "Repo";
  if (value === "manifest") return "Manifest";
  if (value === "requirement") return "Anforderung";
  return "Unbekannt";
}

export function voxyRenderAssetPackDraftStatusLabel(value: VoxyRenderAssetPackDraftStatus) {
  if (value === "asset_pack_draft_only") return "Nur Asset-Pack-Draft";
  if (value === "noop_asset_pack") return "Noop-Asset-Pack";
  if (value === "requirements_only") return "Nur Anforderungen sichtbar";
  if (value === "partially_available") return "Teilweise vorhanden";
  if (value === "needs_asset_review") return "Asset-Review nötig";
  if (value === "needs_voice_profile") return "Voice-Profil fehlt";
  if (value === "needs_subtitle_template") return "Subtitle-Template fehlt";
  if (value === "needs_lower_third_template") return "Lower-Third-Template fehlt";
  if (value === "needs_source_caption_template") return "Source-Caption-Template fehlt";
  if (value === "needs_export_preset") return "Export-Preset fehlt";
  if (value === "blocked_by_missing_request_draft") return "Ohne Request-Draft blockiert";
  if (value === "blocked_by_missing_registry") return "Ohne Registry blockiert";
  if (value === "blocked_by_missing_required_assets") return "Ohne Pflichtassets blockiert";
  if (value === "blocked_by_runtime_truth") return "Ohne Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

function nextDecisionLabel(value: VoxyRenderAssetPackNextDecision) {
  if (value === "review_assets") return "Assets prüfen";
  if (value === "prepare_voice_profile") return "Voice-Profil vorbereiten";
  if (value === "prepare_subtitle_template") return "Subtitle-Template vorbereiten";
  if (value === "prepare_lower_thirds") return "Lower Thirds vorbereiten";
  if (value === "prepare_source_captions") return "Source Captions vorbereiten";
  if (value === "prepare_export_preset") return "Export-Preset vorbereiten";
  if (value === "keep_as_script_only") return "Script-only belassen";
  return "Blockiert";
}

function buildExecutionFlags(): VoxyRenderAssetPackDraftExecutionFlags {
  return {
    createsMediaFile: false,
    createsSubtitleFile: false,
    createsVoiceFile: false,
    createsExportPreset: false,
    callsProvider: false,
    queueEnabled: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function defaultPersistenceState(): VoxyRenderAssetPackDraftPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Asset-Pack-Draft-Store im Surface",
    summary:
      "Dieses Surface zeigt nur den prüfbaren Render-Asset-Pack-Draft. Echte Datei-, Export- oder Upload-Runtime bleibt bewusst getrennt.",
    repositoryInterface: "VoxyRenderAssetPackDraftRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function buildPreviewId(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  latestDecisionRecord: VoxyRenderPersistedDecisionRecord | null;
  gate: VoxyRenderReviewDecisionGateModel | null;
  surface: DraftSurface;
}) {
  return `voxy-render-asset-pack-draft:${sanitizeIdFragment(
    input.requestDraft?.requestDraftId ??
      input.queuePreview?.queuePreviewId ??
      input.costPolicyPreview?.policyPreviewId ??
      input.latestDecisionRecord?.decisionId ??
      input.gate?.decisionGateId ??
      `${input.surface}-preview`,
  )}`;
}

function manifestAssetIds() {
  return new Set(
    Array.isArray(voxyManifest?.assets)
      ? voxyManifest.assets.map((item) => normalizeText((item as { id?: string }).id)).filter(Boolean)
      : [],
  );
}

function registryAssetMap(
  registryModel: VoxyRenderAssetProviderRegistryModel | null | undefined,
) {
  return new Map(
    (registryModel?.assetInventory ?? []).map((item) => [item.id, item] satisfies [string, VoxyRenderAssetProviderRegistryAssetItem]),
  );
}

function registryProviderMap(
  registryModel: VoxyRenderAssetProviderRegistryModel | null | undefined,
) {
  return new Map(
    (registryModel?.providerRegistry ?? []).map((item) => [item.id, item] satisfies [string, VoxyRenderAssetProviderRegistryProviderItem]),
  );
}

function findRequirement(
  requirements: VoxyRenderRequestDraftRequirementItem[],
  pattern: RegExp,
) {
  return requirements.find((item) => pattern.test(`${item.id} ${item.label}`.toLowerCase())) ?? null;
}

function mapRegistryAssetToPackEntry(input: {
  key: Extract<
    VoxyRenderAssetPackEntryKey,
    | "voxy_avatar"
    | "voice_profile"
    | "brand_logo"
    | "background_template"
    | "subtitle_template"
    | "lower_third_template"
    | "source_caption_template"
    | "export_preset"
  >;
  registryItem?: VoxyRenderAssetProviderRegistryAssetItem | null;
  publicPathOverride?: string | null;
  userReasonOverride?: string | null;
}): VoxyRenderAssetPackEntry {
  const status = input.registryItem?.status ?? "missing";
  const source = input.registryItem?.source ?? "unknown";
  const reviewerVisibleReason =
    normalizeText(input.registryItem?.reviewerVisibleReason) || "Noch keine belastbare Asset-Wahrheit sichtbar.";
  return {
    assetKey: input.key,
    label: assetKeyLabel(input.key),
    status,
    statusLabel: assetEntryStatusLabel(status),
    source,
    sourceLabel: assetEntrySourceLabel(source),
    publicPath: input.publicPathOverride ?? input.registryItem?.publicPath ?? null,
    reviewerVisibleReason,
    userVisibleReason:
      normalizeText(input.userReasonOverride) ||
      reviewerVisibleReason.replace("im Repo", "für dieses Asset").replace("Es gibt", "Aktuell gibt es"),
    renderSafe: false,
    generated: false,
    uploaded: false,
  };
}

function buildAssetEntries(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
}) {
  const registryAssets = registryAssetMap(input.registryModel);
  const registryProviders = registryProviderMap(input.registryModel);
  const requestAssetRequirements =
    input.queuePreview?.assetRequirements ?? input.requestDraft?.assetRequirements ?? [];
  const requestProviderRequirements =
    input.queuePreview?.providerRequirements ?? input.requestDraft?.providerRequirements ?? [];
  const sourceLanguage =
    input.queuePreview?.sourceLanguage ?? input.requestDraft?.sourceLanguage ?? "de";
  const scriptLanguage =
    input.queuePreview?.scriptLanguage ?? input.requestDraft?.scriptLanguage ?? sourceLanguage;
  const renderLanguage =
    input.queuePreview?.renderLanguage ?? input.requestDraft?.renderLanguage ?? scriptLanguage;
  const readingLanguage =
    input.queuePreview?.readingLanguage ?? input.requestDraft?.readingLanguage ?? sourceLanguage;
  const subtitleLanguage =
    input.queuePreview?.subtitleLanguage ?? input.requestDraft?.subtitleLanguage ?? null;
  const rtlRequired =
    input.queuePreview?.rtlRequired ??
    input.requestDraft?.rtlRequired ??
    (isRtlLanguage(subtitleLanguage) || isRtlLanguage(renderLanguage));
  const multilingualRequired =
    sourceLanguage !== scriptLanguage ||
    sourceLanguage !== renderLanguage ||
    sourceLanguage !== readingLanguage ||
    Boolean(findRequirement(requestProviderRequirements, /multilingual|mehrsprach/i));
  const subtitleRequired =
    Boolean(subtitleLanguage) ||
    Boolean(findRequirement(requestAssetRequirements, /subtitle|untertitel/i));
  const lowerThirdRequired = Boolean(findRequirement(requestAssetRequirements, /lower.?third|bauchbinde/i));
  const sourceCaptionRequired =
    multilingualRequired ||
    Boolean(findRequirement(requestAssetRequirements, /source.?caption|caption/i));
  const exportPresetRequired =
    Boolean(input.requestDraft || input.queuePreview || input.costPolicyPreview) ||
    Boolean(findRequirement(requestAssetRequirements, /export.?preset|preset|caption.?export/i));
  const manifestIds = manifestAssetIds();

  const voxyAvatarPath = VOXY_ASSET_MAP.confident?.png ?? null;
  const hasVoxyAvatar = Boolean(
    voxyAvatarPath &&
      VOXY_ASSET_MAP.miniAvatar?.png &&
      manifestIds.has("confident") &&
      manifestIds.has("mini-avatar"),
  );
  const brandLogoPath = VOXY_OVERLAYS.voxyWordmark.path ?? null;
  const hasBrandAssets = Boolean(
    brandLogoPath &&
      VOXY_OVERLAYS.edebatteGradient.path &&
      VOXY_OVERLAYS.vogPin.path,
  );
  const backgroundNotes = normalizeText(voxyManifest?.usage_notes?.background);

  const entries: VoxyRenderAssetPackEntry[] = [
    mapRegistryAssetToPackEntry({
      key: "voxy_avatar",
      registryItem:
        registryAssets.get("voxy_avatar") ??
        ({
          id: "voxy_avatar",
          label: "Voxy-Avatar",
          status: hasVoxyAvatar ? "available" : "missing",
          statusLabel: assetEntryStatusLabel(hasVoxyAvatar ? "available" : "missing"),
          source: hasVoxyAvatar ? "repo" : "unknown",
          sourceLabel: assetEntrySourceLabel(hasVoxyAvatar ? "repo" : "unknown"),
          publicPath: hasVoxyAvatar ? voxyAvatarPath : null,
          reviewerVisibleReason: hasVoxyAvatar
            ? "Statische Voxy-Figuren sind im Repo und Manifest sichtbar. Das belegt nur Asset-Wahrheit, nicht Render-Sicherheit."
            : "Kein belastbarer Voxy-Avatar ist im sichtbaren Repo-/Manifest-Bestand belegbar.",
        } satisfies VoxyRenderAssetProviderRegistryAssetItem),
      publicPathOverride: hasVoxyAvatar ? voxyAvatarPath : null,
    }),
    mapRegistryAssetToPackEntry({
      key: "voice_profile",
      registryItem: registryAssets.get("voice_profile"),
      userReasonOverride:
        "Für einen späteren Lauf wäre ein echtes Voice-Profil nötig. Aktuell ist keines im Repo oder als sichere Konfiguration sichtbar.",
    }),
    mapRegistryAssetToPackEntry({
      key: "brand_logo",
      registryItem:
        registryAssets.get("brand_logo") ??
        ({
          id: "brand_logo",
          label: "Brand-Logo",
          status: hasBrandAssets ? "available" : "missing",
          statusLabel: assetEntryStatusLabel(hasBrandAssets ? "available" : "missing"),
          source: hasBrandAssets ? "repo" : "unknown",
          sourceLabel: assetEntrySourceLabel(hasBrandAssets ? "repo" : "unknown"),
          publicPath: hasBrandAssets ? brandLogoPath : null,
          reviewerVisibleReason: hasBrandAssets
            ? "Wordmark, Gradient und VOG-Pin liegen als statische Overlay-Assets im Repo vor. Ihre Nutzung bleibt review-first."
            : "Kein belastbarer Brand-Lockup ist als Repo-Overlay sichtbar.",
        } satisfies VoxyRenderAssetProviderRegistryAssetItem),
      publicPathOverride: hasBrandAssets ? brandLogoPath : null,
    }),
    mapRegistryAssetToPackEntry({
      key: "background_template",
      registryItem:
        registryAssets.get("background_template") ??
        ({
          id: "background_template",
          label: "Background-Template",
          status: backgroundNotes ? "requirement_only" : "missing",
          statusLabel: assetEntryStatusLabel(backgroundNotes ? "requirement_only" : "missing"),
          source: backgroundNotes ? "manifest" : "unknown",
          sourceLabel: assetEntrySourceLabel(backgroundNotes ? "manifest" : "unknown"),
          publicPath: null,
          reviewerVisibleReason: backgroundNotes
            ? "Das Manifest beschreibt nur Platzierungs- und Hintergrundregeln. Eine echte Szenen- oder Template-Datei fehlt weiterhin."
            : "Für den Renderhintergrund ist keine belastbare Template-Wahrheit sichtbar.",
        } satisfies VoxyRenderAssetProviderRegistryAssetItem),
      userReasonOverride:
        "Es gibt nur Manifest-Hinweise für den Hintergrund. Eine echte Hintergrundvorlage liegt nicht als Render-Datei vor.",
    }),
    mapRegistryAssetToPackEntry({
      key: "subtitle_template",
      registryItem: registryAssets.get("subtitle_template"),
      userReasonOverride: rtlRequired
        ? "RTL- oder Untertitelbedarf ist sichtbar, aber eine echte Untertitelvorlage fehlt."
        : "Sobald Untertitel gebraucht werden, fehlt eine echte Untertitelvorlage.",
    }),
    mapRegistryAssetToPackEntry({
      key: "lower_third_template",
      registryItem: registryAssets.get("lower_third_template"),
      userReasonOverride:
        "Für spätere Bauchbinden gibt es noch keine belastbare Lower-Third-Vorlage.",
    }),
    mapRegistryAssetToPackEntry({
      key: "source_caption_template",
      registryItem: registryAssets.get("source_caption_template"),
      userReasonOverride: multilingualRequired
        ? "Für mehrsprachige oder quellennahe Captions fehlt eine echte Vorlage."
        : "Eine belastbare Vorlage für Quellen-Captions ist nicht vorhanden.",
    }),
    mapRegistryAssetToPackEntry({
      key: "export_preset",
      registryItem: registryAssets.get("export_preset"),
      userReasonOverride:
        "Es gibt kein echtes Export-Preset, keine Render-Konfiguration und keine Medienpipeline.",
    }),
    {
      assetKey: "provider_asset_requirements",
      label: assetKeyLabel("provider_asset_requirements"),
      status: requestProviderRequirements.length > 0 ? "requirement_only" : "needs_review",
      statusLabel: assetEntryStatusLabel(
        requestProviderRequirements.length > 0 ? "requirement_only" : "needs_review",
      ),
      source: "requirement",
      sourceLabel: assetEntrySourceLabel("requirement"),
      publicPath: null,
      reviewerVisibleReason:
        requestProviderRequirements.length > 0
          ? requestProviderRequirements.map((item) => `${item.label}: ${item.reason}`).join(" · ")
          : "Provider- und Adapteranforderungen bleiben sichtbar, aber nicht als echte Dateien oder Providertruth.",
      userVisibleReason:
        "Hier werden nur Anforderungen an spätere Provider-Assets gesammelt. Es entsteht keine Datei und kein Providerlauf.",
      renderSafe: false,
      generated: false,
      uploaded: false,
    },
    {
      assetKey: "rtl_subtitle_support",
      label: assetKeyLabel("rtl_subtitle_support"),
      status: rtlRequired ? "missing" : "requirement_only",
      statusLabel: assetEntryStatusLabel(rtlRequired ? "missing" : "requirement_only"),
      source: rtlRequired ? "requirement" : "unknown",
      sourceLabel: assetEntrySourceLabel(rtlRequired ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason: rtlRequired
        ? normalizeText(registryProviders.get("rtl_subtitles")?.reviewerVisibleReason) ||
          "RTL-Unterstützung ist als Requirement sichtbar, aber nicht als echte Subtitle-Runtime oder Template-Wahrheit belegt."
        : "Kein RTL-Bedarf sichtbar; Support bleibt als spätere Anforderung offen.",
      userVisibleReason: rtlRequired
        ? "Für RTL-Untertitel fehlt weiterhin eine echte Runtime- oder Template-Unterstützung."
        : "RTL-Support bleibt eine spätere Anforderung und ist noch keine echte Laufzeitwahrheit.",
      renderSafe: false,
      generated: false,
      uploaded: false,
    },
    {
      assetKey: "multilingual_voice_support",
      label: assetKeyLabel("multilingual_voice_support"),
      status: multilingualRequired ? "missing" : "requirement_only",
      statusLabel: assetEntryStatusLabel(multilingualRequired ? "missing" : "requirement_only"),
      source: multilingualRequired ? "requirement" : "unknown",
      sourceLabel: assetEntrySourceLabel(multilingualRequired ? "requirement" : "unknown"),
      publicPath: null,
      reviewerVisibleReason: multilingualRequired
        ? normalizeText(registryProviders.get("multilingual_voice")?.reviewerVisibleReason) ||
          "Mehrsprachige Voice-Unterstützung ist nötig, aber nicht als echte Provider- oder Profilwahrheit im Repo belegt."
        : "Ohne mehrsprachigen Bedarf bleibt diese Fähigkeit ein späterer Requirement-Pfad.",
      userVisibleReason: multilingualRequired
        ? "Für mehrsprachige Voice-Ausgabe fehlt eine echte Provider- oder Profilgrundlage."
        : "Mehrsprachige Voice-Unterstützung bleibt nur als spätere Anforderung sichtbar.",
      renderSafe: false,
      generated: false,
      uploaded: false,
    },
  ];

  const voiceEntry = entries.find((item) => item.assetKey === "voice_profile");
  const subtitleEntry = entries.find((item) => item.assetKey === "subtitle_template");
  const lowerThirdEntry = entries.find((item) => item.assetKey === "lower_third_template");
  const sourceCaptionEntry = entries.find((item) => item.assetKey === "source_caption_template");
  const exportEntry = entries.find((item) => item.assetKey === "export_preset");

  return {
    entries,
    requirementState: {
      subtitleRequired,
      lowerThirdRequired,
      sourceCaptionRequired,
      exportPresetRequired,
      rtlRequired,
      multilingualRequired,
      missingVoiceProfile: voiceEntry?.status === "missing",
      missingSubtitleTemplate: subtitleRequired && subtitleEntry?.status === "missing",
      missingLowerThirdTemplate: lowerThirdRequired && lowerThirdEntry?.status === "missing",
      missingSourceCaptionTemplate:
        sourceCaptionRequired && sourceCaptionEntry?.status === "missing",
      missingExportPreset: exportPresetRequired && exportEntry?.status === "missing",
    },
  };
}

function resolveStatus(input: {
  requestDraft: VoxyRenderRequestDraftRecord | null;
  queuePreview: VoxyRenderQueuePreviewRecord | null;
  costPolicyPreview: VoxyRenderCostCreditPolicyPreviewRecord | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  entries: VoxyRenderAssetPackEntry[];
  requirementState: ReturnType<typeof buildAssetEntries>["requirementState"];
}): VoxyRenderAssetPackDraftStatus {
  if (!input.requestDraft) return "blocked_by_missing_request_draft";
  if (!input.registryModel) return "blocked_by_missing_registry";
  if (
    input.requestDraft.requestStatus === "keep_as_script_only" ||
    input.queuePreview?.queueStatus === "keep_as_script_only" ||
    input.costPolicyPreview?.policyStatus === "keep_as_script_only" ||
    input.preflightModel?.preflightStatus === "keep_as_script_only"
  ) {
    return "keep_as_script_only";
  }
  if (
    input.queuePreview?.queueStatus === "blocked_by_runtime_truth" ||
    input.costPolicyPreview?.policyStatus === "blocked_by_runtime_truth" ||
    input.registryModel.registryStatus === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (input.requirementState.missingVoiceProfile) return "needs_voice_profile";
  if (input.requirementState.missingSubtitleTemplate) return "needs_subtitle_template";
  if (input.requirementState.missingLowerThirdTemplate) return "needs_lower_third_template";
  if (input.requirementState.missingSourceCaptionTemplate) {
    return "needs_source_caption_template";
  }
  if (input.requirementState.missingExportPreset) return "needs_export_preset";

  const available = input.entries.filter((item) => item.status === "available").length;
  const missing = input.entries.filter((item) => item.status === "missing").length;
  const review = input.entries.filter((item) => item.status === "needs_review").length;
  const blocked = input.entries.filter((item) => item.status === "blocked").length;
  const requirementsOnly = input.entries.filter((item) => item.status === "requirement_only").length;

  if (blocked > 0 || missing > 0) return "blocked_by_missing_required_assets";
  if (review > 0) return "needs_asset_review";
  if (available > 0 && requirementsOnly > 0) return "partially_available";
  if (available > 0) return "noop_asset_pack";
  if (requirementsOnly > 0) return "requirements_only";
  return "asset_pack_draft_only";
}

function buildNextDecision(status: VoxyRenderAssetPackDraftStatus): VoxyRenderAssetPackNextDecision {
  if (status === "needs_voice_profile") return "prepare_voice_profile";
  if (status === "needs_subtitle_template") return "prepare_subtitle_template";
  if (status === "needs_lower_third_template") return "prepare_lower_thirds";
  if (status === "needs_source_caption_template") return "prepare_source_captions";
  if (status === "needs_export_preset") return "prepare_export_preset";
  if (status === "keep_as_script_only") return "keep_as_script_only";
  if (
    status === "blocked_by_missing_request_draft" ||
    status === "blocked_by_missing_registry" ||
    status === "blocked_by_missing_required_assets" ||
    status === "blocked_by_runtime_truth"
  ) {
    return "blocked";
  }
  return "review_assets";
}

function buildUserVisibleReason(status: VoxyRenderAssetPackDraftStatus) {
  if (status === "blocked_by_missing_request_draft") {
    return "Ohne Render-Request-Draft kann noch kein prüfbares Asset-Pack beschrieben werden.";
  }
  if (status === "blocked_by_missing_registry") {
    return "Ohne ehrliche Asset-Registry lässt sich nicht belegen, welche Dateien wirklich vorhanden sind.";
  }
  if (status === "needs_voice_profile") {
    return "Für einen späteren Lauf fehlt weiterhin ein echtes Voice-Profil.";
  }
  if (status === "needs_subtitle_template") {
    return "Für Untertitel fehlt weiterhin eine echte Vorlage.";
  }
  if (status === "needs_lower_third_template") {
    return "Für Lower Thirds fehlt weiterhin eine echte Vorlage.";
  }
  if (status === "needs_source_caption_template") {
    return "Für Source Captions fehlt weiterhin eine echte Vorlage.";
  }
  if (status === "needs_export_preset") {
    return "Für Ausgabe und Export fehlt weiterhin ein belastbares Preset.";
  }
  if (status === "blocked_by_runtime_truth") {
    return "Runtime-Wahrheit für Render, Provider und Medienerzeugung fehlt weiterhin.";
  }
  if (status === "keep_as_script_only") {
    return "Dieser Pfad bleibt bewusst beim Script und erzeugt noch kein Asset-Pack.";
  }
  if (status === "blocked_by_missing_required_assets") {
    return "Mehrere Pflichtassets fehlen weiterhin oder sind nur als Anforderungen sichtbar.";
  }
  if (status === "requirements_only") {
    return "Aktuell sind vor allem Anforderungen sichtbar, aber kaum belastbare Dateien.";
  }
  if (status === "partially_available") {
    return "Ein Teil der Asset-Wahrheit ist sichtbar, aber der Pack bleibt unvollständig.";
  }
  if (status === "needs_asset_review") {
    return "Vorhandene Assets brauchen weiterhin eine ehrliche Review-Einordnung.";
  }
  if (status === "noop_asset_pack") {
    return "Das Asset-Pack bleibt eine Noop-Vorschau ohne Datei, Export oder Providerlauf.";
  }
  return "Hier wird nur ein prüfbarer Asset-Pack-Draft beschrieben. Es entsteht noch keine Datei.";
}

function buildReviewerVisibleReason(status: VoxyRenderAssetPackDraftStatus) {
  if (status === "blocked_by_missing_request_draft") {
    return "Der Slice stoppt vor jedem Asset-Pack, solange kein ehrlicher Request-Draft vorliegt.";
  }
  if (status === "blocked_by_missing_registry") {
    return "Ohne Registry-Wahrheit darf kein Asset-Pack so wirken, als seien Dateien oder Provider bereits belastbar inventarisiert.";
  }
  if (status === "keep_as_script_only") {
    return "Review- oder Risiko-Gates halten den Pfad bewusst auf Script-Ebene. Asset-Pack bleibt Noop.";
  }
  if (status === "blocked_by_runtime_truth") {
    return "Queue, Provider und Runtime bleiben geblockt. Asset-Pack darf daraus keine Medien- oder Export-Wahrheit ableiten.";
  }
  if (status === "blocked_by_missing_required_assets") {
    return "Pflichtassets oder Requirements fehlen; `asset_available` bleibt strikt ungleich `render_safe`.";
  }
  return "Der Draft inventarisiert nur vorhandene und fehlende Assets, ohne Datei, Export, Upload, Queue oder Providerlauf zu behaupten.";
}

function buildNextStep(status: VoxyRenderAssetPackDraftStatus) {
  return `${nextDecisionLabel(buildNextDecision(status))} und Review-first Grenze beibehalten`;
}

function buildBlockedReasons(input: {
  preview: VoxyRenderAssetPackDraftPreviewRecord;
  latestRecord?: VoxyRenderAssetPackDraftPreviewRecord | null;
}) {
  return uniqueStrings([
    ...input.preview.blockers,
    ...input.preview.assetEntries
      .filter((item) => item.status === "missing" || item.status === "blocked")
      .map((item) => `${item.label}: ${item.reviewerVisibleReason}`),
    input.latestRecord?.persistedAt ? `Zuletzt gespeicherter Draft: ${input.latestRecord.persistedAt}` : null,
  ]);
}

export function buildVoxyRenderAssetPackDraftPreviewFromReadmodels(
  input: BuildPreviewInput,
): VoxyRenderAssetPackDraftPreviewRecord {
  const requestDraft = input.requestDraft ?? null;
  const queuePreview = input.queuePreview ?? null;
  const costPolicyPreview = input.costPolicyPreview ?? null;
  const latestDecisionRecord = input.latestDecisionRecord ?? null;
  const gate = input.gate ?? null;
  const preflightModel = input.preflightModel ?? null;
  const registryModel = input.registryModel ?? null;

  const sourceLanguage =
    queuePreview?.sourceLanguage ??
    requestDraft?.sourceLanguage ??
    costPolicyPreview?.sourceLanguage ??
    gate?.sourceLanguage ??
    latestDecisionRecord?.sourceLanguage ??
    "de";
  const readingLanguage =
    queuePreview?.readingLanguage ??
    requestDraft?.readingLanguage ??
    costPolicyPreview?.readingLanguage ??
    gate?.readingLanguage ??
    latestDecisionRecord?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    queuePreview?.scriptLanguage ??
    requestDraft?.scriptLanguage ??
    costPolicyPreview?.scriptLanguage ??
    gate?.scriptLanguage ??
    latestDecisionRecord?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    queuePreview?.renderLanguage ??
    requestDraft?.renderLanguage ??
    costPolicyPreview?.renderLanguage ??
    gate?.renderLanguage ??
    latestDecisionRecord?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    queuePreview?.subtitleLanguage ??
    requestDraft?.subtitleLanguage ??
    costPolicyPreview?.subtitleLanguage ??
    gate?.subtitleLanguage ??
    latestDecisionRecord?.subtitleLanguage ??
    null;
  const rtlRequired =
    queuePreview?.rtlRequired ??
    requestDraft?.rtlRequired ??
    costPolicyPreview?.rtlRequired ??
    (isRtlLanguage(subtitleLanguage) || isRtlLanguage(renderLanguage));
  const assets = buildAssetEntries({
    requestDraft,
    queuePreview,
    costPolicyPreview,
    preflightModel,
    registryModel,
  });
  const assetPackStatus = resolveStatus({
    requestDraft,
    queuePreview,
    costPolicyPreview,
    preflightModel,
    registryModel,
    entries: assets.entries,
    requirementState: assets.requirementState,
  });

  return {
    assetPackDraftId: buildPreviewId({
      requestDraft,
      queuePreview,
      costPolicyPreview,
      latestDecisionRecord,
      gate,
      surface: input.surface,
    }),
    requestDraftId: requestDraft?.requestDraftId ?? null,
    queuePreviewId: queuePreview?.queuePreviewId ?? null,
    costPolicyPreviewId: costPolicyPreview?.policyPreviewId ?? null,
    decisionId:
      queuePreview?.decisionId ??
      requestDraft?.decisionId ??
      costPolicyPreview?.decisionId ??
      latestDecisionRecord?.decisionId ??
      null,
    decisionGateId:
      queuePreview?.decisionGateId ??
      requestDraft?.decisionGateId ??
      costPolicyPreview?.decisionGateId ??
      gate?.decisionGateId ??
      latestDecisionRecord?.decisionGateId ??
      null,
    handoffRef:
      queuePreview?.handoffRef ??
      requestDraft?.handoffRef ??
      costPolicyPreview?.handoffRef ??
      gate?.handoffRef ??
      latestDecisionRecord?.handoffRef ??
      null,
    preflightRef:
      queuePreview?.preflightRef ??
      requestDraft?.preflightRef ??
      costPolicyPreview?.preflightRef ??
      gate?.preflightRef ??
      latestDecisionRecord?.preflightRef ??
      null,
    registryRef:
      queuePreview?.registryRef ??
      requestDraft?.registryRef ??
      costPolicyPreview?.registryRef ??
      gate?.registryRef ??
      latestDecisionRecord?.registryRef ??
      null,
    adapterRef:
      queuePreview?.adapterRef ??
      requestDraft?.adapterRef ??
      costPolicyPreview?.adapterRef ??
      gate?.adapterRef ??
      latestDecisionRecord?.adapterRef ??
      null,
    scriptRef:
      queuePreview?.scriptRef ??
      requestDraft?.scriptRef ??
      costPolicyPreview?.scriptRef ??
      gate?.scriptRef ??
      latestDecisionRecord?.scriptRef ??
      null,
    contributionRef:
      queuePreview?.contributionRef ??
      requestDraft?.contributionRef ??
      costPolicyPreview?.contributionRef ??
      gate?.contributionRef ??
      latestDecisionRecord?.contributionRef ??
      null,
    dossierRef:
      queuePreview?.dossierRef ??
      requestDraft?.dossierRef ??
      costPolicyPreview?.dossierRef ??
      gate?.dossierRef ??
      latestDecisionRecord?.dossierRef ??
      null,
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
    assetPackStatus,
    assetEntries: assets.entries,
    providerRequirements: queuePreview?.providerRequirements ?? requestDraft?.providerRequirements ?? [],
    assetRequirements: queuePreview?.assetRequirements ?? requestDraft?.assetRequirements ?? [],
    costRequirements:
      costPolicyPreview?.costRequirements ??
      queuePreview?.costRequirements ??
      requestDraft?.costRequirements ??
      [],
    blockers: uniqueStrings([
      requestDraft ? null : "Es gibt noch keinen prüfbaren Render-Request-Draft.",
      registryModel ? null : "Es gibt noch keine ehrliche Asset-/Provider-Registry für diesen Pfad.",
      costPolicyPreview?.policyStatus === "blocked_by_runtime_truth"
        ? "Kosten-/Credit-Policy markiert weiterhin fehlende Runtime-Wahrheit."
        : null,
      queuePreview?.queueStatus === "blocked_by_runtime_truth"
        ? "Queue-Vertrag bleibt weiterhin ohne Runtime-Wahrheit blockiert."
        : null,
      preflightModel?.blockers?.join(" · ") ?? null,
      "Noch keine Datei, kein Export, kein Upload und kein Providerlauf.",
      "Asset-Pack-Draft ist nicht media_file und nicht render_safe.",
      "Verfügbare Repo-Assets bleiben statische Wahrheit und kein Beleg für Runtime-Sicherheit.",
    ]),
    evidenceLines: uniqueStrings([
      requestDraft?.requestDraftId ? `Request-Draft: ${requestDraft.requestDraftId}` : null,
      queuePreview?.queuePreviewId ? `Queue-Preview: ${queuePreview.queuePreviewId}` : null,
      costPolicyPreview?.policyPreviewId
        ? `Cost-/Credit-Policy-Preview: ${costPolicyPreview.policyPreviewId}`
        : null,
      `Manifest: ${VOXY_MANIFEST_PATH}`,
      `Sprachen: Original ${languageName(sourceLanguage)} · Lesefassung ${languageName(readingLanguage)} · Script ${languageName(scriptLanguage)} · Render ${languageName(renderLanguage)}`,
      subtitleLanguage ? `Untertitel: ${languageName(subtitleLanguage)}` : "Untertitel: noch offen",
      rtlRequired ? "RTL-Anforderung bleibt sichtbar." : null,
      "Voxy-Figuren und Overlay-Assets liegen als statische Public-Assets im Repo.",
      "Voice-, Subtitle-, Lower-Third-, Source-Caption- und Export-Runtime fehlen weiterhin als echte Medien- oder Preset-Wahrheit.",
      "Übersetzung bleibt Lesehilfe und kein Beleg.",
    ]),
    nextAssetDecision: buildNextDecision(assetPackStatus),
    userVisibleReason: buildUserVisibleReason(assetPackStatus),
    reviewerVisibleReason: buildReviewerVisibleReason(assetPackStatus),
    nextStep: buildNextStep(assetPackStatus),
    execution: buildExecutionFlags(),
    persistedAt: normalizeText(input.persistedAt) || null,
    persistedBy: normalizeText(input.persistedBy) || null,
    idempotencyKey: null,
    previousAssetPackDraftRef: null,
    supersedesAssetPackDraftRef: null,
    assetPackVersion: null,
  };
}

export function buildVoxyRenderAssetPackDraftPreviewCommandFromPreview(
  preview: VoxyRenderAssetPackDraftPreviewRecord,
  options?: {
    createdAt?: string | null;
    createdBy?: string | null;
  },
): VoxyRenderAssetPackDraftPreviewCommand {
  return {
    ...preview,
    createdAt: normalizeText(options?.createdAt) || null,
    createdBy: normalizeText(options?.createdBy) || null,
  };
}

export function buildVoxyRenderAssetPackDraftPreviewFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
    surface: "create",
    requestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    queuePreview: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
    costPolicyPreview: buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
    handoffModel: buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model),
    preflightModel: buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model),
    registryModel: buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderAssetPackDraftPreviewFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience: "admin" | "workspace";
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    latestCostPolicyPreviewRecord?: VoxyRenderCostCreditPolicyPreviewRecord | null;
    contributionRef?: DraftRef | null;
    dossierRef?: DraftRef | null;
    outputRef?: DraftRef | null;
  },
) {
  const audience = options?.audience ?? "admin";
  return buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
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
  });
}

export function buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    latestDecisionRecord?: VoxyRenderPersistedDecisionRecord | null;
    latestRequestDraftRecord?: VoxyRenderRequestDraftRecord | null;
    latestQueuePreviewRecord?: VoxyRenderQueuePreviewRecord | null;
    latestCostPolicyPreviewRecord?: VoxyRenderCostCreditPolicyPreviewRecord | null;
    contributionRef?: DraftRef | null;
    dossierRef?: DraftRef | null;
    outputRef?: DraftRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  return buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
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
  });
}

export function buildVoxyRenderAssetPackDraftPanelModel(input: {
  preview: VoxyRenderAssetPackDraftPreviewRecord | null;
  latestRecord?: VoxyRenderAssetPackDraftPreviewRecord | null;
  storeState?:
    | VoxyRenderAssetPackDraftPersistenceState
    | VoxyRenderRequestDraftPersistenceState
    | VoxyRenderCostCreditPolicyPersistenceState
    | null;
}) {
  if (!input.preview) return null;
  const latestRecord = input.latestRecord ?? null;
  const storeState = (input.storeState as VoxyRenderAssetPackDraftPersistenceState | null) ?? defaultPersistenceState();
  return {
    title: "Render-Asset-Pack",
    summary:
      "Dieser Draft zeigt nur, welche Assets für einen späteren Voxy-Renderlauf sichtbar, fehlend oder reine Anforderungen sind. Er erzeugt keine Datei und startet nichts.",
    preview: input.preview,
    assetPackStatusLabel: voxyRenderAssetPackDraftStatusLabel(input.preview.assetPackStatus),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          assetPackDraftId: latestRecord.assetPackDraftId,
          statusLabel: voxyRenderAssetPackDraftStatusLabel(latestRecord.assetPackStatus),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          assetPackVersion: latestRecord.assetPackVersion,
          costPolicyPreviewId: latestRecord.costPolicyPreviewId,
        }
      : null,
    blockedReasons: buildBlockedReasons({
      preview: input.preview,
      latestRecord,
    }),
    evidenceLines: input.preview.evidenceLines,
    auditLines: uniqueStrings([
      `Status: ${voxyRenderAssetPackDraftStatusLabel(input.preview.assetPackStatus)}`,
      `Nächste Asset-Entscheidung: ${nextDecisionLabel(input.preview.nextAssetDecision)}`,
      `Sprachen: ${languageName(input.preview.sourceLanguage)} -> ${languageName(input.preview.renderLanguage)}`,
      input.preview.subtitleLanguage
        ? `Untertitel: ${languageName(input.preview.subtitleLanguage)}`
        : "Untertitel: noch offen",
      input.preview.rtlRequired ? "RTL bleibt prüfpflichtig." : null,
      latestRecord?.persistedAt ? `Zuletzt gespeichert: ${latestRecord.persistedAt}` : null,
      "Keine Datei, keine Untertiteldatei, keine Voice-Datei, kein Export, kein Upload, keine Queue, kein Providerlauf, keine Kosten und kein Publish.",
    ]),
    nextStep: input.preview.nextStep,
    executionFlags: input.preview.execution,
  } satisfies VoxyRenderAssetPackDraftPanelModel;
}
