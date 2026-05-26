import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

describe("dossier studio social queue contract", () => {
  it("shows queue, export and scheduling readiness without live-publish claims", async () => {
    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Queue &amp; nächste Schritte");
    expect(html).toContain("JSON-Export kopieren");
    expect(html).toContain("In Queue setzen");
    expect(html).toContain("Als Planung bereit markieren");
    expect(html).toContain("Als kopiert markieren");
    expect(html).toContain("CI-Ausgaben");
    expect(html).not.toContain("Live posten");
    expect(html).not.toContain("OAuth");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
