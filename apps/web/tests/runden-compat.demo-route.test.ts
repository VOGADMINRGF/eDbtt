import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import DemoRundenCompatibilityPage from "@/app/demo/runden/page";

describe("/demo/runden compatibility path", () => {
  it("Scenario A: base demo path redirects to productive /runden with compat marker", async () => {
    await expect(
      DemoRundenCompatibilityPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/runden?compat=demo_runden");
  });

  it("Scenario A: old demo path redirects to productive /runden with mapped view", async () => {
    await expect(
      DemoRundenCompatibilityPage({
        searchParams: Promise.resolve({ view: "active", persona: "citizen" }),
      }),
    ).rejects.toThrow("REDIRECT:/runden?compat=demo_runden&view=active");
  });

  it("Scenario C: unsupported legacy query stays explicit and never serves seed content", async () => {
    await expect(
      DemoRundenCompatibilityPage({
        searchParams: Promise.resolve({ view: "unsupported", persona: "journalist" }),
      }),
    ).rejects.toThrow("REDIRECT:/runden?compat=demo_runden");
  });
});
