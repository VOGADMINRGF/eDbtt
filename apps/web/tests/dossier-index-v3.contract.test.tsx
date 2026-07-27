import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierIndex from "@/app/dossier/ui";

describe("dossier index V3 contract", () => {
  it("renders only real runtime items with one next action per dossier", () => {
    const html = renderToStaticMarkup(
      <DossierIndex
        items={[
          {
            id: "dossier-1",
            slug: "dossier-1",
            title: "Sichere Schulwege",
            coreQuestion: "Welche Kreuzungen sind zuerst kritisch?",
            summary: "Veröffentlichter Arbeitsstand.",
            statusLabel: "Veröffentlicht",
            sourceStatusLabel: "Quellenprüfung offen",
            updatedAt: "2026-07-20T10:00:00.000Z",
            source: "runtime",
          },
        ]}
      />,
    );

    expect(html).toContain("Veröffentlichte Dossiers");
    expect(html).toContain("Welche Kreuzungen sind zuerst kritisch?");
    expect(html).toContain("Quellenprüfung offen");
    expect(html.match(/Debattenstand öffnen/g)).toHaveLength(1);
    expect(html).not.toContain("sessionStorage");
    expect(html).not.toContain("Demo");
  });

  it("keeps empty and failed runtime states honest", () => {
    const empty = renderToStaticMarkup(<DossierIndex items={[]} />);
    const failed = renderToStaticMarkup(<DossierIndex items={[]} loadFailed />);

    expect(empty).toContain("Noch keine veröffentlichten Dossiers");
    expect(empty).toContain("Demo-Daten werden in dieser Übersicht nicht eingeblendet");
    expect(failed).toContain("keine Beispieldossiers als Ersatz");
  });
});
