import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ThemenPage from "@/app/themen/page";

describe("themen surface staging", () => {
  it("stages topics into aktuell, geplant and archiv with operational CTAs", () => {
    const html = renderToStaticMarkup(<ThemenPage />);

    expect(html).toContain("Themen als Dachfläche");
    expect(html).toContain("Aktuell");
    expect(html).toContain("Geplant");
    expect(html).toContain("Archiv");
    expect(html).toContain("Anlass starten");
    expect(html).toContain("Beitrag vorbereiten");
    expect(html).toContain("Abstimmungsfähigkeit prüfen");
    expect(html).toContain("Bezahlbare Energie und belastbare Wärmewende in Berlin");
  });

  it("keeps a draft-aware themes assistant ready for start handoffs", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/themen/ThemenStartDraftAssistant.tsx"),
      "utf8",
    );

    expect(source).toContain("GlobalDraftStatusBar");
    expect(source).toContain("Aus Analyse-Entwurf übernommen.");
    expect(source).toContain("Wir suchen Themen, an die dein Beitrag anknüpfen könnte. Nichts wird automatisch zusammengeführt.");
    expect(source).toContain("Passende Themen anzeigen");
    expect(source).toContain("Als neues Thema vorschlagen");
    expect(source).not.toContain("autoPublish");
    expect(source).not.toContain("DeepSearch");
  });
});
