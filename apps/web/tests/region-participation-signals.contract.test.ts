import { describe, expect, it } from "vitest";
import {
  REGION_PARTICIPATION_SIGNAL_FIXTURES,
  inferParticipationRegionAssignment,
  type RegionParticipationSignal,
} from "@features/region";

function findSignal(sourceType: RegionParticipationSignal["sourceType"], idPart?: string) {
  return REGION_PARTICIPATION_SIGNAL_FIXTURES.find(
    (signal) => signal.sourceType === sourceType && (!idPart || signal.id.includes(idPart)),
  );
}

describe("region participation signals contract", () => {
  it("exposes public claims, contributions, questions and source hints as reviewpflichtige or accepted public signals", () => {
    expect(findSignal("public_claim")).toMatchObject({
      reviewStatus: "needs_review",
      sourceClass: "participation",
      noAutoPublish: true,
      noPersonalProfiling: true,
      noPoliticalScoring: true,
      noRepresentativeClaim: true,
    });
    expect(findSignal("public_contribution", "needs-region-review-001")).toMatchObject({
      reviewStatus: "needs_region_review",
      sourceClass: "participation",
      needsRegionReview: true,
    });
    expect(findSignal("public_contribution", "magdeburg-contribution-001")).toMatchObject({
      reviewStatus: "needs_review",
      sourceClass: "participation",
    });
    expect(findSignal("public_question", "question-001")).toMatchObject({
      reviewStatus: "needs_review",
      sourceClass: "participation",
    });
    expect(findSignal("public_source_hint")).toMatchObject({
      reviewStatus: "needs_review",
      sourceClass: "participation",
    });
  });

  it("keeps swipe interest and counterpoints anonymized and aggregated", () => {
    expect(findSignal("swipe_interest")).toMatchObject({
      aggregationMode: "anonymized_count",
      privacyMode: "anonymized",
      noPersonalProfiling: true,
      noPoliticalScoring: true,
      noRepresentativeClaim: true,
    });
    expect(findSignal("swipe_counterpoint")).toMatchObject({
      aggregationMode: "anonymized_count",
      privacyMode: "anonymized",
    });
  });

  it("marks unclear region assignments as needsRegionReview instead of auto-assigning Reinickendorf", () => {
    const assignment = inferParticipationRegionAssignment({
      text: "Mehr Transparenz für Schulen und Verkehr, aber ohne eindeutigen Ortsbezug.",
      regions: [
        {
          id: "bezirk-berlin-reinickendorf",
          slug: "berlin-reinickendorf",
          name: "Berlin Reinickendorf",
          type: "bezirk",
          administrativeUnitType: "bezirk",
          parentRegionId: "region-berlin",
          officialBody: null,
          officialDirectoryEntry: null,
          federalState: "Berlin",
          country: "DE",
          publicVisibility: "public",
          createdAt: null,
          updatedAt: null,
        },
      ],
    });

    expect(assignment.regionId).toBeNull();
    expect(assignment.needsRegionReview).toBe(true);
    expect(assignment.matchedRegionIds).toEqual([]);
  });

  it("keeps tender and procurement source types out of the participation contract", () => {
    for (const signal of REGION_PARTICIPATION_SIGNAL_FIXTURES) {
      expect(signal.sourceType).not.toBe("tender");
      expect(signal.sourceType).not.toBe("procurement");
      expect(signal.sourceType).not.toBe("vergabe");
      expect(signal.sourceType).not.toBe("ausschreibung");
      expect(signal.noTenderMonitoring).toBe(true);
      expect(signal.noProcurementMonitoring).toBe(true);
    }
  });
});
