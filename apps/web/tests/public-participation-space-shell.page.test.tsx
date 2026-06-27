import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import PublicParticipationSpacePage from "@/app/beteiligung/[slug]/page";

describe("/beteiligung/[slug] public participation space shell", () => {
  it("renders the public shell with public feedback, place hint and safety guidance", async () => {
    const html = renderToStaticMarkup(
      await PublicParticipationSpacePage({
        params: Promise.resolve({ slug: "schulwegsicherheit-nord" }),
      }),
    );

    expect(html).toContain("Öffentlicher Beteiligungsstand");
    expect(html).toContain("Beteiligungsraum Schulwegsicherheit Nord");
    expect(html).toContain("Öffentliche Rückmeldung");
    expect(html).toContain("Rückmeldungen sind redaktionelle Einordnungen, keine amtliche Entscheidung.");
    expect(html).toContain("Ortsangaben werden nur geprüft und sicherheitsbewusst angezeigt.");
    expect(html).toContain(
      "Dieser Raum ist ein transparenter Beteiligungsstand, kein automatischer Veröffentlichungsworkflow.",
    );
    expect(html).toContain("Kiezbereich rund um die Grundschule Nord");
    expect(html).toContain("Anzeigeform: Bereichslabel");
    expect(html).toContain("Welche Zeitfenster sind tatsächlich am stärksten belastet?");
    expect(html).toContain("Minderheitenpositionen bleiben sichtbar");
    expect(html).toContain("Mehr Aufsicht statt baulicher Änderung");
    expect(html).toContain("Sichtachsen konkret prüfen");
    expect(html).not.toContain("Operator-Cockpit");
    expect(html).not.toContain("publish_feedback_manually");
    expect(html).not.toContain("approve_feedback_for_public");
  });

  it("keeps feedback_prepared out of public feedback and hides non-public place data", async () => {
    const html = renderToStaticMarkup(
      await PublicParticipationSpacePage({
        params: Promise.resolve({ slug: "jugendforum-sued" }),
      }),
    );

    expect(html).toContain("Rückmeldung in Vorbereitung");
    expect(html).toContain(
      "Eine öffentliche Rückmeldung ist vorbereitet, aber noch nicht als öffentliche Einordnung sichtbar.",
    );
    expect(html).not.toContain("Öffentliche Rückmeldung");
    expect(html).not.toContain("Vorbereitete Rückmeldung Jugendforum Süd");
    expect(html).not.toContain(
      "Die nächste öffentliche Einordnung ist vorbereitet, aber noch nicht als öffentlicher Rückmeldestand sichtbar.",
    );
    expect(html).not.toContain("Abendwege und Aufenthaltsorte");
    expect(html).not.toContain("Welche Orte sollen zuerst gemeinsam nachgeschärft werden?");
    expect(html).not.toContain("Sichtbare Rückmeldung nach Review freigeben");
    expect(html).not.toContain("Genauer Treffpunkt bleibt geschützt");
  });

  it("does not render map, coordinates or external map api hints", async () => {
    const html = renderToStaticMarkup(
      await PublicParticipationSpacePage({
        params: Promise.resolve({ slug: "schulwegsicherheit-nord" }),
      }),
    );

    expect(html).not.toContain("Koordinaten");
    expect(html).not.toContain("Mapbox");
    expect(html).not.toContain("OpenStreetMap");
    expect(html).not.toContain("Leaflet");
    expect(html).not.toContain("Geocoding");
  });

  it("stays free of automation claims for publish, dossier, anlassraum and graph", async () => {
    const html = renderToStaticMarkup(
      await PublicParticipationSpacePage({
        params: Promise.resolve({ slug: "schulwegsicherheit-nord" }),
      }),
    );

    expect(html).not.toContain("automatische Veröffentlichung");
    expect(html).not.toContain("Auto-Dossier");
    expect(html).not.toContain("Auto-Anlassraum");
    expect(html).not.toContain("Auto-Graph");
    expect(html).toContain("kein automatischer Veröffentlichungsworkflow");
  });
});
