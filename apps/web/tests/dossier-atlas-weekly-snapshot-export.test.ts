import { describe, expect, it } from "vitest";
import {
  evaluateDossierAtlasLandscapeConsistency,
  resolveDossierAtlasLandscapeContract,
} from "@features/anlassraum/dossierAtlasLandscapeContract";
import {
  evaluateDossierAtlasWeeklySnapshotExportConsistency,
  parseDossierAtlasWeeklySnapshotExport,
  resolveDossierAtlasWeeklySnapshotExport,
} from "@features/anlassraum/dossierAtlasWeeklySnapshotExport";

describe("dossier atlas weekly snapshot export", () => {
  it("builds a graphic-ready non-ranking snapshot payload from atlas contract", () => {
    const atlas = resolveDossierAtlasLandscapeContract({
      generatedAt: "2026-04-04T18:00:00.000Z",
      items: [
        {
          title: "Wärmeplanung Innenstadt",
          topicKey: "waermewende",
          topicLabel: "Waermewende",
          regionKey: "berlin",
          regionCode: "DE-BE",
          anlassId: "anlass-1",
          dossierId: "dossier-1",
          roundId: "round-1",
          resultId: "result-1",
          companionId: "companion-1",
          lifecycle: "closed",
          activityBand: "high",
          workState: "completed",
          contextGroups: ["association", "organization", "editorial_publisher"],
        },
        {
          title: "Schulwege Nord",
          topicKey: "mobilitaet",
          topicLabel: "Mobilitaet",
          regionKey: "hamburg",
          regionCode: "DE-HH",
          anlassId: "anlass-2",
          roundId: "round-2",
          lifecycle: "active",
          activityBand: "medium",
          workState: "in_progress",
          contextGroups: ["initiative", "civic_creator", "expert_voice"],
        },
      ],
      weeklySnapshot: {
        newContributions: 16,
        newAnlassraeume: 2,
        activeRounds: 1,
        openQuestions: 9,
        newDossiers: 1,
        followupFlows: 5,
      },
    });

    expect(evaluateDossierAtlasLandscapeConsistency(atlas).ok).toBe(true);

    const snapshot = resolveDossierAtlasWeeklySnapshotExport({
      atlas,
      generatedAt: "2026-04-04T18:30:00.000Z",
      windowStart: "2026-03-28T00:00:00.000Z",
      windowEnd: "2026-04-04T00:00:00.000Z",
      label: "Wochenlage KW14",
      topicLimit: 8,
    });

    expect(snapshot.summary.weekly.newContributions).toBe(16);
    expect(snapshot.topicHighlights.length).toBe(2);
    expect(snapshot.topicHighlights[0]?.topicLabel).toBe("Mobilitaet");
    expect(snapshot.topicHighlights[0]?.nonRankingSelection).toBe(true);
    expect(snapshot.regionView.separatedFromTopicAxis).toBe(true);
    expect(snapshot.graphicNotes.noToplist).toBe(true);
    expect(snapshot.guardrails.snapshotIsNotTruthMachine).toBe(true);
  });

  it("parses and validates consistency for snapshot payloads", () => {
    const atlas = resolveDossierAtlasLandscapeContract({
      items: [
        {
          title: "Lärmschutz Quartier",
          topicKey: "stadtplanung",
          anlassId: "anlass-3",
          roundId: "round-3",
          lifecycle: "active",
        },
      ],
    });

    const snapshot = resolveDossierAtlasWeeklySnapshotExport({
      atlas,
      topicLimit: 1,
    });

    const parsed = parseDossierAtlasWeeklySnapshotExport(snapshot);
    expect(parsed.ok).toBe(true);

    const consistency = evaluateDossierAtlasWeeklySnapshotExportConsistency(snapshot);
    expect(consistency.ok).toBe(true);
    expect(consistency.issues).toEqual([]);
  });
});
