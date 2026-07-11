import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderPreviewOutcomeHandoffRecord,
  VoxyRenderPreviewOutcomeHandoffStatus,
  VoxyRenderPreviewOutcomeHandoffType,
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
import type { VoxyRenderRequestDraftRecord } from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
} from "@/features/create/voxyRenderRequestDraftContract";
import type { VoxyRenderReviewDecisionGateModel } from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import type {
  VoxyRenderPublishReadinessGate,
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
  VoxyRenderPublishReadinessGuardStatus,
  VoxyRenderPublishReadinessPersistenceState,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderPublishReadinessGuardCommandFromReadmodels,
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import type {
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
  VoxyRenderSocialDistributionHandoffStatus,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels,
  voxyRenderSocialDistributionHandoffStatusLabel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
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

export const VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES = [
  "approval_semantics_only",
  "noop_approval",
  "approval_candidate_only",
  "approval_required",
  "blocked_by_missing_distribution_handoff",
  "blocked_by_publish_guard",
  "blocked_by_missing_media",
  "blocked_by_missing_human_approval",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderApprovalSemanticsStatus =
  (typeof VOXY_RENDER_APPROVAL_SEMANTICS_STATUSES)[number];

export const VOXY_RENDER_APPROVAL_CANDIDATE_STATUSES = [
  "candidate_only",
  "needs_human_approval",
  "needs_legal_review",
  "needs_source_review",
  "needs_language_review",
  "needs_accessibility_review",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderApprovalCandidateStatus =
  (typeof VOXY_RENDER_APPROVAL_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_APPROVAL_GATE_KEYS = [
  "human_approval",
  "legal_safety",
  "source_caption",
  "claim_safety",
  "language",
  "accessibility",
  "media",
  "publish_guard",
  "distribution_guard",
  "runtime",
] as const;

export type VoxyRenderApprovalGateKey =
  (typeof VOXY_RENDER_APPROVAL_GATE_KEYS)[number];

export const VOXY_RENDER_APPROVAL_GATE_STATUSES = [
  "needs_review",
  "needs_approval",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderApprovalGateStatus =
  (typeof VOXY_RENDER_APPROVAL_GATE_STATUSES)[number];

export const VOXY_RENDER_APPROVAL_NEXT_STEPS = [
  "request_human_approval",
  "require_real_media_file",
  "require_legal_review",
  "require_source_review",
  "require_language_review",
  "require_accessibility_review",
  "keep_approval_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderApprovalNextStep =
  (typeof VOXY_RENDER_APPROVAL_NEXT_STEPS)[number];

export const VOXY_RENDER_APPROVAL_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderApprovalStoreResultStatus =
  (typeof VOXY_RENDER_APPROVAL_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_APPROVAL_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderApprovalPersistenceMode =
  (typeof VOXY_RENDER_APPROVAL_PERSISTENCE_MODES)[number];

type ApprovalRef = {
  id: string;
  title: string;
  href?: string | null;
};

type PublishGuardPreview =
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord;

type SocialDistributionPreview =
  | VoxyRenderSocialDistributionHandoffCommand
  | VoxyRenderSocialDistributionHandoffRecord;

export type VoxyRenderApprovalCandidate = {
  approvalCandidateId: string | null;
  status: VoxyRenderApprovalCandidateStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  approvalAllowed: false;
  approved: false;
};

export type VoxyRenderApprovalGate = {
  gateKey: VoxyRenderApprovalGateKey;
  label: string;
  status: VoxyRenderApprovalGateStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderApprovalNextStep;
  executionAllowed: false;
};

export type VoxyRenderApprovalSemantics = {
  reviewReady: boolean;
  publishReady: false;
  approvalCandidate: boolean;
  approved: false;
  uploaded: false;
  scheduled: false;
  socialPosted: false;
  published: false;
  autoPublishAllowed: false;
};

export type VoxyRenderApprovalEffects = {
  marksApproved: false;
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

export type VoxyRenderApprovalExecutionFlags = {
  approvalExecutionAllowed: false;
  publishAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  platformApiCallAllowed: false;
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

export type VoxyRenderApprovalSemanticsCommand = {
  approvalSemanticsId?: string | null;
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: ApprovalRef | null;
  contributionRef?: ApprovalRef | null;
  dossierRef?: ApprovalRef | null;
  reviewerRef?: ApprovalRef | null;
  approverRef?: ApprovalRef | null;
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
  approvalStatus: VoxyRenderApprovalSemanticsStatus;
  approvalCandidate: VoxyRenderApprovalCandidate;
  humanApprovalGate: VoxyRenderApprovalGate;
  legalSafetyGate: VoxyRenderApprovalGate;
  sourceCaptionGate: VoxyRenderApprovalGate;
  claimSafetyGate: VoxyRenderApprovalGate;
  languageGate: VoxyRenderApprovalGate;
  accessibilityGate: VoxyRenderApprovalGate;
  mediaGate: VoxyRenderApprovalGate;
  publishGuardGate: VoxyRenderApprovalGate;
  distributionGuardGate: VoxyRenderApprovalGate;
  runtimeGate: VoxyRenderApprovalGate;
  approvalSemantics: VoxyRenderApprovalSemantics;
  approvalEffects: VoxyRenderApprovalEffects;
  executionFlags: VoxyRenderApprovalExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderApprovalNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  publishGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  previewOutcomeStatusHint?: VoxyRenderPreviewOutcomeHandoffStatus | null;
  previewReviewDecisionTypeHint?: VoxyRenderPreviewReviewDecisionType | null;
  previewReviewDecisionStatusHint?: VoxyRenderPreviewReviewDecisionStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderApprovalSemanticsRecord =
  VoxyRenderApprovalSemanticsCommand & {
    approvalSemanticsId: string;
    persistedAt: string | null;
    persistedBy: string | null;
    idempotencyKey: string | null;
    previousApprovalSemanticsRef: string | null;
    supersedesApprovalSemanticsRef: string | null;
    approvalVersion: number | null;
  };

export type VoxyRenderApprovalPersistenceState = {
  mode: VoxyRenderApprovalPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderApprovalSemanticsRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "not_available";
};

export type VoxyRenderApprovalStoreResult = {
  ok: boolean;
  status: VoxyRenderApprovalStoreResultStatus;
  record: VoxyRenderApprovalSemanticsRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderApprovalNextStep;
};

export type VoxyRenderApprovalSemanticsPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderApprovalSemanticsCommand | VoxyRenderApprovalSemanticsRecord;
  approvalStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    approvalSemanticsId: string;
    approvalStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    approvalVersion: number | null;
    socialDistributionHandoffId: string | null;
  } | null;
  commandPreview: {
    approvalStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    socialDistributionHandoffId: string | null | undefined;
  };
  candidateLine: string;
  gateRows: Array<
    VoxyRenderApprovalGate & {
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

type BuildApprovalSemanticsInput = {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestPublishReadinessGuardRecord?: PublishGuardPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: ApprovalRef | null;
  approverRef?: ApprovalRef | null;
  createdAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean)),
  );
}

function sanitizeIdFragment(value: string | null | undefined) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickFirstRef<T extends ApprovalRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (value?.id && value?.title) return value;
  }
  return null;
}

function defaultStoreState(): VoxyRenderApprovalPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Approval-Semantik-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine typed Approval-Lesart. Kein Approval, kein Upload, kein Posting und keine Veröffentlichung werden ausgeführt.",
    repositoryInterface: "VoxyRenderApprovalSemanticsRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function approvalGateLabel(value: VoxyRenderApprovalGateKey) {
  if (value === "human_approval") return "Human Approval Gate";
  if (value === "legal_safety") return "Legal/Safety Gate";
  if (value === "source_caption") return "Source Caption Gate";
  if (value === "claim_safety") return "Claim Safety Gate";
  if (value === "language") return "Language/RTL Gate";
  if (value === "accessibility") return "Accessibility Gate";
  if (value === "media") return "Media Gate";
  if (value === "publish_guard") return "Publish Guard Gate";
  if (value === "distribution_guard") return "Distribution Guard Gate";
  return "Runtime Gate";
}

function approvalGateStatusLabel(value: VoxyRenderApprovalGateStatus) {
  if (value === "needs_review") return "Review offen";
  if (value === "needs_approval") return "Freigabe nötig";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function voxyRenderApprovalSemanticsStatusLabel(
  value: VoxyRenderApprovalSemanticsStatus,
) {
  if (value === "approval_semantics_only") return "Nur Approval-Semantik";
  if (value === "noop_approval") return "Noop-Approval";
  if (value === "approval_candidate_only") return "Nur Approval-Kandidat";
  if (value === "approval_required") return "Approval später erforderlich";
  if (value === "blocked_by_missing_distribution_handoff") {
    return "Ohne Distribution-Handoff blockiert";
  }
  if (value === "blocked_by_publish_guard") return "Durch Publish Guard blockiert";
  if (value === "blocked_by_missing_media") return "Ohne Medien-Datei blockiert";
  if (value === "blocked_by_missing_human_approval") {
    return "Ohne menschliche Freigabe blockiert";
  }
  if (value === "blocked_by_runtime_truth") return "Durch Runtime-Wahrheit blockiert";
  return "Script-only";
}

function approvalCandidateStatusLabel(value: VoxyRenderApprovalCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "needs_human_approval") return "Menschliche Freigabe nötig";
  if (value === "needs_legal_review") return "Legal Review nötig";
  if (value === "needs_source_review") return "Source Review nötig";
  if (value === "needs_language_review") return "Language Review nötig";
  if (value === "needs_accessibility_review") return "Accessibility Review nötig";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

function previewReviewFlowStatusLabel(value: VoxyRenderPreviewReviewFlowStatus) {
  if (value === "preview_review_flow_only") return "Preview-Review-Flow";
  if (value === "noop_preview_review") return "Noop-Preview-Review";
  if (value === "no_preview_available") return "Noch kein Preview";
  if (value === "needs_render_runtime") return "Render-Runtime fehlt";
  if (value === "needs_preview_asset") return "Preview-Asset fehlt";
  if (value === "needs_human_review") return "Menschliches Review nötig";
  if (value === "needs_revision") return "Revision angefragt";
  if (value === "blocked_by_missing_backlog") return "Ohne Backlog blockiert";
  if (value === "blocked_by_missing_matrix") return "Ohne Matrix blockiert";
  if (value === "keep_as_script_only") return "Script-only";
  if (value === "blocked_by_runtime_truth") return "Durch Runtime-Wahrheit blockiert";
  return "Preview-Review";
}

export function voxyRenderApprovalNextStepLabel(value: VoxyRenderApprovalNextStep) {
  if (value === "request_human_approval") return "Menschliche Freigabe einplanen";
  if (value === "require_real_media_file") return "Reale Medien-Datei erforderlich";
  if (value === "require_legal_review") return "Legal Review erforderlich";
  if (value === "require_source_review") return "Source Review erforderlich";
  if (value === "require_language_review") return "Language Review erforderlich";
  if (value === "require_accessibility_review") return "Accessibility Review erforderlich";
  if (value === "keep_approval_blocked") return "Approval bewusst blockiert halten";
  if (value === "keep_as_script_only") return "Als Script-only belassen";
  return "Blockiert";
}

export function buildVoxyRenderApprovalEffects(): VoxyRenderApprovalEffects {
  return {
    marksApproved: false,
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

export function buildVoxyRenderApprovalExecutionFlags(): VoxyRenderApprovalExecutionFlags {
  return {
    approvalExecutionAllowed: false,
    publishAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    platformApiCallAllowed: false,
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

function buildApprovalGate(input: {
  gateKey: VoxyRenderApprovalGateKey;
  status: VoxyRenderApprovalGateStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderApprovalNextStep;
}): VoxyRenderApprovalGate {
  return {
    gateKey: input.gateKey,
    label: approvalGateLabel(input.gateKey),
    status: input.status,
    reviewerVisibleReason: input.reviewerVisibleReason,
    userVisibleReason: input.userVisibleReason,
    nextAction: input.nextAction,
    executionAllowed: false,
  };
}

function isBlockedPublishGateStatus(
  status:
    | VoxyRenderPublishReadinessGate["status"]
    | null
    | undefined,
) {
  return status === "blocked" || status === "no_go";
}

function isPublishGuardHardBlocked(
  status: VoxyRenderPublishReadinessGuardStatus | null | undefined,
) {
  return (
    status === "blocked_by_missing_preview_outcome" ||
    status === "blocked_by_runtime_truth" ||
    status === "downstream_blocked" ||
    status === "not_publish_ready"
  );
}

function resolvePublishGuardPreview(input: BuildApprovalSemanticsInput) {
  return (
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    })
  );
}

function resolveSocialDistributionPreview(input: BuildApprovalSemanticsInput) {
  return (
    input.latestSocialDistributionHandoffRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPublishReadinessGuardRecord:
        (resolvePublishGuardPreview(input) as VoxyRenderPublishReadinessGuardRecord | null) ??
        null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    })
  );
}

function isReviewReady(
  publishGuardPreview: PublishGuardPreview | null | undefined,
  socialDistributionPreview: SocialDistributionPreview | null | undefined,
) {
  return Boolean(
    publishGuardPreview?.publishSemantics.reviewReady ||
      publishGuardPreview?.previewOutcomeTypeHint === "mark_review_ready" ||
      socialDistributionPreview?.previewOutcomeTypeHint === "mark_review_ready",
  );
}

function isApprovalCandidate(input: {
  reviewReady: boolean;
  publishGuardPreview: PublishGuardPreview | null | undefined;
  socialDistributionPreview: SocialDistributionPreview | null | undefined;
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null | undefined;
}) {
  if (
    input.publishGuardPreview?.previewOutcomeTypeHint === "keep_as_script_only" ||
    input.socialDistributionPreview?.previewOutcomeTypeHint === "keep_as_script_only"
  ) {
    return false;
  }
  return Boolean(
    input.reviewReady ||
      input.socialDistributionPreview?.socialDistributionHandoffId ||
      input.publishGuardPreview?.publishReadinessGuardId ||
      input.previewFlow?.previewReviewFlowId,
  );
}

function buildHumanApprovalGate(input: {
  approvalCandidate: boolean;
  reviewReady: boolean;
  approverRef: ApprovalRef | null;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly || !input.approvalCandidate) {
    return buildApprovalGate({
      gateKey: "human_approval",
      status: "not_applicable",
      reviewerVisibleReason:
        "Ohne Approval-Kandidat oder im Script-only-Fall wird keine Freigabe behauptet.",
      userVisibleReason:
        "Dieser Stand ist noch keine menschliche Freigabe und bleibt ohne Approval-Ausführung.",
      nextAction: "keep_approval_blocked",
    });
  }
  if (!input.reviewReady) {
    return buildApprovalGate({
      gateKey: "human_approval",
      status: "needs_review",
      reviewerVisibleReason:
        "Vor einer menschlichen Freigabe braucht es erst review-ready Kontext. Review-ready bleibt getrennt von approved.",
      userVisibleReason:
        "Vor einer späteren Freigabe muss der Fall erst review-ready werden.",
      nextAction: "keep_approval_blocked",
    });
  }
  return buildApprovalGate({
    gateKey: "human_approval",
    status: "needs_approval",
    reviewerVisibleReason: input.approverRef?.id
      ? `Eine spätere menschliche Freigabe durch ${input.approverRef.title} wäre nötig, löst aber keine Runtime aus.`
      : "Es gibt noch keine benannte menschliche Freigabe. Approved bleibt false.",
    userVisibleReason:
      "Menschliche Freigabe wäre später nötig. Approval ist kein Upload, kein Posting und kein Publish.",
    nextAction: "request_human_approval",
  });
}

function buildReviewOnlyGate(input: {
  gateKey:
    | "legal_safety"
    | "source_caption"
    | "claim_safety"
    | "language"
    | "accessibility";
  approvalCandidate: boolean;
  keepAsScriptOnly: boolean;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  nextAction: VoxyRenderApprovalNextStep;
}) {
  if (input.keepAsScriptOnly || !input.approvalCandidate) {
    return buildApprovalGate({
      gateKey: input.gateKey,
      status: "not_applicable",
      reviewerVisibleReason:
        "Ohne Approval-Kandidat bleibt dieses Gate rein semantisch und nicht anwendbar.",
      userVisibleReason: "Dieses Gate wird erst relevant, wenn ein Approval-Kandidat vorliegt.",
      nextAction: "keep_approval_blocked",
    });
  }
  return buildApprovalGate({
    gateKey: input.gateKey,
    status: "needs_review",
    reviewerVisibleReason: input.reviewerVisibleReason,
    userVisibleReason: input.userVisibleReason,
    nextAction: input.nextAction,
  });
}

function buildMediaGate(input: {
  publishGuardPreview: PublishGuardPreview | null | undefined;
  approvalCandidate: boolean;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return buildApprovalGate({
      gateKey: "media",
      status: "not_applicable",
      reviewerVisibleReason: "Script-only behauptet bewusst keine Medien-Datei.",
      userVisibleReason: "Als Script-only wird keine Medien-Datei vorausgesetzt.",
      nextAction: "keep_as_script_only",
    });
  }
  if (!input.approvalCandidate) {
    return buildApprovalGate({
      gateKey: "media",
      status: "needs_review",
      reviewerVisibleReason:
        "Noch kein Approval-Kandidat. Eine Medien-Datei darf nicht vorausgesetzt oder erfunden werden.",
      userVisibleReason: "Noch kein Approval-Kandidat und keine Medien-Datei.",
      nextAction: "keep_approval_blocked",
    });
  }
  if (isBlockedPublishGateStatus(input.publishGuardPreview?.mediaGate.status)) {
    return buildApprovalGate({
      gateKey: "media",
      status: "blocked",
      reviewerVisibleReason:
        input.publishGuardPreview?.mediaGate.reviewerVisibleReason ??
        "Es gibt keine echte Medien-Datei. Approval bleibt rein semantisch.",
      userVisibleReason:
        input.publishGuardPreview?.mediaGate.userVisibleReason ??
        "Es gibt noch keine echte Medien-Datei.",
      nextAction: "require_real_media_file",
    });
  }
  return buildApprovalGate({
    gateKey: "media",
    status: "needs_review",
    reviewerVisibleReason:
      "Medienwahrheit bleibt weiterhin review-first und darf nicht gefakt werden.",
    userVisibleReason: "Medienwahrheit bleibt noch reviewpflichtig.",
    nextAction: "require_real_media_file",
  });
}

function buildPublishGuardGate(input: {
  publishGuardPreview: PublishGuardPreview | null | undefined;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return buildApprovalGate({
      gateKey: "publish_guard",
      status: "not_applicable",
      reviewerVisibleReason: "Script-only pausiert den Publish-Folgepfad vollständig.",
      userVisibleReason: "Als Script-only bleibt der Publish-Folgepfad ausgesetzt.",
      nextAction: "keep_as_script_only",
    });
  }
  if (!input.publishGuardPreview?.publishReadinessGuardId) {
    return buildApprovalGate({
      gateKey: "publish_guard",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Publish-Readiness-Guard darf Approval weder Upload noch Veröffentlichung andeuten.",
      userVisibleReason:
        "Ohne Publish-Readiness-Guard bleibt Approval weiter blockiert.",
      nextAction: "blocked",
    });
  }
  if (isPublishGuardHardBlocked(input.publishGuardPreview.guardStatus)) {
    return buildApprovalGate({
      gateKey: "publish_guard",
      status: "blocked",
      reviewerVisibleReason:
        `Publish Readiness bleibt blockiert: ${voxyRenderPublishReadinessGuardStatusLabel(
          input.publishGuardPreview.guardStatus,
        )}.`,
      userVisibleReason:
        "Publish Readiness bleibt blockiert. Approval wird nicht als Veröffentlichung interpretiert.",
      nextAction: "keep_approval_blocked",
    });
  }
  return buildApprovalGate({
    gateKey: "publish_guard",
    status: "needs_review",
    reviewerVisibleReason:
      "Publish Readiness bleibt getrennt von Approval und published. Dieser Layer bleibt rein semantisch.",
    userVisibleReason:
      "Publish Readiness ist nicht Approval und nicht veröffentlicht.",
    nextAction: "keep_approval_blocked",
  });
}

function buildDistributionGuardGate(input: {
  socialDistributionPreview: SocialDistributionPreview | null | undefined;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return buildApprovalGate({
      gateKey: "distribution_guard",
      status: "not_applicable",
      reviewerVisibleReason: "Script-only erzeugt bewusst keinen Distribution-Folgepfad.",
      userVisibleReason: "Als Script-only bleibt Distribution außen vor.",
      nextAction: "keep_as_script_only",
    });
  }
  if (!input.socialDistributionPreview?.socialDistributionHandoffId) {
    return buildApprovalGate({
      gateKey: "distribution_guard",
      status: "blocked",
      reviewerVisibleReason:
        "Ohne Social-Distribution-Handoff darf Approval keine spätere Ausleitung andeuten.",
      userVisibleReason:
        "Ohne Distribution-Handoff bleibt Approval weiter blockiert.",
      nextAction: "blocked",
    });
  }
  if (
    input.socialDistributionPreview.handoffStatus === "blocked_by_runtime_truth" ||
    input.socialDistributionPreview.handoffStatus === "blocked_by_publish_guard" ||
    input.socialDistributionPreview.handoffStatus ===
      "blocked_by_missing_publish_readiness_guard"
  ) {
    return buildApprovalGate({
      gateKey: "distribution_guard",
      status: "blocked",
      reviewerVisibleReason:
        `Distribution bleibt blockiert: ${voxyRenderSocialDistributionHandoffStatusLabel(
          input.socialDistributionPreview.handoffStatus,
        )}.`,
      userVisibleReason:
        "Distribution bleibt blockiert. Approval erzeugt keinen Upload, keinen Post und keine Veröffentlichung.",
      nextAction: "keep_approval_blocked",
    });
  }
  return buildApprovalGate({
    gateKey: "distribution_guard",
    status: "needs_review",
    reviewerVisibleReason:
      "Distribution Handoff bleibt review-first und ist kein Social Post.",
    userVisibleReason:
      "Distribution-Handoff ist kein Social Posting und keine Veröffentlichung.",
    nextAction: "keep_approval_blocked",
  });
}

function buildRuntimeGate(input: {
  publishGuardPreview: PublishGuardPreview | null | undefined;
  socialDistributionPreview: SocialDistributionPreview | null | undefined;
  keepAsScriptOnly: boolean;
}) {
  if (input.keepAsScriptOnly) {
    return buildApprovalGate({
      gateKey: "runtime",
      status: "not_applicable",
      reviewerVisibleReason: "Script-only erzeugt keine Runtime-Wahrheit.",
      userVisibleReason: "Als Script-only bleibt jede Runtime außen vor.",
      nextAction: "keep_as_script_only",
    });
  }
  if (
    input.publishGuardPreview?.guardStatus === "blocked_by_runtime_truth" ||
    input.socialDistributionPreview?.handoffStatus === "blocked_by_runtime_truth"
  ) {
    return buildApprovalGate({
      gateKey: "runtime",
      status: "blocked",
      reviewerVisibleReason:
        "Runtime-Wahrheit fehlt weiterhin. Approval darf kein Runtime-Trigger sein.",
      userVisibleReason:
        "Runtime-Wahrheit fehlt weiterhin. Approval bleibt rein semantisch.",
      nextAction: "blocked",
    });
  }
  return buildApprovalGate({
    gateKey: "runtime",
    status: "needs_review",
    reviewerVisibleReason:
      "Es gibt bewusst keine Approval-Runtime. Menschliche Freigabe ist kein Upload-, Scheduling- oder Publish-Trigger.",
    userVisibleReason:
      "Approval ist kein Runtime-Trigger und bleibt nur als Semantik sichtbar.",
    nextAction: "keep_approval_blocked",
  });
}

function buildApprovalCandidateModel(input: {
  approvalCandidate: boolean;
  approvalStatus: VoxyRenderApprovalSemanticsStatus;
  humanApprovalGate: VoxyRenderApprovalGate;
  legalSafetyGate: VoxyRenderApprovalGate;
  sourceCaptionGate: VoxyRenderApprovalGate;
  languageGate: VoxyRenderApprovalGate;
  accessibilityGate: VoxyRenderApprovalGate;
  claimSafetyGate: VoxyRenderApprovalGate;
}) {
  if (!input.approvalCandidate) {
    return {
      approvalCandidateId: null,
      status: "not_applicable",
      reviewerVisibleReason:
        "Ohne belastbaren Review-/Distribution-Kontext bleibt Approval nur als noop-Semantik sichtbar.",
      userVisibleReason:
        "Noch kein Approval-Kandidat. Es gibt keine Freigabe, keinen Upload und keine Veröffentlichung.",
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (
    input.approvalStatus === "blocked_by_missing_distribution_handoff" ||
    input.approvalStatus === "blocked_by_publish_guard" ||
    input.approvalStatus === "blocked_by_missing_media" ||
    input.approvalStatus === "blocked_by_runtime_truth"
  ) {
    return {
      approvalCandidateId: "approval-candidate:blocked",
      status: "blocked",
      reviewerVisibleReason:
        "Approval-Kandidat bleibt blockiert, bis Distribution, Publish Guard, Medien und Runtime-Wahrheit sauber getrennt geklärt sind.",
      userVisibleReason:
        "Approval-Kandidat bleibt blockiert. Es wird nichts hochgeladen, geplant oder veröffentlicht.",
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (input.humanApprovalGate.status === "needs_approval") {
    return {
      approvalCandidateId: "approval-candidate:human-approval",
      status: "needs_human_approval",
      reviewerVisibleReason: input.humanApprovalGate.reviewerVisibleReason,
      userVisibleReason: input.humanApprovalGate.userVisibleReason,
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (
    input.legalSafetyGate.status === "needs_review" ||
    input.claimSafetyGate.status === "needs_review"
  ) {
    return {
      approvalCandidateId: "approval-candidate:legal-review",
      status: "needs_legal_review",
      reviewerVisibleReason:
        "Legal/Safety und Claim-Safety bleiben vor jeder späteren Freigabe reviewpflichtig.",
      userVisibleReason:
        "Vor einer späteren Freigabe bleiben rechtliche und Claim-bezogene Prüfungen offen.",
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (input.sourceCaptionGate.status === "needs_review") {
    return {
      approvalCandidateId: "approval-candidate:source-review",
      status: "needs_source_review",
      reviewerVisibleReason: input.sourceCaptionGate.reviewerVisibleReason,
      userVisibleReason: input.sourceCaptionGate.userVisibleReason,
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (input.languageGate.status === "needs_review") {
    return {
      approvalCandidateId: "approval-candidate:language-review",
      status: "needs_language_review",
      reviewerVisibleReason: input.languageGate.reviewerVisibleReason,
      userVisibleReason: input.languageGate.userVisibleReason,
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  if (input.accessibilityGate.status === "needs_review") {
    return {
      approvalCandidateId: "approval-candidate:accessibility-review",
      status: "needs_accessibility_review",
      reviewerVisibleReason: input.accessibilityGate.reviewerVisibleReason,
      userVisibleReason: input.accessibilityGate.userVisibleReason,
      approvalAllowed: false,
      approved: false,
    } satisfies VoxyRenderApprovalCandidate;
  }
  return {
    approvalCandidateId: "approval-candidate:only",
    status: "candidate_only",
    reviewerVisibleReason:
      "Approval-Kandidat bleibt rein semantisch und ist nicht approved.",
    userVisibleReason:
      "Approval-Kandidat bleibt nur ein Kandidat. Approved bleibt false.",
    approvalAllowed: false,
    approved: false,
  } satisfies VoxyRenderApprovalCandidate;
}

export function deriveVoxyRenderApprovalSemanticsStatus(input: {
  socialDistributionHandoffId?: string | null;
  publishGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewOutcomeTypeHint?: VoxyRenderPreviewOutcomeHandoffType | null;
  reviewReady: boolean;
  approvalCandidate: boolean;
  mediaGate: VoxyRenderApprovalGate;
  humanApprovalGate: VoxyRenderApprovalGate;
  publishGuardGate: VoxyRenderApprovalGate;
  runtimeGate: VoxyRenderApprovalGate;
  approverRef?: ApprovalRef | null;
}) {
  if (!normalizeText(input.socialDistributionHandoffId)) {
    return "blocked_by_missing_distribution_handoff";
  }
  if (
    input.previewOutcomeTypeHint === "keep_as_script_only" ||
    input.publishGuardStatusHint === "keep_as_script_only" ||
    input.socialDistributionStatusHint === "keep_as_script_only"
  ) {
    return "keep_as_script_only";
  }
  if (
    input.publishGuardStatusHint === "blocked_by_runtime_truth" ||
    input.socialDistributionStatusHint === "blocked_by_runtime_truth" ||
    input.runtimeGate.status === "blocked"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (input.publishGuardGate.status === "blocked") {
    return "blocked_by_publish_guard";
  }
  if (input.mediaGate.status === "blocked") {
    return "blocked_by_missing_media";
  }
  if (input.humanApprovalGate.status === "needs_approval") {
    return input.approverRef?.id ? "approval_required" : "blocked_by_missing_human_approval";
  }
  if (input.approvalCandidate) {
    return input.reviewReady ? "approval_required" : "approval_candidate_only";
  }
  return input.reviewReady ? "noop_approval" : "approval_semantics_only";
}

function deriveNextStep(input: {
  approvalStatus: VoxyRenderApprovalSemanticsStatus;
  humanApprovalGate: VoxyRenderApprovalGate;
  legalSafetyGate: VoxyRenderApprovalGate;
  sourceCaptionGate: VoxyRenderApprovalGate;
  languageGate: VoxyRenderApprovalGate;
  accessibilityGate: VoxyRenderApprovalGate;
}) {
  if (
    input.approvalStatus === "blocked_by_missing_distribution_handoff" ||
    input.approvalStatus === "blocked_by_publish_guard" ||
    input.approvalStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked";
  }
  if (input.approvalStatus === "keep_as_script_only") {
    return "keep_as_script_only";
  }
  if (input.approvalStatus === "blocked_by_missing_media") {
    return "require_real_media_file";
  }
  if (input.humanApprovalGate.status === "needs_approval") {
    return "request_human_approval";
  }
  if (input.legalSafetyGate.status === "needs_review") {
    return "require_legal_review";
  }
  if (input.sourceCaptionGate.status === "needs_review") {
    return "require_source_review";
  }
  if (input.languageGate.status === "needs_review") {
    return "require_language_review";
  }
  if (input.accessibilityGate.status === "needs_review") {
    return "require_accessibility_review";
  }
  return "keep_approval_blocked";
}

function buildSummary(input: {
  approvalStatus: VoxyRenderApprovalSemanticsStatus;
  reviewReady: boolean;
  approvalCandidate: boolean;
}) {
  if (input.approvalStatus === "blocked_by_missing_distribution_handoff") {
    return {
      userVisibleSummary:
        "Ohne Distribution-Handoff bleibt Approval blockiert. Es gibt keinen Upload, kein Posting, kein Scheduling und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "Approval-Semantik bleibt ohne Distribution-Handoff rein hypothetisch und darf keine Runtime-Wahrheit behaupten.",
    };
  }
  if (input.approvalStatus === "blocked_by_publish_guard") {
    return {
      userVisibleSummary:
        "Der Publish Guard blockiert weiter. Approval wird bewusst nicht mit Publish, Upload oder Posting verwechselt.",
      reviewerVisibleSummary:
        "Publish-Readiness-Blocker bleiben vorgelagert. Approval darf daraus keine Veröffentlichung oder Ausführung ableiten.",
    };
  }
  if (input.approvalStatus === "blocked_by_missing_media") {
    return {
      userVisibleSummary:
        "Ohne echte Medien-Datei bleibt Approval blockiert. Es wird nichts hochgeladen oder veröffentlicht.",
      reviewerVisibleSummary:
        "Fehlende Medienwahrheit blockiert Approval als spätere Freigabesemantik. Keine Fake-Datei, keine Fake-URL.",
    };
  }
  if (input.approvalStatus === "blocked_by_missing_human_approval") {
    return {
      userVisibleSummary:
        "Menschliche Freigabe wäre später nötig. Approved bleibt false, Upload und Publish ebenfalls false.",
      reviewerVisibleSummary:
        "Approval-Kandidat ist nicht approved. Ohne benannte menschliche Freigabe bleibt der Status rein blockiert.",
    };
  }
  if (input.approvalStatus === "blocked_by_runtime_truth") {
    return {
      userVisibleSummary:
        "Runtime-Wahrheit fehlt weiterhin. Approval bleibt rein semantisch und löst nichts aus.",
      reviewerVisibleSummary:
        "Runtime-Wahrheit fehlt weiterhin. Human approval ist kein Runtime-Trigger und bleibt audit-only/noop.",
    };
  }
  if (input.approvalStatus === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Fall bleibt bewusst Script-only. Approval wird nicht Richtung Upload, Posting oder Veröffentlichung weitergedacht.",
      reviewerVisibleSummary:
        "Script-only hält Approval, Upload, Scheduling und Publish vollständig getrennt und blockiert.",
    };
  }
  if (input.reviewReady) {
    return {
      userVisibleSummary:
        "Review-ready ist sichtbar, aber nicht approved. Approval bleibt getrennt von Upload, Posting und Veröffentlichung.",
      reviewerVisibleSummary:
        "Review-ready ist nicht approved. Approval-Kandidat bleibt rein semantisch, approved bleibt false.",
    };
  }
  if (input.approvalCandidate) {
    return {
      userVisibleSummary:
        "Approval-Kandidat ist sichtbar, aber nicht approved. Es gibt keinen Upload, kein Scheduling und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "approval_candidate bleibt strikt getrennt von approved, uploaded, scheduled, social_posted und published.",
    };
  }
  return {
    userVisibleSummary:
      "Approval Semantik bleibt rein review-first/noop. Review-ready ist nicht approved und approved ist nicht published.",
    reviewerVisibleSummary:
      "Approval-Semantik zeigt nur spätere menschliche Freigabebedarfe. Kein Upload, kein Social Posting, kein Scheduling, keine Veröffentlichung.",
  };
}

function buildTopBlockers(input: {
  approvalStatus: VoxyRenderApprovalSemanticsStatus;
  humanApprovalGate: VoxyRenderApprovalGate;
  legalSafetyGate: VoxyRenderApprovalGate;
  sourceCaptionGate: VoxyRenderApprovalGate;
  languageGate: VoxyRenderApprovalGate;
  accessibilityGate: VoxyRenderApprovalGate;
  mediaGate: VoxyRenderApprovalGate;
  publishGuardGate: VoxyRenderApprovalGate;
  distributionGuardGate: VoxyRenderApprovalGate;
  runtimeGate: VoxyRenderApprovalGate;
}) {
  return uniqueStrings([
    input.approvalStatus === "blocked_by_missing_distribution_handoff"
      ? input.distributionGuardGate.userVisibleReason
      : null,
    input.approvalStatus === "blocked_by_publish_guard"
      ? input.publishGuardGate.userVisibleReason
      : null,
    input.approvalStatus === "blocked_by_missing_media"
      ? input.mediaGate.userVisibleReason
      : null,
    input.humanApprovalGate.status === "needs_approval"
      ? input.humanApprovalGate.userVisibleReason
      : null,
    input.legalSafetyGate.status === "needs_review"
      ? input.legalSafetyGate.userVisibleReason
      : null,
    input.sourceCaptionGate.status === "needs_review"
      ? input.sourceCaptionGate.userVisibleReason
      : null,
    input.languageGate.status === "needs_review"
      ? input.languageGate.userVisibleReason
      : null,
    input.accessibilityGate.status === "needs_review"
      ? input.accessibilityGate.userVisibleReason
      : null,
    input.runtimeGate.status === "blocked" ? input.runtimeGate.userVisibleReason : null,
  ]);
}

function buildApprovalSemanticsId(input: {
  socialDistributionHandoffId: string | null;
  publishReadinessGuardId: string | null;
  previewReviewFlowId: string | null;
}) {
  const seed =
    input.socialDistributionHandoffId ??
    input.publishReadinessGuardId ??
    input.previewReviewFlowId ??
    "preview";
  return `voxy-render-approval-semantics:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderApprovalSemanticsCommandFromReadmodels(
  input: BuildApprovalSemanticsInput,
): VoxyRenderApprovalSemanticsCommand | null {
  const publishGuardPreview = resolvePublishGuardPreview(input) ?? null;
  const socialDistributionPreview = resolveSocialDistributionPreview(input) ?? null;
  if (!publishGuardPreview && !socialDistributionPreview && !input.previewFlow) {
    return null;
  }

  const scriptRef = pickFirstRef(
    socialDistributionPreview?.scriptRef ?? null,
    publishGuardPreview?.scriptRef ?? null,
    input.latestRequestDraft?.scriptRef ?? null,
    input.gate?.scriptRef ?? null,
  );
  const contributionRef = pickFirstRef(
    socialDistributionPreview?.contributionRef ?? null,
    publishGuardPreview?.contributionRef ?? null,
    input.latestRequestDraft?.contributionRef ?? null,
    input.gate?.contributionRef ?? null,
  );
  const dossierRef = pickFirstRef(
    socialDistributionPreview?.dossierRef ?? null,
    publishGuardPreview?.dossierRef ?? null,
    input.latestRequestDraft?.dossierRef ?? null,
    input.gate?.dossierRef ?? null,
  );
  const reviewerRef = pickFirstRef(
    input.reviewerRef ?? null,
    publishGuardPreview?.reviewerRef ?? null,
    socialDistributionPreview?.reviewerRef ?? null,
  );
  const approverRef = pickFirstRef(input.approverRef ?? null);
  const reviewReady = isReviewReady(publishGuardPreview, socialDistributionPreview);
  const keepAsScriptOnly =
    publishGuardPreview?.previewOutcomeTypeHint === "keep_as_script_only" ||
    socialDistributionPreview?.previewOutcomeTypeHint === "keep_as_script_only";
  const approvalCandidate = isApprovalCandidate({
    reviewReady,
    publishGuardPreview,
    socialDistributionPreview,
    previewFlow: input.previewFlow ?? null,
  });

  const humanApprovalGate = buildHumanApprovalGate({
    approvalCandidate,
    reviewReady,
    approverRef,
    keepAsScriptOnly,
  });
  const legalSafetyGate = buildReviewOnlyGate({
    gateKey: "legal_safety",
    approvalCandidate,
    keepAsScriptOnly,
    reviewerVisibleReason:
      "Legal/Safety bleibt vor jeder späteren Freigabe ein eigener menschlicher Review-Schritt.",
    userVisibleReason:
      "Rechtliche und Safety-Prüfung bleibt vor jeder späteren Freigabe offen.",
    nextAction: "require_legal_review",
  });
  const sourceCaptionGate = buildReviewOnlyGate({
    gateKey: "source_caption",
    approvalCandidate,
    keepAsScriptOnly,
    reviewerVisibleReason:
      "Source Caption und Quellenkontext bleiben vor späterer Freigabe reviewpflichtig.",
    userVisibleReason:
      "Quellen- und Caption-Prüfung bleibt vor späterer Freigabe offen.",
    nextAction: "require_source_review",
  });
  const claimSafetyGate = buildReviewOnlyGate({
    gateKey: "claim_safety",
    approvalCandidate,
    keepAsScriptOnly,
    reviewerVisibleReason:
      "Claim-Safety bleibt ein eigenständiger menschlicher Review-Schritt.",
    userVisibleReason:
      "Claim-Sicherheit bleibt vor späterer Freigabe offen.",
    nextAction: "require_legal_review",
  });
  const languageGate = buildReviewOnlyGate({
    gateKey: "language",
    approvalCandidate,
    keepAsScriptOnly,
    reviewerVisibleReason: publishGuardPreview?.rtlRequired
      ? "Language/RTL-Gate bleibt offen. RTL-/Lesesprache darf nicht still vereinheitlicht werden."
      : "Language-Gate bleibt offen. Übersetzung bleibt Lesehilfe und kein Beleg.",
    userVisibleReason: publishGuardPreview?.rtlRequired
      ? "Language/RTL-Review bleibt vor späterer Freigabe offen."
      : "Language-Review bleibt vor späterer Freigabe offen.",
    nextAction: "require_language_review",
  });
  const accessibilityGate = buildReviewOnlyGate({
    gateKey: "accessibility",
    approvalCandidate,
    keepAsScriptOnly,
    reviewerVisibleReason:
      "Accessibility bleibt vor jeder späteren Freigabe ein eigener Review-Schritt.",
    userVisibleReason:
      "Accessibility-Review bleibt vor späterer Freigabe offen.",
    nextAction: "require_accessibility_review",
  });
  const mediaGate = buildMediaGate({
    publishGuardPreview,
    approvalCandidate,
    keepAsScriptOnly,
  });
  const publishGuardGate = buildPublishGuardGate({
    publishGuardPreview,
    keepAsScriptOnly,
  });
  const distributionGuardGate = buildDistributionGuardGate({
    socialDistributionPreview,
    keepAsScriptOnly,
  });
  const runtimeGate = buildRuntimeGate({
    publishGuardPreview,
    socialDistributionPreview,
    keepAsScriptOnly,
  });

  const approvalStatus = deriveVoxyRenderApprovalSemanticsStatus({
    socialDistributionHandoffId: socialDistributionPreview?.socialDistributionHandoffId ?? null,
    publishGuardStatusHint: publishGuardPreview?.guardStatus ?? null,
    socialDistributionStatusHint: socialDistributionPreview?.handoffStatus ?? null,
    previewOutcomeTypeHint:
      socialDistributionPreview?.previewOutcomeTypeHint ??
      publishGuardPreview?.previewOutcomeTypeHint ??
      null,
    reviewReady,
    approvalCandidate,
    mediaGate,
    humanApprovalGate,
    publishGuardGate,
    runtimeGate,
    approverRef,
  });
  const candidateModel = buildApprovalCandidateModel({
    approvalCandidate,
    approvalStatus,
    humanApprovalGate,
    legalSafetyGate,
    sourceCaptionGate,
    languageGate,
    accessibilityGate,
    claimSafetyGate,
  });
  const nextStep = deriveNextStep({
    approvalStatus,
    humanApprovalGate,
    legalSafetyGate,
    sourceCaptionGate,
    languageGate,
    accessibilityGate,
  });
  const summary = buildSummary({
    approvalStatus,
    reviewReady,
    approvalCandidate,
  });

  return {
    approvalSemanticsId: buildApprovalSemanticsId({
      socialDistributionHandoffId: socialDistributionPreview?.socialDistributionHandoffId ?? null,
      publishReadinessGuardId: publishGuardPreview?.publishReadinessGuardId ?? null,
      previewReviewFlowId: input.previewFlow?.previewReviewFlowId ?? null,
    }),
    socialDistributionHandoffId: socialDistributionPreview?.socialDistributionHandoffId ?? null,
    publishReadinessGuardId: publishGuardPreview?.publishReadinessGuardId ?? null,
    previewOutcomeHandoffId:
      socialDistributionPreview?.previewOutcomeHandoffId ??
      publishGuardPreview?.previewOutcomeHandoffId ??
      null,
    previewReviewDecisionRecordId:
      socialDistributionPreview?.previewReviewDecisionRecordId ??
      publishGuardPreview?.previewReviewDecisionRecordId ??
      input.latestPreviewReviewDecisionRecord?.decisionRecordId ??
      null,
    previewReviewFlowId:
      socialDistributionPreview?.previewReviewFlowId ??
      publishGuardPreview?.previewReviewFlowId ??
      input.previewFlow?.previewReviewFlowId ??
      null,
    enablementBacklogId:
      socialDistributionPreview?.enablementBacklogId ??
      publishGuardPreview?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      input.previewFlow?.enablementBacklogId ??
      null,
    matrixId:
      socialDistributionPreview?.matrixId ??
      publishGuardPreview?.matrixId ??
      input.latestMatrix?.matrixId ??
      input.previewFlow?.matrixId ??
      null,
    requestDraftId:
      socialDistributionPreview?.requestDraftId ??
      publishGuardPreview?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      input.previewFlow?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef,
    approverRef,
    createdAt:
      normalizeText(input.createdAt) ||
      socialDistributionPreview?.createdAt ||
      publishGuardPreview?.createdAt ||
      null,
    updatedAt:
      socialDistributionPreview?.updatedAt ?? publishGuardPreview?.updatedAt ?? null,
    sourceLanguage:
      socialDistributionPreview?.sourceLanguage ??
      publishGuardPreview?.sourceLanguage ??
      input.previewFlow?.sourceLanguage ??
      "de",
    readingLanguage:
      socialDistributionPreview?.readingLanguage ??
      publishGuardPreview?.readingLanguage ??
      input.previewFlow?.readingLanguage ??
      "de",
    scriptLanguage:
      socialDistributionPreview?.scriptLanguage ??
      publishGuardPreview?.scriptLanguage ??
      input.previewFlow?.scriptLanguage ??
      "de",
    renderLanguage:
      socialDistributionPreview?.renderLanguage ??
      publishGuardPreview?.renderLanguage ??
      input.previewFlow?.renderLanguage ??
      "de",
    subtitleLanguage:
      socialDistributionPreview?.subtitleLanguage ??
      publishGuardPreview?.subtitleLanguage ??
      input.previewFlow?.subtitleLanguage ??
      null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      socialDistributionPreview?.rtlRequired ??
      publishGuardPreview?.rtlRequired ??
      input.previewFlow?.rtlRequired ??
      false,
    approvalStatus,
    approvalCandidate: candidateModel,
    humanApprovalGate,
    legalSafetyGate,
    sourceCaptionGate,
    claimSafetyGate,
    languageGate,
    accessibilityGate,
    mediaGate,
    publishGuardGate,
    distributionGuardGate,
    runtimeGate,
    approvalSemantics: {
      reviewReady,
      publishReady: false,
      approvalCandidate,
      approved: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      published: false,
      autoPublishAllowed: false,
    },
    approvalEffects: buildVoxyRenderApprovalEffects(),
    executionFlags: buildVoxyRenderApprovalExecutionFlags(),
    topBlockers: buildTopBlockers({
      approvalStatus,
      humanApprovalGate,
      legalSafetyGate,
      sourceCaptionGate,
      languageGate,
      accessibilityGate,
      mediaGate,
      publishGuardGate,
      distributionGuardGate,
      runtimeGate,
    }),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    publishGuardStatusHint: publishGuardPreview?.guardStatus ?? null,
    socialDistributionStatusHint: socialDistributionPreview?.handoffStatus ?? null,
    previewOutcomeTypeHint:
      socialDistributionPreview?.previewOutcomeTypeHint ??
      publishGuardPreview?.previewOutcomeTypeHint ??
      null,
    previewOutcomeStatusHint:
      socialDistributionPreview?.previewOutcomeStatusHint ??
      publishGuardPreview?.previewOutcomeStatusHint ??
      null,
    previewReviewDecisionTypeHint:
      socialDistributionPreview?.previewReviewDecisionTypeHint ??
      publishGuardPreview?.previewReviewDecisionTypeHint ??
      input.latestPreviewReviewDecisionRecord?.decisionType ??
      null,
    previewReviewDecisionStatusHint:
      socialDistributionPreview?.previewReviewDecisionStatusHint ??
      publishGuardPreview?.previewReviewDecisionStatusHint ??
      input.latestPreviewReviewDecisionRecord?.decisionStatus ??
      null,
    previewReviewFlowStatusHint:
      socialDistributionPreview?.previewReviewFlowStatusHint ??
      publishGuardPreview?.previewReviewFlowStatusHint ??
      input.previewFlow?.previewStatus ??
      null,
  };
}

export function buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(model);
  const latestBacklog =
    buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model);
  const latestMatrix = buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model);
  const latestRequestDraft = buildVoxyRenderRequestDraftFromCreateCandidatePreview(model);
  const gate = buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model);
  const latestPublishReadinessGuardRecord =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPublishReadinessGuardRecord:
        latestPublishReadinessGuardRecord as VoxyRenderPublishReadinessGuardRecord | null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
    previewFlow,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
  });
}

export function buildVoxyRenderApprovalSemanticsFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestPreviewReviewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestPublishReadinessGuardRecord?: PublishGuardPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  approverRef?: ApprovalRef | null;
}) {
  const previewFlow =
    input.latestPreviewReviewFlow ??
    buildVoxyRenderPreviewReviewFlowFromReviewContext({
      reviewContext: input.reviewContext,
      surface: input.surface ?? "admin",
      latestMatrix: input.latestMatrix ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestBacklog =
    input.latestBacklog ??
    buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
      reviewContext: input.reviewContext,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestMatrix =
    input.latestMatrix ??
    buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
      reviewContext: input.reviewContext,
      latestRequestDraft: input.latestRequestDraft ?? null,
    });
  const latestRequestDraft =
    input.latestRequestDraft ??
    buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext);
  const gate = buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext);
  const latestPublishReadinessGuardRecord =
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    input.latestSocialDistributionHandoffRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPublishReadinessGuardRecord:
        latestPublishReadinessGuardRecord as VoxyRenderPublishReadinessGuardRecord | null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
    previewFlow,
    latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
    latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
    approverRef: input.approverRef ?? null,
  });
}

export function buildVoxyRenderApprovalSemanticsFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "account" | "workspace";
    contributionRef?: ApprovalRef | null;
    nextStep?: string;
    approverRef?: ApprovalRef | null;
  },
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromVoxyDialog(dialog, options);
  const latestBacklog = buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options);
  const latestMatrix = buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options);
  const latestRequestDraft = buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options);
  const gate = buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options);
  const latestPublishReadinessGuardRecord =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  const latestSocialDistributionHandoffRecord =
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPublishReadinessGuardRecord:
        latestPublishReadinessGuardRecord as VoxyRenderPublishReadinessGuardRecord | null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
    previewFlow,
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord,
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
    approverRef: options?.approverRef ?? null,
  });
}

function semanticsLines(semantics: VoxyRenderApprovalSemantics) {
  return [
    semantics.reviewReady
      ? "Review-ready ist sichtbar."
      : "Review-ready ist noch nicht erreicht.",
    semantics.approvalCandidate
      ? "Approval-Kandidat ist sichtbar."
      : "Noch kein Approval-Kandidat sichtbar.",
    "Review-ready ist nicht approved.",
    "Publish-ready ist nicht published.",
    "Approval-Kandidat ist nicht approved.",
    "Approved ist nicht uploaded.",
    "Approved ist nicht scheduled.",
    "Approved ist nicht social_posted.",
    "Approved ist nicht published.",
    "Keine Veröffentlichung.",
  ];
}

function effectLines(effects: VoxyRenderApprovalEffects) {
  return uniqueStrings([
    effects.marksApproved === false ? "Kein Approved-Status wird erzeugt." : null,
    "Kein Upload wird erzeugt.",
    "Kein Schedule wird erzeugt.",
    "Kein Social Post wird erzeugt.",
    "Kein Publish wird ausgelöst.",
    "Kein Render, kein Re-Render, keine Queue, kein Providerlauf.",
    "Keine Medien-Datei, keine Kosten, keine Credits.",
  ]);
}

function auditLines(
  command: VoxyRenderApprovalSemanticsCommand | VoxyRenderApprovalSemanticsRecord,
) {
  return uniqueStrings([
    command.socialDistributionHandoffId
      ? `Distribution Handoff: ${command.socialDistributionHandoffId}`
      : "Noch kein Distribution Handoff referenziert.",
    command.publishReadinessGuardId
      ? `Publish Guard: ${command.publishReadinessGuardId}`
      : "Noch kein Publish Guard referenziert.",
    command.previewReviewDecisionRecordId
      ? `Preview-Review-Entscheidung: ${command.previewReviewDecisionRecordId}`
      : "Noch keine Preview-Review-Entscheidung referenziert.",
    command.previewReviewFlowId
      ? `Preview Review Flow: ${command.previewReviewFlowId}`
      : "Noch kein Preview Review Flow referenziert.",
    command.publishGuardStatusHint
      ? `Publish Readiness: ${voxyRenderPublishReadinessGuardStatusLabel(
          command.publishGuardStatusHint,
        )}`
      : null,
    command.socialDistributionStatusHint
      ? `Social Distribution: ${voxyRenderSocialDistributionHandoffStatusLabel(
          command.socialDistributionStatusHint,
        )}`
      : null,
    command.previewReviewFlowStatusHint
      ? `Preview Review: ${previewReviewFlowStatusLabel(
          command.previewReviewFlowStatusHint,
        )}`
      : null,
    "review_ready ist nicht approved.",
    "publish_readiness ist nicht approval.",
    "approval_candidate ist nicht approved.",
    "approved ist nicht uploaded, scheduled, social_posted oder published.",
  ]);
}

export function buildVoxyRenderApprovalSemanticsPanelModel(input: {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestPreviewOutcomeHandoffRecord?: VoxyRenderPreviewOutcomeHandoffRecord | null;
  latestPreviewReviewDecisionRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  latestPublishReadinessGuardRecord?: PublishGuardPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  approverRef?: ApprovalRef | null;
  latestRecord?: VoxyRenderApprovalSemanticsRecord | null;
  storeState?: VoxyRenderApprovalPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestPreviewOutcomeHandoffRecord: input.latestPreviewOutcomeHandoffRecord ?? null,
      latestPreviewReviewDecisionRecord: input.latestPreviewReviewDecisionRecord ?? null,
      latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
      latestSocialDistributionHandoffRecord: input.latestSocialDistributionHandoffRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
      approverRef: input.approverRef ?? null,
    });
  if (!preview) return null;

  const active = input.latestRecord ?? preview;
  const storeState = input.storeState ?? defaultStoreState();
  const gateRows = [
    active.humanApprovalGate,
    active.legalSafetyGate,
    active.sourceCaptionGate,
    active.claimSafetyGate,
    active.languageGate,
    active.accessibilityGate,
    active.mediaGate,
    active.publishGuardGate,
    active.distributionGuardGate,
    active.runtimeGate,
  ].map((gate) => ({
    ...gate,
    statusLabel: approvalGateStatusLabel(gate.status),
    nextStepLabel: voxyRenderApprovalNextStepLabel(gate.nextAction),
  }));

  return {
    title: "Approval Semantik",
    summary:
      "Dieser Layer beschreibt nur, welche menschliche Freigabe später nötig wäre. Er ist kein Upload, kein Posting, kein Scheduling und keine Veröffentlichung.",
    preview,
    approvalStatusLabel: voxyRenderApprovalSemanticsStatusLabel(active.approvalStatus),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          approvalSemanticsId: input.latestRecord.approvalSemanticsId,
          approvalStatusLabel: voxyRenderApprovalSemanticsStatusLabel(
            input.latestRecord.approvalStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          approvalVersion: input.latestRecord.approvalVersion,
          socialDistributionHandoffId: input.latestRecord.socialDistributionHandoffId ?? null,
        }
      : null,
    commandPreview: {
      approvalStatusLabel: voxyRenderApprovalSemanticsStatusLabel(preview.approvalStatus),
      nextStepLabel: voxyRenderApprovalNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      socialDistributionHandoffId: preview.socialDistributionHandoffId,
    },
    candidateLine: `${approvalCandidateStatusLabel(active.approvalCandidate.status)} · ${active.approvalCandidate.userVisibleReason}`,
    gateRows,
    semanticsLines: semanticsLines(active.approvalSemantics),
    effectLines: effectLines(active.approvalEffects),
    auditLines: auditLines(active),
    topBlockers: active.topBlockers,
    nextStep: voxyRenderApprovalNextStepLabel(active.nextStep),
  } satisfies VoxyRenderApprovalSemanticsPanelModel;
}
