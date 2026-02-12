"use client";

import { useEffect, useMemo, useState } from "react";

type MembershipRow = {
  id: string;
  userId: string;
  amountPerPeriod: number;
  rhythm: string;
  householdSize: number;
  status: string;
  createdAt: string | null;
};

type WaitingItem = {
  coreUserId: string;
  householdSize: number;
  amountPerPeriod: number;
  membershipAmountPerMonth?: number;
  rhythm: string;
  paymentReference?: string;
  firstDueAt?: string;
  dunningLevel?: number;
  pendingInvites?: number;
  createdAt?: string;
  _id?: string;
};

type Overview = {
  activeCount: number;
  waitingPaymentCount: number;
  cancelledLast30: number;
  totalMonthlyVolumeActive: number;
  pendingInviteCount?: number;
  waiting: WaitingItem[];
};

const STATUS_OPTIONS = [
  "submitted",
  "pending",
  "waiting_payment",
  "active",
  "paused",
  "cancelled",
  "rejected",
  "household_locked",
];

export default function AdminMembershipsPage() {
  const [items, setItems] = useState<MembershipRow[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MembershipRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => row.id.toLowerCase().includes(q) || row.userId.toLowerCase().includes(q));
  }, [items, query]);

  async function load() {
    setLoading(true);
    setError(null);
    setOverviewError(null);

    const [listRes, overviewRes] = await Promise.all([
      fetch("/api/admin/memberships", { cache: "no-store" }),
      fetch("/api/admin/memberships/overview", { cache: "no-store" }),
    ]);

    const listBody = await listRes.json().catch(() => ({}));
    if (!listRes.ok || !listBody?.ok) {
      setError(listBody?.error || "Konnte Mitgliedschaften nicht laden");
      setLoading(false);
      return;
    }
    setItems(listBody.items || []);

    const overviewBody = await overviewRes.json().catch(() => ({}));
    if (overviewRes.ok && overviewBody?.overview) {
      setOverview(overviewBody.overview as Overview);
    } else {
      setOverviewError(overviewBody?.error || "Konnte Übersicht nicht laden");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/admin/memberships", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: selected.id, status: selected.status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      setError(body?.error || "Status konnte nicht gespeichert werden");
    } else {
      setSelected(null);
      load();
    }
    setSaving(false);
  }

  async function markPaid(id?: string) {
    if (!id) return;
    await fetch(`/api/admin/memberships/${id}/mark-paid`, { method: "POST" });
    load();
  }

  async function cancelMembership(id?: string) {
    if (!id) return;
    await fetch(`/api/admin/memberships/${id}/cancel`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white/90 p-4 shadow ring-1 ring-slate-100">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche nach Mitgliedschaft- oder User-ID"
          className="w-80 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-sky-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
        >
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {overviewError && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {overviewError}
        </div>
      )}

      {overview && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Aktive Mitgliedschaften" value={overview.activeCount} />
            <Stat label="Offene Zahlungen" value={overview.waitingPaymentCount} />
            <Stat label="Stornos (30 Tage)" value={overview.cancelledLast30} />
            <Stat label="Monatsvolumen (aktiv)" value={`${overview.totalMonthlyVolumeActive.toFixed(2)} €`} />
            <Stat label="Offene Household-Invites" value={overview.pendingInviteCount ?? 0} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Offene Zahlungen</h2>
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Aktualisieren
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm text-slate-800">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Betrag</th>
                    <th className="px-2 py-2">Rhythmus</th>
                    <th className="px-2 py-2">Haushalt</th>
                    <th className="px-2 py-2">Due</th>
                    <th className="px-2 py-2">Dunning</th>
                    <th className="px-2 py-2">Invites</th>
                    <th className="px-2 py-2">Ref</th>
                    <th className="px-2 py-2">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.waiting.length === 0 && (
                    <tr>
                      <td className="px-2 py-3 text-slate-500" colSpan={8}>
                        Keine offenen Zahlungen.
                      </td>
                    </tr>
                  )}
                  {overview.waiting.map((item) => (
                    <tr key={item.paymentReference} className="border-t border-slate-100">
                      <td className="px-2 py-2">{(item.membershipAmountPerMonth ?? item.amountPerPeriod).toFixed(2)} €</td>
                      <td className="px-2 py-2">{item.rhythm}</td>
                      <td className="px-2 py-2">{item.householdSize}</td>
                      <td className="px-2 py-2">
                        {item.firstDueAt ? new Date(item.firstDueAt).toLocaleDateString("de-DE") : "n/a"}
                      </td>
                      <td className="px-2 py-2">{item.dunningLevel ?? 0}</td>
                      <td className="px-2 py-2">{item.pendingInvites ?? 0}</td>
                      <td className="px-2 py-2">{item.paymentReference}</td>
                      <td className="px-2 py-2 space-x-2">
                        <button
                          type="button"
                          onClick={() => markPaid((item as any)._id)}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Verbuchen
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelMembership((item as any)._id)}
                          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700"
                        >
                          Kündigen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-white/90 shadow ring-1 ring-slate-100">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Membership ID</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">User ID</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Betrag</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Rhythmus</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Haushalt</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Erstellt</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                  Lädt …
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                  Keine Einträge gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.id}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.userId}</td>
                  <td className="px-3 py-2">{row.amountPerPeriod.toFixed(2)} €</td>
                  <td className="px-3 py-2">{row.rhythm}</td>
                  <td className="px-3 py-2">{row.householdSize}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{row.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                      onClick={() => setSelected(row)}
                    >
                      Status ändern
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.45)] ring-1 ring-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Membership</p>
                <p className="text-sm font-semibold text-slate-900">{selected.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Status</label>
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected((prev) => (prev ? { ...prev, status: e.target.value } : prev))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">Nur Status in membership_applications wird gesetzt. Für Zahlungseingang weiterhin „Verbuchen“ nutzen.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveStatus}
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,116,144,0.35)] hover:brightness-105 disabled:opacity-60"
              >
                {saving ? "Speichern …" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
