// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authState: {} as Record<string, unknown>,
  routerRefresh: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: mocks.routerRefresh }),
}));

vi.mock("@/context/LocaleContext", () => ({
  useLanguagePreferences: () => ({
    uiLocale: "de",
    readingLocale: "de",
    setUiLocale: vi.fn(),
  }),
}));

vi.mock("@/lib/i18n/autoTranslate", () => ({
  AUTO_TRANSLATE_LOCALES: [],
  isPublicPathname: () => true,
  mapTranslatableStrings: (value: unknown) => value,
  useAutoTranslateText: () => (text: string) => text,
}));

vi.mock("@/config/locales", () => ({
  getLocaleConfig: () => ({ label: "Deutsch", flagEmoji: "🇩🇪" }),
  isCoreLocale: () => true,
  isSupportedLocale: () => true,
}));

vi.mock("@features/i18n/languages", () => ({
  UI_LANGS: [{ code: "de", label: "Deutsch" }],
}));

vi.mock("@/components/ThemeToggle", () => ({ default: () => <button type="button">Theme</button> }));
vi.mock("@/features/wrapper/mobileAppShellContract", () => ({
  classifyMobileAppShellPath: () => ({ compactHeader: false }),
}));
vi.mock("@/hooks/auth", () => ({
  useCurrentUser: () => mocks.authState,
}));

import { SiteHeader } from "@/app/(components)/SiteHeader";

const user = {
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

function setAuthState(next: Record<string, unknown>) {
  mocks.authState = {
    user: undefined,
    loading: false,
    error: undefined,
    refresh: vi.fn(),
    confirmLoggedOut: vi.fn(),
    ...next,
  };
}

describe("SiteHeader auth UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows Login on desktop and mobile only for a confirmed guest", () => {
    setAuthState({ user: null });
    render(<SiteHeader initialUser={null} />);

    expect(screen.getByRole("link", { name: "Login" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Profil" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(screen.getByRole("link", { name: "Anmelden" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Mein Konto" })).toBeNull();
  });

  it("shows account actions without any parallel Login on desktop or mobile", () => {
    setAuthState({ user });
    render(<SiteHeader initialUser={user} />);

    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Account-Menü öffnen" }));
    expect(screen.getByRole("link", { name: "Profil" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mein Konto" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });

  it("renders an accessible neutral error state without Login or profile claims", () => {
    setAuthState({ user: undefined, error: "auth_load_failed" });
    render(<SiteHeader />);

    expect(screen.getByRole("status", { name: "Accountstatus derzeit nicht verfügbar" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    expect(screen.getAllByRole("status", { name: "Accountstatus derzeit nicht verfügbar" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Anmelden" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Profil" })).toBeNull();
  });

  it("confirms guest truth after a successful logout", async () => {
    const confirmLoggedOut = vi.fn();
    setAuthState({ user, confirmLoggedOut });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<SiteHeader initialUser={user} />);

    fireEvent.click(screen.getByRole("button", { name: "Account-Menü öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => expect(confirmLoggedOut).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(mocks.routerRefresh).toHaveBeenCalledTimes(1);
  });
});
