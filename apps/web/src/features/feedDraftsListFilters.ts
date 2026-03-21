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

export function readFeedDraftFiltersFromSearch(search: string): FeedDraftHydratedFilterState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const anlassraumIdFilter = normalizeAnlassraumIdFilter(params.get("anlassraumId"));
  const linkFilterFromSearch = normalizeEnumParam(
    params.get("hasAnlassraum"),
    LINK_FILTER_VALUES,
    FEED_DRAFT_FILTER_DEFAULTS.linkFilter,
  );

  return {
    statusFilter: normalizeEnumParam(
      params.get("status"),
      STATUS_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.statusFilter,
    ),
    reviewStateFilter: normalizeEnumParam(
      params.get("reviewState"),
      REVIEW_STATE_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.reviewStateFilter,
    ),
    sort: normalizeEnumParam(
      params.get("sort"),
      SORT_FILTER_VALUES,
      FEED_DRAFT_FILTER_DEFAULTS.sort,
    ),
    query: normalizeFilterValue(params.get("q")),
    linkFilter:
      anlassraumIdFilter && linkFilterFromSearch === "all"
        ? "linked"
        : linkFilterFromSearch,
    weakSignalFilter: normalizeEnumParam(
      params.get("weakSignal"),
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
  return /^[a-f0-9]{24}$/i.test(normalized) ? normalized : "";
}

function normalizeEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const normalized = normalizeFilterValue(value).toLowerCase();
  if (!normalized) return fallback;
  const match = allowed.find((entry) => entry === normalized);
  return match ?? fallback;
}
