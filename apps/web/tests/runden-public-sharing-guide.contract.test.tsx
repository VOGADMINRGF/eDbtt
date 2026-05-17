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
    expect(html).toContain("Dossier/Faktenstatus bleibt reviewpflichtig.");
    expect(html).toContain("Amtliche Antworten nur durch verifizierte Rollen.");
    expect(html).toContain("Teile diesen Anlassraum mit Nachbarn, Freunden oder deiner Initiative.");
    expect(html).toContain("Nutze den QR-Code für Bürgerdialoge, Veranstaltungen oder Workshops.");
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
    expect(html).toContain("ungeprüfter öffentlicher Hinweis");
    expect(html).toContain("reviewpflichtig");
    expect(html).toContain("geprüft");
    expect(html).toContain("amtlich freigegeben");
    expect(html).toContain("Keine automatische amtliche Antwort.");
    expect(html).toContain("Keine automatische Dossier- oder Anlassraum-Finalisierung.");
  });
});
