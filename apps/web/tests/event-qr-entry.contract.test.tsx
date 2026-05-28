import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  buildRuntime: vi.fn(),
}));

vi.mock("@features/stream/publicRuntime", () => ({
  buildStreamPublicRuntime: (...args: unknown[]) => mocks.buildRuntime(...args),
  buildStreamShareContext: () => ({
    contextKind: "event",
    primaryTargetKind: "companion_public_target",
    canonicalTarget: "/stream/stadtwerke-live-berlin",
    qrTarget: "/stream/stadtwerke-live-berlin",
    shareTitle: "Livestream Stadtwerke Berlin",
    sharePrompt: "Öffne den Event-Kontext.",
    shareSummary: "Öffentliche Teilnahmefläche.",
    socialCandidate: true,
    needsReviewBeforeOfficialSocial: true,
    existingContextHint: null,
  }),
}));

vi.mock("@/components/share/SocialOutputPreviewPanel", () => ({
  default: () => <div data-testid="social-preview">preview</div>,
}));

vi.mock("@/app/runden/RundenShareActions", () => ({
  default: () => <div data-testid="stream-share-actions">share</div>,
}));

vi.mock("@/app/stream/StreamPublicInputPanel", () => ({
  default: () => <div data-testid="stream-public-input-panel">input</div>,
}));

import StreamDetailPage from "@/app/stream/[slug]/page";

describe("event qr entry page", () => {
  it("renders the qr-first mobile event entry and the follow-up links on the existing stream route", async () => {
    mocks.buildRuntime.mockResolvedValue({
      session: {
        id: "65f000000000000000000901",
        slugOrId: "stadtwerke-live-berlin",
        title: "Livestream Stadtwerke Berlin",
        description: "Öffentliche Energierunde",
        topicKey: "energie-berlin",
        regionCode: "berlin",
        startsAt: "2026-05-25T18:00:00.000Z",
        playerUrl: null,
        liveBoard: null,
        statusLabel: "Hinweise werden gesammelt",
        statusDescription: "Fragen, Quellen und Perspektiven gehen reviewpflichtig in die Nachbereitung ein.",
        nextAction: "Beteiligung einreichen oder Kontext im Dossier prüfen.",
        statusTone: "info",
        resolvedStatus: "collecting_input",
      },
      context: {
        anlassraumHref: "/runden?anlassraumId=65f000000000000000000401",
        anlassraumTitle: "Anlassraum Energie Berlin",
        dossierHref: "/dossier/65f000000000000000000777",
        swipesHref: "/swipes?topic=energie-berlin&fromStream=1&stream=stadtwerke-live-berlin",
        shareEnabled: true,
      },
      participation: {
        openForInput: true,
        pendingCount: 3,
        visibleCount: 1,
        items: [],
      },
      recap: {
        reviewHint: "Nachbereitung, offene Fragen und Folgepfade bleiben review-first statt automatisch veröffentlicht.",
        dossierUpdateHint: "2 Dossier-Hinweise sind in Prüfung.",
        anlassraumUpdateHint: "Der zugehörige Anlassraum bleibt die öffentliche Folgefläche.",
        socialDraftHint: "Dossier-Update: Prüfung nötig.",
        latestFollowUp: null,
      },
      guardrails: {
        noAutoPublish: true,
        noAutoSocial: true,
        noAutoMerge: true,
        reviewFirstInput: true,
      },
    });

    const tree = await StreamDetailPage({
      params: Promise.resolve({ slug: "stadtwerke-live-berlin" }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("QR-first Eventmodus");
    expect(html).toContain("Mit dem QR-Code direkt in denselben Beteiligungspfad");
    expect(html).toContain("Frage stellen");
    expect(html).toContain("Quelle/Hinweis geben");
    expect(html).toContain("Option vorschlagen");
    expect(html).toContain("Dossier öffnen");
    expect(html).toContain("Ergebnis später im Anlassraum sehen");
    expect(html).toContain("href=\"/stream/stadtwerke-live-berlin?kind=question#event-input\"");
    expect(html).toContain("href=\"/stream/stadtwerke-live-berlin?kind=source_hint#event-input\"");
    expect(html).toContain("href=\"/stream/stadtwerke-live-berlin?kind=option#event-input\"");
    expect(html).toContain("href=\"/dossier/65f000000000000000000777\"");
    expect(html).toContain("href=\"/runden?anlassraumId=65f000000000000000000401\"");
    expect(html).toContain("data-testid=\"stream-share-actions\"");
  });
});
