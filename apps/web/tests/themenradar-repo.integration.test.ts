import { describe, expect, it } from "vitest";
import { createInMemoryThemenradarRepo } from "@features/themenradar/server/repo";
import type { ThemenradarItem } from "@features/themenradar/contracts";

function makeItem(id: string, status: ThemenradarItem["lifecycleStatus"], sourceType: ThemenradarItem["sourceType"]) {
  return {
    id,
    title: `Thema ${id}`,
    rawSignal: "Signal",
    sourceType,
    heatScore: 55,
    everydayRelevanceScore: 60,
    polarizationScore: 30,
    membershipPotentialScore: 45,
    jurisdiction: "mixed" as const,
    lifecycleStatus: status,
    linkedAnlassraumId: null,
    linkedDossierId: null,
    campaignKey: `kampagne-${id}`,
    shareContractSnapshot: null,
    telemetrySnapshot: {
      campaignKey: `kampagne-${id}`,
      clicks: 1,
      leads: 1,
      memberships: 0,
      updatedAt: new Date().toISOString(),
    },
    reviewRequired: true as const,
    autoPostEligible: false as const,
    officialSocialRequiresReview: true as const,
    createdBy: "admin-1",
    updatedBy: "admin-1",
    lastReviewedBy: null,
    lastReviewedAt: null,
    reviewNotes: [],
    auditVersion: 1,
    archivedAt: null,
    archivedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("themenradar-repo.integration", () => {
  it("supports filter/list and append-only audit reads", async () => {
    const repo = createInMemoryThemenradarRepo();

    await repo.upsertRecord({ item: makeItem("a", "raw", "manual"), contentPrep: null });
    await repo.upsertRecord({ item: makeItem("b", "review_ready", "community"), contentPrep: null });

    const raw = await repo.listRecords({ status: "raw", sourceType: "all", limit: 20 });
    expect(raw).toHaveLength(1);
    expect(raw[0]?.item.id).toBe("a");

    const community = await repo.listRecords({ status: "all", sourceType: "community", limit: 20 });
    expect(community).toHaveLength(1);
    expect(community[0]?.item.id).toBe("b");

    await repo.appendAuditEvent({
      itemId: "b",
      eventType: "review_ready_set",
      at: new Date().toISOString(),
      actorUserId: "admin-1",
      actorEmail: "admin@example.org",
      fromStatus: "content_ready",
      toStatus: "review_ready",
      note: "review",
      auditVersion: 2,
      metadata: null,
    });

    const audits = await repo.listAuditEvents("b");
    expect(audits).toHaveLength(1);
    expect(audits[0]?.eventType).toBe("review_ready_set");
    expect(audits[0]?.auditVersion).toBe(2);
  });
});
