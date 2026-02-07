"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EDEBATTE_PACKAGES_DE,
  PACKAGE_AUDIENCE_LABELS,
  PACKAGE_STATUS_LABELS,
  type EDebattePackageId,
  type PackageStatus,
} from "@features/pricing";

const CURRENCY = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const STATUS_CLASS: Record<PackageStatus, string> = {
  verfuegbar: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pilot: "bg-sky-50 text-sky-700 ring-sky-200",
  vormerkung: "bg-amber-50 text-amber-700 ring-amber-200",
  bald: "bg-slate-100 text-slate-600 ring-slate-200",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

function priceLabel(pkg: { preisMonat?: number; preisJahr?: number }) {
  if (pkg.preisMonat === 0) return "Kostenfrei";
  if (typeof pkg.preisMonat === "number") return `${CURRENCY.format(pkg.preisMonat)} / Monat`;
  if (typeof pkg.preisJahr === "number") return `${CURRENCY.format(pkg.preisJahr)} / Jahr`;
  return "Preis folgt";
}

export default function VormerkenPage() {
  const searchParams = useSearchParams();

  const nextParam = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const initialPackage = useMemo(() => {
    const raw = searchParams.get("paket");
    if (raw === "basis" || raw === "start" || raw === "pro") return raw;
    return (EDEBATTE_PACKAGES_DE[0]?.id ?? "basis") as EDebattePackageId;
  }, [searchParams]);

  const [selectedPackageId, setSelectedPackageId] = useState<EDebattePackageId>(initialPackage);
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string } | null>(null);

  const selectedPackage = useMemo(
    () => EDEBATTE_PACKAGES_DE.find((pkg) => pkg.id === selectedPackageId) ?? EDEBATTE_PACKAGES_DE[0] ?? null,
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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[var(--brand-from)] via-white to-white pb-16">
      {/* ruhige CI-Hintergrundakzente */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vormerkung</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">eDebatte-Paket vormerken</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Unverbindlich, ohne Zahlung. Du bekommst Bescheid, sobald der Starttermin feststeht – und kannst die Auswahl
            später im Konto ändern.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {/* Paket-Auswahl */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">1) Paket auswählen</p>
              <p className="mt-2 text-sm text-slate-700">
                Wähle das Paket, das am besten passt. Das „Empfohlen“-Paket ist nur ein Vorschlag, kein Druck.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {EDEBATTE_PACKAGES_DE.map((pkg) => {
                const isSelected = pkg.id === selectedPackageId;
                return (
                  <div
                    key={pkg.id}
                    className={cx(
                      "rounded-3xl p-[1px] shadow-sm",
                      isSelected
                        ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.8),rgba(16,185,129,0.8))]"
                        : "bg-[linear-gradient(135deg,rgba(14,165,233,0.45),rgba(16,185,129,0.45))]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={cx(
                        "group relative w-full rounded-[22px] bg-white/95 p-5 text-left transition",
                        isSelected ? "ring-2 ring-sky-100" : "hover:shadow",
                      )}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {PACKAGE_AUDIENCE_LABELS[pkg.typ]}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{pkg.titel}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {pkg.hervorgehoben ? (
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-200">
                              Empfohlen
                            </span>
                          ) : null}
                          <span
                            className={cx(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                              STATUS_CLASS[pkg.status],
                            )}
                          >
                            {PACKAGE_STATUS_LABELS[pkg.status]}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">{pkg.beschreibungKurz}</p>

                      <p className="mt-4 text-base font-semibold text-slate-900">{priceLabel(pkg)}</p>

                      <ul className="mt-3 space-y-1 text-sm text-slate-700">
                        {pkg.leistungen.slice(0, 3).map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>{isSelected ? "Ausgewählt" : "Auswählen"}</span>
                        <span
                          className={cx(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-bold",
                            isSelected ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-400",
                          )}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 text-sm text-slate-700 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2) Kontakt (optional)</p>
              <p className="mt-2">
                Wenn du deine E-Mail angibst, bestätigen wir die Vormerkung per Mail. Ohne E-Mail wird die Vormerkung
                trotzdem gespeichert (wenn du eingeloggt bist).
              </p>
            </div>
          </div>

          {/* Sticky “Checkout”-Karte */}
          <aside className="lg:sticky lg:top-24">
            {success ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-sm">
                <h2 className="text-lg font-semibold">Vormerkung gespeichert</h2>
                <p className="mt-1">
                  Danke! Du bist für <strong>{success.planLabel}</strong> vorgemerkt.
                </p>
                <p className="mt-2 text-emerald-800/80">Wir melden uns, sobald der Starttermin feststeht.</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={targetAfterSuccess}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Weiter
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    Zurück zu den Paketen
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                {selectedPackage ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ausgewählt</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{selectedPackage.titel}</p>
                        <p className="mt-1 text-sm text-slate-600">{PACKAGE_AUDIENCE_LABELS[selectedPackage.typ]}</p>
                      </div>
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                          STATUS_CLASS[selectedPackage.status],
                        )}
                      >
                        {PACKAGE_STATUS_LABELS[selectedPackage.status]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-900">{priceLabel(selectedPackage)}</p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-1">
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

                <div className="mt-4 space-y-1">
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

                {errMsg ? <p className="mt-3 text-sm text-rose-600">{errMsg}</p> : null}

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] hover:opacity-90 disabled:opacity-60"
                  disabled={busy}
                >
                  {busy ? "Sende …" : "Vormerkung senden"}
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Zurück zu den Paketen
                  </Link>

                  {selectedPackage?.sekundarCtaHref ? (
                    <a
                      href={selectedPackage.sekundarCtaHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Aufbau unterstützen
                    </a>
                  ) : null}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Hinweis: Die Vormerkung ist unverbindlich. Keine Zahlung, kein Abo. Wir nutzen die Angaben nur, um dich
                  zum Start zu informieren.
                </p>
              </form>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
