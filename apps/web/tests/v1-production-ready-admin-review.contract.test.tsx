import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminReviewSource = readFileSync(
  resolve(process.cwd(), "src/app/admin/review/page.tsx"),
  "utf8",
);

describe("v1 production ready admin review contract", () => {
  it("keeps the admin review surface on a single review-to-visible path", () => {
    expect(adminReviewSource).toContain("Zentrale Review-Queue");
    expect(adminReviewSource).toContain("Review-to-Visible Journey");
    expect(adminReviewSource).toContain(
      "Aus einem reviewpflichtigen Item werden hier bewusst Dossier oder Anlassraum vorbereitet",
    );
    expect(adminReviewSource).toContain(
      "Sichtbar heißt nicht automatisch amtlich. `public_official` bleibt ausschließlich Official",
    );
  });

  it("keeps operator/admin access explicit instead of silently widening access", () => {
    expect(adminReviewSource).toContain('redirect(`/login?next=${encodeURIComponent("/admin/review")}`);');
    expect(adminReviewSource).toContain('redirect("/account/organization/dashboard");');
    expect(adminReviewSource).toContain("automatische Dossier-/Anlassraum-Finalisierung");
    expect(adminReviewSource).toContain("Social-/CI-Distribution bleibt review-first");
  });
});
