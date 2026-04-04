import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  listRundenEntryItems: vi.fn(),
  readSession: vi.fn(),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.listRundenEntryItems(...args),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

import RundenPage from "@/app/runden/page";

describe("/runden acceptance states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue(null);
  });

  it("Scenario B: productive empty result renders explicit empty state without demo fallback", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Noch keine Anlässe vorhanden.");
    expect(html).toContain("Jetzt ersten Anlass eröffnen");
    expect(html).not.toContain("Ansicht");
    expect(html).not.toContain("Gesamt:");
  });

  it("Scenario C: productive source failure renders explicit error state without fallback", async () => {
    mocks.listRundenEntryItems.mockRejectedValue(new Error("round_entry_source_unavailable"));

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Anlassdaten sind gerade nicht verfügbar");
    expect(html).toContain("später erneut");
  });

  it("Scenario D: entries without operating link still keep active view stable", async () => {
    mocks.readSession.mockResolvedValue({
      uid: "65f000000000000000000111",
      roles: ["user"],
    });
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-1",
        anlassraumId: null,
        isPublic: null,
        title: "Legacy Runde ohne Raum-ID",
        summary: "Legacy Datensatz",
        topicKey: null,
        anlassraumType: null,
        sourceMode: "manual",
        anlassraumStatus: "active",
        outputStatus: "review",
        reviewState: "pending",
        publishTarget: "/round/legacy",
        intakeHref: null,
        operatingHref: null,
        resultsHref: null,
        entryHref: null,
        lifecycle: "active",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: true,
        sourceKind: "output_seed_legacy_incomplete",
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Laufende Anlässe");
    expect(html).toContain("Runde öffnen");
    expect(html).toContain("Ansicht");
    expect(html).not.toContain("In /create weiter vorbereiten");
  });

  it("Scenario E: public state stays compact without work tabs or stats", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-2",
        anlassraumId: "65f000000000000000000211",
        isPublic: true,
        title: "Mobilität Innenstadt",
        summary: "Öffentlicher Anlass.",
        topicKey: "mobility",
        anlassraumType: "policy",
        sourceMode: "feed",
        anlassraumStatus: "active",
        outputStatus: "review",
        reviewState: "pending",
        publishTarget: "/round/mobilitaet",
        intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000211",
        operatingHref: "/round/mobilitaet?anlassraumId=65f000000000000000000211",
        resultsHref: null,
        entryHref: "/round/mobilitaet?anlassraumId=65f000000000000000000211",
        lifecycle: "active",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({ view: "mine" }) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("ANLÄSSE");
    expect(html).toContain("Neu starten in /create");
    expect(html).toContain("Laufendes in /runden");
    expect(html).toContain("Ergebnisse ansehen");
    expect(html).not.toContain("Ansicht");
    expect(html).not.toContain("Meine Anlässe");
    expect(html).not.toContain("Verwalten");
    expect(html).not.toContain("Gesamt:");
  });

  it("Scenario F: signed-in member does not see management tab", async () => {
    mocks.readSession.mockResolvedValue({
      uid: "65f000000000000000000121",
      roles: ["user"],
    });
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-3",
        anlassraumId: "65f000000000000000000221",
        isPublic: true,
        title: "Energiepreise",
        summary: "Laufender Anlass.",
        topicKey: "energy",
        anlassraumType: "policy",
        sourceMode: "feed",
        anlassraumStatus: "active",
        outputStatus: "review",
        reviewState: "pending",
        publishTarget: "/round/energiepreise",
        intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000221",
        operatingHref: "/round/energiepreise?anlassraumId=65f000000000000000000221",
        resultsHref: null,
        entryHref: "/round/energiepreise?anlassraumId=65f000000000000000000221",
        lifecycle: "active",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Ansicht");
    expect(html).toContain("Meine Anlässe");
    expect(html).not.toContain(">Verwalten<");
  });

  it("Scenario G: share actions are visible on featured and result contexts when share targets exist", async () => {
    mocks.readSession.mockResolvedValue({
      uid: "65f000000000000000000131",
      roles: ["user"],
    });
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        id: "seed-active",
        anlassraumId: "65f000000000000000000231",
        isPublic: true,
        title: "Laufender Anlass mit Share",
        summary: "Aktiver Kontext",
        topicKey: "energy",
        anlassraumType: "policy",
        sourceMode: "feed",
        anlassraumStatus: "active",
        outputStatus: "review",
        reviewState: "pending",
        publishTarget: "/round/laufender-anlass",
        intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000231",
        operatingHref: "/round/laufender-anlass?anlassraumId=65f000000000000000000231",
        resultsHref: null,
        entryHref: "/round/laufender-anlass?anlassraumId=65f000000000000000000231",
        lifecycle: "active",
        finished: false,
        finishedAt: null,
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
        shareActions: {
          contextKind: "runde",
          primaryTargetKind: "round_operating_target",
          canonicalTarget: "/round/laufender-anlass?anlassraumId=65f000000000000000000231",
          qrTarget: "/round/laufender-anlass?anlassraumId=65f000000000000000000231",
          shareTitle: "Laufender Anlass mit Share",
          sharePrompt: "Laufenden Kontext teilen",
          shareSummary: "Zusammenfassung",
          socialCandidate: false,
          needsReviewBeforeOfficialSocial: true,
        },
      },
      {
        id: "seed-closed",
        anlassraumId: "65f000000000000000000232",
        isPublic: true,
        title: "Abgeschlossener Anlass mit Share",
        summary: "Abschlusskontext",
        topicKey: "energy",
        anlassraumType: "policy",
        sourceMode: "feed",
        anlassraumStatus: "published",
        outputStatus: "published",
        reviewState: "approved",
        publishTarget: "/round/abgeschlossener-anlass",
        intakeHref: "/create?mode=source&anlassraumId=65f000000000000000000232",
        operatingHref: "/round/abgeschlossener-anlass?anlassraumId=65f000000000000000000232",
        resultsHref: "/round/abgeschlossener-anlass?anlassraumId=65f000000000000000000232",
        entryHref: "/round/abgeschlossener-anlass?anlassraumId=65f000000000000000000232",
        lifecycle: "closed",
        finished: true,
        finishedAt: "2026-04-04T10:00:00.000Z",
        lastAction: null,
        lastActionBy: null,
        lastActionAt: null,
        createdAt: null,
        updatedAt: null,
        legacyIncomplete: false,
        sourceKind: "output_seed_with_anlassraum",
        shareActions: {
          contextKind: "ergebnis",
          primaryTargetKind: "round_results_target",
          canonicalTarget: "/round/abgeschlossener-anlass?anlassraumId=65f000000000000000000232",
          qrTarget: "/round/abgeschlossener-anlass?anlassraumId=65f000000000000000000232",
          shareTitle: "Abgeschlossener Anlass mit Share",
          sharePrompt: "Ergebnis teilen",
          shareSummary: "Zusammenfassung",
          socialCandidate: true,
          needsReviewBeforeOfficialSocial: true,
        },
      },
    ]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Link kopieren");
    expect(html).toContain("QR anzeigen");
    expect(html).toContain("Ziel: Runde");

    const resultsTree = await RundenPage({
      searchParams: Promise.resolve({ view: "results" }),
    });
    const resultsHtml = renderToStaticMarkup(resultsTree);
    expect(resultsHtml).toContain("Ziel: Ergebnis");
  });
});
