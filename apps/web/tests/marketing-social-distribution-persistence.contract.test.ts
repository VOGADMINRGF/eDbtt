import { describe, expect, it } from "vitest";
import { createInMemorySocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";
import { getMarketingContentOperations } from "@/features/marketing/contentOperations/data";
import { persistMarketingSocialDistribution } from "@/features/marketing/multibrand/socialDistributionPersistence";

describe("marketing social distribution persistence bridge", () => {
  it("persists review-first eDebatte marketing content in the existing social queue", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const content = getMarketingContentOperations().find((item) => item.id === "MCO-CONTENT-02-DE-01");
    expect(content).toBeTruthy();

    const result = await persistMarketingSocialDistribution({
      content: content!,
      organizationId: "org-marketing",
      actorUserId: "admin-1",
      repo,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    expect(result.post).toMatchObject({
      organizationId: "org-marketing",
      sourceContextType: "marketing_campaign",
      sourceContextId: "CAM-CONTENT-02",
      publicBrand: "edebatte",
      marketingCampaignId: "CAM-CONTENT-02",
      marketingContentId: "MCO-CONTENT-02-DE-01",
      status: "needs_review",
      noAutoPublish: true,
      noAutoPublicationApproved: true,
      externalPosting: false,
    });
    expect(result.post.channels).toEqual(expect.arrayContaining(["instagram_asset", "linkedin_draft"]));
    expect(result.post.approval.reviewRequired).toBe(true);

    await expect(repo.listAllPosts()).resolves.toHaveLength(1);
    await expect(
      repo.listPostsBySourceContext({
        sourceContextType: "marketing_campaign",
        sourceContextId: "CAM-CONTENT-02",
      }),
    ).resolves.toHaveLength(1);

    const audit = await repo.listAuditEventsByPostIds([result.post.id]);
    expect(audit.get(result.post.id)?.[0]).toMatchObject({
      action: "create_draft",
      nextStatus: "needs_review",
    });
  });

  it("keeps two content items in one marketing campaign as distinct queue records", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const original = getMarketingContentOperations().find((item) => item.id === "MCO-CONTENT-02-DE-01");
    expect(original).toBeTruthy();

    const first = await persistMarketingSocialDistribution({
      content: original!,
      organizationId: "org-marketing",
      actorUserId: "admin-1",
      repo,
    });
    const second = await persistMarketingSocialDistribution({
      content: {
        ...original!,
        id: "MCO-CONTENT-02-DE-02",
        title: "Debattenstand der Woche · LinkedIn Variante",
      },
      organizationId: "org-marketing",
      actorUserId: "admin-1",
      repo,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("expected persisted marketing records");
    expect(first.post.id).not.toBe(second.post.id);

    await expect(
      repo.listPostsBySourceContext({
        sourceContextType: "marketing_campaign",
        sourceContextId: "CAM-CONTENT-02",
      }),
    ).resolves.toHaveLength(2);
  });
});
