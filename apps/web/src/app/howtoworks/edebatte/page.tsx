"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { resolveLocalizedField } from "@/lib/localization/getLocalizedField";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

const CHIP =
  "inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-medium text-[rgb(var(--muted))]";
const CARD =
  "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm";

const hero = {
  id: "hero",
  kicker_de: "So funktioniert’s in der Praxis",
  kicker_en: "How it works in practice",
  title_de: "Vom Thema zum nachvollziehbaren Prozess",
  title_en: "From topic to a traceable process",
  lead_de:
    "VoiceOpenGov ist die Initiative für faire, nachvollziehbare Beteiligung. eDebatte ist das Werkzeug, das den Ablauf review-first und auditierbar umsetzt: Check → Dossier → Beteiligung → Status. Es gibt dabei keine automatische Veröffentlichung und kein automatisches Siegel. Lass das beste Argument gewinnen.",
  lead_en:
    "VoiceOpenGov is the initiative for fair, traceable participation. eDebatte is the tool that executes the flow: check → dossier → participation → status.",
};

const heroChips = [
  { id: "check", label_de: "Check", label_en: "Check" },
  { id: "dossier", label_de: "Dossier", label_en: "Dossier" },
  { id: "beteiligung", label_de: "Beteiligung", label_en: "Participation" },
  { id: "status", label_de: "Status", label_en: "Status" },
];

const journey = {
  id: "journey",
  title_de: "Die RePro-Nutzerreise",
  title_en: "The RePro user journey",
  lead_de:
    "Kein Sprung ins Unklare: Jede Station hat einen klaren Zweck, sichtbare Review-Grenzen und ein nachvollziehbares Ergebnis. Lass das beste Argument gewinnen, nicht die lauteste Behauptung.",
  lead_en:
    "No leap into the unknown: every stage has a clear purpose and visible outcome.",
};

const journeySteps = [
  {
    id: "step-check",
    step: "01",
    title_de: "Check",
    title_en: "Check",
    body_de:
      "Ein Thema wird in prüfbare Aussagen und offene Fragen getrennt. Quellen werden sichtbar gemacht, Lücken werden markiert und es gibt keine automatische Factcheck- oder Siegel-Freigabe.",
    body_en:
      "A topic is split into verifiable claims and open questions. Sources are made visible and gaps are marked.",
    cta_de: "Check starten",
    cta_en: "Start check",
    href: "/start",
  },
  {
    id: "step-dossier",
    step: "02",
    title_de: "Dossier",
    title_en: "Dossier",
    body_de:
      "Das Dossier bündelt den Stand: Pro und Contra, Quellenlage, Unsicherheiten und Handlungsoptionen an einem Ort.",
    body_en:
      "The dossier consolidates the current state: pro and con, evidence, uncertainties and action options in one place.",
    cta_de: "Dossier ansehen",
    cta_en: "View dossier",
    href: "/howtoworks/edebatte/dossier",
  },
  {
    id: "step-beteiligung",
    step: "03",
    title_de: "Beteiligung",
    title_en: "Participation",
    body_de:
      "Auf Basis des Dossiers wird beteiligt: Vorschläge werden eingeordnet, Positionen abgestimmt und Rückmeldungen dokumentiert.",
    body_en:
      "Based on the dossier, participation starts: proposals are ranked, positions are voted on and feedback is documented.",
    cta_de: "Beteiligung ansehen",
    cta_en: "View participation",
    href: "/howtoworks/edebatte/abstimmen",
  },
  {
    id: "step-status",
    step: "04",
    title_de: "Status",
    title_en: "Status",
    body_de:
      "Nach der Entscheidung bleibt der Verlauf sichtbar: Mandat, Zuständigkeiten, Fortschritt und offene Punkte.",
    body_en:
      "After decisions, progress remains visible: mandate, responsibilities, progress and open items.",
    cta_de: "Status verfolgen",
    cta_en: "Track status",
    href: "/howtoworks/edebatte/mandat",
  },
];

const roleSection = {
  id: "roles",
  title_de: "Wer macht was im Prozess?",
  title_en: "Who does what in the process?",
  lead_de:
    "Die Verantwortung ist verteilt und nachvollziehbar. Genau das macht die Ergebnisse belastbar.",
  lead_en:
    "Responsibility is distributed and traceable. That is what makes outcomes reliable.",
};

const roleCards = [
  {
    id: "role-citizens",
    anchor: "rolle-buerger",
    title_de: "Bürger:innen und Initiativen",
    title_en: "Citizens and initiatives",
    body_de:
      "Bringen Themen ein, präzisieren Fragen und ergänzen Hinweise. Der Beitrag bleibt als Prozessobjekt sichtbar.",
    body_en:
      "Submit topics, refine questions and add evidence. Contributions remain visible as process objects.",
  },
  {
    id: "role-association",
    anchor: "rolle-vereine",
    title_de: "Verbände, Vereine und Redaktion",
    title_en: "Associations and editorial teams",
    body_de:
      "Ordnen Beiträge, strukturieren Dossiers und machen Gegenpositionen sichtbar. Ziel ist Klarheit statt Lautstärke.",
    body_en:
      "Structure contributions, curate dossiers and surface opposing positions. The goal is clarity over volume.",
  },
  {
    id: "role-admin",
    anchor: "rolle-verwaltung",
    title_de: "Verwaltung und Umsetzung",
    title_en: "Administration and implementation",
    body_de:
      "Übernimmt Mandate in die Umsetzung, dokumentiert Fortschritt und begründet Abweichungen im Status.",
    body_en:
      "Takes mandates into implementation, tracks progress and explains deviations in the status layer.",
  },
];

const benefits = {
  id: "benefits",
  title_de: "Was du als Nutzer:in davon hast",
  title_en: "What you gain as a user",
  items_de: [
    "Du siehst, worauf eine Aussage basiert und was noch unklar ist.",
    "Du kannst dich beteiligen, ohne in einem Meinungschaos zu landen.",
    "Du bekommst einen Status statt eines toten Abschlusses.",
    "Du kannst Entscheidungen später prüfen und einordnen.",
  ],
  items_en: [
    "You can see what a claim is based on and what is still unclear.",
    "You can participate without getting lost in opinion noise.",
    "You get a status layer instead of a dead endpoint.",
    "You can revisit and verify decisions later.",
  ],
};

export default function HowToWorksEdebattePage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "howtoworks-edebatte-repro" });

  const text = React.useCallback(
    (entry: Record<string, unknown>, key: string) => {
      const base = resolveLocalizedField(entry, key, locale);
      const hint = entry?.id ? `${entry.id}.${key}` : key;
      return t(base, hint);
    },
    [locale, t],
  );

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:py-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            {text(hero, "kicker")}
          </p>
          <h1 className="headline-grad text-4xl font-extrabold leading-tight sm:text-5xl">
            {text(hero, "title")}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-[rgb(var(--muted))] sm:text-lg">
            {text(hero, "lead")}
          </p>
          <div className="flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span key={chip.id} className={CHIP}>
                {text(chip, "label")}
              </span>
            ))}
          </div>
        </header>

        <section className="space-y-3" aria-labelledby="journey-title">
          <h2 id="journey-title" className="text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">
            {text(journey, "title")}
          </h2>
          <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{text(journey, "lead")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {journeySteps.map((step) => (
              <article key={step.id} className={`${CARD} flex flex-col gap-3`}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                    {step.step}
                  </span>
                  <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{text(step, "title")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{text(step, "body")}</p>
                <div>
                  <Link
                    href={step.href}
                    className="inline-flex items-center text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-600 dark:hover:text-sky-200"
                  >
                    {text(step, "cta")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="roles-title">
          <h2 id="roles-title" className="text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">
            {text(roleSection, "title")}
          </h2>
          <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{text(roleSection, "lead")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {roleCards.map((role) => (
              <article key={role.id} id={role.anchor} className={CARD}>
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{text(role, "title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text(role, "body")}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={CARD} aria-labelledby="benefits-title">
          <h2 id="benefits-title" className="text-2xl font-bold tracking-tight text-[rgb(var(--fg))]">
            {text(benefits, "title")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {(String(locale ?? "de").startsWith("en") ? benefits.items_en : benefits.items_de).map(
              (item, idx) => (
                <li key={`${idx}-${item}`}>{t(item, `benefits.items.${idx}`)}</li>
              ),
            )}
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/start" className="btn btn-primary">
              {t("Thema starten", "cta.start")}
            </Link>
            <Link href="/runden" className="btn btn-ghost">
              {t("Anlassräume ansehen", "cta.rounds")}
            </Link>
            <Link href="/swipes" className="btn btn-ghost">
              {t("Zur Beteiligung", "cta.swipes")}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
