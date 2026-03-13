import Link from "next/link";
import { buildCreateHref } from "@/features/create/intents";
import type { EDebattePackage } from "@/features/swipes/types";

const primaryChipClass =
  "inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_22px_rgba(14,116,144,0.35)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-200";

const secondaryChipClass =
  "inline-flex items-center rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--fg))] shadow-sm ring-1 ring-[rgb(var(--border))] transition hover:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-200";

const subtleTextLinkClass =
  "text-[11px] font-medium text-[rgb(var(--muted))] underline-offset-2 hover:text-[rgb(var(--fg))] hover:underline";

type SwipesHeaderProps = {
  edebattePackage: EDebattePackage;
  isBasic: boolean;
  isStartOrPro: boolean;
};

export function SwipesHeader({ edebattePackage, isBasic, isStartOrPro }: SwipesHeaderProps) {
  const pkgLabel =
    edebattePackage === "basis"
      ? "eDebatte Basis"
      : edebattePackage === "start"
        ? "eDebatte Start"
        : edebattePackage === "pro"
          ? "eDebatte Pro"
          : edebattePackage === "b2b_basis"
            ? "B2B Basis"
            : edebattePackage === "b2b_pro"
              ? "B2B Pro"
              : edebattePackage === "b2g_basis"
                ? "B2G Basis"
                : edebattePackage === "b2g_pro"
                  ? "B2G Pro"
                  : "ohne eDebatte-Paket";

  return (
    <header className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Swipes · kostenloser Einstieg</p>
      <h1 className="text-2xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-3xl">
        <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
          Swipes
        </span>{" "}
        – schnell einordnen, dann vertiefen.
      </h1>
      <p className="max-w-2xl text-sm text-[rgb(var(--muted))]">
        Mobile-first Themenkompass: links/rechts für erste Haltung, nach oben oder „Mehr“ für Dossier,
        Quellen und Varianten.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildCreateHref({ intent: "claim" })} className={primaryChipClass}>
          Thema einreichen
        </Link>
        <Link href={buildCreateHref({ intent: "source" })} className={secondaryChipClass}>
          Quelle ergänzen
        </Link>
        <Link href="/account" className={subtleTextLinkClass}>
          Konto
        </Link>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
        <span>
          Aktiver Modus: <span className="font-semibold text-[rgb(var(--fg))]">{pkgLabel}</span>
        </span>
        {isBasic ? <span>· Offener Public-Stream ist aktiv.</span> : null}
        {isStartOrPro ? <span>· Suche, Filter und Variantenvergleich sind aktiv.</span> : null}
      </p>
      <p className="text-[11px] text-[rgb(var(--muted))]">
        Gesten: links = eher ablehnen, rechts = eher zustimmen, oben = verstehen/vertiefen.
      </p>
    </header>
  );
}

