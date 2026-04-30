"use client";

import Link from "next/link";
import {
  formatPackageBillingModeLabel,
  formatPackagePriceLabel,
  type EDebattePackageDefinition,
  type PricingLocale,
} from "@features/pricing";

type PackagesGridProps = {
  packages?: EDebattePackageDefinition[];
  tone?: "default" | "journalism";
  locale?: PricingLocale;
  compact?: boolean;
  labels?: {
    forWhom: string;
    intendedFor: string;
    differenceToNext: string;
    included: string;
  };
};

const DEFAULT_LABELS = {
  de: {
    forWhom: "Für wen?",
    intendedFor: "Wofür gedacht?",
    differenceToNext: "Unterschied zur nächsten Stufe",
    included: "Was ist enthalten?",
  },
  en: {
    forWhom: "For whom?",
    intendedFor: "Intended for",
    differenceToNext: "Difference to the next tier",
    included: "What is included?",
  },
} as const;

function withLocaleHref(href: string, locale: PricingLocale) {
  if (locale !== "en") return href;
  if (/^[a-z]+:/i.test(href)) return href;

  const [pathAndQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", "en");
  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

function PackagesGrid({ packages = [], tone = "default", locale = "de", compact = false, labels }: PackagesGridProps) {
  const items = packages;
  const text = labels || DEFAULT_LABELS[locale];
  const gridColsClass =
    items.length === 1 ? "lg:grid-cols-1" : items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <div className={`grid items-stretch gap-6 ${gridColsClass}`}>
      {items.map((pkg) => {
        const isAccent = tone === "journalism";
        return (
          <article
            key={pkg.id}
            className={[
              "flex h-full flex-col rounded-3xl border bg-[rgb(var(--card))] p-7 shadow-sm sm:p-8",
              isAccent
                ? "border-amber-200/80"
                : "border-[rgb(var(--border))]",
              pkg.hervorgehoben
                ? "ring-1 ring-sky-200/80"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{pkg.zielgruppe}</p>
            <h3 className="mt-2 min-h-[3.7rem] text-2xl font-semibold leading-tight text-[rgb(var(--fg))]">{pkg.titel}</h3>

            <p className="mt-6 text-[1.65rem] font-bold tracking-tight text-[rgb(var(--fg))]">{formatPackagePriceLabel(pkg, locale)}</p>
            <p className="mt-1 text-xs font-medium text-[rgb(var(--muted))]">
              {locale === "en" ? "Billing mode:" : "Abrechnungsmodus:"} {formatPackageBillingModeLabel(pkg, locale)}
            </p>
            {!compact ? (
              <p className="mt-4 min-h-[5rem] text-base leading-relaxed text-[rgb(var(--muted))]">{pkg.beschreibungKurz}</p>
            ) : null}

            <dl className="mt-6 space-y-3 text-xs leading-relaxed text-[rgb(var(--muted))]">
              {compact ? (
                <>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3">
                    <dt className="font-semibold uppercase tracking-wide text-sky-800">{text.included}</dt>
                    <dd className="mt-1">
                      <ul className="space-y-1 text-sm leading-relaxed text-sky-900">
                        {pkg.leistungen.slice(0, 6).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-3">
                    <dt className="font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {text.forWhom} · {text.intendedFor}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed">
                      <p>{pkg.fuerWen}</p>
                      <p className="mt-1">{pkg.wofuerGedacht}</p>
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-3">
                    <dt className="font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.forWhom}</dt>
                    <dd className="mt-1 text-sm leading-relaxed">{pkg.fuerWen}</dd>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-3">
                    <dt className="font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.intendedFor}</dt>
                    <dd className="mt-1 text-sm leading-relaxed">{pkg.wofuerGedacht}</dd>
                  </div>
                </>
              )}
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3.5 py-3">
                <dt className="font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.differenceToNext}</dt>
                <dd className="mt-1 text-sm leading-relaxed">{pkg.unterschiedZurNaechstenStufe}</dd>
              </div>
            </dl>

            {!compact ? (
              <ul className="mt-6 space-y-2.5 text-sm text-[rgb(var(--muted))]">
                {pkg.leistungen.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-auto space-y-2 pt-8">
              <Link
                href={withLocaleHref(pkg.ctaHref, locale)}
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(14,165,233,0.25)] hover:opacity-90"
              >
                {pkg.ctaText}
              </Link>

              {pkg.sekundarCtaHref && pkg.sekundarCtaText ? (
                pkg.sekundarCtaHref.startsWith("http") ? (
                  <a
                    href={pkg.sekundarCtaHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-3 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    {pkg.sekundarCtaText}
                  </a>
                ) : (
                  <Link
                    href={withLocaleHref(pkg.sekundarCtaHref, locale)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-3 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    {pkg.sekundarCtaText}
                  </Link>
                )
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export { PackagesGrid };
export default PackagesGrid;
