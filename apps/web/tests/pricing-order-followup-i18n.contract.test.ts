import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPricingOrderFollowupContract, type PreorderLeadRecord } from "@features/pricing";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";

describe("pricing order follow-up i18n contract", () => {
  it("keeps follow-up status logic identical in DE/EN", () => {
    const segments = ["privat", "journalismus", "organisationen", "kommunen"] as const;

    segments.forEach((segment) => {
      const de = getPricingOrderFollowupContract(segment, "de");
      const en = getPricingOrderFollowupContract(segment, "en");

      expect(en.expectedInitialStatus).toBe(de.expectedInitialStatus);
      expect(en.requiresInternalReview).toBe(de.requiresInternalReview);
      expect(en.nextPrimaryRoute).toBe(de.nextPrimaryRoute);
      expect(en.nextSecondaryRoute).toBe(de.nextSecondaryRoute);
      expect(en.nextPrimaryLabel.length).toBeGreaterThan(2);
      expect(de.nextPrimaryLabel.length).toBeGreaterThan(2);
    });
  });

  it("builds localized public order summary notes and add-on labels", async () => {
    let deOrder: PreorderLeadRecord | null = null;
    let enOrder: PreorderLeadRecord | null = null;

    await createPreorderLead(
      {
        package: "journal_pro",
        locale: "de",
        email: "de-media@example.org",
        selectedAddOns: ["faktencheck_kontingent"],
        selectedOptions: { factcheckQuota: "plus" },
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            deOrder = lead;
          },
        },
      },
    );

    await createPreorderLead(
      {
        package: "journal_pro",
        locale: "en",
        email: "en-media@example.org",
        selectedAddOns: ["faktencheck_kontingent"],
        selectedOptions: { factcheckQuota: "plus" },
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            enOrder = lead;
          },
        },
      },
    );

    expect(deOrder?.publicPriceSummary.addOnSelections).toContain("Optionales Faktencheck-Kontingent");
    expect(deOrder?.publicPriceSummary.notes).toContain("Optionales Faktencheck-Kontingent: plus");

    expect(enOrder?.publicPriceSummary.addOnSelections).toContain("Optional fact-check quota");
    expect(enOrder?.publicPriceSummary.notes).toContain("Optional fact-check quota: plus");
    expect(enOrder?.publicPriceSummary.notes).toContain("Selected add-ons are internally reviewed before activation.");
    expect(enOrder?.publicPriceSummary.notes).not.toContain("Bestellung wird vor Aktivierung intern geprüft.");
  });
});
