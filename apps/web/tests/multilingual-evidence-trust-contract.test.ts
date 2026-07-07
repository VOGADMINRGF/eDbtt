import { describe, expect, it } from "vitest";

import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildMultilingualEvidenceTrustRecord } from "@/features/create/multilingualEvidenceTrustContract";

describe("multilingual evidence trust contract", () => {
  it("keeps original sources readable in another locale without inventing evidence", () => {
    const record = buildMultilingualEvidenceTrustRecord({
      userLocale: "de",
      readingLocale: "de",
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-1",
        sources: [
          {
            sourceId: "s-1",
            title: "Source",
            sourceLocale: "en",
            originalSnippet: "Original",
            translatedSnippet: "Uebersetzt",
            translationStatus: "translated",
            evidenceState: "supported",
          },
        ],
      }),
    });

    expect(record.entries[0]?.sourceLocale).toBe("en");
    expect(record.entries[0]?.translatedEvidence).toBe("Uebersetzt");
    expect(record.overallTrustStatus).toBe("supported");
  });

  it("marks uncertain translation and context gaps explicitly", () => {
    const record = buildMultilingualEvidenceTrustRecord({
      sourcePack: buildCanonicalSourcePack({
        sourcePackId: "sp-2",
        sources: [
          {
            sourceId: "s-2",
            title: "Source",
            sourceLocale: "ar",
            translationStatus: "uncertain",
            evidenceState: "context_missing",
          },
        ],
      }),
    });

    expect(record.entries[0]?.trustStatus).toBe("translation_uncertain");
    expect(record.overallUncertaintyReasons).toContain("translation_uncertain");
  });
});
