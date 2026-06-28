import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

vi.mock("server-only", () => ({}));

import VormerkenPage from "@/app/vormerken/page";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import type { PreorderLeadRecord } from "@features/pricing";

describe("member checkbox flow contract", () => {
  it("renders optional membership checkbox and explanatory hints", () => {
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain("Ich möchte zusätzlich die VoiceOpenGov-Mitgliedschaft beantragen.");
    expect(html).toContain("Mitgliedschaft und Paketfreischaltung werden getrennt geführt.");
    expect(html).toContain("Die finale Bestätigung erfolgt separat per E-Mail-Link.");
    expect(html).toContain("Empfohlener Mitgliedsbeitrag: 5,63 €");
  });

  it("persists membership checkbox flag in preorder lead", async () => {
    let inserted: PreorderLeadRecord | null = null;

    const result = await createPreorderLead(
      {
        package: "basis",
        email: "mitglied@example.org",
        membershipRequested: true,
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            inserted = lead;
          },
        },
      },
    );

    expect(result.ok).toBe(true);
    expect(inserted?.membershipRequested).toBe(true);
    expect(inserted?.publicPriceSummary.notes.join(" ")).toContain("Mitgliedschaftsantrag");
  });
});
