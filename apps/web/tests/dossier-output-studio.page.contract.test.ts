import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

async function renderStudioPage(dossierId = "demo-studio") {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: dossierId }),
  });
  return renderToStaticMarkup(element);
}

describe("/dossier/[id]/studio output package preview", () => {
  it("renders generated OutputPackage with review status and metadata", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("eDebatte Studio · Output Engine");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Preview-Metadaten");
    expect(html).toContain("Paket-ID");
    expect(html).toContain("Dossier-ID");
    expect(html).toContain("dossier-31");
  });

  it("shows backlink/cta, source state and open questions", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Vorschau prüfen");
    expect(html).toContain("Zurück zum Dossier");
    expect(html).toContain('href="https://edebatte.org/dossier/dossier-31"');
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Quelle-Status");
    expect(html).toContain("Offene Fragen &amp; Eingabehinweise");
    expect(html).toContain("Needs-Input Marker");
  });

  it("lists required formats and does not expose publish automation", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Social Carousel");
    expect(html).toContain("Web Article");
    expect(html).toContain("Short Briefing");
    expect(html).toContain("Voiceover Text");
    expect(html).toContain("QR Poster");
    expect(html).toContain("Citizen Letter");
    expect(html).toContain("Administrative Note");
    expect(html).toContain("Mandate Summary");

    expect(html).not.toContain("Veröffentlichen");
    expect(html).not.toContain("Publish");
  });
});
