"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import { VOG_SUPPORT_URL } from "@/config/links";

const SOURCE_STRINGS = {
  heroTitle: "eDebatte vorbestellen",
  heroIntro:
    "Sichere dir den Startzugang für eDebatte. Die Vorbestellung ist unverbindlich – wir melden uns, sobald dein Paket aktiviert werden kann.",
  ctaPrimary: "Vorbestellung ansehen",
  ctaSecondary: "VoiceOpenGov unterstützen",
  supportNote: "Unterstützung läuft über VoiceOpenGov – ohne Stimmvorteile.",
  whyTitle: "Warum Vorbestellung?",
  whyIntro:
    "Wir bauen eDebatte als öffentliche Infrastruktur. Vorbestellungen helfen beim Ausbau und halten das Modell unabhängig.",
  whyList: [
    "Serverkosten, Redaktion und Betrieb verlässlich planen.",
    "Keine Werbung, keine Datenweitergabe, klare Finanzierung.",
    "Transparente Pakete für Bürger:innen und Organisationen.",
  ],
  nextTitle: "So geht es weiter",
  nextList: [
    "Pakete auswählen und unverbindlich vormerken.",
    "Wir bestätigen den Startslot und das Onboarding.",
    "Optional: Unterstützung der Initiative über VoiceOpenGov.",
  ],
};

export default function UnterstuetzenPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "unterstuetzen" });
  const strings =
    locale === "de"
      ? SOURCE_STRINGS
      : mapTranslatableStrings(SOURCE_STRINGS, t, { namespace: "unterstuetzen" });

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-4xl px-4 pt-20 space-y-6">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Vorbestellung</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[rgb(var(--fg))]">
            {strings.heroTitle}
          </h1>
          <p className="mt-3 text-lg text-[rgb(var(--muted))]">{strings.heroIntro}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(56,189,248,0.35)]"
            >
              {strings.ctaPrimary}
            </Link>
            <a
              href={VOG_SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--fg))]"
            >
              {strings.ctaSecondary} →
            </a>
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">{strings.supportNote}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{strings.whyTitle}</h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{strings.whyIntro}</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-[rgb(var(--muted))] space-y-1">
              {strings.whyList.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{strings.nextTitle}</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-[rgb(var(--muted))] space-y-1">
              {strings.nextList.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
