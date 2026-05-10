import path, { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";
import InstitutionalPricingPage from "@/app/pricing/institutionen/page";

const APP_DIR = path.resolve(process.cwd(), "src/app");

function routePageExists(pathname: string) {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const candidates = [
    path.join(APP_DIR, normalized, "page.tsx"),
    path.join(APP_DIR, normalized, "page.ts"),
    path.join(APP_DIR, normalized, "page.jsx"),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

describe("live click hardening contract", () => {
  it("keeps central header and mobile nav targets on real routes without placeholder hrefs", () => {
    const siteHeaderSource = readFileSync(resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"), "utf8");
    const mobileNavSource = readFileSync(resolve(process.cwd(), "src/components/mobile/MobileAppShellChrome.tsx"), "utf8");

    expect(siteHeaderSource).not.toContain('href="#"');
    expect(mobileNavSource).not.toContain('href="#"');

    [
      "/start",
      "/themen",
      "/swipes",
      "/community/contributions",
      "/howtoworks/edebatte",
      "/pricing",
      "/pricing/institutionen",
      "/stream",
      "/account",
      "/create",
      "/order",
      "/vormerken",
      "/kontakt",
    ].forEach((target) => {
      expect(routePageExists(target)).toBe(true);
    });
  });

  it("keeps pricing and institutional follow-up CTAs clickable without dead ends", async () => {
    const pricingHtml = renderToStaticMarkup(await PricingPage({ searchParams: { segment: "kommunen" } }));
    const institutionalHtml = renderToStaticMarkup(
      await InstitutionalPricingPage({ searchParams: { segment: "organisationen" } }),
    );

    expect(pricingHtml).not.toContain('href="#"');
    expect(pricingHtml).toContain('/pricing/institutionen?segment=kommunen#guided-selection');
    expect(pricingHtml).toContain('href="#pricing-privat"');
    expect(pricingHtml).toContain('href="/kontakt"');

    expect(institutionalHtml).not.toContain('href="#"');
    expect(institutionalHtml).toContain('href="/order?segment=organisationen');
    expect(institutionalHtml).toContain("sales@edebatte.org");
  });
});
