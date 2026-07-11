import type {
  VoxyRenderPreviewReviewDecisionRecord,
  VoxyRenderPreviewReviewDecisionStatus,
  VoxyRenderPreviewReviewDecisionType,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import type {
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStatus,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
  VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import type {
  VoxyRenderReviewDecisionGateModel,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderRuntimeEnablementBacklogRecord,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type {
  VoxyRenderRuntimeGoNogoMatrixRecord,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES = [
  "preview_outcome_handoff_only",
  "noop_downstream_handoff",
  "review_context_only",
  "revision_backlog_candidate",
  "downstream_blocked",
  "review_ready_only",
  "script_only_pause",
  "blocked_by_missing_preview_review_decision",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderPreviewOutcomeHandoffStatus =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES = [
  "comment_only",
  "request_revision",
  "reject_preview",
  "mark_review_ready",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewOutcomeHandoffType =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TYPES)[number];

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TARGETS = [
  "review_context",
  "script_revision",
  "asset_revision",
  "runtime_enablement_backlog",
  "publish_guard",
  "blocked_downstream",
  "script_only_archive",
  "none",
] as const;

export type VoxyRenderPreviewOutcomeHandoffTarget =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_TARGETS)[number];

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_NEXT_STEPS = [
  "keep_review_context",
  "prepare_script_revision",
  "prepare_asset_revision",
  "update_runtime_enablement_backlog",
  "keep_downstream_blocked",
  "keep_review_ready_only",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewOutcomeHandoffNextStep =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_NEXT_STEPS)[number];

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderPreviewOutcomeHandoffStoreResultStatus =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderPreviewOutcomeHandoffPersistenceMode =
  (typeof VOXY_RENDER_PREVIEW_OUTCOME_HANDOFF_PERSISTENCE_MODES)[number];

type OutcomeHandoffRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderPreviewOutcomeHandoffPayload = {
  reviewerComment: string | null;
  revisionReason: string | null;
  rejectionReason: string | null;
  reviewReadyReason: string | null;
  checklistSummary: string | null;
  languageNotes: string | null;
  claimSafetyNotes: string | null;
  assetNotes: string | null;
  runtimeNotes: string | null;
  downstreamNotes: string | null;
};

export type VoxyRenderPreviewOutcomeHandoffEffects = {
  createsScriptRevisionTask: boolean;
  createsAssetRevisionTask: boolean;
  createsRuntimeBacklogTask: boolean;
  blocksDownstream: boolean;
  marksReviewReadyOnly: boolean;
  pausesVideoFlow: boolean;
  createsRenderJob: false;
  triggersRerender: false;
  triggersProvider: false;
  createsQueueJob: false;
  createsMediaFile: false;
  createsUpload: false;
  triggersPublish: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPreviewOutcomeHandoffExecutionFlags = {
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  previewFileAvailable: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPreviewOutcomeHandoffCommand = {
  outcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  renderDecisionId?: string | null;
  scriptRef?: OutcomeHandoffRef | null;
  contributionRef?: OutcomeHandoffRef | null;
  dossierRef?: OutcomeHandoffRef | null;
  reviewerRef?: OutcomeHandoffRef | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  handoffStatus: VoxyRenderPreviewOutcomeHandoffStatus;
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffTarget;
  handoffPayload: VoxyRenderPreviewOutcomeHandoffPayload;
  handoffEffects: VoxyRenderPreviewOutcomeHandoffEffects;
  executionFlags: VoxyRenderPreviewOutcomeHandoffExecutionFlags;
  nextStep: VoxyRenderPreviewOutcomeHandoffNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  previewReviewDecisionTypeHint?: VoxyRenderPreviewReviewDecisionType | null;
  previewReviewDecisionStatusHint?: VoxyRenderPreviewReviewDecisionStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderPreviewOutcomeHandoffRecord =
  VoxyRenderPreviewOutcomeHandoffCommand & {
    outcomeHandoffId: string;
    persistedAt: string | null;
    persistedBy: string | null;
    idempotencyKey: string | null;
    previousOutcomeHandoffRef: string | null;
    supersedesOutcomeHandoffRef: string | null;
    handoffVersion: number | null;
  };

export type VoxyRenderPreviewOutcomeHandoffStoreResult = {
  ok: boolean;
  status: VoxyRenderPreviewOutcomeHandoffStoreResultStatus;
  record: VoxyRenderPreviewOutcomeHandoffRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderPreviewOutcomeHandoffNextStep;
};

export type VoxyRenderPreviewOutcomeHandoffPersistenceState = {
  mode: VoxyRenderPreviewOutcomeHandoffPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderPreviewOutcomeHandoffRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderPreviewOutcomeHandoffPanelModel = {
  title: string;
  summary: string;
  previewDecisionLabel: string;
  handoffStatusLabel: string;
  downstreamTargetLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  commandPreview: {
    outcomeTypeLabel: string;
    handoffStatusLabel: string;
    downstreamTargetLabel: string;
    createdAt: string | null | undefined;
    previewReviewDecisionRecordId: string | null | undefined;
  };
  latestRecord: {
    outcomeHandoffId: string;
    outcomeTypeLabel: string;
    handoffStatusLabel: string;
    downstreamTargetLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    handoffVersion: number | null;
  } | null;
  mappingLines: string[];
  payloadLines: string[];
  auditLines: string[];
  topBlockers: string[];
  effectLines: string[];
  nextStep: string;
};

type BuildOutcomeHandoffInput = {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: OutcomeHandoffRef | null;
  createdAt?: string | null;
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

function previewDecisionTypeLabel(value: VoxyRenderPreviewOutcomeHandoffType) {
  if (value === "comment_only") return "Kommentar dokumentieren";
  if (value === "request_revision") return "Revision zurückgeben";
  if (value === "reject_preview") return "Preview ablehnen";
  if (value === "mark_review_ready") return "Nur review-ready";
  if (value === "keep_as_script_only") return "Video-Flow pausieren";
  return "Blockiert";
}

export function voxyRenderPreviewOutcomeHandoffStatusLabel(
  value: VoxyRenderPreviewOutcomeHandoffStatus,
) {
  if (value === "preview_outcome_handoff_only") return "Nur Preview-Outcome-Handoff";
  if (value === "noop_downstream_handoff") return "Noop-Downstream-Handoff";
  if (value === "review_context_only") return "Nur Review-Kontext";
  if (value === "revision_backlog_candidate") return "Revision als Backlog-Kandidat";
  if (value === "downstream_blocked") return "Downstream blockiert";
  if (value === "review_ready_only") return "Nur review-ready";
  if (value === "script_only_pause") return "Video-Flow pausiert";
  if (value === "blocked_by_missing_preview_review_decision") {
    return "Ohne Preview-Review-Entscheidung blockiert";
  }
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

export function voxyRenderPreviewOutcomeHandoffTargetLabel(
  value: VoxyRenderPreviewOutcomeHandoffTarget,
) {
  if (value === "review_context") return "Review-Kontext";
  if (value === "script_revision") return "Script-Revision";
  if (value === "asset_revision") return "Asset-Revision";
  if (value === "runtime_enablement_backlog") return "Runtime-Enablement-Backlog";
  if (value === "publish_guard") return "Publish-Guard";
  if (value === "blocked_downstream") return "Downstream blockiert";
  if (value === "script_only_archive") return "Script-only-Archiv";
  return "Kein Downstream-Ziel";
}

export function voxyRenderPreviewOutcomeHandoffNextStepLabel(
  value: VoxyRenderPreviewOutcomeHandoffNextStep,
) {
  if (value === "keep_review_context") return "Review-Kontext beibehalten";
  if (value === "prepare_script_revision") return "Script-Revision vorbereiten";
  if (value === "prepare_asset_revision") return "Asset-Revision vorbereiten";
  if (value === "update_runtime_enablement_backlog") {
    return "Runtime-Enablement-Backlog aktualisieren";
  }
  if (value === "keep_downstream_blocked") return "Downstream blockiert halten";
  if (value === "keep_review_ready_only") return "Nur review-ready halten";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blocker klären";
}

function buildDefaultStoreState(): VoxyRenderPreviewOutcomeHandoffPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Preview-Outcome-Handoff-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Outcome-Handoff-Vorschau. Echte Audit-Persistenz bleibt auf dem server-only Admin-Pfad.",
    repositoryInterface: "VoxyRenderPreviewOutcomeHandoffRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

export function buildVoxyRenderPreviewOutcomeHandoffExecutionFlags(): VoxyRenderPreviewOutcomeHandoffExecutionFlags {
  return {
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderPreviewOutcomeHandoffEffects(input: {
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffTarget;
}): VoxyRenderPreviewOutcomeHandoffEffects {
  return {
    createsScriptRevisionTask: input.downstreamTarget === "script_revision",
    createsAssetRevisionTask: input.downstreamTarget === "asset_revision",
    createsRuntimeBacklogTask: input.downstreamTarget === "runtime_enablement_backlog",
    blocksDownstream:
      input.outcomeType === "reject_preview" || input.downstreamTarget === "blocked_downstream",
    marksReviewReadyOnly: input.outcomeType === "mark_review_ready",
    pausesVideoFlow: input.outcomeType === "keep_as_script_only",
    createsRenderJob: false,
    triggersRerender: false,
    triggersProvider: false,
    createsQueueJob: false,
    createsMediaFile: false,
    createsUpload: false,
    triggersPublish: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function deriveOutcomeType(input: BuildOutcomeHandoffInput): VoxyRenderPreviewOutcomeHandoffType {
  const latestDecision = input.latestPreviewReviewDecisionRecord ?? null;
  if (!latestDecision?.decisionRecordId) return "blocked";
  if (
    latestDecision.decisionStatus === "blocked_by_runtime_truth" ||
    latestDecision.decisionType === "blocked"
  ) {
    return "blocked";
  }
  return latestDecision.decisionType as VoxyRenderPreviewOutcomeHandoffType;
}

function looksLikeAssetRevision(text: string) {
  return /(asset|template|subtitle|untertitel|lower third|lower-third|caption|thumbnail|brand|voice|audio|export)/i.test(
    text,
  );
}

function looksLikeRuntimeRevision(text: string) {
  return /(runtime|provider|queue|worker|secret|cost|credit|upload|publish|scheduling|adapter)/i.test(
    text,
  );
}

function deriveRevisionTarget(input: BuildOutcomeHandoffInput): VoxyRenderPreviewOutcomeHandoffTarget {
  const latestDecision = input.latestPreviewReviewDecisionRecord;
  const decisionPayload = latestDecision?.decisionPayload;
  const textCorpus = uniqueStrings([
    decisionPayload?.revisionReason,
    decisionPayload?.claimSafetyNotes,
    decisionPayload?.brandNotes,
    decisionPayload?.accessibilityNotes,
    decisionPayload?.sourceCaptionNotes,
    ...(decisionPayload?.checklistFindings ?? []),
    ...(input.previewFlow?.topBlockers ?? []),
    ...(input.latestBacklog?.topP0Items ?? []),
    input.latestMatrix?.runtimeGate.reviewerVisibleReason,
    input.latestMatrix?.assetGate.reviewerVisibleReason,
    input.latestRequestDraft?.reviewerNote,
    input.gate?.reviewerVisibleReason,
  ]).join(" · ");

  if (
    input.previewFlow?.previewStatus === "needs_preview_asset" ||
    input.latestMatrix?.assetGate.status === "no_go" ||
    looksLikeAssetRevision(textCorpus)
  ) {
    return "asset_revision";
  }
  if (
    input.previewFlow?.previewStatus === "needs_render_runtime" ||
    input.latestBacklog?.backlogStatus === "blocked_by_runtime_truth" ||
    input.latestMatrix?.runtimeGate.status === "no_go" ||
    looksLikeRuntimeRevision(textCorpus)
  ) {
    return "runtime_enablement_backlog";
  }
  return "script_revision";
}

function deriveDownstreamTarget(
  input: BuildOutcomeHandoffInput,
  outcomeType: VoxyRenderPreviewOutcomeHandoffType,
): VoxyRenderPreviewOutcomeHandoffTarget {
  if (outcomeType === "comment_only") return "review_context";
  if (outcomeType === "request_revision") return deriveRevisionTarget(input);
  if (outcomeType === "reject_preview") return "blocked_downstream";
  if (outcomeType === "mark_review_ready") return "publish_guard";
  if (outcomeType === "keep_as_script_only") return "script_only_archive";
  return "none";
}

export function deriveVoxyRenderPreviewOutcomeHandoffStatus(input: {
  previewReviewDecisionRecordId: string | null;
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  previewReviewDecisionStatus?: VoxyRenderPreviewReviewDecisionStatus | null;
}) {
  if (!input.previewReviewDecisionRecordId) return "blocked_by_missing_preview_review_decision";
  if (
    input.outcomeType === "blocked" ||
    input.previewReviewDecisionStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (input.outcomeType === "comment_only") return "review_context_only";
  if (input.outcomeType === "request_revision") return "revision_backlog_candidate";
  if (input.outcomeType === "reject_preview") return "downstream_blocked";
  if (input.outcomeType === "mark_review_ready") return "review_ready_only";
  if (input.outcomeType === "keep_as_script_only") return "script_only_pause";
  return "preview_outcome_handoff_only";
}

function deriveNextStep(input: {
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffTarget;
}): VoxyRenderPreviewOutcomeHandoffNextStep {
  if (input.outcomeType === "comment_only") return "keep_review_context";
  if (input.outcomeType === "request_revision" && input.downstreamTarget === "script_revision") {
    return "prepare_script_revision";
  }
  if (input.outcomeType === "request_revision" && input.downstreamTarget === "asset_revision") {
    return "prepare_asset_revision";
  }
  if (
    input.outcomeType === "request_revision" &&
    input.downstreamTarget === "runtime_enablement_backlog"
  ) {
    return "update_runtime_enablement_backlog";
  }
  if (input.outcomeType === "reject_preview") return "keep_downstream_blocked";
  if (input.outcomeType === "mark_review_ready") return "keep_review_ready_only";
  if (input.outcomeType === "keep_as_script_only") return "keep_as_script_only";
  return "blocked";
}

function buildPayload(input: BuildOutcomeHandoffInput): VoxyRenderPreviewOutcomeHandoffPayload {
  const decisionPayload = input.latestPreviewReviewDecisionRecord?.decisionPayload;
  return {
    reviewerComment: decisionPayload?.reviewerComment ?? null,
    revisionReason: decisionPayload?.revisionReason ?? null,
    rejectionReason: decisionPayload?.rejectionReason ?? null,
    reviewReadyReason: decisionPayload?.reviewReadyReason ?? null,
    checklistSummary:
      uniqueStrings([
        ...(decisionPayload?.checklistFindings ?? []),
        ...(input.previewFlow?.topBlockers ?? []),
      ]).join(" · ") || null,
    languageNotes:
      uniqueStrings([
        decisionPayload?.languageNotes,
        `Quelle: ${languageName(
          input.previewFlow?.sourceLanguage ??
            input.latestPreviewReviewDecisionRecord?.sourceLanguage ??
            "de",
        )}`,
        `Lesefassung: ${languageName(
          input.previewFlow?.readingLanguage ??
            input.latestPreviewReviewDecisionRecord?.readingLanguage ??
            "de",
        )}`,
        `Script: ${languageName(
          input.previewFlow?.scriptLanguage ??
            input.latestPreviewReviewDecisionRecord?.scriptLanguage ??
            "de",
        )}`,
        `Render-Ziel: ${languageName(
          input.previewFlow?.renderLanguage ??
            input.latestPreviewReviewDecisionRecord?.renderLanguage ??
            "de",
        )}`,
      ]).join(" · ") || null,
    claimSafetyNotes: decisionPayload?.claimSafetyNotes ?? null,
    assetNotes:
      uniqueStrings([
        decisionPayload?.brandNotes,
        decisionPayload?.accessibilityNotes,
        decisionPayload?.sourceCaptionNotes,
      ]).join(" · ") || null,
    runtimeNotes:
      uniqueStrings([
        input.previewFlow?.previewStatus === "needs_render_runtime"
          ? "Runtime fehlt weiterhin; kein Render und kein Re-Render."
          : null,
        input.latestBacklog?.reviewerVisibleSummary,
        input.latestMatrix?.runtimeGate.reviewerVisibleReason,
      ]).join(" · ") || null,
    downstreamNotes: uniqueStrings([
      "Outcome-Handoff ist kein Workflow-Trigger.",
      "Review-ready ist nicht approved, nicht published und nicht render_allowed.",
      "Request revision ist kein Re-Render.",
      "Reject preview löscht keine Medien und publiziert nichts.",
    ]).join(" · "),
  };
}

function buildSummary(input: {
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffTarget;
}) {
  if (input.outcomeType === "comment_only") {
    return {
      userVisibleSummary:
        "Der Kommentar bleibt nur Review-Kontext. Es entstehen kein Render, kein Re-Render und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "Kommentar bleibt audit-only Review-Kontext und führt bewusst in keinen Downstream-Trigger.",
    };
  }
  if (input.outcomeType === "request_revision") {
    return {
      userVisibleSummary:
        "Die Revision wird nur als Backlog-Kandidat weitergereicht. Es startet weder Re-Render noch Providerlauf noch Veröffentlichung.",
      reviewerVisibleSummary: `Revision wird als ${voxyRenderPreviewOutcomeHandoffTargetLabel(
        input.downstreamTarget,
      )} markiert, aber nicht ausgeführt.`,
    };
  }
  if (input.outcomeType === "reject_preview") {
    return {
      userVisibleSummary:
        "Die Preview-Ablehnung blockiert nur downstream. Es entstehen keine Medien, kein Publish und keine Kosten.",
      reviewerVisibleSummary:
        "Reject preview setzt nur einen Downstream-Block und löscht weder Medien noch startet es Publish.",
    };
  }
  if (input.outcomeType === "mark_review_ready") {
    return {
      userVisibleSummary:
        "Review-ready bleibt nur review-ready. Es ist weder Approval noch Publish noch Renderfreigabe.",
      reviewerVisibleSummary:
        "Der Handoff markiert nur review-ready und hält Publish-, Runtime- und Approval-Claims getrennt.",
    };
  }
  if (input.outcomeType === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Video-Flow bleibt pausiert. Der Fall bleibt bewusst Script-only ohne Preview, Render oder Veröffentlichung.",
      reviewerVisibleSummary:
        "Script-only pausiert den Video-Flow und bleibt getrennt von Preview-, Runtime- und Publish-Pfaden.",
    };
  }
  return {
    userVisibleSummary:
      "Ohne persistierte Preview-Review-Entscheidung bleibt der Outcome-Handoff blockiert. Es wird nichts gerendert oder veröffentlicht.",
    reviewerVisibleSummary:
      "Der Outcome-Handoff darf ohne Preview-Review-Entscheidung oder bei fehlender Runtime-Wahrheit keinen downstream Claim ableiten.",
  };
}

function pickFirstRef(
  ...values: Array<OutcomeHandoffRef | null | undefined>
): OutcomeHandoffRef | null {
  return values.find((value) => Boolean(value?.id && value?.title)) ?? null;
}

function buildOutcomeHandoffId(input: {
  previewReviewDecisionRecordId: string | null;
  previewReviewFlowId: string | null;
  outcomeType: VoxyRenderPreviewOutcomeHandoffType;
  downstreamTarget: VoxyRenderPreviewOutcomeHandoffTarget;
}) {
  const seed =
    input.previewReviewDecisionRecordId ??
    input.previewReviewFlowId ??
    `${input.outcomeType}-${input.downstreamTarget}`;
  return `voxy-render-preview-outcome-handoff:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels(
  input: BuildOutcomeHandoffInput,
): VoxyRenderPreviewOutcomeHandoffCommand {
  const outcomeType = deriveOutcomeType(input);
  const downstreamTarget = deriveDownstreamTarget(input, outcomeType);
  const nextStep = deriveNextStep({ outcomeType, downstreamTarget });
  const latestDecision = input.latestPreviewReviewDecisionRecord ?? null;
  const status = deriveVoxyRenderPreviewOutcomeHandoffStatus({
    previewReviewDecisionRecordId: latestDecision?.decisionRecordId ?? null,
    outcomeType,
    previewReviewDecisionStatus: latestDecision?.decisionStatus ?? null,
  });
  const summary = buildSummary({ outcomeType, downstreamTarget });
  const payload = buildPayload(input);
  const scriptRef = pickFirstRef(
    latestDecision?.scriptRef,
    input.previewFlow?.scriptRef,
    input.latestRequestDraft?.scriptRef,
    input.gate?.scriptRef,
  );
  const contributionRef = pickFirstRef(
    latestDecision?.contributionRef,
    input.previewFlow?.contributionRef,
    input.latestRequestDraft?.contributionRef,
    input.gate?.contributionRef,
  );
  const dossierRef = pickFirstRef(
    latestDecision?.dossierRef,
    input.previewFlow?.dossierRef,
    input.latestRequestDraft?.dossierRef,
    input.gate?.dossierRef,
  );
  const sourceLanguage =
    latestDecision?.sourceLanguage ??
    input.previewFlow?.sourceLanguage ??
    input.latestRequestDraft?.sourceLanguage ??
    input.gate?.sourceLanguage ??
    "de";
  const readingLanguage =
    latestDecision?.readingLanguage ??
    input.previewFlow?.readingLanguage ??
    input.latestRequestDraft?.readingLanguage ??
    input.gate?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    latestDecision?.scriptLanguage ??
    input.previewFlow?.scriptLanguage ??
    input.latestRequestDraft?.scriptLanguage ??
    input.gate?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    latestDecision?.renderLanguage ??
    input.previewFlow?.renderLanguage ??
    input.latestRequestDraft?.renderLanguage ??
    input.gate?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    latestDecision?.subtitleLanguage ??
    input.previewFlow?.subtitleLanguage ??
    input.latestRequestDraft?.subtitleLanguage ??
    input.gate?.subtitleLanguage ??
    null;
  const rtlRequired =
    latestDecision?.rtlRequired ??
    input.previewFlow?.rtlRequired ??
    input.latestRequestDraft?.rtlRequired ??
    (input.gate?.rtlDecisionHint != null);

  return {
    outcomeHandoffId: buildOutcomeHandoffId({
      previewReviewDecisionRecordId: latestDecision?.decisionRecordId ?? null,
      previewReviewFlowId: input.previewFlow?.previewReviewFlowId ?? null,
      outcomeType,
      downstreamTarget,
    }),
    previewReviewDecisionRecordId: latestDecision?.decisionRecordId ?? null,
    previewReviewFlowId: input.previewFlow?.previewReviewFlowId ?? null,
    enablementBacklogId:
      latestDecision?.enablementBacklogId ??
      input.previewFlow?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      null,
    matrixId:
      latestDecision?.matrixId ?? input.previewFlow?.matrixId ?? input.latestMatrix?.matrixId ?? null,
    requestDraftId:
      latestDecision?.requestDraftId ??
      input.previewFlow?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      null,
    renderDecisionId:
      latestDecision?.renderDecisionId ??
      input.previewFlow?.decisionId ??
      input.latestRequestDraft?.decisionId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef: input.reviewerRef ?? latestDecision?.reviewerRef ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: null,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    renderLanguage,
    subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired,
    handoffStatus: status,
    outcomeType,
    downstreamTarget,
    handoffPayload: payload,
    handoffEffects: buildVoxyRenderPreviewOutcomeHandoffEffects({
      outcomeType,
      downstreamTarget,
    }),
    executionFlags: buildVoxyRenderPreviewOutcomeHandoffExecutionFlags(),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    previewReviewDecisionTypeHint: latestDecision?.decisionType ?? null,
    previewReviewDecisionStatusHint: latestDecision?.decisionStatus ?? null,
    previewReviewFlowStatusHint: input.previewFlow?.previewStatus ?? null,
  };
}

function payloadLines(payload: VoxyRenderPreviewOutcomeHandoffPayload) {
  return uniqueStrings([
    payload.reviewerComment,
    payload.revisionReason,
    payload.rejectionReason,
    payload.reviewReadyReason,
    payload.checklistSummary,
    payload.languageNotes,
    payload.claimSafetyNotes,
    payload.assetNotes,
    payload.runtimeNotes,
    payload.downstreamNotes,
  ]);
}

function effectLines(effects: VoxyRenderPreviewOutcomeHandoffEffects) {
  return uniqueStrings([
    effects.createsScriptRevisionTask ? "Script-Revision nur als Kandidat markiert." : null,
    effects.createsAssetRevisionTask ? "Asset-Revision nur als Kandidat markiert." : null,
    effects.createsRuntimeBacklogTask
      ? "Runtime-Backlog nur als Kandidat markiert."
      : null,
    effects.blocksDownstream ? "Downstream bleibt blockiert." : null,
    effects.marksReviewReadyOnly ? "Review-ready bleibt nur Review-Status." : null,
    effects.pausesVideoFlow ? "Video-Flow bleibt pausiert." : null,
    "Kein Render.",
    "Kein Re-Render.",
    "Keine Medien-Datei.",
    "Kein Providerlauf.",
    "Keine Kosten.",
    "Keine Veröffentlichung.",
  ]);
}

export function buildVoxyRenderPreviewOutcomeHandoffPanelModel(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  storeState?: VoxyRenderPreviewOutcomeHandoffPersistenceState | null;
}): VoxyRenderPreviewOutcomeHandoffPanelModel | null {
  if (!input.previewFlow) return null;

  const commandPreview = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
    previewFlow: input.previewFlow,
    latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
    latestBacklog: input.latestBacklog ?? null,
    latestMatrix: input.latestMatrix ?? null,
    latestRequestDraft: input.latestRequestDraft ?? null,
    gate: input.gate ?? null,
  });
  const latestRecord = input.latestRecord ?? null;
  const activeStatus = latestRecord?.handoffStatus ?? commandPreview.handoffStatus;
  const activeTarget = latestRecord?.downstreamTarget ?? commandPreview.downstreamTarget;
  const activeType = latestRecord?.outcomeType ?? commandPreview.outcomeType;
  const activePayload = latestRecord?.handoffPayload ?? commandPreview.handoffPayload;
  const activeEffects = latestRecord?.handoffEffects ?? commandPreview.handoffEffects;
  const storeState = input.storeState ?? buildDefaultStoreState();

  return {
    title: "Preview Outcome Handoff",
    summary:
      "Dieser Layer übersetzt eine persistierte Preview-Review-Entscheidung nur in einen auditierbaren Downstream-Handoff: Review-Kontext, Revisionskandidat, Blockade, review-ready-only oder Script-only-Pause. Er rendert nichts und veröffentlicht nichts.",
    previewDecisionLabel: previewDecisionTypeLabel(activeType),
    handoffStatusLabel: voxyRenderPreviewOutcomeHandoffStatusLabel(activeStatus),
    downstreamTargetLabel: voxyRenderPreviewOutcomeHandoffTargetLabel(activeTarget),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    commandPreview: {
      outcomeTypeLabel: previewDecisionTypeLabel(commandPreview.outcomeType),
      handoffStatusLabel: voxyRenderPreviewOutcomeHandoffStatusLabel(commandPreview.handoffStatus),
      downstreamTargetLabel: voxyRenderPreviewOutcomeHandoffTargetLabel(
        commandPreview.downstreamTarget,
      ),
      createdAt: commandPreview.createdAt,
      previewReviewDecisionRecordId: commandPreview.previewReviewDecisionRecordId,
    },
    latestRecord: latestRecord
      ? {
          outcomeHandoffId: latestRecord.outcomeHandoffId,
          outcomeTypeLabel: previewDecisionTypeLabel(latestRecord.outcomeType),
          handoffStatusLabel: voxyRenderPreviewOutcomeHandoffStatusLabel(
            latestRecord.handoffStatus,
          ),
          downstreamTargetLabel: voxyRenderPreviewOutcomeHandoffTargetLabel(
            latestRecord.downstreamTarget,
          ),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          handoffVersion: latestRecord.handoffVersion,
        }
      : null,
    mappingLines: [
      "Kommentar → Review-Kontext",
      "Revision → Script-/Asset-/Runtime-Backlog-Kandidat",
      "Ablehnung → Downstream blockiert",
      "Review-ready → nur review-ready, nicht approved/published",
      "Script-only → Video-Flow pausiert",
    ],
    payloadLines: payloadLines(activePayload),
    auditLines: uniqueStrings([
      `Preview-Review-Entscheidung: ${previewDecisionTypeLabel(activeType)}`,
      `Handoff-Status: ${voxyRenderPreviewOutcomeHandoffStatusLabel(activeStatus)}`,
      `Downstream-Ziel: ${voxyRenderPreviewOutcomeHandoffTargetLabel(activeTarget)}`,
      input.previewFlow.previewReviewFlowId
        ? `Preview-Review-Flow: ${input.previewFlow.previewReviewFlowId}`
        : "Noch kein Preview-Review-Flow referenziert.",
      commandPreview.previewReviewDecisionRecordId
        ? `Preview-Review-Decision: ${commandPreview.previewReviewDecisionRecordId}`
        : "Noch keine persistierte Preview-Review-Entscheidung.",
      "Outcome-Handoff ist kein Workflow-Trigger.",
      "Review-ready ist nicht approved, nicht published und nicht render_allowed.",
      "Request revision ist kein Re-Render.",
      "Reject preview löscht keine Medien und publiziert nichts.",
    ]),
    topBlockers: uniqueStrings([
      ...(input.previewFlow.topBlockers ?? []),
      !commandPreview.previewReviewDecisionRecordId
        ? "Noch keine persistierte Preview-Review-Entscheidung."
        : null,
    ]),
    effectLines: effectLines(activeEffects),
    nextStep: voxyRenderPreviewOutcomeHandoffNextStepLabel(
      latestRecord?.nextStep ?? commandPreview.nextStep,
    ),
  };
}
