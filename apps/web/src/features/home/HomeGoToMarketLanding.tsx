"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { buildFreeBallotStartHref, GO_TO_MARKET_PACKAGING } from "@features/pricing/goToMarketPackaging";
import { HomeBallotExperience } from "./HomeBallotExperience";

type Props = { experience: StartExperienceModel };

export default function HomeGoToMarketLanding({ experience }: Props) {
  const { locale } = useLocale();
  const de = locale === "de";
  const cta = de ? "Kostenlos starten" : "Start for free";
  const jobs = de
    ? [
        ["Entscheiden", "Optionen vergleichen, neue Vorschläge aufnehmen und Prioritäten sichtbar machen."],
        ["Zuhören", "Mitarbeiter-, Kunden- oder Mitgliederperspektiven strukturiert einsammeln."],
        ["Priorisieren", "Viele Hinweise oder Ideen ordnen und erkennen, was trägt, strittig ist oder fehlt."],
        ["Recherchieren", "Leserfragen, Erfahrungen, Hinweise und Quellen strukturiert sammeln."],
      ]
    : [
        ["Decide", "Compare options, capture new proposals and reveal priorities."],
        ["Listen", "Gather employee, customer or member perspectives in a structured way."],
        ["Prioritise", "Structure ideas and reveal what carries, conflicts or is missing."],
        ["Research", "Collect reader questions, experiences, tips and sources."],
      ];

  return (
    <div className="overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="relative border-b border-[color:var(--border)]">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(34,211,238,0.18),transparent_31%)]" />
        <div className="relative mx-auto max-w-[76rem] px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{de ? "Damit nicht Lautstärke entscheidet." : "So volume does not decide."}</p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.01] tracking-[-0.04em] sm:text-6xl lg:text-7xl">{de ? "Eine Frage. Viele Perspektiven. Ein klareres Bild." : "One question. Many perspectives. A clearer picture."}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">{de ? "eDebatte beginnt einfach: mitmachen, etwas ergänzen oder selbst eine Frage starten. Wenn du über einen Link oder QR-Code kommst, landest du direkt dort, wo du gebraucht wirst." : "eDebatte starts simply: take part, add something useful, or start your own question. If you arrive through a link or QR code, you go straight to the relevant context."}</p>
          </div>

          <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2" aria-label={de ? "Was möchtest du tun?" : "What would you like to do?"}>
            <Link href="/swipes" className="rounded-[1.5rem] border border-cyan-500/45 bg-cyan-500/8 p-5 text-left transition hover:-translate-y-0.5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">{de ? "Mitmachen" : "Take part"}</p>
              <p className="mt-2 text-xl font-black">{de ? "Schnell deine Meinung abgeben" : "Share your view quickly"}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{de ? "Thema wählen oder Vorschläge bekommen, abstimmen und nur dann tiefer einsteigen, wenn du mehr wissen möchtest." : "Choose a topic or get suggestions, vote and only go deeper when you want more context."}</p>
            </Link>
            <Link href={buildFreeBallotStartHref(undefined, "homepage-intent")} className="rounded-[1.5rem] border border-[color:var(--border)] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-500/45">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">{de ? "Etwas starten" : "Start something"}</p>
              <p className="mt-2 text-xl font-black">{de ? "Eine eigene Frage öffnen" : "Open your own question"}</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{de ? "Eine Frage stellen, Menschen einladen und gemeinsam herausfinden, was trägt oder noch fehlt." : "Ask a question, invite people and find out together what holds up or is still missing."}</p>
            </Link>
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <HomeBallotExperience />
          </div>

          <div className="mx-auto mt-9 grid max-w-4xl gap-4 md:grid-cols-2">
            <Link href={buildFreeBallotStartHref(undefined, "homepage-question")} className="group rounded-[1.75rem] border border-cyan-500/40 bg-cyan-500/5 p-6 transition hover:-translate-y-0.5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">{de ? "Eigene Frage" : "Your question"}</p>
              <h2 className="mt-2 text-2xl font-black">{de ? "Selbst etwas klären" : "Clarify something yourself"}</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{de ? "Frage formulieren, erste Antworten festlegen und teilen. Weitere Einstellungen kommen nur dazu, wenn du sie brauchst." : "Write the question, set initial answers and share. More settings only appear when you need them."}</p>
              <span className="mt-5 inline-block font-black text-cyan-700 dark:text-cyan-300">{cta} →</span>
            </Link>
            <div className="rounded-[1.75rem] border border-[color:var(--border)] p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Premium</p>
                <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[10px] font-black uppercase text-[color:var(--muted)]">{de ? "In Vorbereitung" : "Coming"}</span>
              </div>
              <h2 className="mt-2 text-2xl font-black">{de ? "Viele Fragen aus einem Dokument" : "Many questions from one document"}</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{de ? "Parteiprogramm, Studie, Vereins-, Verbands- oder Unternehmensunterlagen hochladen. eDebatte soll daraus mehrere Fragen und mögliche Antworten zur Prüfung vorbereiten – bevor etwas veröffentlicht wird." : "Upload a programme, study or organisation document. eDebatte is being prepared to turn it into multiple questions and possible answers for review before anything is published."}</p>
              <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">{de ? "Textbasierte PDF- und DOCX-Dateien können bereits privat gelesen werden. Die daraus vorbereiteten Fragen bleiben in Prüfung; veröffentlicht wird nichts automatisch." : "Text-based PDF and DOCX files can already be read privately. Prepared questions remain under review and nothing is published automatically."}</p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-[color:var(--muted)]">{de ? `Bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende kostenlos` : `Free up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants`}</p>
          {experience.workspaceHref && experience.workspaceLabel ? <div className="mt-3 text-center"><Link href={experience.workspaceHref} className="text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{experience.workspaceLabel}</Link></div> : null}
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10">
          <h2 className="max-w-3xl text-3xl font-black sm:text-5xl">{de ? "Nicht nur Antworten sammeln. Verstehen, was dahinterliegt." : "Do not just collect answers. Understand what sits behind them."}</h2>
          <div className="mt-10 border-y border-white/15 md:grid md:grid-cols-4 md:divide-x md:divide-white/15">
            {jobs.map(([title, body], i) => <div key={title} className="py-6 md:px-6 md:py-8"><span className="text-xs font-black text-cyan-300">0{i + 1}</span><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div><h2 className="text-3xl font-black sm:text-5xl">{de ? "Einfach anfangen. Tiefe entsteht erst, wenn du sie brauchst." : "Start simple. Add depth when you need it."}</h2><p className="mt-5 text-base leading-7 text-[color:var(--muted)]">{de ? "Mitmachen, etwas ergänzen oder eine eigene Frage starten. Quellen, Gründe, offene Punkte und weitere Perspektiven werden dort sichtbar, wo sie gebraucht werden." : "Take part, add something useful or start your own question. Sources, reasons, open points and further perspectives appear where they are needed."}</p></div>
          <div className="border-l-2 border-cyan-400 pl-6"><h3 className="text-xl font-bold">{de ? "Du bestimmst, was passiert." : "You decide what happens."}</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]"><li>{de ? "Nichts geht automatisch online." : "Nothing goes online automatically."}</li><li>{de ? "Voxy bleibt optional und muss bewusst gewählt werden." : "Voxy remains optional and requires an explicit choice."}</li><li>{de ? "Fakten werden nicht zur Abstimmung gestellt." : "Facts are not put to a vote."}</li><li>{de ? "Gemeinsames Lernen soll anonymisiert und ohne persönliche Profile erfolgen." : "Shared learning is designed to be anonymised and without personal profiles."}</li></ul></div>
        </div>
      </section>

      <section className="border-t border-[color:var(--border)] px-5 py-16 text-center">
        <h2 className="mx-auto max-w-4xl text-3xl font-black sm:text-5xl">{de ? "Möchtest du mitmachen oder selbst etwas klären?" : "Would you like to take part or clarify something yourself?"}</h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/swipes" className="inline-flex min-h-14 items-center rounded-full border border-cyan-500 px-8 py-3.5 font-black text-cyan-700 dark:text-cyan-300">{de ? "Mitmachen" : "Take part"}</Link>
          <Link href={buildFreeBallotStartHref(undefined, "homepage-final")} className="inline-flex min-h-14 items-center rounded-full bg-cyan-500 px-8 py-3.5 font-black text-slate-950">{cta} →</Link>
        </div>
      </section>
    </div>
  );
}