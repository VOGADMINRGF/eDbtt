import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
  })),
}));

vi.mock("@/utils/session", () => ({
  createSession: vi.fn(async () => "token"),
}));

import { DEFAULT_REDIRECT, sanitizeRedirect } from "@/app/api/auth/sharedAuth";

describe("auth shared redirect contract", () => {
  it("keeps internal paths and strips external origin", () => {
    expect(sanitizeRedirect("/account?tab=security")).toBe("/account?tab=security");
    expect(sanitizeRedirect("https://example.org/account?tab=security")).toBe(
      "/account?tab=security",
    );
  });

  it("falls back for invalid or unsafe redirect values", () => {
    expect(sanitizeRedirect("javascript:alert(1)")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect(null)).toBe(DEFAULT_REDIRECT);
  });
});
