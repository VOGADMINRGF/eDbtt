"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterStepper } from "../RegisterStepper";
import { EDEBATTE_PLANS } from "@/config/pricing";

const COMMITMENTS = [12, 24] as const;
type CommitmentMonths = (typeof COMMITMENTS)[number];

type PackageId = "basis" | "start" | "pro";
type PlanOption = {
  id: PackageId;
  label: string;
  description: string;
  monthlyPrice: number;
  isFree?: boolean;
};

function sanitizeNext(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

function withPreorderFlag(nextUrl: string) {
  if (!nextUrl.startsWith("/account")) return nextUrl;
  try {
    const url = new URL(nextUrl, "http://local");
    url.searchParams.set("preorder", "thanks");
    return `${url.pathname}${url.search}`;
  } catch {
    return nextUrl;
  }
}

const PLAN_OPTIONS: PlanOption[] = EDEBATTE_PLANS.map((plan) => {
  const raw = plan.id.replace(/^edb-/, "");
  const id = (raw === "basis" || raw === "start" || raw === "pro" ? raw : "start") as PackageId;
  return {
    id,
    label: plan.label,
    description: plan.description,
    monthlyPrice: plan.listPrice.amount,
    isFree: plan.isFree,
  };
});

export default function PreorderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = useMemo(
    () => sanitizeNext(searchParams.get("next")) ?? "/account?welcome=1",
    [searchParams],
  );

  const planParam = searchParams.get("plan");
  const initialPlan: PackageId =
    planParam === "basis" || planParam === "start" || planParam === "pro" ? planParam : "start";

  const [wantsPreorder, setWantsPreorder] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PackageId>(initialPlan);
  const [commitmentMonths, setCommitmentMonths] = useState<CommitmentMonths>(12);

  const [holderName, setHolderName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");

  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string; commitmentMonths?: number } | null>(null);

  const selectedPlanInfo = PLAN_OPTIONS.find((p) => p.id === selectedPlan) ?? PLAN_OPTIONS[0];
  const isPaidPlan = !selectedPlanInfo.isFree && selectedPlanInfo.monthlyPrice > 0;

  const successNext = withPreorderFlag(nextParam);
  const pushRoute = (href: string) => router.push(href as Parameters<typeof router.push>[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg(null);

    if (!wantsPreorder) {
      pushRoute(nextParam);
      return;
    }

    if (isPaidPlan) {
      if (!holderName.trim() || !iban.trim()) {
        setErrMsg("Bitte Kontoinhaber:in und IBAN angeben.");
        return;
      }
      if (!confirm) {
        setErrMsg("Bitte bestätige die verbindliche Vorbestellung.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/edebatte/preorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package: selectedPlan,
          commitmentMonths: isPaidPlan ? commitmentMonths : undefined,
          confirm: isPaidPlan ? confirm : undefined,
          payment: isPaidPlan
            ? { holderName: holderName.trim(), iban: iban.trim(), bic: bic.trim() || undefined }
            : undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "Vorbestellung fehlgeschlagen");
      }

      setSuccess({
        planLabel: selectedPlanInfo.label,
        commitmentMonths: isPaidPlan ? commitmentMonths : undefined,
      });
    } catch (err: any) {
      setErrMsg(err?.message ?? "Vorbestellung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <RegisterStepper current={3} />

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schritt 3 · Vorbestellung</p>
        <h1 className="text-2xl font-semibold text-slate-900">eDebatte-Paket verbindlich vorbestellen</h1>
        <p className="text-sm text-slate-600">
          Wähle Paket und Laufzeit und hinterlege die Zahlungsdaten. Danach erhältst du eine Bestätigung per E-Mail – und
          im Konto ist deine Buchung sofort sichtbar.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Möchtest du jetzt verbindlich vorbestellen?</p>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
              <input
                type="radio"
                name="preorder-choice"
                checked={wantsPreorder}
                onChange={() => setWantsPreorder(true)}
              />
              <span>
                <span className="block font-semibold text-slate-900">Ja, verbindlich vorbestellen</span>
                <span className="block text-xs text-slate-500">Paket, Laufzeit & Bankdaten jetzt festlegen.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <input
                type="radio"
                name="preorder-choice"
                checked={!wantsPreorder}
                onChange={() => setWantsPreorder(false)}
              />
              <span>
                <span className="block font-semibold text-slate-900">Später entscheiden</span>
                <span className="block text-xs text-slate-500">Du kannst jederzeit im Konto nachholen.</span>
              </span>
            </label>
          </div>
        </div>

        {wantsPreorder ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Paket wählen</p>
              <div className="grid gap-3 md:grid-cols-3">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={[
                      "rounded-2xl border px-3 py-3 text-left text-sm transition",
                      selectedPlan === plan.id
                        ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200",
                    ].join(" ")}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{plan.label}</p>
                    <p className="mt-2 text-xs text-slate-600">{plan.description}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {plan.isFree ? "Kostenlos" : `${plan.monthlyPrice.toFixed(2).replace(".", ",")} € / Monat`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {isPaidPlan && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Laufzeit</p>
                <div className="flex flex-wrap gap-2">
                  {COMMITMENTS.map((months) => (
                    <label
                      key={months}
                      className={[
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold",
                        commitmentMonths === months
                          ? "border-sky-300 bg-sky-50 text-sky-900"
                          : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="commitment"
                        value={months}
                        checked={commitmentMonths === months}
                        onChange={() => setCommitmentMonths(months)}
                      />
                      {months} Monate
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isPaidPlan && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-900">Bankdaten</p>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-slate-700">
                    Kontoinhaber:in
                    <input
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      required
                    />
                  </label>

                  <label className="space-y-1 text-xs font-medium text-slate-700">
                    IBAN
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      required
                    />
                  </label>
                </div>

                <label className="space-y-1 text-xs font-medium text-slate-700">
                  BIC (optional)
                  <input
                    type="text"
                    value={bic}
                    onChange={(e) => setBic(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                  Ich bestätige die verbindliche Vorbestellung für {commitmentMonths} Monate.
                </label>
              </div>
            )}

            {errMsg && <p className="text-sm text-rose-600">{errMsg}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
              >
                {busy ? "Sende …" : "Verbindlich vorbestellen"}
              </button>

              <button
                type="button"
                onClick={() => pushRoute(nextParam)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Ohne Vorbestellung weiter
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => pushRoute(nextParam)}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Weiter zum Konto
            </button>
            <button
              type="button"
              onClick={() => setWantsPreorder(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Doch vorbestellen
            </button>
          </div>
        )}
      </section>

      {success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
          onClick={() => pushRoute(successNext)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Vorbestellung bestätigt</h2>
            <p className="mt-2 text-sm text-slate-600">
              Du hast {success.planLabel} verbindlich vorbestellt
              {success.commitmentMonths ? ` (${success.commitmentMonths} Monate)` : ""}.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Bestätigung per E-Mail ist unterwegs. In deinem Konto siehst du die Buchung sofort.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => pushRoute(successNext)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Zum Konto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
