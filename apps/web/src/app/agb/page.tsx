"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

const CONTACT_EMAIL = "kontakt@edebatte.org";

export default function AgbPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "agb" });

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:p-10">
          <header className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {t("Rechtliches", "kicker")}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-[rgb(var(--fg))] md:text-4xl">
              {t("Allgemeine Geschäftsbedingungen (AGB)", "title")}
            </h1>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
              {t(
                "Hier findest du die AGB für eDebatte und eDebatte. Wir finalisieren die rechtsverbindliche Fassung und veröffentlichen sie hier, sobald sie vorliegt.",
                "lead",
              )}
            </p>
          </header>

          <div className="mt-8 grid gap-4">
            <InfoCard
              title={t("Aktueller Stand", "status.title")}
              body={t(
                "Die AGB befinden sich in der finalen Abstimmung. Sobald die rechtsverbindliche Version veröffentlicht ist, findest du sie an dieser Stelle.",
                "status.body",
              )}
            />

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {t("Inhalte, die hier enthalten sein werden", "contents.title")}
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>{t("Leistungsumfang und Nutzung der Plattform", "contents.0")}</li>
                <li>{t("Mitgliedschaften, Pakete und Laufzeiten", "contents.1")}</li>
                <li>{t("Kündigung, Widerruf und Support", "contents.2")}</li>
                <li>{t("Haftung, Pflichten und Verhaltensregeln", "contents.3")}</li>
              </ul>
            </div>

            <InfoCard
              title={t("Weitere rechtliche Informationen", "more.title")}
              body={t(
                "Bis dahin findest du die wichtigsten Hinweise in diesen Bereichen:",
                "more.body",
              )}
            />

            <div className="grid gap-3 md:grid-cols-3">
              <LinkCard href="/datenschutz" label={t("Datenschutz", "links.privacy")} />
              <LinkCard href="/widerrufsbelehrung" label={t("Widerrufsbelehrung", "links.withdraw")} />
              <LinkCard href="/widerspruch" label={t("Widerspruch & Kündigung", "links.objection")} />
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {t("Kontakt", "contact.title")}
              </p>
              <p className="mt-2">
                {t("Fragen zu den AGB oder einer Buchung? Schreib uns:", "contact.body")}
              </p>
              <a
                className="mt-2 inline-flex font-semibold text-sky-700 underline underline-offset-4"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-line">{body}</p>
    </div>
  );
}

function LinkCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm font-semibold text-[rgb(var(--muted))] shadow-sm transition hover:border-[rgb(var(--border))] hover:text-[rgb(var(--fg))]"
    >
      {label}
    </Link>
  );
}
