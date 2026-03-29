import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import AnlassraumAliasPage from "@/app/anlassraum/page";

describe("/anlassraum alias route", () => {
  it("redirects to canonical /runden without query by default", async () => {
    await expect(
      AnlassraumAliasPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/runden");
  });

  it("preserves compatible query parameters for non-breaking parity", async () => {
    await expect(
      AnlassraumAliasPage({
        searchParams: Promise.resolve({
          view: "active",
          compat: "demo_runden",
          source: "alias_handoff",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/runden?compat=demo_runden&source=alias_handoff&view=active");
  });

  it("preserves repeated query keys for wrapper compatibility", async () => {
    await expect(
      AnlassraumAliasPage({
        searchParams: Promise.resolve({
          view: "results",
          tag: ["mobilitaet", "verkehr"],
        }),
      }),
    ).rejects.toThrow("REDIRECT:/runden?tag=mobilitaet&tag=verkehr&view=results");
  });
});
