import { SWIPES_PER_CONTRIBUTION_CREDIT } from "../../config/credits";
import type { AccessTier } from "@features/pricing/types";
export type { AccessTier } from "@features/pricing/types";
import { LIMITS } from "@features/pricing/limits";
import { PRIVATE_PACKAGE_IDS } from "@features/pricing/domain/helpers";

type PrivatePackageId = (typeof PRIVATE_PACKAGE_IDS)[number];
export type EDebattePackageCode = PrivatePackageId | "none";

export interface AccessTierConfigEntry {
  label: string;
  citizenLabel: string;
  edebattePackage: EDebattePackageCode;
  monthlyContributionLimit: number | null;
  swipeToCreditRatio: number;
}

const UNLIMITED_CONTRIBUTIONS: AccessTier[] = [
  "citizenPremium",
  "citizenPro",
  "citizenUltra",
  "staff",
];

const DEFAULT_EDEBATTE_MAPPING: Record<AccessTier, EDebattePackageCode> = {
  public: "basis",
  citizenBasic: "basis",
  citizenPremium: "start",
  citizenPro: "pro",
  citizenUltra: "pro",
  institutionBasic: "start",
  institutionPremium: "pro",
  staff: "pro",
};

const ACCESS_TIER_ALIASES: Record<string, AccessTier> = {
  basis: "citizenBasic",
  erweitert: "citizenPremium",
  premium: "citizenPro",
  "edb-basis": "citizenBasic",
  "edb-erweitert": "citizenPremium",
  "edb-premium": "citizenPro",
  start: "citizenPremium",
  pro: "citizenPro",
};

export const ACCESS_TIER_CONFIG: Record<AccessTier, AccessTierConfigEntry> = Object.fromEntries(
  (Object.keys(LIMITS) as AccessTier[]).map((tier) => {
    const contributionsPerMonth = LIMITS[tier]?.contributionsPerMonth ?? 0;
    const monthlyContributionLimit = UNLIMITED_CONTRIBUTIONS.includes(tier) ? null : contributionsPerMonth;

    return [
      tier,
      {
        label: tier,
        citizenLabel: tier,
        edebattePackage: DEFAULT_EDEBATTE_MAPPING[tier],
        monthlyContributionLimit,
        swipeToCreditRatio: SWIPES_PER_CONTRIBUTION_CREDIT,
      },
    ];
  }),
) as Record<AccessTier, AccessTierConfigEntry>;

export function deriveAccessTierFromPlanCode(planCode: string | null | undefined): AccessTier {
  const normalized = (planCode ?? "").trim();
  if (!normalized) return "citizenBasic";

  if ((ACCESS_TIER_CONFIG as Record<string, any>)[normalized]) {
    return normalized as AccessTier;
  }
  if (ACCESS_TIER_ALIASES[normalized]) {
    return ACCESS_TIER_ALIASES[normalized];
  }
  return "citizenBasic";
}

type UserLike = {
  accessTier?: AccessTier | string | null;
  membership?: { planCode?: string | null } | null;
  b2cPlanId?: string | null;
  tier?: string | null;
};

export function getUserAccessTier(user: UserLike): AccessTier {
  if (user.accessTier) return deriveAccessTierFromPlanCode(user.accessTier);
  if (user.membership?.planCode) return deriveAccessTierFromPlanCode(user.membership.planCode);
  if (user.b2cPlanId) return deriveAccessTierFromPlanCode(user.b2cPlanId);
  if (user.tier) return deriveAccessTierFromPlanCode(user.tier);
  return "citizenBasic";
}

export function getAccessTierConfigForUser(user: UserLike): AccessTierConfigEntry {
  const tier = getUserAccessTier(user);
  return ACCESS_TIER_CONFIG[tier];
}

export function hasUnlimitedContributions(tier: AccessTier): boolean {
  return ACCESS_TIER_CONFIG[tier].monthlyContributionLimit === null;
}
