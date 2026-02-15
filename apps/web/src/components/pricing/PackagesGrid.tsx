"use client";

import Link from "next/link";
import {
  EDEBATTE_PACKAGES_DE,
  PACKAGE_STATUS_LABELS,
  type EDebattePackageDefinition,
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

function priceLine(pkg: { preisMonat?: number; preisJahr?: number }) {
  if (pkg.preisMonat === 0) return "Kostenfrei";
  if (typeof pkg.preisMonat === "number") return `${CURRENCY.format(pkg.preisMonat)} / Monat`;
  if (typeof pkg.preisJahr === "number") return `${CURRENCY.format(pkg.preisJahr)} / Jahr`;
  return "Preis folgt";
}

type PackagesGridProps = {
  packages?: EDebattePackageDefinition[];
};

function PackagesGrid({ packages }: PackagesGridProps) {
  const items = packages ?? EDEBATTE_PACKAGES_DE;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((pkg) => (
        <div
          key={pkg.id}
          className={cx(
            "rounded-3xl p-[1px] shadow-sm",
            pkg.hervorgehoben
              ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.75),rgba(16,185,129,0.75))]"
              : "bg-[linear-gradient(135deg,rgba(14,165,233,0.45),rgba(16,185,129,0.45))]",
          )}
        >
          <article className="rounded-[22px] bg-white/95 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {pkg.zielgruppe}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">{pkg.titel}</h3>
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

            <p className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">{priceLine(pkg)}</p>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {pkg.leistungen.slice(0, 4).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2">
              <Link
                href={pkg.ctaHref}
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(14,165,233,0.25)] hover:opacity-90"
              >
                {pkg.ctaText}
              </Link>

              {pkg.sekundarCtaHref && pkg.sekundarCtaText ? (
                <a
                  href={pkg.sekundarCtaHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {pkg.sekundarCtaText}
                </a>
              ) : null}
            </div>

            <p className="mt-4 text-xs text-slate-500">Vormerkung = unverbindlich. Keine Zahlung, kein Abo.</p>
          </article>
        </div>
      ))}
    </div>
  );
}

export { PackagesGrid };
export default PackagesGrid;
