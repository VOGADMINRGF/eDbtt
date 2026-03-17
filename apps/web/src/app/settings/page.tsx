"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_LOCALSTORAGE_KEY,
  LEGACY_CONSENT_COOKIE_NAME,
  buildConsentCookie,
  parseConsentCookie,
  serializeConsent,
  type Consent,
} from "@/lib/privacy/consent";

type ConsentApiResponse = {
  ok?: boolean;
  consent?: {
    essential: true;
    analytics: boolean;
    source?: string | null;
    updatedAt?: string | null;
  } | null;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return entry ? entry.split("=")[1] ?? null : null;
}

function readLocalConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CONSENT_LOCALSTORAGE_KEY);
  return parseConsentCookie(raw);
}

function readDocumentConsent(): Consent | null {
  const primary = readCookie(CONSENT_COOKIE_NAME);
  if (primary) return parseConsentCookie(primary);

  const legacy = readCookie(LEGACY_CONSENT_COOKIE_NAME);
  if (legacy) return parseConsentCookie(legacy);

  return readLocalConsent();
}

function persistConsent(consent: Consent) {
  if (typeof document === "undefined") return;
  document.cookie = buildConsentCookie(consent);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_LOCALSTORAGE_KEY, serializeConsent(consent));
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const local = readDocumentConsent();
        if (local && !ignore) {
          setAnalyticsEnabled(local.analytics);
        }

        const res = await fetch("/api/account/consent", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as ConsentApiResponse;

        if (!ignore && res.ok && body?.consent) {
          setAnalyticsEnabled(Boolean(body.consent.analytics));
          setUpdatedAt(body.consent.updatedAt ?? null);
        }
      } catch {
        // optional endpoint
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  async function saveConsent(nextAnalytics: boolean) {
    const nextConsent: Consent = { essential: true, analytics: nextAnalytics };
    persistConsent(nextConsent);
    setAnalyticsEnabled(nextAnalytics);
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch("/api/account/consent", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ essential: true, analytics: nextAnalytics, source: "settings" }),
      });

      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as ConsentApiResponse;
        setUpdatedAt(body.consent?.updatedAt ?? new Date().toISOString());
      }

      setNotice("Datenschutz-Consent wurde aktualisiert.");
    } catch (err: any) {
      setError(err?.message ?? "Consent konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = useMemo(
    () => (analyticsEnabled ? "Analytics aktiviert" : "Nur essentielle Cookies"),
    [analyticsEnabled],
  );

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-coral">Einstellungen</h1>
        <p className="text-gray-700">Hier kannst du Sprache, Benachrichtigungen und Datenschutz verwalten.</p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Datenschutz & Consent</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Essenzielle Cookies sind für Login, Sicherheit, Sprache und Consent-Status nötig. Optionale Analytics helfen,
          die Plattform zu verbessern. KI-Dienste (OpenAI, Anthropic, Mistral, Gemma u. a.) werden ausschließlich
          serverseitig ohne Tracking-Pixel oder Werbeprofile genutzt.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))]">
            {statusLabel}
          </span>
          {updatedAt ? (
            <span className="text-xs text-[rgb(var(--muted))]">
              Zuletzt aktualisiert: {new Date(updatedAt).toLocaleString("de-DE")}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => saveConsent(true)}
            disabled={loading || saving}
          >
            Analytics erlauben
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => saveConsent(false)}
            disabled={loading || saving}
          >
            Nur essentielle Cookies
          </button>
        </div>

        {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>
    </main>
  );
}
