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

export function readFeedDraftAnlassraumIdFromSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return normalizeFilterValue(params.get("anlassraumId"));
}

function normalizeFilterValue(value: string | null | undefined): string {
  return String(value ?? "").trim();
}
