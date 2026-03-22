export const SIGNAL_TO_ANLASSRAUM_PATHS = [
  "ignore",
  "attach_to_existing_anlassraum",
  "create_anlassraum_candidate",
  "manual_fast_path_via_create",
] as const;

export type SignalToAnlassraumPath = (typeof SIGNAL_TO_ANLASSRAUM_PATHS)[number];

export type FeedReviewActionLike =
  | "ignore"
  | "attach_to_anlassraum"
  | "create_anlassraum_candidate"
  | "mark_as_weak_signal";

export function pathFromFeedReviewAction(input: {
  action: FeedReviewActionLike;
  hasExistingAnlassraum: boolean;
}): SignalToAnlassraumPath {
  if (input.action === "ignore") return "ignore";
  if (input.action === "mark_as_weak_signal") return "manual_fast_path_via_create";
  if (input.action === "attach_to_anlassraum") return "attach_to_existing_anlassraum";
  if (input.hasExistingAnlassraum) return "attach_to_existing_anlassraum";
  return "create_anlassraum_candidate";
}

export function preferredPathFromDraftState(input: {
  anlassraumId?: string | null;
  weakSignalFlagged?: boolean;
  feedReviewState?: string | null;
}): SignalToAnlassraumPath {
  if (input.feedReviewState === "ignored") return "ignore";
  if (input.weakSignalFlagged) return "manual_fast_path_via_create";
  if (input.anlassraumId) return "attach_to_existing_anlassraum";
  return "create_anlassraum_candidate";
}
