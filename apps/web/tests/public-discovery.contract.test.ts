import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as loginMetadata } from "@/app/login/page";
import { metadata as registerMetadata } from "@/app/register/page";
import { metadata as resetMetadata } from "@/app/reset/page";
import { metadata as verifyMetadata } from "@/app/verify/page";
import { metadata as settingsMetadata } from "@/app/settings/layout";
import {
  buildHomeStructuredData,
  buildPublicDiscoverySitemap,
  NOINDEX_ROBOTS,
  PUBLIC_DISCOVERY_PATHS,
} from "@/lib/seo/publicDiscovery";

describe("public discovery contract", () => {
  it("keeps auth and settings surfaces out of indexing", () => {
    expect(loginMetadata.robots).toMatchObject(NOINDEX_ROBOTS);
    expect(registerMetadata.robots).toMatchObject(NOINDEX_ROBOTS);
    expect(resetMetadata.robots).toMatchObject(NOINDEX_ROBOTS);
    expect(verifyMetadata.robots).toMatchObject(NOINDEX_ROBOTS);
    expect(settingsMetadata.robots).toMatchObject(NOINDEX_ROBOTS);
  });

  it("keeps the homepage structured data explicit and rooted at the canonical host", () => {
    const data = buildHomeStructuredData();
    const startSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "eDebatte",
      url: "https://www.edebatte.org",
      inLanguage: "de-DE",
    });
    expect(data.description).toContain("Beteiligung beginnt vor dem Verfahren");
    expect(data.about).toContain("Agenda-Setting");
    expect(startSource).toContain('type="application/ld+json"');
    expect(startSource).toContain("buildHomeStructuredData");
  });

  it("keeps the citizen-led positioning pages in public discovery", () => {
    expect(PUBLIC_DISCOVERY_PATHS).toContain("/warum-edebatte");
    expect(PUBLIC_DISCOVERY_PATHS).toContain("/vergleich/consul");

    const sitemap = buildPublicDiscoverySitemap();
    expect(sitemap).toContainEqual(
      expect.objectContaining({
        url: "https://www.edebatte.org/warum-edebatte",
        priority: 0.9,
      }),
    );
    expect(sitemap).toContainEqual(
      expect.objectContaining({
        url: "https://www.edebatte.org/vergleich/consul",
        priority: 0.8,
      }),
    );
  });

  it("keeps comparison copy honest about citizen-initiated alternatives", () => {
    const whySource = readFileSync(resolve(process.cwd(), "src/app/warum-edebatte/page.tsx"), "utf8");
    const comparisonSource = readFileSync(resolve(process.cwd(), "src/app/vergleich/consul/page.tsx"), "utf8");

    expect(whySource).toContain("Beteiligung beginnt vor dem Verfahren");
    expect(whySource).toContain("Verwaltung ist Partner");
    expect(comparisonSource).toContain("CONSUL DEMOCRACY und Decidim");
    expect(comparisonSource).toContain("selbst Debatten, Proposals oder Initiativen anstoßen");
    expect(comparisonSource).toContain("Ein ungeklärtes Anliegen darf der Anfang sein");
    expect(comparisonSource).not.toContain("nur bei eDebatte");
  });
});
