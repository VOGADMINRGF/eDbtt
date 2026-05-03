import { describe, expect, it } from "vitest";
import {
  buildCopyText,
  buildDistributionPlan,
  buildDraftRecord,
  buildQrPrintPreview,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  validateDistributionExport,
} from "@features/outputEngine";

function fixture() {
  const pkg = generateOutputPackage(demoDossierForOutputEngine, {
    generatedAt: "2026-05-03T09:00:00.000Z",
    baseUrl: "https://edebatte.org",
  });
  const masterPost = generateMasterPost(pkg);
  const carousel = generateSocialCarouselOutput(pkg);
  const plan = buildSocialDistributionPlan(masterPost, carousel);
  return { pkg, masterPost, plan };
}

describe("output engine export/distribution helpers", () => {
  it("keeps copy/export text deterministic and dossier-bound", () => {
    const { masterPost } = fixture();
    const text = buildCopyText(masterPost);

    expect(text).toContain(masterPost.title);
    expect(text).toContain(masterPost.cta);
    expect(text).toContain(masterPost.backlinkTarget);
    expect(text).toContain(masterPost.qrTarget);
  });

  it("creates draft and planned records without external publish", () => {
    const { plan } = fixture();
    const draft = buildDraftRecord({
      plan,
      selectedChannels: ["website_embed", "linkedin"],
      reviewRequired: true,
    });
    const planned = buildDistributionPlan({
      plan,
      selectedChannels: ["website_embed", "linkedin"],
      scheduleMode: "suggested_window",
      reviewRequired: true,
    });

    expect(draft.externalPublish).toBe(false);
    expect(planned.externalPublish).toBe(false);
    expect(draft.queue.length).toBeGreaterThan(0);
    expect(planned.queue.length).toBeGreaterThan(0);
  });

  it("enforces qr/backlink/cta requirements for print preview", () => {
    const { masterPost } = fixture();
    const preview = buildQrPrintPreview(masterPost);
    const validation = validateDistributionExport(masterPost);

    expect(preview.cta.length).toBeGreaterThan(0);
    expect(preview.dossierBacklink).toBe(masterPost.backlinkTarget);
    expect(preview.qrTarget).toBe(masterPost.qrTarget);
    expect(preview.reviewStatus).toBe("review_required");
    expect(validation.errors).toEqual([]);
  });
});
