import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  listRundenEntryItems: vi.fn(),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.listRundenEntryItems(...args),
}));

import RundenPage from "@/app/runden/page";

describe("/runden acceptance states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario B: productive empty result renders explicit empty state without demo fallback", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([]);

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Noch keine produktiven Runden vorhanden.");
    expect(html).toContain("nutzt keinen statischen Demo-Seed-Fallback");
  });

  it("Scenario C: productive source failure renders explicit error state without fallback", async () => {
    mocks.listRundenEntryItems.mockRejectedValue(new Error("round_entry_source_unavailable"));

    const tree = await RundenPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Produktive Quelle derzeit nicht verfuegbar");
    expect(html).toContain("kein statischer Seed-Datensatz als Fallback");
  });
});
