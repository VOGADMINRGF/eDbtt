"use client";
// E200: Client-side consent banner without third-party CMPs.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PrivacyStrings } from "@/app/privacyStrings";
import { useLocale } from "@/context/LocaleContext";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import {
  CONSENT_COOKIE_NAME,
  LEGACY_CONSENT_COOKIE_NAME,
  buildConsentCookie,
  parseConsentCookie,
  type Consent,
} from "@/lib/privacy/consent";

interface CookieBannerProps {
  strings: PrivacyStrings;
  initialConsent?: Consent | null;
}

function readConsentFromDocument(): { consent: Consent | null; source: "primary" | "legacy" | null } {
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
  if (!legacyRaw) return { consent: null, source: null };
  return { consent: parseConsentCookie(legacyRaw), source: "legacy" };
}

export function CookieBanner({ strings, initialConsent }: CookieBannerProps) {
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
    if (existing) {
      setConsent(existing);
      setAnalyticsOptIn(existing.analytics);
      setShow(false);
      if (source === "legacy" && typeof document !== "undefined") {
        document.cookie = buildConsentCookie(existing);
      }
    }
  }, [initialConsent]);

  useEffect(() => {
    if (consent) {
      setAnalyticsOptIn(consent.analytics);
    }
  }, [consent]);

  const persistConsent = (value: Consent) => {
    if (typeof document === "undefined") return;
    const cookie = buildConsentCookie(value);
    document.cookie = cookie;
    setConsent(value);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[var(--glass-bg)] shadow-soft backdrop-blur-xl">
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

          <div className="space-y-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <div className="space-y-1 rounded-lg border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%)] p-3">
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
              {settingsOpen && (
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  {copy.dialog.intro}
                </p>
              )}
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

            {settingsOpen && (
              <div className="space-y-1 rounded-lg border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] p-3 text-[11px] text-[rgb(var(--muted))]">
                <p className="font-semibold text-[rgb(var(--fg))]">{copy.dialog.title}</p>
                <p>{copy.dialog.aiUsageBody}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
