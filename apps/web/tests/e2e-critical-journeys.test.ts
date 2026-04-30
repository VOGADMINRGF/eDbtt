import path from "node:path";
import { existsSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canTransitionPricingOrderStatus,
  getPricingOrderFollowupContract,
  type CreatePreorderLeadInput,
  type PreorderLeadRecord,
} from "@features/pricing";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import {
  getRoleExperienceContract,
  resolvePostLoginRedirect,
} from "@/features/auth/roleExperienceContract";

const APP_DIR = path.resolve(process.cwd(), "src/app");

async function createLead(payload: CreatePreorderLeadInput) {
  let record: PreorderLeadRecord | null = null;
  const result = await createPreorderLead(payload, {}, {
    leadRepo: {
      insertLead: async (lead) => {
        record = lead;
        return lead.orderId;
      },
    },
  });
  return { result, record };
}

describe("e2e critical journeys", () => {
  it("A) Bürger:innen journey: registration/login target, package order and follow-up are coherent", async () => {
    expect(resolvePostLoginRedirect({ roles: ["user"] })).toBe("/account");
    expect(getRoleExperienceContract("citizens").expectedPostRegistrationRoute).toBe("/account?welcome=1");

    const { result, record } = await createLead({
      package: "basis",
      email: "citizen@example.org",
      segment: "privat",
    });

    expect(result.ok).toBe(true);
    expect(record?.status).toBe("submitted");
    expect(record?.requiresReview).toBe(false);
    expect(record?.publicPriceSummary.packagePriceLabel).toContain("4,99 €");

    const followup = getPricingOrderFollowupContract("privat");
    expect(followup.expectedInitialStatus).toBe("submitted");
    expect(followup.requiresInternalReview).toBe(false);
    expect(followup.nextPrimaryRoute).toBe("/account?preorder=thanks");
  });

  it("B) freie Journalist:innen journey: package + optional facts/add-ons remain directly orderable", async () => {
    expect(resolvePostLoginRedirect({ roles: ["journalist"] })).toBe("/account?context=journalismus");

    const { result, record } = await createLead({
      package: "journal_pro",
      email: "media@example.org",
      segment: "journalismus",
      selectedAddOns: ["faktencheck_kontingent", "companion_kommunikation"],
      selectedOptions: { factcheckQuota: "plus" },
    });

    expect(result.ok).toBe(true);
    expect(record?.status).toBe("submitted");
    expect(record?.requiresReview).toBe(false);
    expect(record?.publicPriceSummary.addOnSelections).toContain("Optionales Faktencheck-Kontingent");
    expect(record?.publicPriceSummary.notes).toContain("Optionales Faktencheck-Kontingent: plus");
    expect(record?.publicPriceSummary.notes).toContain("Ausgewählte Add-ons werden vor Aktivierung intern geprüft.");

    const followup = getPricingOrderFollowupContract("journalismus");
    expect(followup.expectedInitialStatus).toBe("submitted");
    expect(followup.nextSecondaryRoute).toBe("/kontakt?kontext=journalismus-paket");
  });

  it("C) Organisationen journey: order is direct from public UX but starts in reviewable status", async () => {
    expect(resolvePostLoginRedirect({ roles: ["ngo"] })).toBe("/account?context=organisationen");

    const { result, record } = await createLead({
      package: "b2b_pro",
      email: "org@example.org",
      segment: "organisationen",
      selectedAddOns: ["managed_governance", "reports_outcomes"],
    });

    expect(result.ok).toBe(true);
    expect(record?.status).toBe("under_review");
    expect(record?.requiresReview).toBe(true);
    expect(record?.selectedAddOns).toEqual(["managed_governance", "reports_outcomes"]);
    expect(record?.publicPriceSummary.notes).toContain("Bestellung wird vor Aktivierung intern geprüft.");

    const followup = getPricingOrderFollowupContract("organisationen");
    expect(followup.expectedInitialStatus).toBe("under_review");
    expect(followup.requiresInternalReview).toBe(true);
    expect(followup.reviewMessage).toMatch(/intern/i);
  });

  it("D) Kommunen journey: focused package/add-on choice and review-aware follow-up stay coherent", async () => {
    expect(resolvePostLoginRedirect({ roles: ["politics"] })).toBe("/account?context=kommunen");

    const { result, record } = await createLead({
      package: "b2g_basis",
      email: "kommune@example.org",
      segment: "kommunen",
      selectedAddOns: ["event_begleitung"],
    });

    expect(result.ok).toBe(true);
    expect(record?.status).toBe("under_review");
    expect(record?.requiresReview).toBe(true);
    expect(record?.publicPriceSummary.addOnSelections).toContain("Event-Begleitung");
    expect(record?.publicPriceSummary.notes).toContain("Ausgewählte Add-ons werden im Folgeprozess abgestimmt.");

    const followup = getPricingOrderFollowupContract("kommunen");
    expect(followup.expectedInitialStatus).toBe("under_review");
    expect(followup.reviewMessage).toMatch(/intern/i);
  });

  it("E) Admin / Backoffice journey: admin routing, order surface and state transitions are available", () => {
    expect(resolvePostLoginRedirect({ roles: ["admin"] })).toBe("/admin");
    expect(resolvePostLoginRedirect({ roles: ["finance"] })).toBe("/admin");

    const adminContract = getRoleExperienceContract("admin_backoffice");
    expect(adminContract.visibility.adminDashboard).toBe("visible");
    expect(adminContract.visibility.pricingOrderAdmin).toBe("visible");

    expect(existsSync(path.join(APP_DIR, "admin/pricing/orders/page.tsx"))).toBe(true);
    expect(existsSync(path.join(APP_DIR, "api/admin/pricing/orders/route.ts"))).toBe(true);

    expect(canTransitionPricingOrderStatus("under_review", "approved")).toBe(true);
    expect(canTransitionPricingOrderStatus("approved", "active")).toBe(true);
    expect(canTransitionPricingOrderStatus("active", "paused")).toBe(true);
    expect(canTransitionPricingOrderStatus("active", "submitted")).toBe(false);
    expect(canTransitionPricingOrderStatus("under_review", "paused")).toBe(false);
  });
});
