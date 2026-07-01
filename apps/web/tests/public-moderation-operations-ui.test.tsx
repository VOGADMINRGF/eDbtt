import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCommunitySourceReviewSection from "@/app/admin/review/AdminCommunitySourceReviewSection";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  createInMemoryCommunitySourceReviewRepository,
  escalateCommunitySourceReviewHint,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
  markCommunitySourceReviewHintNeedsSourceReview,
  persistCommunitySourceReviewContributionDraft,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );
  return {
    ...actual,
    useRouter: () => ({
      refresh: () => undefined,
    }),
  };
});

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
  vi.useRealTimers();
});

describe("public moderation operations ui", () => {
  it("renders operations summary, queue, SLA, owner and flags without truth or publish claims", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    const end = new Date("2026-07-01T12:00:00.000Z");
    vi.useFakeTimers();

    vi.setSystemTime(new Date(end.getTime() - 2 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "public-moderation-ui-public",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-ui-public",
        claimText: "Neue Quelle zum Claim.",
        text: "Öffentliche Submission mit möglichem Hintergrundbericht.",
        sourceRefs: ["https://beispiel.de/bericht"],
        notes: [
          "Öffentlicher Intake: review-first API",
          "Öffentlicher Beteiligungsraum: sichere-schulwege",
        ],
      }),
    );

    vi.setSystemTime(new Date(end.getTime() - 90 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "public-moderation-ui-escalated",
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "handoff-ui-1",
        text: "Bitte priorisiert prüfen.",
      }),
    );
    await markCommunitySourceReviewHintNeedsSourceReview({
      contributionId: "public-moderation-ui-escalated",
      actorUserId: "admin-1",
      reason: "Quellenprüfung zuerst.",
    });
    await escalateCommunitySourceReviewHint({
      contributionId: "public-moderation-ui-escalated",
      actorUserId: "admin-1",
      reason: "Operativ eskalieren.",
    });

    vi.setSystemTime(end);

    const records = await listCommunitySourceReviewRecords();
    const audits = await listCommunitySourceReviewAudits({ limit: 80 });
    const auditMap = new Map<string, typeof audits>();
    for (const record of records) {
      auditMap.set(
        record.id,
        audits.filter((entry) => entry.contributionId === record.id),
      );
    }

    const html = renderToStaticMarkup(
      <AdminCommunitySourceReviewSection
        communitySourceReviewRecords={records}
        communitySourceReviewAuditMap={auditMap}
        communitySourceReviewPersistence={{
          mode: "persistent_primary",
          label: "Persistenter Community-Source-Review-Store",
          summary:
            "Community-Hinweise, Moderationsentscheidungen und Audit-Spuren liegen dauerhaft für die bestehende Admin-Review-Workbench vor.",
          repositoryInterface: "CommunitySourceReviewRepository",
          storeKind: "mongo_collection",
          productionTruth: true,
          restartReconstructable: true,
          deploymentReconstructable: true,
        }}
        submissionRuntimeStatus="public_api_hardened"
      />,
    );

    expect(html).toContain("Aktive Hinweise");
    expect(html).toContain("Ohne Bearbeiter");
    expect(html).toContain("Eskaliert");
    expect(html).toContain("Überfällig / Stale");
    expect(html).toContain("Quellenprüfung");
    expect(html).toContain("Redaktionelle Prüfung");
    expect(html).toContain("Queue:");
    expect(html).toContain("SLA:");
    expect(html).toContain("Owner:");
    expect(html).toContain("Owner State:");
    expect(html).toContain("Public Moderation Operations");
    expect(html).toContain("Betriebsstatus, keine Bewertung der Wahrheit.");
    expect(html).toContain("SLA dient nur der");
    expect(html).toContain("Eskalation ist kein Beweis.");
    expect(html).toContain("Owner nötig");
    expect(html).toContain("Eskaliert");
    expect(html).toContain("Letzte Aktivität:");
    expect(html).toContain("Alter:");
    expect(html).not.toContain("accepted_as_fact");
    expect(html).not.toContain("verified source");
    expect(html).not.toContain("direkt veröffentlichen");
  });
});
