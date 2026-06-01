import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  useLoginFlow: vi.fn(),
}));

vi.mock("@/hooks/useLoginFlow", () => ({
  useLoginFlow: (...args: unknown[]) => mocks.useLoginFlow(...args),
}));

import { LoginPageShell } from "@/components/auth/LoginPageShell";
import { HeaderLoginInline } from "@/components/auth/HeaderLoginInline";

describe("login page shell", () => {
  it("shows an explicit choice between authenticator app and email code", () => {
    mocks.useLoginFlow.mockReturnValue({
      step: "twofactor",
      method: "otp",
      availableMethods: ["otp", "email"],
      expiresAt: null,
      loading: false,
      requestingEmail: false,
      switchingMethod: false,
      allowEmailFallback: true,
      error: null,
      submitCredentials: vi.fn(),
      submitTwoFactor: vi.fn(),
      selectTwoFactorMethod: vi.fn().mockResolvedValue(true),
      requestEmailCode: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
    });

    const html = renderToStaticMarkup(<LoginPageShell forceTwoFactor />);

    expect(html).toContain("Sicherheitscode erhalten über");
    expect(html).toContain("Sicherheitscode");
    expect(html).toContain("Authenticator-App");
    expect(html).toContain("Code per E-Mail");
    expect(html).toContain("Bestätigen");
    expect(html).toContain("Zurück");
    expect(html).not.toContain("OTP");
    expect(html).not.toContain("Authenticator token");
  });

  it("shows the same visible method choice in the header login flow", () => {
    mocks.useLoginFlow.mockReturnValue({
      step: "twofactor",
      method: "otp",
      availableMethods: ["otp", "email"],
      expiresAt: null,
      loading: false,
      requestingEmail: false,
      switchingMethod: false,
      allowEmailFallback: true,
      error: null,
      submitCredentials: vi.fn(),
      submitTwoFactor: vi.fn(),
      selectTwoFactorMethod: vi.fn().mockResolvedValue(true),
      requestEmailCode: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
    });

    const html = renderToStaticMarkup(<HeaderLoginInline initialOpen />);

    expect(html).toContain("Sicherheitscode erhalten über");
    expect(html).toContain("Authenticator-App");
    expect(html).toContain("Code per E-Mail");
    expect(html).toContain("Ich habe keine Authenticator-App");
    expect(html).toContain("Bestätigen");
    expect(html).toContain("Zurück");
    expect(html).not.toContain("OTP");
    expect(html).not.toContain("Token");
    expect(html).not.toContain("Provider");
  });
});
