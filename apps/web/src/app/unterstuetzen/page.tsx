"use client";

import Link from "next/link";
import { MembershipCalculator_VOG } from "@/features/membership";
import { useLocale } from "@/context/LocaleContext";
import { SUPPORT_STRINGS, tSupport } from "./strings";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import { BANK_DETAILS } from "@/config/banking";

export default function UnterstuetzenPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "unterstuetzen" });
  const baseStrings = {
    heroTitle: tSupport(SUPPORT_STRINGS.heroTitle, locale),
    heroIntro: tSupport(SUPPORT_STRINGS.heroIntro, locale),
    whyTitle: tSupport(SUPPORT_STRINGS.whyTitle, locale),
    whyList: tSupport(SUPPORT_STRINGS.whyList, locale),
    membershipTitle: tSupport(SUPPORT_STRINGS.membershipTitle, locale),
    membershipList: tSupport(SUPPORT_STRINGS.membershipList, locale),
    bundlesNotePrefix: tSupport(SUPPORT_STRINGS.bundlesNotePrefix, locale),
    bundlesNoteSuffix: tSupport(SUPPORT_STRINGS.bundlesNoteSuffix, locale),
    cta: tSupport(SUPPORT_STRINGS.cta, locale),
  };
  const sourceStrings = {
    heroTitle: tSupport(SUPPORT_STRINGS.heroTitle, "de"),
    heroIntro: tSupport(SUPPORT_STRINGS.heroIntro, "de"),
    whyTitle: tSupport(SUPPORT_STRINGS.whyTitle, "de"),
    whyList: tSupport(SUPPORT_STRINGS.whyList, "de"),
    membershipTitle: tSupport(SUPPORT_STRINGS.membershipTitle, "de"),
    membershipList: tSupport(SUPPORT_STRINGS.membershipList, "de"),
    bundlesNotePrefix: tSupport(SUPPORT_STRINGS.bundlesNotePrefix, "de"),
    bundlesNoteSuffix: tSupport(SUPPORT_STRINGS.bundlesNoteSuffix, "de"),
    cta: tSupport(SUPPORT_STRINGS.cta, "de"),
  };
  const strings =
    locale === "de" || locale === "en"
      ? baseStrings
      : mapTranslatableStrings(sourceStrings, t, { namespace: "unterstuetzen" });

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-4xl px-4 pt-20 space-y-6">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-sm">
          <h1 className="text-4xl font-extrabold text-[rgb(var(--fg))] text-center">
            {strings.heroTitle}
          </h1>
          <p className="mt-3 text-center text-lg text-[rgb(var(--muted))]">
            {strings.heroIntro}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[rgb(var(--border))] bg-emerald-50/80 p-4">
              <h2 className="text-base font-semibold text-emerald-700">
                {strings.whyTitle}
              </h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-[rgb(var(--muted))] space-y-1">
                {strings.whyList.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-[rgb(var(--border))] bg-rose-50/80 p-4">
              <h2 className="text-base font-semibold text-rose-700">
                {strings.membershipTitle}
              </h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-[rgb(var(--muted))] space-y-1">
                {strings.membershipList.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        <MembershipCalculator_VOG />

        <p className="text-center text-sm text-[rgb(var(--muted))]">
          {strings.bundlesNotePrefix}{" "}
          <Link href="/pricing" className="text-emerald-600 underline">
            /pricing
          </Link>
          {strings.bundlesNoteSuffix}
        </p>

        <div className="text-center">
          <a href="#voiceopengov-support" className="btn bg-brand-grad text-white shadow-soft">
            {strings.cta}
          </a>
        </div>

        <section
          id="voiceopengov-support"
          className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              VoiceOpenGov
            </p>
            <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Initiative unterstützen</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              eDebatte selbst hat keine Mitgliedschaften. Unterstützung läuft über VoiceOpenGov – ohne Stimmvorteile.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Bankverbindung</p>
              <p className="mt-2">
                <span className="font-semibold">Empfaenger:</span> {BANK_DETAILS.recipient}
              </p>
              <p>
                <span className="font-semibold">IBAN:</span> {BANK_DETAILS.iban}
              </p>
              {BANK_DETAILS.bic ? (
                <p>
                  <span className="font-semibold">BIC:</span> {BANK_DETAILS.bic}
                </p>
              ) : null}
              <p>
                <span className="font-semibold">Bank:</span> {BANK_DETAILS.bankName}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Verwendungszweck:</span> {BANK_DETAILS.referenceHint}
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-emerald-50/70 p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Hinweise</p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-[rgb(var(--muted))]">
                <li>Keine Spendenquittung in der Aufbauphase.</li>
                <li>Unterstuetzung bringt keine Stimmvorteile.</li>
                <li>Fragen? Schreib an support@edebatte.org.</li>
              </ul>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Mehr zur Initiative:{" "}
                <a
                  href="https://voiceopengov.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline"
                >
                  voiceopengov.org
                </a>
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
