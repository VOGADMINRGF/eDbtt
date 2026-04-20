import path from "node:path";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EDEBATTE_PACKAGES_DE, PRICING_JOURNEY_SEGMENTS } from "@features/pricing";

const APP_DIR = path.resolve(process.cwd(), "src/app");

function toPathname(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) return null;
  return href.split("?")[0] || "/";
}

function routePageExists(pathname: string) {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const candidates = [
    path.join(APP_DIR, normalized, "page.tsx"),
    path.join(APP_DIR, normalized, "page.ts"),
    path.join(APP_DIR, normalized, "page.jsx"),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

describe("pricing CTA targets", () => {
  it("keeps all internal pricing/order CTAs on existing routes", () => {
    const internalTargets = new Set<string>();

    EDEBATTE_PACKAGES_DE.forEach((pkg) => {
      const primary = toPathname(pkg.ctaHref);
      if (primary) internalTargets.add(primary);

      if (pkg.sekundarCtaHref) {
        const secondary = toPathname(pkg.sekundarCtaHref);
        if (secondary) internalTargets.add(secondary);
      }
    });

    PRICING_JOURNEY_SEGMENTS.forEach((segment) => {
      const target = toPathname(segment.primaryCtaHref);
      if (target) internalTargets.add(target);
    });

    ["/pricing", "/pricing/institutionen", "/order", "/vormerken", "/mitglied-antrag", "/kontakt"].forEach((target) =>
      internalTargets.add(target),
    );

    internalTargets.forEach((target) => {
      expect(routePageExists(target)).toBe(true);
    });
  });

  it("keeps external secondary CTAs restricted to known support host", () => {
    const externalTargets = EDEBATTE_PACKAGES_DE
      .map((pkg) => pkg.sekundarCtaHref)
      .filter((href): href is string => Boolean(href && href.startsWith("http")));

    externalTargets.forEach((href) => {
      expect(href).toMatch(/^https:\/\/voiceopengov\.org\//);
    });
  });
});
