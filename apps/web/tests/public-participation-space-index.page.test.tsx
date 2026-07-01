import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import PublicParticipationSpaceIndexPage from "@/app/beteiligung/page";
import { listPublicParticipationSpaceFixtures } from "@/features/participation/fixtures/publicParticipationSpace";

async function renderParticipationSpaceIndex() {
  return renderToStaticMarkup(await PublicParticipationSpaceIndexPage());
}

describe("/beteiligung public participation space index", () => {
  it("renders exactly one visible h1", async () => {
    const html = await renderParticipationSpaceIndex();
    const headings = [...html.matchAll(/<h1([^>]*)>/g)];

    expect(headings).toHaveLength(1);
    expect(headings[0]?.[1] ?? "").not.toContain("sr-only");
    expect(html).toContain("Öffentlich freigegebene Beteiligungsräume");
  });

  it("renders every fixture as a link to its detail page while no runtime publish exists", async () => {
    const html = await renderParticipationSpaceIndex();
    const fixtures = listPublicParticipationSpaceFixtures();

    for (const fixture of fixtures) {
      expect(html).toContain(fixture.space.title);
      expect(html).toContain(`href="/beteiligung/${fixture.space.slug}"`);
    }
  });

  it("shows public overview data without leaking public-detail-only content", async () => {
    const html = await renderParticipationSpaceIndex();

    expect(html).toContain("Öffentliche Beteiligungsstände auf einen Blick");
    expect(html).toContain("Öffentliche Rückmeldung zum Beteiligungsstand");
    expect(html).toContain("Rückmeldung in Vorbereitung");
    expect(html).toContain("Öffentlicher Zwischenstand");
    expect(html).not.toContain("Rückmeldung zur Schulwegsicherheit");
    expect(html).not.toContain("Vorbereitete Rückmeldung Jugendforum Süd");
    expect(html).not.toContain("Abendwege und Aufenthaltsorte");
    expect(html).not.toContain("Welche Orte sollen zuerst gemeinsam nachgeschärft werden?");
    expect(html).not.toContain("Sichtbare Rückmeldung nach Review freigeben");
  });

  it("does not render internal workflow terms in the public markup", async () => {
    const html = await renderParticipationSpaceIndex();
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

  it("does not render map or geo-specific terms", async () => {
    const html = await renderParticipationSpaceIndex();
    const forbiddenTerms = ["Mapbox", "OpenStreetMap", "Leaflet", "Geocoding", "Koordinaten"];

    for (const term of forbiddenTerms) {
      expect(html).not.toContain(term);
    }
  });

  it("keeps the page free of form or intake language", async () => {
    const html = await renderParticipationSpaceIndex();

    expect(html).not.toContain("Absenden");
    expect(html).not.toContain("Einreichen");
    expect(html).not.toContain("Jetzt mitmachen");
  });
});
