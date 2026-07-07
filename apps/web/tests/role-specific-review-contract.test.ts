import { describe, expect, it } from "vitest";
import {
  canActorCompleteRoleSpecificReview,
  getRoleSpecificReviewRequirement,
  resolveRoleSpecificPublicationGate,
} from "@/features/create/roleSpecificReviewContract";

describe("role specific review contract", () => {
  it("keeps publish review review-first and no-auto-publish", () => {
    expect(getRoleSpecificReviewRequirement("publish_review")).toMatchObject({
      reviewRequired: true,
      autoPublish: false,
      approvalRequiredForPublicAction: true,
    });
  });

  it("blocks wrong roles from completing protected review types", () => {
    expect(
      canActorCompleteRoleSpecificReview(
        { userId: "u1", role: "community" },
        "publish_review",
      ),
    ).toBe(false);
    expect(
      canActorCompleteRoleSpecificReview(
        { userId: "u2", role: "institutional_actor" },
        "org_review",
      ),
    ).toBe(true);
  });

  it("allows publication only after matching approved review", () => {
    const gate = resolveRoleSpecificPublicationGate({
      actor: { userId: "u3", role: "editorial_actor" },
      action: "publish",
      requiredReviewType: "publish_review",
      completedReviews: [
        {
          reviewType: "publish_review",
          completedByRole: "editorial_actor",
          approved: true,
        },
      ],
    });

    expect(gate).toEqual({
      allowed: true,
      reviewRequired: true,
      autoPublish: false,
      reason: "allowed",
    });
  });

  it("keeps one-click publish blocked when approval is missing", () => {
    const gate = resolveRoleSpecificPublicationGate({
      actor: { userId: "u4", role: "editorial_actor" },
      action: "publish",
      requiredReviewType: "publish_review",
      completedReviews: [
        {
          reviewType: "publish_review",
          completedByRole: "editorial_actor",
          approved: false,
        },
      ],
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("review_not_approved");
  });
});
