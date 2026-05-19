import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
  buildReviewQueueReadModel: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminReviewPage from "@/app/admin/review/page";

describe("/admin/review page", () => {
  it("renders the central review queue with clear guardrails", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [
        {
          id: "public_official_approval:signal:1",
          domain: "public_official_approval",
          domainLabel: "Amtliche Freigabe",
          workflowState: "official_approval_required",
          workflowLabel: "Amtliche Freigabe prüfen",
          title: "Sanierungsbedarf an Schulen ist bestätigt",
          summary: "Expliziter menschlicher Freigabeschritt.",
          href: "/admin/region?regionId=bezirk-berlin-reinickendorf",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: null,
          draftId: null,
          sourceType: "public_claim",
          visibilityState: "public_reviewed",
          visibilityLabel: "geprüft",
          createdAt: "2026-05-17T09:00:00.000Z",
          updatedAt: "2026-05-17T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: true,
          reviewAuthority: "publication_approved_or_admin",
          reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
          sourceSnapshotTemplate: null,
          contentReleaseWorkbench: null,
        },
        {
          id: "region_source_result:source-result-1",
          domain: "region_source_result",
          domainLabel: "Quellen-Testresultat",
          workflowState: "review_required",
          workflowLabel: "Review erforderlich",
          title: "Bezirksamt Reinickendorf News · Dry Run",
          summary: "1 mögliche Aussagen · 1 Themencluster. Explizite URL vorbereitet.",
          href: "/admin/region?regionId=bezirk-berlin-reinickendorf#source-results",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: null,
          draftId: "source-1",
          sourceType: "municipal_news",
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          createdAt: "2026-05-18T09:00:00.000Z",
          updatedAt: "2026-05-18T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: false,
          reviewAuthority: "standard_review",
          reviewAuthorityLabel: "Reviewpflichtig",
          sourceSnapshotTemplate: {
            label: "Beispiel-Snapshot",
            seedKindLabel: "Beispiel-Seed",
            isExampleSeed: true,
            reviewHint:
              "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
          },
          contentReleaseWorkbench: {
            intro:
              "eDebatte bereitet aus deinem Link veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
            sourceKind: "region_source_result",
            sourceId: "source-result-1",
            targets: [
              {
                targetType: "dossier",
                targetLabel: "Dossier-Entwurf",
                suggestedTitle: "Berlin Reinickendorf: Schule",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                qrHref: null,
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canCreateQrLink: false,
              },
              {
                targetType: "anlassraum",
                targetLabel: "Anlassraum",
                suggestedTitle: "Schule Berlin Reinickendorf",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                qrHref: null,
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canCreateQrLink: false,
              },
            ],
          },
        },
        {
          id: "create_handoff:persisted:create-handoff-1",
          domain: "create_handoff",
          domainLabel: "Create-Handoff",
          workflowState: "review_required",
          workflowLabel: "Review erforderlich",
          title: "Schulsanierung im Bezirk · Dossier-Entwurf",
          summary: "1 Aussagen · 1 offene Fragen · 1 Faktencheck-Kandidaten. Persistenter Create-Handoff.",
          href: "/create?resume=create_handoff&handoffId=create-handoff-1",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: "org-reinickendorf-1",
          dossierId: "dossier-1",
          draftId: "create-handoff-1",
          sourceType: "create_dossier",
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          createdAt: "2026-05-19T09:00:00.000Z",
          updatedAt: "2026-05-19T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: false,
          reviewAuthority: "standard_review",
          reviewAuthorityLabel: "Reviewpflichtig",
          sourceSnapshotTemplate: null,
          contentReleaseWorkbench: {
            intro:
              "eDebatte bereitet aus deinem Arbeitsstand veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
            sourceKind: "create_handoff",
            sourceId: "create-handoff-1",
            targets: [
              {
                targetType: "dossier",
                targetLabel: "Dossier-Entwurf",
                suggestedTitle: "Schulsanierung im Bezirk",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                qrHref: null,
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canCreateQrLink: false,
              },
              {
                targetType: "anlassraum",
                targetLabel: "Anlassraum",
                suggestedTitle: "Schulsanierung im Bezirk",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                qrHref: null,
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canCreateQrLink: false,
              },
            ],
          },
        },
      ],
      summary: {
        total: 1,
        officialApprovalCount: 1,
        byDomain: [
          {
            domain: "region_source_result",
            label: "Quellen-Testresultat",
            count: 1,
          },
          {
            domain: "region_intelligence_suggestion",
            label: "Region-Intelligence-Vorschlag",
            count: 1,
          },
          {
            domain: "public_official_approval",
            label: "Amtliche Freigabe",
            count: 1,
          },
        ],
      },
      guardrails: {
        noBulkApprove: true,
        noAutoOfficialClaim: true,
        noAutoPublish: true,
        noAutoDossierFinalization: true,
        noAutoAnlassraumFinalization: true,
      },
    });

    const html = renderToStaticMarkup(await AdminReviewPage());

    expect(html).toContain("Zentrale Review-Queue");
    expect(html).toContain("Keine Sammelentscheidung");
    expect(html).toContain("Region-Intelligence-Vorschläge");
    expect(html).toContain("reviewpflichtige Source Results");
    expect(html).toContain("Amtliche Freigabe");
    expect(html).toContain("Nur Publikationsfreigabe oder Admin-Fallback");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Review-to-Publish Workspace");
    expect(html).toContain("Beispiel-Snapshot");
    expect(html).toContain("Beispiel-Seed");
    expect(html).toContain("Schulsanierung im Bezirk · Dossier-Entwurf");
    expect(html).toContain("Als Dossier-Entwurf übernehmen");
    expect(html).toContain("Als Anlassraum vorbereiten");
    expect(html).toContain("Arbeitsstand");
  });
});
