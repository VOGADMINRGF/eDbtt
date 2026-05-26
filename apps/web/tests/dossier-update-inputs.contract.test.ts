import { describe, expect, it } from "vitest";
import { ObjectId } from "@core/db/triMongo";
import { createDerivedDossierUpdateSeeds } from "@features/dossier/updateReadModel";

describe("dossier update inputs contract", () => {
  it("bundles create, feed, swipe, anlassraum and evidence signals into reviewable dossier suggestions", () => {
    const roomId = new ObjectId("65f000000000000000000001");

    const seeds = createDerivedDossierUpdateSeeds({
      dossier: {
        _id: new ObjectId("65f000000000000000000100"),
        dossierId: "dossier-verkehr",
        statementId: "statement-verkehr",
        status: "active",
        counts: { claims: 0, sources: 0, findings: 0, edges: 0, openQuestions: 0 },
        createdAt: new Date("2026-05-25T08:00:00.000Z"),
      },
      createHandoffs: [
        {
          id: "handoff-1",
          source: "create",
          sourceText: "Mehr Sicherheit am Zebrastreifen.",
          plannerResult: {
            plannerTopic: "Schulwegsicherheit",
            plannerCore: "Mehr Sicherheit",
            plannerClusters: ["Verkehr"],
            plannerScope: ["municipal"],
          },
          graphMatches: {
            stage: "after_structure",
            prepared: true,
            requiresConfirmation: true,
            searchTerms: ["Schulweg"],
            matches: [],
            matchedTopics: [],
            matchedDossiers: ["dossier-verkehr"],
            matchedClaims: [],
            matchedAnlassraeume: [],
            matchedVotes: [],
            shouldCreateNewTopic: false,
          },
          selectedAction: "append_to_dossier",
          claims: [{ id: "c1", text: "Autos fahren zu schnell", factcheckEligible: true }],
          arguments: [],
          openQuestions: [],
          sourceGrounding: [{ id: "link-1", label: "Presse", status: "link_reference" }],
          topicSeed: {
            topicKey: "schulwegsicherheit",
            topicLabel: "Schulwegsicherheit",
            jurisdiction: "kommune",
            themenradarSourceType: "create_intake",
          },
          resumeHref: "/create?handoffId=handoff-1",
          reviewState: "ready_for_confirmation",
          visibilityState: "internal_review",
          requiresConfirmation: true,
          reviewRequired: true,
          noAutoPublish: true,
          noPublicOfficial: true,
          noAutomaticOfficialResponse: true,
          noAutoFinalization: true,
          intakeClassification: "source_request",
          createdByUserId: "user-1",
          regionId: null,
          organizationId: null,
          dossierId: "dossier-verkehr",
          anlassraumId: roomId.toHexString(),
          requestScope: null,
          accessDecision: null,
          createdAt: "2026-05-25T08:00:00.000Z",
          updatedAt: "2026-05-25T08:10:00.000Z",
          schemaVersion: "create_handoff_review_item.v1",
        },
      ] as any,
      feedDrafts: [
        {
          _id: new ObjectId("65f000000000000000000200"),
          anlassraumId: roomId,
          createdAt: new Date("2026-05-25T09:00:00.000Z"),
          title: "Neue Verkehrszählung",
          summary: "Die aktuelle Zählung zeigt mehr Hol- und Bringverkehr.",
          claims: [{ text: "Mehr Hol- und Bringverkehr", topic: "Verkehr", responsibility: "Kommune" }],
          status: "review",
          pipeline: "feeds",
          weakSignal: { flagged: false },
        },
      ] as any,
      swipeProposals: [
        {
          _id: new ObjectId("65f000000000000000000300"),
          dossierId: "dossier-verkehr",
          anlassraumId: roomId.toHexString(),
          title: "Temporäre Schulstraße prüfen",
          text: "Die Schulstraße könnte morgens zeitweise autofrei sein.",
          stance: "pro",
          createdAt: new Date("2026-05-25T10:00:00.000Z"),
        },
      ],
      anlassraeume: [
        {
          _id: roomId,
          dossierId: new ObjectId("65f000000000000000000100"),
          title: "Schulwegsicherheit vor Ort",
          summary: "Beteiligung zum Schulweg läuft.",
          status: "active",
          updatedAt: new Date("2026-05-25T11:00:00.000Z"),
          createdAt: new Date("2026-05-25T09:00:00.000Z"),
          riskFlags: ["missing_primary_source"],
        },
      ],
      evidenceClaims: [
        {
          claimId: "ev-1",
          text: "Messdaten aus der Nachbarschaft liegen vor.",
          sourceType: "feed",
          updatedAt: new Date("2026-05-25T12:00:00.000Z"),
          createdAt: new Date("2026-05-25T12:00:00.000Z"),
        },
      ],
    });

    expect(seeds.map((item) => item.origin)).toEqual(
      expect.arrayContaining(["create", "feed", "swipe", "anlassraum", "evidence"]),
    );
    expect(seeds.find((item) => item.origin === "create")?.section).toBe("sources");
    expect(seeds.find((item) => item.origin === "swipe")?.section).toBe("perspective");
    expect(seeds.find((item) => item.origin === "feed")?.reviewHint).toContain("Feed-Radar");
  });
});
