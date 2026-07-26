"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguagePreferences } from "@/context/LocaleContext";
import {
  AUTO_TRANSLATE_LOCALES,
  isPublicPathname,
  mapTranslatableStrings,
  useAutoTranslateText,
} from "@/lib/i18n/autoTranslate";
import { UI_LANGS, type LanguageCode } from "@features/i18n/languages";
import { getLocaleConfig, isCoreLocale, isSupportedLocale } from "@/config/locales";
import { useCurrentUser, clearCachedUser, primeCachedUser } from "@/hooks/auth";
import type { AuthUser } from "@/hooks/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { classifyMobileAppShellPath } from "@/features/wrapper/mobileAppShellContract";

type NavItem = {
  id: string;
  href: string;
  label: string;
};

function buildPrimaryNav(user: AuthUser | null | undefined): NavItem[] {
  return [
    {
      id: "contribute",
      href: "/create?intent=contribute",
      label: "Beitragen",
    },
    {
      id: "topics",
      href: "/themen",
      label: "Themen",
    },
    {
      id: "rounds",
      href: "/runden?intent=create",
      label: "Anlassraum / Event",
    },
    {
      id: "organization",
      href: user ? "/account/organization/dashboard" : "/account/organization",
      label: "Organisation",
    },
  ];
}

function deriveInitials(value: string) {
  const parts = value.trim().split(" ").filter(Boolean);
  if (!parts.length) return "DU";
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const second = parts[1]?.[0]?.toUpperCase() ?? "";
  return `${first}${second}` || first || "DU";
}

function isActiveNavHref(pathname: string | null, href: string) {
  const normalizedHref = href.split("?")[0] ?? href;
  if (!pathname) return false;
  if (normalizedHref === "/") return pathname === "/";
  return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
}

export function SiteHeader({ initialUser }: { initialUser?: AuthUser | null }) {
  const { uiLocale, setUiLocale, readingLocale } = useLanguagePreferences();
  const { user } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isSwipeFocusPath = pathname?.startsWith("/swipes") || pathname?.startsWith("/demo/swipes");
  const mobileShellPolicy = useMemo(() => classifyMobileAppShellPath(pathname), [pathname]);
  const compactMobileShell = mobileShellPolicy.compactHeader;
  const [loggingOut, setLoggingOut] = useState(false);
  const avatarLabel = deriveInitials(user?.name || user?.email || "Du");
  const avatarUrl = user?.avatarUrl ?? null;
  const headerRef = useRef<HTMLElement | null>(null);
  const localePanelRef = useRef<HTMLDivElement | null>(null);

  const activeLocaleConfig = useMemo(
    () => getLocaleConfig(uiLocale),
    [uiLocale],
  );
  const localeLabel = useMemo(
    () => uiLocale.toUpperCase(),
    [uiLocale],
  );
  const translationPending =
    isPublicPathname(pathname) && AUTO_TRANSLATE_LOCALES.includes(uiLocale);
  const t = useAutoTranslateText({
    locale: uiLocale,
    namespace: "site-header",
  });
  const navLinks = useMemo(() => {
    const baseLinks = buildPrimaryNav(user ?? null);
    if (uiLocale === "de") return baseLinks;
    return baseLinks.map((item) => mapTranslatableStrings(item, t, { namespace: "nav" }));
  }, [uiLocale, t, user]);

  const resolveHref = (href: string) => {
    if (href === "/referenzarchitektur") return `/${uiLocale}${href}`;
    return href;
  };
  const statusLabel = t("Auto-Übersetzung", "status.auto");
  const localeOptions = UI_LANGS.flatMap((lang) => {
    if (!isCoreLocale(lang.code)) return [];
    const cfg = getLocaleConfig(lang.code);
    return [
      {
        code: lang.code,
        label: cfg.label || lang.label,
        flag: cfg.flagEmoji || "🏳️",
      },
    ];
  });

  useEffect(() => {
    if (initialUser !== undefined) {
      primeCachedUser(initialUser ?? null);
    }
  }, [initialUser]);

  useEffect(() => {
    if (!mobileOpen) setLocaleOpen(false);
  }, [mobileOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      if (localeOpen && localePanelRef.current && !localePanelRef.current.contains(target)) {
        setLocaleOpen(false);
      }

      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setLocaleOpen(false);
      setMobileOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [localeOpen, mobileOpen]);

  const handleLocaleSelect = (next: LanguageCode) => {
    if (!isSupportedLocale(next)) return;
    setUiLocale(next);
    setLocaleOpen(false);
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("logout failed", err);
    } finally {
      clearCachedUser();
      setLoggingOut(false);
      setMobileOpen(false);
      router.refresh();
    }
  };

  return (
    <header
      ref={headerRef}
      data-site-header="true"
      className={`sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--bg))_88%,rgb(var(--card))_12%)] shadow-[0_10px_28px_rgba(2,6,23,0.06)] backdrop-blur-xl ${
        isSwipeFocusPath ? "max-md:hidden" : ""
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 md:gap-4 md:px-5 md:py-3.5 ${compactMobileShell ? "max-md:py-1.5" : ""}`}>
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 rounded-full px-1 py-1 transition hover:bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%)]">
          <span
            className="text-xl font-extrabold leading-tight tracking-tight md:text-[1.4rem] lg:text-[1.55rem]"
            style={{
              backgroundImage:
                "linear-gradient(120deg,var(--brand-cyan),var(--brand-blue))",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            eDebatte
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 lg:flex" aria-label={t("Hauptnavigation", "aria.main-nav")}>
          {navLinks.map((item) => (
            <Link
              key={item.id}
              href={resolveHref(item.href)}
              aria-current={isActiveNavHref(pathname, item.href) ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                isActiveNavHref(pathname, item.href)
                  ? "border-[rgb(var(--grad-from))]/35 bg-[color-mix(in_oklab,rgb(var(--card))_86%,rgb(var(--grad-from))_14%)] text-[rgb(var(--fg))] shadow-sm"
                  : "border-transparent text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] hover:text-[rgb(var(--fg))]"
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Rechts: Avatar/Account + Hamburger */}
        <div className="flex items-center gap-3">
          <div ref={localePanelRef} className="relative hidden sm:block">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t(`UI-Sprache wählen (aktuell ${activeLocaleConfig.label})`, "aria.locale")}
                aria-expanded={localeOpen}
                onClick={() => setLocaleOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--fg))]"
              >
                <span aria-hidden="true" className="text-base">
                  {activeLocaleConfig.flagEmoji || "🏳️"}
                </span>
                <span>{localeLabel}</span>
              </button>
              <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Lesen {readingLocale.toUpperCase()}
              </span>
              {translationPending && (
                <span className="rounded-full border border-amber-300/60 bg-amber-200/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                  {statusLabel}
                </span>
              )}
            </div>
            {localeOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2 shadow-lg">
                {localeOptions.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLocaleSelect(lang.code)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)] hover:text-[rgb(var(--fg))]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">{lang.flag}</span>
                      <span className="uppercase">{lang.code}</span>
                    </span>
                    <span className="text-[10px] text-[rgb(var(--muted))]">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="vog-btn-brand px-4 py-2 text-xs uppercase tracking-wide text-white"
              >
                {t("Login", "cta.login")}
              </Link>
            </div>
          )}
          <button
            type="button"
            aria-label={
              user
                ? t("Account-Menü öffnen", "aria.account")
                : t("Navigation öffnen", "aria.navigation")
            }
            onClick={() => setMobileOpen((v) => !v)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm font-semibold text-[rgb(var(--muted))] shadow-sm hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--fg))] md:h-10 md:w-10 ${
              compactMobileShell ? "hidden md:inline-flex" : ""
            }`}
          >
            {user ? (
              avatarUrl ? (
                <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] shadow-sm">
                  <span
                    aria-hidden="true"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                  />
                </span>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-sm font-semibold text-[rgb(var(--fg))] shadow-sm">
                  {avatarLabel}
                </span>
              )
            ) : (
              <>
                <span className="sr-only">{t("Menü", "menu")}</span>
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h10"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide headline-grad">
                {t("Navigation", "mobile.nav")}
              </span>
              <ThemeToggle variant="icon" />
            </div>

            <nav
              aria-label={t("Mobile Navigation", "aria.mobile-nav")}
              className="flex flex-col gap-2 text-sm font-semibold text-[rgb(var(--fg))]"
            >
              {[
                { id: "contribute", href: "/create?intent=contribute", label: "Beitragen" },
                { id: "themen", href: "/themen", label: "Themen" },
                { id: "rounds", href: "/runden?intent=create", label: "Anlassraum / Event" },
                {
                  id: "organization",
                  href: user ? "/account/organization/dashboard" : "/account/organization",
                  label: "Organisation",
                },
                { id: "profile", href: user ? "/account" : "/login", label: user ? "Profil" : "Anmelden" },
              ].map((entry) => (
                <Link
                  key={entry.id}
                  href={resolveHref(entry.href)}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-left text-sm text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
                >
                  {entry.label}
                </Link>
              ))}

              {!user && (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(56,189,248,0.4)]"
                  >
                    {t("Login", "cta.login.mobile")}
                  </Link>
                </div>
              )}

              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-center text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--fg))]"
                  >
                    {t("Mein Konto", "account")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-center text-sm font-semibold text-[rgb(var(--muted))] hover:border-rose-300 hover:text-rose-500 disabled:opacity-60"
                  >
                    {loggingOut
                      ? t("Abmelden …", "logout.pending")
                      : t("Abmelden", "logout")}
                  </button>
                </div>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
