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

    expect(html).toContain("Noch keine laufenden Anlässe vorhanden.");
    expect(html).toContain("Eröffne jetzt deinen ersten");
    expect(html).not.toContain("Ansicht");
    expect(html).not.toContain("Gesamt:");
  });

  it("Scenario C: productive source failure renders explicit error state without fallback", async () => {
    mocks.listRundenEntryItems.mockRejectedValue(new Error("round_entry_source_unavailable"));

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Rundendaten sind gerade nicht verfügbar");
    expect(html).toContain("später erneut");
  });

  it("Scenario D: entries without safe href render hint instead of direct link", async () => {
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
        entryHref: null,
        lifecycle: "active",
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

    expect(html).toContain("nicht direkt verfügbar");
    expect(html).toContain("Ansicht");
    expect(html).not.toContain("Anlass öffnen</a>");
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
        entryHref: "/round/mobilitaet?anlassraumId=65f000000000000000000211",
        lifecycle: "active",
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
    expect(html).toContain("Anlass eröffnen");
    expect(html).toContain("Bestehenden Anlass öffnen");
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
        entryHref: "/round/energiepreise?anlassraumId=65f000000000000000000221",
        lifecycle: "active",
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
});
