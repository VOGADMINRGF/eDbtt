"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EDEBATTE_PACKAGES_DE,
  PACKAGE_AUDIENCE_LABELS,
  type EDebattePackageId,
} from "@features/pricing";

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

export default function VormerkenPage() {
  const searchParams = useSearchParams();
  const nextParam = useMemo(
    () => sanitizeNext(searchParams.get("next")),
    [searchParams],
  );

  const initialPackage = useMemo(() => {
    const raw = searchParams.get("paket");
    if (raw === "basis" || raw === "start" || raw === "pro") return raw;
    return EDEBATTE_PACKAGES_DE[0]?.id ?? "basis";
  }, [searchParams]);

  const [selectedPackageId, setSelectedPackageId] = useState<EDebattePackageId>(
    initialPackage,
  );
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string } | null>(null);

  const selectedPackage = useMemo(
    () => EDEBATTE_PACKAGES_DE.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [selectedPackageId],
  );

  const targetAfterSuccess = nextParam ? withPreorderFlag(nextParam) : "/pricing";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPackage) return;
    setErrMsg(null);
    setBusy(true);

    try {
      const res = await fetch("/api/edebatte/preorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package: selectedPackage.id,
          email: email.trim() || undefined,
          plz: plz.trim() || undefined,
          note: note.trim() || undefined,
          type: selectedPackage.typ,
          source: "vormerken",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "Vormerkung fehlgeschlagen");
      }

      setSuccess({ planLabel: selectedPackage.titel });
      setEmail("");
      setPlz("");
      setNote("");
    } catch (err: any) {
      setErrMsg(err?.message ?? "Vormerkung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--brand-from)] via-white to-white pb-16">
      <section className="mx-auto max-w-3xl px-4 py-16 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vormerkung</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">eDebatte-Paket vormerken</h1>
          <p className="mt-2 text-sm text-slate-600">
            Die Vormerkung ist unverbindlich und ohne Zahlung. Wir informieren dich, sobald der Starttermin feststeht.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Paket waehlen</label>
            <div className="grid gap-3 md:grid-cols-3">
              {EDEBATTE_PACKAGES_DE.map((pkg) => {
                const isSelected = pkg.id === selectedPackageId;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={
                      "rounded-2xl border px-3 py-3 text-left text-sm transition " +
                      (isSelected
                        ? "border-sky-300 bg-sky-50 text-slate-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200")
                    }
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pkg.titel}</p>
                    <p className="mt-2 text-xs text-slate-600">{pkg.beschreibungKurz}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{PACKAGE_AUDIENCE_LABELS[pkg.typ]}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                E-Mail (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="name@example.org"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plz" className="text-xs font-semibold text-slate-700">
                PLZ (optional)
              </label>
              <input
                id="plz"
                type="text"
                value={plz}
                onChange={(event) => setPlz(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="10115"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="note" className="text-xs font-semibold text-slate-700">
              Hinweis (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="Worauf sollen wir achten, wenn wir dich kontaktieren?"
            />
          </div>

          {errMsg && <p className="text-sm text-rose-600">{errMsg}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              disabled={busy}
            >
              {busy ? "Sende …" : "Vormerkung senden"}
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Zurueck zu den Paketen
            </Link>
          </div>
        </form>

        {success && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-900">
            <h2 className="text-lg font-semibold">Vormerkung gespeichert</h2>
            <p className="mt-1">
              Danke! Du bist fuer <strong>{success.planLabel}</strong> vorgemerkt. Wir melden uns, sobald der Starttermin
              feststeht.
            </p>
            <div className="mt-3">
              <Link
                href={targetAfterSuccess}
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Weiter
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
