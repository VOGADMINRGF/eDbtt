import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getMembershipActivationTruth } from "@features/pricing";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  getAccountOverview: vi.fn(),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@features/account/service", () => ({
  getAccountOverview: (...args: unknown[]) => mocks.getAccountOverview(...args),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

import PaymentPage from "@/app/account/payment/page";

const ACTIVATION_TRUTH = getMembershipActivationTruth("de");

describe("/account/payment page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "user-1" });
    mocks.getAccountOverview.mockResolvedValue({
      paymentProfile: {
        ibanMasked: "DE12••••3456",
        holderName: "Mara Beispiel",
        bic: "TESTDEFFXXX",
      },
      payment: {
        note: "Mandat vorbereitet",
      },
      membership: {
        status: "waiting_payment",
        contributionLabel: "5,63 € / Monat",
        paymentReference: "VOG-REF-1",
        paymentInfo: {
          mandateStatus: "pending",
        },
      },
    });
  });

  it("keeps payment profile and package activation clearly separated", async () => {
    const html = renderToStaticMarkup(await PaymentPage());

    expect(html).toContain("Standardkonto &amp; Zahlungsart");
    expect(html).toContain(ACTIVATION_TRUTH.paymentProfileHint);
    expect(html).toContain(ACTIVATION_TRUTH.membershipScopeHint);
  });
});
