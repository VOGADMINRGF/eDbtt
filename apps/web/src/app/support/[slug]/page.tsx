"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SupportCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  goalCents: number;
  status: "draft" | "active" | "closed";
};

type PledgePreview = {
  id: string;
  amountCents: number;
  status: "waiting_payment" | "paid" | "canceled";
  publicName: string;
  publicRegionCode: string | null;
  createdAt: string;
};

type SupportResponse = {
  ok: true;
  supportCampaign: SupportCampaign;
  progress: {
    raisedCents: number;
    waitingCents: number;
    goalCents: number;
    pct: number;
    totalPledges: number;
  };
  recentPledges: PledgePreview[];
  paymentInfo: {
    recipient: string;
    iban: string;
    bic: string | null;
    bankName: string | null;
  } | null;
  rules: {
    noVoteInfluence: boolean;
    noXpInfluence: boolean;
    noCreditInfluence: boolean;
  };
};

type PledgeResult = {
  ok: true;
  pledge: {
    id: string;
    amountCents: number;
    paymentReference: string;
    status: "waiting_payment";
  };
  paymentInfo: {
    recipient: string;
    iban: string;
    bic: string | null;
    bankName: string | null;
  } | null;
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);
}

export default function SupportCampaignPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [data, setData] = useState<SupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("25");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [publicName, setPublicName] = useState("");
  const [publicRegionCode, setPublicRegionCode] = useState("");

  const [pledgeResult, setPledgeResult] = useState<PledgeResult | null>(null);

  useEffect(() => {
    if (!slug) return;
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      setPledgeResult(null);
      try {
        const res = await fetch(`/api/support/campaigns/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setData(body as SupportResponse);
      } catch (err: any) {
        if (!ignore) {
          setData(null);
          setError(err?.message ?? "Support-Seite konnte nicht geladen werden.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [slug]);

  const pctLabel = useMemo(() => `${Math.round((data?.progress?.pct ?? 0) * 100)}%`, [data?.progress?.pct]);

  async function submitPledge(e: FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError(null);
    setPledgeResult(null);
    try {
      const amountValue = Number(amount.replace(",", "."));
      if (!Number.isFinite(amountValue) || amountValue <= 0) throw new Error("Bitte gueltigen Betrag eingeben.");
      const res = await fetch(`/api/support/campaigns/${encodeURIComponent(slug)}/pledges`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: amountValue,
          isAnonymous,
          publicName: isAnonymous ? null : publicName,
          publicRegionCode: isAnonymous ? null : publicRegionCode,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setPledgeResult(body as PledgeResult);
      const refreshed = await fetch(`/api/support/campaigns/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const refreshedBody = await refreshed.json().catch(() => null);
      if (refreshed.ok && refreshedBody?.ok) setData(refreshedBody as SupportResponse);
    } catch (err: any) {
      setError(err?.message ?? "Unterstuetzung konnte nicht angelegt werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unterstuetzen</p>
        <h1 className="text-3xl font-bold text-slate-900">{data?.supportCampaign?.title ?? "Support"}</h1>
        <p className="text-sm text-slate-600">
          {data?.supportCampaign?.description ?? "Hilf mit, dieses Projekt transparent und unabhaengig zu tragen."}
        </p>
      </header>

      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Laedt …</section>
      ) : null}

      {error ? <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}

      {data ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Fortschritt</p>
                <p className="text-xl font-semibold text-slate-900">
                  {formatEuro(data.progress.raisedCents)} von {formatEuro(data.progress.goalCents)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{pctLabel}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, Math.round((data.progress.pct || 0) * 100))}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Zusagen gesamt: {data.progress.totalPledges} · offen: {formatEuro(data.progress.waitingCents)}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Unterstuetzen</h2>
            <p className="mt-1 text-sm text-slate-600">
              Unterstuetzung kauft keine Stimme, keine XP und keine Credits.
            </p>
            <form className="mt-4 grid gap-3" onSubmit={submitPledge}>
              <label className="grid gap-1 text-sm">
                Betrag in EUR
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="25"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                Anonym unterstuetzen
              </label>

              {!isAnonymous ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={publicName}
                    onChange={(e) => setPublicName(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Anzeigename"
                  />
                  <input
                    value={publicRegionCode}
                    onChange={(e) => setPublicRegionCode(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Region/Kuerzel"
                  />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Wird angelegt …" : "Unterstuetzung anlegen"}
              </button>
            </form>

            {pledgeResult ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Verwendungszweck: {pledgeResult.pledge.paymentReference}</p>
                <p className="mt-1">Betrag: {formatEuro(pledgeResult.pledge.amountCents)}</p>
                {pledgeResult.paymentInfo ? (
                  <p className="mt-1">
                    Empfaenger: {pledgeResult.paymentInfo.recipient} · IBAN: {pledgeResult.paymentInfo.iban}
                    {pledgeResult.paymentInfo.bic ? ` · BIC: ${pledgeResult.paymentInfo.bic}` : ""}
                  </p>
                ) : (
                  <p className="mt-1">Zahlungsdaten sind momentan nicht konfiguriert. Bitte Admin kontaktieren.</p>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Letzte Unterstuetzungen</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {data.recentPledges.length === 0 ? <li className="text-slate-500">Noch keine Eintraege.</li> : null}
              {data.recentPledges.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-slate-700">
                    {row.publicName}
                    {row.publicRegionCode ? ` (${row.publicRegionCode})` : ""}
                  </span>
                  <span className="font-semibold text-slate-900">{formatEuro(row.amountCents)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <Link href="/campaign" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        Zurueck zu Kampagnen
      </Link>
    </main>
  );
}
