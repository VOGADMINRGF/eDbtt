"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { resolveLocalizedField } from "@/lib/localization/getLocalizedField";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

/**
 * /ueber-uns
 * - Mission + Einordnung (ohne „Dokumentfamilie“-Behauptungen)
 * - Wissenschaftlicher Ton, aber klarer Fokus: Warum, wofür, wie andocken?
 * - Teaser zur Referenzarchitektur führt nach /howtoworks/edebatte
 * - CTA: /vormerken
 */

const HEADLINE_GRAD = "headline-grad";
const SOFT_RULE =
  "h-px w-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-transparent opacity-40";
const PAGE_BG = "min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]";

const CARD =
  "surface rounded-2xl p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]";
const SUBCARD =
  "surface rounded-xl p-4 bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)]";
const CHIP =
  "inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_70%,rgb(var(--bg))_30%)] px-3 py-1 text-xs font-medium text-[rgb(var(--fg))]";

const BUTTON_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:brightness-110";
const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_75%,transparent)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-from))]";

function SectionTitle({
  children,
  id,
  lead,
}: {
  children: React.ReactNode;
  id?: string;
  lead?: string;
}) {
  return (
    <div className="space-y-2">
      <h2 id={id} className={`text-2xl font-extrabold tracking-tight ${HEADLINE_GRAD}`}>
        {children}
      </h2>
      <div className={SOFT_RULE} />
      {lead ? <p className="muted text-sm leading-relaxed">{lead}</p> : null}
    </div>
  );
}

type Localized = Record<string, unknown>;

const hero = {
  id: "about-hero",
  title_de: "Über uns",
  title_en: "About us",
  lead_de:
    "VoiceOpenGov entwickelt eine Methode, die Beiträge in nachvollziehbare Entscheidungsakten übersetzt. Quellen, offene Fragen und Alternativen bleiben sichtbar.",
  lead_en:
    "VoiceOpenGov builds a method that translates contributions into traceable decision files. Sources, open questions and alternatives remain visible.",
  note_de:
    "Wir ersetzen keine bestehenden Wege. Wir testen, wie Beteiligung klarer und prüfbarer wird – gemeinsam mit Kommunen, Fachstellen und Redaktionen.",
  note_en:
    "We don't replace existing paths. We test how participation becomes clearer and more verifiable — with municipalities, expert units and newsrooms.",
};

const chips = [
  { id: "c1", label_de: "Nachvollziehbarkeit", label_en: "Traceability" },
  { id: "c2", label_de: "Fairness durch Verfahren", label_en: "Procedural fairness" },
  { id: "c3", label_de: "Revision statt Vergessen", label_en: "Revision over forgetting" },
  { id: "c4", label_de: "Rückkopplungspflicht", label_en: "Feedback obligation" },
];

const sections = {
  id: "about-sections",
  mission_de: "Worum es geht",
  mission_en: "What this is about",
  missionLead_de:
    "Viele Beteiligungsformate sammeln Meinungen, aber der Weg zur Entscheidung bleibt unscharf. Wir machen ihn sichtbar.",
  missionLead_en:
    "Many participation formats collect input, but the path to a decision stays fuzzy. We make that path visible.",
  method_de: "Warum eDebatte",
  method_en: "Why eDebatte",
  methodLead_de:
    "eDebatte macht die Methode praktisch: Beiträge trennen, prüfen, vergleichen, entscheiden – und danach Rückkopplung und Umsetzung dokumentieren.",
  methodLead_en:
    "eDebatte operationalizes the method: separate, review, compare, decide — and document feedback and implementation.",
  docking_de: "Wie Institutionen andocken",
  docking_en: "How institutions can connect",
  dockingLead_de:
    "Die Agenda entsteht bottom-up. Institutionen können Struktur geben, prüfen, koordinieren und Rückkopplung leisten.",
  dockingLead_en:
    "The agenda is bottom-up. Institutions can structure, review, coordinate and provide feedback.",
};

const dockingCards = [
  {
    id: "d1",
    title_de: "Kommune & Verwaltung",
    title_en: "Municipality & administration",
    text_de:
      "Moderieren Formqualität, klären Zuständigkeiten, übersetzen Ergebnisse in Umsetzung und leisten dokumentierte Rückkopplung.",
    text_en:
      "Moderate form quality, clarify responsibilities, translate outcomes into implementation, and provide documented feedback.",
  },
  {
    id: "d2",
    title_de: "Fachstellen & Wissenschaft",
    title_en: "Expert units & academia",
    text_de:
      "Prüfen strittige Kernaussagen, ordnen Quellen ein, ergänzen Risiken, Rechtsrahmen, Umsetzbarkeit und Messpunkte.",
    text_en:
      "Review disputed claims, contextualize sources, add risks, legal frames, feasibility and metrics.",
  },
  {
    id: "d3",
    title_de: "Journalismus & Zivilgesellschaft",
    title_en: "Journalism & civil society",
    text_de:
      "Begleiten Dossiers, übersetzen Akten in Einordnung, fördern regionale Berichterstattung auf Basis nachvollziehbarer Prüfpfade.",
    text_en:
      "Accompany dossiers, translate files into context, strengthen regional reporting grounded in audit trails.",
  },
];

const portrait = {
  id: "portrait",
  title_de: "Kurzprofil",
  title_en: "Profile",
  cards: [
    {
      id: "p1",
      title_de: "Was wir tun",
      title_en: "What we do",
      body_de:
        "Wir übersetzen Beiträge in prüfbare Entscheidungsakten, damit Entscheidungen nachvollziehbar bleiben.",
      body_en:
        "We translate contributions into verifiable decision files so decisions remain traceable.",
    },
    {
      id: "p2",
      title_de: "Wie wir arbeiten",
      title_en: "How we work",
      body_de:
        "Wir testen Piloten, dokumentieren Lernschritte und veröffentlichen Ergebnisse offen.",
      body_en:
        "We run pilots, document learnings and publish results openly.",
    },
    {
      id: "p3",
      title_de: "Wofür wir stehen",
      title_en: "What we stand for",
      body_de:
        "Stimmrecht ist gleich. Geld finanziert Arbeit, aber nicht Einfluss auf Ergebnisse.",
      body_en:
        "Voting power is equal. Money funds work but not influence on outcomes.",
    },
  ],
};

const qa = {
  id: "qa",
  title_de: "Fragen & Antworten",
  title_en: "Questions & answers",
  items: [
    {
      id: "qa-1",
      q_de: "Seid ihr eine Partei oder Initiative mit Mandat?",
      q_en: "Are you a party or an institution with a mandate?",
      a_de:
        "Nein. Wir entwickeln Verfahren und Werkzeuge, die an bestehende Zuständigkeiten anschließen.",
      a_en:
        "No. We build procedures and tools that connect to existing responsibilities.",
    },
    {
      id: "qa-2",
      q_de: "Wer entscheidet am Ende?",
      q_en: "Who decides in the end?",
      a_de:
        "Entscheidungen bleiben bei den vorgesehenen Stellen oder bei klar definierten Abstimmungen.",
      a_en:
        "Decisions stay with the designated bodies or with clearly defined votes.",
    },
    {
      id: "qa-3",
      q_de: "Wie geht ihr mit Unsicherheit um?",
      q_en: "How do you handle uncertainty?",
      a_de:
        "Wir markieren fehlende Quellen und offene Fragen sichtbar, statt sie zu verstecken.",
      a_en:
        "We visibly mark missing sources and open questions instead of hiding them.",
    },
    {
      id: "qa-4",
      q_de: "Wie kann ich mitmachen?",
      q_en: "How can I participate?",
      a_de:
        "Du kannst Themen einreichen, abstimmen oder einen Pilot vormerken.",
      a_en:
        "You can submit topics, vote, or register interest for a pilot.",
    },
  ],
};

const chapters = {
  id: "chapters",
  title_de: "Kapitelstruktur (Arbeitsfassung)",
  title_en: "Chapter structure (working draft)",
  items: [
    {
      id: "c-1",
      title_de: "Problem & Zielbild",
      title_en: "Problem & target state",
      benefit_de: "Klären, welches Entscheidungsproblem gelöst wird.",
      benefit_en: "Clarifies which decision problem is being solved.",
    },
    {
      id: "c-2",
      title_de: "Bausteine der Akte",
      title_en: "Building blocks of the file",
      benefit_de: "Zeigt, wie Beiträge in prüfbare Einheiten zerlegt werden.",
      benefit_en: "Shows how contributions are broken into verifiable units.",
    },
    {
      id: "c-3",
      title_de: "Rollen & Zuständigkeiten",
      title_en: "Roles & responsibilities",
      benefit_de: "Macht Verantwortung und Zuständigkeiten nachvollziehbar.",
      benefit_en: "Makes responsibility and roles traceable.",
    },
    {
      id: "c-4",
      title_de: "Ablauf & Rückkopplung",
      title_en: "Process & feedback",
      benefit_de: "Legt fest, wann geprüft, entschieden und berichtet wird.",
      benefit_en: "Defines when reviews, decisions and feedback happen.",
    },
    {
      id: "c-5",
      title_de: "Pilot & Messpunkte",
      title_en: "Pilot & metrics",
      benefit_de: "Definiert Metriken für Qualität, Tempo und Wirkung.",
      benefit_en: "Defines metrics for quality, speed and impact.",
    },
  ],
};

const documents = {
  id: "docs",
  title_de: "Dokumente zur Veröffentlichung",
  title_en: "Documents for release",
  items: [
    {
      id: "d-1",
      label_de: "Methodenpapier",
      label_en: "Method paper",
      detail_de: "Kurz, prüfbar, mit Definitionen und Rollen.",
      detail_en: "Short, verifiable, with definitions and roles.",
    },
    {
      id: "d-2",
      label_de: "Pilotleitfaden",
      label_en: "Pilot guide",
      detail_de: "Ablauf, Rollenbild, Datenbedarf und Messpunkte.",
      detail_en: "Flow, roles, data needs and metrics.",
    },
    {
      id: "d-3",
      label_de: "Transparenzbericht",
      label_en: "Transparency report",
      detail_de: "Finanzierung, Prioritäten und Fortschritt.",
      detail_en: "Funding, priorities and progress.",
    },
    {
      id: "d-4",
      label_de: "Glossar",
      label_en: "Glossary",
      detail_de: "Begriffe und Formate im Überblick.",
      detail_en: "Terms and formats at a glance.",
    },
  ],
};

export default function UeberUnsPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "ueber-uns" });

  const lang = String(locale ?? "de").slice(0, 2);
  const isNative = lang === "de" || lang === "en";

  const text = React.useCallback(
    (entry: Localized, key: string) => {
      const base = resolveLocalizedField(entry as Record<string, any>, key, locale);
      if (isNative) return String(base ?? "");
      const hint = (entry as any)?.id ? `${String((entry as any).id)}.${key}` : key;
      return t(String(base ?? ""), hint);
    },
    [locale, t, isNative],
  );

  const pick = (de: string, en: string) => (lang === "en" ? en : de);

  return (
    <main className={PAGE_BG}>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
        {/* HERO */}
        <header className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c.id} className={CHIP}>
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--grad-to))]" />
                {pick(c.label_de, c.label_en)}
              </span>
            ))}
          </div>

          <h1 className={`text-4xl font-extrabold leading-tight tracking-tight ${HEADLINE_GRAD}`}>
            {text(hero, "title")}
          </h1>

          <div className={CARD}>
            <p className="text-lg text-[rgb(var(--fg))]">{text(hero, "lead")}</p>
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
              {text(hero, "note")}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/vormerken" className={BUTTON_PRIMARY}>
                {pick("Pilot vormerken", "Register pilot interest")}
              </Link>
              <Link href="/howtoworks/edebatte" className={BUTTON_GHOST}>
                {pick("So funktioniert eDebatte", "How eDebatte works")}
              </Link>
              <Link href="/kontakt" className={BUTTON_GHOST}>
                {pick("Kontakt", "Contact")}
              </Link>
            </div>
          </div>
        </header>

        {/* PORTRAIT */}
        <section className={CARD}>
          <SectionTitle>{text(portrait, "title")}</SectionTitle>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {portrait.cards.map((card) => (
              <div key={card.id} className={SUBCARD}>
                <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                  {text(card, "title")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {text(card, "body")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Q&A */}
        <section className={CARD}>
          <SectionTitle>{text(qa, "title")}</SectionTitle>

          <div className="mt-4 space-y-3">
            {qa.items.map((item) => (
              <div key={item.id} className={SUBCARD}>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {text(item, "q")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {text(item, "a")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* MISSION */}
        <section className={CARD}>
          <SectionTitle lead={pick(sections.missionLead_de, sections.missionLead_en)}>
            {pick(sections.mission_de, sections.mission_en)}
          </SectionTitle>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className={SUBCARD}>
              <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                {pick("Das Problem", "The problem")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {pick(
                  "Beiträge sind oft unstrukturiert. Das erschwert Prüfung, Priorisierung und Zuständigkeiten.",
                  "Contributions are often unstructured. This makes review, prioritization and responsibilities hard.",
                )}
              </p>
            </div>

            <div className={SUBCARD}>
              <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                {pick("Unser Ansatz", "Our approach")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {pick(
                  "Wir nutzen klare Bausteine: Behauptung, Quelle, Prüffrage, Option, Auswirkung. So lassen sich Beiträge prüfen und vergleichen.",
                  "We use clear building blocks: claim, source, check question, option, impact. That makes contributions verifiable and comparable.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* WHY EDEBATTE */}
        <section className={CARD}>
          <SectionTitle lead={pick(sections.methodLead_de, sections.methodLead_en)}>
            {pick(sections.method_de, sections.method_en)}
          </SectionTitle>

          <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {pick(
              "eDebatte macht den Prozess sichtbar: von der Trennung der Beiträge bis zur Rückkopplung nach der Entscheidung.",
              "eDebatte makes the process visible: from separating contributions to feedback after a decision.",
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/howtoworks/edebatte" className={BUTTON_PRIMARY}>
              {pick("Zur Referenzarchitektur", "Go to the reference architecture")}
            </Link>
            <Link href="/start" className={BUTTON_GHOST}>
              {pick("Anliegen einreichen", "Submit a concern")}
            </Link>
          </div>
        </section>

        {/* CHAPTER STRUCTURE */}
        <section className={CARD}>
          <SectionTitle>{text(chapters, "title")}</SectionTitle>

          <div className="mt-4 space-y-3">
            {chapters.items.map((item, idx) => (
              <details key={item.id} className={`${SUBCARD} group`}>
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--bg))] text-[10px] font-bold text-[rgb(var(--muted))]">
                    {idx + 1}
                  </span>
                  {text(item, "title")}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {text(item, "benefit")}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* DOCUMENTS */}
        <section className={CARD}>
          <SectionTitle>{text(documents, "title")}</SectionTitle>

          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {documents.items.map((doc) => (
              <li key={doc.id} className={SUBCARD}>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {text(doc, "label")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {text(doc, "detail")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* DOCKING */}
        <section className={CARD}>
          <SectionTitle lead={pick(sections.dockingLead_de, sections.dockingLead_en)}>
            {pick(sections.docking_de, sections.docking_en)}
          </SectionTitle>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dockingCards.map((c) => (
              <div key={c.id} className={SUBCARD}>
                <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                  {pick(c.title_de, c.title_en)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {pick(c.text_de, c.text_en)}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-5 ${SUBCARD}`}>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
              {pick(
                "Wenn du einen Pilot prüfen willst, genügt Vormerken. Wir melden uns mit Ablauf, Rollen und einem realistischen Themenset.",
                "If you want to evaluate a pilot, registering is enough. We’ll respond with process, roles and a realistic topic set.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/vormerken" className={BUTTON_PRIMARY}>
                {pick("Pilot vormerken", "Register pilot interest")}
              </Link>
              <Link href="/kontakt" className={BUTTON_GHOST}>
                {pick("Kontakt", "Contact")}
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
