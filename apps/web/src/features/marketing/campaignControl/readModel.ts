import { getMarketingContentOperations } from "../contentOperations/data";
import type { MarketingContentOperation } from "../contentOperations/contracts";
import { getMarketingRegistry } from "../registry/data";
import type {
  MarketingCampaign,
  MarketingDistributionRecord,
  MarketingRegistry,
} from "../registry/contracts";
import {
  MARKETING_METRIC_SOURCE_VALUES,
  type MarketingCampaignControlProfile,
  type MarketingControlChannel,
  type MarketingDataQuality,
  type MarketingMetricKey,
  type MarketingMetricSnapshot,
  type MarketingMetricSource,
  type MarketingReachScope,
  type MarketingSegment,
} from "./contracts";
import {
  getMarketingCampaignControlProfiles,
  getMarketingMetricSnapshots,
} from "./data";

export type MarketingCampaignControlRow = {
  campaign: MarketingCampaign;
  profile: MarketingCampaignControlProfile;
  contentItems: MarketingContentOperation[];
  distributionRecords: MarketingDistributionRecord[];
  metricSnapshots: MarketingMetricSnapshot[];
  metrics: Partial<Record<MarketingMetricKey, number>>;
  dataQuality: MarketingDataQuality;
  plannedContentCount: number;
  scheduledContentCount: number;
  publishedContentCount: number;
  internalChannelCount: number;
  externalChannelCount: number;
  hasPerformanceData: boolean;
};

export type MarketingPerformanceSourceState = {
  sourceKind: MarketingMetricSource;
  snapshotCount: number;
  latestCapturedAt: string | null;
  quality: MarketingDataQuality;
};

export type MarketingCampaignControlReadModel = {
  generatedAt: string;
  summary: {
    campaigns: number;
    contentItems: number;
    scheduledItems: number;
    publishedItems: number;
    campaignsWithPerformance: number;
    connectedSourceKinds: number;
  };
  segmentCounts: Record<MarketingSegment, number>;
  reachScopeCounts: Record<MarketingReachScope, number>;
  campaigns: MarketingCampaignControlRow[];
  contentItems: Array<{
    content: MarketingContentOperation;
    campaign: MarketingCampaign;
    profile: MarketingCampaignControlProfile;
    distributionRecords: MarketingDistributionRecord[];
    metricSnapshots: MarketingMetricSnapshot[];
    internalExternal: "internal" | "external" | "mixed";
  }>;
  sourceStates: MarketingPerformanceSourceState[];
};

export function buildMarketingCampaignControlReadModel(
  registry: MarketingRegistry = getMarketingRegistry(),
  contentItems: MarketingContentOperation[] = getMarketingContentOperations(),
  profiles: MarketingCampaignControlProfile[] = getMarketingCampaignControlProfiles(),
  metricSnapshots: MarketingMetricSnapshot[] = getMarketingMetricSnapshots(),
): MarketingCampaignControlReadModel {
  const campaignsById = new Map(registry.campaigns.map((campaign) => [campaign.id, campaign]));
  const profilesByCampaignId = new Map(profiles.map((profile) => [profile.campaignId, profile]));

  for (const profile of profiles) {
    if (!campaignsById.has(profile.campaignId)) {
      throw new Error(`Unknown MarketingCampaign in control profile: ${profile.campaignId}`);
    }
  }

  const campaigns = registry.campaigns.map((campaign): MarketingCampaignControlRow => {
    const profile = profilesByCampaignId.get(campaign.id);
    if (!profile) {
      throw new Error(`Missing campaign control profile: ${campaign.id}`);
    }

    const campaignContent = contentItems.filter((content) => content.campaignId === campaign.id);
    const assetIds = new Set(campaignContent.map((content) => content.assetId));
    const campaignDistributionRecords = registry.distributionRecords.filter(
      (record) => record.campaignId === campaign.id || assetIds.has(record.assetId),
    );
    const campaignSnapshots = metricSnapshots.filter((snapshot) => snapshot.campaignId === campaign.id);
    const publishedContentIds = new Set(
      campaignDistributionRecords
        .filter(
          (record) =>
            record.status === "published" &&
            Boolean(record.publicUrl) &&
            Boolean(record.publishedAt),
        )
        .map((record) => record.assetId),
    );
    const scheduledContentIds = new Set(
      campaignDistributionRecords
        .filter((record) => record.status === "scheduled" || record.status === "planned")
        .map((record) => record.assetId),
    );
    const internalChannels = profile.plannedChannels.filter((channel) => channelScope(channel) === "internal");
    const externalChannels = profile.plannedChannels.filter((channel) => channelScope(channel) === "external");

    return {
      campaign,
      profile,
      contentItems: campaignContent,
      distributionRecords: campaignDistributionRecords,
      metricSnapshots: campaignSnapshots,
      metrics: aggregateMetrics(campaignSnapshots),
      dataQuality: resolveDataQuality(campaignSnapshots),
      plannedContentCount: campaignContent.length,
      scheduledContentCount: campaignContent.filter(
        (content) => content.status === "scheduled" || scheduledContentIds.has(content.assetId),
      ).length,
      publishedContentCount: campaignContent.filter(
        (content) => content.status === "published" || publishedContentIds.has(content.assetId),
      ).length,
      internalChannelCount: internalChannels.length,
      externalChannelCount: externalChannels.length,
      hasPerformanceData: campaignSnapshots.length > 0,
    };
  });

  const contentRows = contentItems.map((content) => {
    const campaign = campaignsById.get(content.campaignId);
    const profile = profilesByCampaignId.get(content.campaignId);
    if (!campaign || !profile) {
      throw new Error(`Content ${content.id} has no campaign control context`);
    }
    const distributionRecords = registry.distributionRecords.filter(
      (record) => content.distributionRecordIds.includes(record.id),
    );
    const snapshots = metricSnapshots.filter(
      (snapshot) => snapshot.contentId === content.id,
    );
    const scopes = new Set(
      content.channels.map((channel) => channelScope(channel as MarketingControlChannel)),
    );

    return {
      content,
      campaign,
      profile,
      distributionRecords,
      metricSnapshots: snapshots,
      internalExternal:
        scopes.size > 1 ? "mixed" : scopes.has("internal") ? "internal" : "external",
    } as const;
  });

  const sourceStates = MARKETING_METRIC_SOURCE_VALUES.map(
    (sourceKind): MarketingPerformanceSourceState => {
      const sourceSnapshots = metricSnapshots.filter((snapshot) => snapshot.sourceKind === sourceKind);
      const latestCapturedAt = sourceSnapshots
        .map((snapshot) => snapshot.capturedAt)
        .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
      return {
        sourceKind,
        snapshotCount: sourceSnapshots.length,
        latestCapturedAt,
        quality: resolveDataQuality(sourceSnapshots),
      };
    },
  );

  return {
    generatedAt: registry.generatedAt,
    summary: {
      campaigns: campaigns.length,
      contentItems: contentRows.length,
      scheduledItems: campaigns.reduce((sum, row) => sum + row.scheduledContentCount, 0),
      publishedItems: campaigns.reduce((sum, row) => sum + row.publishedContentCount, 0),
      campaignsWithPerformance: campaigns.filter((row) => row.hasPerformanceData).length,
      connectedSourceKinds: sourceStates.filter((source) => source.snapshotCount > 0).length,
    },
    segmentCounts: {
      b2c: campaigns.filter((row) => row.profile.segments.includes("b2c")).length,
      b2b: campaigns.filter((row) => row.profile.segments.includes("b2b")).length,
      b2g: campaigns.filter((row) => row.profile.segments.includes("b2g")).length,
    },
    reachScopeCounts: {
      local: campaigns.filter((row) => row.profile.reachScopes.includes("local")).length,
      regional: campaigns.filter((row) => row.profile.reachScopes.includes("regional")).length,
      national: campaigns.filter((row) => row.profile.reachScopes.includes("national")).length,
      international: campaigns.filter((row) => row.profile.reachScopes.includes("international")).length,
    },
    campaigns: [...campaigns].sort((left, right) =>
      left.profile.primarySegment.localeCompare(right.profile.primarySegment) ||
      left.campaign.title.localeCompare(right.campaign.title),
    ),
    contentItems: contentRows,
    sourceStates,
  };
}

export function channelScope(channel: MarketingControlChannel): "internal" | "external" {
  return ["edebatte", "website", "download"].includes(channel) ? "internal" : "external";
}

function aggregateMetrics(
  snapshots: MarketingMetricSnapshot[],
): Partial<Record<MarketingMetricKey, number>> {
  const result: Partial<Record<MarketingMetricKey, number>> = {};
  for (const snapshot of snapshots) {
    if (snapshot.quality === "missing" || snapshot.quality === "rejected") continue;
    for (const [key, value] of Object.entries(snapshot.values)) {
      const metricKey = key as MarketingMetricKey;
      result[metricKey] = (result[metricKey] ?? 0) + value;
    }
  }
  return result;
}

function resolveDataQuality(snapshots: MarketingMetricSnapshot[]): MarketingDataQuality {
  if (snapshots.length === 0) return "missing";
  const ranking: MarketingDataQuality[] = [
    "rejected",
    "missing",
    "stale",
    "estimated",
    "partial",
    "verified",
  ];
  return ranking.find((quality) => snapshots.some((snapshot) => snapshot.quality === quality)) ?? "missing";
}
