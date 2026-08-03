import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveHeaderAuthTruth } from "@features/auth/headerAuthTruth";

const user = { id: "user-1", name: "Ricky" };

describe("global SiteHeader auth truth", () => {
  it("uses the server-authenticated user while client revalidation is pending", () => {
    expect(
      resolveHeaderAuthTruth({
        initialUser: user,
        currentUser: null,
        currentUserLoading: true,
      }),
    ).toEqual({ status: "authenticated", user });
  });

  it("keeps guest and unknown states distinct", () => {
    expect(
      resolveHeaderAuthTruth({
        initialUser: null,
        currentUser: null,
        currentUserLoading: true,
      }),
    ).toEqual({ status: "guest", user: null });
    expect(
      resolveHeaderAuthTruth({
        initialUser: undefined,
        currentUser: null,
        currentUserLoading: true,
      }),
    ).toEqual({ status: "unknown", user: undefined });
  });

  it("adopts the shared client revalidation once it resolves", () => {
    expect(
      resolveHeaderAuthTruth({
        initialUser: user,
        currentUser: null,
        currentUserLoading: false,
      }),
    ).toEqual({ status: "guest", user: null });
    expect(
      resolveHeaderAuthTruth({
        initialUser: null,
        currentUser: user,
        currentUserLoading: false,
      }),
    ).toEqual({ status: "authenticated", user });
  });

  it("does not fall back to an initial guest after client resolution fails", () => {
    expect(
      resolveHeaderAuthTruth({
        initialUser: null,
        currentUser: undefined,
        currentUserLoading: false,
      }),
    ).toEqual({ status: "unknown", user: undefined });
  });

  it("binds Login and the neutral loading state to the resolved truth", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"),
      "utf8",
    );
    expect(source).toContain('authTruth.status === "guest"');
    expect(source).toContain('authTruth.status === "unknown"');
    expect(source).toContain("useCurrentUser(initialUser)");
    expect(source).toContain("Accountstatus wird geprüft");
    expect(source).toContain("Accountstatus derzeit nicht verfügbar");
    expect(source).not.toContain("animate-pulse");
    expect(source).not.toContain("{!user && (");
  });
});
