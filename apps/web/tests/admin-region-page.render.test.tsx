import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<object>("next/navigation");
  return {
    ...actual,
    redirect: (...args: unknown[]) => navigationMocks.redirect(...args),
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminRegionPage from "@/app/admin/region/page";

describe("admin-region-page.render", () => {
  beforeEach(() => {
    navigationMocks.redirect.mockClear();
  });

  it("renders a connected regional operator workspace with contextual handoffs", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        connections: [
          {
            id: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            label: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            url: "https://reinickendorf.example/aktuelles",
            notes: "Explizite Verwaltungsquelle",
            enabled: true,
            sampleItems: [
              {
                title: "Schulwege im Bezirk",
                summary: "Verwaltung informiert über Schulwegsicherheit.",
                url: "https://reinickendorf.example/aktuelles/schulwege",
                detectedTopics: ["Schule", "Verkehr"],
              },
            ],
            sourceSnapshotTemplate: {
              id: "region-source-snapshot-template-source-1",
              label: "Beispiel-Snapshot",
              mode: "template_plus_explicit_url",
              seedKind: "example_seed",
              seedKindLabel: "Beispiel-Seed",
              configuredUrl: "https://reinickendorf.example/aktuelles",
              isExampleSeed: true,
              reviewHint:
                "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
              noLiveCrawlerClaim: true,
              noScraping: true,
              noDeepSearchAutoCosts: true,
              noAutoPublish: true,
              noPublicOfficial: true,
            },
            createdAt: "2026-05-19T00:00:00.000Z",
            updatedAt: "2026-05-19T00:00:00.000Z",
            createdBy: "admin-1",
            updatedBy: "admin-1",
            reviewRequired: true,
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
          },
        ],
        results: [
          {
            id: "source-result-1",
            connectionId: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            connectionLabel: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            resultMode: "dry_run",
            title: "Bezirksamt Reinickendorf News · Dry Run",
            summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
            configuredUrl: "https://reinickendorf.example/aktuelles",
            detectedTopics: ["Schule", "Verkehr"],
            visibilityState: "internal_review",
            visibilityLabel: "reviewpflichtig",
            reviewStatus: "needs_review",
            confidence: 0.68,
            sourceSnapshotStatus: "fetched",
            sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
            sourceSnapshotSummary:
              "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
            sourceSnapshotExcerpt:
              "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
            sourceSnapshotTemplate: {
              id: "region-source-snapshot-template-source-1",
              label: "Beispiel-Snapshot",
              mode: "template_plus_explicit_url",
              seedKind: "example_seed",
              seedKindLabel: "Beispiel-Seed",
              configuredUrl: "https://reinickendorf.example/aktuelles",
              isExampleSeed: true,
              reviewHint:
                "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
              noLiveCrawlerClaim: true,
              noScraping: true,
              noDeepSearchAutoCosts: true,
              noAutoPublish: true,
              noPublicOfficial: true,
              claimCandidates: [],
              topicCandidates: [],
              evidenceHints: [],
              openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            },
            possibleClaims: [
              {
                text: "Schulsanierung in Reinickendorf",
                confidence: 0.74,
                basisLabel: "Titel",
                excerpt:
                  "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
                reviewRequired: true,
              },
            ],
            topicClusters: [
              {
                clusterKey: "bildung-schule",
                label: "Schule Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                suggestedAction: "ask_clarifying_question",
                reviewStatus: "needs_review",
              },
            ],
            dossierSuggestions: [
              {
                title: "Berlin Reinickendorf: Schule",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            anlassraumSuggestions: [
              {
                title: "Schule Berlin Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            evidenceReferences: [
              {
                label: "Seitenauszug · Schulsanierung in Reinickendorf",
                url: "https://reinickendorf.example/aktuelles",
                excerpt:
                  "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
              },
            ],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            affectedScope: {
              regionName: "Berlin Reinickendorf",
              detectedPlaces: ["Berlin Reinickendorf"],
              ortsteilHints: [],
              fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
            },
            reviewSuggestions: [],
            reviewTaskSummary: {
              claimCount: 1,
              topicClusterCount: 1,
              dossierSuggestionCount: 1,
              anlassraumSuggestionCount: 1,
              openQuestionCount: 1,
              evidenceCount: 1,
              label:
                "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
            },
            createdAt: "2026-05-19T00:00:00.000Z",
            updatedAt: "2026-05-19T00:00:00.000Z",
            testedBy: "admin-1",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
          },
        ],
      }),
    );
    const html = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: {
          regionId: "berlin-reinickendorf",
        },
      }),
    );

    expect(html).toContain('data-testid="admin-region-page"');
    expect(html).toContain('data-testid="admin-region-context"');
    expect(html).toContain('data-testid="admin-region-journey"');
    expect(html).toContain('data-testid="admin-region-workspace-navigation"');
    expect(html).toContain('data-testid="admin-region-lagebild"');
    expect(html).toContain("Regionaler Arbeitsraum");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Jetzt relevant");
    expect(html).toContain("Schulwege im Bezirk");
    expect(html).toContain("1 aktiv · 1 geprüft");
    expect(html).toContain("Pilot-/Fixture-Daten enthalten");
    expect(html).toContain("Nächste sinnvolle Aktion");
    expect(html).toContain("Quellen sammeln");
    expect(html).toContain("Recherche vertiefen");
    expect(html).toContain("Beitrag erstellen");
    expect(html).toContain("Dossier vorbereiten");
    expect(html).toContain("Kampagne planen");
    expect(html).toContain("Lagebild");
    expect(html).toContain("Quellen &amp; Feeds");
    expect(html).toContain("Recherche");
    expect(html).toContain("Claims &amp; Dossiers");
    expect(html).toContain("Beiträge &amp; Veröffentlichung");
    expect(html).toContain("Regionale Kampagnen");
    expect(html).toContain("Einstellungen &amp; Zugriff");
    expect(html).toContain(
      "/admin/research/tasks?regionId=berlin-reinickendorf&amp;topic=Schule",
    );
    expect(html).toContain("/create?source=admin_region");
    expect(html).toContain("region=berlin-reinickendorf");
    expect(html).toContain("/admin/marketing?lang=de");
    expect(html).toContain("reach=regional");
    expect(html).not.toContain("Detailroute");
    expect(html).not.toContain("regionId=...");
    expect(html).not.toContain("Contract");
    expect(html).not.toContain("Auto-Publish aktiv");

    const sourcesHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "quellen" },
      }),
    );
    expect(sourcesHtml).toContain('data-testid="admin-region-quellen"');
    expect(sourcesHtml).toContain('data-testid="admin-region-source-connections"');
    expect(sourcesHtml).toContain("Eine konkrete regionale Quelle aufnehmen");
    expect(sourcesHtml).toContain("Quelle hinzufügen");
    expect(sourcesHtml).toContain("Quelle testen");
    expect(sourcesHtml).toContain("Claims, Themen und Übergaben prüfen");
    expect(sourcesHtml).toContain("Pilot-Snapshot und Grenzen");

    const researchHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "recherche" },
      }),
    );
    expect(researchHtml).toContain('data-testid="admin-region-recherche"');
    expect(researchHtml).toContain('data-testid="admin-region-research-handoff"');
    expect(researchHtml).toContain("Es startet kein Provideraufruf, Crawling oder Scraping.");

    const claimsHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "claims" },
      }),
    );
    expect(claimsHtml).toContain('data-testid="admin-region-claims"');
    expect(claimsHtml).toContain("Schulsanierung in Reinickendorf");
    expect(claimsHtml).toContain("Übersetzung ist keine Evidenz");
    expect(claimsHtml).toContain("Kein Vorschlag erzeugt automatisch ein Dossier.");

    const contributionsHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "beitraege" },
      }),
    );
    expect(contributionsHtml).toContain('data-testid="admin-region-beitraege"');
    expect(contributionsHtml).toContain('data-testid="admin-region-create-handoff"');
    expect(contributionsHtml).toContain("Interner Beitrag");
    expect(contributionsHtml).toContain("Externe Veröffentlichung");

    const campaignsHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "kampagnen" },
      }),
    );
    expect(campaignsHtml).toContain('data-testid="admin-region-kampagnen"');
    expect(campaignsHtml).toContain('data-testid="admin-region-marketing-handoff"');
    expect(campaignsHtml).toContain("keine verifizierten Kampagnen- oder Performancewerte");

    const settingsHtml = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: { regionId: "berlin-reinickendorf", view: "einstellungen" },
      }),
    );
    expect(settingsHtml).toContain('data-testid="admin-region-einstellungen"');
    expect(settingsHtml).toContain('data-testid="admin-region-access-summary"');
    expect(settingsHtml).toContain('data-testid="admin-region-guardrails"');
    expect(settingsHtml).toContain("Keine automatische Recherche");
    expect(settingsHtml).toContain("Leitlinienmatrix Berlin / Bürgerbeteiligung");
  });

  it("redirects cleanly when the selected region is not available from the registry or manual fixtures", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );

    await expect(
      AdminRegionPage({
        searchParams: {
          regionId: "region-official-01001000",
        },
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/regions");

    expect(navigationMocks.redirect).toHaveBeenCalledWith("/admin/regions");
  });

  it("redirects cleanly when regionId is missing", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );

    await expect(
      AdminRegionPage({
        searchParams: {},
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/regions");

    expect(navigationMocks.redirect).toHaveBeenCalledWith("/admin/regions");
  });
});
