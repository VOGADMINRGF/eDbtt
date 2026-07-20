import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relPath: string) {
  return readFileSync(path.join(process.cwd(), "src", relPath), "utf8");
}

describe("dossier demo link isolation", () => {
  it("removes hardcoded /dossier/demo links from the affected runtime surfaces", () => {
    const sources = [
      readSource("components/dossier/ExportPanel.tsx"),
      readSource("app/studio/page.tsx"),
      readSource("app/create/CreateClient.tsx"),
      readSource("app/account/AccountClient.tsx"),
      readSource("app/streams/page.tsx"),
      readSource("app/streams/[id]/page.tsx"),
      readSource("app/beitraege/[id]/page.tsx"),
    ];

    for (const source of sources) {
      expect(source).not.toContain("/dossier/demo");
    }
  });

  it("uses canonical dossier helpers instead of inventing ids for runtime links", () => {
    const exportPanel = readSource("components/dossier/ExportPanel.tsx");
    const studioPage = readSource("app/studio/page.tsx");
    const createClient = readSource("app/create/CreateClient.tsx");
    const accountClient = readSource("app/account/AccountClient.tsx");
    const streamsPage = readSource("app/streams/page.tsx");
    const streamDetailPage = readSource("app/streams/[id]/page.tsx");
    const contributionPage = readSource("app/beitraege/[id]/page.tsx");

    expect(exportPanel).toContain("buildCanonicalDossierEmbedSnippet(dossierId)");
    expect(studioPage).toContain("allowIndexFallback: true");
    expect(createClient).toContain("allowIndexFallback: true");
    expect(accountClient).toContain("allowIndexFallback: true");
    expect(streamsPage).toContain("demoDossier.meta.id");
    expect(streamDetailPage).toContain("demoDossier.meta.id");
    expect(contributionPage).toContain("demoDossier.meta.id");
  });
});
