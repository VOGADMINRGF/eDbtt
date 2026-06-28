import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
} from "@features/region";
import AdminRegionPage from "@/app/admin/region/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
    push: () => undefined,
    replace: () => undefined,
    prefetch: async () => undefined,
    back: () => undefined,
    forward: () => undefined,
  }),
}));

describe("admin-region participation signals", () => {
  it("renders public participation signals as anonymized, aggregated and non-official", async () => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
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
    expect(html).toContain("Regionzuordnung offen");
    expect(html).toContain("anonymisiert/aggregiert");
    expect(html).toContain("keine politischen Profile");
    expect(html).toContain("nicht amtlich");
    expect(html).toContain("nicht repräsentativ");
    expect(html).not.toContain("Person X unterstützt");
    expect(html).not.toContain("userId");
  });
});
