import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

async function renderPricing(params?: Record<string, string>) {
  const element = await PricingPage({ searchParams: params });
  return renderToStaticMarkup(element);
}

describe("/pricing canonical landing", () => {
  it("renders short decision-first private package flow without legacy tier naming", async () => {
    const html = await renderPricing();

    expect(html).toContain("Pakete &amp; Preise");
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
    expect(html).not.toContain("citizenBasic");
    expect(html).not.toContain("citizenPremium");
    expect(html).not.toContain("citizenPro");
    expect(html).not.toContain("Technisches Mapping");
  });

  it("keeps hero short with two primary CTAs", async () => {
    const html = await renderPricing();

    expect(html).toContain("Wähle eines von drei Privatpaketen");
    expect(html).toContain("Paket wählen");
    expect(html).toContain("B2B/B2G-Konditionen ansehen");
    expect(html).toContain('href="/pricing/institutionen"');
  });

  it("keeps initiative membership logic visible in pricing decision area", async () => {
    const html = await renderPricing();

    expect(html).toContain("Als Mitglied der Initiative ist das Paket „Interessiert“ kostenfrei.");
    expect(html).toContain("Empfohlen sind 5,63 €");
    expect(html).toContain("Zur Initiative");
    expect(html).toContain("So funktioniert eDebatte");
  });

  it("keeps institutional and newsroom conditions as short secondary hint", async () => {
    const html = await renderPricing();

    expect(html).toContain("Organisationen, Kommunen, Verbände und Redaktionen");
    expect(html).toContain("B2B/B2G-Konditionen ansehen");
  });

  it("keeps primary pricing CTAs on existing routes", async () => {
    const html = await renderPricing();

    expect(html).toContain('href="#pricing-privat"');
    expect(html).toContain('href="/pricing/institutionen"');
    expect(html).toContain('href="/order?paket=basis"');
    expect(html).toContain('href="/order?paket=start"');
    expect(html).toContain('href="/order?paket=pro"');
  });

  it("keeps locale-aware links in EN mode", async () => {
    const html = await renderPricing({ lang: "en" });

    expect(html).toContain("Packages &amp; pricing");
    expect(html).toContain("Choose package");
    expect(html).toContain("View B2B/B2G conditions");
    expect(html).toContain('href="/pricing/institutionen?lang=en"');
    expect(html).toContain('href="/order?paket=pro&amp;lang=en"');
  });
});
