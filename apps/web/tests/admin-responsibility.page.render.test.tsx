import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import ResponsibilityAdminPage from "@/app/admin/responsibility/page";

describe("admin-responsibility.page.render", () => {
  it("keeps import/export as an explained disabled state instead of a fake CTA", () => {
    const html = renderToStaticMarkup(<ResponsibilityAdminPage />);
    expect(html).toContain("Responsibility Directory");
    expect(html).toContain("Import / Export noch nicht freigegeben");
    expect(html).toContain("CSV-/Batch-Import folgt erst mit eigenem Review- und Audit-Pfad.");
  });
});
