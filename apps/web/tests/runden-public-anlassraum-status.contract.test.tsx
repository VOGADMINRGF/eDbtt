import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RundenPublicSharingGuide from "@/app/runden/RundenPublicSharingGuide";

describe("runden public anlassraum status contract", () => {
  it("explains Anlassraum as public citizen space with shared status language", () => {
    const html = renderToStaticMarkup(
      <RundenPublicSharingGuide
        featuredAnlassraumId="65f000000000000000000401"
        featuredAnlassraumTitle="Schulwegsicherheit in Reinickendorf"
      />,
    );

    expect(html).toContain("Anlassraum = öffentlicher Gesprächsraum");
    expect(html).toContain("Sichtbar heißt nicht automatisch geprüft oder amtlich.");
    expect(html).toContain("Link und QR gehören nur zu sichtbaren Anlässen.");
    expect(html).toContain("als Vorschlag sichtbar");
    expect(html).toContain("in Prüfung");
    expect(html).toContain("veröffentlicht");
    expect(html).toContain("archiviert");
    expect(html).toContain("blockiert");
    expect(html).toContain("Nur intern sichtbare Beiträge bleiben intern.");
    expect(html).toContain("Keine automatische amtliche Antwort.");
    expect(html).toContain("Keine automatische Dossier- oder Anlassraum-Finalisierung.");
  });
});
