"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { getPrivacyStrings } from "./strings";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";

export default function DatenschutzPage() {
  const { locale } = useLocale();
  const baseStrings = getPrivacyStrings(locale);
  const sourceStrings = getPrivacyStrings("de");
  const t = useAutoTranslateText({ locale, namespace: "datenschutz" });
  const strings =
    locale === "de" || locale === "en"
      ? baseStrings
      : mapTranslatableStrings(sourceStrings, t, { namespace: "datenschutz" });
  const dataPoints = Array.isArray(strings.dataPoints) ? strings.dataPoints : [];
  const rightsPoints = Array.isArray(strings.rightsPoints) ? strings.rightsPoints : [];

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:p-10">
          <header className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {t("Datenschutz", "static.overline")}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-[rgb(var(--fg))] md:text-4xl">
              {strings.title}
            </h1>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
              {strings.intro}
            </p>
          </header>

          <div className="mt-8 grid gap-4">
            <InfoCard title={strings.controllerTitle} body={strings.controllerBody} />
            <p className="text-xs text-[rgb(var(--muted))]">
              {t("Rechtliche Angaben findest du im", "static.legalHint")}{" "}
              <Link href="/impressum" className="font-semibold text-sky-700 underline underline-offset-4">
                {t("Impressum", "static.impressum")}
              </Link>
              {t(".", "static.dot")}
            </p>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {strings.dataTitle}
              </p>
              <ul className="mt-2 space-y-2">
                {dataPoints.map((item) => (
                  <li key={item.label}>
                    <span className="font-semibold">{item.label}:</span> {item.description}
                  </li>
                ))}
              </ul>
            </div>

            <InfoCard title={strings.cookiesTitle} body={strings.cookiesBody} />
            <InfoCard title={strings.aiTitle} body={strings.aiBody} />

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {strings.rightsTitle}
              </p>
              <p className="mt-1">{strings.rightsIntro}</p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {rightsPoints.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <p className="mt-2 whitespace-pre-line text-[rgb(var(--muted))]">
                {strings.rightsComplaintHint}
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {strings.contactTitle}
              </p>
              <p className="whitespace-pre-line">{strings.contactBody}</p>
              <p className="pt-2">
                {t("Kontakt-E-Mail:", "static.contactEmailLabel")}{" "}
                <a
                  className="font-semibold text-sky-700 underline underline-offset-4"
                  href={`mailto:${strings.contactEmail}`}
                >
                  {strings.contactEmail}
                </a>
              </p>
              <p className="mt-1 text-[rgb(var(--muted))]">
                {t(
                  "Diese Hinweise werden laufend aktualisiert und rechtlich überprüft, sobald sich unser Angebot oder die Rechtslage ändert.",
                  "static.updateNote",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))] shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{title}</p>
      <p className="mt-2 whitespace-pre-line">{body}</p>
    </div>
  );
}
