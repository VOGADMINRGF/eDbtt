import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderPreviewOutcomeHandoffCommand,
  VoxyRenderPreviewOutcomeHandoffRecord,
  VoxyRenderPreviewOutcomeHandoffStatus,
  VoxyRenderPreviewOutcomeHandoffType,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
  buildVoxyRenderPreviewOutcomeHandoffPanelModel,
  voxyRenderPreviewOutcomeHandoffStatusLabel,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import type {
  VoxyRenderPreviewReviewDecisionRecord,
  VoxyRenderPreviewReviewDecisionStatus,
  VoxyRenderPreviewReviewDecisionType,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import type {
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStatus,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview,
  buildVoxyRenderPreviewReviewFlowFromReviewContext,
  buildVoxyRenderPreviewReviewFlowFromVoxyDialog,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import type {
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
import type {
  VoxyRenderRuntimeEnablementBacklogRecord,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview,
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import type {
  VoxyRenderRuntimeGoNogoMatrixRecord,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview,
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

export const VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES = [
  "publish_readiness_guard_only",
  "noop_publish_guard",
  "not_publish_ready",
  "review_ready_only",
  "approval_required",
  "media_required",
  "upload_blocked",
  "scheduling_blocked",
  "social_posting_blocked",
  "downstream_blocked",
  "blocked_by_missing_preview_outcome",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderPublishReadinessGuardStatus =
  (typeof VOXY_RENDER_PUBLISH_READINESS_GUARD_STATUSES)[number];

export const VOXY_RENDER_PUBLISH_READINESS_GATE_KEYS = [
  "review",
  "approval",
  "media",
  "upload",
  "scheduling",
  "social_posting",
  "legal_safety",
  "source_caption",
  "language",
  "accessibility",
  "runtime",
] as const;

export type VoxyRenderPublishReadinessGateKey =
  (typeof VOXY_RENDER_PUBLISH_READINESS_GATE_KEYS)[number];

export const VOXY_RENDER_PUBLISH_READINESS_GATE_STATUSES = [
  "no_go",
  "needs_review",
  "needs_approval",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderPublishReadinessGateStatus =
  (typeof VOXY_RENDER_PUBLISH_READINESS_GATE_STATUSES)[number];

export const VOXY_RENDER_PUBLISH_READINESS_NEXT_STEPS = [
  "keep_publish_blocked",
  "request_human_approval",
  "require_real_media_file",
  "require_upload_runtime",
  "require_social_review",
  "require_scheduling_policy",
  "keep_review_ready_only",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPublishReadinessNextStep =
  (typeof VOXY_RENDER_PUBLISH_READINESS_NEXT_STEPS)[number];

export const VOXY_RENDER_PUBLISH_READINESS_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderPublishReadinessStoreResultStatus =
  (typeof VOXY_RENDER_PUBLISH_READINESS_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_PUBLISH_READINESS_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderPublishReadinessPersistenceMode =
  (typeof VOXY_RENDER_PUBLISH_READINESS_PERSISTENCE_MODES)[number];

type PublishReadinessRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderPublishReadinessGate = {
  gateKey: VoxyRenderPublishReadinessGateKey;
  label: string;
  status: VoxyRenderPublishReadinessGateStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderPublishReadinessNextStep;
  executionAllowed: false;
};

export type VoxyRenderPublishReadinessSemantics = {
  reviewReady: boolean;
  approved: false;
  publishReady: false;
  published: false;
  uploaded: false;
  scheduled: false;
  socialPosted: false;
  autoPublishAllowed: false;
};

export type VoxyRenderPublishReadinessEffects = {
  blocksPublish: true;
  blocksUpload: true;
  blocksScheduling: true;
  blocksSocialPosting: true;
  createsUpload: false;
  createsSchedule: false;
  createsSocialPost: false;
  triggersPublish: false;
  createsRenderJob: false;
  triggersRerender: false;
  triggersProvider: false;
  createsQueueJob: false;
  createsMediaFile: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPublishReadinessExecutionFlags = {
  publishAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  previewFileAvailable: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPublishReadinessGuardCommand = {
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: PublishReadinessRef | null;
  contributionRef?: PublishReadinessRef | null;
  dossierRef?: PublishReadinessRef | null;
  reviewerRef?: PublishReadinessRef | null;
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
  guardStatus: VoxyRenderPublishReadinessGuardStatus;
  reviewGate: VoxyRenderPublishReadinessGate;
  approvalGate: VoxyRenderPublishReadinessGate;
  mediaGate: VoxyRenderPublishReadinessGate;
  uploadGate: VoxyRenderPublishReadinessGate;
  schedulingGate: VoxyRenderPublishReadinessGate;
  socialPostingGate: VoxyRenderPublishReadinessGate;
  legalSafetyGate: VoxyRenderPublishReadinessGate;
  sourceCaptionGate: VoxyRenderPublishReadinessGate;
  languageGate: VoxyRenderPublishReadinessGate;
  accessibilityGate: VoxyRenderPublishReadinessGate;
  runtimeGate: VoxyRenderPublishReadinessGate;
  publishSemantics: VoxyRenderPublishReadinessSemantics;
  guardEffects: VoxyRenderPublishReadinessEffects;
  executionFlags: VoxyRenderPublishReadinessExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderPublishReadinessNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  previewOutcomeStatusHint?: VoxyRenderPreviewOutcomeHandoffStatus | null;
  previewReviewDecisionTypeHint?: VoxyRenderPreviewReviewDecisionType | null;
  previewReviewDecisionStatusHint?: VoxyRenderPreviewReviewDecisionStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderPublishReadinessGuardRecord =
  VoxyRenderPublishReadinessGuardCommand & {
    publishReadinessGuardId: string;
    persistedAt: string | null;
    persistedBy: string | null;
    idempotencyKey: string | null;
    previousPublishReadinessGuardRef: string | null;
    supersedesPublishReadinessGuardRef: string | null;
    guardVersion: number | null;
  };

export type VoxyRenderPublishReadinessStoreResult = {
  ok: boolean;
  status: VoxyRenderPublishReadinessStoreResultStatus;
  record: VoxyRenderPublishReadinessGuardRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderPublishReadinessNextStep;
};

export type VoxyRenderPublishReadinessPersistenceState = {
  mode: VoxyRenderPublishReadinessPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderPublishReadinessGuardRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderPublishReadinessGuardPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderPublishReadinessGuardCommand | VoxyRenderPublishReadinessGuardRecord;
  guardStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    publishReadinessGuardId: string;
    guardStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    guardVersion: number | null;
    previewOutcomeHandoffId: string | null | undefined;
  } | null;
  commandPreview: {
    guardStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    previewOutcomeHandoffId: string | null | undefined;
  };
  gateRows: Array<
    VoxyRenderPublishReadinessGate & {
      statusLabel: string;
      nextStepLabel: string;
    }
  >;
  semanticsLines: string[];
  effectLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

type BuildPublishReadinessInput = {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: PublishReadinessRef | null;
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

function publishReadinessGateLabel(value: VoxyRenderPublishReadinessGateKey) {
  if (value === "review") return "Review Gate";
  if (value === "approval") return "Approval Gate";
  if (value === "media") return "Media Gate";
  if (value === "upload") return "Upload Gate";
  if (value === "scheduling") return "Scheduling Gate";
  if (value === "social_posting") return "Social Posting Gate";
  if (value === "legal_safety") return "Legal/Safety Gate";
  if (value === "source_caption") return "Source Caption Gate";
  if (value === "language") return "Language/RTL Gate";
  if (value === "accessibility") return "Accessibility Gate";
  return "Runtime Gate";
}

export function voxyRenderPublishReadinessGuardStatusLabel(
  value: VoxyRenderPublishReadinessGuardStatus,
) {
  if (value === "publish_readiness_guard_only") return "Nur Publish-Readiness-Guard";
  if (value === "noop_publish_guard") return "Noop Publish Guard";
  if (value === "not_publish_ready") return "Noch nicht veröffentlichungsbereit";
  if (value === "review_ready_only") return "Nur review-ready";
  if (value === "approval_required") return "Menschliche Freigabe fehlt";
  if (value === "media_required") return "Reale Medien-Datei fehlt";
  if (value === "upload_blocked") return "Upload blockiert";
  if (value === "scheduling_blocked") return "Scheduling blockiert";
  if (value === "social_posting_blocked") return "Social Posting blockiert";
  if (value === "downstream_blocked") return "Downstream blockiert";
  if (value === "blocked_by_missing_preview_outcome") {
    return "Ohne Preview Outcome Handoff blockiert";
  }
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

function publishReadinessGateStatusLabel(value: VoxyRenderPublishReadinessGateStatus) {
  if (value === "no_go") return "No-Go";
  if (value === "needs_review") return "Review nötig";
  if (value === "needs_approval") return "Freigabe nötig";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function voxyRenderPublishReadinessNextStepLabel(
  value: VoxyRenderPublishReadinessNextStep,
) {
  if (value === "keep_publish_blocked") return "Veröffentlichung blockiert halten";
  if (value === "request_human_approval") return "Menschliche Freigabe anfragen";
  if (value === "require_real_media_file") return "Reale Medien-Datei erforderlich";
  if (value === "require_upload_runtime") return "Upload-Runtime erforderlich";
  if (value === "require_social_review") return "Social Review erforderlich";
  if (value === "require_scheduling_policy") return "Scheduling-Policy erforderlich";
  if (value === "keep_review_ready_only") return "Nur review-ready beibehalten";
  if (value === "keep_as_script_only") return "Script-only beibehalten";
  return "Blocker klären";
}

function defaultStoreState(): VoxyRenderPublishReadinessPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Publish-Readiness-Guard-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Publish-Readiness-Vorschau. Echte Audit-Persistenz bleibt auf dem server-only Admin-Pfad.",
    repositoryInterface: "VoxyRenderPublishReadinessGuardRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

export function buildVoxyRenderPublishReadinessExecutionFlags(): VoxyRenderPublishReadinessExecutionFlags {
  return {
    publishAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderPublishReadinessEffects(): VoxyRenderPublishReadinessEffects {
  return {
    blocksPublish: true,
    blocksUpload: true,
    blocksScheduling: true,
    blocksSocialPosting: true,
    createsUpload: false,
    createsSchedule: false,
    createsSocialPost: false,
    triggersPublish: false,
    createsRenderJob: false,
    triggersRerender: false,
    triggersProvider: false,
    createsQueueJob: false,
    createsMediaFile: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function buildPublishSemantics(reviewReady: boolean): VoxyRenderPublishReadinessSemantics {
  return {
    reviewReady,
    approved: false,
    publishReady: false,
    published: false,
    uploaded: false,
    scheduled: false,
    socialPosted: false,
    autoPublishAllowed: false,
  };
}

function pickFirstRef<T extends PublishReadinessRef | null | undefined>(...values: T[]) {
  return values.find((value) => Boolean(value?.id && value?.title)) ?? null;
}

function buildGate(input: {
  gateKey: VoxyRenderPublishReadinessGateKey;
  status: VoxyRenderPublishReadinessGateStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderPublishReadinessNextStep;
}): VoxyRenderPublishReadinessGate {
  return {
    gateKey: input.gateKey,
    label: publishReadinessGateLabel(input.gateKey),
    status: input.status,
    reviewerVisibleReason: input.reviewerVisibleReason,
    userVisibleReason: input.userVisibleReason,
    nextAction: input.nextAction,
    executionAllowed: false,
  };
}

function gateReasonFromMatrix(
  matrix: VoxyRenderRuntimeGoNogoMatrixRecord | null | undefined,
  gateKey:
    | "reviewGate"
    | "providerGate"
    | "assetGate"
    | "queueGate"
    | "costCreditGate"
    | "languageGate"
    | "runtimeGate"
    | "publishGate",
) {
  return matrix?.[gateKey]?.reviewerVisibleReason ?? null;
}

function resolveOutcomePreview(
  input: BuildPublishReadinessInput,
): VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null {
  if (input.latestPreviewOutcomeHandoffRecord) return input.latestPreviewOutcomeHandoffRecord;
  if (!input.previewFlow) return null;
  return buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
    previewFlow: input.previewFlow,
    latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
    latestBacklog: input.latestBacklog ?? null,
    latestMatrix: input.latestMatrix ?? null,
    latestRequestDraft: input.latestRequestDraft ?? null,
    gate: input.gate ?? null,
    reviewerRef: input.reviewerRef ?? null,
    createdAt: input.createdAt ?? null,
  });
}

function isReviewReady(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
) {
  return outcomePreview?.outcomeType === "mark_review_ready";
}

function buildReviewGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "review",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff gibt es keinen belastbaren Publish-Readiness-Ausgangspunkt.",
      userVisibleReason:
        "Noch kein Preview Outcome Handoff. Darum bleibt die Veröffentlichungsprüfung blockiert.",
      nextAction: "blocked",
    });
  }
  if (outcomePreview.outcomeType === "reject_preview") {
    return buildGate({
      gateKey: "review",
      status: "blocked",
      reviewerVisibleReason:
        "Die Preview wurde abgelehnt. Downstream und Publish-Readiness bleiben ausdrücklich blockiert.",
      userVisibleReason:
        "Die Preview wurde abgelehnt. Veröffentlichung bleibt blockiert.",
      nextAction: "keep_publish_blocked",
    });
  }
  if (outcomePreview.outcomeType === "request_revision") {
    return buildGate({
      gateKey: "review",
      status: "needs_review",
      reviewerVisibleReason:
        "Es wurde eine Revision angefordert. Vor jeder Publish-Lesart braucht es neue manuelle Prüfung.",
      userVisibleReason:
        "Vor einer Veröffentlichungsprüfung braucht es erst eine überarbeitete Fassung und neue Prüfung.",
      nextAction: "keep_publish_blocked",
    });
  }
  if (outcomePreview.outcomeType === "keep_as_script_only") {
    return buildGate({
      gateKey: "review",
      status: "not_applicable",
      reviewerVisibleReason:
        "Der Fall bleibt bewusst script-only. Publish-Readiness wird nicht weiter vorbereitet.",
      userVisibleReason:
        "Der Fall bleibt bewusst beim Script. Es wird keine Veröffentlichung vorbereitet.",
      nextAction: "keep_as_script_only",
    });
  }
  if (outcomePreview.outcomeType === "mark_review_ready") {
    return buildGate({
      gateKey: "review",
      status: "not_applicable",
      reviewerVisibleReason:
        "Review-ready ist dokumentiert. Das ersetzt weder Approval noch Medien-, Upload- oder Publish-Wahrheit.",
      userVisibleReason:
        "Review-ready ist erreicht, aber das ist noch keine Freigabe und keine Veröffentlichung.",
      nextAction: "keep_review_ready_only",
    });
  }
  return buildGate({
    gateKey: "review",
    status: "needs_review",
    reviewerVisibleReason:
      "Es liegt nur Review-Kontext vor. Review-ready ist noch nicht erreicht.",
    userVisibleReason:
      "Es gibt bisher nur Review-Kontext. Noch nicht veröffentlichungsbereit.",
    nextAction: "keep_publish_blocked",
  });
}

function buildApprovalGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "approval",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff wird keine menschliche Publish-Freigabe behauptet oder vorbereitet.",
      userVisibleReason:
        "Ohne Preview Outcome Handoff ist keine Freigabeprüfung möglich.",
      nextAction: "blocked",
    });
  }
  if (outcomePreview.outcomeType === "keep_as_script_only") {
    return buildGate({
      gateKey: "approval",
      status: "not_applicable",
      reviewerVisibleReason:
        "Script-only pausiert den Video-Folgepfad. Approval wird hier bewusst nicht vorbereitet.",
      userVisibleReason:
        "Für den Script-only-Fall gibt es keine Freigabeprüfung für Veröffentlichung.",
      nextAction: "keep_as_script_only",
    });
  }
  if (isReviewReady(outcomePreview)) {
    return buildGate({
      gateKey: "approval",
      status: "needs_approval",
      reviewerVisibleReason:
        "Review-ready ist nicht approved. Es fehlt weiterhin eine explizite menschliche Publish-Freigabe.",
      userVisibleReason:
        "Review-ready ist noch keine Freigabe. Veröffentlichung bleibt blockiert.",
      nextAction: "request_human_approval",
    });
  }
  return buildGate({
    gateKey: "approval",
    status: "needs_review",
    reviewerVisibleReason:
      "Vor einer möglichen Freigabe braucht es erst review-ready und weiterhin eine menschliche Approval-Entscheidung.",
    userVisibleReason:
      "Ohne abgeschlossene Prüfung gibt es keine Freigabe.",
    nextAction: "keep_publish_blocked",
  });
}

function buildMediaGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "media",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff wird keine Medien- oder Publish-Wahrheit abgeleitet.",
      userVisibleReason:
        "Noch keine belastbare Medienprüfung möglich.",
      nextAction: "blocked",
    });
  }
  if (outcomePreview.outcomeType === "keep_as_script_only") {
    return buildGate({
      gateKey: "media",
      status: "not_applicable",
      reviewerVisibleReason:
        "Script-only erzeugt bewusst keine Medien-Datei und keine Preview-Datei.",
      userVisibleReason:
        "Es bleibt bewusst beim Script. Es gibt keine Datei für Veröffentlichung.",
      nextAction: "keep_as_script_only",
    });
  }
  return buildGate({
    gateKey: "media",
    status: "no_go",
    reviewerVisibleReason:
      "Es gibt keine echte Medien-Datei. Preview Outcome Handoff, review_ready oder approved ersetzen kein Video-Asset.",
    userVisibleReason:
      "Es gibt noch keine echte Medien-Datei. Deshalb nicht veröffentlichungsbereit.",
    nextAction: "require_real_media_file",
  });
}

function buildUploadGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "upload",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff bleibt auch der Upload-Gate-Pfad blockiert.",
      userVisibleReason:
        "Noch kein Upload-Gate möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "upload",
    status: "no_go",
    reviewerVisibleReason:
      "Es gibt weder Upload-Runtime noch Upload-Ausführung. Publish Guard erzeugt keinen Upload und keine URL.",
    userVisibleReason:
      "Es gibt keinen Upload. Veröffentlichung bleibt blockiert.",
    nextAction: "require_upload_runtime",
  });
}

function buildSchedulingGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "scheduling",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff wird kein Scheduling-Folgepfad vorbereitet.",
      userVisibleReason:
        "Noch kein Scheduling-Gate möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "scheduling",
    status: "no_go",
    reviewerVisibleReason:
      "Es gibt keine Scheduling-Policy und keine Scheduling-Runtime. scheduling_candidate bleibt ungleich scheduled.",
    userVisibleReason:
      "Es gibt kein Scheduling. Veröffentlichung bleibt blockiert.",
    nextAction: "require_scheduling_policy",
  });
}

function buildSocialPostingGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "social_posting",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff wird kein Social-Posting-Gate vorbereitet.",
      userVisibleReason:
        "Noch kein Social-Posting-Gate möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "social_posting",
    status: "no_go",
    reviewerVisibleReason:
      "Es gibt keine Social-Posting-Runtime. social_workbench bleibt readmodel_only und ruft keine Social API auf.",
    userVisibleReason:
      "Es gibt kein Social Posting. Veröffentlichung bleibt blockiert.",
    nextAction: "require_social_review",
  });
}

function buildLegalSafetyGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  const rejectionReason = normalizeText(outcomePreview?.handoffPayload.rejectionReason);
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "legal_safety",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff gibt es keine belastbare Legal-/Safety-Lesart.",
      userVisibleReason:
        "Noch keine Legal-/Safety-Prüfung ableitbar.",
      nextAction: "blocked",
    });
  }
  if (outcomePreview.outcomeType === "reject_preview" && rejectionReason) {
    return buildGate({
      gateKey: "legal_safety",
      status: "blocked",
      reviewerVisibleReason:
        rejectionReason ||
        "Die Ablehnung blockiert den Legal-/Safety-Pfad bis zur neuen manuellen Klärung.",
      userVisibleReason:
        "Es gibt offene Sicherheits- oder Rechtsfragen. Veröffentlichung bleibt blockiert.",
      nextAction: "keep_publish_blocked",
    });
  }
  return buildGate({
    gateKey: "legal_safety",
    status: "needs_review",
    reviewerVisibleReason:
      "Legal- und Safety-Prüfung bleibt menschlich. Der Guard behauptet keine Freigabe.",
    userVisibleReason:
      "Rechtliche und inhaltliche Sicherheit muss weiter manuell geprüft werden.",
    nextAction: "keep_publish_blocked",
  });
}

function buildSourceCaptionGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  const sourceCaptionReason =
    normalizeText(outcomePreview?.handoffPayload.assetNotes) ||
    "Quellen- und Caption-Treue bleibt manuelle Review-Aufgabe. Übersetzung ist keine Evidenz.";
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "source_caption",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff lässt sich keine Caption-/Source-Lesart stabil ableiten.",
      userVisibleReason:
        "Noch keine belastbare Quellen- und Caption-Prüfung möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "source_caption",
    status: "needs_review",
    reviewerVisibleReason: sourceCaptionReason,
    userVisibleReason:
      "Quellen- und Caption-Treue muss weiter manuell geprüft werden.",
    nextAction: "keep_publish_blocked",
  });
}

function buildLanguageGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  const languages = outcomePreview
    ? uniqueStrings([
        `Quelle: ${languageName(outcomePreview.sourceLanguage)}`,
        `Lesefassung: ${languageName(outcomePreview.readingLanguage)}`,
        `Script: ${languageName(outcomePreview.scriptLanguage)}`,
        `Render-Ziel: ${languageName(outcomePreview.renderLanguage)}`,
        outcomePreview.subtitleLanguage
          ? `Untertitel: ${languageName(outcomePreview.subtitleLanguage)}`
          : "Untertitel fehlen noch.",
        outcomePreview.rtlRequired ? "RTL bleibt prüfpflichtig." : null,
      ]).join(" · ")
    : "Sprachprüfung noch nicht belastbar ableitbar.";
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "language",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff bleibt die Sprach- und RTL-Prüfung blockiert.",
      userVisibleReason:
        "Noch keine belastbare Sprachprüfung möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "language",
    status: "needs_review",
    reviewerVisibleReason: languages,
    userVisibleReason:
      "Sprache, Untertitel und RTL müssen weiter manuell geprüft werden.",
    nextAction: "keep_publish_blocked",
  });
}

function buildAccessibilityGate(
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null,
): VoxyRenderPublishReadinessGate {
  if (!outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "accessibility",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff bleibt auch die Accessibility-Lesart blockiert.",
      userVisibleReason:
        "Noch keine belastbare Barrierefreiheitsprüfung möglich.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "accessibility",
    status: "needs_review",
    reviewerVisibleReason: outcomePreview.subtitleLanguage
      ? "Untertitel-Sprache ist benannt, aber Lesbarkeit, Timing und Barrierefreiheit bleiben manuell zu prüfen."
      : "Es gibt noch keine belastbare Untertitel- oder Accessibility-Wahrheit.",
    userVisibleReason:
      "Barrierefreiheit und Untertitel-Lesbarkeit müssen weiter geprüft werden.",
    nextAction: "keep_publish_blocked",
  });
}

function buildRuntimeGate(input: {
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
}): VoxyRenderPublishReadinessGate {
  const runtimeReason = uniqueStrings([
    gateReasonFromMatrix(input.latestMatrix ?? null, "runtimeGate"),
    input.latestBacklog?.reviewerVisibleSummary,
    input.outcomePreview?.handoffPayload.runtimeNotes,
  ]).join(" · ");
  if (!input.outcomePreview?.previewReviewDecisionRecordId) {
    return buildGate({
      gateKey: "runtime",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Preview Outcome Handoff gibt es keine belastbare Runtime-Lesart.",
      userVisibleReason:
        "Noch keine Runtime-Prüfung möglich.",
      nextAction: "blocked",
    });
  }
  if (
    input.outcomePreview.handoffStatus === "blocked_by_runtime_truth" ||
    input.latestBacklog?.backlogStatus === "blocked_by_runtime_truth"
  ) {
    return buildGate({
      gateKey: "runtime",
      status: "blocked",
      reviewerVisibleReason:
        runtimeReason ||
        "Runtime-Wahrheit fehlt weiterhin. Der Guard darf keine Upload-, Scheduling- oder Publish-Aussage machen.",
      userVisibleReason:
        "Es fehlt weiterhin eine echte Runtime. Veröffentlichung bleibt blockiert.",
      nextAction: "blocked",
    });
  }
  return buildGate({
    gateKey: "runtime",
    status: "no_go",
    reviewerVisibleReason:
      runtimeReason ||
      "Es gibt keine echte Upload-, Scheduling-, Social- oder Publish-Runtime. Der Guard bleibt bewusst noop.",
    userVisibleReason:
      "Es gibt keine echte Runtime für Upload, Planung oder Veröffentlichung.",
    nextAction: "require_upload_runtime",
  });
}

export function deriveVoxyRenderPublishReadinessGuardStatus(input: {
  previewOutcomeHandoffId: string | null | undefined;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  previewOutcomeStatusHint?: VoxyRenderPreviewOutcomeHandoffStatus | null;
  reviewGate: VoxyRenderPublishReadinessGate;
  approvalGate: VoxyRenderPublishReadinessGate;
  mediaGate: VoxyRenderPublishReadinessGate;
  uploadGate: VoxyRenderPublishReadinessGate;
  schedulingGate: VoxyRenderPublishReadinessGate;
  socialPostingGate: VoxyRenderPublishReadinessGate;
}) {
  if (
    !normalizeText(input.previewOutcomeHandoffId) ||
    input.previewOutcomeStatusHint === "blocked_by_missing_preview_review_decision"
  ) {
    return "blocked_by_missing_preview_outcome";
  }
  if (input.previewOutcomeStatusHint === "blocked_by_runtime_truth") {
    return "blocked_by_runtime_truth";
  }
  if (input.previewOutcomeTypeHint === "keep_as_script_only") {
    return "keep_as_script_only";
  }
  if (
    input.previewOutcomeTypeHint === "request_revision" ||
    input.previewOutcomeTypeHint === "reject_preview"
  ) {
    return "downstream_blocked";
  }
  if (input.previewOutcomeTypeHint === "mark_review_ready") {
    return "review_ready_only";
  }
  if (
    input.previewOutcomeTypeHint === "comment_only" ||
    input.previewOutcomeStatusHint === "review_context_only"
  ) {
    return "not_publish_ready";
  }
  if (input.approvalGate.status === "needs_approval") {
    return "approval_required";
  }
  if (input.mediaGate.status === "no_go") {
    return "media_required";
  }
  if (input.uploadGate.status === "no_go") {
    return "upload_blocked";
  }
  if (input.schedulingGate.status === "no_go") {
    return "scheduling_blocked";
  }
  if (input.socialPostingGate.status === "no_go") {
    return "social_posting_blocked";
  }
  if (input.reviewGate.status === "blocked") {
    return "blocked_by_runtime_truth";
  }
  return "not_publish_ready";
}

function deriveNextStep(input: {
  guardStatus: VoxyRenderPublishReadinessGuardStatus;
  approvalGate: VoxyRenderPublishReadinessGate;
  mediaGate: VoxyRenderPublishReadinessGate;
  uploadGate: VoxyRenderPublishReadinessGate;
  schedulingGate: VoxyRenderPublishReadinessGate;
  socialPostingGate: VoxyRenderPublishReadinessGate;
}) {
  if (
    input.guardStatus === "blocked_by_missing_preview_outcome" ||
    input.guardStatus === "blocked_by_runtime_truth" ||
    input.guardStatus === "downstream_blocked"
  ) {
    return "blocked";
  }
  if (input.guardStatus === "keep_as_script_only") return "keep_as_script_only";
  if (input.guardStatus === "review_ready_only") {
    return input.approvalGate.status === "needs_approval"
      ? "request_human_approval"
      : "keep_review_ready_only";
  }
  if (input.approvalGate.status === "needs_approval") return "request_human_approval";
  if (input.mediaGate.status === "no_go") return "require_real_media_file";
  if (input.uploadGate.status === "no_go") return "require_upload_runtime";
  if (input.schedulingGate.status === "no_go") return "require_scheduling_policy";
  if (input.socialPostingGate.status === "no_go") return "require_social_review";
  return "keep_publish_blocked";
}

function buildTopBlockers(input: {
  reviewGate: VoxyRenderPublishReadinessGate;
  approvalGate: VoxyRenderPublishReadinessGate;
  mediaGate: VoxyRenderPublishReadinessGate;
  uploadGate: VoxyRenderPublishReadinessGate;
  schedulingGate: VoxyRenderPublishReadinessGate;
  socialPostingGate: VoxyRenderPublishReadinessGate;
  runtimeGate: VoxyRenderPublishReadinessGate;
  outcomePreview: VoxyRenderPreviewOutcomeHandoffCommand | VoxyRenderPreviewOutcomeHandoffRecord | null;
}) {
  return uniqueStrings([
    input.reviewGate.status === "blocked" ? input.reviewGate.userVisibleReason : null,
    input.approvalGate.status === "needs_approval" ? input.approvalGate.userVisibleReason : null,
    input.mediaGate.status === "no_go" ? input.mediaGate.userVisibleReason : null,
    input.uploadGate.status === "no_go" ? input.uploadGate.userVisibleReason : null,
    input.schedulingGate.status === "no_go" ? input.schedulingGate.userVisibleReason : null,
    input.socialPostingGate.status === "no_go"
      ? input.socialPostingGate.userVisibleReason
      : null,
    input.runtimeGate.status !== "not_applicable" ? input.runtimeGate.userVisibleReason : null,
    input.outcomePreview?.handoffPayload.downstreamNotes,
  ]);
}

function buildSummary(input: {
  guardStatus: VoxyRenderPublishReadinessGuardStatus;
  reviewReady: boolean;
}) {
  if (input.guardStatus === "blocked_by_missing_preview_outcome") {
    return {
      userVisibleSummary:
        "Ohne Preview Outcome Handoff bleibt Publish Readiness blockiert. Es gibt keinen Upload, kein Scheduling, kein Social Posting und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "Publish Readiness Guard bleibt ohne Preview Outcome Handoff rein blockiert und darf keine Publish-Wahrheit behaupten.",
    };
  }
  if (input.guardStatus === "blocked_by_runtime_truth") {
    return {
      userVisibleSummary:
        "Runtime-Wahrheit fehlt weiterhin. Publish Readiness bleibt blockiert und führt zu keiner Veröffentlichung.",
      reviewerVisibleSummary:
        "Fehlende Runtime-Wahrheit blockiert Upload-, Scheduling-, Social- und Publish-Aussagen vollständig.",
    };
  }
  if (input.guardStatus === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Fall bleibt bewusst Script-only. Es wird keine Veröffentlichung vorbereitet.",
      reviewerVisibleSummary:
        "Script-only pausiert den Video-Folgepfad und hält Publish-, Upload- und Scheduling-Wahrheit blockiert.",
    };
  }
  if (input.guardStatus === "downstream_blocked") {
    return {
      userVisibleSummary:
        "Downstream bleibt blockiert. Es gibt weder Upload noch Scheduling noch Social Posting noch Veröffentlichung.",
      reviewerVisibleSummary:
        "Reject preview oder request revision blockiert jeden Publish-Folgepfad und bleibt audit-only/noop.",
    };
  }
  if (input.reviewReady) {
    return {
      userVisibleSummary:
        "Review-ready ist erreicht, aber noch nicht approved und nicht published. Publish Readiness bleibt blockiert.",
      reviewerVisibleSummary:
        "Review-ready bleibt klar getrennt von Approval, Upload, Scheduling, Social Posting und Veröffentlichung.",
    };
  }
  return {
    userVisibleSummary:
      "Noch nicht veröffentlichungsbereit. Review-ready ist nicht approved, approved ist nicht published und publish-ready ist nicht published.",
    reviewerVisibleSummary:
      "Der Guard bleibt absichtlich noop: keine Upload-, Scheduling-, Social- oder Publish-Ausführung, nur Audit und Gate-Lesart.",
  };
}

function buildPublishReadinessGuardId(input: {
  previewOutcomeHandoffId: string | null;
  previewReviewFlowId: string | null;
  previewOutcomeTypeHint: VoxyRenderPreviewOutcomeHandoffType | null;
}) {
  const seed =
    input.previewOutcomeHandoffId ??
    input.previewReviewFlowId ??
    input.previewOutcomeTypeHint ??
    "preview";
  return `voxy-render-publish-readiness-guard:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderPublishReadinessGuardCommandFromReadmodels(
  input: BuildPublishReadinessInput,
): VoxyRenderPublishReadinessGuardCommand | null {
  const outcomePreview = resolveOutcomePreview(input);
  if (!outcomePreview && !input.previewFlow) return null;

  const sourceLanguage =
    outcomePreview?.sourceLanguage ??
    input.previewFlow?.sourceLanguage ??
    input.latestRequestDraft?.sourceLanguage ??
    input.gate?.sourceLanguage ??
    "de";
  const readingLanguage =
    outcomePreview?.readingLanguage ??
    input.previewFlow?.readingLanguage ??
    input.latestRequestDraft?.readingLanguage ??
    input.gate?.readingLanguage ??
    sourceLanguage;
  const scriptLanguage =
    outcomePreview?.scriptLanguage ??
    input.previewFlow?.scriptLanguage ??
    input.latestRequestDraft?.scriptLanguage ??
    input.gate?.scriptLanguage ??
    readingLanguage;
  const renderLanguage =
    outcomePreview?.renderLanguage ??
    input.previewFlow?.renderLanguage ??
    input.latestRequestDraft?.renderLanguage ??
    input.gate?.renderLanguage ??
    scriptLanguage;
  const subtitleLanguage =
    outcomePreview?.subtitleLanguage ??
    input.previewFlow?.subtitleLanguage ??
    input.latestRequestDraft?.subtitleLanguage ??
    input.gate?.subtitleLanguage ??
    null;
  const rtlRequired =
    outcomePreview?.rtlRequired ??
    input.previewFlow?.rtlRequired ??
    input.latestRequestDraft?.rtlRequired ??
    Boolean(input.gate?.rtlDecisionHint);

  const reviewGate = buildReviewGate(outcomePreview);
  const approvalGate = buildApprovalGate(outcomePreview);
  const mediaGate = buildMediaGate(outcomePreview);
  const uploadGate = buildUploadGate(outcomePreview);
  const schedulingGate = buildSchedulingGate(outcomePreview);
  const socialPostingGate = buildSocialPostingGate(outcomePreview);
  const legalSafetyGate = buildLegalSafetyGate(outcomePreview);
  const sourceCaptionGate = buildSourceCaptionGate(outcomePreview);
  const languageGate = buildLanguageGate(outcomePreview);
  const accessibilityGate = buildAccessibilityGate(outcomePreview);
  const runtimeGate = buildRuntimeGate({
    outcomePreview,
    latestMatrix: input.latestMatrix ?? null,
    latestBacklog: input.latestBacklog ?? null,
  });
  const reviewReady = isReviewReady(outcomePreview);
  const guardStatus = deriveVoxyRenderPublishReadinessGuardStatus({
    previewOutcomeHandoffId: outcomePreview?.outcomeHandoffId ?? null,
    previewOutcomeTypeHint: outcomePreview?.outcomeType ?? null,
    previewOutcomeStatusHint: outcomePreview?.handoffStatus ?? null,
    reviewGate,
    approvalGate,
    mediaGate,
    uploadGate,
    schedulingGate,
    socialPostingGate,
  });
  const nextStep = deriveNextStep({
    guardStatus,
    approvalGate,
    mediaGate,
    uploadGate,
    schedulingGate,
    socialPostingGate,
  });
  const summary = buildSummary({
    guardStatus,
    reviewReady,
  });

  const scriptRef = pickFirstRef(
    outcomePreview?.scriptRef,
    input.latestRequestDraft?.scriptRef,
    input.gate?.scriptRef,
  );
  const contributionRef = pickFirstRef(
    outcomePreview?.contributionRef,
    input.latestRequestDraft?.contributionRef,
    input.gate?.contributionRef,
  );
  const dossierRef = pickFirstRef(
    outcomePreview?.dossierRef,
    input.latestRequestDraft?.dossierRef,
    input.gate?.dossierRef,
  );

  return {
    publishReadinessGuardId: buildPublishReadinessGuardId({
      previewOutcomeHandoffId: outcomePreview?.outcomeHandoffId ?? null,
      previewReviewFlowId: input.previewFlow?.previewReviewFlowId ?? null,
      previewOutcomeTypeHint: outcomePreview?.outcomeType ?? null,
    }),
    previewOutcomeHandoffId: outcomePreview?.outcomeHandoffId ?? null,
    previewReviewDecisionRecordId:
      outcomePreview?.previewReviewDecisionRecordId ??
      input.latestPreviewReviewDecisionRecord?.decisionRecordId ??
      null,
    previewReviewFlowId:
      outcomePreview?.previewReviewFlowId ?? input.previewFlow?.previewReviewFlowId ?? null,
    enablementBacklogId:
      outcomePreview?.enablementBacklogId ??
      input.previewFlow?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      null,
    matrixId:
      outcomePreview?.matrixId ?? input.previewFlow?.matrixId ?? input.latestMatrix?.matrixId ?? null,
    requestDraftId:
      outcomePreview?.requestDraftId ??
      input.previewFlow?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef:
      input.reviewerRef ??
      input.latestPreviewReviewDecisionRecord?.reviewerRef ??
      outcomePreview?.reviewerRef ??
      null,
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
    guardStatus,
    reviewGate,
    approvalGate,
    mediaGate,
    uploadGate,
    schedulingGate,
    socialPostingGate,
    legalSafetyGate,
    sourceCaptionGate,
    languageGate,
    accessibilityGate,
    runtimeGate,
    publishSemantics: buildPublishSemantics(reviewReady),
    guardEffects: buildVoxyRenderPublishReadinessEffects(),
    executionFlags: buildVoxyRenderPublishReadinessExecutionFlags(),
    topBlockers: buildTopBlockers({
      reviewGate,
      approvalGate,
      mediaGate,
      uploadGate,
      schedulingGate,
      socialPostingGate,
      runtimeGate,
      outcomePreview,
    }),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    previewOutcomeTypeHint: outcomePreview?.outcomeType ?? null,
    previewOutcomeStatusHint: outcomePreview?.handoffStatus ?? null,
    previewReviewDecisionTypeHint:
      input.latestPreviewReviewDecisionRecord?.decisionType ?? outcomePreview?.previewReviewDecisionTypeHint ?? null,
    previewReviewDecisionStatusHint:
      input.latestPreviewReviewDecisionRecord?.decisionStatus ??
      outcomePreview?.previewReviewDecisionStatusHint ??
      null,
    previewReviewFlowStatusHint:
      input.previewFlow?.previewStatus ?? outcomePreview?.previewReviewFlowStatusHint ?? null,
  };
}

export function buildVoxyRenderPublishReadinessGuardFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  return buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
    previewFlow: buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(model),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
    latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderPublishReadinessGuardFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestPreviewReviewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
}) {
  return buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
    previewFlow:
      input.latestPreviewReviewFlow ??
      buildVoxyRenderPreviewReviewFlowFromReviewContext({
        reviewContext: input.reviewContext,
        surface: input.surface ?? "admin",
        latestMatrix: input.latestMatrix ?? null,
        latestBacklog: input.latestBacklog ?? null,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
    latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
    latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
    latestBacklog:
      input.latestBacklog ??
      buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
        reviewContext: input.reviewContext,
        latestMatrix: input.latestMatrix ?? null,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
    latestMatrix:
      input.latestMatrix ??
      buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
        reviewContext: input.reviewContext,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
    latestRequestDraft:
      input.latestRequestDraft ?? buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext),
    gate: buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext),
  });
}

export function buildVoxyRenderPublishReadinessGuardFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "account" | "workspace";
    contributionRef?: PublishReadinessRef | null;
    nextStep?: string;
  },
) {
  return buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
    previewFlow: buildVoxyRenderPreviewReviewFlowFromVoxyDialog(dialog, options),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options),
    latestRequestDraft: buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options),
    gate: buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options),
  });
}

function semanticsLines(semantics: VoxyRenderPublishReadinessSemantics) {
  return [
    semantics.reviewReady
      ? "Review-ready ist dokumentiert."
      : "Review-ready ist noch nicht erreicht.",
    "Review-ready ist nicht approved.",
    "Approved ist nicht published.",
    "Publish-ready ist nicht published.",
    "Kein Upload.",
    "Kein Social Posting.",
    "Kein Scheduling.",
    "Keine Veröffentlichung.",
  ];
}

function effectLines(effects: VoxyRenderPublishReadinessEffects) {
  return uniqueStrings([
    effects.blocksPublish ? "Publish bleibt blockiert." : null,
    effects.blocksUpload ? "Upload bleibt blockiert." : null,
    effects.blocksScheduling ? "Scheduling bleibt blockiert." : null,
    effects.blocksSocialPosting ? "Social Posting bleibt blockiert." : null,
    "Kein Render.",
    "Kein Re-Render.",
    "Keine Queue.",
    "Kein Providerlauf.",
    "Keine Medien-Datei.",
    "Keine Kosten.",
    "Keine Veröffentlichung.",
  ]);
}

function auditLines(command: VoxyRenderPublishReadinessGuardCommand | VoxyRenderPublishReadinessGuardRecord) {
  return uniqueStrings([
    `Preview Outcome: ${
      command.previewOutcomeStatusHint
        ? voxyRenderPreviewOutcomeHandoffStatusLabel(command.previewOutcomeStatusHint)
        : "Noch kein Preview Outcome Handoff"
    }`,
    command.previewOutcomeHandoffId
      ? `Preview Outcome Handoff: ${command.previewOutcomeHandoffId}`
      : "Noch kein Preview Outcome Handoff referenziert.",
    command.previewReviewDecisionRecordId
      ? `Preview-Review-Entscheidung: ${command.previewReviewDecisionRecordId}`
      : "Noch keine Preview-Review-Entscheidung referenziert.",
    command.previewReviewFlowId
      ? `Preview Review Flow: ${command.previewReviewFlowId}`
      : "Noch kein Preview Review Flow referenziert.",
    "Preview Outcome Handoff ist kein Posting.",
    "Social Workbench ist kein Social API Call.",
    "Scheduling Candidate ist nicht scheduled.",
    "Publish Ready ist nicht published.",
  ]);
}

export function buildVoxyRenderPublishReadinessGuardPanelModel(input: {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderPublishReadinessGuardRecord | null;
  storeState?: VoxyRenderPublishReadinessPersistenceState | null;
}) {
  const preview =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    }) ?? input.latestRecord;
  if (!preview) return null;

  const active = input.latestRecord ?? preview;
  const storeState = input.storeState ?? defaultStoreState();
  const gateRows = [
    active.reviewGate,
    active.approvalGate,
    active.mediaGate,
    active.uploadGate,
    active.schedulingGate,
    active.socialPostingGate,
    active.legalSafetyGate,
    active.sourceCaptionGate,
    active.languageGate,
    active.accessibilityGate,
    active.runtimeGate,
  ].map((gate) => ({
    ...gate,
    statusLabel: publishReadinessGateStatusLabel(gate.status),
    nextStepLabel: voxyRenderPublishReadinessNextStepLabel(gate.nextAction),
  }));

  return {
    title: "Publish Readiness",
    summary:
      "Dieser Guard beschreibt nur, was für einen späteren Publish-Fall noch fehlen würde. Er startet keinen Upload, kein Posting, kein Scheduling und keine Veröffentlichung.",
    preview,
    guardStatusLabel: voxyRenderPublishReadinessGuardStatusLabel(active.guardStatus),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          publishReadinessGuardId: input.latestRecord.publishReadinessGuardId,
          guardStatusLabel: voxyRenderPublishReadinessGuardStatusLabel(
            input.latestRecord.guardStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          guardVersion: input.latestRecord.guardVersion,
          previewOutcomeHandoffId: input.latestRecord.previewOutcomeHandoffId,
        }
      : null,
    commandPreview: {
      guardStatusLabel: voxyRenderPublishReadinessGuardStatusLabel(preview.guardStatus),
      nextStepLabel: voxyRenderPublishReadinessNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      previewOutcomeHandoffId: preview.previewOutcomeHandoffId,
    },
    gateRows,
    semanticsLines: semanticsLines(active.publishSemantics),
    effectLines: effectLines(active.guardEffects),
    auditLines: auditLines(active),
    topBlockers: active.topBlockers,
    nextStep: voxyRenderPublishReadinessNextStepLabel(active.nextStep),
  } satisfies VoxyRenderPublishReadinessGuardPanelModel;
}
