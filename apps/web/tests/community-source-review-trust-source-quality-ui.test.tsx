import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import AdminCommunitySourceReviewSection from "@/app/admin/review/AdminCommunitySourceReviewSection";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
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

describe("community source review trust source quality ui", () => {
  it("shows trust level, source quality level, signals and guardrails in the existing admin workbench", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ui-trust-quality-1",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-ui-trust-quality-1",
        claimText: "Primärquelle vom Bezirksamt.",
        text: 'Originaldokument 2026-06-20. "Die Maßnahme startet im Juli."',
        sourceRefs: ["https://www.berlin.de/beschluss.pdf"],
        notes: ["Bezirksamt Reinickendorf · Beschlussprotokoll"],
        relatedContributionCount: 4,
        moderation: {
          trustLevel: "restricted",
        },
      }),
    );
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ui-trust-quality-2",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-ui-trust-quality-2",
        claimText: "Primärquelle mit belastbarem Kontext.",
        text: 'Originaldokument 2026-06-21. "Die Finanzierung ist gesichert."',
        sourceRefs: ["https://www.berlin.de/finanzierung.pdf"],
        notes: ["Bezirksamt Reinickendorf · Beschlussprotokoll"],
        relatedContributionCount: 4,
        moderation: {
          trustLevel: "high",
        },
      }),
    );

    const records = await listCommunitySourceReviewRecords();
    const audits = await listCommunitySourceReviewAudits({ limit: 50 });
    const auditMap = new Map<string, typeof audits>();
    for (const record of records) {
      auditMap.set(
        record.id,
        audits.filter((entry) => entry.contributionId === record.id),
      );
    }

    const recordsWithNote = records.map((record) => ({
      ...record,
      latestDecisionNote: "Trust/Quality vor einer Freigabe prüfen.",
    }));

    const html = renderToStaticMarkup(
      <AdminCommunitySourceReviewSection
        communitySourceReviewRecords={recordsWithNote}
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

    expect(html).toContain("Trust");
    expect(html).toContain("eingeschränkt");
    expect(html).toContain("hoch");
    expect(html).toContain("Quellenqualität");
    expect(html).toContain("starker Review-Kandidat");
    expect(html).toContain("Contributor-Kontext vorhanden");
    expect(html).toContain("Quellen-URL vorhanden");
    expect(html).toContain("Primärquelle behauptet");
    expect(html).toContain("Review-Priorität: prioritized");
    expect(html).toContain("Trust priorisiert Prüfung, bestätigt aber keine Wahrheit.");
    expect(html).toContain("Quellenqualität hilft bei der Einordnung, verifiziert aber keine Quelle.");
    expect(html).toContain("Auch starke Review-Kandidaten müssen redaktionell oder fachlich geprüft werden.");
    expect(html).not.toContain("accepted_as_fact");
    expect(html).not.toContain("verified source");
    expect(html).toContain('Als Hinweis erlauben</button>');
    expect(html).toContain('disabled=""');
  });
});
