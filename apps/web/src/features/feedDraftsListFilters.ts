export type BuildFeedDraftListSearchParamsInput = {
  statusFilter: string;
  regionFilter: string;
  reviewStateFilter: string;
  linkFilter: string;
  weakSignalFilter: string;
  anlassraumIdFilter: string;
  sort: string;
  query: string;
};

export type FeedDraftStatusFilter = "all" | "draft" | "review" | "published" | "discarded";
export type FeedDraftReviewStateFilter =
  | "all"
  | "queued"
  | "ignored"
  | "attached"
  | "candidate_created"
  | "weak_signal";
export type FeedDraftSortFilter = "newest" | "oldest" | "review_recent" | "review_stale" | "priority_high";
export type FeedDraftLinkFilter = "all" | "linked" | "unlinked";
export type FeedDraftWeakSignalFilter = "all" | "flagged" | "clear";

export type FeedDraftHydratedFilterState = {
  statusFilter: FeedDraftStatusFilter;
  reviewStateFilter: FeedDraftReviewStateFilter;
  sort: FeedDraftSortFilter;
  query: string;
  linkFilter: FeedDraftLinkFilter;
  weakSignalFilter: FeedDraftWeakSignalFilter;
  anlassraumIdFilter: string;
};

export type FeedDraftFilterStateInput = {
  statusFilter?: string | null;
  reviewStateFilter?: string | null;
  sort?: string | null;
  query?: string | null;
  linkFilter?: string | null;
  weakSignalFilter?: string | null;
  anlassraumIdFilter?: string | null;
};

export const FEED_DRAFT_FILTER_DEFAULTS: FeedDraftHydratedFilterState = {
  statusFilter: "all",
  reviewStateFilter: "all",
  sort: "priority_high",
  query: "",
  linkFilter: "all",
  weakSignalFilter: "all",
  anlassraumIdFilter: "",
};

const STATUS_FILTER_VALUES: FeedDraftStatusFilter[] = [
  "all",
  "draft",
  "review",
  "published",
  "discarded",
];
const REVIEW_STATE_FILTER_VALUES: FeedDraftReviewStateFilter[] = [
  "all",
  "queued",
  "ignored",
  "attached",
  "candidate_created",
  "weak_signal",
];
const SORT_FILTER_VALUES: FeedDraftSortFilter[] = [
  "newest",
  "oldest",
  "review_recent",
  "review_stale",
  "priority_high",
];
const LINK_FILTER_VALUES: FeedDraftLinkFilter[] = ["all", "linked", "unlinked"];
const WEAK_SIGNAL_FILTER_VALUES: FeedDraftWeakSignalFilter[] = ["all", "flagged", "clear"];

export function buildFeedDraftListSearchParams(
  input: BuildFeedDraftListSearchParamsInput,
): URLSearchParams {
  const qs = new URLSearchParams();
  if (input.statusFilter !== "all") qs.set("status", input.statusFilter);
  if (input.regionFilter !== "all") qs.set("regionCode", input.regionFilter);
  if (input.reviewStateFilter !== "all") qs.set("reviewState", input.reviewStateFilter);
  if (input.linkFilter !== "all") qs.set("hasAnlassraum", input.linkFilter);
  if (input.weakSignalFilter !== "all") qs.set("weakSignal", input.weakSignalFilter);

  const normalizedAnlassraumId = normalizeFilterValue(input.anlassraumIdFilter);
  if (normalizedAnlassraumId) qs.set("anlassraumId", normalizedAnlassraumId);

  if (input.sort !== "newest") qs.set("sort", input.sort);

  const normalizedQuery = normalizeFilterValue(input.query);
  if (normalizedQuery) qs.set("q", normalizedQuery);
  return qs;
}

export function buildFeedDraftUrlSearchParams(
  input: FeedDraftFilterStateInput,
): URLSearchParams {
  const normalized = normalizeFeedDraftFilterState(input);
  const qs = new URLSearchParams();

  if (normalized.statusFilter !== FEED_DRAFT_FILTER_DEFAULTS.statusFilter) {
    qs.set("status", normalized.statusFilter);
  }
  if (normalized.reviewStateFilter !== FEED_DRAFT_FILTER_DEFAULTS.reviewStateFilter) {
    qs.set("reviewState", normalized.reviewStateFilter);
  }
  if (normalized.sort !== FEED_DRAFT_FILTER_DEFAULTS.sort) {
    qs.set("sort", normalized.sort);
  }
  if (normalized.query) {
    qs.set("q", normalized.query);
  }
  if (normalized.linkFilter !== FEED_DRAFT_FILTER_DEFAULTS.linkFilter) {
    qs.set("hasAnlassraum", normalized.linkFilter);
  }
  if (normalized.weakSignalFilter !== FEED_DRAFT_FILTER_DEFAULTS.weakSignalFilter) {
    qs.set("weakSignal", normalized.weakSignalFilter);
  }
  if (normalized.anlassraumIdFilter) {
    qs.set("anlassraumId", normalized.anlassraumIdFilter);
  }

  return qs;
}

export function readFeedDraftFiltersFromSearch(search: string): FeedDraftHydratedFilterState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return normalizeFeedDraftFilterState({
    statusFilter: params.get("status"),
    reviewStateFilter: params.get("reviewState"),
    sort: params.get("sort"),
    query: params.get("q"),
    linkFilter: params.get("hasAnlassraum"),
    weakSignalFilter: params.get("weakSignal"),
    anlassraumIdFilter: params.get("anlassraumId"),
  });
}

export function normalizeFeedDraftFilterState(
  input: FeedDraftFilterStateInput,
): FeedDraftHydratedFilterState {
  const anlassraumIdFilter = normalizeAnlassraumIdFilter(input.anlassraumIdFilter);
  const linkFilterFromInput = normalizeEnumValue(
    input.linkFilter,
    LINK_FILTER_VALUES,
    FEED_DRAFT_FILTER_DEFAULTS.linkFilter,
  );

  return {
    statusFilter: normalizeEnumValue(
      input.statusFilter,
      STATUS_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.statusFilter,
    ),
    reviewStateFilter: normalizeEnumValue(
      input.reviewStateFilter,
      REVIEW_STATE_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.reviewStateFilter,
    ),
    sort: normalizeEnumValue(
      input.sort,
      SORT_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.sort,
    ),
    query: normalizeFilterValue(input.query),
    linkFilter:
      anlassraumIdFilter && linkFilterFromInput === "all"
        ? "linked"
        : linkFilterFromInput,
    weakSignalFilter: normalizeEnumValue(
      input.weakSignalFilter,
      WEAK_SIGNAL_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.weakSignalFilter,
    ),
    anlassraumIdFilter,
  };
}

function normalizeFilterValue(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function normalizeAnlassraumIdFilter(value: string | null | undefined): string {
  const normalized = normalizeFilterValue(value);
  if (!normalized) return "";
  return /^[a-f0-9]{24}$/i.test(normalized) ? normalized.toLowerCase() : "";
}

function normalizeEnumValue<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const normalized = normalizeFilterValue(value).toLowerCase();
  if (!normalized) return fallback;
  const match = allowed.find((entry) => entry === normalized);
  return match ?? fallback;
}
