import type { AccessTier } from "@/config/accessTiers";

export type ReportScope =
  | "none"
  | "simple"
  | "homeRegion"
  | "homeRegionPlusOne"
  | "ownTopicsBasic"
  | "ownTopicsDeep"
  | "all";

export const UNLIMITED_LIMIT = Number.MAX_SAFE_INTEGER;

export const CONTRIBUTION_LIMITS_PER_MONTH: Record<AccessTier, number> = {
  public: 0,
  basis: 2,
  erweitert: 10,
  premium: 50,
  institutionBasic: 0,
  institutionPremium: 0,
  staff: UNLIMITED_LIMIT,
};

export const STREAM_LIMITS_PER_MONTH: Record<AccessTier, number> = {
  public: 0,
  basis: 0,
  erweitert: 2,
  premium: 5,
  institutionBasic: 2,
  institutionPremium: 10,
  staff: UNLIMITED_LIMIT,
};

export const CAMPAIGN_LIMITS_PER_MONTH: Record<AccessTier, number> = {
  public: 0,
  basis: 0,
  erweitert: 1,
  premium: 3,
  institutionBasic: 1,
  institutionPremium: UNLIMITED_LIMIT,
  staff: UNLIMITED_LIMIT,
};

export const QUESTIONS_PER_CAMPAIGN_LIMITS: Record<AccessTier, number> = {
  public: 0,
  basis: 0,
  erweitert: 5,
  premium: 15,
  institutionBasic: 10,
  institutionPremium: 100,
  staff: 250,
};

export const REPORT_SCOPE: Record<AccessTier, ReportScope> = {
  public: "simple",
  basis: "simple",
  erweitert: "homeRegion",
  premium: "homeRegionPlusOne",
  institutionBasic: "ownTopicsBasic",
  institutionPremium: "ownTopicsDeep",
  staff: "all",
};
