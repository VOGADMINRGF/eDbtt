import {
  resolveCanonicalFormatRecommendationDecision,
  type CanonicalFormatRecommendation,
} from "@/features/create/languageBridgeTrustFormatContract";

export const USER_CONTRIBUTION_LIFECYCLE_STATUSES = [
  "received",
  "classified",
  "linked_to_topic",
  "needs_clarification",
  "source_needed",
  "format_recommended",
  "review_ready",
  "publish_ready",
  "activated_or_published",
  "returned_with_reason",
  "archived",
] as const;

export type UserContributionLifecycleStatus =
  (typeof USER_CONTRIBUTION_LIFECYCLE_STATUSES)[number];

export type BuildUserContributionLifecycleInput = {
  contributionId: string;
  currentStatus?: UserContributionLifecycleStatus;
  linkedTopicId?: string | null;
  sourcePresent?: boolean;
  clarificationNeeded?: boolean;
  formatRecommendation?: string | null;
  reviewApproved?: boolean;
  published?: boolean;
  returnReason?: string | null;
};

export type UserContributionLifecycleRecord = {
  contributionId: string;
  status: UserContributionLifecycleStatus;
  reviewRequired: true;
  autoPublish: false;
  publicVisible: boolean;
  linkedTopicId: string | null;
  formatRecommendation: CanonicalFormatRecommendation | null;
  visibleOutcome: string;
  returnReason: string | null;
};

export function isUserContributionLifecycleStatus(
  value: string,
): value is UserContributionLifecycleStatus {
  return USER_CONTRIBUTION_LIFECYCLE_STATUSES.includes(
    value as UserContributionLifecycleStatus,
  );
}

export function getNextUserContributionLifecycleStatuses(
  status: UserContributionLifecycleStatus,
): UserContributionLifecycleStatus[] {
  switch (status) {
    case "received":
      return ["classified", "needs_clarification", "archived"];
    case "classified":
      return ["linked_to_topic", "source_needed", "needs_clarification", "archived"];
    case "linked_to_topic":
      return ["format_recommended", "needs_clarification", "source_needed", "archived"];
    case "source_needed":
      return ["needs_clarification", "format_recommended", "archived"];
    case "needs_clarification":
      return ["classified", "returned_with_reason", "archived"];
    case "format_recommended":
      return ["review_ready", "needs_clarification", "archived"];
    case "review_ready":
      return ["publish_ready", "returned_with_reason", "archived"];
    case "publish_ready":
      return ["activated_or_published", "returned_with_reason", "archived"];
    case "returned_with_reason":
      return ["classified", "archived"];
    case "activated_or_published":
      return ["archived"];
    case "archived":
      return [];
  }
}

function buildVisibleOutcome(
  status: UserContributionLifecycleStatus,
  recommendation: CanonicalFormatRecommendation | null,
  returnReason: string | null,
): string {
  if (status === "needs_clarification") {
    return "Beitrag braucht noch Klärung.";
  }
  if (status === "source_needed") {
    return "Beitrag ist erfasst, aber es fehlt noch eine Quelle.";
  }
  if (status === "format_recommended" && recommendation) {
    return `Beitrag wurde eingeordnet. Formatvorschlag: ${recommendation}.`;
  }
  if (status === "review_ready") {
    return "Beitrag ist für Review vorbereitet.";
  }
  if (status === "publish_ready") {
    return "Beitrag ist vorbereitet, aber noch nicht veröffentlicht.";
  }
  if (status === "activated_or_published") {
    return "Beitrag wurde nach Review weitergeführt.";
  }
  if (status === "returned_with_reason") {
    return returnReason ?? "Beitrag wurde mit Rückmeldung zurückgegeben.";
  }
  if (status === "archived") {
    return "Beitrag wurde archiviert.";
  }
  if (status === "linked_to_topic") {
    return "Beitrag wurde einem Thema zugeordnet.";
  }
  if (status === "classified") {
    return "Beitrag wurde eingeordnet.";
  }
  return "Beitrag ist eingegangen.";
}

export function buildUserContributionLifecycleRecord(
  input: BuildUserContributionLifecycleInput,
): UserContributionLifecycleRecord {
  const recommendation = input.formatRecommendation
    ? resolveCanonicalFormatRecommendationDecision(input.formatRecommendation)
        .recommendation
    : null;

  let status: UserContributionLifecycleStatus = input.currentStatus ?? "received";

  if (input.published) {
    status = "activated_or_published";
  } else if (input.reviewApproved) {
    status = "publish_ready";
  } else if (input.returnReason?.trim()) {
    status = "returned_with_reason";
  } else if (input.clarificationNeeded) {
    status = "needs_clarification";
  } else if (input.sourcePresent === false) {
    status = "source_needed";
  } else if (recommendation) {
    status = "format_recommended";
  } else if (input.linkedTopicId?.trim()) {
    status = "linked_to_topic";
  } else if (input.currentStatus === "classified") {
    status = "classified";
  }

  const publicVisible = status === "activated_or_published";

  return {
    contributionId: input.contributionId,
    status,
    reviewRequired: true,
    autoPublish: false,
    publicVisible,
    linkedTopicId: input.linkedTopicId?.trim() ?? null,
    formatRecommendation: recommendation,
    visibleOutcome: buildVisibleOutcome(
      status,
      recommendation,
      input.returnReason?.trim() ?? null,
    ),
    returnReason: input.returnReason?.trim() ?? null,
  };
}
