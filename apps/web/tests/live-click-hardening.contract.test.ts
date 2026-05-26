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
      "/runden",
      "/factcheck",
      "/dossier",
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

  it("keeps create handoff CTAs bound to real targets without placeholder hrefs", () => {
    const followupSource = readFileSync(resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"), "utf8");
    const createClientSource = readFileSync(resolve(process.cwd(), "src/app/create/CreateClient.tsx"), "utf8");

    expect(followupSource).not.toContain('href="#"');
    expect(createClientSource).not.toContain('href="#"');

    [
      "Anlassraum vorbereiten",
      "Als Ergänzung anhängen",
      "Neues Dossier vorbereiten",
      "Faktencheck anfragen",
      "Redaktionell prüfen lassen",
      "Nur speichern",
    ].forEach((label) => {
      expect(followupSource).toContain(label);
    });

    ["/community/contributions", "/dossier", "/factcheck", "/swipes", "/runden"].forEach((routeTarget) => {
      expect(createClientSource).toContain(routeTarget);
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

  it("removes placeholder and legacy stream/report CTA paths from productive source components", () => {
    const streamCardSource = readFileSync(
      resolve(process.cwd(), "..", "..", "features/stream/components/StreamCard.tsx"),
      "utf8",
    );
    const reportSidebarSource = readFileSync(
      resolve(process.cwd(), "..", "..", "features/report/components/LeftSidebar.tsx"),
      "utf8",
    );

    expect(streamCardSource).not.toContain('href="#"');
    expect(streamCardSource).not.toContain("/beitrag/");
    expect(streamCardSource).not.toContain("/dummy/");
    expect(streamCardSource).not.toContain("dummy1.jpg");
    expect(streamCardSource).toContain("/stream/");
    expect(streamCardSource).toContain("Zum Event-Kontext");

    expect(reportSidebarSource).not.toContain('href="#"');
    expect(reportSidebarSource).toContain('href="/report"');
  });
});
