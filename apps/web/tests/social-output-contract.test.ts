import { describe, expect, it } from "vitest";

import {
  buildNeutralCarouselDraft,
  buildShareOutputAsset,
  buildStreamPreparationOutput,
} from "@features/share/socialOutputContract";

describe("social output contract", () => {
  it("keeps non-factcheck assets in standard analysiert contract", () => {
    const asset = buildShareOutputAsset({
      baseUrl: "https://edebatte.org",
      canonicalPathOrUrl: "/dossier/demo-1",
      objectType: "dossier",
      title: "Dossier Innenstadt",
      subtitle: "Kontext und offene Fragen",
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: true,
    });

    expect(asset.verification.lane).toBe("standard");
    expect(asset.verification.verificationMode).toBe("none");
    expect(asset.verification.researchUsed).toBe("none");
    expect(asset.verification.sealGranted).toBe(false);
    expect(asset.verification.verificationLabel).toBe("analysiert");
    expect(asset.verification.verificationLabelDisplay).toBe("Analyse-Entwurf");
    expect(asset.verification.noTruthPromotion).toBe(true);
    expect(asset.verification.noAutoGraphPromotion).toBe(true);
  });

  it("maps sealed factcheck with pending seal to geprueft", () => {
    const asset = buildShareOutputAsset({
      baseUrl: "https://edebatte.org",
      canonicalPathOrUrl: "/factcheck/job_1",
      objectType: "factcheck",
      title: "Factcheck Job",
      status: "queued",
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      researchUsed: "search",
      sealEligible: true,
      sealGranted: false,
    });

    expect(asset.verification.verificationLabel).toBe("analysiert");
    expect(asset.verification.verificationLabelDisplay).toBe("Quellenprüfung angefragt");
    expect(asset.verification.sealGranted).toBe(false);
  });

  it("maps sealed factcheck with granted seal to verifiziert", () => {
    const asset = buildShareOutputAsset({
      baseUrl: "https://edebatte.org",
      canonicalPathOrUrl: "/factcheck/job_2",
      objectType: "factcheck",
      title: "Factcheck Abschluss",
      lane: "sealed_factcheck",
      verificationMode: "sealed",
      researchUsed: "deep_search",
      sealEligible: true,
      sealGranted: true,
    });

    expect(asset.verification.verificationLabel).toBe("verifiziert");
    expect(asset.verification.verificationLabelDisplay).toBe("Verifiziert");
    expect(asset.verification.sealGranted).toBe(true);
  });

  it("builds a bounded neutral carousel draft", () => {
    const asset = buildShareOutputAsset({
      baseUrl: "https://edebatte.org",
      canonicalPathOrUrl: "/companion/demo",
      objectType: "companion",
      title: "Companion Demo",
      subtitle: "Begleitdialog zum Thema",
    });

    const slides = buildNeutralCarouselDraft(asset, {
      highlights: ["Ein längerer Hinweis mit Kontext", "Zweiter Hinweis", "Dritter Hinweis"],
    });

    expect(slides.length).toBe(3);
    expect(slides[0]?.id).toBe("context");
    expect(slides[2]?.id).toBe("status");
  });

  it("builds stream preparation with safe placeholders when missing content", () => {
    const output = buildStreamPreparationOutput({
      title: "Stream A",
      highlights: [],
      transcriptSnippets: [],
      quoteCandidate: "",
    });

    expect(output.highlightBullets.length).toBeGreaterThan(0);
    expect(output.transcriptSnippetPlaceholders.length).toBeGreaterThan(0);
    expect(output.quoteCandidate).toBeNull();
  });
});
