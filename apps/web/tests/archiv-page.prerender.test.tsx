import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ArchivPage from "@/app/archiv/page";

describe("/archiv prerender", () => {
  it("renders the static archive surface without runtime data dependencies", () => {
    const html = renderToStaticMarkup(<ArchivPage />);

    expect(html).toContain("Nachvollziehbare Entscheidungen – dauerhaft archiviert");
    expect(html).toContain("Dossiers &amp; Faktencheck");
    expect(html).toContain("Statements &amp; Themen");
    expect(html).toContain("Abstimmungen &amp; Ergebnisse");
    expect(html).toContain("Was ins Archiv kommt");
    expect(html).toContain("Reports für Organisationen");
    expect(html).toContain("Beitrag einreichen");
    expect(html).toContain("Abstimmungen ansehen");
    expect(html.match(/<article/g)?.length ?? 0).toBe(3);
    expect(html.match(/<li>/g)?.length ?? 0).toBe(3);
  });
});
