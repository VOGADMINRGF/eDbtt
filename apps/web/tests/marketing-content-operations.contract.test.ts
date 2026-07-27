import { describe, expect, it } from "vitest";
import { getMarketingRegistry } from "@/features/marketing/registry/data";
import {
  MarketingContentOperationSchema,
  MarketingContentOperationsSchema,
} from "@/features/marketing/contentOperations/contracts";
import { getMarketingContentOperations } from "@/features/marketing/contentOperations/data";
import { buildMarketingContentOperationsReadModel } from "@/features/marketing/contentOperations/readModel";

describe("marketing content operations contract", () => {
  it("parses deterministic content items with explicit channels, copy and ownership", () => {
    const items = getMarketingContentOperations();
    const parsed = MarketingContentOperationsSchema.parse(items);

    expect(parsed).toHaveLength(2);
    expect(parsed.map((item) => item.id)).toEqual([
      "MCO-CONTENT-02-DE-01",
      "MCO-VOXY-03-DE-01",
    ]);
    expect(parsed.every((item) => item.channels.length > 0)).toBe(true);
    expect(parsed.every((item) => Boolean(item.captionDraft || item.scriptDraft))).toBe(true);
    expect(parsed.every((item) => item.autoPublishEligible === false)).toBe(true);
  });

  it("references existing campaign, asset and distribution truth without duplication", () => {
    const registry = getMarketingRegistry();
    const model = buildMarketingContentOperationsReadModel(registry);

    expect(model.summary.total).toBe(2);
    expect(model.summary.reviewReady).toBe(2);
    expect(model.summary.scheduled).toBe(0);
    expect(model.summary.published).toBe(0);
    expect(model.publications).toEqual([]);

    for (const row of model.items) {
      expect(row.asset.campaignId).toBe(row.campaign.id);
      expect(row.content.assetId).toBe(row.asset.id);
      expect(row.content.campaignId).toBe(row.campaign.id);
      expect(row.distributionRecords).toEqual([]);
    }
  });

  it("rejects scheduled content without a real schedule", () => {
    const valid = getMarketingContentOperations()[0];
    expect(() =>
      MarketingContentOperationSchema.parse({
        ...valid,
        status: "scheduled",
        scheduledAt: null,
      }),
    ).toThrow(/scheduled content requires scheduledAt/i);
  });

  it("rejects published content without a verified DistributionRecord", () => {
    const registry = getMarketingRegistry();
    const publishedWithoutEvidence = {
      ...getMarketingContentOperations()[0],
      status: "published" as const,
    };

    expect(() =>
      buildMarketingContentOperationsReadModel(registry, [publishedWithoutEvidence]),
    ).toThrow(/requires a verified published DistributionRecord/i);
  });
});
