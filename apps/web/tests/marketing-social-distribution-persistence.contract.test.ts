import { describe, expect, it } from "vitest";
import { createInMemorySocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";
import { getMarketingContentOperations } from "@/features/marketing/contentOperations/data";
import { persistMarketingSocialDistribution } from "@/features/marketing/multibrand/socialDistributionPersistence";

describe("marketing social distribution persistence bridge", () => {
  it("fails closed until the canonical social source context supports marketing campaigns", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const content = getMarketingContentOperations().find((item) => item.id === "MCO-CONTENT-02-DE-01");
    expect(content).toBeTruthy();

    const result = await persistMarketingSocialDistribution({
      content: content!,
      organizationId: "org-marketing",
      actorUserId: "admin-1",
      repo,
    });

    expect(result).toEqual({
      ok: false,
      reason: "marketing_source_context_not_supported_yet",
      blockers: ["marketing_campaign_source_context_required"],
    });
    await expect(repo.listAllPosts()).resolves.toHaveLength(0);
  });
});
