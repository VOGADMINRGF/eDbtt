import { describe, expect, it } from "vitest";

import {
  OutputPackageSchema,
  demoDossierForOutputEngine,
  generateOutputPackage,
  generateSocialCarouselOutput,
  type MinimalDossierInput,
} from "@features/outputEngine";

describe("output engine social carousel", () => {
  it("creates 5-7 slides from demo dossier", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });

    const carousel = generateSocialCarouselOutput(pkg);

    expect(carousel.slides.length).toBeGreaterThanOrEqual(5);
    expect(carousel.slides.length).toBeLessThanOrEqual(7);
    expect(carousel.slideCount).toBe(carousel.slides.length);
    expect(carousel.slides.map((slide) => slide.id)).toEqual(
      carousel.slides.map((_, index) => `slide_${index + 1}`),
    );
  });

  it("starts with a strong question/headline slide", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);
    const first = carousel.slides[0];

    expect(first?.kind).toBe("headline");
    expect(first?.title).toContain("?");
    expect(first?.eyebrow).toBe("Öffentliche Frage");
  });

  it("contains documented/disputed/options/cta structure", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    const kinds = carousel.slides.map((slide) => slide.kind);
    expect(kinds).toContain("documented");
    expect(kinds).toContain("disputed");
    expect(kinds).toContain("options");
    expect(kinds).toContain("cta");

    const ctaSlide = carousel.slides.find((slide) => slide.kind === "cta");
    expect(ctaSlide?.cta?.label).toBe("Prüfen, ergänzen, abstimmen");
    expect(carousel.slides[2]?.title).toBe("Was ist belegt?");
    expect(carousel.slides[3]?.title).toBe("Was ist offen?");
    expect(carousel.slides[4]?.title).toBe("Welche Optionen gibt es?");
  });

  it("surfaces review warning when sources are missing", () => {
    const dossier: MinimalDossierInput = {
      ...demoDossierForOutputEngine,
      sources: [],
    };
    const pkg = generateOutputPackage(dossier, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    const documentedSlide = carousel.slides.find((slide) => slide.kind === "documented");
    expect(pkg.sourceState.status).toBe("missing");
    expect(documentedSlide?.reviewWarning).toContain("Review erforderlich");
  });

  it("surfaces review warning when options are missing", () => {
    const dossier: MinimalDossierInput = {
      ...demoDossierForOutputEngine,
      options: [],
    };
    const pkg = generateOutputPackage(dossier, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    const optionsSlide = carousel.slides.find((slide) => slide.kind === "options");
    expect(optionsSlide?.reviewWarning).toContain("Review erforderlich");
  });

  it("keeps dossier backlink on all slides", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    expect(carousel.slides.every((slide) => slide.backlinkTarget === pkg.dossierBacklinkTarget)).toBe(true);
  });

  it("has no publish/export/social-api behavior", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    expect(OutputPackageSchema.safeParse(pkg).success).toBe(true);

    const carousel = generateSocialCarouselOutput(pkg);
    expect(carousel.autoPublish).toBe(false);
    expect(carousel.canAutoPublish).toBe(false);
    expect(carousel.externalApisUsed).toBe(false);
    expect(carousel.trackingEnabled).toBe(false);
    expect(carousel.publicationStatus).toBe("draft_review_required");
    expect(carousel.automationHint).toContain("Automatisierung");
    expect(carousel.reviewStatus).not.toBe("published");
  });

  it("exposes typed variant metadata for later export paths", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    expect(carousel.defaultVariant).toBe("square");
    expect(carousel.variants.map((entry) => entry.variant)).toEqual([
      "square",
      "story",
      "linkedin",
      "print_preview",
    ]);
  });

  it("provides deterministic posting metadata for demo guidance", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    expect(carousel.suggestedPostingWindows).toEqual([
      "Mo-Fr 07:30-09:00",
      "Mo-Do 12:00-13:30",
      "Di-Do 18:00-20:00",
    ]);
    expect(carousel.suggestedHashtags).toContain("#eDebatte");
    expect(carousel.suggestedHashtags).toContain("#Beteiligung");
    expect(carousel.suggestedPostText.length).toBeGreaterThan(20);
    expect(carousel.suggestedChannelFit.length).toBeGreaterThan(0);
    expect(carousel.participationQuestion).toContain("Wie");
    expect(carousel.motifHint).toContain("Verlauf");
  });

  it("uses regional fallback phrasing when no location is found", () => {
    const dossier: MinimalDossierInput = {
      ...demoDossierForOutputEngine,
      title: "Diskussion über Mobilität und Stadtgestaltung",
      summary:
        "Das Dossier beschreibt eine kommunale Debatte mit mehreren Optionen und offenen Fragen.",
      sources: [
        {
          id: "source_local_1",
          title: "Kommunalbericht 2026",
          url: "https://example.org/kommunalbericht-2026",
        },
      ],
    };
    const pkg = generateOutputPackage(dossier, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });
    const carousel = generateSocialCarouselOutput(pkg);

    expect(carousel.regionalContext).toBe("in Ihrer Region");
    expect(carousel.participationQuestion).toContain("vor Ort");
  });
});
