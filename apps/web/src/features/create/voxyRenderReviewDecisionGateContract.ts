import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyBriefingScriptCandidateModel,
  VoxyBriefingScriptRisk,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyBriefingScriptCandidateFromCreateCandidatePreview,
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import type { VoxyRenderAdapterNoopModel } from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import type {
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import type {
  VoxyRenderPreflightReadinessModel,
  VoxyRenderPreflightReviewItem,
  VoxyRenderPreflightReviewKey,
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

export const VOXY_RENDER_REVIEW_DECISION_GATE_STATUSES = [
  "readmodel_only",
  "decision_preview",
  "needs_script_review",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_language_review",
  "needs_asset_decision",
  "needs_provider_decision",
  "needs_cost_decision",
  "needs_brand_review",
  "needs_persistence",
  "blocked_by_runtime_truth",
  "blocked",
  "keep_as_script_only",
] as const;

export type VoxyRenderReviewDecisionGateStatus =
  (typeof VOXY_RENDER_REVIEW_DECISION_GATE_STATUSES)[number];

export const VOXY_RENDER_REVIEW_DECISION_OPTIONS = [
  "review_script",
  "request_sources",
  "review_factcheck",
  "review_language",
  "prepare_assets",
  "configure_provider",
  "define_cost_policy",
  "check_credits",
  "keep_as_script_only",
  "block_render_path",
] as const;

export type VoxyRenderReviewDecisionOptionId =
  (typeof VOXY_RENDER_REVIEW_DECISION_OPTIONS)[number];

export const VOXY_RENDER_REVIEW_DECISION_RESULT_KINDS = [
  "not_decided",
  "decision_needed",
  "blocked_preview",
  "keep_script_only_preview",
] as const;

export type VoxyRenderReviewDecisionResultKind =
  (typeof VOXY_RENDER_REVIEW_DECISION_RESULT_KINDS)[number];

type DecisionSurface = "create" | "account" | "admin" | "workspace";

type DecisionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderReviewDecisionOption = {
  id: VoxyRenderReviewDecisionOptionId;
  label: string;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  enabled: boolean;
  executionAllowed: false;
  requiresHumanReview: true;
  createsRenderJob: false;
  callsProvider: false;
  createsMedia: false;
  debitsCost: false;
  publishes: false;
};

export type VoxyRenderReviewDecisionResultPreview = {
  resultKind: VoxyRenderReviewDecisionResultKind;
  resultKindLabel: string;
  noRenderAction: true;
  noProviderExecution: true;
  noMediaCreation: true;
  noCostDebit: true;
  noPublishAction: true;
  noRuntimeClaim: true;
};

export type VoxyRenderReviewDecisionGateModel = {
  title: string;
  summary: string;
  surface: DecisionSurface;
  decisionGateId: string;
  contributionRef: DecisionRef | null;
  dossierRef: DecisionRef | null;
  handoffRef: DecisionRef | null;
  preflightRef: DecisionRef | null;
  registryRef: DecisionRef | null;
  adapterRef: DecisionRef | null;
  scriptRef: DecisionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDecisionHint: string | null;
  decisionStatus: VoxyRenderReviewDecisionGateStatus;
  decisionStatusLabel: string;
  reviewGates: VoxyRenderPreflightReviewItem[];
  decisionOptions: VoxyRenderReviewDecisionOption[];
  recommendedDecision: {
    id: VoxyRenderReviewDecisionOptionId;
    label: string;
    reviewerVisibleReason: string;
    userVisibleReason: string;
  };
  blockedReasons: string[];
  decisionResultPreview: VoxyRenderReviewDecisionResultPreview;
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  noRuntimeClaim: true;
};

type BuildModelInput = {
  surface: DecisionSurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  contributionRef?: DecisionRef | null;
  dossierRef?: DecisionRef | null;
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

function sanitizeIdFragment(value: string): string {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

function decisionStatusLabel(value: VoxyRenderReviewDecisionGateStatus): string {
  if (value === "decision_preview") return "Review-Entscheidung als Vorschau";
  if (value === "needs_script_review") return "Script-Review zuerst";
  if (value === "needs_source_review") return "Quellenprüfung zuerst";
  if (value === "needs_factcheck_review") return "Factcheck zuerst";
  if (value === "needs_language_review") return "Sprach- und Untertitelreview zuerst";
  if (value === "needs_asset_decision") return "Asset-Entscheidung offen";
  if (value === "needs_provider_decision") return "Provider-Entscheidung offen";
  if (value === "needs_cost_decision") return "Kosten- und Credit-Entscheidung offen";
  if (value === "needs_brand_review") return "Brand-Review offen";
  if (value === "needs_persistence") return "Entscheidung braucht Persistenz";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  if (value === "blocked") return "Renderpfad blockiert";
  if (value === "keep_as_script_only") return "Vorerst Script-only halten";
  return "Nur Readmodel";
}

function decisionOptionLabel(value: VoxyRenderReviewDecisionOptionId): string {
  if (value === "review_script") return "Script prüfen";
  if (value === "request_sources") return "Quellen nachfordern";
  if (value === "review_factcheck") return "Factcheck prüfen";
  if (value === "review_language") return "Sprache und Untertitel prüfen";
  if (value === "prepare_assets") return "Assets vorbereiten";
  if (value === "configure_provider") return "Provider konfigurieren";
  if (value === "define_cost_policy") return "Cost-Policy klären";
  if (value === "check_credits") return "Credits und Limits prüfen";
  if (value === "keep_as_script_only") return "Bewusst bei Script-only bleiben";
  return "Renderpfad blockieren";
}

function resultKindLabel(value: VoxyRenderReviewDecisionResultKind): string {
  if (value === "decision_needed") return "Entscheidung nötig";
  if (value === "blocked_preview") return "Blocker-Vorschau";
  if (value === "keep_script_only_preview") return "Script-only-Vorschau";
  return "Noch nicht entschieden";
}

function buildLanguageLabel(input: {
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
}) {
  const parts = [
    `Quelle: ${languageName(input.sourceLanguage)}`,
    `Lesefassung: ${languageName(input.readingLanguage)}`,
    `Script: ${languageName(input.scriptLanguage)}`,
    `Render-Ziel: ${languageName(input.renderLanguage)}`,
  ];
  if (input.subtitleLanguage) {
    parts.push(`Untertitel: ${languageName(input.subtitleLanguage)}`);
  }
  return parts.join(" · ");
}

function hasScriptRisk(
  scriptModel: VoxyBriefingScriptCandidateModel | null,
  risk: VoxyBriefingScriptRisk,
) {
  return scriptModel?.scriptRisks.some((item) => item.id === risk) ?? false;
}

function hasScriptReadinessSignal(
  scriptModel: VoxyBriefingScriptCandidateModel | null,
  signal: string,
) {
  return scriptModel?.readinessSignals.some((item) => item.id === signal) ?? false;
}

function reviewGateLabel(id: VoxyRenderPreflightReviewKey): string {
  if (id === "scriptReview") return "Script-Review";
  if (id === "sourceReview") return "Quellenreview";
  if (id === "factcheckReview") return "Factcheck-Review";
  if (id === "languageReview") return "Sprach- und Untertitelreview";
  if (id === "brandReview") return "Brand-Review";
  if (id === "assetReview") return "Asset-Review";
  if (id === "providerReview") return "Provider-Review";
  if (id === "costReview") return "Cost- und Credit-Review";
  return "Publishing-Review";
}

function reviewGateReason(id: VoxyRenderPreflightReviewKey): string {
  if (id === "scriptReview") return "Ohne explizites Script-Review bleibt alles weitere nur Vorschau.";
  if (id === "sourceReview") return "Quellenlage und Evidenz müssen vor jedem späteren Video menschlich geprüft bleiben.";
  if (id === "factcheckReview") return "Offene Factcheck-Fragen verhindern jeden Render-Fortschritt.";
  if (id === "languageReview") return "Sprach- und Untertitelentscheidungen bleiben ein eigener menschlicher Schritt.";
  if (id === "brandReview") return "Brand-, Ton- und Kontextprüfung bleibt review-first.";
  if (id === "assetReview") return "Asset-Vollständigkeit darf nicht still angenommen werden.";
  if (id === "providerReview") return "Provider-Anschluss bleibt ungeprüft und wird hier nicht ausgeführt.";
  if (id === "costReview") return "Credits, Limits und Cost-Policy brauchen eine echte Freigabe.";
  return "Publishing bleibt separat und wird hier bewusst nicht vorbereitet.";
}

function buildFallbackReviewGates(
  scriptModel: VoxyBriefingScriptCandidateModel | null,
  handoffModel: VoxyRenderProviderHandoffModel | null,
  preflightModel: VoxyRenderPreflightReadinessModel | null,
): VoxyRenderPreflightReviewItem[] {
  const scriptReviewNeeded =
    scriptModel?.scriptStatus !== "script_preview" ||
    handoffModel?.reviewGates.some((item) => item.id === "script_review" && item.status !== "approved");
  const sourceReviewNeeded =
    scriptModel?.scriptStatus === "needs_source_review" ||
    hasScriptReadinessSignal(scriptModel, "source_review_needed");
  const factcheckNeeded =
    scriptModel?.scriptStatus === "needs_factcheck_review" ||
    hasScriptReadinessSignal(scriptModel, "factcheck_needed");
  const languageReviewNeeded =
    scriptModel?.scriptStatus === "needs_translation_review" ||
    hasScriptReadinessSignal(scriptModel, "multilingual_review_needed");
  const providerReviewNeeded =
    handoffModel?.handoffStatus === "blocked_by_provider" ||
    handoffModel?.handoffStatus === "blocked_by_secret";

  const reviewGateIds: VoxyRenderPreflightReviewKey[] = [
    "scriptReview",
    "sourceReview",
    "factcheckReview",
    "languageReview",
    "brandReview",
    "assetReview",
    "providerReview",
    "costReview",
    "publishingReview",
  ];

  return reviewGateIds.map((id) => {
    const status =
      id === "scriptReview"
        ? scriptReviewNeeded
          ? "needs_review"
          : "ready"
        : id === "sourceReview"
          ? sourceReviewNeeded
            ? "needs_review"
            : "ready"
          : id === "factcheckReview"
            ? factcheckNeeded
              ? "needs_review"
              : "ready"
            : id === "languageReview"
              ? languageReviewNeeded
                ? "needs_review"
                : "ready"
              : id === "providerReview"
                ? providerReviewNeeded
                  ? "blocked"
                  : "needs_review"
                : preflightModel
                  ? "needs_review"
                  : "blocked";
    return {
      id,
      label: reviewGateLabel(id),
      status,
      statusLabel:
        status === "ready" ? "Vorbereitet" : status === "needs_review" ? "Review offen" : "Blockiert",
      reason: reviewGateReason(id),
      reviewRequired: true as const,
    };
  });
}

function buildBlockedReasons(input: {
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  reviewGates: VoxyRenderPreflightReviewItem[];
  needsPersistence: boolean;
}) {
  return uniqueStrings([
    ...(input.handoffModel?.blockers ?? []),
    ...(input.preflightModel?.blockers ?? []),
    ...(input.registryModel?.blockers ?? []),
    ...(input.adapterModel?.blockedReasons ?? []),
    ...input.reviewGates
      .filter((item) => item.status !== "ready")
      .map((item) => `${item.label}: ${item.reason}`),
    input.needsPersistence
      ? "Es gibt noch keinen persistierten Review-Write für echte Render-Entscheidungen. Dieser Layer bleibt nur Entscheidungs-Vorschau."
      : null,
  ]);
}

function buildRecommendedDecision(
  options: VoxyRenderReviewDecisionOption[],
  preferKeepAsScriptOnly = false,
): VoxyRenderReviewDecisionOption {
  if (preferKeepAsScriptOnly) {
    const keepAsScriptOnly = options.find((item) => item.id === "keep_as_script_only" && item.enabled);
    if (keepAsScriptOnly) return keepAsScriptOnly;
  }
  return (
    options.find((item) => item.enabled) ?? {
      id: "block_render_path",
      label: decisionOptionLabel("block_render_path"),
      reviewerVisibleReason:
        "Ohne belastbare Review-, Runtime- oder Persistenzwahrheit darf kein Renderpfad weiter als Entscheidungsvorschau gelesen werden.",
      userVisibleReason:
        "Der Renderpfad bleibt blockiert, bis ein Mensch die offenen Review- und Wahrheitslücken geklärt hat.",
      enabled: true,
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    }
  );
}

function buildModelFromInput(input: BuildModelInput): VoxyRenderReviewDecisionGateModel | null {
  if (
    !input.scriptModel &&
    !input.handoffModel &&
    !input.preflightModel &&
    !input.registryModel &&
    !input.adapterModel
  ) {
    return null;
  }

  const sourceLanguage =
    input.preflightModel?.sourceLanguage ??
    input.adapterModel?.sourceLanguage ??
    input.handoffModel?.sourceLanguage ??
    input.scriptModel?.sourceLanguage ??
    "de";
  const readingLanguage =
    input.preflightModel?.readingLanguage ??
    input.adapterModel?.readingLanguage ??
    input.handoffModel?.readingLanguage ??
    input.scriptModel?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    input.preflightModel?.scriptLanguage ??
    input.adapterModel?.scriptLanguage ??
    input.handoffModel?.scriptLanguage ??
    input.scriptModel?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    input.preflightModel?.renderLanguage ??
    input.adapterModel?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    input.preflightModel?.subtitleLanguage ?? input.adapterModel?.subtitleLanguage ?? null;

  const reviewGates =
    input.preflightModel?.reviewReadiness ?? buildFallbackReviewGates(input.scriptModel, input.handoffModel, input.preflightModel);
  const getGate = (id: VoxyRenderPreflightReviewKey) => reviewGates.find((item) => item.id === id) ?? null;

  const scriptReviewNeeded =
    getGate("scriptReview")?.status === "needs_review" ||
    input.scriptModel?.scriptStatus === "needs_editorial_review" ||
    input.scriptModel?.scriptStatus === "needs_human_input" ||
    input.scriptModel?.scriptStatus === "needs_compliance_review" ||
    input.scriptModel?.scriptStatus === "blocked_by_missing_review";
  const sourceReviewNeeded =
    getGate("sourceReview")?.status === "needs_review" ||
    input.scriptModel?.scriptStatus === "needs_source_review" ||
    hasScriptReadinessSignal(input.scriptModel, "source_review_needed");
  const factcheckReviewNeeded =
    getGate("factcheckReview")?.status === "needs_review" ||
    input.scriptModel?.scriptStatus === "needs_factcheck_review" ||
    hasScriptReadinessSignal(input.scriptModel, "factcheck_needed");
  const languageReviewNeeded =
    getGate("languageReview")?.status === "needs_review" ||
    input.scriptModel?.scriptStatus === "needs_translation_review" ||
    hasScriptReadinessSignal(input.scriptModel, "multilingual_review_needed") ||
    sourceLanguage !== readingLanguage ||
    scriptLanguage !== renderLanguage ||
    Boolean(subtitleLanguage && subtitleLanguage !== renderLanguage);
  const brandReviewNeeded = getGate("brandReview")?.status === "needs_review";
  const assetDecisionNeeded =
    getGate("assetReview")?.status === "needs_review" ||
    input.preflightModel?.requiredAssets.some((item) => item.status !== "available") ||
    input.registryModel?.assetInventory.some(
      (item) => item.status === "missing" || item.status === "needs_review" || item.status === "blocked",
    ) ||
    false;
  const providerDecisionNeeded =
    getGate("providerReview")?.status === "needs_review" ||
    input.preflightModel?.providerSelectionStatus === "none_configured" ||
    input.preflightModel?.providerSelectionStatus === "candidate_needed" ||
    input.preflightModel?.providerSelectionStatus === "adapter_needed" ||
    input.preflightModel?.providerSelectionStatus === "configuration_needed" ||
    input.registryModel?.providerRegistry.some((item) => item.status !== "requirement_only") ||
    input.adapterModel?.providerGateItems.some((item) => item.status !== "ready") ||
    false;
  const costDecisionNeeded =
    getGate("costReview")?.status === "needs_review" ||
    input.preflightModel?.costStatus === "estimate_needed" ||
    input.preflightModel?.costStatus === "credit_policy_needed" ||
    input.preflightModel?.costStatus === "limit_check_needed" ||
    input.adapterModel?.costGateItems.some((item) => item.id === "cost_policy" && item.status !== "ready") ||
    false;
  const creditDecisionNeeded =
    input.preflightModel?.costStatus === "credit_policy_needed" ||
    input.preflightModel?.costStatus === "limit_check_needed" ||
    input.adapterModel?.costGateItems.some(
      (item) =>
        (item.id === "credit_policy" || item.id === "usage_limit_policy") &&
        item.status !== "ready",
    ) ||
    false;

  const runtimeTruthBlocked =
    input.scriptModel?.scriptStatus === "blocked_by_runtime_truth" ||
    input.handoffModel?.handoffStatus === "blocked_by_runtime_truth" ||
    input.preflightModel?.preflightStatus === "blocked_by_runtime_truth" ||
    input.registryModel?.registryStatus === "blocked_by_runtime_truth" ||
    input.adapterModel?.adapterStatus === "blocked_by_runtime_truth" ||
    false;
  const hardBlocked =
    input.handoffModel?.handoffStatus === "blocked_by_provider" ||
    input.handoffModel?.handoffStatus === "blocked_by_secret" ||
    input.preflightModel?.providerSelectionStatus === "blocked" ||
    input.preflightModel?.assetStatus === "blocked" ||
    input.preflightModel?.costStatus === "blocked_by_missing_runtime" ||
    input.preflightModel?.costStatus === "blocked_by_missing_account_context" ||
    input.registryModel?.providerRegistry.some((item) => item.status === "blocked") ||
    input.registryModel?.assetInventory.some((item) => item.status === "blocked") ||
    false;
  const highRisk =
    (input.scriptModel?.scriptRisks.length ?? 0) >= 4 ||
    input.scriptModel?.scriptStatus === "needs_compliance_review" ||
    hasScriptRisk(input.scriptModel, "legal_policy_sensitivity") ||
    hasScriptRisk(input.scriptModel, "vulnerable_group_impact") ||
    hasScriptRisk(input.scriptModel, "public_misinterpretation_risk") ||
    hasScriptRisk(input.scriptModel, "overclaiming_risk");
  const keepAsScriptOnlyEnabled =
    input.preflightModel?.preflightStatus === "keep_as_script_only" ||
    input.registryModel?.registryDecision.id === "keep_as_script_only" ||
    input.adapterModel?.adapterStatus === "keep_as_script_only" ||
    input.adapterModel?.noopResult.nextAdapterDecision.id === "keep_as_script_only" ||
    highRisk ||
    false;
  const needsPersistence = input.surface === "admin" || input.surface === "workspace";
  const rtlDecisionHint =
    input.preflightModel?.rtlPreflightHint ??
    (input.scriptModel?.rtlDisplayHint
      ? "RTL- oder cross-lingualer Fall: Untertitel, Leserichtung und Overlays müssen bewusst separat geprüft werden."
      : null);

  const providerReason = uniqueStrings([
    getGate("providerReview")?.reason,
    input.preflightModel?.providerSelectionStatusLabel
      ? `${input.preflightModel.providerSelectionStatusLabel}: Anforderungen sind sichtbar, aber kein Provider wird ausgeführt.`
      : null,
    input.registryModel?.providerRegistry.find((item) => item.status !== "missing")?.reviewerVisibleReason ??
      input.registryModel?.providerRegistry[0]?.reviewerVisibleReason,
    input.adapterModel?.providerGateItems.find((item) => item.status !== "ready")?.reason,
    "Provider-Vorbereitung bleibt eine menschliche Konfigurationsentscheidung und startet nichts.",
  ]).join(" ");
  const assetReason = uniqueStrings([
    getGate("assetReview")?.reason,
    input.preflightModel?.requiredAssets.find((item) => item.status !== "available")?.reason,
    input.registryModel?.assetInventory.find((item) => item.status !== "available")?.reviewerVisibleReason,
    "Assets werden hier weder erzeugt noch gefakt.",
  ]).join(" ");
  const costReason = uniqueStrings([
    getGate("costReview")?.reason,
    input.preflightModel?.costStatusLabel
      ? `${input.preflightModel.costStatusLabel}: keine Buchung, keine Preisbehauptung.`
      : null,
    input.adapterModel?.costGateItems.find((item) => item.status !== "ready")?.reason,
    "Cost-Policy, Credits und Limits bleiben eine bewusste Review-Entscheidung.",
  ]).join(" ");
  const languageReason = uniqueStrings([
    getGate("languageReview")?.reason,
    rtlDecisionHint,
    languageReviewNeeded
      ? "Original, Lesefassung, Script und Render-Zielsprache bleiben getrennt; Übersetzung ist kein Beleg."
      : null,
  ]).join(" ");
  const scriptReason = uniqueStrings([
    getGate("scriptReview")?.reason,
    input.scriptModel?.reviewerVisibleReason,
    "Ohne Script-Review bleibt jeder spätere Renderpfad ausdrücklich gesperrt.",
  ]).join(" ");
  const sourceReason = uniqueStrings([
    getGate("sourceReview")?.reason,
    input.scriptModel?.readinessSignals.find((item) => item.id === "source_review_needed")?.reason,
    "Quellen müssen vor jedem späteren Video nachvollziehbar geprüft werden.",
  ]).join(" ");
  const factcheckReason = uniqueStrings([
    getGate("factcheckReview")?.reason,
    input.scriptModel?.readinessSignals.find((item) => item.id === "factcheck_needed")?.reason,
    "Offene Factcheck-Fragen verhindern jede weitere Render-Interpretation.",
  ]).join(" ");
  const keepScriptOnlyReason = uniqueStrings([
    getGate("brandReview")?.reason,
    input.scriptModel?.scriptRisks.slice(0, 2).map((item) => `${item.label}: ${item.reason}`).join(" "),
    "Bei hohem Risiko darf der Arbeitsstand bewusst Script-only bleiben.",
  ]).join(" ");
  const blockReason = uniqueStrings([
    runtimeTruthBlocked
      ? "Runtime-Wahrheit für einen belastbaren Review- oder Providerpfad fehlt weiterhin."
      : null,
    hardBlocked
      ? "Mindestens ein Provider-, Asset- oder Cost-Gate ist aktuell blockiert."
      : null,
    needsPersistence
      ? "Echte Render-Entscheidungen haben noch keinen Persistenzpfad; deshalb bleibt alles nur Vorschau."
      : null,
    "`review_decision` ist nicht `execution` und erzeugt keinen Render-Job.",
  ]).join(" ");

  const decisionOptions: VoxyRenderReviewDecisionOption[] = [
    {
      id: "review_script",
      label: decisionOptionLabel("review_script"),
      reviewerVisibleReason: scriptReason,
      userVisibleReason:
        "Bevor überhaupt an ein Video gedacht wird, muss ein Mensch das Script als Arbeitsstand prüfen.",
      enabled: Boolean(scriptReviewNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "request_sources",
      label: decisionOptionLabel("request_sources"),
      reviewerVisibleReason: sourceReason,
      userVisibleReason:
        "Es fehlen belastbare Quellen oder Evidenzhinweise. Darum bleibt alles weiter nur Script und Vorschau.",
      enabled: Boolean(sourceReviewNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "review_factcheck",
      label: decisionOptionLabel("review_factcheck"),
      reviewerVisibleReason: factcheckReason,
      userVisibleReason:
        "Offene Factcheck-Fragen müssen geklärt werden, bevor irgendein Video verantwortbar wäre.",
      enabled: Boolean(factcheckReviewNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "review_language",
      label: decisionOptionLabel("review_language"),
      reviewerVisibleReason: languageReason,
      userVisibleReason:
        "Sprachfassung, Untertitel und Leserichtung brauchen eigenes Review. Übersetzung bleibt nur Lesehilfe.",
      enabled: Boolean(languageReviewNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "prepare_assets",
      label: decisionOptionLabel("prepare_assets"),
      reviewerVisibleReason: uniqueStrings([
        assetReason,
        brandReviewNeeded ? "Brand-Review ist noch offen und hängt an denselben Asset-Gates." : null,
      ]).join(" "),
      userVisibleReason:
        "Für ein späteres Video fehlen noch vorbereitete Assets oder deren Prüfung.",
      enabled: Boolean(assetDecisionNeeded || brandReviewNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "configure_provider",
      label: decisionOptionLabel("configure_provider"),
      reviewerVisibleReason: providerReason,
      userVisibleReason:
        "Es gibt noch keinen freigegebenen Providerpfad. Darum wird nichts gerendert und niemand wird aufgerufen.",
      enabled: Boolean(providerDecisionNeeded && !runtimeTruthBlocked),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "define_cost_policy",
      label: decisionOptionLabel("define_cost_policy"),
      reviewerVisibleReason: costReason,
      userVisibleReason:
        "Kosten-, Credit- und Nutzungsfragen sind nicht geklärt. Deshalb wird nichts gestartet oder gebucht.",
      enabled: Boolean(costDecisionNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "check_credits",
      label: decisionOptionLabel("check_credits"),
      reviewerVisibleReason: costReason,
      userVisibleReason:
        "Auch Credit- oder Limit-Prüfung bleibt eine menschliche Entscheidung, keine automatische Buchung.",
      enabled: Boolean(creditDecisionNeeded),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "keep_as_script_only",
      label: decisionOptionLabel("keep_as_script_only"),
      reviewerVisibleReason: keepScriptOnlyReason,
      userVisibleReason:
        "Dieser Stand kann bewusst beim Script bleiben, wenn Risiko, Sprache oder Quellenlage ein Video nicht tragen.",
      enabled: Boolean(keepAsScriptOnlyEnabled),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
    {
      id: "block_render_path",
      label: decisionOptionLabel("block_render_path"),
      reviewerVisibleReason: blockReason,
      userVisibleReason:
        "Solange Review-, Runtime- oder Kostenwahrheit fehlen, bleibt der Renderpfad bewusst blockiert.",
      enabled: Boolean(runtimeTruthBlocked || hardBlocked || needsPersistence),
      executionAllowed: false,
      requiresHumanReview: true,
      createsRenderJob: false,
      callsProvider: false,
      createsMedia: false,
      debitsCost: false,
      publishes: false,
    },
  ];

  const recommendedDecision = buildRecommendedDecision(decisionOptions, Boolean(keepAsScriptOnlyEnabled));
  const decisionStatus: VoxyRenderReviewDecisionGateStatus =
    runtimeTruthBlocked
      ? "blocked_by_runtime_truth"
      : keepAsScriptOnlyEnabled && recommendedDecision.id === "keep_as_script_only"
        ? "keep_as_script_only"
        : scriptReviewNeeded
          ? "needs_script_review"
          : sourceReviewNeeded
            ? "needs_source_review"
            : factcheckReviewNeeded
              ? "needs_factcheck_review"
              : languageReviewNeeded
                ? "needs_language_review"
                : brandReviewNeeded
                  ? "needs_brand_review"
                  : assetDecisionNeeded
                    ? "needs_asset_decision"
                    : providerDecisionNeeded
                      ? "needs_provider_decision"
                      : costDecisionNeeded || creditDecisionNeeded
                        ? "needs_cost_decision"
                        : hardBlocked
                          ? "blocked"
                          : needsPersistence
                            ? "needs_persistence"
                            : input.surface === "create" || input.surface === "account"
                              ? "decision_preview"
                              : "readmodel_only";
  const blockedReasons = buildBlockedReasons({
    handoffModel: input.handoffModel,
    preflightModel: input.preflightModel,
    registryModel: input.registryModel,
    adapterModel: input.adapterModel,
    reviewGates,
    needsPersistence,
  });

  const decisionGateIdSeed =
    input.handoffModel?.contributionRef?.id ??
    input.handoffModel?.dossierRef?.id ??
    input.adapterModel?.requestPreview.adapterRequestId ??
    input.contributionRef?.id ??
    input.dossierRef?.id ??
    input.scriptModel?.title ??
    "preview";

  const resultKind: VoxyRenderReviewDecisionResultKind =
    decisionStatus === "blocked_by_runtime_truth" || decisionStatus === "blocked"
      ? "blocked_preview"
      : decisionStatus === "keep_as_script_only"
        ? "keep_script_only_preview"
        : decisionOptions.some((item) => item.enabled)
          ? "decision_needed"
          : "not_decided";

  const handoffRef =
    input.handoffModel?.contributionRef ?? input.handoffModel?.dossierRef ?? input.contributionRef ?? null;
  const preflightRef =
    input.preflightModel?.handoffRef
      ? {
          id: input.preflightModel.handoffRef.id,
          title: input.preflightModel.title,
          href: input.preflightModel.handoffRef.href ?? null,
        }
      : handoffRef
        ? {
            id: `preflight:${handoffRef.id}`,
            title: input.preflightModel?.title ?? "Render-Preflight",
            href: handoffRef.href ?? null,
          }
        : null;
  const registryRef =
    input.registryModel
      ? {
          id: `registry:${sanitizeIdFragment(input.registryModel.title)}`,
          title: input.registryModel.title,
          href: input.registryModel.contributionRef?.href ?? input.registryModel.dossierRef?.href ?? null,
        }
      : null;
  const adapterRef =
    input.adapterModel
      ? {
          id: input.adapterModel.requestPreview.adapterRequestId,
          title: input.adapterModel.title,
          href: input.adapterModel.contributionRef?.href ?? input.adapterModel.dossierRef?.href ?? null,
        }
      : null;
  const scriptRef =
    input.scriptModel
      ? {
          id: `script:${sanitizeIdFragment(input.scriptModel.title)}`,
          title: input.scriptModel.title,
          href: input.scriptModel.contributionRef?.href ?? input.scriptModel.dossierRef?.href ?? null,
        }
      : null;

  return {
    title: "Render-Entscheidung",
    summary:
      "Gemeinsame review-first Entscheidungslesart über Script, Handoff, Preflight, Registry und Adapter. Sie erklärt nur, was ein Mensch als Nächstes prüfen müsste.",
    surface: input.surface,
    decisionGateId: `voxy-render-review-decision-gate:${sanitizeIdFragment(decisionGateIdSeed)}`,
    contributionRef: input.contributionRef ?? input.scriptModel?.contributionRef ?? input.handoffModel?.contributionRef ?? null,
    dossierRef: input.dossierRef ?? input.scriptModel?.dossierRef ?? input.handoffModel?.dossierRef ?? null,
    handoffRef,
    preflightRef,
    registryRef,
    adapterRef,
    scriptRef,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    languageLabel: buildLanguageLabel({
      sourceLanguage,
      readingLanguage,
      scriptLanguage,
      renderLanguage,
      subtitleLanguage,
    }),
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDecisionHint,
    decisionStatus,
    decisionStatusLabel: decisionStatusLabel(decisionStatus),
    reviewGates,
    decisionOptions,
    recommendedDecision: {
      id: recommendedDecision.id,
      label: recommendedDecision.label,
      reviewerVisibleReason: recommendedDecision.reviewerVisibleReason,
      userVisibleReason: recommendedDecision.userVisibleReason,
    },
    blockedReasons,
    decisionResultPreview: {
      resultKind,
      resultKindLabel: resultKindLabel(resultKind),
      noRenderAction: true,
      noProviderExecution: true,
      noMediaCreation: true,
      noCostDebit: true,
      noPublishAction: true,
      noRuntimeClaim: true,
    },
    publicSafeLabel: "Keine Ausführung",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    noRuntimeClaim: true,
  };
}

export function buildVoxyRenderReviewDecisionGateFromReadmodels(params: {
  surface: DecisionSurface;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  handoffModel: VoxyRenderProviderHandoffModel | null;
  preflightModel: VoxyRenderPreflightReadinessModel | null;
  registryModel: VoxyRenderAssetProviderRegistryModel | null;
  adapterModel: VoxyRenderAdapterNoopModel | null;
  contributionRef?: DecisionRef | null;
  dossierRef?: DecisionRef | null;
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
    adapterModel: params.adapterModel,
    contributionRef: params.contributionRef ?? null,
    dossierRef: params.dossierRef ?? null,
    userVisibleReason:
      params.userVisibleReason ??
      "Hier wird nur sichtbar, was vor einem späteren Voxy-Video noch menschlich geprüft werden müsste. Nichts wird ausgeführt.",
    reviewerVisibleReason:
      params.reviewerVisibleReason ??
      "Der Layer bündelt Handoff, Preflight, Registry und Adapter zu einer review-first Entscheidungslesart ohne Persistenz-Write oder Execution.",
    nextStep: params.nextStep ?? "Render-Entscheidung prüfen",
  });
}

export function buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);
  const handoffModel = buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const preflightModel = buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model);
  const registryModel = buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model);
  const adapterModel = buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model);

  return buildVoxyRenderReviewDecisionGateFromReadmodels({
    surface: "create",
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    contributionRef: scriptModel?.contributionRef ?? handoffModel?.contributionRef ?? null,
    dossierRef: scriptModel?.dossierRef ?? handoffModel?.dossierRef ?? null,
    userVisibleReason:
      "In /create bleibt diese Render-Entscheidung eine reine Vorschau auf offene Reviews. Es entstehen weder Video noch Providerlauf.",
    reviewerVisibleReason:
      "Create zeigt nur die nächste Review-Entscheidung über bestehende Readmodels. Keine Persistenz, keine Queue, keine Ausführung.",
    nextStep: "Render-Entscheidung im Preview prüfen",
  });
}

export function buildVoxyRenderReviewDecisionGateFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: DecisionRef | null;
    dossierRef?: DecisionRef | null;
    outputRef?: DecisionRef | null;
    nextStep?: string;
  },
) {
  const contributionRef = options?.contributionRef ?? dialog?.contributionRef ?? null;
  const scriptModel = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
    contributionRef,
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });
  const handoffModel = buildVoxyRenderProviderHandoffFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });
  const preflightModel = buildVoxyRenderPreflightReadinessFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });
  const registryModel = buildVoxyRenderAssetProviderRegistryFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });
  const adapterModel = buildVoxyRenderAdapterNoopFromVoxyDialog(dialog, {
    contributionRef,
    outputRef: options?.outputRef ?? null,
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });

  return buildVoxyRenderReviewDecisionGateFromReadmodels({
    surface: "account",
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    contributionRef,
    dossierRef: options?.dossierRef ?? null,
    userVisibleReason:
      "Im Account erklärt dieser Layer nur, welche Review-Entscheidung noch fehlt, bevor aus einem Script irgendwann ein Video werden dürfte.",
    reviewerVisibleReason:
      "Resume- und Local-Draft-Kontext bleiben readmodel-only. Keine Entscheidung wird persistiert oder ausgeführt.",
    nextStep: options?.nextStep ?? "Render-Entscheidung prüfen",
  });
}

export function buildVoxyRenderReviewDecisionGateFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: DecisionRef | null;
    dossierRef?: DecisionRef | null;
    outputRef?: DecisionRef | null;
  },
) {
  const surface: Extract<DecisionSurface, "admin" | "workspace"> =
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
  const adapterModel = buildVoxyRenderAdapterNoopFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });

  return buildVoxyRenderReviewDecisionGateFromReadmodels({
    surface,
    scriptModel,
    handoffModel,
    preflightModel,
    registryModel,
    adapterModel,
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    userVisibleReason:
      options?.audience === "admin"
        ? "Admin sieht hier nur die nächste review-first Entscheidung. Kein Provider wird angerufen, keine Kosten werden gebucht und nichts wird veröffentlicht."
        : "Im Studio bleibt diese Render-Entscheidung ein ehrlicher Review-Layer neben Handoff, Preflight, Registry und Adapter.",
    reviewerVisibleReason:
      options?.audience === "admin"
        ? "Für echte Render-Entscheidungen fehlt noch Persistenz. Diese Admin-Sicht bündelt deshalb nur die offenen Review-Gates."
        : "Das Studio zeigt dieselbe Entscheidungslesart read-only und ohne neue Runtime-Wahrheit.",
    nextStep:
      options?.audience === "admin"
        ? "Render-Entscheidung im Review prüfen"
        : "Render-Entscheidung im Studio prüfen",
  });
}
