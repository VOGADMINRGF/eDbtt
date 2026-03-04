"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type IdentityEventName =
  | "identity_register"
  | "identity_email_verify_start"
  | "identity_email_verify_confirm"
  | "identity_totp_confirmed"
  | "identity_otb_start"
  | "identity_otb_confirm"
  | "identity_strong_completed";

type StageDatum = { stage: string; value: number };
type DropOffDatum = { label: string; value: number };

type FunnelResponse = {
  ok: boolean;
  totals?: {
    totalAccounts: number;
    emailVerified: number;
    onboardingComplete: number;
    twoFactorEnabled: number;
    pendingEmail: number;
    pendingOnboarding: number;
    pending2FA: number;
  };
  snapshot?: {
    totalsByEvent: Record<IdentityEventName, number>;
  };
  stages: StageDatum[];
  dropOff: DropOffDatum[];
  error?: string;
};

type IdentityEventRow = {
  id: string;
  event: IdentityEventName;
  userId?: string | null;
  createdAt?: string | null;
  meta?: Record<string, unknown> | null;
};

type IdentityEventsResponse = {
  ok: boolean;
  items: IdentityEventRow[];
  total: number;
  page: number;
  pageSize: number;
  rangeDays: number;
  error?: string;
};

const numberFormatter = new Intl.NumberFormat("de-DE");

export default function IdentityFunnelDashboard() {
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IdentityEventName | null>(null);
  const [events, setEvents] = useState<IdentityEventRow[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/identity/funnel", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as FunnelResponse | null;
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? res.statusText);
      }
      setData(body);
    } catch (err: any) {
      setError(err?.message ?? "Dashboard konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    if (data.totals) {
      const totals = data.totals;
      return [
        { label: "Registrierungen gesamt", value: totals.totalAccounts },
        { label: "E-Mail bestätigt", value: totals.emailVerified },
        { label: "Profil gepflegt", value: totals.onboardingComplete },
        { label: "2FA aktiv", value: totals.twoFactorEnabled },
        { label: "E-Mail offen", value: totals.pendingEmail },
        { label: "Onboarding offen", value: totals.pendingOnboarding },
        { label: "2FA offen", value: totals.pending2FA },
      ];
    }
    if (data.snapshot?.totalsByEvent) {
      const totals = data.snapshot.totalsByEvent;
      return [
        { label: "Registriert", value: totals.identity_register ?? 0, event: "identity_register" as const },
        { label: "E-Mail Start", value: totals.identity_email_verify_start ?? 0, event: "identity_email_verify_start" as const },
        {
          label: "E-Mail bestätigt",
          value: totals.identity_email_verify_confirm ?? 0,
          event: "identity_email_verify_confirm" as const,
        },
        { label: "2FA aktiv", value: totals.identity_totp_confirmed ?? 0, event: "identity_totp_confirmed" as const },
        { label: "OTB bestätigt", value: totals.identity_otb_confirm ?? 0, event: "identity_otb_confirm" as const },
        {
          label: "Strong abgeschlossen",
          value: totals.identity_strong_completed ?? 0,
          event: "identity_strong_completed" as const,
        },
      ];
    }
    return [];
  }, [data]);

  const maxStageValue = data?.stages.reduce((max, stage) => Math.max(max, stage.value), 0) ?? 0;

  useEffect(() => {
    if (!selectedEvent) return;
    let active = true;
    async function loadEvents() {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const params = new URLSearchParams();
        params.set("event", selectedEvent);
        params.set("page", String(eventsPage));
        params.set("pageSize", "20");
        const res = await fetch(`/api/admin/identity/events?${params.toString()}`, { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as IdentityEventsResponse | null;
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? res.statusText);
        }
        if (active) {
          setEvents(body.items ?? []);
          setEventsTotal(body.total ?? 0);
        }
      } catch (err: any) {
        if (active) setEventsError(err?.message ?? "Events konnten nicht geladen werden.");
      } finally {
        if (active) setEventsLoading(false);
      }
    }
    loadEvents();
    return () => {
      active = false;
    };
  }, [selectedEvent, eventsPage]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Identity
        </p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Identity Funnel Übersicht</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Aggregierte Kennzahlen zu Registrierung, Verifikation und Onboarding. Alle Werte
          sind anonymisiert und enthalten keine PII.
        </p>
        <div className="flex gap-3">
          <button
            className="rounded-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Aktualisiere …" : "Aktualisieren"}
          </button>
          {error && <AdminErrorPanel error={error} />}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const isActive = card.event && selectedEvent === card.event;
          const isClickable = Boolean(card.event);
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                if (!card.event) return;
                setSelectedEvent(card.event);
                setEventsPage(1);
              }}
              className={[
                "rounded-2xl border p-4 text-left shadow-sm transition",
                isClickable
                  ? "hover:border-sky-200 hover:shadow-md"
                  : "cursor-default",
                isActive
                  ? "border-sky-200 bg-[rgb(var(--bg))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))]",
              ].join(" ")}
              disabled={!isClickable}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--fg))]">
                {numberFormatter.format(card.value)}
              </p>
              {card.event ? (
                <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-sky-600">
                  Tabelle öffnen →
                </span>
              ) : null}
            </button>
          );
        })}
        {!cards.length && !loading && (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Daten verfügbar.</p>
        )}
      </section>

      {data && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Funnel-Stufen</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Linearer Vergleich – Werte sind kumulativ, daher sinkt jeder Schritt.
          </p>
          <div className="mt-4 space-y-4">
            {data.stages.map((stage) => {
              const pct =
                maxStageValue > 0 ? Math.round((stage.value / maxStageValue) * 100) : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))]">
                    <span>{stage.stage}</span>
                    <span>
                      {numberFormatter.format(stage.value)} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full bg-[rgb(var(--bg))]">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {data && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Drop-Off Analyse</h2>
          <table className="mt-4 min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <tr>
                <th className="px-3 py-2">Stufe</th>
                <th className="px-3 py-2">Personen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {data.dropOff.map((entry) => (
                <tr key={entry.label}>
                  <td className="px-3 py-2 font-medium text-[rgb(var(--fg))]">{entry.label}</td>
                  <td className="px-3 py-2 text-[rgb(var(--muted))]">
                    {numberFormatter.format(entry.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {selectedEvent && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Event-Tabelle</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Ereignisse der letzten 30 Tage für <span className="font-semibold">{selectedEvent}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))]"
            >
              Schließen
            </button>
          </div>

          {eventsError && <AdminErrorPanel error={eventsError} />}

          <div className="overflow-hidden rounded-xl border border-[rgb(var(--border))]">
            <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
              <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                <tr>
                  <th className="px-3 py-2">Zeitpunkt</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {eventsLoading && (
                  <tr>
                    <td className="px-3 py-3 text-[rgb(var(--muted))]" colSpan={4}>
                      Lädt …
                    </td>
                  </tr>
                )}
                {!eventsLoading && events.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-[rgb(var(--muted))]" colSpan={4}>
                      Keine Events im Zeitraum.
                    </td>
                  </tr>
                )}
                {!eventsLoading &&
                  events.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString("de-DE") : "—"}
                      </td>
                      <td className="px-3 py-2 font-medium text-[rgb(var(--fg))]">{row.event}</td>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">
                        {row.userId ? (
                          <Link
                            href={`/admin/users?q=${encodeURIComponent(row.userId)}`}
                            className="font-semibold text-sky-600 underline underline-offset-2"
                          >
                            {row.userId.slice(0, 8)}…
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">
                        {row.meta ? JSON.stringify(row.meta).slice(0, 120) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {eventsTotal > 20 && (
            <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
              <span>
                Seite {eventsPage} · {eventsTotal} Einträge
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                  disabled={eventsPage <= 1 || eventsLoading}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={() => setEventsPage((prev) => prev + 1)}
                  disabled={eventsLoading || eventsPage * 20 >= eventsTotal}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
