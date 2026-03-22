import { describe, expect, it } from "vitest";
import { pathFromFeedReviewAction, preferredPathFromDraftState } from "@features/feeds/signalDecisioning";

describe("feed signal decisioning", () => {
  it("maps explicit review actions to stable signal->anlassraum paths", () => {
    expect(pathFromFeedReviewAction({ action: "ignore", hasExistingAnlassraum: false })).toBe("ignore");
    expect(pathFromFeedReviewAction({ action: "attach_to_anlassraum", hasExistingAnlassraum: false })).toBe(
      "attach_to_existing_anlassraum",
    );
    expect(pathFromFeedReviewAction({ action: "mark_as_weak_signal", hasExistingAnlassraum: false })).toBe(
      "manual_fast_path_via_create",
    );
  });

  it("prefers attach path over candidate-create when an existing anlassraum is already linked", () => {
    expect(pathFromFeedReviewAction({ action: "create_anlassraum_candidate", hasExistingAnlassraum: true })).toBe(
      "attach_to_existing_anlassraum",
    );
  });

  it("derives preferred path from draft state deterministically", () => {
    expect(
      preferredPathFromDraftState({
        feedReviewState: "ignored",
        anlassraumId: "65a111111111111111111111",
        weakSignalFlagged: true,
      }),
    ).toBe("ignore");
    expect(
      preferredPathFromDraftState({
        feedReviewState: "queued",
        anlassraumId: null,
        weakSignalFlagged: true,
      }),
    ).toBe("manual_fast_path_via_create");
    expect(
      preferredPathFromDraftState({
        feedReviewState: "attached",
        anlassraumId: "65a111111111111111111111",
        weakSignalFlagged: false,
      }),
    ).toBe("attach_to_existing_anlassraum");
    expect(
      preferredPathFromDraftState({
        feedReviewState: "queued",
        anlassraumId: null,
        weakSignalFlagged: false,
      }),
    ).toBe("create_anlassraum_candidate");
  });
});
