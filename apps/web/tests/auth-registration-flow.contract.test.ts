import { describe, expect, it, vi } from "vitest";
import { resolveRegisterBridge } from "@/app/register/registerFlowBridge";
import { resolvePostRegistrationRedirect } from "@/features/auth/roleExperienceContract";

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
  it("keeps register bridge copy for pricing/vormerken contexts", () => {
    const bridge = resolveRegisterBridge("/pricing?segment=organisationen");
    expect(bridge).not.toBeNull();
    expect(bridge?.text).toContain("Pricing/Order-Flow");
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
