import type {
  CanonicalPreparationStatus,
} from "@/features/create/canonicalPreparationStatusContract";
import type {
  CanonicalSourcePack,
} from "@/features/create/canonicalSourcePackContract";
import type {
  CanonicalLanguageBridgeRecord,
  CanonicalTrustState,
} from "@/features/create/languageBridgeTrustFormatContract";

export const VOXY_VIDEO_SOURCE_CONTEXT_KINDS = [
  "discussion",
  "dossier",
  "anlassraum",
  "participation_space",
] as const;

export type VoxyVideoSourceContextKind =
  (typeof VOXY_VIDEO_SOURCE_CONTEXT_KINDS)[number];

export const VOXY_SCRIPT_SEGMENT_KINDS = [
  "intro",
  "context",
  "claim",
  "counter_position",
  "open_question",
  "call_to_action",
] as const;

export type VoxyScriptSegmentKind =
  (typeof VOXY_SCRIPT_SEGMENT_KINDS)[number];

export const VOXY_RENDER_JOB_STATUSES = [
  "draft_only",
  "ready_after_review",
  "blocked_by_provider",
  "blocked_by_secret",
  "blocked_by_runtime_truth",
  "render_queued",
] as const;

export type VoxyRenderJobStatus =
  (typeof VOXY_RENDER_JOB_STATUSES)[number];

export const VOXY_PUBLISH_DRAFT_STATUSES = [
  "draft_only",
  "publish_ready",
  "blocked_by_runtime_truth",
] as const;

export type VoxyPublishDraftStatus =
  (typeof VOXY_PUBLISH_DRAFT_STATUSES)[number];

export type VoxySourcePackBridge = {
  sourcePackId: string;
  sourcePack: CanonicalSourcePack;
  sourceLocales: string[];
  readingLocale: string;
  trustState: CanonicalTrustState;
  reviewRequired: true;
  missingRuntimeTruth: string[];
};

export type VoxyVideoBriefing = {
  briefingId: string;
  sourceContextKind: VoxyVideoSourceContextKind;
  sourceContextId: string;
  title: string;
  summary: string;
  mascotDisclosure: "voxy_is_avatar_not_person";
  preparationStatus: CanonicalPreparationStatus;
  languageBridge: CanonicalLanguageBridgeRecord;
  sourcePackBridge: VoxySourcePackBridge;
  reviewRequired: true;
  autoPublish: false;
  autoRender: false;
  providerBound: false;
  publishReadyIsPublished: false;
};

export type VoxyScriptSegment = {
  segmentId: string;
  briefingId: string;
  kind: VoxyScriptSegmentKind;
  text: string;
  reviewRequired: true;
  mascotDisclosure: "voxy_is_avatar_not_person";
};

export type VoxyReviewState = {
  briefingReview: {
    requiredReviewType: "editorial_review";
    status: "needs_review" | "approved";
  };
  scriptReview: {
    requiredReviewType: "voxy_script_review";
    status: "needs_review" | "approved";
  };
  renderReview: {
    requiredReviewType: "voxy_render_review";
    status: "needs_review" | "approved" | "blocked_by_provider" | "blocked_by_secret";
  };
  publishReview: {
    requiredReviewType: "publish_review";
    status: "needs_review" | "approved" | "blocked_by_runtime_truth";
  };
};

export type VoxyRenderJob = {
  jobId: string;
  briefingId: string;
  status: VoxyRenderJobStatus;
  reviewType: "voxy_render_review";
  approvalRequired: true;
  renderTriggered: boolean;
  providerInterface: "adapter_only";
};

export type VoxyPublishDraft = {
  draftId: string;
  briefingId: string;
  status: VoxyPublishDraftStatus;
  targetHints: string[];
  reviewType: "publish_review";
  approvalRequired: true;
  autoPublish: false;
  externalPublishTriggered: false;
  publishReadyIsPublished: false;
};

export interface LLMProvider {
  createScript(input: { briefing: VoxyVideoBriefing }): Promise<VoxyScriptSegment[]>;
}

export interface VoiceProvider {
  synthesizeVoice(input: { segments: VoxyScriptSegment[] }): Promise<{ assetRef: string }>;
}

export interface AvatarProvider {
  prepareAvatar(input: { briefing: VoxyVideoBriefing }): Promise<{ avatarRef: string }>;
}

export interface RenderProvider {
  queueRender(input: {
    briefing: VoxyVideoBriefing;
    segments: VoxyScriptSegment[];
  }): Promise<{ renderJobRef: string }>;
}

export interface PublishProvider {
  createDraft(input: { briefing: VoxyVideoBriefing }): Promise<{ draftRef: string }>;
}

export const VOXY_HYBRID_RUNTIME_PATHS = [
  "hybrid_external_render_adapter",
] as const;

export type VoxyHybridRuntimePath =
  (typeof VOXY_HYBRID_RUNTIME_PATHS)[number];

export const VOXY_HYBRID_RUNTIME_CONFIG_REQUIREMENT_KEYS = [
  "provider_adapter_endpoint",
  "provider_adapter_timeout_policy",
  "provider_adapter_model_mapping",
  "runtime_idempotency_namespace",
  "queue_routing_contract",
  "preview_storage_policy",
  "upload_access_policy",
  "observability_gate_mapping",
] as const;

export type VoxyHybridRuntimeConfigRequirementKey =
  (typeof VOXY_HYBRID_RUNTIME_CONFIG_REQUIREMENT_KEYS)[number];

export const VOXY_HYBRID_RUNTIME_SECRET_REQUIREMENT_KEYS = [
  "provider_api_key",
  "provider_signing_secret",
  "storage_signing_secret",
  "queue_connection_secret",
] as const;

export type VoxyHybridRuntimeSecretRequirementKey =
  (typeof VOXY_HYBRID_RUNTIME_SECRET_REQUIREMENT_KEYS)[number];

export type VoxyHybridRuntimeConfigRequirement = {
  key: VoxyHybridRuntimeConfigRequirementKey;
  status: "requirement_only";
  reviewRequired: true;
  runtimeEnabled: false;
  reason: string;
};

export type VoxyHybridRuntimeSecretRequirement = {
  key: VoxyHybridRuntimeSecretRequirementKey;
  status: "requirement_only";
  reviewRequired: true;
  runtimeEnabled: false;
  secretValuePresent: false;
  reason: string;
};

export type VoxyHybridRuntimeAdapterRequest = {
  requestId: string;
  path: VoxyHybridRuntimePath;
  briefing: VoxyVideoBriefing;
  segments: VoxyScriptSegment[];
  reviewRequired: true;
  providerNeutral: true;
  runtimeEnabled: false;
  externalApiCalled: false;
  queueExecutionAllowed: false;
  storageWriteAllowed: false;
  uploadAllowed: false;
  schedulingAllowed: false;
  publishAllowed: false;
  socialPostingAllowed: false;
  sourceLanguage: string;
  readingLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  idempotencyKey: string;
};

export type VoxyHybridRuntimeAdapterDisabledResult = {
  path: VoxyHybridRuntimePath;
  status: "disabled_noop";
  foundationReady: true;
  runtimeEnabled: false;
  providerConfigured: false;
  providerCalled: false;
  externalApiCalled: false;
  queueJobCreated: false;
  storageWritten: false;
  uploadTriggered: false;
  schedulingTriggered: false;
  published: false;
  socialPosted: false;
  reason: string;
};

export interface VoxyHybridRuntimeAdapter {
  preparePreviewRuntime(
    input: VoxyHybridRuntimeAdapterRequest,
  ): Promise<VoxyHybridRuntimeAdapterDisabledResult>;
}

export type BuildVoxySourcePackBridgeInput = {
  sourcePack: CanonicalSourcePack;
  readingLocale?: string | null;
  trustState?: CanonicalTrustState | null;
};

export type BuildVoxyVideoBriefingInput = {
  briefingId: string;
  sourceContextKind: VoxyVideoSourceContextKind;
  sourceContextId: string;
  title: string;
  summary: string;
  languageBridge: CanonicalLanguageBridgeRecord;
  sourcePack: CanonicalSourcePack;
  trustState?: CanonicalTrustState | null;
};

export type BuildVoxyScriptSegmentsInput = {
  briefingId: string;
  segments: readonly {
    kind: VoxyScriptSegmentKind;
    text: string;
  }[];
};

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function buildVoxySourcePackBridge(
  input: BuildVoxySourcePackBridgeInput,
): VoxySourcePackBridge {
  const sourceLocales = unique(
    input.sourcePack.sources
      .map((source) => source.sourceLocale?.trim().toLowerCase() ?? "")
      .filter(Boolean),
  );
  const readingLocale =
    input.readingLocale?.trim().toLowerCase() ??
    sourceLocales[0] ??
    "de";

  return {
    sourcePackId: input.sourcePack.sourcePackId,
    sourcePack: input.sourcePack,
    sourceLocales,
    readingLocale,
    trustState: input.trustState ?? "source_needed",
    reviewRequired: true,
    missingRuntimeTruth: input.sourcePack.openGaps.includes("source_needed")
      ? ["missing_runtime_truth"]
      : [],
  };
}

export function buildVoxyVideoBriefing(
  input: BuildVoxyVideoBriefingInput,
): VoxyVideoBriefing {
  return {
    briefingId: input.briefingId.trim(),
    sourceContextKind: input.sourceContextKind,
    sourceContextId: input.sourceContextId.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    mascotDisclosure: "voxy_is_avatar_not_person",
    preparationStatus: "review_ready",
    languageBridge: input.languageBridge,
    sourcePackBridge: buildVoxySourcePackBridge({
      sourcePack: input.sourcePack,
      readingLocale: input.languageBridge.translation.language,
      trustState: input.trustState ?? input.languageBridge.sourceGrounding.trustState,
    }),
    reviewRequired: true,
    autoPublish: false,
    autoRender: false,
    providerBound: false,
    publishReadyIsPublished: false,
  };
}

export function buildVoxyHybridRuntimeAdapterRequest(input: {
  requestId: string;
  briefing: VoxyVideoBriefing;
  segments: VoxyScriptSegment[];
  sourceLanguage: string;
  readingLanguage: string;
  renderLanguage: string;
  subtitleLanguage?: string | null;
  idempotencyKey: string;
}): VoxyHybridRuntimeAdapterRequest {
  return {
    requestId: input.requestId.trim(),
    path: "hybrid_external_render_adapter",
    briefing: input.briefing,
    segments: input.segments,
    reviewRequired: true,
    providerNeutral: true,
    runtimeEnabled: false,
    externalApiCalled: false,
    queueExecutionAllowed: false,
    storageWriteAllowed: false,
    uploadAllowed: false,
    schedulingAllowed: false,
    publishAllowed: false,
    socialPostingAllowed: false,
    sourceLanguage: input.sourceLanguage.trim().toLowerCase(),
    readingLanguage: input.readingLanguage.trim().toLowerCase(),
    renderLanguage: input.renderLanguage.trim().toLowerCase(),
    subtitleLanguage: input.subtitleLanguage?.trim().toLowerCase() ?? null,
    idempotencyKey: input.idempotencyKey.trim(),
  };
}

export function buildVoxyHybridRuntimeAdapterDisabledResult(
  reason: string,
): VoxyHybridRuntimeAdapterDisabledResult {
  return {
    path: "hybrid_external_render_adapter",
    status: "disabled_noop",
    foundationReady: true,
    runtimeEnabled: false,
    providerConfigured: false,
    providerCalled: false,
    externalApiCalled: false,
    queueJobCreated: false,
    storageWritten: false,
    uploadTriggered: false,
    schedulingTriggered: false,
    published: false,
    socialPosted: false,
    reason: reason.trim() || "Hybrid Runtime bleibt deaktiviert.",
  };
}

export function buildVoxyScriptSegments(
  input: BuildVoxyScriptSegmentsInput,
): VoxyScriptSegment[] {
  return input.segments.map((segment, index) => ({
    segmentId: `${input.briefingId.trim()}-segment-${index + 1}`,
    briefingId: input.briefingId.trim(),
    kind: segment.kind,
    text: segment.text.trim(),
    reviewRequired: true,
    mascotDisclosure: "voxy_is_avatar_not_person",
  }));
}

export function buildVoxyReviewState(input?: {
  briefingApproved?: boolean;
  scriptApproved?: boolean;
  renderApproved?: boolean;
  publishApproved?: boolean;
  renderBlockedBy?: "provider" | "secret" | null;
  publishRuntimeReady?: boolean;
}): VoxyReviewState {
  return {
    briefingReview: {
      requiredReviewType: "editorial_review",
      status: input?.briefingApproved ? "approved" : "needs_review",
    },
    scriptReview: {
      requiredReviewType: "voxy_script_review",
      status: input?.scriptApproved ? "approved" : "needs_review",
    },
    renderReview: {
      requiredReviewType: "voxy_render_review",
      status:
        input?.renderBlockedBy === "provider"
          ? "blocked_by_provider"
          : input?.renderBlockedBy === "secret"
            ? "blocked_by_secret"
            : input?.renderApproved
              ? "approved"
              : "needs_review",
    },
    publishReview: {
      requiredReviewType: "publish_review",
      status:
        input?.publishApproved && input.publishRuntimeReady === false
          ? "blocked_by_runtime_truth"
          : input?.publishApproved
            ? "approved"
            : "needs_review",
    },
  };
}

export function resolveVoxyRenderJob(input: {
  briefingId: string;
  approvalGranted?: boolean;
  providerConfigured?: boolean;
  secretAvailable?: boolean;
  runtimeAvailable?: boolean;
}): VoxyRenderJob {
  let status: VoxyRenderJobStatus = "draft_only";
  if (input.approvalGranted !== true) {
    status = "ready_after_review";
  } else if (input.providerConfigured !== true) {
    status = "blocked_by_provider";
  } else if (input.secretAvailable !== true) {
    status = "blocked_by_secret";
  } else if (input.runtimeAvailable !== true) {
    status = "blocked_by_runtime_truth";
  } else {
    status = "render_queued";
  }

  return {
    jobId: `${input.briefingId.trim()}-render-job`,
    briefingId: input.briefingId.trim(),
    status,
    reviewType: "voxy_render_review",
    approvalRequired: true,
    renderTriggered: status === "render_queued",
    providerInterface: "adapter_only",
  };
}

export function buildVoxyPublishDraft(input: {
  briefingId: string;
  publishApproved?: boolean;
  runtimeReady?: boolean;
  targetHints?: readonly string[];
}): VoxyPublishDraft {
  const status: VoxyPublishDraftStatus =
    input.publishApproved !== true
      ? "draft_only"
      : input.runtimeReady === true
        ? "publish_ready"
        : "blocked_by_runtime_truth";

  return {
    draftId: `${input.briefingId.trim()}-publish-draft`,
    briefingId: input.briefingId.trim(),
    status,
    targetHints: [...(input.targetHints ?? [])],
    reviewType: "publish_review",
    approvalRequired: true,
    autoPublish: false,
    externalPublishTriggered: false,
    publishReadyIsPublished: false,
  };
}
