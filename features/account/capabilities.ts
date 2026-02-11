import type { EngagementLevel } from "@features/user/engagement";
import { isEngagementLevelAtLeast } from "@features/user/engagement";
import type { ProfilePackage } from "./types";

export function canEditTopTopics(level: EngagementLevel): boolean {
  return isEngagementLevelAtLeast(level, "engagiert");
}

export function canPinHighlight(level: EngagementLevel, pkg: ProfilePackage): boolean {
  return isEngagementLevelAtLeast(level, "begeistert") && pkg !== "basic";
}

export function canUseProfileStyles(level: EngagementLevel, pkg: ProfilePackage): boolean {
  return isEngagementLevelAtLeast(level, "begeistert") && pkg !== "basic";
}

export function canShowProfileStats(level: EngagementLevel): boolean {
  return isEngagementLevelAtLeast(level, "engagiert");
}
