import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import VormerkenPage from "@/app/vormerken/page";

function setSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("/vormerken package-start flow", () => {
  it("communicates package-led shop flow", () => {
    setSearch();
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Paket wählen und Start vorbereiten");
    expect(html).toContain("Ein klarer Bestellfluss");
    expect(html).toContain("Segment wählen");
    expect(html).toContain("Bestellung absenden");
  });

  it("shows the same three private packages as /pricing by default", () => {
    setSearch();
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("eDebatte Interessiert");
    expect(html).toContain("eDebatte Aktiv");
    expect(html).toContain("eDebatte Mitgestaltend");
    expect(html).toContain("0 € für VoiceOpenGov-Mitglieder");
    expect(html).toContain("3,99 € regulär");
    expect(html).toContain("9,90 €");
    expect(html).toContain("29,90 €");
    expect(html).not.toContain("eDebatte Basis");
    expect(html).not.toContain("eDebatte Start");
    expect(html).not.toContain("eDebatte Pro");
    expect(html).not.toContain("Technisches Mapping");
  });

  it("supports institutional package preselection via query", () => {
    setSearch("segment=kommunen&paket=b2g_pro&quote=1");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Kommune / Verwaltung Betrieb Plus");
    expect(html).toContain("Organisation / Kommune");
    expect(html).toContain("Kostenvoranschlag aktualisieren");
    expect(html).toContain("Kostenvoranschlag downloaden");
    expect(html).toContain("Monatlich planbare Positionen");
  });

  it("keeps institutional access visible and optional contact path", () => {
    setSearch();
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain('href="/pricing/institutionen"');
    expect(html).toContain("Zu B2B/B2G-Konditionen");
    expect(html).not.toContain("Direktbestellung für institutionelle Pakete ist möglich");
  });

  it("keeps membership checkbox in private flow", () => {
    setSearch();
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Ich möchte zusätzlich die VoiceOpenGov-Mitgliedschaft beantragen.");
    expect(html).toContain("Mitgliedschaft und Paketfreischaltung werden getrennt geführt.");
  });
});
