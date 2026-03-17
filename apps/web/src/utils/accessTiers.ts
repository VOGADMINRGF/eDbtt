import { FEATURE_MATRIX_DEFAULTS } from "@/config/featureMatrix";
import { getEngagementLevelFromXp, meetsEngagementLevel, normalizeEngagementLevel } from "@/config/engagement";
import { normalizeAccessTier } from "@/config/accessTiers";

type AccessAwareUser = {
  accessTier?: string | null;
  engagementXp?: number | null;
  engagementLevel?: string | null;
};

function resolveFeatureSet(user?: AccessAwareUser) {
  const tier = normalizeAccessTier(user?.accessTier);
  return FEATURE_MATRIX_DEFAULTS[tier];
}

function resolveEngagementLevel(user?: AccessAwareUser) {
  if (!user) return normalizeEngagementLevel("Interessiert");
  if (user.engagementLevel) return normalizeEngagementLevel(user.engagementLevel);
  return getEngagementLevelFromXp(user.engagementXp ?? 0);
}

export function canUserSwipe(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  return feature.canSwipe;
}

export function canUserVote(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  return feature.canVote;
}

export function canUserChatPublic(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  return feature.canChatPublic;
}

export function canUserCreateStream(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  if (!feature.canCreateStream) return false;
  const level = resolveEngagementLevel(user);
  return meetsEngagementLevel(level, feature.minEngagementLevelForCreateStream);
}

export function canUserHostStream(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  if (!feature.canHostStream) return false;
  const level = resolveEngagementLevel(user);
  return meetsEngagementLevel(level, feature.minEngagementLevelForHostStream);
}

export function canUserCreateCampaign(user?: AccessAwareUser): boolean {
  const feature = resolveFeatureSet(user);
  return feature.canCreateCampaign && feature.maxCampaignsPerMonth > 0;
}
