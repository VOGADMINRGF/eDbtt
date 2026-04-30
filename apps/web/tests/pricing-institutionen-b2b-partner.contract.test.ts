import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

async function renderB2BPage() {
  const element = await InstitutionalPricingPage({
    searchParams: {
      segment: "organisationen",
    },
  });
  return renderToStaticMarkup(element);
}

describe("pricing-institutionen-b2b-partner.contract", () => {
  it("shows B2B partner framing for participation offices and dialogue professionals", async () => {
    const html = await renderB2BPage();

    expect(html).toContain("Für Beteiligungsbüros &amp; Dialogprofis");
    expect(html).toContain("Beteiligungsbüro Starter");
    expect(html).toContain("Projektpartner Beteiligung");
    expect(html).toContain("Agentur-/Büro-Betrieb");
    expect(html).toContain("Partner-/Rahmenmodell");
    expect(html).toContain("Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur");
  });

  it("keeps non-replacement guardrails and honest partner wording", async () => {
    const html = await renderB2BPage();

    expect(html).toContain("eDebatte ersetzt keine Moderation");
    expect(html).not.toContain("ersetzt Beteiligungsbüros");
    expect(html).not.toContain("vollautomatische Bürgerbeteiligung");
    expect(html).toContain("Keine Fake-White-Label-Zusage");
  });

  it("routes B2B CTAs to /order with organisation segment and completion context", async () => {
    const html = await renderB2BPage();

    expect(html).toContain("Pilot vormerken");
    expect(html).toContain("Demo anfragen");
    expect(html).toContain("Projektpaket anfragen");
    expect(html).toContain("Partnergespräch vereinbaren");
    expect(html).toContain("Kostenvoranschlag anfordern");
    expect(html).toContain("segment=organisationen");
    expect(html).toContain("completion=direct_order");
    expect(html).toContain("completion=quote_request");
    expect(html).toContain("completion=conversation_request");
  });
});
