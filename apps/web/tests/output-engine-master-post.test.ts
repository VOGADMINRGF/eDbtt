import { describe, expect, it } from "vitest";
import {
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
} from "@features/outputEngine";

describe("output engine master post", () => {
  it("generates master post from demo dossier output package", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });

    const masterPost = generateMasterPost(pkg);

    expect(masterPost.dossierId).toBe(pkg.dossierId);
    expect(masterPost.packageId).toBe(pkg.packageId);
    expect(masterPost.title).toBe(pkg.title);
    expect(masterPost.overallPicture.length).toBeGreaterThan(20);
    expect(masterPost.sourceSituation.length).toBeGreaterThan(10);
    expect(masterPost.openQuestions.length).toBeGreaterThan(0);
    expect(masterPost.options.length).toBeGreaterThan(0);
    expect(masterPost.body.length).toBeGreaterThan(30);
    expect(masterPost.cta).toContain("Prüfen, ergänzen, abstimmen");
  });

  it("includes participation question and backlink", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });

    const masterPost = generateMasterPost(pkg);

    expect(masterPost.participationQuestion).toContain("?");
    expect(masterPost.backlinkTarget).toBe(pkg.dossierBacklinkTarget);
    expect(masterPost.qrTarget).toBe(pkg.qrCodeTarget.target);
  });

  it("keeps publishing guardrails disabled by default", () => {
    const pkg = generateOutputPackage(demoDossierForOutputEngine, {
      generatedAt: "2026-04-30T09:00:00.000Z",
      baseUrl: "https://edebatte.org",
    });

    const masterPost = generateMasterPost(pkg);

    expect(masterPost.canAutoPublish).toBe(false);
    expect(masterPost.canRealtimePublish).toBe(false);
    expect(masterPost.externalApisUsed).toBe(false);
    expect(masterPost.publicationStatus).toBe("draft_review_required");
  });

  it("preserves source and review warnings from package state", () => {
    const pkg = generateOutputPackage(
      {
        ...demoDossierForOutputEngine,
        sources: [],
      },
      {
        generatedAt: "2026-04-30T09:00:00.000Z",
        baseUrl: "https://edebatte.org",
      },
    );

    const masterPost = generateMasterPost(pkg);

    expect(masterPost.sourceState.status).toBe("missing");
    expect(masterPost.reviewGuardrails.some((entry) => entry.id === "source_missing")).toBe(true);
  });

  it("marks missing options as review warning without inventing option facts", () => {
    const pkg = generateOutputPackage(
      {
        ...demoDossierForOutputEngine,
        options: [],
      },
      {
        generatedAt: "2026-04-30T09:00:00.000Z",
        baseUrl: "https://edebatte.org",
      },
    );

    const masterPost = generateMasterPost(pkg);
    expect(masterPost.reviewGuardrails.some((entry) => entry.id === "options_missing")).toBe(true);
    expect(masterPost.options[0]).toContain("noch zu ergänzen");
  });
});
