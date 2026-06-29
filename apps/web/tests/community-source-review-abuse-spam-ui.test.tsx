import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import AdminCommunitySourceReviewSection from "@/app/admin/review/AdminCommunitySourceReviewSection";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
  markCommunitySourceReviewHintAsSpamRisk,
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

describe("community source review abuse spam ui", () => {
  it("renders abuse severity disposition blockers and audit history in the existing admin workbench", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ui-abuse-1",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-abuse-1",
        claimText: "Mehr Quellen sollen den Claim bestätigen.",
        text: "Noch ein Link, bitte direkt übernehmen.",
        sourceRefs: ["http://bit.ly/verdacht"],
        relatedContributionCount: 13,
      }),
    );

    await markCommunitySourceReviewHintAsSpamRisk({
      contributionId: "community-ui-abuse-1",
      actorUserId: "admin-1",
      reason: "Spam-Risiko wegen Ballung und Kurzlink.",
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
        submissionRuntimeStatus="blocked_unwired"
      />,
    );

    expect(html).toContain("möglicher Spam");
    expect(html).toContain("Severity:");
    expect(html).toContain("Disposition:");
    expect(html).toContain("Mehrfacheinreichung");
    expect(html).toContain("Volumensignal");
    expect(html).toContain("Als Evidenz blockiert.");
    expect(html).toContain("Audit-Historie");
    expect(html).toContain("Signal erkannt");
    expect(html).toContain("Signal geprüft");
    expect(html).toContain("Als Spam-Risiko markieren");
    expect(html).toContain("Abuse-Signale zurücksetzen");
  });
});
