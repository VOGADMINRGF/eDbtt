import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type { VoxyRenderApprovalSemanticsCommand, VoxyRenderApprovalSemanticsRecord, VoxyRenderApprovalSemanticsStatus } from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview,
  buildVoxyRenderApprovalSemanticsFromReviewContext,
  buildVoxyRenderApprovalSemanticsFromVoxyDialog,
  voxyRenderApprovalSemanticsStatusLabel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
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

export const VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES = [
  "media_storage_truth_only",
  "noop_media_storage",
  "no_media_file",
  "media_candidate_only",
  "storage_target_needed",
  "storage_policy_needed",
  "metadata_policy_needed",
  "blocked_by_missing_approval_semantics",
  "blocked_by_missing_preview_file",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderMediaStorageTruthStatus =
  (typeof VOXY_RENDER_MEDIA_STORAGE_TRUTH_STATUSES)[number];

export const VOXY_RENDER_MEDIA_CANDIDATE_STATUSES = [
  "candidate_only",
  "no_file",
  "metadata_needed",
  "storage_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderMediaCandidateStatus =
  (typeof VOXY_RENDER_MEDIA_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_MEDIA_KINDS = [
  "preview_video",
  "thumbnail",
  "subtitle_file",
  "source_caption_file",
  "export_bundle",
  "unknown",
] as const;

export type VoxyRenderMediaKind = (typeof VOXY_RENDER_MEDIA_KINDS)[number];

export const VOXY_RENDER_STORAGE_TARGET_PROVIDERS = [
  "unknown",
  "local",
  "vercel_blob",
  "s3",
  "r2",
  "repo_public",
  "external_provider",
  "requirement_only",
] as const;

export type VoxyRenderStorageTargetProvider =
  (typeof VOXY_RENDER_STORAGE_TARGET_PROVIDERS)[number];

export const VOXY_RENDER_STORAGE_TARGET_STATUSES = [
  "requirement_only",
  "not_configured",
  "policy_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderStorageTargetStatus =
  (typeof VOXY_RENDER_STORAGE_TARGET_STATUSES)[number];

export const VOXY_RENDER_MEDIA_STORAGE_NEXT_STEPS = [
  "define_storage_policy",
  "configure_storage_provider",
  "require_real_preview_file",
  "define_metadata_policy",
  "define_retention_policy",
  "keep_media_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderMediaStorageNextStep =
  (typeof VOXY_RENDER_MEDIA_STORAGE_NEXT_STEPS)[number];

export const VOXY_RENDER_MEDIA_STORAGE_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderMediaStorageStoreResultStatus =
  (typeof VOXY_RENDER_MEDIA_STORAGE_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_MEDIA_STORAGE_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderMediaStoragePersistenceMode =
  (typeof VOXY_RENDER_MEDIA_STORAGE_PERSISTENCE_MODES)[number];

type MediaStorageRef = {
  id: string;
  title: string;
  href?: string | null;
};

type ApprovalPreview =
  | VoxyRenderApprovalSemanticsCommand
  | VoxyRenderApprovalSemanticsRecord;

export type VoxyRenderMediaCandidate = {
  mediaCandidateId: string | null;
  status: VoxyRenderMediaCandidateStatus;
  mediaKind: VoxyRenderMediaKind;
  mimeType: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  checksum: string | null;
  width: number | null;
  height: number | null;
  publicUrl: string | null;
  signedUrl: string | null;
  storagePath: string | null;
  generated: false;
  rendered: false;
  uploaded: false;
  playable: false;
  downloadable: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderStorageTarget = {
  targetId: string | null;
  provider: VoxyRenderStorageTargetProvider;
  status: VoxyRenderStorageTargetStatus;
  writeAllowed: false;
  readAllowed: false;
  publicAccessAllowed: false;
  signedAccessAllowed: false;
  retentionPolicyNeeded: true;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderMediaStorageSemantics = {
  mediaCandidate: boolean;
  mediaFileAvailable: false;
  previewFileAvailable: false;
  thumbnailAvailable: false;
  subtitleFileAvailable: false;
  sourceCaptionFileAvailable: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  published: false;
  socialPosted: false;
  scheduled: false;
};

export type VoxyRenderMediaStorageExecutionFlags = {
  createsMediaFile: false;
  createsThumbnail: false;
  createsSubtitleFile: false;
  createsSourceCaptionFile: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  publishAllowed: false;
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
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderMediaStorageTruthCommand = {
  mediaStorageTruthId?: string | null;
  approvalSemanticsId?: string | null;
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewDecisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: MediaStorageRef | null;
  contributionRef?: MediaStorageRef | null;
  dossierRef?: MediaStorageRef | null;
  reviewerRef?: MediaStorageRef | null;
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
  mediaStorageTruthStatus: VoxyRenderMediaStorageTruthStatus;
  mediaCandidate: VoxyRenderMediaCandidate;
  storageTarget: VoxyRenderStorageTarget;
  mediaSemantics: VoxyRenderMediaStorageSemantics;
  executionFlags: VoxyRenderMediaStorageExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderMediaStorageNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderMediaStorageTruthRecord = VoxyRenderMediaStorageTruthCommand & {
  mediaStorageTruthId: string;
  persistedAt: string;
  persistedBy: string | null;
  idempotencyKey: string;
  previousMediaStorageTruthRef: string | null;
  supersedesMediaStorageTruthRef: string | null;
  mediaStorageTruthVersion: number | null;
};

export type VoxyRenderMediaStoragePersistenceState = {
  mode: VoxyRenderMediaStoragePersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: string;
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyRenderMediaStorageStoreResult = {
  ok: boolean;
  status: VoxyRenderMediaStorageStoreResultStatus;
  record: VoxyRenderMediaStorageTruthRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderMediaStorageNextStep;
};

export type VoxyRenderMediaStorageTruthPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderMediaStorageTruthCommand | VoxyRenderMediaStorageTruthRecord;
  mediaStorageTruthStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    mediaStorageTruthId: string;
    mediaStorageTruthStatusLabel: string;
    persistedAt: string;
    persistedBy: string | null;
    mediaStorageTruthVersion: number | null;
    approvalSemanticsId: string | null;
  } | null;
  commandPreview: {
    mediaStorageTruthStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    approvalSemanticsId: string | null | undefined;
  };
  candidateLine: string;
  storageLine: string;
  semanticsLines: string[];
  executionLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

export type BuildMediaStorageTruthInput = {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: MediaStorageRef | null;
  storagePolicyDefined?: boolean;
  storageProviderConfigured?: boolean;
  metadataPolicyDefined?: boolean;
  retentionPolicyDefined?: boolean;
  createdAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sanitizeIdFragment(value: string) {
  return normalizeText(value).replace(/[^a-zA-Z0-9:_-]+/g, "-");
}

function pickFirstRef<T extends MediaStorageRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeText(value.id);
    const title = normalizeText(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: normalizeText(value.href) || null,
    } satisfies MediaStorageRef;
  }
  return null;
}

export function voxyRenderMediaStorageTruthStatusLabel(
  value: VoxyRenderMediaStorageTruthStatus,
) {
  if (value === "media_storage_truth_only") return "Nur Media-/Storage-Wahrheit";
  if (value === "noop_media_storage") return "Noop Media & Storage";
  if (value === "no_media_file") return "Keine Medien-Datei";
  if (value === "media_candidate_only") return "Nur Medien-Kandidat";
  if (value === "storage_target_needed") return "Storage-Ziel fehlt";
  if (value === "storage_policy_needed") return "Storage-Policy fehlt";
  if (value === "metadata_policy_needed") return "Metadaten-Policy fehlt";
  if (value === "blocked_by_missing_approval_semantics") return "Ohne Approval blockiert";
  if (value === "blocked_by_missing_preview_file") return "Preview-Datei fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Als Script pausiert";
}

export function mediaCandidateStatusLabel(value: VoxyRenderMediaCandidateStatus) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "no_file") return "Keine Datei";
  if (value === "metadata_needed") return "Metadaten fehlen";
  if (value === "storage_needed") return "Storage-Plan fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function storageTargetProviderLabel(value: VoxyRenderStorageTargetProvider) {
  if (value === "unknown") return "Unbekannt";
  if (value === "local") return "Lokal";
  if (value === "vercel_blob") return "Vercel Blob";
  if (value === "s3") return "S3";
  if (value === "r2") return "R2";
  if (value === "repo_public") return "Repo/Public";
  if (value === "external_provider") return "Externer Provider";
  return "Nur Requirement";
}

export function storageTargetStatusLabel(value: VoxyRenderStorageTargetStatus) {
  if (value === "requirement_only") return "Nur Requirement";
  if (value === "not_configured") return "Nicht konfiguriert";
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function voxyRenderMediaStorageNextStepLabel(
  value: VoxyRenderMediaStorageNextStep,
) {
  if (value === "define_storage_policy") return "Storage-Policy definieren";
  if (value === "configure_storage_provider") return "Storage-Provider konfigurieren";
  if (value === "require_real_preview_file") return "Echte Preview-Datei verlangen";
  if (value === "define_metadata_policy") return "Metadaten-Policy definieren";
  if (value === "define_retention_policy") return "Retention-Policy definieren";
  if (value === "keep_media_blocked") return "Media weiter blockiert halten";
  if (value === "keep_as_script_only") return "Als Script-only belassen";
  return "Blockiert";
}

function previewReviewFlowStatusLabel(value: VoxyRenderPreviewReviewFlowStatus) {
  if (value === "preview_review_flow_only") return "Preview-Review-Flow";
  if (value === "noop_preview_review") return "Noop-Preview-Review";
  if (value === "no_preview_available") return "Noch kein Preview";
  if (value === "needs_render_runtime") return "Render-Runtime fehlt";
  if (value === "needs_preview_asset") return "Preview-Asset fehlt";
  if (value === "blocked_by_missing_backlog") return "Backlog fehlt";
  if (value === "blocked_by_missing_matrix") return "Matrix fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Als Script pausiert";
}

export function buildVoxyRenderMediaStorageExecutionFlags(): VoxyRenderMediaStorageExecutionFlags {
  return {
    createsMediaFile: false,
    createsThumbnail: false,
    createsSubtitleFile: false,
    createsSourceCaptionFile: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    publishAllowed: false,
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
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderMediaStorageSemantics(): VoxyRenderMediaStorageSemantics {
  return {
    mediaCandidate: true,
    mediaFileAvailable: false,
    previewFileAvailable: false,
    thumbnailAvailable: false,
    subtitleFileAvailable: false,
    sourceCaptionFileAvailable: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    published: false,
    socialPosted: false,
    scheduled: false,
  };
}

export function deriveVoxyRenderMediaStorageTruthStatus(input: {
  approvalSemanticsId: string | null | undefined;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
  mediaCandidateStatus: VoxyRenderMediaCandidateStatus;
  storageTargetStatus: VoxyRenderStorageTargetStatus;
}) {
  const approvalSemanticsId = normalizeText(input.approvalSemanticsId);
  if (!approvalSemanticsId) return "blocked_by_missing_approval_semantics" as const;
  if (
    input.approvalStatusHint === "keep_as_script_only" ||
    input.previewReviewFlowStatusHint === "keep_as_script_only"
  ) {
    return "keep_as_script_only" as const;
  }
  if (
    input.approvalStatusHint === "blocked_by_runtime_truth" ||
    input.previewReviewFlowStatusHint === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth" as const;
  }
  if (
    input.previewReviewFlowStatusHint === "no_preview_available" ||
    input.previewReviewFlowStatusHint === "needs_render_runtime" ||
    input.previewReviewFlowStatusHint === "needs_preview_asset" ||
    input.approvalStatusHint === "blocked_by_missing_media"
  ) {
    return "blocked_by_missing_preview_file" as const;
  }
  if (input.storageTargetStatus === "policy_needed") {
    return "storage_policy_needed" as const;
  }
  if (input.storageTargetStatus === "not_configured") {
    return "storage_target_needed" as const;
  }
  if (input.mediaCandidateStatus === "metadata_needed") {
    return "metadata_policy_needed" as const;
  }
  if (input.mediaCandidateStatus === "candidate_only") {
    return "media_candidate_only" as const;
  }
  if (input.mediaCandidateStatus === "no_file") {
    return "no_media_file" as const;
  }
  if (input.approvalStatusHint === "noop_approval") {
    return "noop_media_storage" as const;
  }
  return "media_storage_truth_only" as const;
}

function buildSummary(input: {
  status: VoxyRenderMediaStorageTruthStatus;
  approvalStatusHint: VoxyRenderApprovalSemanticsStatus | null;
}) {
  if (input.status === "blocked_by_missing_approval_semantics") {
    return {
      userVisibleSummary:
        "Ohne getrennte Approval-Semantik bleibt Media & Storage rein blockiert.",
      reviewerVisibleSummary:
        "Approval-Semantik fehlt. Media-Kandidat, Storage-Ziel und Metadaten bleiben reine Anforderungen.",
    };
  }
  if (input.status === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Flow bleibt bewusst beim Script. Es gibt keine Medien-Datei, keinen Storage-Write und keinen Upload.",
      reviewerVisibleSummary:
        "Script-only pausiert jede Medien-/Storage-Behauptung. Candidate und Storage-Ziel bleiben reine Readmodels.",
    };
  }
  if (input.status === "blocked_by_missing_preview_file") {
    return {
      userVisibleSummary:
        "Noch keine Preview-Datei vorhanden. Deshalb bleiben URL, Storage-Pfad, Upload und Veröffentlichung leer.",
      reviewerVisibleSummary:
        "Preview-Datei fehlt. Media Candidate bleibt explizit ungleich Datei, Storage-Ziel ungleich Storage-Write.",
    };
  }
  if (input.status === "storage_policy_needed") {
    return {
      userVisibleSummary:
        "Eine spätere Preview bräuchte zuerst eine Storage-Policy. Dieser Slice schreibt trotzdem nichts.",
      reviewerVisibleSummary:
        "Storage-Policy fehlt. Kein Pfad darf heute Datei, Bucket, Blob oder Public URL behaupten.",
    };
  }
  if (input.status === "storage_target_needed") {
    return {
      userVisibleSummary:
        "Ein späteres Storage-Ziel ist noch nicht konfiguriert. Es gibt keinen Write und keine URL.",
      reviewerVisibleSummary:
        "Storage-Ziel bleibt unkonfiguriert. Providerwahl und Zugriffsmodell sind offen.",
    };
  }
  if (input.status === "metadata_policy_needed") {
    return {
      userVisibleSummary:
        "Metadaten-Regeln fehlen noch. Deshalb bleibt jede Datei- und Laufzeitbehauptung blockiert.",
      reviewerVisibleSummary:
        "Ohne Metadaten-Policy werden weder MIME-Typ, Größe, Dauer noch Checksumme behauptet.",
    };
  }
  return {
    userVisibleSummary:
      "Media & Storage bleibt ein reiner Wahrheitslayer. Keine Datei, kein Storage-Write, kein Upload, kein Publish.",
    reviewerVisibleSummary:
      `Media-/Storage-Truth bleibt audit-only/noop auf Basis von ${voxyRenderApprovalSemanticsStatusLabel(
        input.approvalStatusHint ?? "approval_required",
      )}.`,
  };
}

function buildMediaCandidate(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  keepAsScriptOnly: boolean;
  metadataPolicyDefined: boolean;
  storagePolicyDefined: boolean;
  storageProviderConfigured: boolean;
}) {
  const previewStatus = input.previewFlow?.previewStatus ?? "no_preview_available";
  const missingPreviewFile =
    previewStatus === "no_preview_available" ||
    previewStatus === "needs_render_runtime" ||
    previewStatus === "needs_preview_asset" ||
    previewStatus === "blocked_by_runtime_truth" ||
    previewStatus === "blocked_by_missing_backlog" ||
    previewStatus === "blocked_by_missing_matrix";

  const status: VoxyRenderMediaCandidateStatus = input.keepAsScriptOnly
    ? "no_file"
    : missingPreviewFile
      ? "no_file"
      : !input.metadataPolicyDefined
        ? "metadata_needed"
        : !input.storagePolicyDefined || !input.storageProviderConfigured
          ? "storage_needed"
          : "candidate_only";

  const reviewerVisibleReason = input.keepAsScriptOnly
    ? "Script-only pausiert jede Preview-Datei. Media Candidate bleibt rein hypothetisch."
    : missingPreviewFile
      ? "Es gibt noch keine echte Preview-Datei. MIME-Typ, Größe, Dauer, Checksumme und Pfad bleiben leer."
      : status === "metadata_needed"
        ? "Ohne Metadaten-Policy bleiben Datei-Eigenschaften unbestimmt."
        : status === "storage_needed"
          ? "Ohne Storage-Policy oder Providerkonfiguration bleibt der Candidate ohne Zielpfad."
          : "Es gibt nur einen späteren Preview-Kandidaten, aber noch keine Datei.";

  const userVisibleReason = input.keepAsScriptOnly
    ? "Der Beitrag bleibt bewusst beim Script. Es gibt noch keine Medien-Datei."
    : missingPreviewFile
      ? "Noch keine Preview-Datei vorhanden."
      : status === "metadata_needed"
        ? "Metadaten-Regeln fehlen noch."
        : status === "storage_needed"
          ? "Storage-Regeln fehlen noch."
          : "Nur ein späterer Medien-Kandidat ist sichtbar.";

  return {
    mediaCandidateId:
      input.previewFlow?.previewReviewFlowId
        ? `voxy-render-media-candidate:${sanitizeIdFragment(
            input.previewFlow.previewReviewFlowId,
          ).slice(0, 56)}`
        : null,
    status,
    mediaKind: "preview_video",
    mimeType: null,
    fileSizeBytes: null,
    durationSeconds: null,
    checksum: null,
    width: null,
    height: null,
    publicUrl: null,
    signedUrl: null,
    storagePath: null,
    generated: false,
    rendered: false,
    uploaded: false,
    playable: false,
    downloadable: false,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderMediaCandidate;
}

function buildStorageTarget(input: {
  keepAsScriptOnly: boolean;
  storagePolicyDefined: boolean;
  storageProviderConfigured: boolean;
}) {
  const status: VoxyRenderStorageTargetStatus = input.keepAsScriptOnly
    ? "requirement_only"
    : !input.storagePolicyDefined
      ? "policy_needed"
      : !input.storageProviderConfigured
        ? "not_configured"
        : "requirement_only";

  const provider: VoxyRenderStorageTargetProvider =
    status === "not_configured" ? "unknown" : "requirement_only";

  const reviewerVisibleReason = input.keepAsScriptOnly
    ? "Script-only pausiert jedes Storage-Ziel. Kein Bucket, kein Blob, kein Repo-Pfad wird aktiviert."
    : status === "policy_needed"
      ? "Ohne Storage-Policy bleibt jedes Ziel nur Requirement. Keine Write-/Read-/Access-Regel ist freigegeben."
      : status === "not_configured"
        ? "Ein späteres Storage-Ziel ist noch nicht konfiguriert. Provider, Pfad und Zugriff bleiben offen."
        : "Storage-Ziel bleibt reine Anforderung ohne Write- oder Access-Wahrheit.";

  const userVisibleReason = input.keepAsScriptOnly
    ? "Kein Storage-Ziel aktiv."
    : status === "policy_needed"
      ? "Storage-Regeln fehlen noch."
      : status === "not_configured"
        ? "Storage ist noch nicht konfiguriert."
        : "Storage bleibt nur vorbereitet.";

  return {
    targetId: null,
    provider,
    status,
    writeAllowed: false,
    readAllowed: false,
    publicAccessAllowed: false,
    signedAccessAllowed: false,
    retentionPolicyNeeded: true,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderStorageTarget;
}

function deriveNextStep(input: {
  status: VoxyRenderMediaStorageTruthStatus;
  storageTarget: VoxyRenderStorageTarget;
  mediaCandidate: VoxyRenderMediaCandidate;
  retentionPolicyDefined: boolean;
}) {
  if (input.status === "blocked_by_missing_approval_semantics") return "blocked" as const;
  if (input.status === "keep_as_script_only") return "keep_as_script_only" as const;
  if (input.status === "blocked_by_runtime_truth") return "keep_media_blocked" as const;
  if (input.status === "blocked_by_missing_preview_file") return "require_real_preview_file" as const;
  if (input.storageTarget.status === "policy_needed") return "define_storage_policy" as const;
  if (input.storageTarget.status === "not_configured") return "configure_storage_provider" as const;
  if (input.mediaCandidate.status === "metadata_needed") return "define_metadata_policy" as const;
  if (!input.retentionPolicyDefined) return "define_retention_policy" as const;
  if (input.status === "media_candidate_only" || input.status === "no_media_file") {
    return "require_real_preview_file" as const;
  }
  return "keep_media_blocked" as const;
}

function buildTopBlockers(input: {
  status: VoxyRenderMediaStorageTruthStatus;
  mediaCandidate: VoxyRenderMediaCandidate;
  storageTarget: VoxyRenderStorageTarget;
  retentionPolicyDefined: boolean;
}) {
  const blockers = [
    input.mediaCandidate.userVisibleReason,
    input.storageTarget.userVisibleReason,
    "Media Candidate ist keine Medien-Datei.",
    "Storage Target ist kein Storage-Write.",
    "Kein Upload, kein Publish und keine Veröffentlichung.",
  ];
  if (input.status === "blocked_by_missing_approval_semantics") {
    blockers.unshift("Ohne Approval-Semantik bleibt Media & Storage blockiert.");
  }
  if (input.status === "blocked_by_missing_preview_file") {
    blockers.unshift("Es gibt noch keine echte Preview-Datei.");
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.unshift("Runtime-Wahrheit fehlt weiterhin.");
  }
  if (input.status === "storage_policy_needed") {
    blockers.unshift("Storage-Policy fehlt weiterhin.");
  }
  if (input.status === "storage_target_needed") {
    blockers.unshift("Storage-Provider ist noch nicht konfiguriert.");
  }
  if (input.status === "metadata_policy_needed") {
    blockers.unshift("Metadaten-Policy fehlt weiterhin.");
  }
  if (!input.retentionPolicyDefined) {
    blockers.push("Retention-Policy fehlt weiterhin.");
  }
  return Array.from(new Set(blockers.map(normalizeText).filter(Boolean))).slice(0, 8);
}

function buildMediaStorageTruthId(input: {
  approvalSemanticsId: string | null;
  previewReviewFlowId: string | null;
}) {
  const seed = input.approvalSemanticsId ?? input.previewReviewFlowId ?? "preview";
  return `voxy-render-media-storage-truth:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderMediaStorageTruthCommandFromReadmodels(
  input: BuildMediaStorageTruthInput,
): VoxyRenderMediaStorageTruthCommand | null {
  const previewFlow = input.previewFlow ?? null;
  const effectiveApprovalPreview = input.latestApprovalSemanticsRecord ?? null;
  if (!effectiveApprovalPreview && !previewFlow) {
    return null;
  }

  const storagePolicyDefined = input.storagePolicyDefined ?? false;
  const storageProviderConfigured = input.storageProviderConfigured ?? false;
  const metadataPolicyDefined = input.metadataPolicyDefined ?? false;
  const retentionPolicyDefined = input.retentionPolicyDefined ?? false;
  const keepAsScriptOnly =
    effectiveApprovalPreview?.approvalStatus === "keep_as_script_only" ||
    previewFlow?.previewStatus === "keep_as_script_only";

  const scriptRef = pickFirstRef(
    effectiveApprovalPreview?.scriptRef ?? null,
    input.latestRequestDraft?.scriptRef ?? null,
    input.gate?.scriptRef ?? null,
  );
  const contributionRef = pickFirstRef(
    effectiveApprovalPreview?.contributionRef ?? null,
    input.latestRequestDraft?.contributionRef ?? null,
    input.gate?.contributionRef ?? null,
  );
  const dossierRef = pickFirstRef(
    effectiveApprovalPreview?.dossierRef ?? null,
    input.latestRequestDraft?.dossierRef ?? null,
    input.gate?.dossierRef ?? null,
  );
  const reviewerRef = pickFirstRef(
    input.reviewerRef ?? null,
    effectiveApprovalPreview?.reviewerRef ?? null,
  );

  const mediaCandidate = buildMediaCandidate({
    previewFlow,
    keepAsScriptOnly,
    metadataPolicyDefined,
    storagePolicyDefined,
    storageProviderConfigured,
  });
  const storageTarget = buildStorageTarget({
    keepAsScriptOnly,
    storagePolicyDefined,
    storageProviderConfigured,
  });
  const mediaStorageTruthStatus = deriveVoxyRenderMediaStorageTruthStatus({
    approvalSemanticsId: effectiveApprovalPreview?.approvalSemanticsId ?? null,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
    mediaCandidateStatus: mediaCandidate.status,
    storageTargetStatus: storageTarget.status,
  });
  const nextStep = deriveNextStep({
    status: mediaStorageTruthStatus,
    storageTarget,
    mediaCandidate,
    retentionPolicyDefined,
  });
  const summary = buildSummary({
    status: mediaStorageTruthStatus,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
  });

  return {
    mediaStorageTruthId: buildMediaStorageTruthId({
      approvalSemanticsId: effectiveApprovalPreview?.approvalSemanticsId ?? null,
      previewReviewFlowId: previewFlow?.previewReviewFlowId ?? null,
    }),
    approvalSemanticsId: effectiveApprovalPreview?.approvalSemanticsId ?? null,
    socialDistributionHandoffId: effectiveApprovalPreview?.socialDistributionHandoffId ?? null,
    publishReadinessGuardId: effectiveApprovalPreview?.publishReadinessGuardId ?? null,
    previewOutcomeHandoffId: effectiveApprovalPreview?.previewOutcomeHandoffId ?? null,
    previewReviewDecisionRecordId:
      effectiveApprovalPreview?.previewReviewDecisionRecordId ?? null,
    previewReviewFlowId:
      effectiveApprovalPreview?.previewReviewFlowId ?? previewFlow?.previewReviewFlowId ?? null,
    enablementBacklogId:
      effectiveApprovalPreview?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      previewFlow?.enablementBacklogId ??
      null,
    matrixId:
      effectiveApprovalPreview?.matrixId ??
      input.latestMatrix?.matrixId ??
      previewFlow?.matrixId ??
      null,
    requestDraftId:
      effectiveApprovalPreview?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      previewFlow?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef,
    createdAt:
      normalizeText(input.createdAt) ||
      effectiveApprovalPreview?.createdAt ||
      null,
    updatedAt: effectiveApprovalPreview?.updatedAt ?? null,
    sourceLanguage:
      effectiveApprovalPreview?.sourceLanguage ?? previewFlow?.sourceLanguage ?? "de",
    readingLanguage:
      effectiveApprovalPreview?.readingLanguage ?? previewFlow?.readingLanguage ?? "de",
    scriptLanguage:
      effectiveApprovalPreview?.scriptLanguage ?? previewFlow?.scriptLanguage ?? "de",
    renderLanguage:
      effectiveApprovalPreview?.renderLanguage ?? previewFlow?.renderLanguage ?? "de",
    subtitleLanguage:
      effectiveApprovalPreview?.subtitleLanguage ?? previewFlow?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      effectiveApprovalPreview?.rtlRequired ?? previewFlow?.rtlRequired ?? false,
    mediaStorageTruthStatus,
    mediaCandidate,
    storageTarget,
    mediaSemantics: buildVoxyRenderMediaStorageSemantics(),
    executionFlags: buildVoxyRenderMediaStorageExecutionFlags(),
    topBlockers: buildTopBlockers({
      status: mediaStorageTruthStatus,
      mediaCandidate,
      storageTarget,
      retentionPolicyDefined,
    }),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
  };
}

export function buildVoxyRenderMediaStorageTruthFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(model);
  return buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
    previewFlow,
    latestApprovalSemanticsRecord:
      buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview(model),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
    latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderMediaStorageTruthFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestPreviewReviewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
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
  return buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
    previewFlow,
    latestApprovalSemanticsRecord:
      input.latestApprovalSemanticsRecord ??
      buildVoxyRenderApprovalSemanticsFromReviewContext({
        reviewContext: input.reviewContext,
        surface: input.surface ?? "admin",
        latestPreviewReviewFlow: previewFlow,
        latestBacklog: input.latestBacklog ?? null,
        latestMatrix: input.latestMatrix ?? null,
        latestRequestDraft: input.latestRequestDraft ?? null,
      }),
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
      input.latestRequestDraft ??
      buildVoxyRenderRequestDraftFromReviewContext(input.reviewContext),
    gate: buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext),
  });
}

export function buildVoxyRenderMediaStorageTruthFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account";
    contributionRef?: MediaStorageRef | null;
    nextStep?: string | null;
  },
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromVoxyDialog(dialog, options);
  const approvalOptions = {
    ...options,
    surface: options?.surface === "create" ? "account" : options?.surface,
  } as const;
  return buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
    previewFlow,
    latestApprovalSemanticsRecord: buildVoxyRenderApprovalSemanticsFromVoxyDialog(dialog, approvalOptions),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options),
    latestRequestDraft: buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options),
    gate: buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options),
  });
}

function defaultStoreState(): VoxyRenderMediaStoragePersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Media-/Storage-Truth-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Readmodel-Vorschau. Es entsteht weder Storage-Write noch Upload noch Veröffentlichung.",
    repositoryInterface: "VoxyRenderMediaStorageTruthRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

function semanticsLines(value: VoxyRenderMediaStorageSemantics) {
  return [
    value.mediaCandidate ? "Media Candidate bleibt sichtbar" : "Kein Media Candidate sichtbar",
    "media_file_available bleibt false",
    "preview_file_available bleibt false",
    "thumbnail_available bleibt false",
    "storage_write_allowed bleibt false",
    "upload_allowed bleibt false",
    "published bleibt false",
  ];
}

function executionLines(value: VoxyRenderMediaStorageExecutionFlags) {
  return [
    "Keine Medien-Datei wird erzeugt",
    "Kein Thumbnail wird erzeugt",
    "Kein Subtitle- oder Caption-File wird erzeugt",
    "Kein Storage-Write ist erlaubt",
    "Kein Upload ist erlaubt",
    "Kein Publish, kein Scheduling und kein Social Posting sind erlaubt",
    value.providerExecutionAllowed
      ? "Provider wäre erlaubt"
      : "Kein Providerlauf, keine Queue und kein Worker sind erlaubt",
  ];
}

function auditLines(
  command: VoxyRenderMediaStorageTruthCommand | VoxyRenderMediaStorageTruthRecord,
) {
  return [
    command.approvalSemanticsId
      ? `Approval-Semantik: ${command.approvalSemanticsId}`
      : "Noch keine Approval-Semantik referenziert.",
    command.previewReviewFlowId
      ? `Preview Review Flow: ${command.previewReviewFlowId}`
      : "Noch kein Preview Review Flow referenziert.",
    command.approvalStatusHint
      ? `Approval-Status: ${voxyRenderApprovalSemanticsStatusLabel(command.approvalStatusHint)}`
      : "Noch kein Approval-Status-Hinweis sichtbar.",
    command.previewReviewFlowStatusHint
      ? `Preview Review: ${previewReviewFlowStatusLabel(command.previewReviewFlowStatusHint)}`
      : "Noch kein Preview-Review-Hinweis sichtbar.",
  ];
}

export function buildVoxyRenderMediaStorageTruthPanelModel(input: {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderMediaStorageTruthRecord | null;
  storeState?: VoxyRenderMediaStoragePersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  if (!preview) return null;

  const active = input.latestRecord ?? preview;
  const storeState = input.storeState ?? defaultStoreState();

  return {
    title: "Media & Storage",
    summary:
      "Dieser Layer beschreibt nur, was später einmal eine echte Preview-Datei, ein Storage-Ziel und Metadaten bräuchten. Er erzeugt heute keine Datei, keinen Storage-Write und keinen Upload.",
    preview,
    mediaStorageTruthStatusLabel: voxyRenderMediaStorageTruthStatusLabel(
      active.mediaStorageTruthStatus,
    ),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          mediaStorageTruthId: input.latestRecord.mediaStorageTruthId,
          mediaStorageTruthStatusLabel: voxyRenderMediaStorageTruthStatusLabel(
            input.latestRecord.mediaStorageTruthStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          mediaStorageTruthVersion: input.latestRecord.mediaStorageTruthVersion,
          approvalSemanticsId: input.latestRecord.approvalSemanticsId ?? null,
        }
      : null,
    commandPreview: {
      mediaStorageTruthStatusLabel: voxyRenderMediaStorageTruthStatusLabel(
        preview.mediaStorageTruthStatus,
      ),
      nextStepLabel: voxyRenderMediaStorageNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      approvalSemanticsId: preview.approvalSemanticsId,
    },
    candidateLine: `${mediaCandidateStatusLabel(active.mediaCandidate.status)} · ${active.mediaCandidate.userVisibleReason}`,
    storageLine: `${storageTargetProviderLabel(active.storageTarget.provider)} · ${storageTargetStatusLabel(active.storageTarget.status)} · ${active.storageTarget.userVisibleReason}`,
    semanticsLines: semanticsLines(active.mediaSemantics),
    executionLines: executionLines(active.executionFlags),
    auditLines: auditLines(active),
    topBlockers: active.topBlockers,
    nextStep: voxyRenderMediaStorageNextStepLabel(active.nextStep),
  } satisfies VoxyRenderMediaStorageTruthPanelModel;
}
