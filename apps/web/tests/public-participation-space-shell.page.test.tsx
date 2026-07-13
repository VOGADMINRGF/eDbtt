import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import PublicParticipationSpacePage from "@/app/beteiligung/[slug]/page";

async function renderParticipationSpace(slug: string) {
  return renderToStaticMarkup(
    await PublicParticipationSpacePage({
      params: Promise.resolve({ slug }),
    }),
  );
}

describe("/beteiligung/[slug] public participation space shell", () => {
  it("renders exactly one visible h1 in the delegated shell markup", async () => {
    const html = await renderParticipationSpace("schulwegsicherheit-nord");
    const headings = [...html.matchAll(/<h1([^>]*)>/g)];

    expect(headings).toHaveLength(1);
    expect(headings[0]?.[1] ?? "").not.toContain("sr-only");
    expect(html).toContain("Beteiligungsraum Schulwegsicherheit Nord");
  });

  it("keeps public feedback details visible for the live public fixture", async () => {
    const html = await renderParticipationSpace("schulwegsicherheit-nord");

    expect(html).toContain("Öffentlicher Beteiligungsraum");
    expect(html).toContain("Read-only Beteiligungsstand");
    expect(html).toContain("Öffentliche Rückmeldung");
    expect(html).toContain("Welche Zeitfenster sind tatsächlich am stärksten belastet?");
    expect(html).toContain("Minderheitenpositionen bleiben sichtbar");
    expect(html).toContain("Mehr Aufsicht statt baulicher Änderung");
    expect(html).toContain("Sichtachsen konkret prüfen");
    expect(html).toContain("Kiezbereich rund um die Grundschule Nord");
    expect(html).toContain("Anzeigeform: Bereichslabel");
    expect(html).toContain("Öffentliche Hinweise noch nicht aktiv");
    expect(html).toContain(
      "Hinweise können erst eingereicht werden, wenn dieser Beteiligungsraum als veröffentlichte Fassung vorliegt.",
    );
    expect(html).not.toContain("Hinweis einreichen");
  });

  it("keeps feedback_prepared out of public feedback and hides non-public place data", async () => {
    const html = await renderParticipationSpace("jugendforum-sued");

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

  it("shows robust empty states for a public room without public feedback details", async () => {
    const html = await renderParticipationSpace("nachbarschaftsforum-west");

    expect(html).toContain("Noch keine öffentliche Rückmeldung");
    expect(html).toContain(
      "Für diesen Beteiligungsraum ist aktuell noch keine öffentliche Rückmeldung sichtbar.",
    );
    expect(html).toContain(
      "Öffentliche Ortsangaben werden nur angezeigt, wenn sie geprüft und sicherheitsbewusst freigegeben sind.",
    );
    expect(html).not.toContain("Öffentliche Rückmeldung");
    expect(html).not.toContain("Minderheitenpositionen bleiben sichtbar");
    expect(html).not.toContain("Sichtbare Rückmeldung nach Review freigeben");
  });

  it("does not render internal workflow terms in the public markup", async () => {
    const html = await renderParticipationSpace("jugendforum-sued");
    const forbiddenTerms = [
      "operator_cockpit",
      "queueKey",
      "riskFlags",
      "publish_feedback_manually",
      "approve_feedback_for_public",
    ];

    for (const term of forbiddenTerms) {
      expect(html).not.toContain(term);
    }
  });

  it("does not render map, coordinates, external api or automation claims", async () => {
    const html = await renderParticipationSpace("schulwegsicherheit-nord");

    expect(html).not.toContain("Koordinaten");
    expect(html).not.toContain("Mapbox");
    expect(html).not.toContain("OpenStreetMap");
    expect(html).not.toContain("Leaflet");
    expect(html).not.toContain("Geocoding");
    expect(html).not.toContain("Auto-Dossier");
    expect(html).not.toContain("Auto-Anlassraum");
    expect(html).not.toContain("Auto-Graph");
  });

  it("shows safety and trust notices in citizen-friendly language", async () => {
    const html = await renderParticipationSpace("schulwegsicherheit-nord");

    expect(html).toContain("Einordnung, keine amtliche Entscheidung");
    expect(html).toContain("Review-Inhalte bleiben verborgen");
    expect(html).toContain("Ortsangaben sicherheitsbewusst");
    expect(html).toContain("Keine automatische Veröffentlichung");
  });
});
