import { describe, expect, it } from "vitest";
import {
  buildFeedDraftListSearchParams,
  readFeedDraftAnlassraumIdFromSearch,
} from "@/features/feedDraftsListFilters";

describe("feed drafts page helpers", () => {
  it("hydrates anlassraumId from URL search", () => {
    const value = readFeedDraftAnlassraumIdFromSearch(
      "?hasAnlassraum=linked&anlassraumId=%2065f000000000000000000111%20",
    );
    expect(value).toBe("65f000000000000000000111");
  });

  it("builds list query params including anlassraumId filter", () => {
    const params = buildFeedDraftListSearchParams({
      statusFilter: "review",
      regionFilter: "DE",
      reviewStateFilter: "queued",
      linkFilter: "linked",
      weakSignalFilter: "flagged",
      anlassraumIdFilter: " 65f000000000000000000111 ",
      sort: "priority_high",
      query: "  mobilitaet ",
    });

    expect(params.get("status")).toBe("review");
    expect(params.get("regionCode")).toBe("DE");
    expect(params.get("reviewState")).toBe("queued");
    expect(params.get("hasAnlassraum")).toBe("linked");
    expect(params.get("weakSignal")).toBe("flagged");
    expect(params.get("anlassraumId")).toBe("65f000000000000000000111");
    expect(params.get("sort")).toBe("priority_high");
    expect(params.get("q")).toBe("mobilitaet");
  });
});
