import { describe, expect, it } from "vitest";
import {
  createInMemorySocialDistributionRepo,
  socialDistributionStatusLabel,
} from "@features/outputEngine/socialDistributionRuntime";

describe("social export and scheduling readiness", () => {
  it("allows queue, scheduling, export and copy states without publish claims", async () => {
    const repo = createInMemorySocialDistributionRepo();
    const created = await repo.createOrReplaceDraft({
      organizationId: "org-1",
      regionId: "berlin",
      dossierId: "dossier-1",
      sourceContextType: "dossier",
      sourceContextId: "dossier-1",
      sourceVisibilityState: "public_reviewed",
      title: "Dossier-Update",
      channels: ["website_update", "newsletter_draft"],
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

    expect(created.status).toBe("review_requested");

    const queued = await repo.updateStatus({
      postId: created.id,
      organizationId: "org-1",
      nextStatus: "queued",
      updatedByUserId: "user-1",
      note: "In Queue übernommen.",
    });
    const scheduled = await repo.updateStatus({
      postId: created.id,
      organizationId: "org-1",
      nextStatus: "scheduled_ready",
      updatedByUserId: "user-1",
      note: "Zeitfenster intern festgelegt.",
    });
    const exported = await repo.updateStatus({
      postId: created.id,
      organizationId: "org-1",
      nextStatus: "exported",
      updatedByUserId: "user-1",
      note: "JSON-Payload exportiert.",
    });
    const copied = await repo.updateStatus({
      postId: created.id,
      organizationId: "org-1",
      nextStatus: "copied",
      updatedByUserId: "user-1",
      note: "Text manuell übernommen.",
    });

    expect(queued?.status).toBe("queued");
    expect(scheduled?.status).toBe("scheduled_ready");
    expect(exported?.status).toBe("exported");
    expect(copied?.status).toBe("copied");
    expect(socialDistributionStatusLabel(exported?.status ?? "error")).toBe("Exportiert");
    expect(socialDistributionStatusLabel(copied?.status ?? "error")).toBe("Kopiert");
  });
});
