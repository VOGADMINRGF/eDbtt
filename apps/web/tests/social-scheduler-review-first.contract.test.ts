import { describe, expect, it } from "vitest";
import { createInMemorySocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";

async function createPost() {
  const repo = createInMemorySocialDistributionRepo();
  const post = await repo.createOrReplaceDraft({
    organizationId: "org-1",
    regionId: "berlin",
    dossierId: "dossier-1",
    sourceContextType: "dossier",
    sourceContextId: "dossier-1",
    sourceVisibilityState: "public_reviewed",
    title: "Dossier-Update",
    channels: ["website_update"],
    scheduleMode: "manual",
    channelTexts: {
      website_update: "Website-Ausgabe",
    },
    sourceSummary: "Quellenlage und offene Fragen",
    backlinkHref: "/dossier/dossier-1",
    reviewRequired: true,
    createdByUserId: "user-1",
    initialStatus: "review_requested",
  });
  return { repo, post };
}

describe("social-scheduler-review-first.contract", () => {
  it("blocks scheduling until approval exists", async () => {
    const { repo, post } = await createPost();

    await expect(
      repo.updateScheduler({
        postId: post.id,
        organizationId: "org-1",
        channel: "website_update",
        nextStatus: "scheduled",
        updatedByUserId: "user-1",
        scheduledAt: "2026-05-27T11:00:00.000Z",
        note: "Zeitfenster setzen",
      }),
    ).rejects.toThrow("approval_required_for_scheduler");
  });

  it("allows controlled scheduling after approval and preserves auditability", async () => {
    const { repo, post } = await createPost();
    const approved = await repo.updateStatus({
      postId: post.id,
      organizationId: "org-1",
      nextStatus: "approved",
      updatedByUserId: "approver-1",
      note: "Review abgeschlossen.",
    });

    const scheduled = await repo.updateScheduler({
      postId: post.id,
      organizationId: "org-1",
      channel: "website_update",
      nextStatus: "scheduled",
      updatedByUserId: "approver-1",
      scheduledAt: "2026-05-27T11:00:00.000Z",
      note: "Kontrolliert terminiert.",
    });

    expect(approved?.approval.approvedByUserId).toBe("approver-1");
    expect(scheduled?.scheduler).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "website_update",
          status: "scheduled",
          approvalBy: "approver-1",
        }),
      ]),
    );
  });
});
