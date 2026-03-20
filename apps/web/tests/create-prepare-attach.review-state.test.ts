import { describe, expect, it } from "vitest";
import {
  applyPrepareAttachDraftFailure,
  applyPrepareAttachDraftReviewDecision,
  applyPrepareAttachDraftSuccess,
  createInitialPrepareAttachDraftReviewFields,
  isCreatePrepareAttachDraftApplyState,
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
    expect(initial.appliedAt).toBeNull();
    expect(initial.appliedBy).toBeNull();
    expect(initial.applyNote).toBeNull();
    expect(initial.applyError).toBeNull();
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

  it("tracks apply success/failure states explicitly", () => {
    const applied = applyPrepareAttachDraftSuccess({
      appliedAt: "2026-03-20T13:00:00.000Z",
      appliedBy: "u-review",
      applyNote: "manuell uebernommen",
    });
    const failed = applyPrepareAttachDraftFailure({
      appliedAt: "2026-03-20T13:10:00.000Z",
      appliedBy: "u-review",
      applyNote: "retry spaeter",
      applyError: "attach_target_not_found",
    });

    expect(applied.applyState).toBe("applied");
    expect(applied.applyError).toBeNull();
    expect(failed.applyState).toBe("apply_failed");
    expect(failed.applyError).toBe("attach_target_not_found");
    expect(isCreatePrepareAttachDraftApplyState("not_applied")).toBe(true);
    expect(isCreatePrepareAttachDraftApplyState("applied")).toBe(true);
    expect(isCreatePrepareAttachDraftApplyState("apply_failed")).toBe(true);
    expect(isCreatePrepareAttachDraftApplyState("bad")).toBe(false);
  });
});
