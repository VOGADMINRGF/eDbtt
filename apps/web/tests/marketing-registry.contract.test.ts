import { describe, expect, it } from "vitest";
import {
  MARKETING_MARKETABILITY_VALUES,
  MarketingRegistrySchema,
} from "@/features/marketing/registry/contracts";
import { getMarketingRegistry } from "@/features/marketing/registry/data";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";

describe("marketing registry contract", () => {
  it("parses the deterministic repo-backed registry", () => {
    const registry = getMarketingRegistry();
    const parsed = MarketingRegistrySchema.parse(registry);

    expect(parsed.mode).toBe("read_only");
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.opportunities.length).toBeGreaterThan(0);
    expect(parsed.campaigns.length).toBeGreaterThan(0);
    expect(parsed.regionalAgentRuns).toHaveLength(3);
    expect(parsed.assets.length).toBeGreaterThan(0);
    expect(parsed.brandProfiles.map((profile) => profile.id)).toEqual(
      expect.arrayContaining(["brand-edebatte-light", "brand-edebatte-dark"]),
    );
  });

  it("uses only the canonical marketability vocabulary", () => {
    const registry = getMarketingRegistry();
    const allowed = new Set<string>(MARKETING_MARKETABILITY_VALUES);

    for (const opportunity of registry.opportunities) {
      expect(allowed.has(opportunity.marketability)).toBe(true);
    }
  });

  it("keeps MarketingCampaign separate from participation Campaign truth", () => {
    const registry = getMarketingRegistry();

    for (const campaign of registry.campaigns) {
      expect(campaign).toHaveProperty("brandProfileId");
      expect(campaign).toHaveProperty("primaryCta");
      expect(campaign).toHaveProperty("autoPublishEligible", false);
      expect(campaign).not.toHaveProperty("sessions");
      expect(campaign).not.toHaveProperty("qrSetId");
      expect(campaign).not.toHaveProperty("participationMode");
    }
  });

  it("never upgrades a concept or missing proof to publicly marketable", () => {
    const registry = getMarketingRegistry();

    for (const opportunity of registry.opportunities) {
      if (
        opportunity.routeStatus !== "verified" ||
        opportunity.productProofStatus !== "verified" ||
        opportunity.ctaStatus !== "verified"
      ) {
        expect(opportunity.marketability).not.toBe("publicly_marketable");
      }
    }
  });

  it("builds blocker, evidence and distribution truth without inventing publication", () => {
    const readModel = buildMarketingRegistryReadModel();

    expect(readModel.summary.totalCampaigns).toBe(readModel.campaigns.length);
    expect(readModel.summary.blockersByKey.length).toBeGreaterThan(0);
    expect(readModel.recentEvidence.length).toBeGreaterThan(0);
    expect(readModel.summary.distributionRecords).toBe(0);
    expect(readModel.assets.every((asset) => asset.publicPath === null)).toBe(true);
  });
});
