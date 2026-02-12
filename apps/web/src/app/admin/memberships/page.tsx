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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    const res = await fetch("/api/admin/memberships", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      setError(body?.error || "Konnte Mitgliedschaften nicht laden");
      setLoading(false);
      return;
    }
    setItems(body.items || []);
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
