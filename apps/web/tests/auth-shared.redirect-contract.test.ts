import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
  })),
}));

vi.mock("@/utils/session", () => ({
  createSession: vi.fn(async () => "token"),
}));

import { sanitizeRedirect } from "@/app/api/auth/sharedAuth";
import { resolvePostLoginRedirect } from "@/features/auth/roleExperienceContract";
import { normalizeInternalRedirectPath } from "@/features/create/finalizeRedirect";

const BROWSER_TEST_ORIGIN = "https://browser.example";
const UNSAFE_REDIRECT_CASES = [
  ["absolute URL", "https://evil.example/account"],
  ["protocol-relative URL", "//evil.example/account"],
  ["single backslash before host", "/\\evil.example"],
  ["double backslash before host", "/\\\\evil.example"],
  ["leading backslash", "\\evil.example"],
  ["backslash in internal path", "/account\\security"],
  ["encoded backslash", "/%5Cevil.example"],
  ["double encoded backslash", "/%255Cevil.example"],
  ["tab before second slash", "/\t/evil.example"],
  ["encoded tab before second slash", "/%09/evil.example"],
  ["carriage return before second slash", "/\r/evil.example"],
  ["encoded carriage return before second slash", "/%0D/evil.example"],
  ["line feed before second slash", "/\n/evil.example"],
  ["encoded line feed before second slash", "/%0A/evil.example"],
  ["NUL before second slash", "/\u0000/evil.example"],
  ["encoded NUL before second slash", "/%00/evil.example"],
  ["C0 start of heading before second slash", "/\u0001/evil.example"],
  ["C0 unit separator before second slash", "/\u001f/evil.example"],
  ["DEL before second slash", "/\u007f/evil.example"],
  ["encoded DEL before second slash", "/%7F/evil.example"],
  ["tab and backslash origin escape", "/\t\\evil.example"],
  ["line feed between leading slashes", "/\n/evil.example"],
    ["malformed protocol-relative URL", "//["],
  ["lone percent", "/%"],
  ["invalid percent octet", "/%GG"],
  ["truncated UTF-8", "/%E2%82"],
] as const;
const SAFE_REDIRECT_CASES = [
  ["/account", "/account"],
  ["/account?tab=security", "/account?tab=security"],
  ["/account?tab=security#sessions", "/account?tab=security#sessions"],
  ["/admin/marketing#review", "/admin/marketing#review"],
  ["/search?q=region%20berlin#results", "/search?q=region%20berlin#results"],
] as const;

describe("auth shared redirect contract", () => {
  it.each(UNSAFE_REDIRECT_CASES)("rejects %s", (_label, candidate) => {
    expect(sanitizeRedirect(candidate)).toBeNull();
  });

  it.each(SAFE_REDIRECT_CASES)("keeps safe internal redirect %s", (candidate, expected) => {
    expect(sanitizeRedirect(candidate)).toBe(expected);
  });

  it("never returns an accepted value that browser URL semantics resolve cross-origin", () => {
    const candidates = [
      ...UNSAFE_REDIRECT_CASES.map(([, candidate]) => candidate),
      ...SAFE_REDIRECT_CASES.map(([candidate]) => candidate),
    ];

    for (const candidate of candidates) {
      const normalized = normalizeInternalRedirectPath(candidate);
      if (!normalized) continue;
      expect(new URL(normalized, BROWSER_TEST_ORIGIN).origin).toBe(BROWSER_TEST_ORIGIN);
    }
  });

  it("returns explicit rejection for invalid or unsafe redirect values", () => {
    expect(sanitizeRedirect("javascript:alert(1)")).toBeNull();
    expect(sanitizeRedirect("")).toBeNull();
    expect(sanitizeRedirect(null)).toBeNull();
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
