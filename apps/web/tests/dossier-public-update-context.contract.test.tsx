import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Dossier } from "@features/dossier";

vi.mock("@/components/dossier/DossierViewer", () => ({
  DossierViewer: ({ dossier }: { dossier: Dossier }) => <div>DossierViewer:{dossier.meta?.title}</div>,
}));

vi.mock("@/components/ai/RouteBoundCompanionPanel", () => ({
  default: () => <div>RouteBoundCompanionPanel</div>,
}));

vi.mock("@/components/mobile/ShareDeepLinkActions", () => ({
  default: () => <div>ShareDeepLinkActions</div>,
}));

vi.mock("@/components/share/SocialOutputPreviewPanel", () => ({
  default: () => <div>SocialOutputPreviewPanel</div>,
}));

import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

describe("dossier public update context contract", () => {
  it("explains checked stand, review updates and linked citizen paths", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        handoffDraft={null}
        dossier={{
          meta: {
            id: "dossier-1",
            title: "Dossier Schulbau",
            region: "Berlin",
          },
          analyze: {
            summary: "Aktueller Dossierstand.",
            claims: [{ title: "Erste Aussage" }],
          },
        } as unknown as Dossier}
        loadState="ready"
        updateContext={{
          checkedStandLabel: "Geprüfter und sichtbarer Arbeitsstand",
          checkedStandHint: "Neue Hinweise bleiben separat in Prüfung.",
          latestPublicUpdateAt: "2026-05-25T12:00:00.000Z",
          latestReviewUpdateAt: "2026-05-25T13:00:00.000Z",
          publishedItems: [
            {
              id: "u1",
              dossierId: "dossier-1",
              statementId: "statement-1",
              title: "Quellenhinweis übernommen",
              summary: "Neue Quelle ist im Dossier-Kontext sichtbar.",
              origin: "feed",
              originLabel: "Feed-Radar",
              section: "sources",
              sectionLabel: "Quellenlage",
              status: "published_in_dossier",
              statusLabel: "Veröffentlicht im Dossier",
              statusDescription: "sichtbar",
              tone: "success",
              moderationStatus: "accepted",
              reviewRequired: false,
              reviewHint: "bereits geprüft",
              riskHint: "",
              nextAction: "",
              dossierHref: "/dossier/dossier-1",
              anlassraumHref: "/runden?anlassraumId=room-1",
              swipesHref: "/swipes/statement-1",
              sourceHref: null,
              createdAt: "2026-05-25T11:00:00.000Z",
              updatedAt: "2026-05-25T12:00:00.000Z",
            },
          ],
          reviewItems: [
            {
              id: "u2",
              dossierId: "dossier-1",
              statementId: "statement-1",
              title: "Neue offene Frage",
              summary: "Wer übernimmt die Baukoordination?",
              origin: "create",
              originLabel: "Create",
              section: "question",
              sectionLabel: "Offene Frage",
              status: "question_hint_added",
              statusLabel: "Offene Frage ergänzt",
              statusDescription: "review",
              tone: "info",
              moderationStatus: "pending",
              reviewRequired: true,
              reviewHint: "Noch nicht übernommen.",
              riskHint: "Braucht Zuständigkeitsprüfung.",
              nextAction: "Im Dossier prüfen.",
              dossierHref: "/dossier/dossier-1",
              anlassraumHref: "/runden?anlassraumId=room-1",
              swipesHref: "/swipes/statement-1",
              sourceHref: "/create?handoffId=h1",
              createdAt: "2026-05-25T13:00:00.000Z",
              updatedAt: "2026-05-25T13:00:00.000Z",
            },
          ],
          originSummary: [{ origin: "feed", label: "Feed-Radar", count: 1 }],
          sectionSummary: [{ section: "question", label: "Offene Frage", count: 1 }],
          relatedContext: {
            dossierHref: "/dossier/dossier-1",
            anlassraumHref: "/runden?anlassraumId=room-1",
            anlassraumLabel: "Beteiligung läuft im Anlassraum „Schulbau vor Ort“",
            swipesHref: "/swipes/statement-1",
            swipesLabel: "Zur passenden Swipe-Karte",
          },
        }}
      />,
    );

    expect(html).toContain("Stand, neue Hinweise und nächste Schritte");
    expect(html).toContain("Geprüfter und sichtbarer Arbeitsstand");
    expect(html).toContain("Neu oder in Prüfung");
    expect(html).toContain("Bereits im Dossier-Kontext");
    expect(html).toContain("Beteiligung läuft im Anlassraum");
    expect(html).toContain("Zur passenden Swipe-Karte");
  });
});
