import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MarketingDelegationRequestSchema,
  MarketingDelegationRecordSchema,
} from "@/features/marketing/delegations/contracts";
import {
  createInMemoryMarketingDelegationRepository,
  createMarketingDelegation,
  listMarketingDelegations,
  setMarketingDelegationRepositoryForTests,
} from "@/features/marketing/delegations/repository";

describe("marketing delegation contracts", () => {
  beforeEach(() => {
    setMarketingDelegationRepositoryForTests(createInMemoryMarketingDelegationRepository());
  });

  afterEach(() => {
    setMarketingDelegationRepositoryForTests(null);
  });

  it("accepts only explicit campaign/opportunity and agent role combinations", () => {
    expect(
      MarketingDelegationRequestSchema.parse({
        itemType: "campaign",
        itemId: "CAM-CONTENT-02",
        agentRole: "marketing_operator",
      }),
    ).toMatchObject({ itemType: "campaign", agentRole: "marketing_operator" });

    expect(() =>
      MarketingDelegationRequestSchema.parse({
        itemType: "campaign",
        itemId: "CAM-CONTENT-02",
        agentRole: "auto_publish_bot",
      }),
    ).toThrow();
  });

  it("creates a real review-first queue record without automatic execution or publishing", async () => {
    const record = await createMarketingDelegation({
      itemType: "campaign",
      itemId: "CAM-CONTENT-02",
      agentRole: "content_operator",
      requestedByUserId: "admin-1",
    });

    expect(MarketingDelegationRecordSchema.parse(record)).toMatchObject({
      itemType: "campaign",
      itemId: "CAM-CONTENT-02",
      itemTitle: "Debattenstand der Woche",
      agentRole: "content_operator",
      status: "queued",
      requiresHumanReview: true,
      autoExecute: false,
      autoPublish: false,
    });
    expect(record.expectedOutputs).toContain("Review-Checkliste ohne Veröffentlichung");
  });

  it("is idempotent per item and agent role instead of creating duplicate queue noise", async () => {
    await createMarketingDelegation({
      itemType: "opportunity",
      itemId: "MOP-VOXY-03",
      agentRole: "marketing_operator",
      requestedByUserId: "admin-1",
    });
    await createMarketingDelegation({
      itemType: "opportunity",
      itemId: "MOP-VOXY-03",
      agentRole: "marketing_operator",
      requestedByUserId: "admin-1",
    });

    await expect(listMarketingDelegations()).resolves.toHaveLength(1);
  });

  it("rejects unknown registry items", async () => {
    await expect(
      createMarketingDelegation({
        itemType: "campaign",
        itemId: "CAM-DOES-NOT-EXIST",
        agentRole: "analytics_operator",
        requestedByUserId: "admin-1",
      }),
    ).rejects.toThrow("marketing_delegation_item_not_found");
  });
});
