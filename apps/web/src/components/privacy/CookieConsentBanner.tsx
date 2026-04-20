"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PrivacyStrings } from "@/app/privacyStrings";
import { useLocale } from "@/context/LocaleContext";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_LOCALSTORAGE_KEY,
  LEGACY_CONSENT_COOKIE_NAME,
  buildConsentCookie,
  parseConsentCookie,
  serializeConsent,
  type Consent,
} from "@/lib/privacy/consent";

interface CookieConsentBannerProps {
  strings: PrivacyStrings;
  initialConsent?: Consent | null;
}

function readConsentFromDocument(): { consent: Consent | null; source: "primary" | "legacy" | "local" | null } {
  if (typeof document === "undefined") return { consent: null, source: null };

  const entries = document.cookie.split("; ");
  const primaryRaw = entries
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];
  if (primaryRaw) {
    return { consent: parseConsentCookie(primaryRaw), source: "primary" };
  }

  const legacyRaw = entries
    .find((entry) => entry.startsWith(`${LEGACY_CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];
  if (legacyRaw) {
    return { consent: parseConsentCookie(legacyRaw), source: "legacy" };
  }

  const localRaw = window.localStorage.getItem(CONSENT_LOCALSTORAGE_KEY);
  if (localRaw) {
    return { consent: parseConsentCookie(localRaw), source: "local" };
  }

  return { consent: null, source: null };
}

function persistConsentLocalStorage(consent: Consent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_LOCALSTORAGE_KEY, serializeConsent(consent));
}

async function persistConsentServer(consent: Consent) {
  try {
    await fetch("/api/account/consent", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        essential: true,
        analytics: consent.analytics,
        source: "cookie-banner",
      }),
      keepalive: true,
    });
  } catch {
    // optional sync
  }
}

export function CookieConsentBanner({ strings, initialConsent }: CookieConsentBannerProps) {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "cookie-banner" });
  const copy = useMemo(() => {
    if (locale === "de" || locale === "en") return strings;
    return mapTranslatableStrings(strings, t, { namespace: "cookie" });
  }, [locale, strings, t]);

  const [consent, setConsent] = useState<Consent | null>(initialConsent ?? null);
  const [show, setShow] = useState(!initialConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(false);

  useEffect(() => {
    if (initialConsent) return;
    const { consent: existing, source } = readConsentFromDocument();
    if (!existing) return;

    setConsent(existing);
    setAnalyticsOptIn(existing.analytics);
    setShow(false);

    if (source !== "primary" && typeof document !== "undefined") {
      document.cookie = buildConsentCookie(existing);
      persistConsentLocalStorage(existing);
    }
  }, [initialConsent]);

  useEffect(() => {
    if (!consent) return;
    setAnalyticsOptIn(consent.analytics);
  }, [consent]);

  const persistConsent = (value: Consent) => {
    if (typeof document === "undefined") return;
    document.cookie = buildConsentCookie(value);
    persistConsentLocalStorage(value);
    setConsent(value);
    setShow(false);
    void persistConsentServer(value);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[0_24px_80px_rgba(2,6,23,0.45)] sm:rounded-3xl">
          <div className="h-1 bg-brand-grad" />
          <div className="grid gap-5 p-4 md:grid-cols-[1.35fr_1fr] md:p-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2">
                <span className="vog-chip">{copy.banner.title}</span>
              </div>
              <p className="text-sm text-[rgb(var(--muted))]">{copy.banner.lead}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">{copy.dialog.aiUsageBody}</p>
              <div className="flex flex-wrap gap-4 text-xs text-[rgb(var(--muted))]">
                <Link
                  href="/datenschutz"
                  className="font-semibold text-[rgb(var(--fg))] underline decoration-[rgb(var(--grad-from))]/70 underline-offset-4 hover:decoration-[rgb(var(--grad-to))]"
                >
                  {copy.banner.links.privacy}
                </Link>
                <Link
                  href="/impressum"
                  className="font-semibold text-[rgb(var(--fg))] underline decoration-[rgb(var(--grad-from))]/70 underline-offset-4 hover:decoration-[rgb(var(--grad-to))]"
                >
                  {copy.banner.links.imprint}
                </Link>
                <Link
                  href="/ki-nutzung"
                  className="font-semibold text-[rgb(var(--fg))] underline decoration-[rgb(var(--grad-from))]/70 underline-offset-4 hover:decoration-[rgb(var(--grad-to))]"
                >
                  {copy.banner.links.aiUsage}
                </Link>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] p-4">
              <div className="space-y-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                <p className="text-xs font-semibold text-[rgb(var(--fg))]">{copy.banner.essentialTitle}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{copy.banner.essentialBody}</p>
              </div>

              <div className="space-y-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[rgb(var(--fg))]">{copy.banner.analyticsTitle}</p>
                    <p className="text-[11px] text-[rgb(var(--muted))]">{copy.banner.analyticsBody}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={analyticsOptIn}
                      onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                    />
                    <div className="h-6 w-11 rounded-full bg-[rgb(var(--border))] transition peer-checked:bg-gradient-to-r peer-checked:from-[rgb(var(--grad-from))] peer-checked:to-[rgb(var(--grad-to))]" />
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-[rgb(var(--card))] shadow-sm transition peer-checked:translate-x-5" />
                  </label>
                </div>

                {settingsOpen ? <p className="text-[11px] text-[rgb(var(--muted))]">{copy.dialog.intro}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-primary flex-1 text-sm"
                  onClick={() => persistConsent({ essential: true, analytics: true })}
                >
                  {copy.banner.buttons.acceptAll}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1 text-sm"
                  onClick={() => persistConsent({ essential: true, analytics: false })}
                >
                  {copy.banner.buttons.onlyEssential}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost px-3 text-xs"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                >
                  {copy.banner.buttons.settings}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
