import { z } from "zod";

export const PAYMENT_PROVIDER_VALUES = [
  "stripe",
  "manual_invoice",
  "disabled",
] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_VALUES)[number];

export const PAYMENT_PROVIDER_STATUSES = [
  "ready",
  "missing_config",
  "disabled",
] as const;

export type PaymentProviderStatus = (typeof PAYMENT_PROVIDER_STATUSES)[number];

export const PAYMENT_PROVIDER_AUTH_MODES = [
  "oauth",
  "server_secret",
  "manual_review",
  "disabled",
] as const;

export type PaymentProviderAuthMode = (typeof PAYMENT_PROVIDER_AUTH_MODES)[number];

export const BILLING_ENVIRONMENTS = [
  "production",
  "preview",
  "development",
  "test",
] as const;

export type BillingEnvironment = (typeof BILLING_ENVIRONMENTS)[number];

export const CHECKOUT_SESSION_STATUSES = [
  "draft",
  "checkout_pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
] as const;

export type CheckoutSessionStatus = (typeof CHECKOUT_SESSION_STATUSES)[number];

export const BILLING_STATUS_VALUES = [
  "free",
  "manual_contract",
  "checkout_pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "disabled",
] as const;

export type BillingStatusV2 = (typeof BILLING_STATUS_VALUES)[number];

export const PaymentProviderCapabilitiesSchema = z
  .object({
    selfServiceCheckout: z.boolean(),
    manualInvoiceFallback: z.boolean(),
    auditTrail: z.boolean(),
    webhookSettlement: z.boolean(),
  })
  .strict();

export type PaymentProviderCapabilities = z.infer<
  typeof PaymentProviderCapabilitiesSchema
>;

export const PaymentProviderContractSchema = z
  .object({
    provider: z.enum(PAYMENT_PROVIDER_VALUES),
    status: z.enum(PAYMENT_PROVIDER_STATUSES),
    authMode: z.enum(PAYMENT_PROVIDER_AUTH_MODES),
    capabilities: PaymentProviderCapabilitiesSchema,
    environment: z.enum(BILLING_ENVIRONMENTS),
    missingConfig: z.array(z.string().trim().min(1)),
  })
  .strict();

export type PaymentProviderContract = z.infer<
  typeof PaymentProviderContractSchema
>;

export const CheckoutSessionSchema = z
  .object({
    id: z.string().trim().min(1),
    planId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    amount: z.number().nonnegative(),
    currency: z.string().trim().length(3),
    status: z.enum(CHECKOUT_SESSION_STATUSES),
    providerSessionId: z.string().trim().min(1).nullable(),
    returnUrl: z.string().trim().min(1),
    cancelUrl: z.string().trim().min(1),
  })
  .strict();

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;

export const BillingStatusSchema = z.enum(BILLING_STATUS_VALUES);

export function resolveBillingEnvironment(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): BillingEnvironment {
  const nodeEnv = String(env.NODE_ENV ?? "").trim().toLowerCase();
  const vercelEnv = String(env.VERCEL_ENV ?? "").trim().toLowerCase();
  if (nodeEnv === "test") return "test";
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  return "development";
}

export function resolvePaymentProviderContract(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): PaymentProviderContract {
  const configuredMode = String(env.PAYMENT_PROVIDER_MODE ?? "").trim().toLowerCase();
  const provider: PaymentProviderId =
    configuredMode === "stripe"
      ? "stripe"
      : configuredMode === "disabled"
        ? "disabled"
        : "manual_invoice";
  const environment = resolveBillingEnvironment(env);

  if (provider === "disabled") {
    return PaymentProviderContractSchema.parse({
      provider,
      status: "disabled",
      authMode: "disabled",
      capabilities: {
        selfServiceCheckout: false,
        manualInvoiceFallback: false,
        auditTrail: true,
        webhookSettlement: false,
      },
      environment,
      missingConfig: [],
    });
  }

  if (provider === "manual_invoice") {
    return PaymentProviderContractSchema.parse({
      provider,
      status: "ready",
      authMode: "manual_review",
      capabilities: {
        selfServiceCheckout: false,
        manualInvoiceFallback: true,
        auditTrail: true,
        webhookSettlement: false,
      },
      environment,
      missingConfig: [],
    });
  }

  const requiredConfig = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ] as const;
  const missingConfig = requiredConfig.filter((key) => !String(env[key] ?? "").trim());

  return PaymentProviderContractSchema.parse({
    provider: "stripe",
    status: missingConfig.length > 0 ? "missing_config" : "ready",
    authMode: "server_secret",
    capabilities: {
      selfServiceCheckout: missingConfig.length === 0,
      manualInvoiceFallback: true,
      auditTrail: true,
      webhookSettlement: missingConfig.length === 0,
    },
    environment,
    missingConfig,
  });
}

export function canStartSelfServiceCheckout(contract: PaymentProviderContract): boolean {
  return contract.provider === "stripe" && contract.status === "ready";
}

export function deriveBillingStatusFromCheckoutSession(
  session: Pick<CheckoutSession, "status">,
): BillingStatusV2 {
  switch (session.status) {
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "refund_pending":
      return "refund_pending";
    case "checkout_pending":
      return "checkout_pending";
    case "draft":
    default:
      return "free";
  }
}
