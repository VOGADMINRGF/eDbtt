import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readAppFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "src/app", relativePath), "utf8");
}

describe("v1 production ready critical journeys contract", () => {
  it("keeps the public create handoff connected to swipes, runden and dossier", () => {
    const createSource = readAppFile("create/CreateClient.tsx");

    expect(createSource).toContain('triggerActionNotice("Beteiligung vorbereiten: als nächstes in Swipes weiterführen.");');
    expect(createSource).toContain('triggerActionNotice("Beteiligungsrunde vorbereiten: als nächstes in /runden weiterführen.");');
    expect(createSource).toContain('ctaHref: "/dossier"');
    expect(createSource).toContain('ctaHref: "/swipes"');
    expect(createSource).toContain("Keine automatische Veröffentlichung.");
  });

  it("keeps feed, review and social follow-up on the existing operator paths", () => {
    const adminFeedsSource = readAppFile("admin/feeds/page.tsx");
    const adminReviewSource = readAppFile("admin/review/page.tsx");
    const socialReviewSource = readAppFile("atlas/social-review/SocialReviewQueueClient.tsx");

    expect(adminFeedsSource).toContain('/api/admin/feeds/runtime');
    expect(adminFeedsSource).toContain('/api/feeds/pull');
    expect(adminFeedsSource).toContain('/api/feeds/analyze-pending');
    expect(adminReviewSource).toContain("Review-to-Visible Journey");
    expect(adminReviewSource).toContain("/account/organization/dashboard");
    expect(socialReviewSource).toContain("Abgeleitete V1-Queue");
    expect(socialReviewSource).toContain("/runden");
  });

  it("keeps stream, dossier studio and org dashboard connected to the same review-first runtime", () => {
    const streamSource = readAppFile("stream/page.tsx");
    const studioSource = readAppFile("dossier/[id]/studio/page.tsx");
    const dashboardSource = readAppFile("account/organization/dashboard/page.tsx");

    expect(streamSource).toContain("reviewpflichtigen Beteiligungspfad");
    expect(streamSource).toContain("Zum Anlassraum");
    expect(studioSource).toContain("nicht automatisch geprüft oder amtlich");
    expect(dashboardSource).toContain("Meine Review-Aufgaben");
    expect(dashboardSource).toContain("`/admin/review` bleibt die globale Betreiber-Arbeitsliste.");
  });
});
