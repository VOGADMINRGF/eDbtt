import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import BeitrittPage from "@/app/beitritt/page";

describe("/beitritt redirect", () => {
  it("redirects legacy membership entry to canonical /pricing", () => {
    expect(() => BeitrittPage()).toThrow("REDIRECT:/pricing");
  });
});
