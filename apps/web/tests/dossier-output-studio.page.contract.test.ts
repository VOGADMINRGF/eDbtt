import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

async function renderStudioPage(dossierId = "dossier_demo_mobility_berlin") {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: dossierId }),
  });
  return renderToStaticMarkup(element);
}

describe("/dossier/[id]/studio social distribution workspace", () => {
  it("renders studio hero and master post section", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("eDebatte Studio");
    expect(html).toContain("Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.");
    expect(html).toContain("Dossier bleibt Quelle");
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Noch nicht live veröffentlicht");
    expect(html).toContain("Fertiger Post-Entwurf");
    expect(html).toContain("Beteiligungsfrage");
    expect(html).toContain("Review-Hinweise");
  });

  it("renders channel selection and distribution planning with policy hints", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Veröffentlichungsmodus");
    expect(html).toContain("Verteilung planen");
    expect(html).toContain("Website / Dossier-Post");
    expect(html).toContain("Instagram");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Newsletter");
    expect(html).toContain("QR / Print");
    expect(html).toContain("Nicht verbunden");
    expect(html).toContain("Konfiguration erforderlich");
    expect(html).toContain("Nur Export");
    expect(html).toContain("Nur Export/Kopieren möglich");
    expect(html).toContain("Echtzeit-Veröffentlichung ist aktuell deaktiviert");
    expect(html).toContain("Automatisierung erst nach Admin-Freigabe");
    expect(html).toContain("Verteilplan als Entwurf speichern");
    expect(html).toContain("Verteilplan übernehmen");
    expect(html).toContain("Empfohlener Verteilplan");
    expect(html).toContain("Kanal-Versionen");
    expect(html).toContain("TikTok / Reels / YouTube Shorts");
    expect(html).toContain("Kanäle verbinden");
    expect(html).toContain("Post-Entwurf prüfen");
    expect(html).toContain("Zurück zum Dossier");
    expect(html).toContain("Text kopieren");
    expect(html).toContain("Entwurf speichern");
    expect(html).toContain("Admin: Kanal-Konfiguration &amp; Review-Routing");
    expect(html).toContain("QR-/Print-Vorschau");
  });

  it("keeps publish action non-active and preserves source/review warning", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("Veröffentlichung vorbereiten");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Sichtbar heißt hier nicht automatisch geprüft oder amtlich.");
    expect(html).not.toContain("extern veröffentlicht");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });

  it("blocks silent demo fallback for region draft dossier ids without runtime studio data", async () => {
    const html = await renderStudioPage("dossier-draft-missing-001");

    expect(html).toContain("Für dieses Dossier liegen aktuell keine runtimefähigen Studio-Daten vor.");
    expect(html).toContain("kein `demoDossierForOutputEngine` als Ersatz");
    expect(html).toContain("region draft review only");
    expect(html).not.toContain("Fertiger Post-Entwurf");
    expect(html).not.toContain("Verteilplan übernehmen");
  });
});
