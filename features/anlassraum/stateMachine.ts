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
  draft: ["curated", "archived"],
  curated: ["reviewed", "draft", "archived"],
  reviewed: ["approved", "curated", "archived"],
  approved: ["active", "reviewed", "archived"],
  active: ["archived"],
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
