import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RundenPublicSharingGuide from "@/app/runden/RundenPublicSharingGuide";

describe("runden public sharing guide contract", () => {
  it("explains public Anlassraum sharing, review guardrails and direct public input kinds", () => {
    const html = renderToStaticMarkup(
      <RundenPublicSharingGuide
        featuredAnlassraumId="65f000000000000000000401"
        featuredAnlassraumTitle="Schulwegsicherheit in Reinickendorf"
      />,
    );

    expect(html).toContain("Anlassraum = öffentlicher Gesprächsraum");
    expect(html).toContain("Hier sammeln wir Fragen, Perspektiven, Quellen, Optionen und Hinweise");
    expect(html).toContain("Sichtbar heißt nicht automatisch geprüft oder amtlich.");
    expect(html).toContain("Dossier/Faktenstatus bleibt in Prüfung.");
    expect(html).toContain("Amtliche Antworten nur durch verifizierte Rollen.");
    expect(html).toContain("Öffentlich lesbare Debattenstände bleiben frei zugänglich.");
    expect(html).toContain("Personalisierung blendet weder starke Gegenargumente noch Quellen- oder Evidenzgrenzen aus.");
    expect(html).toContain("Ein B2G-Cockpit ändert nichts an der freien öffentlichen Lesbarkeit");
    expect(html).toContain(
      "Read-only Lesen, Teilen und QR für bereits sichtbare öffentliche Stände verbrauchen keinen GOV-light-Slot",
    );
    expect(html).toContain(
      "Im öffentlichen Anlassraum erklärt Voxy Status, Sichtbarkeit und nächste Schritte",
    );
    expect(html).toContain("Teile diesen Anlassraum mit Nachbarn, Freunden oder deiner Initiative.");
    expect(html).toContain("Nutze den QR-Code für Bürgerdialoge, Veranstaltungen oder Workshops.");
    expect(html).toContain("Link und QR gehören nur zu sichtbaren Anlässen.");
    expect(html).toContain("Für Veranstaltungen nutzen");
    expect(html).toContain("Für Artikel oder Berichte nutzen");
    expect(html).toContain("Frage");
    expect(html).toContain("Quelle");
    expect(html).toContain("Perspektive");
    expect(html).toContain("Option");
    expect(html).toContain("Hinweis");
    expect(html).toContain("Direkt öffentlich einreichen");
    expect(html).toContain("Schulwegsicherheit in Reinickendorf");
    expect(html).toContain("Öffentliche Eingaben sind keine repräsentative Abstimmung.");
    expect(html).toContain("als Vorschlag sichtbar");
    expect(html).toContain("in Prüfung");
    expect(html).toContain("veröffentlicht");
    expect(html).toContain("amtlich");
    expect(html).toContain("archiviert");
    expect(html).toContain("Nur intern sichtbare Beiträge bleiben intern.");
    expect(html).toContain("Pausiert, archiviert und geschlossen");
    expect(html).toContain("Keine automatische amtliche Antwort.");
    expect(html).toContain("Keine automatische Dossier- oder Anlassraum-Finalisierung.");
    expect(html).toContain("Beitrag mit Assistenz vorbereiten");
    expect(html).toContain("Mit Assistent chatten");
    expect(html).toContain("Chat öffnen");
    expect(html).toContain("Fragen? Ich helfe gern.");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("data-voxy-floating-dock");
  });
});
