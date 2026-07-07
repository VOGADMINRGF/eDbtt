import { describe, expect, it } from "vitest";
import {
  buildCanonicalSourcePack,
  getCanonicalSourcePackOverallEvidenceState,
  resolveCanonicalSourcePackEvidenceState,
} from "@/features/create/canonicalSourcePackContract";

describe("canonical source pack contract", () => {
  it("keeps missing sources honest", () => {
    const pack = buildCanonicalSourcePack({
      sourcePackId: "pack-1",
      sources: [],
    });

    expect(pack.sources).toEqual([]);
    expect(pack.openGaps).toContain("source_needed");
    expect(pack.reviewState).toBe("review_required");
    expect(pack.reviewRequired).toBe(true);
    expect(pack.autoPublish).toBe(false);
    expect(getCanonicalSourcePackOverallEvidenceState(pack)).toBe(
      "source_needed",
    );
  });

  it("preserves original and translated snippets separately", () => {
    const pack = buildCanonicalSourcePack({
      sourcePackId: "pack-2",
      sources: [
        {
          sourceId: "source-1",
          title: "Kommunalbericht",
          sourceLocale: "tr-TR",
          regionCode: "de-by",
          sourceType: "official",
          reliabilityHint: "primary",
          originalSnippet: "Orijinal alinti",
          translatedSnippet: "Originalzitat übersetzt",
          translationStatus: "translated",
          evidenceState: "supported",
        },
      ],
    });

    expect(pack.sources[0]).toMatchObject({
      sourceLocale: "tr",
      regionCode: "DE-BY",
      originalSnippet: "Orijinal alinti",
      translatedSnippet: "Originalzitat übersetzt",
      translationStatus: "translated",
      evidenceState: "supported",
    });
  });

  it("maps trust-layer states to honest source-pack evidence states", () => {
    expect(resolveCanonicalSourcePackEvidenceState("partially_supported")).toBe(
      "partial",
    );
    expect(resolveCanonicalSourcePackEvidenceState("source_present")).toBe(
      "partial",
    );
    expect(resolveCanonicalSourcePackEvidenceState("translation_uncertain")).toBe(
      "source_needed",
    );
  });

  it("retains review-first defaults for populated packs", () => {
    const pack = buildCanonicalSourcePack({
      sourcePackId: "pack-3",
      sources: [
        {
          sourceId: "source-2",
          title: "Pressebericht",
          sourceType: "media",
          reliabilityHint: "secondary",
          trustState: "context_missing",
        },
      ],
      openGaps: ["Kontext ergänzen", "Kontext ergänzen"],
    });

    expect(pack.reviewState).toBe("review_required");
    expect(pack.reviewRequired).toBe(true);
    expect(pack.autoPublish).toBe(false);
    expect(pack.openGaps).toEqual(["Kontext ergänzen"]);
    expect(getCanonicalSourcePackOverallEvidenceState(pack)).toBe(
      "context_missing",
    );
  });
});
