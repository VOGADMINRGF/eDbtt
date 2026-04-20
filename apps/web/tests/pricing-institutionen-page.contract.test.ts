import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderInstitutionPage(params?: Record<string, string>) {
  const element = await InstitutionalPricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing/institutionen guided flow contract", () => {
  it("renders shortened hero and guided selection stages", async () => {
    const html = await renderInstitutionPage();

    expect(html).toContain("Institutionelle Konditionen");
    expect(html).toContain("Beantworte ein paar Fragen zu Einsatz, Ziel und Rahmen.");
    expect(html).toContain("1. Wer seid ihr?");
    expect(html).toContain("2. Was steht im Vordergrund?");
    expect(html).toContain("3. Wie sieht euer Einsatzrahmen aus?");
    expect(html).toContain("Organisation / Verband / Verein");
    expect(html).toContain("Kommune / Verwaltung / Landkreis");
  });

  it("shows recommendation-first CTA hierarchy", async () => {
    const html = await renderInstitutionPage();

    expect(html).toContain("Empfohlene Konfiguration");
    expect(html).toContain("Empfehlung übernehmen");
    expect(html).toContain("Direkt bestellen");
    expect(html).toContain("Kostenvoranschlag anfordern");
    expect(html).toContain("Gespräch anfragen");
    expect(html).toContain('href="/order?segment=organisationen&amp;paket=b2b_basis');
    expect(html).toContain("completion=direct_order");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("completion=conversation_request");
  });

  it("keeps add-ons progressive with recommended first and optional in details", async () => {
    const html = await renderInstitutionPage();

    expect(html).toContain("Empfohlene Erweiterungen");
    expect(html).toContain("Optional");
    expect(html).toContain("Nur bei Bedarf");
    expect(html).toContain("Status");
    expect(html).toContain("Direkt bestellbar");
    expect(html).not.toContain("Wirkung / ROI");
  });

  it("switches recommendation to municipal package when segment=kommunen", async () => {
    const html = await renderInstitutionPage({ segment: "kommunen" });

    expect(html).toContain("Kommune / Verwaltung Aktivierung");
    expect(html).toContain('href="/order?segment=kommunen&amp;paket=b2g_basis');
  });
});
