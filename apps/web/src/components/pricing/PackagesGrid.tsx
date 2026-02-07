"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EDEBATTE_PACKAGES_DE,
  PACKAGE_AUDIENCE_LABELS,
  PACKAGE_STATUS_LABELS,
  type EDebattePackageDefinition,
  type PackageAudience,
  type PackageStatus,
} from "@features/pricing";

const CURRENCY = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

type PackagesGridProps = {
  packages?: EDebattePackageDefinition[];
  showTabs?: boolean;
  className?: string;
};

const STATUS_CLASS: Record<PackageStatus, string> = {
  verfuegbar: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pilot: "bg-sky-50 text-sky-700 ring-sky-200",
  vormerkung: "bg-amber-50 text-amber-700 ring-amber-200",
  bald: "bg-slate-100 text-slate-600 ring-slate-200",
};

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function formatPrice(pkg: EDebattePackageDefinition) {
  if (pkg.preisMonat === 0) return "Kostenfrei";
  if (typeof pkg.preisMonat === "number") {
    return `${CURRENCY.format(pkg.preisMonat)} / Monat`;
  }
  return "Preis folgt";
}

export function PackagesGrid({ packages = EDEBATTE_PACKAGES_DE, showTabs = true, className }: PackagesGridProps) {
  const audiences = useMemo(() => {
    const values = Array.from(new Set(packages.map((pkg) => pkg.typ)));
    return values as PackageAudience[];
  }, [packages]);

  const shouldShowTabs = showTabs && audiences.length > 1;
  const [activeAudience, setActiveAudience] = useState<PackageAudience>(audiences[0] ?? "buerger");

  const visiblePackages = shouldShowTabs
    ? packages.filter((pkg) => pkg.typ === activeAudience)
    : packages;

  return (
    <section className={className}>
      {shouldShowTabs && (
        <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
          {audiences.map((audience) => {
            const isActive = audience === activeAudience;
            return (
              <button
                key={audience}
                type="button"
                onClick={() => setActiveAudience(audience)}
                className={
                  "rounded-full px-4 py-1.5 transition " +
                  (isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100")
                }
              >
                {audience === "buerger" ? "Fuer Buerger" : "Fuer Organisationen"}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visiblePackages.map((pkg) => {
          const priceLabel = formatPrice(pkg);
          const statusLabel = PACKAGE_STATUS_LABELS[pkg.status];
          const statusClass = STATUS_CLASS[pkg.status];
          const secondaryCta = pkg.sekundarCtaText && pkg.sekundarCtaHref;

          return (
            <article
              key={pkg.id}
              className={
                "flex h-full flex-col rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm " +
                (pkg.hervorgehoben ? "ring-2 ring-sky-200" : "")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {PACKAGE_AUDIENCE_LABELS[pkg.typ]}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{pkg.titel}</h3>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">{pkg.beschreibungKurz}</p>

              <div className="mt-4 text-xl font-bold text-slate-900">{priceLabel}</div>
              {pkg.preisJahr ? (
                <p className="text-xs text-slate-500">{CURRENCY.format(pkg.preisJahr)} / Jahr</p>
              ) : null}

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {pkg.leistungen.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-2">
                {isExternalHref(pkg.ctaHref) ? (
                  <a
                    href={pkg.ctaHref}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {pkg.ctaText}
                  </a>
                ) : (
                  <Link
                    href={pkg.ctaHref}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {pkg.ctaText}
                  </Link>
                )}
                {secondaryCta && (
                  <a
                    href={pkg.sekundarCtaHref}
                    className="text-center text-xs font-semibold text-slate-600 underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {pkg.sekundarCtaText}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
