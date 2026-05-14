import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createInMemoryRegionDataRepo, setRegionDataRepoForTests } from "@features/region";
import AdminRegionPage from "@/app/admin/region/page";

describe("admin-region participation signals", () => {
  it("renders public participation signals as anonymized, aggregated and non-official", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    const html = renderToStaticMarkup(
      await AdminRegionPage({
        searchParams: {
          regionId: "berlin-reinickendorf",
        },
      }),
    );

    expect(html).toContain("Öffentliche Beteiligungssignale");
    expect(html).toContain("Öffentlicher Claim");
    expect(html).toContain("Öffentliche Frage");
    expect(html).toContain("Öffentlicher Quellenhinweis");
    expect(html).toContain("Aggregiertes Swipe-Interesse");
    expect(html).toContain("Aggregierte Gegenposition");
    expect(html).toContain("anonymisiert/aggregiert");
    expect(html).toContain("keine politischen Profile");
    expect(html).toContain("nicht amtlich");
    expect(html).toContain("nicht repräsentativ");
    expect(html).not.toContain("Person X unterstützt");
    expect(html).not.toContain("userId");
  });
});
