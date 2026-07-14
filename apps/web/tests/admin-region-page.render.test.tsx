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

  it("renders the regional review surface with access, guardrails and prepare-only actions", async () => {
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
    expect(html).toContain("Authority First Login, Jurisdiktions-Match, Freischaltung, Entitlement und externe Benachrichtigung bleiben getrennte Review-Schritte.");
    expect(html).toContain(
      "Authority Continuation bleibt ein Kandidat mit System-Thema, Jurisdiktions-Plausibilität und Machbarkeitsnotiz",
    );
    expect(html).toContain("Jurisdiktions-Match, reviewed topic candidate und vorgeschlagene Beteiligung bleiben getrennt");
    expect(html).toContain(
      "In der Regionssicht erklärt Voxy Quellenprüfung, reviewed topic candidates, Beteiligungsoptionen und Handoff-Status",
    );
    expect(html).toContain('data-testid="admin-region-summary"');
    expect(html).toContain('data-testid="admin-region-access-summary"');
    expect(html).toContain('data-testid="admin-region-guardrails"');
    expect(html).toContain('data-testid="admin-region-feed-signals"');
    expect(html).toContain('data-testid="admin-region-guidelines"');
    expect(html).toContain('data-testid="admin-region-participation-signals"');
    expect(html).toContain('data-testid="admin-region-suggestions"');
    expect(html).toContain('data-testid="admin-region-open-review"');
    expect(html).toContain('data-testid="admin-region-prepare-actions"');
    expect(html).toContain('data-testid="admin-region-modules"');
    expect(html).toContain('data-testid="admin-region-source-connections"');
    expect(html).toContain("Verwaltung, Akteure und Signale");
    expect(html).toContain("Quelle oder Snapshot prüfen, dann bewusst in Review und Sichtbarkeit gehen");
    expect(html).toContain("Hier entstehen reviewpflichtige Signals, Claims, Themencluster sowie Dossier- und Anlassraum-Vorschläge.");
    expect(html).toContain("Sichtbarkeit kann anschließend wieder zurückgenommen oder archiviert werden.");
    expect(html).toContain("Zur Regionen-Übersicht");
    expect(html).toContain("Arbeitsansicht: berlin-reinickendorf");
    expect(html).toContain("Detailroute: `/admin/region?regionId=...`");
    expect(html).toContain("Aktuelle Themenlage Berlin Reinickendorf");
    expect(html).toContain("Kuratierte Startlage und Pilotvorschau für die Themenlage");
    expect(html).toContain("Keine Live-Crawler-Behauptung");
    expect(html).toContain("Produktive Quellen");
    expect(html).toContain("1 produktive Quelle verbunden");
    expect(html).toContain("Kuratierte Quellen");
    expect(html).toContain("Manuelle Quellen");
    expect(html).toContain("Quellengewichtung und Adapter");
    expect(html).toContain("Gewichtung vorbereitet");
    expect(html).toContain("Pilotvorschau · kuratierte Startlage · keine Produktionsdaten");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Kein Auto-Publish");
    expect(html).toContain("Kein Auto-Dossier");
    expect(html).toContain("Kein Auto-Anlassraum");
    expect(html).toContain("Kein Tender-Monitoring");
    expect(html).toContain("Kein Procurement-Monitoring");
    expect(html).toContain("Feed- und Signal-Hinweise");
    expect(html).toContain("Leitlinienmatrix Berlin / Bürgerbeteiligung");
    expect(html).toContain("Keine Rechtsberatung");
    expect(html).toContain("Frühzeitigkeit");
    expect(html).toContain("Transparenz");
    expect(html).toContain("Rückmeldung");
    expect(html).toContain("Zielgruppenansprache");
    expect(html).toContain("Barrierefreiheit");
    expect(html).toContain("Dokumentation");
    expect(html).toContain("Nachvollziehbarkeit");
    expect(html).toContain("Öffentliche Beteiligungssignale");
    expect(html).toContain("Regionzuordnung offen");
    expect(html).toContain("Aussagen aus der Öffentlichkeit");
    expect(html).toContain("Fragen aus der Öffentlichkeit");
    expect(html).toContain("Swipe-/Interesse-Signale aggregiert");
    expect(html).toContain("Gegenpositionen / andere Sichtweisen");
    expect(html).toContain("Quellenhinweise aus der Community");
    expect(html).toContain("anonymisiert/aggregiert");
    expect(html).toContain("nicht amtlich");
    expect(html).toContain("nicht repräsentativ");
    expect(html).toContain("Reviewpflichtige Verdichtungen");
    expect(html).toContain("Nur Vorschläge, kein automatischer Anlassraum");
    expect(html).toContain("Nur Vorschläge, kein automatisches Dossier");
    expect(html).toContain("Reviewpflichtige Startlage-Vorschläge");
    expect(html).toContain("Nichts wird automatisch veröffentlicht");
    expect(html).toContain("Review aus aktiver Quelle");
    expect(html).toContain("Quelle auswerten");
    expect(html).toContain("Explizite URL kontrolliert und reviewpflichtig auswerten");
    expect(html).toContain("Kanonischer Review-first Pfad");
    expect(html).toContain("Review-first Quellenpfad");
    expect(html).toContain("Source Connection");
    expect(html).toContain("Snapshot");
    expect(html).toContain("Beispiel-Snapshot");
    expect(html).toContain("Beispiel-Seed");
    expect(html).toContain("Demo-/Pilotstand reproduzierbar");
    expect(html).toContain("Dossier-Draft vorbereiten");
    expect(html).toContain("Anlassraum-Draft vorbereiten");
    expect(html).toContain("Quelle prüfen");
    expect(html).toContain("Offene Frage markieren");
    expect(html).toContain("Persistente Draft-Erstellung läuft serverseitig nur für akzeptierte Signale.");
    expect(html).toContain("Selbstauskunft ist nicht verifiziert.");
    expect(html).toContain("In Prüfung hat keine Behördenrechte.");
    expect(html).toContain(
      "Standortangaben wie Rathaus, Geschäftsstelle oder Redaktionsbüro bleiben optional.",
    );
    expect(html).not.toContain("userId");
    expect(html).not.toContain("Standort ist Pflicht");
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
