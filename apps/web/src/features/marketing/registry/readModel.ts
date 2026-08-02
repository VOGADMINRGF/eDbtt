import { getMarketingRegistry } from "./data";
import type {
  MarketingAsset,
  MarketingBrandProfile,
  MarketingCampaign,
  MarketingDistributionRecord,
  MarketingEvidenceRef,
  MarketingOpportunity,
  MarketingRegistry,
} from "./contracts";
import type { RegionalAgentRun } from "./regionalRuns/contracts";

export type MarketingRegistryCount = {
  key: string;
  count: number;
};

export type MarketingRegistryEvidenceRow = MarketingEvidenceRef & {
  opportunityId: string;
  opportunityTitle: string;
};

export type MarketingRegistryReadModel = {
  mode: "read_only";
  generatedAt: string;
  sourcePaths: string[];
  summary: {
    totalOpportunities: number;
    totalCampaigns: number;
    totalAssets: number;
    totalBrands: number;
    distributionRecords: number;
    opportunitiesByMarketability: MarketingRegistryCount[];
    campaignsByStatus: MarketingRegistryCount[];
    assetsByStatus: MarketingRegistryCount[];
    brandsByStatus: MarketingRegistryCount[];
    blockersByKey: MarketingRegistryCount[];
    approvedButUndistributedAssets: number;
    totalRegionalAgentRuns: number;
    blockedRegionalAgentRuns: number;
  };
  opportunities: MarketingOpportunity[];
  campaigns: MarketingCampaign[];
  assets: MarketingAsset[];
  brandProfiles: MarketingBrandProfile[];
  distributionRecords: MarketingDistributionRecord[];
  regionalAgentRuns: RegionalAgentRun[];
  recentEvidence: MarketingRegistryEvidenceRow[];
};

export function buildMarketingRegistryReadModel(
  registry: MarketingRegistry = getMarketingRegistry(),
): MarketingRegistryReadModel {
  const distributedAssetIds = new Set(
    registry.distributionRecords
      .filter((record) => record.status === "published")
      .map((record) => record.assetId),
  );

  const recentEvidence = registry.opportunities
    .flatMap((opportunity) =>
      opportunity.evidence.map((evidence) => ({
        ...evidence,
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
      })),
    )
    .sort((left, right) => {
      const leftTime = left.verifiedAt ? Date.parse(left.verifiedAt) : 0;
      const rightTime = right.verifiedAt ? Date.parse(right.verifiedAt) : 0;
      return rightTime - leftTime || left.ref.localeCompare(right.ref);
    })
    .slice(0, 8);

  return {
    mode: "read_only",
    generatedAt: registry.generatedAt,
    sourcePaths: [...registry.sources],
    summary: {
      totalOpportunities: registry.opportunities.length,
      totalCampaigns: registry.campaigns.length,
      totalAssets: registry.assets.length,
      totalBrands: registry.brandProfiles.length,
      distributionRecords: registry.distributionRecords.length,
      opportunitiesByMarketability: countBy(
        registry.opportunities.map((item) => item.marketability),
      ),
      campaignsByStatus: countBy(registry.campaigns.map((item) => item.status)),
      assetsByStatus: countBy(registry.assets.map((item) => item.status)),
      brandsByStatus: countBy(registry.brandProfiles.map((item) => item.status)),
      blockersByKey: countBy([
        ...registry.opportunities.flatMap((item) => item.blockerKeys),
        ...registry.campaigns.flatMap((item) => item.blockerKeys),
      ]),
      approvedButUndistributedAssets: registry.assets.filter(
        (asset) =>
          (asset.status === "approved" || asset.status === "published") &&
          !distributedAssetIds.has(asset.id),
      ).length,
      totalRegionalAgentRuns: registry.regionalAgentRuns.length,
      blockedRegionalAgentRuns: registry.regionalAgentRuns.filter(
        (run) => run.status === "blocked" || run.status === "failed",
      ).length,
    },
    opportunities: [...registry.opportunities].sort(sortByUpdatedAtThenId),
    campaigns: [...registry.campaigns].sort(sortByUpdatedAtThenId),
    assets: [...registry.assets].sort(sortByUpdatedAtThenId),
    brandProfiles: [...registry.brandProfiles].sort(sortByUpdatedAtThenId),
    distributionRecords: [...registry.distributionRecords].sort(sortByUpdatedAtThenId),
    regionalAgentRuns: [...registry.regionalAgentRuns].sort(sortByUpdatedAtThenId),
    recentEvidence,
  };
}

function countBy(values: string[]): MarketingRegistryCount[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function sortByUpdatedAtThenId<T extends { updatedAt: string; id: string }>(left: T, right: T) {
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id);
}
