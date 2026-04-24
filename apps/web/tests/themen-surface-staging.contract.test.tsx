import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
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
});
