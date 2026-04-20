import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import { resolvePricingSegmentForPackage } from "@features/pricing";
import type { PreorderLeadRecord } from "@features/pricing";

describe("pricing preorder segment contract", () => {
  it("resolves journey segment from package ids", () => {
    expect(resolvePricingSegmentForPackage("basis")).toBe("privat");
    expect(resolvePricingSegmentForPackage("journal_pro")).toBe("journalismus");
    expect(resolvePricingSegmentForPackage("b2b_basis")).toBe("organisationen");
    expect(resolvePricingSegmentForPackage("b2g_pro")).toBe("kommunen");
  });

  it("stores explicit segment in preorder leads", async () => {
    let inserted: PreorderLeadRecord | null = null;

    const result = await createPreorderLead(
      {
        package: "b2g_basis",
        email: "kontakt@example.org",
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
    expect(inserted?.segment).toBe("kommunen");
    expect(inserted?.type).toBe("organisation");
    expect(inserted?.status).toBe("under_review");
    expect(inserted?.requiresReview).toBe(true);
    expect(inserted?.orderId).toMatch(/^EDE-/);
  });

  it("keeps private and journalism orders directly submitted", async () => {
    let privateOrder: PreorderLeadRecord | null = null;
    let journalismOrder: PreorderLeadRecord | null = null;

    await createPreorderLead(
      {
        package: "basis",
        email: "a@example.org",
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            privateOrder = lead;
          },
        },
      },
    );

    await createPreorderLead(
      {
        package: "journal_pro",
        email: "b@example.org",
        selectedOptions: { factcheckQuota: "plus" },
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            journalismOrder = lead;
          },
        },
      },
    );

    expect(privateOrder?.status).toBe("submitted");
    expect(privateOrder?.requiresReview).toBe(false);
    expect(journalismOrder?.status).toBe("submitted");
    expect(journalismOrder?.selectedOptions).toEqual({ factcheckQuota: "plus" });
  });

  it("rejects payloads where provided segment mismatches package contract", async () => {
    let writes = 0;

    const result = await createPreorderLead(
      {
        package: "b2b_pro",
        segment: "privat",
        email: "kontakt@example.org",
      },
      {},
      {
        leadRepo: {
          insertLead: async () => {
            writes += 1;
          },
        },
      },
    );

    expect(result).toEqual({ ok: false, error: "invalid_input" });
    expect(writes).toBe(0);
  });
});
