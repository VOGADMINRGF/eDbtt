import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyRenderApprovalSemanticsCommand,
  VoxyRenderApprovalSemanticsRecord,
  VoxyRenderApprovalSemanticsStatus,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview,
  buildVoxyRenderApprovalSemanticsFromReviewContext,
  buildVoxyRenderApprovalSemanticsFromVoxyDialog,
  voxyRenderApprovalSemanticsStatusLabel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import type {
  VoxyRenderMediaStorageTruthCommand,
  VoxyRenderMediaStorageTruthRecord,
  VoxyRenderMediaStorageTruthStatus,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  buildVoxyRenderMediaStorageTruthCommandFromReadmodels,
  voxyRenderMediaStorageTruthStatusLabel,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
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
  VoxyRenderPublishReadinessGuardCommand,
  VoxyRenderPublishReadinessGuardRecord,
  VoxyRenderPublishReadinessGuardStatus,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderPublishReadinessGuardCommandFromReadmodels,
  voxyRenderPublishReadinessGuardStatusLabel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
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
import type {
  VoxyRenderSocialDistributionHandoffCommand,
  VoxyRenderSocialDistributionHandoffRecord,
  VoxyRenderSocialDistributionHandoffStatus,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels,
  voxyRenderSocialDistributionHandoffStatusLabel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";

export const VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES = [
  "upload_target_policy_only",
  "noop_upload_policy",
  "no_upload_target",
  "upload_candidate_only",
  "storage_provider_needed",
  "access_policy_needed",
  "signed_access_policy_needed",
  "retention_policy_needed",
  "deletion_policy_needed",
  "blocked_by_missing_media_storage_truth",
  "blocked_by_missing_media_file",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderUploadTargetPolicyStatus =
  (typeof VOXY_RENDER_UPLOAD_TARGET_POLICY_STATUSES)[number];

export const VOXY_RENDER_UPLOAD_TARGET_CANDIDATE_STATUSES = [
  "candidate_only",
  "no_target",
  "provider_needed",
  "access_policy_needed",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderUploadTargetCandidateStatus =
  (typeof VOXY_RENDER_UPLOAD_TARGET_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_UPLOAD_TARGET_PROVIDERS = [
  "unknown",
  "local",
  "vercel_blob",
  "s3",
  "r2",
  "external_provider",
  "requirement_only",
] as const;

export type VoxyRenderUploadTargetProvider =
  (typeof VOXY_RENDER_UPLOAD_TARGET_PROVIDERS)[number];

export const VOXY_RENDER_UPLOAD_ACCESS_VISIBILITIES = [
  "private",
  "internal_review_only",
  "public_candidate",
  "unknown",
] as const;

export type VoxyRenderUploadAccessVisibility =
  (typeof VOXY_RENDER_UPLOAD_ACCESS_VISIBILITIES)[number];

export const VOXY_RENDER_UPLOAD_POLICY_CANDIDATE_STATUSES = [
  "policy_needed",
  "candidate_only",
  "blocked",
  "not_applicable",
] as const;

export type VoxyRenderUploadPolicyCandidateStatus =
  (typeof VOXY_RENDER_UPLOAD_POLICY_CANDIDATE_STATUSES)[number];

export const VOXY_RENDER_UPLOAD_TARGET_POLICY_NEXT_STEPS = [
  "define_upload_target",
  "configure_storage_provider",
  "define_access_policy",
  "define_signed_access_policy",
  "define_retention_policy",
  "define_deletion_policy",
  "require_real_media_file",
  "keep_upload_blocked",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderUploadTargetPolicyNextStep =
  (typeof VOXY_RENDER_UPLOAD_TARGET_POLICY_NEXT_STEPS)[number];

export const VOXY_RENDER_UPLOAD_TARGET_POLICY_STORE_RESULT_STATUSES = [
  "preview_only",
  "noop",
  "blocked",
  "persisted",
] as const;

export type VoxyRenderUploadTargetPolicyStoreResultStatus =
  (typeof VOXY_RENDER_UPLOAD_TARGET_POLICY_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_UPLOAD_TARGET_POLICY_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderUploadTargetPolicyPersistenceMode =
  (typeof VOXY_RENDER_UPLOAD_TARGET_POLICY_PERSISTENCE_MODES)[number];

type UploadTargetPolicyRef = {
  id: string;
  title: string;
  href?: string | null;
};

type MediaStorageTruthPreview =
  | VoxyRenderMediaStorageTruthCommand
  | VoxyRenderMediaStorageTruthRecord;

type ApprovalPreview =
  | VoxyRenderApprovalSemanticsCommand
  | VoxyRenderApprovalSemanticsRecord;

type PublishReadinessPreview =
  | VoxyRenderPublishReadinessGuardCommand
  | VoxyRenderPublishReadinessGuardRecord;

type SocialDistributionPreview =
  | VoxyRenderSocialDistributionHandoffCommand
  | VoxyRenderSocialDistributionHandoffRecord;

export type VoxyRenderUploadTargetCandidate = {
  uploadTargetCandidateId: string | null;
  status: VoxyRenderUploadTargetCandidateStatus;
  provider: VoxyRenderUploadTargetProvider;
  bucketOrContainer: string | null;
  basePath: string | null;
  publicBaseUrl: string | null;
  writeAllowed: false;
  uploadAllowed: false;
  publicAccessAllowed: false;
  signedAccessAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderUploadAccessPolicy = {
  accessPolicyId: string | null;
  visibility: VoxyRenderUploadAccessVisibility;
  signedAccessCandidate: boolean;
  signedUrlCreated: false;
  publicUrlCreated: false;
  downloadAllowed: false;
  shareAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderUploadRetentionPolicy = {
  retentionPolicyId: string | null;
  status: VoxyRenderUploadPolicyCandidateStatus;
  retentionDays: number | null;
  deletionJobCreated: false;
  deletionAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderUploadDeletionPolicy = {
  deletionPolicyId: string | null;
  status: VoxyRenderUploadPolicyCandidateStatus;
  deletionJobCreated: false;
  deletionAllowed: false;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderUploadSemantics = {
  uploadCandidate: boolean;
  uploadReady: false;
  uploaded: false;
  storageWriteAllowed: false;
  signedUrlAvailable: false;
  publicUrlAvailable: false;
  mediaFileAvailable: false;
  previewFileAvailable: false;
  published: false;
  socialPosted: false;
  scheduled: false;
};

export type VoxyRenderUploadExecutionFlags = {
  uploadAllowed: false;
  storageWriteAllowed: false;
  signedUrlCreationAllowed: false;
  publicUrlCreationAllowed: false;
  deletionJobAllowed: false;
  publishAllowed: false;
  schedulingAllowed: false;
  socialPostAllowed: false;
  autoPublishAllowed: false;
  createsMediaFile: false;
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

export type VoxyRenderUploadTargetPolicyCommand = {
  uploadTargetPolicyId?: string | null;
  mediaStorageTruthId?: string | null;
  approvalSemanticsId?: string | null;
  socialDistributionHandoffId?: string | null;
  publishReadinessGuardId?: string | null;
  previewOutcomeHandoffId?: string | null;
  previewReviewFlowId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  scriptRef?: UploadTargetPolicyRef | null;
  contributionRef?: UploadTargetPolicyRef | null;
  dossierRef?: UploadTargetPolicyRef | null;
  reviewerRef?: UploadTargetPolicyRef | null;
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
  uploadTargetPolicyStatus: VoxyRenderUploadTargetPolicyStatus;
  uploadTargetCandidate: VoxyRenderUploadTargetCandidate;
  accessPolicy: VoxyRenderUploadAccessPolicy;
  signedAccessPolicyDefined: boolean;
  retentionPolicy: VoxyRenderUploadRetentionPolicy;
  deletionPolicy: VoxyRenderUploadDeletionPolicy;
  uploadSemantics: VoxyRenderUploadSemantics;
  executionFlags: VoxyRenderUploadExecutionFlags;
  topBlockers: string[];
  nextStep: VoxyRenderUploadTargetPolicyNextStep;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  mediaStorageTruthStatusHint?: VoxyRenderMediaStorageTruthStatus | null;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  publishReadinessGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionHandoffStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderUploadTargetPolicyRecord =
  VoxyRenderUploadTargetPolicyCommand & {
    uploadTargetPolicyId: string;
    persistedAt: string;
    persistedBy: string | null;
    idempotencyKey: string;
    previousUploadTargetPolicyRef: string | null;
    supersedesUploadTargetPolicyRef: string | null;
    uploadTargetPolicyVersion: number | null;
  };

export type VoxyRenderUploadTargetPolicyPersistenceState = {
  mode: VoxyRenderUploadTargetPolicyPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: string;
  storeKind: "mongo_collection" | "in_memory";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "unavailable";
};

export type VoxyRenderUploadTargetPolicyStoreResult = {
  ok: boolean;
  status: VoxyRenderUploadTargetPolicyStoreResultStatus;
  record: VoxyRenderUploadTargetPolicyRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: VoxyRenderUploadTargetPolicyNextStep;
};

export type VoxyRenderUploadTargetPolicyPanelModel = {
  title: string;
  summary: string;
  preview: VoxyRenderUploadTargetPolicyCommand | VoxyRenderUploadTargetPolicyRecord;
  uploadTargetPolicyStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    uploadTargetPolicyId: string;
    uploadTargetPolicyStatusLabel: string;
    persistedAt: string;
    persistedBy: string | null;
    uploadTargetPolicyVersion: number | null;
    mediaStorageTruthId: string | null;
  } | null;
  commandPreview: {
    uploadTargetPolicyStatusLabel: string;
    nextStepLabel: string;
    createdAt: string | null | undefined;
    mediaStorageTruthId: string | null | undefined;
  };
  uploadTargetLine: string;
  accessPolicyLine: string;
  signedAccessLine: string;
  retentionPolicyLine: string;
  deletionPolicyLine: string;
  semanticsLines: string[];
  executionLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

export type BuildUploadTargetPolicyInput = {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  reviewerRef?: UploadTargetPolicyRef | null;
  uploadTargetDefined?: boolean;
  storageProviderConfigured?: boolean;
  accessPolicyDefined?: boolean;
  accessVisibility?: VoxyRenderUploadAccessVisibility | null;
  signedAccessPolicyDefined?: boolean;
  signedAccessCandidate?: boolean;
  retentionPolicyDefined?: boolean;
  deletionPolicyDefined?: boolean;
  mediaFileAvailableOverride?: boolean;
  previewFileAvailableOverride?: boolean;
  createdAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sanitizeIdFragment(value: string) {
  return normalizeText(value).replace(/[^a-zA-Z0-9:_-]+/g, "-");
}

function pickFirstRef<T extends UploadTargetPolicyRef | null | undefined>(...values: T[]) {
  for (const value of values) {
    if (!value) continue;
    const id = normalizeText(value.id);
    const title = normalizeText(value.title);
    if (!id || !title) continue;
    return {
      id,
      title,
      href: normalizeText(value.href) || null,
    } satisfies UploadTargetPolicyRef;
  }
  return null;
}

function asPublishReadinessRecord(
  value: PublishReadinessPreview | null | undefined,
): VoxyRenderPublishReadinessGuardRecord | null {
  if (!value) return null;
  return "persistedAt" in value ? value : null;
}

export function voxyRenderUploadTargetPolicyStatusLabel(
  value: VoxyRenderUploadTargetPolicyStatus,
) {
  if (value === "upload_target_policy_only") return "Nur Upload-Policy";
  if (value === "noop_upload_policy") return "Noop Upload-Policy";
  if (value === "no_upload_target") return "Kein Upload-Ziel";
  if (value === "upload_candidate_only") return "Nur Upload-Kandidat";
  if (value === "storage_provider_needed") return "Storage-Provider fehlt";
  if (value === "access_policy_needed") return "Access-Policy fehlt";
  if (value === "signed_access_policy_needed") return "Signed-Access-Policy fehlt";
  if (value === "retention_policy_needed") return "Retention-Policy fehlt";
  if (value === "deletion_policy_needed") return "Deletion-Policy fehlt";
  if (value === "blocked_by_missing_media_storage_truth") {
    return "Ohne Media-/Storage-Wahrheit blockiert";
  }
  if (value === "blocked_by_missing_media_file") return "Medien-Datei fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Als Script pausiert";
}

export function uploadTargetCandidateStatusLabel(
  value: VoxyRenderUploadTargetCandidateStatus,
) {
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "no_target") return "Kein Ziel";
  if (value === "provider_needed") return "Provider fehlt";
  if (value === "access_policy_needed") return "Access-Regel fehlt";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function uploadTargetProviderLabel(value: VoxyRenderUploadTargetProvider) {
  if (value === "unknown") return "Unbekannt";
  if (value === "local") return "Lokal";
  if (value === "vercel_blob") return "Vercel Blob";
  if (value === "s3") return "S3";
  if (value === "r2") return "R2";
  if (value === "external_provider") return "Externer Provider";
  return "Nur Requirement";
}

export function uploadAccessVisibilityLabel(value: VoxyRenderUploadAccessVisibility) {
  if (value === "private") return "Privat";
  if (value === "internal_review_only") return "Nur internes Review";
  if (value === "public_candidate") return "Öffentlicher Kandidat";
  return "Noch offen";
}

export function uploadPolicyCandidateStatusLabel(
  value: VoxyRenderUploadPolicyCandidateStatus,
) {
  if (value === "policy_needed") return "Policy fehlt";
  if (value === "candidate_only") return "Nur Kandidat";
  if (value === "blocked") return "Blockiert";
  return "Nicht anwendbar";
}

export function voxyRenderUploadTargetPolicyNextStepLabel(
  value: VoxyRenderUploadTargetPolicyNextStep,
) {
  if (value === "define_upload_target") return "Upload-Ziel definieren";
  if (value === "configure_storage_provider") return "Storage-Provider konfigurieren";
  if (value === "define_access_policy") return "Access-Policy definieren";
  if (value === "define_signed_access_policy") return "Signed-Access-Policy definieren";
  if (value === "define_retention_policy") return "Retention-Policy definieren";
  if (value === "define_deletion_policy") return "Deletion-Policy definieren";
  if (value === "require_real_media_file") return "Echte Medien-Datei verlangen";
  if (value === "keep_upload_blocked") return "Upload weiter blockiert halten";
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

export function buildVoxyRenderUploadExecutionFlags(): VoxyRenderUploadExecutionFlags {
  return {
    uploadAllowed: false,
    storageWriteAllowed: false,
    signedUrlCreationAllowed: false,
    publicUrlCreationAllowed: false,
    deletionJobAllowed: false,
    publishAllowed: false,
    schedulingAllowed: false,
    socialPostAllowed: false,
    autoPublishAllowed: false,
    createsMediaFile: false,
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

export function buildVoxyRenderUploadSemantics(input?: {
  uploadCandidate?: boolean;
}): VoxyRenderUploadSemantics {
  return {
    uploadCandidate: input?.uploadCandidate ?? true,
    uploadReady: false,
    uploaded: false,
    storageWriteAllowed: false,
    signedUrlAvailable: false,
    publicUrlAvailable: false,
    mediaFileAvailable: false,
    previewFileAvailable: false,
    published: false,
    socialPosted: false,
    scheduled: false,
  };
}

export function deriveVoxyRenderUploadTargetPolicyStatus(input: {
  mediaStorageTruthId: string | null | undefined;
  mediaStorageTruthStatusHint?: VoxyRenderMediaStorageTruthStatus | null;
  approvalStatusHint?: VoxyRenderApprovalSemanticsStatus | null;
  publishReadinessGuardStatusHint?: VoxyRenderPublishReadinessGuardStatus | null;
  socialDistributionHandoffStatusHint?: VoxyRenderSocialDistributionHandoffStatus | null;
  previewReviewFlowStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
  mediaFileAvailable: boolean;
  uploadTargetStatus: VoxyRenderUploadTargetCandidateStatus;
  accessPolicyVisibility: VoxyRenderUploadAccessVisibility;
  signedAccessCandidate: boolean;
  signedAccessPolicyDefined: boolean;
  retentionPolicyStatus: VoxyRenderUploadPolicyCandidateStatus;
  deletionPolicyStatus: VoxyRenderUploadPolicyCandidateStatus;
}) {
  const mediaStorageTruthId = normalizeText(input.mediaStorageTruthId);
  if (!mediaStorageTruthId) return "blocked_by_missing_media_storage_truth" as const;
  if (
    input.mediaStorageTruthStatusHint === "keep_as_script_only" ||
    input.approvalStatusHint === "keep_as_script_only" ||
    input.previewReviewFlowStatusHint === "keep_as_script_only"
  ) {
    return "keep_as_script_only" as const;
  }
  if (
    input.mediaStorageTruthStatusHint === "blocked_by_runtime_truth" ||
    input.approvalStatusHint === "blocked_by_runtime_truth" ||
    input.publishReadinessGuardStatusHint === "blocked_by_runtime_truth" ||
    input.socialDistributionHandoffStatusHint === "blocked_by_runtime_truth" ||
    input.previewReviewFlowStatusHint === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth" as const;
  }
  if (!input.mediaFileAvailable) {
    return "blocked_by_missing_media_file" as const;
  }
  if (input.uploadTargetStatus === "no_target") {
    return "no_upload_target" as const;
  }
  if (input.uploadTargetStatus === "provider_needed") {
    return "storage_provider_needed" as const;
  }
  if (
    input.uploadTargetStatus === "access_policy_needed" ||
    input.accessPolicyVisibility === "unknown"
  ) {
    return "access_policy_needed" as const;
  }
  if (input.signedAccessCandidate && !input.signedAccessPolicyDefined) {
    return "signed_access_policy_needed" as const;
  }
  if (input.retentionPolicyStatus === "policy_needed") {
    return "retention_policy_needed" as const;
  }
  if (input.deletionPolicyStatus === "policy_needed") {
    return "deletion_policy_needed" as const;
  }
  if (
    input.mediaStorageTruthStatusHint === "noop_media_storage" ||
    input.approvalStatusHint === "noop_approval"
  ) {
    return "noop_upload_policy" as const;
  }
  if (input.uploadTargetStatus === "candidate_only") {
    return "upload_candidate_only" as const;
  }
  return "upload_target_policy_only" as const;
}

function buildSummary(input: {
  status: VoxyRenderUploadTargetPolicyStatus;
  mediaStorageTruthStatusHint: VoxyRenderMediaStorageTruthStatus | null;
}) {
  if (input.status === "blocked_by_missing_media_storage_truth") {
    return {
      userVisibleSummary:
        "Ohne getrennte Media-/Storage-Wahrheit bleibt jede Upload-Policy rein blockiert.",
      reviewerVisibleSummary:
        "Media-/Storage-Wahrheit fehlt. Upload-Ziel, Access, Retention und Deletion bleiben reine Anforderungen.",
    };
  }
  if (input.status === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Flow bleibt bewusst beim Script. Es gibt kein Upload-Ziel, keinen Storage-Write und keine Signed URL.",
      reviewerVisibleSummary:
        "Script-only pausiert jede Upload-Target-Policy. Upload- und Access-Kandidaten bleiben rein hypothetisch.",
    };
  }
  if (input.status === "blocked_by_missing_media_file") {
    return {
      userVisibleSummary:
        "Ohne echte Medien-Datei bleibt jede Upload-Policy nur vorbereitend. Es gibt keinen Upload und keine URL.",
      reviewerVisibleSummary:
        "Medien-Datei fehlt. Upload-Ziel, Access-Policy und Retention bleiben streng getrennt von Upload, Signed URL und Veröffentlichung.",
    };
  }
  if (input.status === "no_upload_target") {
    return {
      userVisibleSummary:
        "Ein späteres Upload-Ziel ist noch nicht beschrieben. Heute gibt es weder Upload noch Storage-Write.",
      reviewerVisibleSummary:
        "Upload-Ziel fehlt. Kein Bucket, kein Container, kein Pfad und keine Public Base URL werden behauptet.",
    };
  }
  if (input.status === "storage_provider_needed") {
    return {
      userVisibleSummary:
        "Ein späterer Storage-Provider ist noch nicht geklärt. Es entsteht weiterhin kein Upload.",
      reviewerVisibleSummary:
        "Storage-Provider-Konfiguration fehlt. Upload-Target bleibt ohne Write-, Access- und URL-Wahrheit.",
    };
  }
  if (input.status === "access_policy_needed") {
    return {
      userVisibleSummary:
        "Access-Regeln fehlen noch. Deshalb bleibt jeder spätere Dateizugriff blockiert.",
      reviewerVisibleSummary:
        "Access-Policy fehlt. Sichtbarkeit, Download- und Share-Regeln werden nicht still erfunden.",
    };
  }
  if (input.status === "signed_access_policy_needed") {
    return {
      userVisibleSummary:
        "Signed-Access-Regeln fehlen noch. Es gibt keine Signed URL und keinen Download-Link.",
      reviewerVisibleSummary:
        "Signed Access bleibt nur Kandidat. Keine URL wird erzeugt oder behauptet.",
    };
  }
  if (input.status === "retention_policy_needed") {
    return {
      userVisibleSummary:
        "Retention-Regeln fehlen noch. Heute wird nichts gelöscht und nichts gespeichert.",
      reviewerVisibleSummary:
        "Retention-Policy fehlt. Keine Aufbewahrungsdauer und kein Deletion-Job werden behauptet.",
    };
  }
  if (input.status === "deletion_policy_needed") {
    return {
      userVisibleSummary:
        "Deletion-Regeln fehlen noch. Es gibt keinen Delete-Job und keine automatische Löschung.",
      reviewerVisibleSummary:
        "Deletion-Policy fehlt. Retention bleibt strikt getrennt von realer Löschung.",
    };
  }
  return {
    userVisibleSummary:
      "Upload Target Policy bleibt ein reiner Wahrheitslayer. Kein Upload, keine Signed URL, keine Public URL und keine Veröffentlichung.",
    reviewerVisibleSummary:
      `Upload-Target-Policy bleibt audit-only/noop auf Basis von ${voxyRenderMediaStorageTruthStatusLabel(
        input.mediaStorageTruthStatusHint ?? "media_storage_truth_only",
      )}.`,
  };
}

function buildUploadTargetCandidate(input: {
  mediaStorageTruthId: string | null;
  keepAsScriptOnly: boolean;
  mediaStorageTruthAvailable: boolean;
  uploadTargetDefined: boolean;
  storageProviderConfigured: boolean;
  accessPolicyDefined: boolean;
}) {
  const status: VoxyRenderUploadTargetCandidateStatus = !input.mediaStorageTruthAvailable
    ? "blocked"
    : input.keepAsScriptOnly
      ? "no_target"
      : !input.uploadTargetDefined
        ? "no_target"
        : !input.storageProviderConfigured
          ? "provider_needed"
          : !input.accessPolicyDefined
            ? "access_policy_needed"
            : "candidate_only";

  const reviewerVisibleReason = !input.mediaStorageTruthAvailable
    ? "Ohne Media-/Storage-Wahrheit bleibt jeder Upload-Target-Kandidat blockiert."
    : input.keepAsScriptOnly
      ? "Script-only pausiert jedes Upload-Ziel. Kein Bucket, kein Container und kein Pfad werden aktiviert."
      : status === "no_target"
        ? "Upload-Ziel ist noch nicht definiert. upload_target bleibt ungleich uploaded."
        : status === "provider_needed"
          ? "Ein späterer Provider ist noch nicht konfiguriert. storage_target bleibt ungleich storage_write."
          : status === "access_policy_needed"
            ? "Access-Regeln fehlen noch. Sichtbarkeit und Zugriff bleiben offen."
            : "Ein späteres Upload-Ziel bleibt nur Kandidat. Es entsteht trotzdem kein Upload.";

  const userVisibleReason = !input.mediaStorageTruthAvailable
    ? "Media-/Storage-Wahrheit fehlt."
    : input.keepAsScriptOnly
      ? "Kein Upload-Ziel aktiv."
      : status === "no_target"
        ? "Noch kein Upload-Ziel definiert."
        : status === "provider_needed"
          ? "Storage-Provider fehlt noch."
          : status === "access_policy_needed"
            ? "Access-Regeln fehlen noch."
            : "Nur ein späterer Upload-Kandidat ist sichtbar.";

  return {
    uploadTargetCandidateId:
      input.uploadTargetDefined && input.mediaStorageTruthId
        ? `voxy-render-upload-target-candidate:${sanitizeIdFragment(
            input.mediaStorageTruthId,
          ).slice(0, 48)}`
        : null,
    status,
    provider:
      status === "provider_needed"
        ? "unknown"
        : input.mediaStorageTruthAvailable
          ? "requirement_only"
          : "unknown",
    bucketOrContainer: null,
    basePath: null,
    publicBaseUrl: null,
    writeAllowed: false,
    uploadAllowed: false,
    publicAccessAllowed: false,
    signedAccessAllowed: false,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderUploadTargetCandidate;
}

function buildAccessPolicy(input: {
  mediaStorageTruthId: string | null;
  keepAsScriptOnly: boolean;
  accessPolicyDefined: boolean;
  accessVisibility: VoxyRenderUploadAccessVisibility;
  signedAccessCandidate: boolean;
}) {
  const reviewerVisibleReason = !input.mediaStorageTruthId
    ? "Ohne Media-/Storage-Wahrheit gibt es keine belastbare Access-Policy."
    : input.keepAsScriptOnly
      ? "Script-only pausiert jede Access- und Sichtbarkeitsregel."
      : !input.accessPolicyDefined
        ? "Access-Policy fehlt. visibility bleibt ungleich Zugriff und public_candidate bleibt ungleich public asset."
        : input.signedAccessCandidate
          ? "Signed Access bleibt nur Kandidat. signed_access_candidate ist nicht signed_url."
          : "Access-Policy bleibt reine Kandidatenregel ohne URL- oder Download-Wahrheit.";

  const userVisibleReason = !input.mediaStorageTruthId
    ? "Access-Regeln fehlen."
    : input.keepAsScriptOnly
      ? "Kein Access-Ziel aktiv."
      : !input.accessPolicyDefined
        ? "Access-Regeln fehlen noch."
        : input.signedAccessCandidate
          ? "Späterer Signed Access ist nur vorbereitet."
          : "Access-Policy bleibt nur vorbereitet.";

  return {
    accessPolicyId:
      input.accessPolicyDefined && input.mediaStorageTruthId
        ? `voxy-render-upload-access-policy:${sanitizeIdFragment(
            input.mediaStorageTruthId,
          ).slice(0, 48)}`
        : null,
    visibility: input.accessPolicyDefined ? input.accessVisibility : "unknown",
    signedAccessCandidate: input.accessPolicyDefined ? input.signedAccessCandidate : false,
    signedUrlCreated: false,
    publicUrlCreated: false,
    downloadAllowed: false,
    shareAllowed: false,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderUploadAccessPolicy;
}

function buildRetentionPolicy(input: {
  mediaStorageTruthId: string | null;
  keepAsScriptOnly: boolean;
  retentionPolicyDefined: boolean;
}) {
  const status: VoxyRenderUploadPolicyCandidateStatus = !input.mediaStorageTruthId
    ? "blocked"
    : input.keepAsScriptOnly
      ? "not_applicable"
      : input.retentionPolicyDefined
        ? "candidate_only"
        : "policy_needed";

  const reviewerVisibleReason = !input.mediaStorageTruthId
    ? "Ohne Media-/Storage-Wahrheit bleibt auch Retention blockiert."
    : input.keepAsScriptOnly
      ? "Script-only pausiert jede Retention-Regel."
      : status === "policy_needed"
        ? "Retention-Policy fehlt. retention_policy ist kein deletion_job."
        : "Retention bleibt reine Kandidatenregel ohne Löschung oder Aufbewahrungsjob.";

  const userVisibleReason = !input.mediaStorageTruthId
    ? "Retention-Regeln fehlen."
    : input.keepAsScriptOnly
      ? "Keine Retention aktiv."
      : status === "policy_needed"
        ? "Retention-Regeln fehlen noch."
        : "Retention bleibt nur vorbereitet.";

  return {
    retentionPolicyId:
      input.retentionPolicyDefined && input.mediaStorageTruthId
        ? `voxy-render-upload-retention-policy:${sanitizeIdFragment(
            input.mediaStorageTruthId,
          ).slice(0, 48)}`
        : null,
    status,
    retentionDays: null,
    deletionJobCreated: false,
    deletionAllowed: false,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderUploadRetentionPolicy;
}

function buildDeletionPolicy(input: {
  mediaStorageTruthId: string | null;
  keepAsScriptOnly: boolean;
  deletionPolicyDefined: boolean;
}) {
  const status: VoxyRenderUploadPolicyCandidateStatus = !input.mediaStorageTruthId
    ? "blocked"
    : input.keepAsScriptOnly
      ? "not_applicable"
      : input.deletionPolicyDefined
        ? "candidate_only"
        : "policy_needed";

  const reviewerVisibleReason = !input.mediaStorageTruthId
    ? "Ohne Media-/Storage-Wahrheit bleibt auch Deletion blockiert."
    : input.keepAsScriptOnly
      ? "Script-only pausiert jede Löschregel."
      : status === "policy_needed"
        ? "Deletion-Policy fehlt. delete job bleibt streng getrennt von Policy."
        : "Deletion bleibt reine Kandidatenregel ohne Job, Scheduler oder Ausführung.";

  const userVisibleReason = !input.mediaStorageTruthId
    ? "Löschregeln fehlen."
    : input.keepAsScriptOnly
      ? "Keine Löschung aktiv."
      : status === "policy_needed"
        ? "Löschregeln fehlen noch."
        : "Löschung bleibt nur vorbereitet.";

  return {
    deletionPolicyId:
      input.deletionPolicyDefined && input.mediaStorageTruthId
        ? `voxy-render-upload-deletion-policy:${sanitizeIdFragment(
            input.mediaStorageTruthId,
          ).slice(0, 48)}`
        : null,
    status,
    deletionJobCreated: false,
    deletionAllowed: false,
    reviewerVisibleReason,
    userVisibleReason,
  } satisfies VoxyRenderUploadDeletionPolicy;
}

function deriveNextStep(input: {
  status: VoxyRenderUploadTargetPolicyStatus;
  uploadTargetCandidate: VoxyRenderUploadTargetCandidate;
  accessPolicy: VoxyRenderUploadAccessPolicy;
  retentionPolicy: VoxyRenderUploadRetentionPolicy;
  deletionPolicy: VoxyRenderUploadDeletionPolicy;
  signedAccessPolicyDefined: boolean;
}) {
  if (input.status === "blocked_by_missing_media_storage_truth") return "blocked" as const;
  if (input.status === "keep_as_script_only") return "keep_as_script_only" as const;
  if (input.status === "blocked_by_missing_media_file") return "require_real_media_file" as const;
  if (input.status === "blocked_by_runtime_truth") return "keep_upload_blocked" as const;
  if (input.uploadTargetCandidate.status === "no_target") return "define_upload_target" as const;
  if (input.uploadTargetCandidate.status === "provider_needed") {
    return "configure_storage_provider" as const;
  }
  if (
    input.uploadTargetCandidate.status === "access_policy_needed" ||
    input.accessPolicy.visibility === "unknown"
  ) {
    return "define_access_policy" as const;
  }
  if (input.accessPolicy.signedAccessCandidate && !input.signedAccessPolicyDefined) {
    return "define_signed_access_policy" as const;
  }
  if (input.retentionPolicy.status === "policy_needed") return "define_retention_policy" as const;
  if (input.deletionPolicy.status === "policy_needed") return "define_deletion_policy" as const;
  return "keep_upload_blocked" as const;
}

function buildTopBlockers(input: {
  status: VoxyRenderUploadTargetPolicyStatus;
  uploadTargetCandidate: VoxyRenderUploadTargetCandidate;
  accessPolicy: VoxyRenderUploadAccessPolicy;
  retentionPolicy: VoxyRenderUploadRetentionPolicy;
  deletionPolicy: VoxyRenderUploadDeletionPolicy;
}) {
  const blockers = [
    input.uploadTargetCandidate.userVisibleReason,
    input.accessPolicy.userVisibleReason,
    input.retentionPolicy.userVisibleReason,
    input.deletionPolicy.userVisibleReason,
    "upload_target ist nicht uploaded.",
    "storage_policy ist nicht storage_write.",
    "signed_access_candidate ist nicht signed_url.",
    "retention_policy ist kein deletion_job.",
  ];
  if (input.status === "blocked_by_missing_media_storage_truth") {
    blockers.unshift("Media-/Storage-Wahrheit fehlt weiterhin.");
  }
  if (input.status === "blocked_by_missing_media_file") {
    blockers.unshift("Es gibt noch keine echte Medien-Datei.");
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.unshift("Runtime-Wahrheit fehlt weiterhin.");
  }
  return Array.from(new Set(blockers.map(normalizeText).filter(Boolean))).slice(0, 10);
}

function buildUploadTargetPolicyId(input: {
  mediaStorageTruthId: string | null;
  previewReviewFlowId: string | null;
}) {
  const seed = input.mediaStorageTruthId ?? input.previewReviewFlowId ?? "upload-policy";
  return `voxy-render-upload-target-policy:${sanitizeIdFragment(seed).slice(0, 56)}`;
}

export function buildVoxyRenderUploadTargetPolicyCommandFromReadmodels(
  input: BuildUploadTargetPolicyInput,
): VoxyRenderUploadTargetPolicyCommand | null {
  const previewFlow = input.previewFlow ?? null;
  const effectiveApprovalPreview = input.latestApprovalSemanticsRecord ?? null;
  const effectivePublishReadinessPreview =
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  const effectiveSocialDistributionPreview =
    input.latestSocialDistributionHandoffRecord ??
    buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPublishReadinessGuardRecord: asPublishReadinessRecord(
        effectivePublishReadinessPreview,
      ),
      latestPreviewReviewDecisionRecord: null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  const effectiveMediaStoragePreview =
    input.latestMediaStorageTruthRecord ??
    buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord: effectiveApprovalPreview ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });

  const hasAnyUpstream = Boolean(
    effectiveMediaStoragePreview ||
      effectiveApprovalPreview ||
      effectivePublishReadinessPreview ||
      effectiveSocialDistributionPreview ||
      previewFlow ||
      input.latestRequestDraft ||
      input.gate,
  );
  if (!hasAnyUpstream) return null;

  const mediaStorageTruthId = effectiveMediaStoragePreview?.mediaStorageTruthId ?? null;
  const mediaStorageTruthAvailable = Boolean(mediaStorageTruthId);
  const keepAsScriptOnly =
    effectiveMediaStoragePreview?.mediaStorageTruthStatus === "keep_as_script_only" ||
    effectiveApprovalPreview?.approvalStatus === "keep_as_script_only" ||
    previewFlow?.previewStatus === "keep_as_script_only";
  const accessPolicyDefined = input.accessPolicyDefined ?? false;
  const accessVisibility =
    input.accessVisibility ?? (accessPolicyDefined ? "internal_review_only" : "unknown");
  const signedAccessCandidate =
    input.signedAccessCandidate ?? (accessPolicyDefined ? true : false);
  const signedAccessPolicyDefined = input.signedAccessPolicyDefined ?? false;
  const mediaFileAvailable =
    input.mediaFileAvailableOverride ??
    effectiveMediaStoragePreview?.mediaSemantics.mediaFileAvailable ??
    false;
  const previewFileAvailable =
    input.previewFileAvailableOverride ??
    effectiveMediaStoragePreview?.mediaSemantics.previewFileAvailable ??
    false;

  const scriptRef = pickFirstRef(
    effectiveMediaStoragePreview?.scriptRef ?? null,
    effectiveApprovalPreview?.scriptRef ?? null,
    input.latestRequestDraft?.scriptRef ?? null,
    input.gate?.scriptRef ?? null,
  );
  const contributionRef = pickFirstRef(
    effectiveMediaStoragePreview?.contributionRef ?? null,
    effectiveApprovalPreview?.contributionRef ?? null,
    input.latestRequestDraft?.contributionRef ?? null,
    input.gate?.contributionRef ?? null,
  );
  const dossierRef = pickFirstRef(
    effectiveMediaStoragePreview?.dossierRef ?? null,
    effectiveApprovalPreview?.dossierRef ?? null,
    input.latestRequestDraft?.dossierRef ?? null,
    input.gate?.dossierRef ?? null,
  );
  const reviewerRef = pickFirstRef(
    input.reviewerRef ?? null,
    effectiveMediaStoragePreview?.reviewerRef ?? null,
    effectiveApprovalPreview?.reviewerRef ?? null,
  );

  const uploadTargetCandidate = buildUploadTargetCandidate({
    mediaStorageTruthId,
    keepAsScriptOnly,
    mediaStorageTruthAvailable,
    uploadTargetDefined: input.uploadTargetDefined ?? false,
    storageProviderConfigured: input.storageProviderConfigured ?? false,
    accessPolicyDefined,
  });
  const accessPolicy = buildAccessPolicy({
    mediaStorageTruthId,
    keepAsScriptOnly,
    accessPolicyDefined,
    accessVisibility,
    signedAccessCandidate,
  });
  const retentionPolicy = buildRetentionPolicy({
    mediaStorageTruthId,
    keepAsScriptOnly,
    retentionPolicyDefined: input.retentionPolicyDefined ?? false,
  });
  const deletionPolicy = buildDeletionPolicy({
    mediaStorageTruthId,
    keepAsScriptOnly,
    deletionPolicyDefined: input.deletionPolicyDefined ?? false,
  });
  const uploadTargetPolicyStatus = deriveVoxyRenderUploadTargetPolicyStatus({
    mediaStorageTruthId,
    mediaStorageTruthStatusHint: effectiveMediaStoragePreview?.mediaStorageTruthStatus ?? null,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    publishReadinessGuardStatusHint: effectivePublishReadinessPreview?.guardStatus ?? null,
    socialDistributionHandoffStatusHint: effectiveSocialDistributionPreview?.handoffStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
    mediaFileAvailable,
    uploadTargetStatus: uploadTargetCandidate.status,
    accessPolicyVisibility: accessPolicy.visibility,
    signedAccessCandidate: accessPolicy.signedAccessCandidate,
    signedAccessPolicyDefined,
    retentionPolicyStatus: retentionPolicy.status,
    deletionPolicyStatus: deletionPolicy.status,
  });
  const nextStep = deriveNextStep({
    status: uploadTargetPolicyStatus,
    uploadTargetCandidate,
    accessPolicy,
    retentionPolicy,
    deletionPolicy,
    signedAccessPolicyDefined,
  });
  const summary = buildSummary({
    status: uploadTargetPolicyStatus,
    mediaStorageTruthStatusHint: effectiveMediaStoragePreview?.mediaStorageTruthStatus ?? null,
  });

  return {
    uploadTargetPolicyId: buildUploadTargetPolicyId({
      mediaStorageTruthId,
      previewReviewFlowId:
        effectiveMediaStoragePreview?.previewReviewFlowId ??
        previewFlow?.previewReviewFlowId ??
        null,
    }),
    mediaStorageTruthId,
    approvalSemanticsId: effectiveMediaStoragePreview?.approvalSemanticsId ?? null,
    socialDistributionHandoffId:
      effectiveMediaStoragePreview?.socialDistributionHandoffId ??
      effectiveApprovalPreview?.socialDistributionHandoffId ??
      null,
    publishReadinessGuardId:
      effectiveMediaStoragePreview?.publishReadinessGuardId ??
      effectiveApprovalPreview?.publishReadinessGuardId ??
      effectivePublishReadinessPreview?.publishReadinessGuardId ??
      null,
    previewOutcomeHandoffId:
      effectiveMediaStoragePreview?.previewOutcomeHandoffId ??
      effectiveApprovalPreview?.previewOutcomeHandoffId ??
      effectivePublishReadinessPreview?.previewOutcomeHandoffId ??
      effectiveSocialDistributionPreview?.previewOutcomeHandoffId ??
      null,
    previewReviewFlowId:
      effectiveMediaStoragePreview?.previewReviewFlowId ??
      effectiveApprovalPreview?.previewReviewFlowId ??
      previewFlow?.previewReviewFlowId ??
      null,
    enablementBacklogId:
      effectiveMediaStoragePreview?.enablementBacklogId ??
      input.latestBacklog?.backlogId ??
      previewFlow?.enablementBacklogId ??
      null,
    matrixId:
      effectiveMediaStoragePreview?.matrixId ??
      input.latestMatrix?.matrixId ??
      previewFlow?.matrixId ??
      null,
    requestDraftId:
      effectiveMediaStoragePreview?.requestDraftId ??
      input.latestRequestDraft?.requestDraftId ??
      previewFlow?.requestDraftId ??
      null,
    scriptRef,
    contributionRef,
    dossierRef,
    reviewerRef,
    createdAt:
      normalizeText(input.createdAt) ||
      effectiveMediaStoragePreview?.createdAt ||
      effectiveApprovalPreview?.createdAt ||
      null,
    updatedAt:
      effectiveMediaStoragePreview?.updatedAt ??
      effectiveApprovalPreview?.updatedAt ??
      null,
    sourceLanguage:
      effectiveMediaStoragePreview?.sourceLanguage ??
      effectiveApprovalPreview?.sourceLanguage ??
      previewFlow?.sourceLanguage ??
      "de",
    readingLanguage:
      effectiveMediaStoragePreview?.readingLanguage ??
      effectiveApprovalPreview?.readingLanguage ??
      previewFlow?.readingLanguage ??
      "de",
    scriptLanguage:
      effectiveMediaStoragePreview?.scriptLanguage ??
      effectiveApprovalPreview?.scriptLanguage ??
      previewFlow?.scriptLanguage ??
      "de",
    renderLanguage:
      effectiveMediaStoragePreview?.renderLanguage ??
      effectiveApprovalPreview?.renderLanguage ??
      previewFlow?.renderLanguage ??
      "de",
    subtitleLanguage:
      effectiveMediaStoragePreview?.subtitleLanguage ??
      effectiveApprovalPreview?.subtitleLanguage ??
      previewFlow?.subtitleLanguage ??
      null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired:
      effectiveMediaStoragePreview?.rtlRequired ??
      effectiveApprovalPreview?.rtlRequired ??
      previewFlow?.rtlRequired ??
      false,
    uploadTargetPolicyStatus,
    uploadTargetCandidate,
    accessPolicy,
    signedAccessPolicyDefined,
    retentionPolicy,
    deletionPolicy,
    uploadSemantics: buildVoxyRenderUploadSemantics({
      uploadCandidate: effectiveMediaStoragePreview?.mediaSemantics.mediaCandidate ?? true,
    }),
    executionFlags: buildVoxyRenderUploadExecutionFlags(),
    topBlockers: buildTopBlockers({
      status: uploadTargetPolicyStatus,
      uploadTargetCandidate,
      accessPolicy,
      retentionPolicy,
      deletionPolicy,
    }),
    nextStep,
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    mediaStorageTruthStatusHint: effectiveMediaStoragePreview?.mediaStorageTruthStatus ?? null,
    approvalStatusHint: effectiveApprovalPreview?.approvalStatus ?? null,
    publishReadinessGuardStatusHint: effectivePublishReadinessPreview?.guardStatus ?? null,
    socialDistributionHandoffStatusHint: effectiveSocialDistributionPreview?.handoffStatus ?? null,
    previewReviewFlowStatusHint: previewFlow?.previewStatus ?? null,
  };
}

export function buildVoxyRenderUploadTargetPolicyFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromCreateCandidatePreview(model);
  const latestPublishReadinessGuardRecord = buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
    previewFlow,
    latestPreviewOutcomeHandoffRecord: null,
    latestPreviewReviewDecisionRecord: null,
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
    latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
  });
  return buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
    previewFlow,
    latestApprovalSemanticsRecord:
      buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview(model),
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord:
      buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewOutcomeHandoffRecord: null,
        latestPublishReadinessGuardRecord: asPublishReadinessRecord(
          latestPublishReadinessGuardRecord,
        ),
        latestPreviewReviewDecisionRecord: null,
        latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
        latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
        latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
        gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
      }),
    latestMediaStorageTruthRecord: buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord:
        buildVoxyRenderApprovalSemanticsFromCreateCandidatePreview(model),
      latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
      latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
      latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
      gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
    }),
    latestBacklog: buildVoxyRenderRuntimeEnablementBacklogFromCreateCandidatePreview(model),
    latestMatrix: buildVoxyRenderRuntimeGoNogoMatrixFromCreateCandidatePreview(model),
    latestRequestDraft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
    gate: buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model),
  });
}

export function buildVoxyRenderUploadTargetPolicyFromReviewContext(input: {
  reviewContext: V3ReviewQueueWiringContext;
  surface?: "admin" | "workspace";
  latestPreviewReviewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
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
  const latestPublishReadinessGuardRecord =
    input.latestPublishReadinessGuardRecord ??
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext),
    });
  return buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
    previewFlow,
    latestMediaStorageTruthRecord:
      input.latestMediaStorageTruthRecord ??
      buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
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
        latestBacklog: input.latestBacklog ?? null,
        latestMatrix: input.latestMatrix ?? null,
        latestRequestDraft: input.latestRequestDraft ?? null,
        gate: buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext),
      }),
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
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord:
      input.latestSocialDistributionHandoffRecord ??
      buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewOutcomeHandoffRecord: null,
        latestPublishReadinessGuardRecord: asPublishReadinessRecord(
          latestPublishReadinessGuardRecord,
        ),
        latestPreviewReviewDecisionRecord: null,
        latestBacklog: input.latestBacklog ?? null,
        latestMatrix: input.latestMatrix ?? null,
        latestRequestDraft: input.latestRequestDraft ?? null,
        gate: buildVoxyRenderReviewDecisionGateFromReviewContext(input.reviewContext),
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

export function buildVoxyRenderUploadTargetPolicyFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account";
    contributionRef?: UploadTargetPolicyRef | null;
    nextStep?: string | null;
  },
) {
  const previewFlow = buildVoxyRenderPreviewReviewFlowFromVoxyDialog(dialog, options);
  const approvalOptions = {
    ...options,
    surface: options?.surface === "create" ? "account" : options?.surface,
  } as const;
  const latestBacklog = buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(dialog, options);
  const latestMatrix = buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(dialog, options);
  const latestRequestDraft = buildVoxyRenderRequestDraftFromVoxyDialog(dialog, options);
  const gate = buildVoxyRenderReviewDecisionGateFromVoxyDialog(dialog, options);
  const latestPublishReadinessGuardRecord =
    buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewOutcomeHandoffRecord: null,
      latestPreviewReviewDecisionRecord: null,
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    });
  return buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
    previewFlow,
    latestApprovalSemanticsRecord: buildVoxyRenderApprovalSemanticsFromVoxyDialog(
      dialog,
      approvalOptions,
    ),
    latestPublishReadinessGuardRecord,
    latestSocialDistributionHandoffRecord:
      buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewOutcomeHandoffRecord: null,
        latestPublishReadinessGuardRecord: asPublishReadinessRecord(
          latestPublishReadinessGuardRecord,
        ),
        latestPreviewReviewDecisionRecord: null,
        latestBacklog,
        latestMatrix,
        latestRequestDraft,
        gate,
      }),
    latestMediaStorageTruthRecord: buildVoxyRenderMediaStorageTruthCommandFromReadmodels({
      previewFlow,
      latestApprovalSemanticsRecord: buildVoxyRenderApprovalSemanticsFromVoxyDialog(
        dialog,
        approvalOptions,
      ),
      latestBacklog,
      latestMatrix,
      latestRequestDraft,
      gate,
    }),
    latestBacklog,
    latestMatrix,
    latestRequestDraft,
    gate,
  });
}

function defaultStoreState(): VoxyRenderUploadTargetPolicyPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Upload-Target-Policy-Store im Surface",
    summary:
      "Dieses Surface zeigt nur eine Readmodel-Vorschau. Es entsteht weder Upload noch Signed URL noch Veröffentlichung.",
    repositoryInterface: "VoxyRenderUploadTargetPolicyRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "unavailable",
  };
}

function semanticsLines(value: VoxyRenderUploadSemantics) {
  return [
    value.uploadCandidate ? "Upload-Kandidat bleibt sichtbar" : "Kein Upload-Kandidat sichtbar",
    "upload_ready bleibt false",
    "uploaded bleibt false",
    "storage_write_allowed bleibt false",
    "signed_url_available bleibt false",
    "public_url_available bleibt false",
    "media_file_available bleibt false",
    "published bleibt false",
  ];
}

function executionLines(value: VoxyRenderUploadExecutionFlags) {
  return [
    "Kein Upload ist erlaubt",
    "Kein Storage-Write ist erlaubt",
    "Keine Signed URL wird erzeugt",
    "Keine Public URL wird erzeugt",
    "Kein Delete-Job wird erzeugt",
    "Kein Publish, kein Scheduling und kein Social Posting sind erlaubt",
    value.providerExecutionAllowed
      ? "Provider wäre erlaubt"
      : "Kein Providerlauf, keine Queue und kein Worker sind erlaubt",
  ];
}

function auditLines(
  command: VoxyRenderUploadTargetPolicyCommand | VoxyRenderUploadTargetPolicyRecord,
) {
  return [
    command.mediaStorageTruthId
      ? `Media-/Storage-Wahrheit: ${command.mediaStorageTruthId}`
      : "Noch keine Media-/Storage-Wahrheit referenziert.",
    command.mediaStorageTruthStatusHint
      ? `Media-/Storage-Status: ${voxyRenderMediaStorageTruthStatusLabel(
          command.mediaStorageTruthStatusHint,
        )}`
      : "Noch kein Media-/Storage-Status-Hinweis sichtbar.",
    command.approvalStatusHint
      ? `Approval-Status: ${voxyRenderApprovalSemanticsStatusLabel(command.approvalStatusHint)}`
      : "Noch kein Approval-Status-Hinweis sichtbar.",
    command.publishReadinessGuardStatusHint
      ? `Publish Readiness: ${voxyRenderPublishReadinessGuardStatusLabel(
          command.publishReadinessGuardStatusHint,
        )}`
      : "Noch kein Publish-Readiness-Hinweis sichtbar.",
    command.socialDistributionHandoffStatusHint
      ? `Distribution: ${voxyRenderSocialDistributionHandoffStatusLabel(
          command.socialDistributionHandoffStatusHint,
        )}`
      : "Noch kein Distribution-Hinweis sichtbar.",
    command.previewReviewFlowStatusHint
      ? `Preview Review: ${previewReviewFlowStatusLabel(command.previewReviewFlowStatusHint)}`
      : "Noch kein Preview-Review-Hinweis sichtbar.",
  ];
}

export function buildVoxyRenderUploadTargetPolicyPanelModel(input: {
  previewFlow?: VoxyRenderPreviewReviewFlowRecord | null;
  latestMediaStorageTruthRecord?: MediaStorageTruthPreview | null;
  latestApprovalSemanticsRecord?: ApprovalPreview | null;
  latestPublishReadinessGuardRecord?: PublishReadinessPreview | null;
  latestSocialDistributionHandoffRecord?: SocialDistributionPreview | null;
  latestBacklog?: VoxyRenderRuntimeEnablementBacklogRecord | null;
  latestMatrix?: VoxyRenderRuntimeGoNogoMatrixRecord | null;
  latestRequestDraft?: VoxyRenderRequestDraftRecord | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderUploadTargetPolicyRecord | null;
  storeState?: VoxyRenderUploadTargetPolicyPersistenceState | null;
}) {
  const preview =
    input.latestRecord ??
    buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow: input.previewFlow ?? null,
      latestMediaStorageTruthRecord: input.latestMediaStorageTruthRecord ?? null,
      latestApprovalSemanticsRecord: input.latestApprovalSemanticsRecord ?? null,
      latestPublishReadinessGuardRecord: input.latestPublishReadinessGuardRecord ?? null,
      latestSocialDistributionHandoffRecord:
        input.latestSocialDistributionHandoffRecord ?? null,
      latestBacklog: input.latestBacklog ?? null,
      latestMatrix: input.latestMatrix ?? null,
      latestRequestDraft: input.latestRequestDraft ?? null,
      gate: input.gate ?? null,
    });
  if (!preview) return null;

  const active = input.latestRecord ?? preview;
  const storeState = input.storeState ?? defaultStoreState();

  return {
    title: "Upload Target Policy",
    summary:
      "Dieser Layer beschreibt nur, welche späteren Upload-Ziele, Access-Regeln, Signed-Access-, Retention- und Lösch-Policies für Voxy-Medien fehlen würden. Er erzeugt heute keinen Upload, keinen Storage-Write, keine URL und keine Veröffentlichung.",
    preview,
    uploadTargetPolicyStatusLabel: voxyRenderUploadTargetPolicyStatusLabel(
      active.uploadTargetPolicyStatus,
    ),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: input.latestRecord
      ? {
          uploadTargetPolicyId: input.latestRecord.uploadTargetPolicyId,
          uploadTargetPolicyStatusLabel: voxyRenderUploadTargetPolicyStatusLabel(
            input.latestRecord.uploadTargetPolicyStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          uploadTargetPolicyVersion: input.latestRecord.uploadTargetPolicyVersion,
          mediaStorageTruthId: input.latestRecord.mediaStorageTruthId ?? null,
        }
      : null,
    commandPreview: {
      uploadTargetPolicyStatusLabel: voxyRenderUploadTargetPolicyStatusLabel(
        preview.uploadTargetPolicyStatus,
      ),
      nextStepLabel: voxyRenderUploadTargetPolicyNextStepLabel(preview.nextStep),
      createdAt: preview.createdAt,
      mediaStorageTruthId: preview.mediaStorageTruthId,
    },
    uploadTargetLine: `${uploadTargetProviderLabel(active.uploadTargetCandidate.provider)} · ${uploadTargetCandidateStatusLabel(active.uploadTargetCandidate.status)} · ${active.uploadTargetCandidate.userVisibleReason}`,
    accessPolicyLine: `${uploadAccessVisibilityLabel(active.accessPolicy.visibility)} · ${active.accessPolicy.userVisibleReason}`,
    signedAccessLine: active.accessPolicy.signedAccessCandidate
      ? "Signed Access bleibt nur Kandidat und erzeugt keine Signed URL."
      : "Noch kein Signed-Access-Kandidat sichtbar.",
    retentionPolicyLine: `${uploadPolicyCandidateStatusLabel(active.retentionPolicy.status)} · ${active.retentionPolicy.userVisibleReason}`,
    deletionPolicyLine: `${uploadPolicyCandidateStatusLabel(active.deletionPolicy.status)} · ${active.deletionPolicy.userVisibleReason}`,
    semanticsLines: semanticsLines(active.uploadSemantics),
    executionLines: executionLines(active.executionFlags),
    auditLines: auditLines(active),
    topBlockers: active.topBlockers,
    nextStep: voxyRenderUploadTargetPolicyNextStepLabel(active.nextStep),
  } satisfies VoxyRenderUploadTargetPolicyPanelModel;
}
