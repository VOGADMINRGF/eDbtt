// features/user/engagement.ts
import {
  SWIPES_PER_CONTRIBUTION_CREDIT,
} from "../../config/credits";
import {
  ENGAGEMENT_LEVEL_LABELS,
  ENGAGEMENT_LEVELS,
  ENGAGEMENT_THRESHOLDS,
  type EngagementLevel,
} from "../../config/levels";

export type { EngagementLevel } from "../../config/levels";

export function isEngagementLevel(value: unknown): value is EngagementLevel {
  return (
    typeof value === "string" &&
    (ENGAGEMENT_LEVELS as readonly string[]).includes(value)
  );
}

export function getEngagementLevelLabel(level: EngagementLevel): string {
  return ENGAGEMENT_LEVEL_LABELS[level];
}

export function getEngagementLevel(xp: number): EngagementLevel {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const match = ENGAGEMENT_THRESHOLDS.find((entry) => safeXp >= entry.minXp);
  return match?.level ?? "interessiert";
}

export function isEngagementLevelAtLeast(
  level: EngagementLevel,
  required: EngagementLevel,
): boolean {
  return ENGAGEMENT_LEVELS.indexOf(level) >= ENGAGEMENT_LEVELS.indexOf(required);
}

export function swipesUntilNextCredit(totalSwipes: number): number {
  const safeTotal = Number.isFinite(totalSwipes) ? Math.max(0, Math.floor(totalSwipes)) : 0;
  const remainder = safeTotal % SWIPES_PER_CONTRIBUTION_CREDIT;
  if (remainder === 0) {
    return SWIPES_PER_CONTRIBUTION_CREDIT;
  }
  return SWIPES_PER_CONTRIBUTION_CREDIT - remainder;
}
