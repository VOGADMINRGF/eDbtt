"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegisterStepper } from "../RegisterStepper";
import { EDEBATTE_PLANS } from "@/config/pricing";
import { BANK_DETAILS } from "@/config/banking";

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

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
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
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [pledgeBusy, setPledgeBusy] = useState(false);
  const [pledgeError, setPledgeError] = useState<string | null>(null);
  const [pledgeResult, setPledgeResult] = useState<{ amount: number; reference: string } | null>(null);

  const selectedPlanInfo = PLAN_OPTIONS.find((p) => p.id === selectedPlan) ?? PLAN_OPTIONS[0];

  const successNext = withPreorderFlag(nextParam);
  const pushRoute = (href: string) => router.push(href as Parameters<typeof router.push>[0]);

  useEffect(() => {
    if (!success) return;
    const defaultAmount = selectedPlanInfo?.monthlyPrice > 0 ? selectedPlanInfo.monthlyPrice : 25;
    setPledgeAmount(defaultAmount.toFixed(2).replace(".", ","));
    setPledgeResult(null);
    setPledgeError(null);
  }, [success, selectedPlanInfo]);

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

  async function submitPledge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPledgeError(null);
    setPledgeResult(null);

    const numericAmount = Number(pledgeAmount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setPledgeError("Bitte einen gueltigen Betrag eingeben.");
      return;
    }

    setPledgeBusy(true);
    try {
      const res = await fetch("/api/edebatte/pledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || body?.message || "Zahlungszusage fehlgeschlagen");
      }
      setPledgeResult(body.pledge ?? null);
    } catch (err: any) {
      setPledgeError(err?.message ?? "Zahlungszusage fehlgeschlagen");
    } finally {
      setPledgeBusy(false);
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
              className="rounded-full border border-emerald-200 bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              onClick={() => setSuccess(null)}
            >
              Weitere Vormerkung
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Optional · Verbindlich
            </p>
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Verbindliche Zahlungszusage</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Wenn du statt einer unverbindlichen Vormerkung bereits jetzt Geld zur Verfuegung stellen
              moechtest, kannst du hier eine einmalige Zahlungszusage anlegen.
            </p>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitPledge}>
            <label className="grid gap-1 text-sm">
              Betrag in EUR
              <input
                value={pledgeAmount}
                onChange={(event) => setPledgeAmount(event.target.value)}
                inputMode="decimal"
                className="rounded-xl border border-[rgb(var(--border))] px-3 py-2"
                placeholder="25,00"
                required
              />
            </label>
            <button
              type="submit"
              disabled={pledgeBusy}
              className="mt-5 h-fit rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {pledgeBusy ? "Wird angelegt …" : "Zahlungszusage anlegen"}
            </button>
          </form>

          {pledgeError ? <p className="mt-3 text-sm text-rose-600">{pledgeError}</p> : null}

          {pledgeResult ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Verwendungszweck: {pledgeResult.reference}</p>
              <p className="mt-1">Betrag: {formatEuro(pledgeResult.amount)}</p>
              <p className="mt-2 text-emerald-900/80">Bankverbindung:</p>
              <p className="text-emerald-900/80">
                Empfaenger: {BANK_DETAILS.recipient} · IBAN: {BANK_DETAILS.iban}
                {BANK_DETAILS.bic ? ` · BIC: ${BANK_DETAILS.bic}` : ""}
              </p>
              <p className="mt-2 text-[11px] text-emerald-900/70">
                Hinweis: Spenden und Mitgliedsbeitraege laufen weiterhin ueber VoiceOpenGov.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <RegisterStepper current={3} />

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 3 · Vormerkung</p>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">eDebatte-Paket vormerken</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Die Vormerkung ist unverbindlich und ohne Zahlung. Du kannst sie jederzeit im Konto anpassen.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Moechtest du dein Paket jetzt vormerken?</p>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
              <input
                type="radio"
                name="preorder-choice"
                checked={wantsPreorder}
                onChange={() => setWantsPreorder(true)}
              />
              <span>
                <span className="block font-semibold text-[rgb(var(--fg))]">Ja, vormerken</span>
                <span className="block text-xs text-[rgb(var(--muted))]">Wir merken dein Wunschpaket vor.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm">
              <input
                type="radio"
                name="preorder-choice"
                checked={!wantsPreorder}
                onChange={() => setWantsPreorder(false)}
              />
              <span>
                <span className="block font-semibold text-[rgb(var(--fg))]">Spaeter entscheiden</span>
                <span className="block text-xs text-[rgb(var(--muted))]">Du kannst jederzeit nachholen.</span>
              </span>
            </label>
          </div>
        </div>

        {wantsPreorder ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Paket waehlen</p>
              <div className="grid gap-3 md:grid-cols-3">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={[
                      "rounded-2xl border px-3 py-3 text-left text-sm transition",
                      selectedPlan === plan.id
                        ? "border-sky-300 bg-sky-50 text-[rgb(var(--fg))] shadow-sm"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:border-sky-200",
                    ].join(" ")}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{plan.label}</p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">{plan.description}</p>
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
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
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
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
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
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
