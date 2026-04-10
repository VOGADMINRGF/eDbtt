"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PACKAGE_AUDIENCE_LABELS,
  PACKAGE_STATUS_LABELS,
  PRICING_ACTIVATION_STEPS,
  PRICING_JOURNEY_HEADLINES,
  PRICING_JOURNEY_SEGMENTS,
  getPackagesForJourneySegment,
  normalizePackageId,
  type EDebattePackageId,
  type PackageStatus,
  type PricingSegmentId,
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
  bald: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] ring-[rgb(var(--border))]",
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
  return "Preis nach Paketkontext";
}

function PackageSelectionGrid(props: {
  segmentId: PricingSegmentId;
  selectedId: EDebattePackageId;
  onSelect: (id: EDebattePackageId) => void;
}) {
  const segment = PRICING_JOURNEY_SEGMENTS.find((entry) => entry.id === props.segmentId);
  const packages = getPackagesForJourneySegment(props.segmentId);
  if (!segment || !packages.length) return null;

  return (
    <section id={segment.vormerkenAnchor} className="space-y-3">
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{segment.shortLabel}</p>
        <p className="mt-1">{segment.vormerkenIntro}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => {
          const isSelected = pkg.id === props.selectedId;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => props.onSelect(pkg.id)}
              className={cx(
                "rounded-3xl border bg-[rgb(var(--card))] p-5 text-left shadow-sm transition",
                isSelected
                  ? "border-sky-300 ring-2 ring-sky-100"
                  : "border-[rgb(var(--border))] hover:border-sky-200 hover:shadow",
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {PACKAGE_AUDIENCE_LABELS[pkg.typ]}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{pkg.titel}</p>
                </div>
                <span
                  className={cx(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                    STATUS_CLASS[pkg.status],
                  )}
                >
                  {PACKAGE_STATUS_LABELS[pkg.status]}
                </span>
              </div>

              <p className="mt-3 text-sm text-[rgb(var(--muted))]">{pkg.beschreibungKurz}</p>
              <p className="mt-4 text-base font-semibold text-[rgb(var(--fg))]">{priceLabel(pkg)}</p>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">{segment.activationHint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function VormerkenPage() {
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const allPackages = useMemo(
    () => PRICING_JOURNEY_SEGMENTS.flatMap((segment) => getPackagesForJourneySegment(segment.id)),
    [],
  );

  const initialPackage = useMemo(() => {
    const rawPackage = searchParams.get("paket");
    const normalized = normalizePackageId(rawPackage);
    const found = allPackages.find((pkg) => pkg.id === normalized);
    if (found) return found.id;
    const segmentParam = searchParams.get("segment");
    const segment = PRICING_JOURNEY_SEGMENTS.find((entry) => entry.id === segmentParam);
    if (segment) {
      const fromSegment = getPackagesForJourneySegment(segment.id)[0];
      if (fromSegment) return fromSegment.id;
    }
    return allPackages[0]?.id ?? ("basis" as EDebattePackageId);
  }, [searchParams, allPackages]);

  const [selectedPackageId, setSelectedPackageId] = useState<EDebattePackageId>(initialPackage);
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string } | null>(null);

  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.id === selectedPackageId) ?? allPackages[0] ?? null,
    [allPackages, selectedPackageId],
  );

  const targetAfterSuccess = nextParam ? withPreorderFlag(nextParam) : "/account?preorder=thanks";

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
          source: "package_start",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "Paketstart konnte nicht gespeichert werden");
      }

      setSuccess({ planLabel: selectedPackage.titel });
      setEmail("");
      setPlz("");
      setNote("");
    } catch (err: any) {
      setErrMsg(err?.message ?? "Paketstart konnte nicht gespeichert werden");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Paketstart</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] lg:text-4xl">
            {PRICING_JOURNEY_HEADLINES.vormerkenTitle}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            {PRICING_JOURNEY_HEADLINES.vormerkenIntro}
          </p>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            {PRICING_JOURNEY_HEADLINES.activationSeparation}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="btn-secondary">
              Zur Preisübersicht
            </Link>
            <Link href="/mitglied-antrag" className="btn-secondary">
              Mitgliedschaft separat beantragen
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {PRICING_JOURNEY_SEGMENTS.map((segment) => (
            <article
              key={segment.id}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{segment.shortLabel}</p>
              <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{segment.label}</p>
              <p className="mt-1">{segment.vormerkenIntro}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Was jetzt passiert</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {PRICING_ACTIVATION_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <PackageSelectionGrid
              segmentId="privat"
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />
            <PackageSelectionGrid
              segmentId="organisationen"
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />
            <PackageSelectionGrid
              segmentId="kommunen"
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />

            <section className="rounded-3xl border border-emerald-300/60 bg-emerald-500/10 p-5 text-sm text-emerald-900 dark:text-emerald-100">
              {PRICING_JOURNEY_HEADLINES.trustNote}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            {success ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-sm">
                <h2 className="text-lg font-semibold">Paketstart erfasst</h2>
                <p className="mt-1">
                  Der Paketstart für <strong>{success.planLabel}</strong> ist eingegangen.
                </p>
                <p className="mt-2 text-emerald-800/80">
                  Als Nächstes stimmen wir Freischaltung, Rollen und Einführung passend zum Einsatzkontext ab.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={targetAfterSuccess}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Weiter
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-[rgb(var(--card))] px-5 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    Zur Preisübersicht
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
                {selectedPackage ? (
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Ausgewähltes Paket</p>
                    <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{selectedPackage.titel}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{PACKAGE_AUDIENCE_LABELS[selectedPackage.typ]}</p>
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">{priceLabel(selectedPackage)}</p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Paketabschluss und Freischaltung sind getrennt: Du startest hier das Paket, die Aktivierung folgt im nächsten Schritt.
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-semibold text-[rgb(var(--muted))]">
                      E-Mail für Bestätigung
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder="name@example.org"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="plz" className="text-xs font-semibold text-[rgb(var(--muted))]">
                      PLZ (optional)
                    </label>
                    <input
                      id="plz"
                      type="text"
                      value={plz}
                      onChange={(event) => setPlz(event.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder="10115"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <label htmlFor="note" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    Einsatzkontext (optional)
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-[110px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Welche Einführung, Rollen oder Anlässe sollen wir beim Start berücksichtigen?"
                  />
                </div>

                {errMsg ? <p className="mt-3 text-sm text-rose-600">{errMsg}</p> : null}

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] hover:opacity-90 disabled:opacity-60"
                  disabled={busy}
                >
                  {busy ? "Sende …" : "Paketstart anfragen"}
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    Zur Preisübersicht
                  </Link>
                  <Link
                    href="/mitglied-antrag"
                    className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    Mitgliedschaft separat
                  </Link>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[rgb(var(--muted))]">
                  Paketstart heißt reale Leistungsbeauftragung. Zahlung, Vertragsdetails und Freischaltung werden anschließend je Paket und Nutzungskontext abgestimmt.
                </p>
              </form>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
