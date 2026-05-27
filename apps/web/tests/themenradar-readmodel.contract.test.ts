import { beforeEach, describe, expect, it } from "vitest";
import {
  loadAutonomousModule,
  resetAutonomousFixtures,
  setAutonomousFixtures,
} from "./themenradar-autonomous-test-helpers";

describe("themenradar readmodel contract", () => {
  beforeEach(() => {
    resetAutonomousFixtures();
  });

  it("builds a review-first clustered readmodel from feed, create, dossier and anlassraum signals", async () => {
    setAutonomousFixtures({
      voteDrafts: [
        {
          _id: "draft-1",
          title: "Hitzeplan für Schulen",
          claims: [{ title: "Schulen brauchen Hitzeschutz", topic: "Hitzeplan Schulen" }],
          summary: "Wie reagieren Schulen auf Hitzetage?",
          status: "review",
          feedReviewState: "ready",
          sourceUrl: "https://example.org/feed/hitzeplan",
          createdAt: "2026-05-26T10:00:00.000Z",
          publishedAt: "2026-05-26T11:00:00.000Z",
          regionCode: "DE-BE",
        },
      ],
      dossierSuggestions: [
        {
          suggestionId: "suggestion-1",
          dossierId: "dossier-hitze",
          type: "question",
          status: "needs_review",
          payload: {
            title: "Welche Schutzmaßnahmen fehlen?",
            summary: "Offene Frage aus dem Dossierkontext",
            sourceHref: "https://example.org/dossier/hitze",
          },
          createdAt: "2026-05-25T10:00:00.000Z",
          updatedAt: "2026-05-26T09:00:00.000Z",
        },
      ],
      dossierWorkspaces: {
        "dossier-hitze": {
          regionId: "DE-BE",
        },
      },
      anlassraeume: [
        {
          _id: "anlass-1",
          title: "Hitzeschutz in Schulen",
          summary: "Öffentlicher Anlassraum mit Beteiligung",
          isPublic: true,
          regionKey: "DE-BE",
          updatedAt: "2026-05-26T08:00:00.000Z",
        },
      ],
      createHandoffs: [
        {
          id: "handoff-1",
          summary: "Beitrag zu Hitzeschutz",
          sourceText: "Bitte Schulhöfe beschatten",
          selectedAction: { label: "Thema vorschlagen" },
          topicSeed: { topicLabel: "Hitzeplan Schulen" },
          regionId: "DE-BE",
          organizationId: null,
          claims: [{ title: "Schulhöfe brauchen Schatten" }],
          openQuestions: [{ question: "Wie schnell kann der Bezirk handeln?" }],
          arguments: [{ title: "Mehr Bäume" }],
          sourceGrounding: [{ label: "Beobachtung vor Ort", status: "observation" }],
          resumeHref: "/create?resume=handoff-1",
          dossierId: "dossier-hitze",
          anlassraumId: "anlass-1",
          createdAt: "2026-05-26T07:00:00.000Z",
          updatedAt: "2026-05-26T07:30:00.000Z",
        },
      ],
    });

    const { buildAutonomousThemenradarReadModel } = await loadAutonomousModule();
    const readModel = await buildAutonomousThemenradarReadModel();
    const item = readModel.items[0];

    expect(readModel.summary.totalClusters).toBeGreaterThan(0);
    expect(item.topicLabel).toBe("Hitzeplan Schulen");
    expect(item.reviewRequired).toBe(true);
    expect(item.autoPublishAllowed).toBe(false);
    expect(item.claims).toEqual(
      expect.arrayContaining(["Schulen brauchen Hitzeschutz", "Schulhöfe brauchen Schatten"]),
    );
    expect(item.questions).toEqual(
      expect.arrayContaining(["Wie reagieren Schulen auf Hitzetage?", "Wie schnell kann der Bezirk handeln?"]),
    );
    expect(item.dossierContext).toBe(true);
    expect(item.anlassraumContext).toBe(true);
    expect(item.relevanceScore).toBeGreaterThan(0);
    expect(item.participationPotential).toBeGreaterThan(0);
  });
});
