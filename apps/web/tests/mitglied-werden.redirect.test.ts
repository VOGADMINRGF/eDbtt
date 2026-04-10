import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import MitgliedWerdenPage from "@/app/mitglied-werden/page";

describe("/mitglied-werden redirect", () => {
  it("redirects legacy membership landing to canonical /pricing", () => {
    expect(() => MitgliedWerdenPage()).toThrow("REDIRECT:/pricing");
  });
});
