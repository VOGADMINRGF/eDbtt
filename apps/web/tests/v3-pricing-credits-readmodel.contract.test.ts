import { describe, expect, it } from "vitest";

import {
  V3_PRICING_REAL_HREFS,
  buildV3PricingCreditsReadModel,
} from "@/features/admin/v3PricingCreditsReadModel";

describe("v3 pricing credits readmodel contract", () => {
  it("builds a visible operational-basic pricing, credits and cost-gate slice from existing repo contracts", () => {
    const readModel = buildV3PricingCreditsReadModel({
      env: {
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        PAYMENT_PROVIDER_MODE: "manual_invoice",
      },
    });

    expect(readModel.sectionStatus).toBe("operational_basic");
    expect(readModel.summary.packageCount).toBeGreaterThan(0);
    expect(readModel.summary.packageFamilies).toBe(4);
    expect(readModel.summary.costGates).toBe(readModel.costGates.length);
    expect(readModel.summary.wiredCostGates).toBeGreaterThan(0);
    expect(readModel.billingTruth.provider).toBe("manual_invoice");
    expect(readModel.billingTruth.manualInvoiceFallback).toBe(true);
    expect(readModel.billingTruth.selfServiceCheckout).toBe(false);
  });

  it("keeps every package family and cost gate on real surfaces, real guardrails and real follow-up slices", () => {
    const readModel = buildV3PricingCreditsReadModel();

    for (const family of readModel.packageFamilies) {
      expect(V3_PRICING_REAL_HREFS).toContain(family.publicHref);
      expect(family.guardrails.length).toBeGreaterThan(0);
      expect(family.packageCount).toBeGreaterThan(0);
    }

    for (const gate of readModel.costGates) {
      if (gate.adminHref) expect(V3_PRICING_REAL_HREFS).toContain(gate.adminHref);
      if (gate.publicHref) expect(V3_PRICING_REAL_HREFS).toContain(gate.publicHref);
      expect(gate.repoEvidence.length).toBeGreaterThan(0);
      expect(gate.tests.length).toBeGreaterThan(0);
      expect(gate.guardrails.length).toBeGreaterThan(0);
      expect(gate.nextSliceId).toMatch(/^V3-/);
    }
  });
});
