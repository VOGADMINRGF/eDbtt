import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  useLoginFlow: vi.fn(),
}));

vi.mock("@/hooks/useLoginFlow", () => ({
  useLoginFlow: (...args: unknown[]) => mocks.useLoginFlow(...args),
}));

import { LoginPageShell } from "@/components/auth/LoginPageShell";

describe("login page shell", () => {
  it("shows the email-code alternative next to the security code field", () => {
    mocks.useLoginFlow.mockReturnValue({
      step: "twofactor",
      method: "totp",
      expiresAt: null,
      loading: false,
      requestingEmail: false,
      allowEmailFallback: true,
      error: null,
      submitCredentials: vi.fn(),
      submitTwoFactor: vi.fn(),
      requestEmailCode: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
    });

    const html = renderToStaticMarkup(<LoginPageShell forceTwoFactor />);

    expect(html).toContain("Sicherheitscode");
    expect(html).toContain("Code per E-Mail senden");
    expect(html).toContain("Bestätigen");
    expect(html).toContain("Zurück");
    expect(html).not.toContain("OTP");
    expect(html).not.toContain("Authenticator token");
  });
});
