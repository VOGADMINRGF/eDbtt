import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadServerUser: vi.fn(),
  SiteHeader: vi.fn(),
  cookieGet: vi.fn(() => undefined),
  headerGet: vi.fn(() => null),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
  headers: vi.fn(async () => ({ get: mocks.headerGet })),
}));

vi.mock("@/lib/server/auth/loadServerUser", () => ({
  loadServerUser: (...args: unknown[]) => mocks.loadServerUser(...args),
}));

vi.mock("@/app/(components)/SiteHeader", () => ({
  SiteHeader: mocks.SiteHeader,
}));

import RootLayout from "@/app/layout";

const authenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "member@edebatte.org",
  name: "Ricky",
  roles: ["user"],
  accessTier: "citizenBasic",
  b2cPlanId: null,
  planSlug: "citizenBasic",
  engagementXp: null,
  engagementLevel: null,
  contributionCredits: null,
  vogMembershipStatus: null,
};

function findSiteHeader(node: ReactNode): React.ReactElement<{ initialUser?: unknown }> | null {
  if (!React.isValidElement(node)) return null;
  if (node.type === mocks.SiteHeader) {
    return node as React.ReactElement<{ initialUser?: unknown }>;
  }
  const children = (node.props as { children?: ReactNode }).children;
  for (const child of React.Children.toArray(children)) {
    const found = findSiteHeader(child);
    if (found) return found;
  }
  return null;
}

describe("RootLayout auth truth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headerGet.mockReturnValue(null);
    mocks.cookieGet.mockReturnValue(undefined);
  });

  it.each([
    ["confirmed guest", null],
    ["authenticated user", authenticatedUser],
    ["session or database error", undefined],
  ])("passes the %s server state to the global header", async (_label, initialUser) => {
    mocks.loadServerUser.mockResolvedValueOnce(initialUser);

    const layout = await RootLayout({ children: <div>Inhalt</div> });
    const header = findSiteHeader(layout);

    expect(header).not.toBeNull();
    expect(header?.props.initialUser).toBe(initialUser);
  });
});
