import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getPricingOrderFollowupContract,
  type PreorderLeadRecord,
} from "@features/pricing";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import { resolvePostLoginRedirect } from "@/features/auth/roleExperienceContract";

describe("pricing order role followup contract", () => {
  it("keeps private and journalism orders low-friction with submitted initial status", async () => {
    let privateOrder: PreorderLeadRecord | null = null;
    let journalismOrder: PreorderLeadRecord | null = null;

    await createPreorderLead(
      { package: "basis", email: "citizen@example.org" },
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
        email: "media@example.org",
        selectedAddOns: ["faktencheck_kontingent"],
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
    expect(journalismOrder?.status).toBe("submitted");
    expect(journalismOrder?.publicPriceSummary.addOnSelections).toContain("Optionales Faktencheck-Kontingent");
    expect(journalismOrder?.publicPriceSummary.notes).toContain("Optionales Faktencheck-Kontingent: plus");
    expect(journalismOrder?.publicPriceSummary.notes).toContain("Ausgewählte Add-ons werden vor Aktivierung intern geprüft.");

    const privateFollowup = getPricingOrderFollowupContract("privat");
    const journalismFollowup = getPricingOrderFollowupContract("journalismus");
    expect(privateFollowup.expectedInitialStatus).toBe("submitted");
    expect(privateFollowup.requiresInternalReview).toBe(false);
    expect(journalismFollowup.expectedInitialStatus).toBe("submitted");
    expect(journalismFollowup.nextSecondaryRoute).toBe("/kontakt?kontext=journalismus-paket");
  });

  it("keeps institutional orders publicly orderable but internally reviewable", async () => {
    let municipalOrder: PreorderLeadRecord | null = null;

    await createPreorderLead(
      {
        package: "b2g_basis",
        email: "kommune@example.org",
        selectedAddOns: ["managed_governance", "reports_outcomes"],
      },
      {},
      {
        leadRepo: {
          insertLead: async (lead) => {
            municipalOrder = lead;
          },
        },
      },
    );

    expect(municipalOrder?.status).toBe("under_review");
    expect(municipalOrder?.requiresReview).toBe(true);
    expect(municipalOrder?.selectedAddOns).toEqual(["managed_governance", "reports_outcomes"]);
    expect(municipalOrder?.publicPriceSummary.addOnSelections).toEqual([
      "Managed Governance",
      "Reports / Outcomes",
    ]);
    expect(municipalOrder?.publicPriceSummary.notes).toContain("Bestellung wird vor Aktivierung intern geprüft.");

    const municipalFollowup = getPricingOrderFollowupContract("kommunen");
    expect(municipalFollowup.expectedInitialStatus).toBe("under_review");
    expect(municipalFollowup.requiresInternalReview).toBe(true);
    expect(municipalFollowup.nextPrimaryRoute).toBe("/account?preorder=thanks");
    expect(municipalFollowup.nextSecondaryRoute).toBe("/kontakt?kontext=institutionelles-paket");
    expect(municipalFollowup.reviewMessage).toContain("intern");
  });

  it("keeps role-aware post-login defaults aligned with order follow-up expectations", () => {
    expect(resolvePostLoginRedirect({ roles: ["user"] })).toBe("/account");
    expect(resolvePostLoginRedirect({ roles: ["journalist"] })).toBe("/account?context=journalismus");
    expect(resolvePostLoginRedirect({ roles: ["ngo"] })).toBe("/account?context=organisationen");
    expect(resolvePostLoginRedirect({ roles: ["politics"] })).toBe("/account?context=kommunen");
  });
});
