import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RundenDemoPage from "@/app/runden/demo/page";

describe("/runden/demo page contract", () => {
  it("renders the Anlassraum 3-step explanation and CTA set", () => {
    const html = renderToStaticMarkup(<RundenDemoPage />);

    expect(html).toContain("Aus einzelnen Beiträgen wird ein gemeinsamer Arbeitsstand");
    expect(html).toContain("Anlass öffnen");
    expect(html).toContain("QR oder Link teilen");
    expect(html).toContain("Beiträge fließen geordnet ein");
    expect(html).toContain("Aus dem Anlassraum wird:");
    expect(html).toContain("Warum das hilfreich ist");
    expect(html).toContain("Teilnahmelogik verstehen");
    expect(html).toContain('href="/create?mode=source"');
    expect(html).toContain('href="/runden/demo#teilnahmelogik"');
  });
});
