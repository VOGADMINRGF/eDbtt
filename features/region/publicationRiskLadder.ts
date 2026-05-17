export const REGION_PUBLICATION_VISIBILITY_STATES = [
  "private_draft",
  "internal_review",
  "public_unverified",
  "public_reviewed",
  "public_official",
  "archived",
  "blocked",
] as const;

export type RegionPublicationVisibilityState =
  (typeof REGION_PUBLICATION_VISIBILITY_STATES)[number];

type ReviewStateLike =
  | "draft"
  | "needs_review"
  | "needs_region_review"
  | "accepted"
  | "rejected"
  | "archived"
  | "revoked";

type ParticipationSourceTypeLike =
  | "public_claim"
  | "public_contribution"
  | "public_question"
  | "public_source_hint"
  | "swipe_interest"
  | "swipe_counterpoint"
  | "saved_topic"
  | "support_signal";

type ParticipationPrivacyModeLike =
  | "no_personal_data"
  | "anonymized"
  | "review_restricted";

type FeedSourceTypeLike =
  | "news"
  | "official_update"
  | "community_signal"
  | "feed_draft"
  | "manual_note";

export function isPublicVisibilityState(
  value: RegionPublicationVisibilityState,
): boolean {
  return (
    value === "public_unverified" ||
    value === "public_reviewed" ||
    value === "public_official"
  );
}

export function isReviewVisibilityState(
  value: RegionPublicationVisibilityState,
): boolean {
  return value === "private_draft" || value === "internal_review";
}

function isLowRiskPublicParticipationSource(
  sourceType: ParticipationSourceTypeLike,
): boolean {
  return (
    sourceType === "public_question" ||
    sourceType === "public_source_hint" ||
    sourceType === "swipe_interest" ||
    sourceType === "swipe_counterpoint"
  );
}

export function resolveParticipationVisibilityState(params: {
  reviewStatus: ReviewStateLike;
  sourceType: ParticipationSourceTypeLike;
  privacyMode: ParticipationPrivacyModeLike;
  needsRegionReview?: boolean;
  regionId?: string | null;
  publicSafeTitle?: string | null;
  publicSafeSummary?: string | null;
}): RegionPublicationVisibilityState {
  if (params.reviewStatus === "archived") return "archived";
  if (
    params.reviewStatus === "rejected" ||
    params.reviewStatus === "revoked"
  ) {
    return "blocked";
  }
  if (params.reviewStatus === "draft") return "private_draft";
  if (
    params.reviewStatus === "needs_region_review" ||
    params.needsRegionReview === true ||
    !String(params.regionId ?? "").trim()
  ) {
    return "internal_review";
  }
  if (
    params.privacyMode === "review_restricted" &&
    (!String(params.publicSafeTitle ?? "").trim() ||
      !String(params.publicSafeSummary ?? "").trim())
  ) {
    return "internal_review";
  }
  if (
    params.reviewStatus === "needs_review" &&
    isLowRiskPublicParticipationSource(params.sourceType)
  ) {
    return "public_unverified";
  }
  if (params.reviewStatus !== "accepted") return "internal_review";
  if (isLowRiskPublicParticipationSource(params.sourceType)) {
    return "public_unverified";
  }
  return "public_reviewed";
}

export function resolveFeedVisibilityState(params: {
  reviewStatus: "draft" | "needs_review" | "accepted" | "rejected" | "archived";
  sourceType: FeedSourceTypeLike;
}): RegionPublicationVisibilityState {
  if (params.reviewStatus === "archived") return "archived";
  if (params.reviewStatus === "rejected") return "blocked";
  if (params.reviewStatus === "draft") return "private_draft";
  if (params.reviewStatus === "needs_review") return "internal_review";
  if (params.sourceType === "official_update") {
    return "public_reviewed";
  }
  return "public_reviewed";
}

export function resolveReviewOnlyVisibilityState(params: {
  reviewStatus: "draft" | "needs_review" | "accepted" | "rejected" | "archived";
}): RegionPublicationVisibilityState {
  if (params.reviewStatus === "archived") return "archived";
  if (params.reviewStatus === "rejected") return "blocked";
  if (params.reviewStatus === "draft") return "private_draft";
  return "internal_review";
}
