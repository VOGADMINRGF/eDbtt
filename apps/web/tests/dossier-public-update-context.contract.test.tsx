import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import demoDossier from "@features/dossier/data/demoDossier";
import { DossierPagePublicBody } from "@/app/dossier/[id]/ui";

describe("dossier public update context contract", () => {
  it("keeps checked updates progressive and links only an existing participation path", () => {
    const html = renderToStaticMarkup(
      <DossierPagePublicBody
        dossierId="dossier-1"
        dossier={demoDossier}
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
          reviewItems: [],
          originSummary: [{ origin: "feed", label: "Feed-Radar", count: 1 }],
          sectionSummary: [{ section: "sources", label: "Quellenlage", count: 1 }],
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

    expect(html).toContain("Update-Kontext");
    expect(html).toContain("Geprüfter und sichtbarer Arbeitsstand");
    expect(html).toContain("Öffentlich eingebundene Updates: 1");
    expect(html).not.toContain("Quellenhinweis übernommen");
  });
});
