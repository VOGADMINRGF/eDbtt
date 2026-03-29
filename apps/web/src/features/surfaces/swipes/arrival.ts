import type { SwipeFeedFilter, SwipeItem } from "@/features/swipes/types";

export type SwipesArrivalMode = "from_draft" | "all";
type SwipesArrivalToggle = {
  label: string;
  nextMode: SwipesArrivalMode;
};

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

function normalizeObjectId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!OBJECT_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function normalizeCreateContextHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  const parsed = new URL(trimmed, "https://edebatte.invalid");
  if (parsed.pathname !== "/create") return null;
  const mode = parsed.searchParams.get("mode");
  if (mode && mode !== "source") return null;
  const anlassraumId = normalizeObjectId(parsed.searchParams.get("anlassraumId"));
  if (!anlassraumId) return null;
  return `/create?mode=source&anlassraumId=${encodeURIComponent(anlassraumId)}`;
}

export function resolveInitialSwipesArrivalMode(fromDraftId: string | null): SwipesArrivalMode {
  return fromDraftId ? "from_draft" : "all";
}

export function buildSwipesFeedFilter(params: {
  topicQuery?: string;
  level: SwipeFeedFilter["level"];
  statementId?: string;
  fromDraftId?: string | null;
  arrivalMode: SwipesArrivalMode;
}): SwipeFeedFilter {
  const filter: SwipeFeedFilter = {
    topicQuery: params.topicQuery,
    level: params.level,
    statementId: params.statementId,
  };

  if (params.arrivalMode === "from_draft" && params.fromDraftId) {
    filter.fromDraftId = params.fromDraftId;
  }

  return filter;
}

export function hasFromDraftFocusItems(items: SwipeItem[]): boolean {
  return countFromDraftFocusItems(items) > 0;
}

export function countFromDraftFocusItems(items: SwipeItem[]): number {
  return items.filter((item) => item.fromDraftMatch === true).length;
}

export function resolveThematicContextHref(item: SwipeItem | null): string | null {
  const anlassraumId = normalizeObjectId(item?.anlassraumId);
  if (anlassraumId) {
    return `/create?mode=source&anlassraumId=${encodeURIComponent(anlassraumId)}`;
  }
  return normalizeCreateContextHref(item?.contextHref);
}

export function shouldShowArrivalContextReminder(thematicContextHref: string | null): boolean {
  return !thematicContextHref;
}

export function resolveSwipesArrivalToggle(mode: SwipesArrivalMode): SwipesArrivalToggle {
  if (mode === "from_draft") {
    return { label: "Alle Vorschläge", nextMode: "all" };
  }
  return { label: "Neu aus deinem Beitrag", nextMode: "from_draft" };
}

export function resolveFromDraftArrivalStatus(params: {
  showingFromDraftOnly: boolean;
  focusedCount: number;
}): string {
  if (!params.showingFromDraftOnly) {
    return "Du siehst den allgemeinen Beteiligungsmodus.";
  }
  if (params.focusedCount <= 0) {
    return "Vorschläge werden nach Verarbeitung hier sichtbar.";
  }
  if (params.focusedCount > 6) {
    return `Du siehst jetzt zuerst ${params.focusedCount} abgeleitete Vorschläge.`;
  }
  return "Du siehst jetzt zuerst die daraus abgeleiteten Vorschläge.";
}

export function resolveSwipesEmptyStateMessage(params: {
  showingFromDraftOnly: boolean;
}): string {
  if (params.showingFromDraftOnly) {
    return "Dein Beitrag ist eingereicht. Für diesen Entwurf sind aktuell noch keine Vorschläge im Swipe-Deck sichtbar.";
  }
  return "Aktuell keine weiteren Themen im Stream. Passe Filter an oder starte mit Trendthemen.";
}
