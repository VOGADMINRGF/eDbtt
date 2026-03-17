export {
  XP_EVENTS,
  ENGAGEMENT_LEVEL_ORDER,
  ENGAGEMENT_LEVEL_THRESHOLDS,
  getEngagementLevelFromXp,
  normalizeEngagementLevel,
  toEngagementLevelKey,
  compareEngagementLevels,
  meetsEngagementLevel,
} from "../apps/web/src/config/engagement";

import {
  ENGAGEMENT_LEVEL_THRESHOLDS,
  getEngagementLevelFromXp,
  toEngagementLevelKey,
  type EngagementLevelKey,
} from "../apps/web/src/config/engagement";

export type EngagementThreshold = {
  minXp: number;
  level: EngagementLevelKey;
};

// Legacy export for existing feature modules.
export const ENGAGEMENT_THRESHOLDS: EngagementThreshold[] = ENGAGEMENT_LEVEL_THRESHOLDS.map(
  (entry) => ({
    minXp: entry.minXp,
    level: toEngagementLevelKey(entry.level),
  }),
);

export function getEngagementLevelKeyFromXp(totalXp: number): EngagementLevelKey {
  return toEngagementLevelKey(getEngagementLevelFromXp(totalXp));
}
