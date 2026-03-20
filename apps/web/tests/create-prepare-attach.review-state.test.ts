import { describe, expect, it } from "vitest";
import {
  applyPrepareAttachDraftReviewDecision,
  createInitialPrepareAttachDraftReviewFields,
  isCreatePrepareAttachDraftReviewDecision,
  isCreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";

describe("prepare-attach review state helpers", () => {
  it("starts new drafts as pending with applyState=not_applied", () => {
    const initial = createInitialPrepareAttachDraftReviewFields();
    expect(initial.reviewState).toBe("pending");
    expect(initial.applyState).toBe("not_applied");
    expect(initial.reviewNote).toBeNull();
    expect(initial.reviewedAt).toBeNull();
    expect(initial.reviewedBy).toBeNull();
  });

  it("accept/reject/park decisions keep applyState not_applied", () => {
    const accepted = applyPrepareAttachDraftReviewDecision({
      decision: "accepted_for_apply",
      reviewNote: "spaeter manuell anwenden",
      reviewedAt: "2026-03-20T12:00:00.000Z",
      reviewedBy: "u-review",
    });
    const rejected = applyPrepareAttachDraftReviewDecision({
      decision: "rejected",
      reviewNote: "nicht passend",
      reviewedAt: "2026-03-20T12:10:00.000Z",
      reviewedBy: "u-review",
    });
    const parked = applyPrepareAttachDraftReviewDecision({
      decision: "parked",
      reviewNote: null,
      reviewedAt: "2026-03-20T12:20:00.000Z",
      reviewedBy: "u-review",
    });

    expect(accepted.reviewState).toBe("accepted_for_apply");
    expect(accepted.applyState).toBe("not_applied");
    expect(rejected.reviewState).toBe("rejected");
    expect(rejected.applyState).toBe("not_applied");
    expect(parked.reviewState).toBe("parked");
    expect(parked.applyState).toBe("not_applied");
  });

  it("validates review states and decisions strictly", () => {
    expect(isCreatePrepareAttachDraftReviewState("pending")).toBe(true);
    expect(isCreatePrepareAttachDraftReviewState("accepted_for_apply")).toBe(true);
    expect(isCreatePrepareAttachDraftReviewState("bad_state")).toBe(false);

    expect(isCreatePrepareAttachDraftReviewDecision("accepted_for_apply")).toBe(true);
    expect(isCreatePrepareAttachDraftReviewDecision("rejected")).toBe(true);
    expect(isCreatePrepareAttachDraftReviewDecision("parked")).toBe(true);
    expect(isCreatePrepareAttachDraftReviewDecision("pending")).toBe(false);
  });
});
