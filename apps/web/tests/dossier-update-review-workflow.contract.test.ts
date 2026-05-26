import { describe, expect, it } from "vitest";
import { ObjectId } from "@core/db/triMongo";
import { mapDossierSuggestionDocToUpdateSuggestion } from "@features/dossier/updateReadModel";

describe("dossier update review workflow contract", () => {
  const dossier = {
    _id: new ObjectId("65f000000000000000000100"),
    dossierId: "dossier-bildung",
    statementId: "statement-bildung",
    status: "active",
    counts: { claims: 0, sources: 0, findings: 0, edges: 0, openQuestions: 0 },
    createdAt: new Date("2026-05-25T08:00:00.000Z"),
  };

  it("keeps pending updates reviewpflichtig with origin, section and next step", () => {
    const item = mapDossierSuggestionDocToUpdateSuggestion(
      {
        suggestionId: "du:feed:1",
        dossierId: "dossier-bildung",
        type: "update",
        payload: {
          title: "Neue Meldung aus dem Feed-Radar",
          summary: "Ein Schulträger meldet neue Engpässe.",
          origin: "feed",
          section: "update",
          nextAction: "Im Admin-Dossier prüfen.",
          reviewHint: "Noch kein veröffentlichter Dossierstand.",
          riskHint: "Nur Hinweis aus externer Quelle.",
        },
        status: "pending",
        createdAt: new Date("2026-05-25T08:10:00.000Z"),
        updatedAt: new Date("2026-05-25T08:15:00.000Z"),
      } as any,
      { dossier: dossier as any, publicVisible: true, archived: false, relatedAnlassraum: null },
    );

    expect(item.status).toBe("update_suggested");
    expect(item.reviewRequired).toBe(true);
    expect(item.originLabel).toBe("Feed-Radar");
    expect(item.sectionLabel).toBe("Update");
    expect(item.nextAction).toBe("Im Admin-Dossier prüfen.");
  });

  it("marks accepted suggestions as published in dossier when the public view is visible", () => {
    const item = mapDossierSuggestionDocToUpdateSuggestion(
      {
        suggestionId: "du:create:1",
        dossierId: "dossier-bildung",
        type: "claim",
        payload: {
          title: "Bürgerhinweis übernommen",
          summary: "Die offene Frage wurde als Claim ergänzt.",
          origin: "create",
          section: "claim",
        },
        status: "accepted",
        createdAt: new Date("2026-05-25T08:00:00.000Z"),
        updatedAt: new Date("2026-05-25T09:00:00.000Z"),
      } as any,
      { dossier: dossier as any, publicVisible: true, archived: false, relatedAnlassraum: null },
    );

    expect(item.status).toBe("published_in_dossier");
    expect(item.reviewRequired).toBe(false);
    expect(item.statusLabel).toBe("Veröffentlicht im Dossier");
  });
});
