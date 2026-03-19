import type { EntityStatus } from "./types";

export const ENTITY_STATUS_TRANSITIONS: Record<EntityStatus, EntityStatus[]> = {
  draft: ["curated", "archived"],
  curated: ["reviewed", "draft", "archived"],
  reviewed: ["approved", "curated", "archived"],
  approved: ["published", "reviewed", "archived"],
  published: ["archived"],
  archived: [],
};

export function canTransitionEntityStatus(from: EntityStatus, to: EntityStatus): boolean {
  return ENTITY_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertEntityTransition(from: EntityStatus, to: EntityStatus) {
  if (!canTransitionEntityStatus(from, to)) {
    throw new Error(`entity_transition_not_allowed:${from}->${to}`);
  }
}
