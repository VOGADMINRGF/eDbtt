import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AccountEditorialReviewSection from "@/app/account/AccountEditorialReviewSection";

describe("account editorial review section", () => {
  it("shows manual review states as review-only and not as published", () => {
    const html = renderToStaticMarkup(
      <AccountEditorialReviewSection
        requests={[
          {
            id: "editorial-1",
            sourceType: "create_analysis",
            sourceId: "draft-1",
            userId: "user-1",
            originalText: "Bitte prüft diesen Entwurf zur Schulwegsicherheit.",
            normalizedText: "Bitte prüft diesen Entwurf zur Schulwegsicherheit.",
            analysisRunId: "run-1",
            truthStatus: "source_open",
            sourceSupport: "open",
            sourceStatus: "Quellenlage offen",
            reviewRecommended: true,
            verificationLabel: "analysiert",
            noTruthPromotion: true,
            reason: "source_open",
            userNote: "Mir fehlen belastbare Quellen.",
            status: "pending_review",
            createdAt: "2026-06-06T10:00:00.000Z",
            updatedAt: "2026-06-06T10:00:00.000Z",
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            id: "editorial-2",
            sourceType: "create_analysis",
            sourceId: "round-1",
            userId: "user-1",
            originalText: "Den Platz vor der Schule bitte als Anlassraum-Entwurf weiter prüfen.",
            truthStatus: "review_required",
            sourceSupport: "open",
            sourceStatus: "Prüfung empfohlen",
            reviewRecommended: true,
            verificationLabel: "analysiert",
            noTruthPromotion: true,
            reason: "editorial_escalation",
            status: "needs_user_clarification",
            userVisibleNote: "Bitte nenne den konkreten Ort und ob es um Schulweg oder Vorplatz geht.",
            createdAt: "2026-06-06T11:00:00.000Z",
            updatedAt: "2026-06-06T11:00:00.000Z",
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
        ]}
      />,
    );

    expect(html).toContain("Redaktionelle Prüfung");
    expect(html).toContain("Zur manuellen Prüfung vorgemerkt");
    expect(html).toContain("Create-Analyse");
    expect(html).toContain("Rückfrage erforderlich");
    expect(html).toContain("Rückfrage der Redaktion");
    expect(html).toContain("Ursprünglicher Beitrag");
    expect(html).toContain("Antwort senden");
    expect(html).toContain("Bitte nenne den konkreten Ort und ob es um Schulweg oder Vorplatz geht.");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Quellenlage offen");
    expect(html).not.toContain("Veröffentlicht");
  });
});
