import { describe, expect, it } from "vitest";
import {
  buildSwipesFeedFilter,
  countFromDraftFocusItems,
  hasFromDraftFocusItems,
  resolveFromDraftArrivalStatus,
  resolveInitialSwipesArrivalMode,
  resolveSwipesArrivalToggle,
  resolveSwipesEmptyStateMessage,
  resolveThematicContextHref,
  shouldShowArrivalContextReminder,
} from "@/features/surfaces/swipes/arrival";

describe("swipes arrival helpers", () => {
  it("enables draft-arrival mode only when fromDraft exists", () => {
    expect(resolveInitialSwipesArrivalMode("65f000000000000000000011")).toBe("from_draft");
    expect(resolveInitialSwipesArrivalMode(null)).toBe("all");
  });

  it("adds fromDraft filter only in from_draft mode", () => {
    const draftId = "65f000000000000000000011";
    expect(
      buildSwipesFeedFilter({
        topicQuery: "wohnen",
        level: "ALL",
        statementId: undefined,
        fromDraftId: draftId,
        arrivalMode: "from_draft",
      }),
    ).toMatchObject({ fromDraftId: draftId });

    expect(
      buildSwipesFeedFilter({
        topicQuery: "wohnen",
        level: "ALL",
        statementId: undefined,
        fromDraftId: draftId,
        arrivalMode: "all",
      }),
    ).not.toHaveProperty("fromDraftId");
  });

  it("detects whether feed contains focused fromDraft proposals", () => {
    expect(
      hasFromDraftFocusItems([
        { id: "a", fromDraftMatch: false } as any,
        { id: "b", fromDraftMatch: true } as any,
      ]),
    ).toBe(true);

    expect(hasFromDraftFocusItems([{ id: "a", fromDraftMatch: false } as any])).toBe(false);
    expect(
      countFromDraftFocusItems([
        { id: "a", fromDraftMatch: false } as any,
        { id: "b", fromDraftMatch: true } as any,
        { id: "c", fromDraftMatch: true } as any,
      ]),
    ).toBe(2);
  });

  it("resolves explicit arrival mode toggle labels and targets", () => {
    expect(resolveSwipesArrivalToggle("from_draft")).toEqual({
      label: "Alle Vorschläge",
      nextMode: "all",
    });
    expect(resolveSwipesArrivalToggle("all")).toEqual({
      label: "Neu aus deinem Beitrag",
      nextMode: "from_draft",
    });
  });

  it("keeps no-match fallback text stable for fromDraft arrival", () => {
    expect(
      resolveSwipesEmptyStateMessage({
        showingFromDraftOnly: true,
      }),
    ).toContain("noch keine Vorschläge");
    expect(
      resolveSwipesEmptyStateMessage({
        showingFromDraftOnly: false,
      }),
    ).toContain("keine weiteren Themen");
  });

  it("shows compact status text for large fromDraft hit sets", () => {
    expect(
      resolveFromDraftArrivalStatus({
        showingFromDraftOnly: true,
        focusedCount: 9,
      }),
    ).toContain("9");
  });

  it("returns thematic context href only for valid internal links", () => {
    expect(
      resolveThematicContextHref({
        id: "stmt-1",
        anlassraumId: "65f000000000000000000011",
      } as any),
    ).toBe("/create?mode=source&anlassraumId=65f000000000000000000011");

    expect(
      resolveThematicContextHref({
        id: "stmt-1",
        contextHref: "/create?anlassraumId=65f000000000000000000011",
      } as any),
    ).toBe("/create?mode=source&anlassraumId=65f000000000000000000011");

    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "/admin" } as any)).toBeNull();
    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "https://evil.example" } as any)).toBeNull();
    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "//evil.example" } as any)).toBeNull();
    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "/create?mode=ai&anlassraumId=65f000000000000000000011" } as any)).toBeNull();
    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "/create?mode=source&anlassraumId=bad-id" } as any)).toBeNull();
    expect(resolveThematicContextHref({ id: "stmt-1", contextHref: "/dossier/dossier-1" } as any)).toBeNull();
    expect(resolveThematicContextHref(null)).toBeNull();
  });

  it("shows arrival context reminder only when no thematic context link exists", () => {
    expect(shouldShowArrivalContextReminder("/create?mode=source&anlassraumId=65f000000000000000000011")).toBe(false);
    expect(shouldShowArrivalContextReminder(null)).toBe(true);
  });
});
