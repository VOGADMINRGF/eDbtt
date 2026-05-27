import { describe, expect, it } from "vitest";
import { createInMemorySocialDistributionRepo } from "@features/outputEngine/socialDistributionRuntime";

describe("social-posting-audit.contract", () => {
  it("records scheduling and posting transitions in the audit trail", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const created = await repo.createOrReplaceDraft({
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

    await repo.updateStatus({
      postId: created.id,
      organizationId: "org-1",
      nextStatus: "approved",
      updatedByUserId: "approver-1",
      note: "Review abgeschlossen.",
    });
    await repo.updateScheduler({
      postId: created.id,
      organizationId: "org-1",
      channel: "website_update",
      nextStatus: "scheduled",
      updatedByUserId: "approver-1",
      scheduledAt: "2026-05-27T11:00:00.000Z",
      note: "Kontrolliert terminiert.",
    });
    await repo.updateScheduler({
      postId: created.id,
      organizationId: "org-1",
      channel: "website_update",
      nextStatus: "posting",
      updatedByUserId: "approver-1",
      note: "Posting gestartet.",
    });
    await repo.updateScheduler({
      postId: created.id,
      organizationId: "org-1",
      channel: "website_update",
      nextStatus: "posted",
      updatedByUserId: "approver-1",
      note: "Posting bestätigt.",
    });

    const audit = await repo.listAuditEventsByPostIds([created.id]);
    const actions = (audit.get(created.id) ?? []).map((event) => event.action);

    expect(actions).toEqual(
      expect.arrayContaining(["schedule_channel", "posting_started", "posting_succeeded"]),
    );
  });
});
