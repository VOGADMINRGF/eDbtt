import { describe, expect, it } from "vitest";
import {
  getFeedRadarStatusCopy,
  resolveFeedRadarStatusFromAnalyzeStatus,
  resolveFeedRadarStatusFromDraft,
  resolveFeedRadarStatusFromSource,
} from "@features/feeds/statusContract";

describe("feed radar status contract", () => {
  it("maps analyze states to a readable runtime chain", () => {
    expect(resolveFeedRadarStatusFromSource({ hasRecentPull: false })).toBe("source_registered");
    expect(resolveFeedRadarStatusFromSource({ hasRecentPull: true })).toBe("pulled");
    expect(resolveFeedRadarStatusFromAnalyzeStatus("pending")).toBe("candidate_created");
    expect(resolveFeedRadarStatusFromAnalyzeStatus("processing")).toBe("analyzing");
    expect(resolveFeedRadarStatusFromAnalyzeStatus("success")).toBe("analyzed");
    expect(resolveFeedRadarStatusFromAnalyzeStatus("error")).toBe("error");
  });

  it("prioritizes review, attachment and publication states without auto-publish language", () => {
    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "queued",
      }),
    ).toBe("needs_review");

    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "draft",
        hasClusterCandidate: true,
      }),
    ).toBe("clustered");

    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "attached",
        hasAnlassraum: true,
      }),
    ).toBe("attached_to_anlassraum");

    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "review",
        feedReviewState: "attached",
        hasAnlassraum: true,
        hasDossier: true,
      }),
    ).toBe("attached_to_dossier");

    expect(
      resolveFeedRadarStatusFromDraft({
        draftStatus: "published",
        hasPublishedStatement: true,
      }),
    ).toBe("published_update");
  });

  it("ships consistent German copy for the shared runtime vocabulary", () => {
    expect(getFeedRadarStatusCopy("needs_review")).toMatchObject({
      label: "In Prüfung",
      tone: "warning",
    });
    expect(getFeedRadarStatusCopy("published_update").description).toContain(
      "bewusst freigegeben",
    );
    expect(getFeedRadarStatusCopy("error").label).toBe("Fehler");
  });
});
