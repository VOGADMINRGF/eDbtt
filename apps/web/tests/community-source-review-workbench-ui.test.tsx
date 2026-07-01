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
});

describe("community source review workbench ui", () => {
  it("renders the operational workbench with status, priority, signals, guardrails and actions", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-ui-public-1",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-ui-1",
        claimText: "Neue Quelle zum Claim.",
        text: "Öffentliche Submission mit möglichem Hintergrundbericht.",
        sourceRefs: ["https://beispiel.de/bericht"],
        notes: [
          "Öffentlicher Intake: review-first API",
          "Öffentlicher Beteiligungsraum: sichere-schulwege",
        ],
        relatedContributionCount: 12,
        moderation: {
          trustLevel: "high",
        },
      }),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-ui-restricted-1",
        kind: "counter_source",
        target: "factcheck_request",
        targetId: "factcheck-ui-1",
        text: "Gegenquelle mit eingeschränktem Trust-Level.",
        moderation: {
          trustLevel: "restricted",
        },
      }),
    );

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

    expect(html).toContain("Community Source Review Workbench");
    expect(html).toContain("Öffentliche Submission");
    expect(html).toContain("Community-Review-Beitrag");
    expect(html).toContain("Status:");
    expect(html).toContain("Priority:");
    expect(html).toContain("Duplikat-/Mehrfachsignal");
    expect(html).toContain("Volumensignal");
    expect(html).toContain("Trust-Signal");
    expect(html).toContain("Quellenqualitäts-Signal");
    expect(html).toContain("Hinweis ist kein verifizierter Fakt.");
    expect(html).toContain(
      "Freigabe als Hinweis bedeutet nicht Veröffentlichung als Wahrheit.",
    );
    expect(html).toContain(
      "Trust- und Qualitätswerte dienen nur der Priorisierung.",
    );
    expect(html).toContain("Als Hinweis zulassen");
    expect(html).toContain("Verstecken");
    expect(html).toContain("Ablehnen");
    expect(html).toContain("Eskalieren");
    expect(html).toContain("Quellenprüfung anfordern");
    expect(html).toContain("Redaktionelle Prüfung anfordern");
    expect(html).toContain("Priorität setzen");
    expect(html).toContain("Archivieren");
    expect(html).toContain("Interne Notiz speichern");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("accepted_as_fact");
    expect(html).not.toContain("verified source");
    expect(html).not.toContain("automatische Widerlegung");
  });
});
