"use client";

import { useEffect, useMemo, useState } from "react";
import type { IdentityEventName, IdentityFunnelSnapshot } from "@core/telemetry/identityEvents";

type ApiResponse = {
  ok: boolean;
  snapshot?: IdentityFunnelSnapshot;
  error?: string;
};

type RangeOption = {
  value: string;
  label: string;
};

const RANGE_OPTIONS: RangeOption[] = [
  { value: "7", label: "Letzte 7 Tage" },
  { value: "30", label: "Letzte 30 Tage" },
  { value: "90", label: "Letzte 90 Tage" },
];

const FUNNEL_ORDER: Array<{ key: IdentityEventName; label: string }> = [
  { key: "identity_register", label: "Registriert" },
  { key: "identity_email_verify_start", label: "E-Mail: Start" },
  { key: "identity_email_verify_confirm", label: "E-Mail: Bestätigt" },
  { key: "identity_otb_start", label: "OTB gestartet" },
  { key: "identity_otb_confirm", label: "OTB bestätigt" },
  { key: "identity_strong_completed", label: "Stark abgeschlossen" },
];

function formatDateRange(snapshot?: IdentityFunnelSnapshot | null) {
  if (!snapshot) return "—";
  const from = new Date(snapshot.fromDate);
  const to = new Date(snapshot.toDate);
  return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
}

export default function IdentityTelemetryPage() {
  const [range, setRange] = useState<RangeOption>(RANGE_OPTIONS[1]);
  const [snapshot, setSnapshot] = useState<IdentityFunnelSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => snapshot?.totalsByEvent ?? {}, [snapshot]);
  const noData = useMemo(
    () => snapshot && Object.values(totals).every((value) => value === 0),
    [snapshot, totals],
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/telemetry/identity?range=${range.value}`);
        const body = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok || !body?.ok || !body.snapshot) {
          throw new Error(body?.error || res.statusText);
        }
        setSnapshot(body.snapshot);
      } catch (err: any) {
        setError(err?.message ?? "Snapshot konnte nicht geladen werden");
        setSnapshot(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [range]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Telemetry</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Identity Funnel</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Aggregierte Identity-Events aus dem Core. Nutze den Zeitraum, um Drop-offs im Registrierungs-Funnel zu erkennen.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-[rgb(var(--fg))]" htmlFor="range">
          Zeitraum
        </label>
        <select
          id="range"
          value={range.value}
          onChange={(event) => {
            const next = RANGE_OPTIONS.find((opt) => opt.value === event.target.value) ?? RANGE_OPTIONS[1];
            setRange(next);
          }}
          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-[rgb(var(--muted))]">{formatDateRange(snapshot)}</span>
        {loading && <span className="text-sm text-[rgb(var(--muted))]">Lädt …</span>}
        {error && (
          <span className="text-sm text-rose-600" role="alert">
            {error}
          </span>
        )}
      </section>

      {!loading && !error && snapshot === null && (
        <section className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Keine Daten geladen</p>
          <p>Wähle oben einen Zeitraum, um einen Snapshot zu laden.</p>
        </section>
      )}

      {noData && !loading && !error && snapshot && (
        <section className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Keine Events im Zeitraum</p>
          <p>Für den ausgewählten Zeitraum liegen keine Identity-Events vor.</p>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FUNNEL_ORDER.map((step) => (
          <div
            key={step.key}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{step.label}</p>
            <p className="text-3xl font-bold text-[rgb(var(--fg))]">
              {totals[step.key] ?? 0}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{step.key.replace("identity_", "").replace(/_/g, " → ")}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Interpretation</p>
        <p>
          Werte sind simple Event-Zählungen. Für exakte Conversion-Raten bitte beachten, dass Benutzer mehrere Events in kurzer Folge
          triggern können. Die Daten liefern eine grobe Orientierung für Bottlenecks im Funnel (z.B. E-Mail-Bestätigung vs. OTB).
        </p>
      </section>
    </main>
  );
}
