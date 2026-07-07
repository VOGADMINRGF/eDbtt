import type { GovernanceActor, GovernanceActorRole } from "@features/trust/types";

export const ROLE_SPECIFIC_REVIEW_TYPES = [
  "self_review",
  "editorial_review",
  "org_review",
  "moderation_review",
  "cost_provider_review",
  "publish_review",
  "source_review",
  "translation_review",
  "voxy_script_review",
  "voxy_render_review",
] as const;

export type RoleSpecificReviewType =
  (typeof ROLE_SPECIFIC_REVIEW_TYPES)[number];

export const ROLE_SPECIFIC_REVIEW_ACTIONS = [
  "review",
  "approve",
  "publish",
  "activate",
  "translate",
  "render",
] as const;

export type RoleSpecificReviewAction =
  (typeof ROLE_SPECIFIC_REVIEW_ACTIONS)[number];

export type RoleSpecificReviewRequirement = {
  reviewType: RoleSpecificReviewType;
  reviewRequired: true;
  autoPublish: false;
  publishReadyIsPublished: false;
  approvalRequiredForPublicAction: true;
  allowedRoles: GovernanceActorRole[];
  unlocksActions: RoleSpecificReviewAction[];
};

export type CompletedRoleSpecificReview = {
  reviewType: RoleSpecificReviewType;
  completedByRole: GovernanceActorRole;
  approved: boolean;
};

export type ResolvePublicationGateInput = {
  actor: GovernanceActor;
  action: Extract<RoleSpecificReviewAction, "approve" | "publish" | "activate">;
  requiredReviewType: RoleSpecificReviewType;
  completedReviews: readonly CompletedRoleSpecificReview[];
};

export type RoleSpecificPublicationGate = {
  allowed: boolean;
  reviewRequired: true;
  autoPublish: false;
  reason:
    | "allowed"
    | "missing_required_review"
    | "review_not_approved"
    | "actor_role_not_permitted";
};

const REVIEW_REQUIREMENTS: Record<
  RoleSpecificReviewType,
  RoleSpecificReviewRequirement
> = {
  self_review: {
    reviewType: "self_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["community", "reviewer", "editor", "admin"],
    unlocksActions: ["review"],
  },
  editorial_review: {
    reviewType: "editorial_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["editor", "editorial_actor", "admin"],
    unlocksActions: ["review", "approve"],
  },
  org_review: {
    reviewType: "org_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["institutional_actor", "admin"],
    unlocksActions: ["review", "approve", "activate"],
  },
  moderation_review: {
    reviewType: "moderation_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["reviewer", "editor", "admin"],
    unlocksActions: ["review", "approve"],
  },
  cost_provider_review: {
    reviewType: "cost_provider_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["admin", "institutional_actor"],
    unlocksActions: ["approve", "render"],
  },
  publish_review: {
    reviewType: "publish_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["editorial_actor", "institutional_actor", "admin"],
    unlocksActions: ["approve", "publish", "activate"],
  },
  source_review: {
    reviewType: "source_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["reviewer", "editor", "editorial_actor", "admin"],
    unlocksActions: ["review", "approve"],
  },
  translation_review: {
    reviewType: "translation_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["editor", "editorial_actor", "admin"],
    unlocksActions: ["review", "translate"],
  },
  voxy_script_review: {
    reviewType: "voxy_script_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["editor", "editorial_actor", "admin"],
    unlocksActions: ["review", "approve"],
  },
  voxy_render_review: {
    reviewType: "voxy_render_review",
    reviewRequired: true,
    autoPublish: false,
    publishReadyIsPublished: false,
    approvalRequiredForPublicAction: true,
    allowedRoles: ["admin", "institutional_actor"],
    unlocksActions: ["approve", "render"],
  },
};

export function getRoleSpecificReviewRequirement(
  reviewType: RoleSpecificReviewType,
): RoleSpecificReviewRequirement {
  return REVIEW_REQUIREMENTS[reviewType];
}

export function canActorCompleteRoleSpecificReview(
  actor: GovernanceActor,
  reviewType: RoleSpecificReviewType,
): boolean {
  if (actor.isAdmin) return true;
  return getRoleSpecificReviewRequirement(reviewType).allowedRoles.includes(
    actor.role,
  );
}

export function resolveRoleSpecificPublicationGate(
  input: ResolvePublicationGateInput,
): RoleSpecificPublicationGate {
  const requirement = getRoleSpecificReviewRequirement(input.requiredReviewType);
  if (!canActorCompleteRoleSpecificReview(input.actor, input.requiredReviewType)) {
    return {
      allowed: false,
      reviewRequired: true,
      autoPublish: false,
      reason: "actor_role_not_permitted",
    };
  }

  const matchingReview = input.completedReviews.find(
    (entry) =>
      entry.reviewType === input.requiredReviewType &&
      requirement.allowedRoles.includes(entry.completedByRole),
  );

  if (!matchingReview) {
    return {
      allowed: false,
      reviewRequired: true,
      autoPublish: false,
      reason: "missing_required_review",
    };
  }

  if (!matchingReview.approved) {
    return {
      allowed: false,
      reviewRequired: true,
      autoPublish: false,
      reason: "review_not_approved",
    };
  }

  return {
    allowed: true,
    reviewRequired: true,
    autoPublish: false,
    reason: "allowed",
  };
}
