import { describe, expect, it } from "vitest";
import { buildResearchSourceTransferabilityContract } from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";

describe("research source transferability agent contract", () => {
  it("keeps translations as reading support and marks international references for review", () => {
    const model = buildResearchSourceTransferabilityContract({
      sourcePackId: "pack-transferability-1",
      localRegionCode: "DE-BE",
      sources: [
        {
          sourceId: "source-tr-1",
          title: "Istanbul Mobility Report",
          url: "https://example.org/istanbul-mobility",
          sourceLocale: "tr-TR",
          regionCode: "TR-34",
          sourceType: "official",
          reliabilityHint: "primary",
          retrievedAt: "2026-07-13T09:00:00.000Z",
          originalSnippet: "Orijinal alinti",
          translatedSnippet: "Uebersetzte Lesefassung",
          translationStatus: "translated",
          evidenceState: "supported",
          issuerLabel: "Stadt Istanbul",
          jurisdictionLabel: "Istanbul",
        },
        {
          sourceId: "source-de-1",
          title: "Berliner Bezirksbericht",
          url: "https://example.org/berlin-report",
          sourceLocale: "de-DE",
          regionCode: "DE-BE",
          sourceType: "official",
          reliabilityHint: "primary",
          retrievedAt: "2026-07-13T09:10:00.000Z",
          originalSnippet: "Originalauszug",
          translationStatus: "not_needed",
          evidenceState: "supported",
          issuerLabel: "Bezirk Berlin",
          jurisdictionLabel: "Berlin",
        },
      ],
    });

    expect(model.translationIsEvidence).toBe(false);
    expect(model.sourcePack.sources[0]).toMatchObject({
      originalSnippet: "Orijinal alinti",
      translatedSnippet: "Uebersetzte Lesefassung",
      translationStatus: "translated",
    });
    expect(model.entries[0]).toMatchObject({
      decision: "international_review_required",
      issuerLabel: "Stadt Istanbul",
      jurisdictionLabel: "Istanbul",
    });
    expect(model.entries[1]).toMatchObject({
      decision: "local_reference",
      issuerLabel: "Bezirk Berlin",
    });
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "research_source",
      requiredHumanAction: "verify_source_provenance",
    });
    expect(model.safeTrace[1]).toMatchObject({
      requiredHumanAction: "assess_transferability",
    });
  });
});
