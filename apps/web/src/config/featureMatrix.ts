import { ACCESS_TIERS, type AccessTier } from "@/config/accessTiers";
import { ENGAGEMENT_LEVEL_ORDER, type EngagementLevel } from "@/config/engagement";
import {
  CAMPAIGN_LIMITS_PER_MONTH,
  QUESTIONS_PER_CAMPAIGN_LIMITS,
  REPORT_SCOPE,
  STREAM_LIMITS_PER_MONTH,
  UNLIMITED_LIMIT,
  type ReportScope,
} from "@/config/limits";

export type FeatureKey =
  | "canSwipe"
  | "maxSwipesPerDay"
  | "canVote"
  | "canReadPublicChat"
  | "canChatPublic"
  | "canViewStreams"
  | "canCreateStream"
  | "canHostStream"
  | "minEngagementLevelForCreateStream"
  | "minEngagementLevelForHostStream"
  | "canCreateCampaign"
  | "maxCampaignsPerMonth"
  | "maxQuestionsPerCampaign"
  | "reportScope";

export type FeatureValue = boolean | number | EngagementLevel | ReportScope;
export type FeatureValueType = "boolean" | "number" | "enum";

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  description: string;
  valueType: FeatureValueType;
  enumValues?: string[];
};

export type FeatureSet = {
  canSwipe: boolean;
  maxSwipesPerDay: number;
  canVote: boolean;
  canReadPublicChat: boolean;
  canChatPublic: boolean;
  canViewStreams: boolean;
  canCreateStream: boolean;
  canHostStream: boolean;
  minEngagementLevelForCreateStream: EngagementLevel;
  minEngagementLevelForHostStream: EngagementLevel;
  canCreateCampaign: boolean;
  maxCampaignsPerMonth: number;
  maxQuestionsPerCampaign: number;
  reportScope: ReportScope;
};

export const REPORT_SCOPE_VALUES: ReportScope[] = [
  "none",
  "simple",
  "homeRegion",
  "homeRegionPlusOne",
  "ownTopicsBasic",
  "ownTopicsDeep",
  "all",
];

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "canSwipe",
    label: "Swipen erlaubt",
    description: "Legt fest, ob Accounts dieses Tiers überhaupt swipen dürfen.",
    valueType: "boolean",
  },
  {
    key: "maxSwipesPerDay",
    label: "Max Swipes pro Tag",
    description: "Tageslimit für Swipes; Number.MAX_SAFE_INTEGER entspricht unbegrenzt.",
    valueType: "number",
  },
  {
    key: "canVote",
    label: "Voten erlaubt",
    description: "Legt fest, ob Statements bewertet werden dürfen.",
    valueType: "boolean",
  },
  {
    key: "canReadPublicChat",
    label: "Öffentlichen Chat lesen",
    description: "Legt fest, ob der öffentliche Stream-Chat sichtbar ist.",
    valueType: "boolean",
  },
  {
    key: "canChatPublic",
    label: "Öffentlichen Chat schreiben",
    description: "Legt fest, ob Nachrichten im öffentlichen Chat geschrieben werden dürfen.",
    valueType: "boolean",
  },
  {
    key: "canViewStreams",
    label: "Streams ansehen",
    description: "Legt fest, ob Livestreams geöffnet werden dürfen.",
    valueType: "boolean",
  },
  {
    key: "canCreateStream",
    label: "Streams erstellen",
    description: "Tierschalter für Stream-Erstellung; zusätzlich Engagement-Gate aktiv.",
    valueType: "boolean",
  },
  {
    key: "canHostStream",
    label: "Streams hosten",
    description: "Tierschalter für Stream-Hosting; zusätzlich Engagement-Gate aktiv.",
    valueType: "boolean",
  },
  {
    key: "minEngagementLevelForCreateStream",
    label: "Mindestlevel Stream-Erstellung",
    description: "Erforderliches Engagement-Level für Stream-Erstellung.",
    valueType: "enum",
    enumValues: [...ENGAGEMENT_LEVEL_ORDER],
  },
  {
    key: "minEngagementLevelForHostStream",
    label: "Mindestlevel Stream-Hosting",
    description: "Erforderliches Engagement-Level für Stream-Hosting.",
    valueType: "enum",
    enumValues: [...ENGAGEMENT_LEVEL_ORDER],
  },
  {
    key: "canCreateCampaign",
    label: "Kampagnen erstellen",
    description: "Legt fest, ob neue Kampagnen angelegt werden dürfen.",
    valueType: "boolean",
  },
  {
    key: "maxCampaignsPerMonth",
    label: "Max Kampagnen/Monat",
    description: "Monatliches Kampagnen-Limit je Tier.",
    valueType: "number",
  },
  {
    key: "maxQuestionsPerCampaign",
    label: "Max Fragen je Kampagne",
    description: "Fragenlimit innerhalb einer Kampagne je Tier.",
    valueType: "number",
  },
  {
    key: "reportScope",
    label: "Report Scope",
    description: "Tiefe/Region der verfügbaren Reports.",
    valueType: "enum",
    enumValues: [...REPORT_SCOPE_VALUES],
  },
];

export const FEATURE_MATRIX_DEFAULTS: Record<AccessTier, FeatureSet> = {
  public: {
    canSwipe: true,
    maxSwipesPerDay: 3,
    canVote: true,
    canReadPublicChat: true,
    canChatPublic: false,
    canViewStreams: true,
    canCreateStream: false,
    canHostStream: false,
    minEngagementLevelForCreateStream: "Brennend",
    minEngagementLevelForHostStream: "Inspirierend",
    canCreateCampaign: false,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.public,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.public,
    reportScope: REPORT_SCOPE.public,
  },
  basis: {
    canSwipe: true,
    maxSwipesPerDay: UNLIMITED_LIMIT,
    canVote: true,
    canReadPublicChat: true,
    canChatPublic: false,
    canViewStreams: true,
    canCreateStream: false,
    canHostStream: false,
    minEngagementLevelForCreateStream: "Brennend",
    minEngagementLevelForHostStream: "Inspirierend",
    canCreateCampaign: false,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.basis,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.basis,
    reportScope: REPORT_SCOPE.basis,
  },
  erweitert: {
    canSwipe: true,
    maxSwipesPerDay: UNLIMITED_LIMIT,
    canVote: true,
    canReadPublicChat: true,
    canChatPublic: true,
    canViewStreams: true,
    canCreateStream: STREAM_LIMITS_PER_MONTH.erweitert > 0,
    canHostStream: true,
    minEngagementLevelForCreateStream: "Brennend",
    minEngagementLevelForHostStream: "Inspirierend",
    canCreateCampaign: CAMPAIGN_LIMITS_PER_MONTH.erweitert > 0,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.erweitert,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.erweitert,
    reportScope: REPORT_SCOPE.erweitert,
  },
  premium: {
    canSwipe: true,
    maxSwipesPerDay: UNLIMITED_LIMIT,
    canVote: true,
    canReadPublicChat: true,
    canChatPublic: true,
    canViewStreams: true,
    canCreateStream: STREAM_LIMITS_PER_MONTH.premium > 0,
    canHostStream: true,
    minEngagementLevelForCreateStream: "Brennend",
    minEngagementLevelForHostStream: "Inspirierend",
    canCreateCampaign: CAMPAIGN_LIMITS_PER_MONTH.premium > 0,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.premium,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.premium,
    reportScope: REPORT_SCOPE.premium,
  },
  institutionBasic: {
    canSwipe: false,
    maxSwipesPerDay: 0,
    canVote: false,
    canReadPublicChat: true,
    canChatPublic: false,
    canViewStreams: true,
    canCreateStream: STREAM_LIMITS_PER_MONTH.institutionBasic > 0,
    canHostStream: true,
    minEngagementLevelForCreateStream: "Interessiert",
    minEngagementLevelForHostStream: "Interessiert",
    canCreateCampaign: CAMPAIGN_LIMITS_PER_MONTH.institutionBasic > 0,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.institutionBasic,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.institutionBasic,
    reportScope: REPORT_SCOPE.institutionBasic,
  },
  institutionPremium: {
    canSwipe: false,
    maxSwipesPerDay: 0,
    canVote: false,
    canReadPublicChat: true,
    canChatPublic: false,
    canViewStreams: true,
    canCreateStream: STREAM_LIMITS_PER_MONTH.institutionPremium > 0,
    canHostStream: true,
    minEngagementLevelForCreateStream: "Interessiert",
    minEngagementLevelForHostStream: "Interessiert",
    canCreateCampaign: CAMPAIGN_LIMITS_PER_MONTH.institutionPremium > 0,
    maxCampaignsPerMonth: CAMPAIGN_LIMITS_PER_MONTH.institutionPremium,
    maxQuestionsPerCampaign: QUESTIONS_PER_CAMPAIGN_LIMITS.institutionPremium,
    reportScope: REPORT_SCOPE.institutionPremium,
  },
  staff: {
    canSwipe: true,
    maxSwipesPerDay: UNLIMITED_LIMIT,
    canVote: true,
    canReadPublicChat: true,
    canChatPublic: true,
    canViewStreams: true,
    canCreateStream: true,
    canHostStream: true,
    minEngagementLevelForCreateStream: "Interessiert",
    minEngagementLevelForHostStream: "Interessiert",
    canCreateCampaign: true,
    maxCampaignsPerMonth: UNLIMITED_LIMIT,
    maxQuestionsPerCampaign: UNLIMITED_LIMIT,
    reportScope: REPORT_SCOPE.staff,
  },
};

export function buildFeatureMatrixFromValues(
  values: Partial<Record<AccessTier, Partial<FeatureSet>>>,
): Record<AccessTier, FeatureSet> {
  return Object.fromEntries(
    ACCESS_TIERS.map((tier) => [tier, { ...FEATURE_MATRIX_DEFAULTS[tier], ...(values[tier] ?? {}) }]),
  ) as Record<AccessTier, FeatureSet>;
}
