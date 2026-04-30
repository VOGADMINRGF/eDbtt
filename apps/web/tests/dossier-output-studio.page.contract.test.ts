import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

async function renderStudioPage(dossierId = "demo-studio") {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: dossierId }),
  });
  return renderToStaticMarkup(element);
}

describe("/dossier/[id]/studio social distribution workspace", () => {
  it("renders studio hero and master post section", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("eDebatte Studio");
    expect(html).toContain("Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.");
    expect(html).toContain("Dossier bleibt Quelle");
    expect(html).toContain("Noch nicht live veröffentlicht");
    expect(html).toContain("Fertiger Post-Entwurf");
    expect(html).toContain("Beteiligungsfrage");
    expect(html).toContain("Review-Hinweise");
  });

  it("renders channel selection and distribution planning with policy hints", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Veröffentlichungsmodus");
    expect(html).toContain("Verteilung planen");
    expect(html).toContain("Website / Dossier-Post");
    expect(html).toContain("Instagram");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Newsletter");
    expect(html).toContain("QR / Print");
    expect(html).toContain("Nur Export/Kopieren möglich");
    expect(html).toContain("Echtzeit-Veröffentlichung ist aktuell deaktiviert");
    expect(html).toContain("Automatisierung erst nach Admin-Freigabe");
    expect(html).toContain("Plan speichern");
    expect(html).toContain("Kanäle verbinden");
    expect(html).toContain("Post-Entwurf prüfen");
    expect(html).toContain("Zurück zum Dossier");
  });

  it("keeps publish action non-active and preserves source/review warning", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Veröffentlichen (deaktiviert – nur Vorbereitung)");
    expect(html).toContain("disabled");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Review erforderlich");
    expect(html).not.toContain("extern veröffentlicht");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
