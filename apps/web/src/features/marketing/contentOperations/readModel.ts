import { getMarketingRegistry } from "../registry/data";
import type {
  MarketingAsset,
  MarketingCampaign,
  MarketingDistributionRecord,
  MarketingRegistry,
} from "../registry/contracts";
import { getMarketingContentOperations } from "./data";
import type {
  MarketingContentOperation,
  MarketingContentStatus,
} from "./contracts";

export type MarketingContentOperationsRow = {
  content: MarketingContentOperation;
  campaign: MarketingCampaign;
  asset: MarketingAsset;
  distributionRecords: MarketingDistributionRecord[];
  effectiveStatus: MarketingContentStatus;
};

export type MarketingContentOperationsReadModel = {
  generatedAt: string;
  summary: {
    total: number;
    reviewReady: number;
    draft: number;
    approved: number;
    scheduled: number;
    published: number;
  };
  items: MarketingContentOperationsRow[];
  publications: Array<{
    content: MarketingContentOperation;
    campaign: MarketingCampaign;
    asset: MarketingAsset;
    record: MarketingDistributionRecord;
  }>;
};

export function buildMarketingContentOperationsReadModel(
  registry: MarketingRegistry = getMarketingRegistry(),
  contentOperations: MarketingContentOperation[] = getMarketingContentOperations(),
): MarketingContentOperationsReadModel {
  const campaignsById = new Map(registry.campaigns.map((campaign) => [campaign.id, campaign]));
  const assetsById = new Map(registry.assets.map((asset) => [asset.id, asset]));
  const recordsById = new Map(registry.distributionRecords.map((record) => [record.id, record]));

  const items = contentOperations.map((content): MarketingContentOperationsRow => {
    const campaign = campaignsById.get(content.campaignId);
    if (!campaign) throw new Error(`Unknown MarketingCampaign: ${content.campaignId}`);

    const asset = assetsById.get(content.assetId);
    if (!asset) throw new Error(`Unknown MarketingAsset: ${content.assetId}`);
    if (asset.campaignId !== campaign.id) {
      throw new Error(`Asset ${asset.id} does not belong to campaign ${campaign.id}`);
    }

    const distributionRecords = content.distributionRecordIds.map((recordId) => {
      const record = recordsById.get(recordId);
      if (!record) throw new Error(`Unknown DistributionRecord: ${recordId}`);
      if (record.assetId !== asset.id || record.campaignId !== campaign.id) {
        throw new Error(`DistributionRecord ${record.id} does not match content ${content.id}`);
      }
      return record;
    });

    const publishedRecord = distributionRecords.find(
      (record) => record.status === "published" && Boolean(record.publicUrl) && Boolean(record.publishedAt),
    );
    const scheduledRecord = distributionRecords.find(
      (record) => record.status === "scheduled" || record.status === "planned",
    );

    if (content.status === "published" && !publishedRecord) {
      throw new Error(`Published content ${content.id} requires a verified published DistributionRecord`);
    }
    if (content.status === "scheduled" && !content.scheduledAt && !scheduledRecord) {
      throw new Error(`Scheduled content ${content.id} requires scheduledAt or a scheduled DistributionRecord`);
    }

    return {
      content,
      campaign,
      asset,
      distributionRecords,
      effectiveStatus: publishedRecord
        ? "published"
        : scheduledRecord || content.scheduledAt
          ? "scheduled"
          : content.status,
    };
  });

  const publications = items.flatMap((item) =>
    item.distributionRecords
      .filter(
        (record) =>
          record.status === "published" &&
          Boolean(record.publicUrl) &&
          Boolean(record.publishedAt),
      )
      .map((record) => ({
        content: item.content,
        campaign: item.campaign,
        asset: item.asset,
        record,
      })),
  );

  const sortedItems = [...items].sort((left, right) => {
    const leftSchedule = left.content.scheduledAt ? Date.parse(left.content.scheduledAt) : Number.MAX_SAFE_INTEGER;
    const rightSchedule = right.content.scheduledAt ? Date.parse(right.content.scheduledAt) : Number.MAX_SAFE_INTEGER;
    return (
      leftSchedule - rightSchedule ||
      Date.parse(right.content.updatedAt) - Date.parse(left.content.updatedAt) ||
      left.content.id.localeCompare(right.content.id)
    );
  });

  return {
    generatedAt: registry.generatedAt,
    summary: {
      total: sortedItems.length,
      reviewReady: sortedItems.filter((item) => item.effectiveStatus === "review_ready").length,
      draft: sortedItems.filter((item) => item.effectiveStatus === "draft").length,
      approved: sortedItems.filter((item) => item.effectiveStatus === "approved").length,
      scheduled: sortedItems.filter((item) => item.effectiveStatus === "scheduled").length,
      published: sortedItems.filter((item) => item.effectiveStatus === "published").length,
    },
    items: sortedItems,
    publications,
  };
}
