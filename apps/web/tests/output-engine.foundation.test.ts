import { describe, expect, it } from "vitest";

import {
  OUTPUT_FORMATS,
  OutputPackageSchema,
  demoDossierForOutputEngine,
  generateOutputPackage,
  type MinimalDossierInput,
  type OutputFormat,
} from "@features/outputEngine";

describe("output engine foundation", () => {
  it("creates a valid OutputPackage for the demo dossier", () => {
    const output = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-29T10:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });

    expect(OutputPackageSchema.safeParse(output).success).toBe(true);
    expect(output.dossierId).toBe(demoDossierForOutputEngine.id);
    expect(output.generatedAt).toBe("2026-04-29T10:00:00.000Z");
    expect(output.reviewStatus).toBe("draft");
    expect(output.autoPublish).toBe(false);
  });

  it("marks missing sources as needs_review and needs_input", () => {
    const dossier: MinimalDossierInput = {
      ...demoDossierForOutputEngine,
      sources: [],
    };

    const output = generateOutputPackage(dossier, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });

    expect(output.reviewStatus).toBe("needs_review");
    expect(output.completenessStatus).toBe("needs_input");
    expect(output.needsInputMarkers).toContain("sources_missing");
    expect(output.sourceState.status).toBe("missing");
  });

  it("marks missing options as needs_review and needs_input", () => {
    const dossier: MinimalDossierInput = {
      ...demoDossierForOutputEngine,
      options: [],
    };

    const output = generateOutputPackage(dossier, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });

    expect(output.reviewStatus).toBe("needs_review");
    expect(output.completenessStatus).toBe("needs_input");
    expect(output.needsInputMarkers).toContain("decision_options_missing");
  });

  it("schema rejects packages without dossierId/backlink/CTA/sourceState", () => {
    const parsed = OutputPackageSchema.safeParse({
      packageId: "outpkg_1",
      generatedAt: "2026-04-29T10:00:00.000Z",
      reviewStatus: "draft",
      completenessStatus: "complete",
      audience: "general_public",
      title: "Missing required package fields",
      shortSummary: "test",
      structuredSummary: ["test"],
      sourceTraces: [],
      openQuestions: [],
      options: [],
      needsInputMarkers: [],
      qrCodeTarget: {
        type: "dossier",
        label: "Dossier",
        target: "/dossier/demo",
      },
      distributionOutputs: [],
      autoPublish: false,
    });

    expect(parsed.success).toBe(false);
    const issuePaths = !parsed.success ? parsed.error.issues.map((issue) => issue.path.join(".")) : [];
    expect(issuePaths).toContain("dossierId");
    expect(issuePaths).toContain("cta");
    expect(issuePaths).toContain("dossierBacklinkTarget");
    expect(issuePaths).toContain("sourceState");
  });

  it("never defaults review status to published", () => {
    const output = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });

    expect(output.reviewStatus === "published").toBe(false);
    expect(["draft", "needs_review"]).toContain(output.reviewStatus);
  });

  it("keeps supported formats typed and available", () => {
    const expected: OutputFormat[] = [
      "web_article",
      "short_briefing",
      "social_carousel",
      "reel_script",
      "voiceover_text",
      "podcast_script",
      "qr_poster",
      "citizen_letter",
      "administrative_note",
      "mandate_summary",
    ];

    expect(OUTPUT_FORMATS).toEqual(expected);

    const output = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });
    expect(output.distributionOutputs.map((entry) => entry.format)).toEqual(expected);
  });

  it("keeps uncertainties and open questions visible", () => {
    const output = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });

    expect(output.openQuestions.length).toBeGreaterThan(0);
    expect(output.structuredSummary.some((line) => line.toLowerCase().includes("status:"))).toBe(true);
    expect(output.distributionOutputs.every((entry) => entry.openQuestions.length > 0)).toBe(true);
  });

  it("keeps auto-publish disabled", () => {
    const output = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-29T10:00:00.000Z",
    });

    expect(output.autoPublish).toBe(false);
    expect(output.reviewStatus).not.toBe("published");
  });
});
