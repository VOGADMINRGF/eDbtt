"use client";

import type { InstitutionalAddOn } from "@features/pricing";
import { getInstitutionalAddOnMaturityMeta } from "@features/pricing";
import type { PricingLocale } from "@features/pricing";

type Props = {
  addOn: InstitutionalAddOn;
  locale?: PricingLocale;
  className?: string;
};

function cx(...classes: Array<string | null | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AddOnMaturityBadge({ addOn, locale = "de", className }: Props) {
  const meta = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-sky-300/70 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-900 dark:text-sky-100",
        className,
      )}
    >
      {addOn.badgeLabel || meta.label}
    </span>
  );
}
