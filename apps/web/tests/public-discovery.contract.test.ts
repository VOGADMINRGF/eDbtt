import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as loginMetadata } from "@/app/login/page";
import { metadata as registerMetadata } from "@/app/register/page";
import { metadata as resetMetadata } from "@/app/reset/page";
import { metadata as verifyMetadata } from "@/app/verify/page";
import { metadata as settingsMetadata } from "@/app/settings/layout";
import { buildHomeStructuredData, NOINDEX_ROBOTS } from "@/lib/seo/publicDiscovery";

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
    expect(startSource).toContain('type="application/ld+json"');
    expect(startSource).toContain("buildHomeStructuredData");
  });
});
