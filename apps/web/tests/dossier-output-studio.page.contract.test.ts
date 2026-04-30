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
  it("renders context summary and master-post-first workflow", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("eDebatte Studio");
    expect(html).toContain("Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.");
    expect(html).toContain("Für Beteiligungsbüros, Moderations- und Dialogprofis");
    expect(html).toContain("Dossier bleibt Quelle");
    expect(html).toContain("Noch nicht live veröffentlicht");
    expect(html).toContain("Dossier-Kontext");
    expect(html).toContain("Fertiger Beitrag");
    expect(html).toContain("Dossier-Post als primäres Veröffentlichungsobjekt.");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Mobilitätswende in Berliner Bezirken");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Offene Fragen");
    expect(html).toContain("Eventualitäten / Optionen");
    expect(html).toContain("Beteiligungsfrage");
    expect(html).toContain("Prüfen, ergänzen, abstimmen.");
    expect(html).toContain("#eDebatte");
    expect(html).toContain("dossier-31");
    expect(html).toContain("Hauptaktionen");
    expect(html).toContain("Bearbeiten");
    expect(html).toContain("Kopieren");
    expect(html).toContain("Als Entwurf speichern");
    expect(html).toContain("Review anfordern");
    expect(html).toContain("Zeitpunkt planen");
    expect(html).toContain("Veröffentlichung vorbereiten");
  });

  it("shows collapsed dossier quality panel with source and open-question hints", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Dossier-Qualität &amp; Hinweise");
    expect(html).toContain("Zurück zum Dossier");
    expect(html).toContain('href="https://edebatte.org/dossier/dossier-31"');
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Quelle-Status");
    expect(html).toContain("Offene Fragen &amp; Eingabehinweise");
    expect(html).toContain("Eingabehinweise");
  });

  it("renders channel selection, connection status, publish mode and versions without fake live publishing", async () => {
    const html = await renderStudioPage("dossier-31");

    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Veröffentlichungsmodus");
    expect(html).toContain("Kanal-Versionen");
    expect(html).toContain("Empfohlener Verteilplan");
    expect(html).toContain("Website / Dossier-Post");
    expect(html).toContain("TikTok / Reels / YouTube Shorts");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Facebook");
    expect(html).toContain("X / Mastodon / Bluesky");
    expect(html).toContain("Newsletter");
    expect(html).toContain("QR / Print");
    expect(html).toContain("Nächstes Zeitfenster");
    expect(html).toContain("Plan übernehmen");
    expect(html).toContain("Verteilplan als Entwurf speichern");
    expect(html).toContain("Noch nicht live veröffentlicht");
    expect(
      html.includes("Kanal nicht verbunden") ||
        html.includes("Konfiguration erforderlich") ||
        html.includes("Nur Export/Kopieren möglich"),
    ).toBe(true);
    expect(html).toContain("Nur Export/Kopieren möglich");
    expect(html).toContain("Konfiguration erforderlich");
    expect(html).toContain("Dossier bleibt Quelle");

    const postIndex = html.indexOf("Fertiger Beitrag");
    const versionsIndex = html.indexOf(">Kanal-Versionen<");
    expect(postIndex).toBeGreaterThan(-1);
    expect(versionsIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeLessThan(versionsIndex);

    expect(html).not.toContain("extern veröffentlicht");
    expect(html).not.toContain(">Veröffentlichen<");
    expect(html).not.toContain(">Publish<");
  });
});
