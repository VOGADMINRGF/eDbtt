import { describe, expect, it, vi } from "vitest";
import { resolveRegisterBridge } from "@/app/register/registerFlowBridge";
import { resolvePostRegistrationRedirect } from "@/features/auth/roleExperienceContract";
import { PRICING_PATH_CONTRACT } from "@features/pricing";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import RegisterPreorderAliasPage from "@/app/register/preorder/page";

describe("auth registration flow contracts", () => {
  it("keeps register bridge copy aligned with the direct package path", () => {
    const bridge = resolveRegisterBridge("/order?segment=organisationen");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("direkten Paketpfad");
    expect(bridge?.text).toContain(PRICING_PATH_CONTRACT.primaryOrderPath);
    expect(bridge?.text).not.toContain("Wartelisten");
  });

  it("keeps /vormerken framed as legacy fallback in the register bridge", () => {
    const bridge = resolveRegisterBridge("/vormerken?segment=kommunen");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("Legacy-/Fallback-Pfad");
    expect(bridge?.text).toContain(PRICING_PATH_CONTRACT.legacyFallbackPath);
    expect(bridge?.text).toContain(PRICING_PATH_CONTRACT.primaryOrderPath);
  });

  it("keeps post-registration default route safe and deterministic", () => {
    expect(resolvePostRegistrationRedirect({ roleId: "citizens" })).toBe("/swipes?welcome=1");
    expect(resolvePostRegistrationRedirect({ requestedRedirect: "https://evil.example" })).toBe("/swipes?welcome=1");
    expect(resolvePostRegistrationRedirect({ requestedRedirect: "/vormerken?segment=journalismus" })).toBe(
      "/vormerken?segment=journalismus",
    );
    expect(resolvePostRegistrationRedirect({ requestedRedirect: "/account?welcome=1" })).toBe("/account?welcome=1");
  });

  it("keeps /register/preorder as canonical alias to /order", () => {
    expect(() =>
      RegisterPreorderAliasPage({
        searchParams: {
          plan: "b2g_pro",
          segment: "kommunen",
          next: "/account?welcome=1",
        },
      }),
    ).toThrow("REDIRECT:/order?paket=b2g_pro&segment=kommunen&next=%2Faccount%3Fwelcome%3D1&source=register");
  });

  it("drops unsafe next values on /register/preorder alias", () => {
    expect(() =>
      RegisterPreorderAliasPage({
        searchParams: {
          plan: "start",
          next: "javascript:alert(1)",
        },
      }),
    ).toThrow("REDIRECT:/order?paket=start&source=register");
  });
});
