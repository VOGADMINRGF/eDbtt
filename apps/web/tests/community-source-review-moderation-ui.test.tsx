import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCommunitySourceReviewSection from "@/app/admin/review/AdminCommunitySourceReviewSection";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  allowCommunitySourceReviewHint,
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
  markCommunitySourceReviewHintNeedsSourceReview,
  persistCommunitySourceReviewContributionDraft,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: () => undefined,
    }),
  };
});

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
});

describe("community source review moderation ui", () => {
  it("renders community hints with moderation, risk, abuse, trust and guardrails in admin review", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ui-1",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-1",
        claimText: "Vor der Schule fehlen sichere Querungen.",
        text: "Hier ist ein zusätzlicher Bericht aus dem Kiez.",
        sourceRefs: ["https://beispiel.de/bericht"],
        relatedContributionCount: 12,
        moderation: {
          trustLevel: "high",
        },
      }),
    );

    await allowCommunitySourceReviewHint({
      contributionId: "community-ui-1",
      actorUserId: "admin-1",
      reason: "Als Hinweis behalten.",
    });
    await markCommunitySourceReviewHintNeedsSourceReview({
      contributionId: "community-ui-1",
      actorUserId: "admin-1",
      reason: "Zur Quellenprüfung legen.",
    });

    const records = await listCommunitySourceReviewRecords();
    const audits = await listCommunitySourceReviewAudits({ limit: 50 });
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

    expect(html).toContain("Community-Hinweise moderieren");
    expect(html).toContain("öffentliche API verdrahtet (review-first)");
    expect(html).toContain("source_suggestion");
    expect(html).toContain("Quellenvorschlag");
    expect(html).toContain("als Hinweis erlaubt");
    expect(html).toContain("Claim");
    expect(html).toContain("Trust");
    expect(html).toContain("hoch");
    expect(html).toContain("Risiko");
    expect(html).toContain("keine Abuse-Flags");
    expect(html).toContain("Mehrfacheinreichung");
    expect(html).toContain("Volumensignal");
    expect(html).toContain("Quellenqualität");
    expect(html).toContain("Abuse-/Spam-Signale sind Moderationshinweise, keine automatische Ablehnung.");
    expect(html).toContain("Mehrfach- oder Volumensignale begründen keine Wahrheit.");
    expect(html).toContain("Trust priorisiert Prüfung, bestätigt aber keine Wahrheit.");
    expect(html).toContain("Quellenqualität hilft bei der Einordnung, verifiziert aber keine Quelle.");
    expect(html).toContain(
      "Verdächtige Hinweise werden geprüft, aber nicht automatisch veröffentlicht, verifiziert oder in den Graph geschrieben.",
    );
    expect(html).toContain("Zur Quellenprüfung routen");
    expect(html).toContain("Quellenprüfung");
    expect(html).not.toContain("accepted_as_fact");
  });
});
