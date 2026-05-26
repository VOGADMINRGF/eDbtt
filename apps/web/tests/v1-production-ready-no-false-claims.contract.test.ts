import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRoute(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "src/app", relativePath), "utf8");
}

describe("v1 production ready no false claims contract", () => {
  it("does not introduce positive claims for auto publish, fake connectors or automatic official release", () => {
    const source = [
      readRoute("create/CreateClient.tsx"),
      readRoute("runden/page.tsx"),
      readRoute("dossier/[id]/ui.tsx"),
      readRoute("stream/page.tsx"),
      readRoute("stream/[slug]/page.tsx"),
      readRoute("pricing/page.tsx"),
      readRoute("pricing/institutionen/page.tsx"),
      readRoute("admin/review/page.tsx"),
      readRoute("atlas/social-review/SocialReviewQueueClient.tsx"),
      readRoute("dossier/[id]/studio/page.tsx"),
      readRoute("account/organization/dashboard/page.tsx"),
    ].join("\n");

    [
      "auf allen Kanälen veröffentlicht",
      "Live-Posting aktiv",
      "OAuth verbunden",
      "automatische Kanalveröffentlichung",
      "vollautomatisch veröffentlicht",
      "automatisch amtlich freigegeben",
      "automatisch als Faktencheck-Siegel freigegeben",
    ].forEach((forbidden) => {
      expect(source).not.toContain(forbidden);
    });
  });

  it("keeps explicit review-first guardrails visible on the same surfaces", () => {
    const adminReview = readRoute("admin/review/page.tsx");
    const socialReview = readRoute("atlas/social-review/SocialReviewQueueClient.tsx");
    const streamSlug = readRoute("stream/[slug]/page.tsx");

    expect(adminReview).toContain("Keine Sammelentscheidung, kein Auto-Publish");
    expect(adminReview).toContain("Sichtbar heißt nicht automatisch amtlich");
    expect(socialReview).toContain("Keine externe Veröffentlichung und keine Fake-Connectoren.");
    expect(streamSlug).toContain("Beiträge gehen reviewpflichtig ein.");
    expect(streamSlug).toContain("Nichts wird aus dem");
  });
});
