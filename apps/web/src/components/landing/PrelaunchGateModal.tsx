"use client";

import * as React from "react";
import Link from "next/link";
import type { Lang } from "@features/landing/landingCopy";
import { PRELAUNCH_GATE_COPY } from "./prelaunchGateCopy";
import { formatPackagePriceLabel, getPackagesByIds, PRIVATE_PACKAGE_IDS } from "@features/pricing";

type PrelaunchGateModalProps = {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  onRefine: () => void;
  onSubmit: () => void;
  preorderHref?: string;
  registerHref?: string;
};

export function PrelaunchGateModal({
  lang,
  open,
  onClose,
  onRefine,
  onSubmit,
  preorderHref = "/order",
  registerHref = "/register?next=%2Fcreate",
}: PrelaunchGateModalProps) {
  if (!open) return null;
  const c = PRELAUNCH_GATE_COPY[lang];

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl backdrop-blur-md">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.18em] text-[rgb(var(--muted))]">{c.brand}</div>
                <h2 className="mt-2 text-2xl font-extrabold text-[rgb(var(--fg))]">{c.title}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{c.lead}</p>
                <ul className="mt-3 space-y-1 text-sm text-[rgb(var(--muted))]">
                  {c.bullets.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{c.refineTitle}</p>
                <p className="mt-2 text-sm font-semibold text-[rgb(var(--muted))]">{c.refineText}</p>
                <button
                  type="button"
                  className="btn-secondary mt-4 inline-flex w-full items-center justify-center px-4 py-2.5 text-sm"
                  onClick={() => {
                    onClose();
                    onRefine();
                  }}
                >
                  {c.refineCta} →
                </button>
              </div>

              <div className="rounded-2xl border border-[rgb(var(--grad-from))]/40 bg-[rgb(var(--card))] p-5 shadow-sm ring-1 ring-[rgb(var(--grad-from))]/20">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{c.submitTitle}</p>
                <p className="mt-2 text-sm font-semibold text-[rgb(var(--muted))]">{c.submitText}</p>
                <button
                  type="button"
                  className="btn-primary mt-3 inline-flex w-full items-center justify-center px-4 py-2.5 text-sm font-extrabold"
                  onClick={() => {
                    onClose();
                    onSubmit();
                  }}
                >
                  {c.submitCta} →
                </button>
                <p className="mt-3 text-xs text-[rgb(var(--muted))]">{c.submitHint}</p>
                <Link
                  href={registerHref}
                  className="mt-1 inline-flex text-xs font-semibold text-[rgb(var(--muted))] underline-offset-4 hover:underline"
                >
                  {c.registerCta}
                </Link>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] p-4">
              <details>
                <summary className="list-none cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                      {c.productsTitle}
                    </p>
                    <p className="text-[11px] text-[rgb(var(--muted))]">{c.productsHint}</p>
                  </div>
                </summary>

                <div className="mt-3 flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
                  {getPackagesByIds(PRIVATE_PACKAGE_IDS).map((pkg) => {
                    const isHighlighted = pkg.hervorgehoben;
                    const priceLabel = formatPackagePriceLabel(pkg);
                    const cardClassName = isHighlighted
                      ? "rounded-2xl border border-[rgb(var(--grad-from))] bg-[rgb(var(--card))] p-5 shadow-sm ring-1 ring-[rgb(var(--grad-from))]/30"
                      : "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm";
                    const ctaClassName = isHighlighted
                      ? "btn-primary inline-flex w-full items-center justify-center px-4 py-2.5 text-sm font-extrabold"
                      : pkg.preisMonat === 0
                        ? "inline-flex w-full items-center justify-center rounded-full bg-[rgb(var(--fg))] px-4 py-2.5 text-sm font-extrabold text-[rgb(var(--bg))] shadow-sm hover:opacity-95"
                        : "btn-secondary inline-flex w-full items-center justify-center px-4 py-2.5 text-sm";
                    return (
                      <div key={pkg.id} className={`min-w-[240px] max-w-[280px] flex-1 snap-start ${cardClassName}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">eDebatte</p>
                        <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{pkg.titel}</p>
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{pkg.beschreibungKurz}</p>
                        <p className="mt-2 text-xs font-semibold text-[rgb(var(--muted))]">{priceLabel}</p>
                        <a href={pkg.ctaHref || preorderHref} className={`${ctaClassName} mt-4`}>
                          {pkg.ctaText} →
                        </a>
                        {pkg.sekundarCtaText && pkg.sekundarCtaHref && (
                          pkg.sekundarCtaHref.startsWith("http") ? (
                            <a
                              href={pkg.sekundarCtaHref}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-xs font-semibold text-[rgb(var(--muted))] underline-offset-4 hover:underline"
                            >
                              {pkg.sekundarCtaText}
                            </a>
                          ) : (
                            <Link
                              href={pkg.sekundarCtaHref}
                              className="mt-3 inline-flex text-xs font-semibold text-[rgb(var(--muted))] underline-offset-4 hover:underline"
                            >
                              {pkg.sekundarCtaText}
                            </Link>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <a
                className="btn-secondary px-4 py-2 text-sm"
              href="/kontakt"
            >
              {c.contactCta}
            </a>

              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={onClose}
              >
                {c.later}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
