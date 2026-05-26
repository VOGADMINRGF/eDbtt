import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readAppFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "src/app", relativePath), "utf8");
}

describe("v1 production ready public routes contract", () => {
  it("removes candidate and pilot wording from the public V1 surfaces", () => {
    const publicSources = [
      readAppFile("start/LandingStart.tsx"),
      readAppFile("create/CreateClient.tsx"),
      readAppFile("swipes/SwipesClient.tsx"),
      readAppFile("runden/page.tsx"),
      readAppFile("anlassraum/page.tsx"),
      readAppFile("dossier/[id]/ui.tsx"),
      readAppFile("stream/page.tsx"),
      readAppFile("pricing/page.tsx"),
      readAppFile("pricing/institutionen/page.tsx"),
    ].join("\n");

    expect(publicSources).not.toContain("production_candidate");
    expect(publicSources).not.toContain("Pilot vormerken");
    expect(publicSources).not.toContain("Kontrollierter Pilot");
  });

  it("keeps Anlassraum as a public alias to /runden and not a second route world", () => {
    const anlassraumSource = readAppFile("anlassraum/page.tsx");

    expect(anlassraumSource).toContain('return query ? `/runden?${query}` : "/runden";');
    expect(anlassraumSource).toContain('redirect(buildRundenAliasTarget(resolved));');
  });

  it("keeps the public stream and pricing surfaces on honest V1 wording", () => {
    const streamSource = readAppFile("stream/page.tsx");
    const pricingInstitutionenSource = readAppFile("pricing/institutionen/page.tsx");

    expect(streamSource).toContain('href="/runden"');
    expect(streamSource).toContain('href="/dossier"');
    expect(streamSource).toContain('href="/swipes"');
    expect(streamSource).toContain("Öffentliche Hinweise bleiben reviewpflichtig.");

    expect(pricingInstitutionenSource).toContain("Startpaket vormerken");
    expect(pricingInstitutionenSource).toContain("Startpaket");
    expect(pricingInstitutionenSource).not.toContain("Pilotpaket");
  });
});
