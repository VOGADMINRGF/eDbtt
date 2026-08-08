export const VOXY_MODERN_VIDEO_STATUSES = [
  "draft",
  "briefing_ready",
  "script_ready",
  "needs_review",
  "approved",
  "render_queued",
  "rendering",
  "rendered",
  "publish_ready",
  "published",
  "failed",
] as const;

export type VoxyModernVideoStatus =
  (typeof VOXY_MODERN_VIDEO_STATUSES)[number];

export const VOXY_CHARACTER_MOTIONS = [
  "neutral_idle",
  "listening",
  "explaining",
  "questioning",
  "highlighting_source",
  "showing_contrast",
  "inviting_participation",
] as const;

export type VoxyCharacterMotion =
  (typeof VOXY_CHARACTER_MOTIONS)[number];

export const VOXY_CHARACTER_EXPRESSIONS = [
  "neutral",
  "attentive",
  "thoughtful",
  "friendly",
  "serious",
  "surprised",
  "inviting",
] as const;

export type VoxyCharacterExpression =
  (typeof VOXY_CHARACTER_EXPRESSIONS)[number];

export const VOXY_VIDEO_FORMATS = ["16:9", "9:16", "1:1"] as const;

export type VoxyVideoFormat = (typeof VOXY_VIDEO_FORMATS)[number];

export type VoxyLanguageEdition = {
  countryCode: string;
  regionCode?: string;
  originalLanguage: string;
  workingLanguage: string;
  outputLanguage: string;
  locale: string;
  translationReviewRequired: boolean;
  localizedCta?: string;
};

export type VoxySourceReference = {
  id: string;
  title: string;
  url?: string;
  retrievedAt?: string;
  trustLevel?: "unknown" | "low" | "medium" | "high";
  notes?: string;
};

export type VoxyModernBriefing = {
  id: string;
  sourceContextId: string;
  sourceContextType:
    | "discussion"
    | "dossier"
    | "anlassraum"
    | "participation_space"
    | "claim";
  title: string;
  summary: string;
  thesis?: string;
  counterPosition?: string;
  openQuestions: string[];
  sources: VoxySourceReference[];
  edition: VoxyLanguageEdition;
  status: VoxyModernVideoStatus;
  mascotDisclosure: "voxy_is_avatar_not_person";
  editorialMode: "facts_updates_only";
  politicalInterpretationAllowed: false;
  recommendationsAllowed: false;
  reviewRequired: true;
  autoPublish: false;
  createdAt: string;
  updatedAt: string;
};

export const VOXY_MODERN_SEGMENT_KINDS = [
  "hook",
  "context",
  "thesis",
  "counter_position",
  "open_question",
  "source_note",
  "cta",
] as const;

export type VoxyModernSegmentKind =
  (typeof VOXY_MODERN_SEGMENT_KINDS)[number];

export type VoxyCharacterMotionSegment = {
  id: string;
  kind: VoxyModernSegmentKind;
  text: string;
  startMs: number;
  durationMs: number;
  motion: VoxyCharacterMotion;
  expression: VoxyCharacterExpression;
  visualCue?:
    | "none"
    | "source_card"
    | "contrast_card"
    | "question_card"
    | "timeline"
    | "cta_card";
  sourceIds: string[];
};

export type VoxyVoiceSynthesisRequest = {
  briefingId: string;
  language: string;
  locale: string;
  text: string;
  voiceProfileId: string;
  pronunciationDictionaryId?: string;
};

export type VoxyVoiceSynthesisResult = {
  provider: string;
  audioAssetId: string;
  durationMs: number;
};

export interface VoxyVoiceSynthesisProvider {
  synthesize(
    request: VoxyVoiceSynthesisRequest,
  ): Promise<VoxyVoiceSynthesisResult>;
}

export type VoxyCharacterMotionRequest = {
  briefingId: string;
  audioAssetId?: string;
  segments: VoxyCharacterMotionSegment[];
  format: VoxyVideoFormat;
  characterProfileId: string;
};

export type VoxyCharacterMotionResult = {
  provider: string;
  motionAssetId: string;
  durationMs: number;
};

export interface VoxyCharacterMotionProvider {
  compose(
    request: VoxyCharacterMotionRequest,
  ): Promise<VoxyCharacterMotionResult>;
}

export type VoxyModernRenderJob = {
  id: string;
  briefingId: string;
  status: Extract<
    VoxyModernVideoStatus,
    "render_queued" | "rendering" | "rendered" | "failed"
  >;
  format: VoxyVideoFormat;
  audioAssetId?: string;
  motionAssetId?: string;
  outputAssetId?: string;
  attempt: number;
  errorCode?: string;
  safeErrorMessage?: string;
};

export type VoxyModernVideoReview = {
  briefingId: string;
  status: "pending" | "needs_changes" | "approved" | "rejected";
  reviewerId?: string;
  reviewedAt?: string;
  notes?: string;
};

export type VoxyModernPublishDraft = {
  id: string;
  briefingId: string;
  platform:
    | "edebatte"
    | "youtube"
    | "tiktok"
    | "instagram"
    | "linkedin"
    | "facebook";
  status: "draft_only" | "publish_ready";
  title: string;
  caption: string;
  hashtags: string[];
  sourceDisclosure: string;
  mascotDisclosure: "voxy_is_avatar_not_person";
  cta?: string;
  locale: string;
  approvalRequired: true;
  autoPublish: false;
  externalPublishTriggered: false;
};

const STATUS_TRANSITIONS: Readonly<
  Record<VoxyModernVideoStatus, readonly VoxyModernVideoStatus[]>
> = {
  draft: ["briefing_ready", "failed"],
  briefing_ready: ["script_ready", "failed"],
  script_ready: ["needs_review", "failed"],
  needs_review: ["approved", "failed"],
  approved: ["render_queued", "needs_review", "failed"],
  render_queued: ["rendering", "failed"],
  rendering: ["rendered", "failed"],
  rendered: ["publish_ready", "failed"],
  publish_ready: ["published", "needs_review", "failed"],
  published: [],
  failed: ["needs_review"],
};

export function canTransitionVoxyModernVideoStatus(
  from: VoxyModernVideoStatus,
  to: VoxyModernVideoStatus,
): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function assertVoxyModernVideoTransition(
  from: VoxyModernVideoStatus,
  to: VoxyModernVideoStatus,
): void {
  if (!canTransitionVoxyModernVideoStatus(from, to)) {
    throw new Error(`invalid_voxy_video_transition:${from}->${to}`);
  }
}

export function resolveVoxyModernRenderGate(input: {
  videoStatus: VoxyModernVideoStatus;
  reviewStatus: VoxyModernVideoReview["status"];
  hasSegments: boolean;
  hasSourceDisclosure: boolean;
}): { allowed: boolean; reason: string | null } {
  if (input.videoStatus !== "approved") {
    return { allowed: false, reason: "video_not_approved" };
  }
  if (input.reviewStatus !== "approved") {
    return { allowed: false, reason: "review_not_approved" };
  }
  if (!input.hasSegments) {
    return { allowed: false, reason: "script_segments_missing" };
  }
  if (!input.hasSourceDisclosure) {
    return { allowed: false, reason: "source_disclosure_missing" };
  }
  return { allowed: true, reason: null };
}

export function resolveVoxyModernPublishGate(input: {
  videoStatus: VoxyModernVideoStatus;
  outputAssetId?: string | null;
  publishReviewStatus: VoxyModernVideoReview["status"];
}): { allowed: boolean; reason: string | null } {
  if (input.videoStatus !== "publish_ready") {
    return { allowed: false, reason: "video_not_publish_ready" };
  }
  if (!input.outputAssetId?.trim()) {
    return { allowed: false, reason: "rendered_output_missing" };
  }
  if (input.publishReviewStatus !== "approved") {
    return { allowed: false, reason: "publish_review_not_approved" };
  }
  return { allowed: true, reason: null };
}

export function buildFailedVoxyModernRenderJob(input: {
  id: string;
  briefingId: string;
  format: VoxyVideoFormat;
  attempt: number;
  errorCode?: string;
}): VoxyModernRenderJob {
  return {
    id: input.id.trim(),
    briefingId: input.briefingId.trim(),
    status: "failed",
    format: input.format,
    attempt: Math.max(1, Math.trunc(input.attempt)),
    errorCode: input.errorCode?.trim() || "character_motion_provider_failed",
    safeErrorMessage:
      "Die Character-Motion-Vorschau konnte nicht erstellt werden. Es wurde nichts veröffentlicht.",
  };
}
