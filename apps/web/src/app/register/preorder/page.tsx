"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterStepper } from "../RegisterStepper";
import { EDEBATTE_PLANS } from "@/config/pricing";

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
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string } | null>(null);

  const selectedPlanInfo = PLAN_OPTIONS.find((p) => p.id === selectedPlan) ?? PLAN_OPTIONS[0];

  const successNext = withPreorderFlag(nextParam);
  const pushRoute = (href: string) => router.push(href as Parameters<typeof router.push>[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg(null);

    if (!wantsPreorder) {
      pushRoute(nextParam);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/edebatte/preorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package: selectedPlan,
          source: "register",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "Vormerkung fehlgeschlagen");
      }

      setSuccess({ planLabel: selectedPlanInfo.label });
    } catch (err: any) {
      setErrMsg(err?.message ?? "Vormerkung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <RegisterStepper current={3} />
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-900">
          <h2 className="text-lg font-semibold">Vormerkung gespeichert</h2>
          <p className="mt-2">
            Du hast <strong>{success.planLabel}</strong> vorgemerkt. Wir melden uns, sobald der Starttermin feststeht.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              onClick={() => pushRoute(successNext)}
            >
              Weiter
            </button>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              onClick={() => setSuccess(null)}
            >
              Weitere Vormerkung
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <RegisterStepper current={3} />

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schritt 3 · Vormerkung</p>
        <h1 className="text-2xl font-semibold text-slate-900">eDebatte-Paket vormerken</h1>
        <p className="text-sm text-slate-600">
          Die Vormerkung ist unverbindlich und ohne Zahlung. Du kannst sie jederzeit im Konto anpassen.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Moechtest du dein Paket jetzt vormerken?</p>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
              <input
                type="radio"
                name="preorder-choice"
                checked={wantsPreorder}
                onChange={() => setWantsPreorder(true)}
              />
              <span>
                <span className="block font-semibold text-slate-900">Ja, vormerken</span>
                <span className="block text-xs text-slate-500">Wir merken dein Wunschpaket vor.</span>
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
                <span className="block font-semibold text-slate-900">Spaeter entscheiden</span>
                <span className="block text-xs text-slate-500">Du kannst jederzeit nachholen.</span>
              </span>
            </label>
          </div>
        </div>

        {wantsPreorder ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Paket waehlen</p>
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
                      {plan.isFree ? "Kostenfrei" : `${plan.monthlyPrice.toFixed(2)} € / Monat`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {errMsg && <p className="text-sm text-rose-600">{errMsg}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                disabled={busy}
              >
                {busy ? "Sende …" : "Vormerkung senden"}
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => pushRoute(nextParam)}
              >
                Ohne Vormerkung weiter
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              onClick={() => pushRoute(nextParam)}
            >
              Weiter
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setWantsPreorder(true)}
            >
              Doch vormerken
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
