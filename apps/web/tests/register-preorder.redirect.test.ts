import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import RegisterPreorderAliasPage from "@/app/register/preorder/page";

describe("/register/preorder redirect", () => {
  it("redirects legacy preorder route to canonical /order and maps plan=>paket", () => {
    expect(() =>
      RegisterPreorderAliasPage({
        searchParams: {
          plan: "pro",
          next: "/account?welcome=1",
        },
      }),
    ).toThrow("REDIRECT:/order?paket=pro&next=%2Faccount%3Fwelcome%3D1&source=register");
  });

  it("drops unsafe next values during redirect sanitization", () => {
    expect(() =>
      RegisterPreorderAliasPage({
        searchParams: {
          plan: "start",
          next: "https://evil.example/path",
        },
      }),
    ).toThrow("REDIRECT:/order?paket=start&source=register");
  });
});
