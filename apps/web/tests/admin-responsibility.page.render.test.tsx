import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import ResponsibilityAdminPage from "@/app/admin/responsibility/page";

describe("admin-responsibility.page.render", () => {
  it("keeps import/export as an explained disabled state instead of a fake CTA", () => {
    const html = renderToStaticMarkup(<ResponsibilityAdminPage />);
    expect(html).toContain("Responsibility Directory");
    expect(html).toContain("Import / Export noch nicht freigegeben");
    expect(html).toContain("CSV-/Batch-Import folgt erst mit eigenem Review- und Audit-Pfad.");
    expect(html).toContain("Betreiber-Modus aktiv");
  });

  it("treats broken directory or path responses as visible errors instead of empty success states", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/app/admin/responsibility/page.tsx"), "utf8");
    expect(source).toContain("if (!dirRes.ok || !dirJson?.ok)");
    expect(source).toContain("if (!pathRes.ok || !pathJson?.ok)");
    expect(source).toContain("Directory konnte nicht geladen werden.");
    expect(source).toContain("Responsibility-Pfade konnten nicht geladen werden.");
  });
});
