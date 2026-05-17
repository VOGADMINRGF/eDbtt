import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
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
    const html = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: {
          regionId: "berlin-reinickendorf",
        },
      }),
    );

    expect(html).toContain('data-testid="admin-region-page"');
    expect(html).toContain('data-testid="admin-region-context"');
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
    expect(html).toContain("Verwaltung, Akteure und Signale");
    expect(html).toContain("Zur Regionen-Übersicht");
    expect(html).toContain("Arbeitsansicht: berlin-reinickendorf");
    expect(html).toContain("Detailroute: `/admin/region?regionId=...`");
    expect(html).toContain("Aktuelle Themenlage Berlin Reinickendorf");
    expect(html).toContain("Kuratierte Startlage und Pilotvorschau für die Themenlage");
    expect(html).toContain("Keine Live-Crawler-Behauptung");
    expect(html).toContain("Produktive Quellen");
    expect(html).toContain("Keine produktive Quelle verbunden");
    expect(html).toContain("Kuratierte Quellen");
    expect(html).toContain("Manuelle Quellen");
    expect(html).toContain("Quellengewichtung und Adapter");
    expect(html).toContain("Gewichtung vorbereitet");
    expect(html).toContain("notRealNews=true");
    expect(html).toContain("notProductionData=true");
    expect(html).toContain("reviewRequired: true");
    expect(html).toContain("noAutoPublish: true");
    expect(html).toContain("noAutoDossierCreation: true");
    expect(html).toContain("noAutoAnlassraumCreation: true");
    expect(html).toContain("noTenderMonitoring: true");
    expect(html).toContain("noProcurementMonitoring: true");
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
    expect(html).toContain("Dossier-Draft vorbereiten");
    expect(html).toContain("Anlassraum-Draft vorbereiten");
    expect(html).toContain("Quelle prüfen");
    expect(html).toContain("Offene Frage markieren");
    expect(html).toContain("Persistente Draft-Erstellung läuft serverseitig nur für akzeptierte Signale.");
    expect(html).toContain("Selbstauskunft ist nicht verifiziert.");
    expect(html).toContain("In Prüfung hat keine Behördenrechte.");
    expect(html).toContain("Standortangaben wie Rathaus Reinickendorf bleiben optional.");
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
