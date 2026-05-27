import { describe, expect, it } from "vitest";
import { createInMemorySocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";

describe("social-no-autopublish.contract", () => {
  it("creates review-first drafts without automatic posting or external publish", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const post = await repo.createOrReplaceDraft({
      organizationId: "org-1",
      regionId: "berlin",
      dossierId: "dossier-1",
      sourceContextType: "dossier",
      sourceContextId: "dossier-1",
      sourceVisibilityState: "public_reviewed",
      title: "Dossier-Update",
      channels: ["website_update", "linkedin_draft"],
      scheduleMode: "suggested_window",
      channelTexts: {
        website_update: "Website-Ausgabe",
        linkedin_draft: "LinkedIn-Ausgabe",
      },
      sourceSummary: "Quellenlage und offene Fragen",
      backlinkHref: "/dossier/dossier-1",
      reviewRequired: true,
      createdByUserId: "user-1",
    });

    expect(post.externalPosting).toBe(false);
    expect(post.noAutoPublish).toBe(true);
    expect(post.approval.approvedByUserId).toBeNull();
    expect(post.scheduler.every((entry) => entry.status === "draft")).toBe(true);
    expect(post.scheduler.some((entry) => entry.status === "posted")).toBe(false);
  });
});
