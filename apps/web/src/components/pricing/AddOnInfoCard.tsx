import Link from "next/link";
import type { InstitutionalAddOn, PricingLocale } from "@features/pricing";
import { getInstitutionalAddOnMaturityMeta } from "@features/pricing";
import AddOnMaturityBadge from "./AddOnMaturityBadge";

type Props = {
  addOn: InstitutionalAddOn;
  locale?: PricingLocale;
  ctaHref: string;
  ctaLabel?: string;
  className?: string;
  labels?: {
    whenUseful: string;
    recommendedFor: string;
    maturity: string;
  };
};

function cx(...classes: Array<string | null | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const DEFAULT_LABELS = {
  de: {
    whenUseful: "Wann sinnvoll",
    recommendedFor: "Empfohlen für",
    maturity: "Reifestand",
  },
  en: {
    whenUseful: "When useful",
    recommendedFor: "Recommended for",
    maturity: "Maturity",
  },
} as const;

export default function AddOnInfoCard({ addOn, locale = "de", ctaHref, ctaLabel, className, labels }: Props) {
  const maturity = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);
  const text = labels || DEFAULT_LABELS[locale];

  return (
    <article className={cx("rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm", className)}>
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{addOn.title}</p>
      <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{addOn.priceLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{addOn.usp}</p>

      <dl className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide">{text.whenUseful}</dt>
          <dd>{addOn.whenUseful}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide">{text.recommendedFor}</dt>
          <dd>{addOn.recommendedFor}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.maturity}</p>
      <div className="mt-1">
        <AddOnMaturityBadge addOn={addOn} locale={locale} />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{maturity.publicHint}</p>
      <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{addOn.orderability}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={ctaHref} className="btn-secondary inline-flex">
          {ctaLabel || addOn.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
