"use client";

import { useEffect, useState } from "react";

type Contribution = {
  id: string;
  type: string;
  status: "proposed" | "approved" | "rejected";
  topicId?: string | null;
  candidateId?: string | null;
  title?: string | null;
  body?: string | null;
  url?: string | null;
  authorName?: string | null;
  createdAt?: string;
};

type ApiResponse = {
  ok: boolean;
  items?: Contribution[];
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContributionsPage() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/community/contributions?status=proposed", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok || !body.ok) throw new Error(body?.error || res.statusText);
      setItems(body.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Contributions konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/community/contributions/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body?.error || res.statusText);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message ?? "Update fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Contributions</p>
          <h1 className="text-2xl font-bold text-slate-900">Beitraege Review</h1>
          <p className="text-sm text-slate-600">Vorschlaege freigeben oder ablehnen.</p>
        </div>
        <button
          onClick={load}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          disabled={loading}
        >
          Aktualisieren
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" aria-live="polite">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading && <p className="text-sm text-slate-500">Lädt …</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-500">Keine offenen Beitraege.</p>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white px-2 py-1">{item.type}</span>
                {item.topicId && <span>Topic: {item.topicId}</span>}
                {item.candidateId && <span>Kandidat: {item.candidateId}</span>}
                <span>Status: {item.status}</span>
                <span>Erstellt: {formatDate(item.createdAt ?? null)}</span>
              </div>
              <p className="mt-2 font-semibold text-slate-900">{item.title || "Beitrag"}</p>
              {item.body && <p className="mt-1 text-slate-700">{item.body}</p>}
              {item.url && (
                <a className="mt-2 inline-block text-xs text-sky-600 underline" href={item.url} target="_blank" rel="noreferrer">
                  Quelle öffnen
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 disabled:opacity-60"
                  onClick={() => updateStatus(item.id, "approved")}
                  disabled={busyId === item.id}
                >
                  Freigeben
                </button>
                <button
                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-700 disabled:opacity-60"
                  onClick={() => updateStatus(item.id, "rejected")}
                  disabled={busyId === item.id}
                >
                  Ablehnen
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
