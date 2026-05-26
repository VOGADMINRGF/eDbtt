import { describe, expect, it } from "vitest";
import { ObjectId } from "@core/db/triMongo";
import {
  buildDossierPublicUpdateContext,
  createDerivedDossierUpdateSeeds,
  mapDossierSuggestionDocToUpdateSuggestion,
} from "@features/dossier/updateReadModel";

describe("v1 dossier update engine contract", () => {
  it("keeps the runtime path review-first from signal to public dossier context", () => {
    const dossier = {
      _id: new ObjectId("65f000000000000000000500"),
      dossierId: "dossier-energie",
      statementId: "statement-energie",
      status: "active",
      counts: { claims: 0, sources: 0, findings: 0, edges: 0, openQuestions: 0 },
      createdAt: new Date("2026-05-25T08:00:00.000Z"),
    };

    const seeds = createDerivedDossierUpdateSeeds({
      dossier: dossier as any,
      createHandoffs: [],
      feedDrafts: [],
      swipeProposals: [
        {
          _id: new ObjectId("65f000000000000000000501"),
          dossierId: "dossier-energie",
          title: "Balkonkraftwerk vereinfachen",
          text: "Anmeldung und Förderung sollen vereinfacht werden.",
          createdAt: new Date("2026-05-25T10:00:00.000Z"),
        },
      ],
      anlassraeume: [
        {
          _id: new ObjectId("65f000000000000000000502"),
          title: "Energie im Kiez",
          summary: "Beteiligung läuft.",
          status: "active",
          updatedAt: new Date("2026-05-25T11:00:00.000Z"),
          createdAt: new Date("2026-05-25T11:00:00.000Z"),
        },
      ],
      evidenceClaims: [],
    });

    const suggestions = seeds.map((seed, index) =>
      mapDossierSuggestionDocToUpdateSuggestion(
        {
          suggestionId: seed.suggestionId,
          dossierId: "dossier-energie",
          type: seed.type,
          payload: {
            title: seed.title,
            summary: seed.summary,
            origin: seed.origin,
            section: seed.section,
            reviewHint: seed.reviewHint,
            riskHint: seed.riskHint,
            nextAction: seed.nextAction,
            swipesHref: seed.swipesHref,
            anlassraumHref: seed.anlassraumHref,
            statementId: seed.statementId,
          },
          status: index === 0 ? "pending" : "accepted",
          createdAt: seed.createdAt,
          updatedAt: seed.updatedAt,
        } as any,
        {
          dossier: dossier as any,
          publicVisible: true,
          archived: false,
          relatedAnlassraum: {
            _id: new ObjectId("65f000000000000000000502"),
            title: "Energie im Kiez",
          },
        },
      ),
    );

    const publicContext = buildDossierPublicUpdateContext({
      dossierId: "dossier-energie",
      items: suggestions,
      publicVisible: true,
      archived: false,
      relatedAnlassraum: {
        _id: new ObjectId("65f000000000000000000502"),
        title: "Energie im Kiez",
      },
      statementId: "statement-energie",
    });

    expect(suggestions.some((item) => item.reviewRequired)).toBe(true);
    expect(publicContext.reviewItems.length).toBeGreaterThan(0);
    expect(publicContext.publishedItems.length).toBeGreaterThan(0);
    expect(publicContext.relatedContext.anlassraumHref).toContain("/runden?");
    expect(publicContext.relatedContext.swipesHref).toBe("/swipes/statement-energie");
  });
});
