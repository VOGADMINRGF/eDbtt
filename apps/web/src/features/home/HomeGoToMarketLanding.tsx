"use client";

import Link from "next/link";

import { useLocale } from "@/context/LocaleContext";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { buildFreeBallotStartHref, GO_TO_MARKET_PACKAGING } from "@features/pricing/goToMarketPackaging";
import { HomeBallotExperience } from "./HomeBallotExperience";

type Props = { experience: StartExperienceModel };

const copy = {
  de: {
    eyebrow: "Damit nicht Lautstärke entscheidet.",
    title: "Eine Frage. Viele Perspektiven. Ein klareres Bild.",
    intro: "eDebatte beginnt so einfach wie eine Abstimmung – und hilft danach zu verstehen, was Menschen wirklich beitragen: Positionen, neue Vorschläge, Gründe, Erfahrungen, Quellen und offene Fragen.",
    cta: "Kostenlos starten",
    free: `Bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende kostenlos`,
    differenceTitle: "Nicht nur Antworten sammeln. Verstehen, was dahinterliegt.",
    differenceIntro: "Eine Frage reicht für den Start. Aus einzelnen Antworten kann Schritt für Schritt ein nachvollziehbares Bild entstehen – ohne dass daraus ein endloser Chat oder ein Formularprojekt wird.",
    difference: [
      ["Fragen", "Eine klare Frage öffnet den Raum – für Entscheidung, Feedback oder Recherche."],
      ["Zuhören", "Menschen wählen Positionen oder ergänzen eigene Perspektiven und Vorschläge."],
      ["Verstehen", "Gründe, Erfahrungen und Quellen geben Antworten Kontext und Gewicht."],
      ["Weitergehen", "Offene Punkte werden sichtbar und können zum nächsten gemeinsamen Schritt führen."],
    ],
    examplesTitle: "Eine einfache Frage. Unterschiedliche Aufgaben.",
    examples: [
      ["Entscheiden", "Privat, im Verein oder in einer Initiative: Optionen vergleichen, neue Vorschläge aufnehmen und Prioritäten sichtbar machen."],
      ["Zuhören", "Teams und Unternehmen: Mitarbeiter- oder Kundenperspektiven einsammeln, ohne sie in Freitext und Meetings zu verlieren."],
      ["Priorisieren", "Organisationen und Verbände: viele Hinweise oder Ideen ordnen und erkennen, was trägt, was strittig ist und was fehlt."],
      ["Recherchieren", "Journalisten und Redaktionen: Leserfragen, Erfahrungen, Hinweise und Quellen strukturiert sammeln und relevante Spuren sichtbar machen."],
    ],
    audienceLine: "Für Menschen, Vereine, Initiativen, Redaktionen, Teams, Verbände und Organisationen.",
    howTitle: "Frage. Einladen. Verstehen.",
    how: [
      ["01", "Frage stellen", "Ein Satz genügt für den Start."],
      ["02", "Menschen einladen", "Antworten vorgeben oder eigene Beiträge und Vorschläge zulassen."],
      ["03", "Mehr sehen", "Nicht nur zählen – erkennen, was Menschen meinen, begründen und ergänzen."],
    ],
    freeTitle: "Einfach anfangen. Tiefe entsteht erst, wenn du sie brauchst.",
    freeText: `Der Einstieg ist kostenlos bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende. Mehr Reichweite, KI-Unterstützung und vertiefte Auswertung sind Erweiterungen – kein Hindernis vor der ersten Frage.`,
    trustTitle: "Du bestimmst, was passiert.",
    trust: [
      "Nichts geht automatisch online.",
      "KI bleibt optional und gekennzeichnet.",
      "Neue Vorschläge können vor Sichtbarkeit geprüft werden.",
      "Fakten werden nicht zur Abstimmung gestellt; Quellen und Erfahrungen bleiben als solche erkennbar.",
    ],
    finalTitle: "Welche Frage willst du nicht länger nur im Raum stehen lassen?",
    finalText: "Stell sie. Hör zu. Und mach sichtbar, was sonst zwischen Einzelstimmen verloren geht.",
  },
  en: {
    eyebrow: "So volume does not decide.",
    title: "One question. Many perspectives. A clearer picture.",
    intro: "eDebatte starts as simply as a ballot, then helps you understand what people actually contribute: positions, new proposals, reasons, experiences, sources and open questions.",
    cta: "Start for free",
    free: `Free up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants`,
    differenceTitle: "Do not just collect answers. Understand what sits behind them.",
    differenceIntro: "One question is enough to start. Individual responses can gradually become a traceable shared picture without turning into an endless chat or a form project.",
    difference: [
      ["Ask", "One clear question opens the space for a decision, feedback or research."],
      ["Listen", "People choose positions or add their own perspectives and proposals."],
      ["Understand", "Reasons, experiences and sources add context and meaning."],
      ["Continue", "Open points stay visible and can lead into the next shared step."],
    ],
    examplesTitle: "One simple question. Different jobs to be done.",
    examples: [
      ["Decide", "For private groups, clubs or initiatives: compare options, capture new proposals and reveal priorities."],
      ["Listen", "For teams and companies: gather employee or customer perspectives without losing them in free text and meetings."],
      ["Prioritise", "For organisations and associations: structure many ideas and see what carries, what is disputed and what is missing."],
      ["Research", "For journalists and newsrooms: collect reader questions, experiences, tips and sources and surface relevant leads."],
    ],
    audienceLine: "For people, clubs, initiatives, newsrooms, teams, associations and organisations.",
    howTitle: "Ask. Invite. Understand.",
    how: [
      ["01", "Ask", "One sentence is enough to start."],
      ["02", "Invite", "Offer answers or allow people to add their own contributions and proposals."],
      ["03", "See more", "Do not just count – see what people mean, explain and add."],
    ],
    freeTitle: "Start simple. Add depth only when you need it.",
    freeText: `Start free with up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants. More reach, AI support and deeper analysis are extensions, not barriers before the first question.`,
    trustTitle: "You decide what happens.",
    trust: [
      "Nothing goes online automatically.",
      "AI remains optional and labelled.",
      "New proposals can be reviewed before becoming visible.",
      "Facts are not put to a vote; sources and experiences remain identifiable as such.",
    ],
    finalTitle: "Which question do you no longer want to leave hanging?",
    finalText: "Ask it. Listen. And make visible what would otherwise disappear between individual voices.",
  },
} as const;

export default function HomeGoToMarketLanding({ experience }: Props) {
  const { locale } = useLocale();
  const language = locale === "de" ? "de" : "en";
  const t = copy[language];

  return (
    <div className="overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="relative min-h-[82vh] border-b border-[color:var(--border)]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(34,211,238,0.18),transparent_31%),radial-gradient(circle_at_80%_35%,rgba(99,102,241,0.10),transparent_28%)]" />
        <div className="relative mx-auto max-w-[76rem] px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{t.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.01] tracking-[-0.04em] sm:text-6xl lg:text-7xl">{t.title}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-lg leading-8 text-[color:var(--muted)] sm:text-xl">{t.intro}</p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl"><HomeBallotExperience /></div>
          <div className="mt-7 flex flex-col items-center gap-2">
            <Link href={buildFreeBallotStartHref(undefined, "homepage-hero")} className="inline-flex min-h-14 items-center justify-center rounded-full bg-cyan-500 px-8 py-3.5 text-base font-black text-slate-950 shadow-[0_18px_50px_rgba(6,182,212,0.25)] transition hover:-translate-y-0.5 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">{t.cta}<span aria-hidden="true" className="ml-2">→</span></Link>
            <span className="text-xs font-semibold text-[color:var(--muted)]">{t.free}</span>
          </div>
          {experience.workspaceHref && experience.workspaceLabel ? <div className="mt-3 text-center"><Link href={experience.workspaceHref} className="text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{experience.workspaceLabel}</Link></div> : null}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white" aria-labelledby="difference-title">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl"><h2 id="difference-title" className="text-3xl font-black tracking-tight sm:text-5xl">{t.differenceTitle}</h2><p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{t.differenceIntro}</p></div>
          <ol className="mt-10 border-y border-white/15 md:grid md:grid-cols-4 md:divide-x md:divide-white/15">
            {t.difference.map(([title, body], index) => <li key={title} className="group relative py-6 md:px-6 md:py-8 first:md:pl-0 last:md:pr-0"><div className="flex items-baseline gap-3"><span className="text-xs font-black text-cyan-300">0{index + 1}</span><h3 className="text-xl font-bold">{title}</h3></div><p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">{body}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-16 sm:px-8 lg:px-10" aria-labelledby="examples-title">
        <h2 id="examples-title" className="max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{t.examplesTitle}</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-[color:var(--muted)]">{t.audienceLine}</p>
        <div className="mt-10 divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
          {t.examples.map(([title, body], index) => <div key={title} className="grid gap-2 py-6 sm:grid-cols-[3rem_14rem_1fr] sm:items-baseline"><span className="text-xs font-black text-cyan-600">0{index + 1}</span><h3 className="text-lg font-bold">{title}</h3><p className="text-sm leading-6 text-[color:var(--muted)]">{body}</p></div>)}
        </div>
      </section>

      <section className="border-y border-[color:var(--border)] bg-[color:var(--surface-muted)] py-16" aria-labelledby="how-title">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10"><h2 id="how-title" className="text-center text-3xl font-black tracking-tight sm:text-5xl">{t.howTitle}</h2><div className="mx-auto mt-10 flex max-w-4xl flex-col md:flex-row md:items-start md:justify-between">
          {t.how.map(([number, title, body], index) => <div key={number} className="relative flex-1 py-5 md:px-6 md:text-center"><span className="text-xs font-black tracking-[0.16em] text-cyan-600">{number}</span><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[color:var(--muted)]">{body}</p>{index < t.how.length - 1 ? <span aria-hidden="true" className="absolute right-[-0.5rem] top-1/2 hidden text-2xl text-cyan-500 md:block">→</span> : null}</div>)}
        </div></div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start"><div><h2 className="text-3xl font-black tracking-tight sm:text-5xl">{t.freeTitle}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)]">{t.freeText}</p><Link href={buildFreeBallotStartHref(undefined, "homepage-free")} className="mt-7 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 font-bold text-white dark:bg-white dark:text-slate-950">{t.cta} →</Link></div><div className="border-l-2 border-cyan-400 pl-6"><h3 className="text-xl font-bold">{t.trustTitle}</h3><ul className="mt-4 space-y-3">{t.trust.map((item) => <li key={item} className="text-sm leading-6 text-[color:var(--muted)]">{item}</li>)}</ul></div></div>
      </section>

      <section className="border-t border-[color:var(--border)] px-5 py-16 text-center sm:px-8"><h2 className="mx-auto max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{t.finalTitle}</h2><p className="mx-auto mt-4 max-w-3xl text-base text-[color:var(--muted)]">{t.finalText}</p><Link href={buildFreeBallotStartHref(undefined, "homepage-final")} className="mt-7 inline-flex min-h-14 items-center rounded-full bg-cyan-500 px-8 py-3.5 font-black text-slate-950 shadow-lg">{t.cta} →</Link></section>
    </div>
  );
}
