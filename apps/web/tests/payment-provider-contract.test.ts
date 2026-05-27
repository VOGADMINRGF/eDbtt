import { describe, expect, it } from "vitest";
import {
  canStartSelfServiceCheckout,
  resolvePaymentProviderContract,
} from "@features/pricing";

describe("payment-provider-contract", () => {
  it("defaults to manual invoice without hidden self-service claims", () => {
    const provider = resolvePaymentProviderContract({});

    expect(provider).toMatchObject({
      provider: "manual_invoice",
      status: "ready",
      authMode: "manual_review",
      capabilities: {
        selfServiceCheckout: false,
        manualInvoiceFallback: true,
        auditTrail: true,
      },
    });
    expect(canStartSelfServiceCheckout(provider)).toBe(false);
  });

  it("marks stripe as missing_config until required secrets exist", () => {
    const provider = resolvePaymentProviderContract({
      PAYMENT_PROVIDER_MODE: "stripe",
      STRIPE_SECRET_KEY: "sk_test_123",
    });

    expect(provider.provider).toBe("stripe");
    expect(provider.status).toBe("missing_config");
    expect(provider.missingConfig).toContain("STRIPE_PUBLISHABLE_KEY");
    expect(provider.missingConfig).toContain("STRIPE_WEBHOOK_SECRET");
    expect(canStartSelfServiceCheckout(provider)).toBe(false);
  });
});
