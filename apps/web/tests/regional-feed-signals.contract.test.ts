import { describe, expect, it } from "vitest";
import {
  parseRegionFeedSignal,
  REGION_FEED_SIGNAL_FIXTURES,
  supportsRegionTenderSignalTypes,
} from "@features/region";

describe("regional feed signal contract", () => {
  it("keeps fixture/pilot signals review-only with all auto flags disabled", () => {
    for (const signal of REGION_FEED_SIGNAL_FIXTURES) {
      expect(signal.noAutoPublish).toBe(true);
      expect(signal.noAutoCreateDossier).toBe(true);
      expect(signal.noAutoCreateAnlassraum).toBe(true);
      expect(signal.noTenderMonitoring).toBe(true);
      expect(signal.noProcurementMonitoring).toBe(true);
      expect(signal.provenance.dataOrigin).toBe("pilot_fixture");
      expect(signal.provenance.isFixture).toBe(true);
      expect(signal.provenance.fixtureMarker).toBe("pilot_fixture_only");
    }
  });

  it("does not allow tender or procurement signal types in the MVP contract", () => {
    expect(supportsRegionTenderSignalTypes()).toBe(false);
    for (const forbidden of ["tender", "procurement", "vergabe", "ausschreibung"]) {
      expect(() =>
        parseRegionFeedSignal({
          id: `invalid-${forbidden}-signal`,
          kind: "region_feed_signal",
          regionId: "bezirk-berlin-reinickendorf",
          sourceId: "feed-source",
          sourceType: forbidden,
          title: "Vergabe",
          summary: "Soll nicht erlaubt sein.",
          detectedTopics: ["Vergabe"],
          detectedPlaces: ["Reinickendorf"],
          relatedClaims: [],
          relatedDossiers: [],
          relatedAnlassraumIds: [],
          suggestedAction: "ignore",
          confidence: 0.2,
          reviewStatus: "draft",
          noAutoPublish: true,
          noAutoCreateDossier: true,
          noAutoCreateAnlassraum: true,
          noTenderMonitoring: true,
          noProcurementMonitoring: true,
          provenance: {
            dataOrigin: "pilot_fixture",
            isFixture: true,
            fixtureMarker: "pilot_fixture_only",
          },
          openQuestions: [],
          reviewHint: null,
        }),
      ).toThrow();
    }
  });
});
