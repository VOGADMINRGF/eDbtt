import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ThemenPage from "@/app/themen/page";

describe("themen surface staging", () => {
  it("stages topics into aktuell, geplant and archiv with operational CTAs", () => {
    const html = renderToStaticMarkup(<ThemenPage />);

    expect(html).toContain("Finde, wo dein Beitrag anknüpft.");
    expect(html).toContain("Aktuell");
    expect(html).toContain("Geplant");
    expect(html).toContain("Archiv");
    expect(html).toContain("Aktiv dabei");
    expect(html).toContain("Beitrag mit Assistenz einordnen");
    expect(html).toContain("Abstimmungsfähigkeit prüfen");
    expect(html).toContain("Mit Assistent chatten");
    expect(html).toContain("Chat öffnen");
    expect(html).toContain("Fragen? Ich helfe gern.");
    expect(html).toContain("data-voxy-floating-dock");
    expect(html).toContain("Bezahlbare Energie und belastbare Wärmewende in Berlin");
  });

  it("keeps a draft-aware themes assistant ready for start handoffs", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/themen/ThemenStartDraftAssistant.tsx"),
      "utf8",
    );

    expect(source).toContain("GlobalDraftStatusBar");
    expect(source).toContain("Aus dem Voxy-Entwurf übernommen.");
    expect(source).toContain("Wir prüfen, ob dein Entwurf an bestehende Debatten anschließt. Nichts wird automatisch zusammengeführt oder aufgeteilt.");
    expect(source).toContain("Anschluss prüfen");
    expect(source).toContain("Als eigenes Thema weiterführen");
    expect(source).not.toContain("autoPublish");
    expect(source).not.toContain("DeepSearch");
  });
});
