import { describe, expect, it } from "vitest";
import {
  buildFeedDraftListSearchParams,
  buildFeedDraftUrlSearchParams,
  FEED_DRAFT_FILTER_DEFAULTS,
  readFeedDraftFiltersFromSearch,
} from "@/features/feedDraftsListFilters";

describe("feed drafts page helpers", () => {
  it("hydrates complete filter state from URL when values are valid", () => {
    const hydrated = readFeedDraftFiltersFromSearch(
      "?status=review&reviewState=queued&sort=oldest&q=%20Mobilitaet%20&hasAnlassraum=linked&weakSignal=flagged&anlassraumId=%2065f000000000000000000111%20",
    );
    expect(hydrated).toEqual({
      statusFilter: "review",
      reviewStateFilter: "queued",
      sort: "oldest",
      query: "Mobilitaet",
      linkFilter: "linked",
      weakSignalFilter: "flagged",
      anlassraumIdFilter: "65f000000000000000000111",
    });
  });

  it("falls back to defensive defaults for invalid URL values", () => {
    const hydrated = readFeedDraftFiltersFromSearch(
      "?status=broken&reviewState=unknown&sort=fast&q=%20%20&hasAnlassraum=invalid&weakSignal=invalid&anlassraumId=not-object-id",
    );
    expect(hydrated).toEqual(FEED_DRAFT_FILTER_DEFAULTS);
  });

  it("defaults hasAnlassraum to linked when a valid anlassraumId is present", () => {
    const hydrated = readFeedDraftFiltersFromSearch("?anlassraumId=65f000000000000000000111");
    expect(hydrated).toMatchObject({
      linkFilter: "linked",
      anlassraumIdFilter: "65f000000000000000000111",
    });
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

  it("serializes only active non-default filters into URL params", () => {
    const params = buildFeedDraftUrlSearchParams({
      statusFilter: "review",
      reviewStateFilter: "queued",
      sort: "oldest",
      query: "Mobilitaet",
      linkFilter: "linked",
      weakSignalFilter: "flagged",
      anlassraumIdFilter: "65f000000000000000000111",
    });

    expect(params.get("status")).toBe("review");
    expect(params.get("reviewState")).toBe("queued");
    expect(params.get("sort")).toBe("oldest");
    expect(params.get("q")).toBe("Mobilitaet");
    expect(params.get("hasAnlassraum")).toBe("linked");
    expect(params.get("weakSignal")).toBe("flagged");
    expect(params.get("anlassraumId")).toBe("65f000000000000000000111");
  });

  it("serializes defaults to an empty URL state", () => {
    const params = buildFeedDraftUrlSearchParams(FEED_DRAFT_FILTER_DEFAULTS);
    expect(params.toString()).toBe("");
  });

  it("drops invalid anlassraumId while keeping valid active filters", () => {
    const params = buildFeedDraftUrlSearchParams({
      sort: "oldest",
      anlassraumIdFilter: "invalid-id",
    });

    expect(params.get("sort")).toBe("oldest");
    expect(params.has("anlassraumId")).toBe(false);
  });
});
