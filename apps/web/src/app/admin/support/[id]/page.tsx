"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type SupportCampaignDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  goalCents: number;
  targetType?: "campaign" | "project" | "question";
  targetId?: string | null;
};

type SupportPledge = {
  id: string;
  amountCents: number;
  status: "waiting_payment" | "paid" | "canceled";
  paymentReference: string;
  isAnonymous: boolean;
  publicName: string | null;
  publicRegionCode: string | null;
  createdAt: string;
  paidAt: string | null;
  canceledAt: string | null;
};

type DetailResponse = {
  ok: true;
  supportCampaign: SupportCampaignDetail;
  totals: {
    raisedCents: number;
    waitingCents: number;
    canceledCents: number;
    totalPledges: number;
    goalCents: number;
  };
  pledges: SupportPledge[];
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

export default function AdminSupportDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting_payment" | "paid" | "canceled">("all");
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter === "all" ? "" : `?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(`/api/admin/support/campaigns/${encodeURIComponent(id)}${query}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setData(body as DetailResponse);
    } catch (err: any) {
      setError(err?.message ?? "Support-Details konnten nicht geladen werden.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePledgeStatus(pledgeId: string, status: "paid" | "canceled") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/pledges/${encodeURIComponent(pledgeId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Status konnte nicht aktualisiert werden.");
    } finally {
      setBusy(false);
    }
  }

  const pct = useMemo(() => {
    const raised = data?.totals?.raisedCents ?? 0;
    const goal = data?.totals?.goalCents ?? 0;
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }, [data?.totals?.raisedCents, data?.totals?.goalCents]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Support Detail</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{data?.supportCampaign?.title ?? "Support Campaign"}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Verbuchen, stornieren und transparent reporten. Keine Stimmen, keine XP, keine Credits.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/admin/support" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          Zurück zu Support
        </Link>
        {data?.supportCampaign?.targetType === "campaign" && data.supportCampaign.targetId ? (
          <Link
            href={`/admin/campaigns/${encodeURIComponent(data.supportCampaign.targetId)}`}
            className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Zur Campaign
          </Link>
        ) : null}
        {data?.supportCampaign?.slug ? (
          <Link
            href={`/support/${encodeURIComponent(data.supportCampaign.slug)}`}
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Public Seite
          </Link>
        ) : null}
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">Lädt …</section>
      ) : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Raised</p>
                <p className="text-xl font-semibold text-[rgb(var(--fg))]">
                  {formatEuro(data.totals.raisedCents)} von {formatEuro(data.totals.goalCents)}
                </p>
              </div>
              <div className="text-sm font-semibold text-[rgb(var(--muted))]">{pct}%</div>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[rgb(var(--bg))]">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Offen: {formatEuro(data.totals.waitingCents)} · Storniert: {formatEuro(data.totals.canceledCents)} ·
              Pledges: {data.totals.totalPledges}
            </p>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(["all", "waiting_payment", "paid", "canceled"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusFilter === item ? "bg-slate-900 text-white" : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() =>
                  window.open(
                    `/api/admin/support/campaigns/${encodeURIComponent(id)}?format=csv${statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`}`,
                    "_blank",
                  )
                }
                className="ml-auto rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))]"
              >
                CSV Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-[rgb(var(--border))] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                  <tr>
                    <th className="px-3 py-2">Ref</th>
                    <th className="px-3 py-2">Betrag</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Zeit</th>
                    <th className="px-3 py-2 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pledges.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-[rgb(var(--muted))]" colSpan={6}>
                        Keine Pledges im aktuellen Filter.
                      </td>
                    </tr>
                  ) : null}
                  {data.pledges.map((row) => (
                    <tr key={row.id} className="border-b border-[rgb(var(--border))]">
                      <td className="px-3 py-2 font-mono text-xs text-[rgb(var(--muted))]">{row.paymentReference}</td>
                      <td className="px-3 py-2 text-[rgb(var(--fg))]">{formatEuro(row.amountCents)}</td>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.status}</td>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.isAnonymous ? "Anonym" : row.publicName || "—"}</td>
                      <td className="px-3 py-2 text-[rgb(var(--muted))]">{new Date(row.createdAt).toLocaleString("de-DE")}</td>
                      <td className="px-3 py-2 text-right">
                        {row.status === "waiting_payment" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              disabled={busy}
                              onClick={() => updatePledgeStatus(row.id, "paid")}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              mark paid
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => updatePledgeStatus(row.id, "canceled")}
                              className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[rgb(var(--muted))]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
