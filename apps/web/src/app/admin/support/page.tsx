"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type SupportCampaignRow = {
  id: string;
  slug: string;
  title: string;
  targetType: "campaign" | "project" | "question";
  targetId: string;
  status: "draft" | "active" | "closed";
  goalCents: number;
  raisedCents: number;
  waitingCents: number;
  pledges: number;
  createdAt: string;
  updatedAt: string;
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<SupportCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "closed">("all");

  const [campaignId, setCampaignId] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [goalEuro, setGoalEuro] = useState("500");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter === "all" ? "" : `?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(`/api/admin/support/campaigns${query}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setItems(Array.isArray(body?.items) ? body.items : []);
    } catch (err: any) {
      setItems([]);
      setError(err?.message ?? "Support-Campaigns konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const prefill = searchParams?.get("campaignId");
    if (prefill) setCampaignId(prefill);
  }, [searchParams]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [items],
  );

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const goal = Math.round(Number(goalEuro.replace(",", ".")) * 100);
      if (!Number.isFinite(goal) || goal < 100) throw new Error("Zielbetrag ungueltig.");
      const res = await fetch("/api/support/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "campaign",
          campaignId,
          slug,
          title,
          goalCents: goal,
          status: "active",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setCampaignId("");
      setSlug("");
      setTitle("");
      setGoalEuro("500");
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Support-Campaign konnte nicht angelegt werden.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Support</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Unterstuetzen verwalten</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Pledge-Verbuchung und Fortschritt sind transparent, ohne Einfluss auf Votes, XP oder Credits.
        </p>
      </header>

      {error ? <AdminErrorPanel error={error} /> : null}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Support-Campaign anlegen</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-4" onSubmit={createCampaign}>
          <input
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="Campaign ID"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
            required
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (z.B. koeln-klima)"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
            required
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
            required
          />
          <input
            value={goalEuro}
            onChange={(e) => setGoalEuro(e.target.value)}
            placeholder="Ziel in EUR"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
            required
          />
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Erstellt …" : "Support-Campaign erstellen"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-[rgb(var(--muted))]">Status:</span>
          {(["all", "active", "draft", "closed"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setStatusFilter(item)}
              className={`rounded-full px-3 py-1 font-semibold ${statusFilter === item ? "bg-slate-900 text-white" : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[rgb(var(--border))] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
              <tr>
                <th className="px-3 py-2">Titel</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ziel</th>
                <th className="px-3 py-2">Raised</th>
                <th className="px-3 py-2">Offen</th>
                <th className="px-3 py-2">Pledges</th>
                <th className="px-3 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-[rgb(var(--muted))]" colSpan={8}>
                    Laedt …
                  </td>
                </tr>
              ) : null}
              {!loading && sorted.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-[rgb(var(--muted))]" colSpan={8}>
                    Keine Support-Campaigns vorhanden.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                sorted.map((row) => (
                  <tr key={row.id} className="border-b border-[rgb(var(--border))]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[rgb(var(--fg))]">{row.title}</div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {row.targetType}: {row.targetId}
                        {row.targetType === "campaign" ? (
                          <>
                            {" · "}
                            <Link
                              href={`/admin/campaigns/${encodeURIComponent(row.targetId)}`}
                              className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                            >
                              Campaign öffnen
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.slug}</td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.status}</td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">{formatEuro(row.goalCents)}</td>
                    <td className="px-3 py-2 text-emerald-700">{formatEuro(row.raisedCents)}</td>
                    <td className="px-3 py-2 text-amber-700">{formatEuro(row.waitingCents)}</td>
                    <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.pledges}</td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/support/${encodeURIComponent(row.id)}`} className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}