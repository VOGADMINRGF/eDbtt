import type {
  AnlassraumLifecycleStatus,
  AnlassraumMaturity,
  AnlassraumStatus,
  LegacyAnlassraumStatus,
} from "./types";

export const ANLASSRAUM_STATUS_TRANSITIONS: Record<
  AnlassraumLifecycleStatus,
  AnlassraumLifecycleStatus[]
> = {
  draft: ["curated", "review_required", "archived"],
  curated: ["reviewed", "review_required", "draft", "archived"],
  reviewed: ["approved", "ready_for_public_link", "curated", "archived"],
  approved: ["active", "ready_for_public_link", "reviewed", "archived"],
  active: ["paused", "follow_up_required", "closed", "archived"],
  paused: ["active", "closed", "archived"],
  closed: ["follow_up_required", "archived"],
  review_required: ["ready_for_public_link", "curated", "archived"],
  ready_for_public_link: ["active", "review_required", "archived"],
  follow_up_required: ["review_required", "ready_for_public_link", "archived"],
  archived: [],
};

export const ANLASSRAUM_MATURITY_TRANSITIONS: Record<AnlassraumMaturity, AnlassraumMaturity[]> = {
  signal: ["emerging", "monitoring"],
  emerging: ["structured", "monitoring"],
  structured: ["decision_ready", "monitoring"],
  decision_ready: ["monitoring"],
  monitoring: ["emerging", "structured"],
};

export function normalizeAnlassraumStatus(status: AnlassraumStatus): AnlassraumLifecycleStatus {
  if (status === "draft") return status;
  if (status === "curated") return status;
  if (status === "reviewed") return status;
  if (status === "approved") return status;
  if (status === "active") return status;
  if (status === "paused") return status;
  if (status === "closed") return status;
  if (status === "review_required") return status;
  if (status === "ready_for_public_link") return status;
  if (status === "follow_up_required") return status;
  if (status === "archived") return status;
  return mapLegacyStatus(status);
}

export function canTransitionAnlassraumStatus(
  from: AnlassraumStatus,
  to: AnlassraumLifecycleStatus,
): boolean {
  const normalized = normalizeAnlassraumStatus(from);
  return ANLASSRAUM_STATUS_TRANSITIONS[normalized]?.includes(to) ?? false;
}

export function assertAnlassraumStatusTransition(
  from: AnlassraumStatus,
  to: AnlassraumLifecycleStatus,
) {
  if (!canTransitionAnlassraumStatus(from, to)) {
    throw new Error(`anlassraum_transition_not_allowed:${from}->${to}`);
  }
}

function mapLegacyStatus(status: LegacyAnlassraumStatus): AnlassraumLifecycleStatus {
  if (status === "auto_ingested") return "draft";
  if (status === "auto_clustered") return "curated";
  if (status === "needs_editor_review") return "curated";
  if (status === "ready_for_round") return "approved";
  return "active"; // "published"
}
