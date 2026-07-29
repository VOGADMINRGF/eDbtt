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
import { resolvePostLoginRedirect } from "@/features/auth/roleExperienceContract";

describe("auth shared redirect contract", () => {
  it("keeps internal paths and rejects external origins", () => {
    expect(sanitizeRedirect("/account?tab=security")).toBe("/account?tab=security");
    expect(sanitizeRedirect("https://example.org/account?tab=security")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("//example.org/account")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("/\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("/\\\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("\\\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("/account\\security")).toBe(DEFAULT_REDIRECT);
  });

  it("falls back for invalid or unsafe redirect values", () => {
    expect(sanitizeRedirect("javascript:alert(1)")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect("")).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect(null)).toBe(DEFAULT_REDIRECT);
  });

  it("rejects login loops while preserving a safe internal next target", () => {
    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/admin/marketing",
        roles: ["admin"],
      }),
    ).toBe("/admin/marketing");
    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/login?step=twofactor&next=%2Fadmin",
        roles: ["admin"],
      }),
    ).toBe("/admin");
    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/login/",
        roles: ["user"],
      }),
    ).toBe("/account");
  });
});
