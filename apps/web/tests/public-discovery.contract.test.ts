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

  it("keeps the homepage structured data explicit, international and rooted at the canonical host", () => {
    const data = buildHomeStructuredData();
    const startSource = readFileSync(resolve(process.cwd(), "src/app/start/page.tsx"), "utf8");

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "eDebatte",
      url: "https://www.edebatte.org",
      inLanguage: "de-DE",
    });
    expect(data.description).toContain("gemeinsamen Agenda");
    expect(data.about).toContain("Agenda-Setting");
    expect(data.about).toContain("civic collective intelligence");
    expect(data.about).toContain("public reasoning");
    expect(startSource).toContain('type="application/ld+json"');
    expect(startSource).toContain("buildHomeStructuredData");
  });

  it("keeps the global positioning and comparison cluster in public discovery", () => {
    const expectedPaths = [
      "/warum-edebatte",
      "/vergleich",
      "/vergleich/consul",
      "/vergleich/decidim",
      "/vergleich/govocal",
      "/vergleich/make-org",
      "/vergleich/polis",
      "/vergleich/your-priorities",
      "/vergleich/crowdinsights",
      "/vergleich/werdenktwas",
    ];

    for (const path of expectedPaths) expect(PUBLIC_DISCOVERY_PATHS).toContain(path);

    const sitemap = buildPublicDiscoverySitemap();
    expect(sitemap).toContainEqual(expect.objectContaining({ url: "https://www.edebatte.org/warum-edebatte", priority: 0.95 }));
    expect(sitemap).toContainEqual(expect.objectContaining({ url: "https://www.edebatte.org/vergleich", priority: 0.9 }));
    expect(sitemap).toContainEqual(expect.objectContaining({ url: "https://www.edebatte.org/vergleich/polis", priority: 0.8 }));
  });

  it("keeps comparison copy honest about strong citizen-led alternatives", () => {
    const whySource = readFileSync(resolve(process.cwd(), "src/app/warum-edebatte/page.tsx"), "utf8");
    const consulSource = readFileSync(resolve(process.cwd(), "src/app/vergleich/consul/page.tsx"), "utf8");
    const decidimSource = readFileSync(resolve(process.cwd(), "src/app/vergleich/decidim/page.tsx"), "utf8");
    const prioritiesSource = readFileSync(resolve(process.cwd(), "src/app/vergleich/your-priorities/page.tsx"), "utf8");
    const landscapeSource = readFileSync(resolve(process.cwd(), "src/app/vergleich/page.tsx"), "utf8");

    expect(whySource).toContain("democratic problem-solving");
    expect(whySource).toContain("lokal bis global");
    expect(consulSource).toContain("CONSUL besitzt bereits echte Bottom-up-Mechanismen");
    expect(decidimSource).toContain("Bürgerinitiativen und Agenda-Setting");
    expect(prioritiesSource).toContain("kommt dem eDebatte-Zielbild sehr nahe");
    expect(landscapeSource).toContain("Nicht ein Markt. Mehrere demokratische Technologieklassen.");
    expect(consulSource).not.toContain("nur bei eDebatte");
  });
});