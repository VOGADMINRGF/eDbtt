"use client";

import { useEffect, useMemo, useState } from "react";
import { CORE_LOCALES, SUPPORTED_LOCALES, getLocaleConfig, type SupportedLocale } from "@/config/locales";
import { useLanguagePreferences } from "@/context/LocaleContext";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_LOCALSTORAGE_KEY,
  LEGACY_CONSENT_COOKIE_NAME,
  PRIVACY_NOTICE_VERSION,
  buildConsentCookie,
  buildDefaultConsent,
  buildDefaultOptionalConsent,
  parseConsentCookie,
  serializeConsent,
  type Consent,
  type PrivacyOptionalConsent,
} from "@/lib/privacy/consent";

type ConsentApiResponse = {
  ok?: boolean;
  consent?: (Consent & { updatedAt?: string | null }) | null;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return entry ? entry.split("=")[1] ?? null : null;
}

function readDocumentConsent(): Consent | null {
  const primary = readCookie(CONSENT_COOKIE_NAME);
  if (primary) return parseConsentCookie(primary);

  const legacy = readCookie(LEGACY_CONSENT_COOKIE_NAME);
  if (legacy) return parseConsentCookie(legacy);

  if (typeof window !== "undefined") {
    const local = window.localStorage.getItem(CONSENT_LOCALSTORAGE_KEY);
    return parseConsentCookie(local);
  }

  return null;
}

function persistConsent(consent: Consent) {
  if (typeof document === "undefined") return;
  document.cookie = buildConsentCookie(consent);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_LOCALSTORAGE_KEY, serializeConsent(consent));
  }
}

export default function SettingsPage() {
  const {
    uiLocale,
    setUiLocale,
    readingLocale,
    setReadingLocale,
    preferredOutputLocales,
    setPreferredOutputLocales,
    showOriginalByDefault,
    setShowOriginalByDefault,
  } = useLanguagePreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiredAcknowledged, setRequiredAcknowledged] = useState(false);
  const [optional, setOptional] = useState<PrivacyOptionalConsent>(buildDefaultOptionalConsent());
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const local = readDocumentConsent();
        if (local && !ignore) {
          setRequiredAcknowledged(local.requiredNoticeAcknowledged);
          setOptional(local.optional);
        }

        const res = await fetch("/api/account/consent", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as ConsentApiResponse;

        if (!ignore && res.ok && body?.consent) {
          setRequiredAcknowledged(body.consent.requiredNoticeAcknowledged);
          setOptional(body.consent.optional);
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

  async function saveConsent(nextOptional: PrivacyOptionalConsent) {
    const nextConsent = buildDefaultConsent({
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      requiredNoticeAcknowledged: requiredAcknowledged,
      optional: nextOptional,
      timestamp: new Date().toISOString(),
      source: "settings",
    });
    persistConsent(nextConsent);
    setOptional(nextOptional);
    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch("/api/account/consent", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextConsent),
      });

      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as ConsentApiResponse;
        setUpdatedAt(body.consent?.updatedAt ?? new Date().toISOString());
      }

      setNotice("Datenschutz-Einstellungen wurden aktualisiert.");
    } catch (err: any) {
      setError(err?.message ?? "Datenschutz-Einstellungen konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (!requiredAcknowledged) return "Datenschutz-Gate offen";
    const activeOptional = Object.values(optional).filter(Boolean).length;
    return activeOptional > 0 ? `${activeOptional} optionale Freigaben aktiv` : "Nur notwendige Verarbeitung aktiv";
  }, [optional, requiredAcknowledged]);
  const uiLocaleOptions = CORE_LOCALES.map((code) => getLocaleConfig(code));
  const readingLocaleOptions = SUPPORTED_LOCALES.map((code) => getLocaleConfig(code));
  const preferredOutputLocale = preferredOutputLocales[0] ?? readingLocale;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-16">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-coral">Einstellungen</h1>
        <p className="text-gray-700">Hier kannst du Sprach- und Datenschutz-Einstellungen verwalten.</p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Sprache & Darstellung</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          UI-Sprache, Lesesprache und Anzeigepräferenzen sind getrennt und werden direkt auf diesem Gerät gespeichert.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PreferenceSelect
            id="settings-ui-locale"
            label="UI-Sprache"
            value={uiLocale}
            options={uiLocaleOptions}
            onChange={(value) => setUiLocale(value)}
          />
          <PreferenceSelect
            id="settings-reading-locale"
            label="Lesesprache"
            value={readingLocale}
            options={readingLocaleOptions}
            onChange={(value) => setReadingLocale(value)}
          />
          <PreferenceSelect
            id="settings-output-locale"
            label="Bevorzugte Ausgabesprache"
            value={preferredOutputLocale}
            options={readingLocaleOptions}
            onChange={(value) => setPreferredOutputLocales([value])}
          />
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <input
            type="checkbox"
            checked={showOriginalByDefault}
            onChange={(event) => setShowOriginalByDefault(event.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-[rgb(var(--fg))]">
            Originalsprache standardmäßig anzeigen, wenn eine Übersetzung oder Lesefassung verfügbar ist.
          </span>
        </label>
      </section>

      <section
        data-nosnippet="true"
        className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Datenschutz & Verarbeitung</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          eDebatte trennt die notwendige Verarbeitung für den gewünschten Dienst von freiwilligen Zusatzfreigaben. Die
          aktuelle Notice-Version ist <span className="font-mono">{PRIVACY_NOTICE_VERSION}</span>.
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

        <div className="mt-5 space-y-3">
          <label className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
            <input
              type="checkbox"
              checked={requiredAcknowledged}
              onChange={(event) => setRequiredAcknowledged(event.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-[rgb(var(--fg))]">
              Ich habe verstanden, wie eDebatte meine Eingabe für den gewünschten Dienst verarbeitet.
            </span>
          </label>

          <ToggleRow
            label="Komfortfunktionen erlauben"
            checked={optional.comfort}
            onChange={(checked) => setOptional((current) => ({ ...current, comfort: checked }))}
          />
          <ToggleRow
            label="Anonyme Nutzungsstatistik erlauben"
            checked={optional.analytics}
            onChange={(checked) => setOptional((current) => ({ ...current, analytics: checked }))}
          />
          <ToggleRow
            label="Externe Medien erst nach Freigabe laden"
            checked={optional.externalMedia}
            onChange={(checked) => setOptional((current) => ({ ...current, externalMedia: checked }))}
          />
          <ToggleRow
            label="Produktverbesserung mit anonymisierten Signalen erlauben"
            checked={optional.productImprovement}
            onChange={(checked) => setOptional((current) => ({ ...current, productImprovement: checked }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void saveConsent(optional)}
            disabled={loading || saving}
          >
            Auswahl speichern
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const next = buildDefaultOptionalConsent();
              setOptional(next);
              void saveConsent(next);
            }}
            disabled={loading || saving}
          >
            Nur notwendige Funktionen
          </button>
        </div>

        {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>
    </main>
  );
}

function ToggleRow(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
      <span className="text-sm text-[rgb(var(--fg))]">{props.label}</span>
      <input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} />
    </label>
  );
}

function PreferenceSelect(props: {
  id: string;
  label: string;
  value: SupportedLocale;
  options: Array<{ code: SupportedLocale; label: string }>;
  onChange: (value: SupportedLocale) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-medium text-[rgb(var(--muted))]">{props.label}</span>
      <select
        id={props.id}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value as SupportedLocale)}
        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/30"
      >
        {props.options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
