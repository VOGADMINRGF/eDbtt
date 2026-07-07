export const CANONICAL_PREPARATION_STATUSES = [
  "draft",
  "needs_clarification",
  "review_ready",
  "publish_ready",
  "scheduled_after_review",
  "active_or_published",
  "archived",
  "failed",
] as const;

export type CanonicalPreparationStatus =
  (typeof CANONICAL_PREPARATION_STATUSES)[number];

export type CanonicalPublishGuard = {
  autoPublish: false;
  reviewRequired: true;
  publicOutputAllowed: boolean;
  publishActionEnabled: boolean;
  externalSocialApiTriggered: false;
};

export type ResolveCanonicalPublishGuardInput = {
  status: CanonicalPreparationStatus;
  approvalGranted?: boolean;
  blockers?: readonly string[];
};

export function isCanonicalPreparationStatus(
  value: string,
): value is CanonicalPreparationStatus {
  return CANONICAL_PREPARATION_STATUSES.includes(
    value as CanonicalPreparationStatus,
  );
}

export function isCanonicalPublishedStatus(
  status: CanonicalPreparationStatus,
): boolean {
  return status === "active_or_published";
}

export function resolveCanonicalPublishGuard(
  input: ResolveCanonicalPublishGuardInput,
): CanonicalPublishGuard {
  const blockers = (input.blockers ?? []).map((value) => value.trim()).filter(Boolean);
  const approvalGranted = input.approvalGranted === true;
  const publishActionEnabled =
    approvalGranted &&
    blockers.length === 0 &&
    (input.status === "publish_ready" ||
      input.status === "scheduled_after_review");
  const publicOutputAllowed =
    approvalGranted &&
    blockers.length === 0 &&
    input.status === "active_or_published";

  return {
    autoPublish: false,
    reviewRequired: true,
    publicOutputAllowed,
    publishActionEnabled,
    externalSocialApiTriggered: false,
  };
}

