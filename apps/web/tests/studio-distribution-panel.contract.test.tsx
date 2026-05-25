import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

async function renderStudio() {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
  });
  return renderToStaticMarkup(element);
}

describe("studio distribution panel contract", () => {
  it("keeps review-first planning sections and no live-publish controls", async () => {
    const html = await renderStudio();

    expect(html).toContain("Fertiger Post-Entwurf");
    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Verteilung planen");
    expect(html).toContain("Admin: Kanal-Konfiguration &amp; Review-Routing");
    expect(html).toContain("QR-/Print-Vorschau");
    expect(html).toContain("Text kopieren");
    expect(html).toContain("Entwurf erstellen");
    expect(html).toContain("Verteilung vorbereiten");
    expect(html).toContain("LocalStorage-Arbeitsstände bleiben lokal im Browser");
    expect(html).toContain("Browser-Arbeitsstände werden nur lokal gespeichert.");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Live posten");
  });
});
