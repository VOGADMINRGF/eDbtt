"use client";

import Link from "next/link";

import { useLocale } from "@/context/LocaleContext";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { buildFreeBallotStartHref, GO_TO_MARKET_PACKAGING } from "@features/pricing/goToMarketPackaging";
import { HomeBallotExperience } from "./HomeBallotExperience";

type Props = { experience: StartExperienceModel };

const copy = {
  de: {
    eyebrow: "Eine Frage. Viele Perspektiven. Ein klareres Bild.",
    title: "Frag. Abstimmen. Gemeinsam weiterkommen.",
    intro: "Für dich, deinen Verein, deine Initiative oder Organisation: Starte eine Abstimmung, sammle Positionen und verstehe schneller, was Menschen wirklich wollen.",
    cta: "Kostenlos Abstimmung starten",
    free: `Kostenloser Start · bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende`,
    examplesTitle: "Wofür kannst du eDebatte nutzen?",
    examples: [
      ["Privat & im Freundeskreis", "Termin finden, Ideen vergleichen oder gemeinsam eine Entscheidung treffen."],
      ["Vereine", "Mitglieder beteiligen, Prioritäten klären und Entscheidungen besser vorbereiten."],
      ["Bürgerinitiativen & Gruppen", "Forderungen priorisieren und sichtbar machen, was Unterstützer wirklich wollen."],
      ["Verbände & Organisationen", "Viele Perspektiven strukturiert zusammenführen und Entscheidungen nachvollziehbarer machen."],
    ],
    howTitle: "So einfach geht's",
    how: [
      ["1", "Frage stellen", "Formuliere eine konkrete Frage oder nutze eine Vorlage."],
      ["2", "Antworten öffnen", "Gib Antworten vor – und lass auf Wunsch eigene Vorschläge zu. Das empfehlen wir."],
      ["3", "Teilen & verstehen", "Schick den Link weiter und sieh, welche Positionen und Prioritäten entstehen."],
    ],
    freeTitle: "Einfach kostenlos anfangen.",
    freeText: `Bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende kannst du kostenlos starten. Mehr Teilnehmende, KI-Unterstützung und vertiefte Auswertungen können später dazukommen.`,
    trustTitle: "Du behältst die Kontrolle.",
    trust: [
      "Nichts wird automatisch veröffentlicht.",
      "KI ist optional und klar gekennzeichnet.",
      "Eigene Antwortvorschläge können vor Veröffentlichung geprüft werden.",
      "Fakten und Wahrheit werden nicht zur Abstimmung gestellt.",
    ],
    finalTitle: "Welche Frage willst du heute klären?",
    finalText: "In wenigen Schritten ist deine erste Abstimmung vorbereitet.",
  },
  en: {
    eyebrow: "One question. Many perspectives. A clearer picture.",
    title: "Ask. Vote. Move forward together.",
    intro: "For you, your club, initiative or organisation: start a ballot, collect positions and understand faster what people actually want.",
    cta: "Start a ballot for free",
    free: `Free start · up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants`,
    examplesTitle: "What can you use eDebatte for?",
    examples: [
      ["Friends & private groups", "Find a date, compare ideas or make a shared decision."],
      ["Clubs", "Involve members, clarify priorities and prepare decisions better."],
      ["Citizen initiatives & groups", "Prioritise demands and see what supporters really want."],
      ["Associations & organisations", "Bring many perspectives together and make decisions easier to understand."],
    ],
    howTitle: "How it works",
    how: [
      ["1", "Ask a question", "Write a concrete question or start from a template."],
      ["2", "Open the answers", "Offer choices and optionally allow people to suggest their own. That's our recommendation."],
      ["3", "Share & understand", "Send the link and see which positions and priorities emerge."],
    ],
    freeTitle: "Start free. Keep it simple.",
    freeText: `You can start for free with up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants. More participants, AI support and deeper analysis can be added later.`,
    trustTitle: "You stay in control.",
    trust: [
      "Nothing is published automatically.",
      "AI is optional and clearly labelled.",
      "Suggested answers can be reviewed before they become visible.",
      "Facts and truth are not put to a vote.",
    ],
    finalTitle: "Which question do you want to clarify today?",
    finalText: "Your first ballot is ready in just a few steps.",
  },
} as const;

export default function HomeGoToMarketLanding({ experience }: Props) {
  const { locale } = useLocale();
  const language = locale === "de" ? "de" : "en";
  const t = copy[language];

  return (
    <div className="overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="relative border-b border-[color:var(--border)]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_88%_10%,rgba(99,102,241,0.10),transparent_32%)]" />
        <div className="relative mx-auto max-w-[78rem] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">{t.eyebrow}</p>
            <h1 className="mt-4 text-balance text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{t.title}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-[color:var(--muted)] sm:text-xl">{t.intro}</p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl">
            <HomeBallotExperience />
          </div>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={buildFreeBallotStartHref(undefined, "homepage-hero")} className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-7 py-3 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">
              {t.cta}<span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <span className="text-sm font-medium text-[color:var(--muted)]">{t.free}</span>
          </div>
          {experience.workspaceHref && experience.workspaceLabel ? (
            <div className="mt-4 text-center">
              <Link href={experience.workspaceHref} className="text-sm font-semibold text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300">{experience.workspaceLabel}</Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-[78rem] px-5 py-14 sm:px-8 lg:px-10" aria-labelledby="examples-title">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="examples-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.examplesTitle}</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {t.examples.map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[color:var(--border)] bg-slate-950 py-14 text-white" aria-labelledby="how-title">
        <div className="mx-auto max-w-[78rem] px-5 sm:px-8 lg:px-10">
          <h2 id="how-title" className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t.howTitle}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {t.how.map(([number, title, body], index) => (
              <article key={number} className={`rounded-3xl border p-6 ${index === 1 ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-white/[0.05]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950">{number}</span>
                  {index === 1 ? <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">{language === "de" ? "Empfohlen" : "Recommended"}</span> : null}
                </div>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[78rem] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
        <article className="rounded-[2rem] border border-cyan-300 bg-cyan-50 p-7 text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-950/25 dark:text-cyan-50">
          <h2 className="text-3xl font-bold tracking-tight">{t.freeTitle}</h2>
          <p className="mt-4 text-base leading-7">{t.freeText}</p>
          <Link href={buildFreeBallotStartHref(undefined, "homepage-free")} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 font-bold text-white dark:bg-white dark:text-slate-950">{t.cta} →</Link>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-7">
          <h2 className="text-3xl font-bold tracking-tight">{t.trustTitle}</h2>
          <ul className="mt-5 grid gap-3">
            {t.trust.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-[color:var(--muted)]">
                <span aria-hidden="true" className="mt-0.5 text-cyan-600">✓</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mx-auto max-w-[78rem] px-5 pb-16 sm:px-8 lg:px-10">
        <div className="rounded-[2rem] bg-gradient-to-br from-cyan-500 to-indigo-500 p-7 text-center text-slate-950 shadow-xl sm:p-10">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t.finalTitle}</h2>
          <p className="mt-3 text-base font-medium">{t.finalText}</p>
          <Link href={buildFreeBallotStartHref(undefined, "homepage-final")} className="mt-7 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-500">{t.cta} →</Link>
        </div>
      </section>
    </div>
  );
}
