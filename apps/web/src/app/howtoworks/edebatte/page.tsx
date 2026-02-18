"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { resolveLocalizedField } from "@/lib/localization/getLocalizedField";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

/**
 * /howtoworks/edebatte
 * Methodisch-wissenschaftliche Seite (Referenzarchitektur)
 * - Fokus: Informationsarchitektur + Governance + Auditierbarkeit
 * - Bottom-up: Themenagenda aus der Bevölkerung; Kommune/Verwaltung moderiert; Fachstellen/Wissenschaft prüfen;
 *   Journalismus begleitet regional; private Unterstützung je Thema möglich.
 * - Interne Links via <Link />
 * - Auto-Translate nur für nicht de/en (stabile Basisformulierungen)
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
  id: "hero",
  title_de: "Digitale Entscheidungsarchitektur",
  title_en: "Digital decision architecture",
  lead_de:
    "eDebatte beschreibt und implementiert eine Referenzarchitektur, die öffentliche Beiträge in nachvollziehbare Entscheidungsakten überführt: trennscharf, revisionsfähig, prüfbar — und anschlussfähig an Zuständigkeiten, Gremienlogiken und reale Umsetzungsprozesse.",
  lead_en:
    "eDebatte defines and implements a reference architecture that turns public input into traceable decision files: precise, revisable, verifiable — and compatible with responsibilities, committee logics, and real implementation processes.",
  secondary_de:
    "Wichtig: Das Verfahren ersetzt keine formalen Beschluss- oder Konsultationswege. Es schafft eine belastbare Informations- und Governance-Struktur, damit Beteiligung verarbeitbar wird — mit sichtbarer Unsicherheit, Alternativenpflicht und dokumentierter Rückkopplung.",
  secondary_en:
    "Important: the procedure does not replace formal decision or consultation paths. It provides a robust information and governance structure so participation becomes processable — with visible uncertainty, mandatory alternatives, and documented feedback.",
};

const heroChips = [
  { id: "chip-ia", label_de: "Informationsarchitektur", label_en: "Information architecture" },
  { id: "chip-governance", label_de: "Governance-Modell", label_en: "Governance model" },
  { id: "chip-audit", label_de: "Auditierbarkeit & Versionierung", label_en: "Auditability & versioning" },
  { id: "chip-rueck", label_de: "Rückkopplungspflicht", label_en: "Feedback obligation" },
];

const heroButtons = [
  { id: "cta-start", href: "/start", label_de: "Anliegen einreichen", label_en: "Submit a concern", primary: true },
  { id: "cta-vormerken", href: "/vormerken", label_de: "Pilot vormerken", label_en: "Register pilot interest", primary: false },
  { id: "cta-kontakt", href: "/kontakt", label_de: "Kontakt", label_en: "Contact", primary: false },
];

const framing = {
  id: "framing",
  title_de: "Einordnung und Anspruch",
  title_en: "Positioning and scope",
  p1_de:
    "Moderne Beteiligung scheitert selten an „zu wenig Meinung“, sondern an fehlender Verarbeitbarkeit: Textwolken vermischen Behauptung, Erfahrung, Werturteil und Vorschlag. eDebatte setzt deshalb beim blinden Fleck an: Informationsarchitektur als demokratierelevante Infrastruktur.",
  p1_en:
    "Modern participation rarely fails due to ‘too little opinion’, but due to low processability: text clouds mix claims, experience, values, and proposals. eDebatte therefore targets the blind spot: information architecture as democracy-relevant infrastructure.",
  p2_de:
    "Ziel ist nicht eine „richtige“ politische Option, sondern ein belastbarer Weg, wie Optionen strukturiert, begründet, geprüft und abgestimmt werden können — sodass Mehrheiten begründbar bleiben und Minderheiten sichtbar dokumentiert sind.",
  p2_en:
    "The goal is not to prescribe the ‘correct’ political option, but to provide a robust way to structure, justify, review, and vote on options — so majorities remain explainable and minorities are visibly documented.",
};

const blocks = {
  id: "blocks",
  title_de: "Fünf Bausteine der Entscheidungsakte",
  title_en: "Five building blocks of a decision file",
  lead_de:
    "Unstrukturierter Diskurs wird in wiederverwendbare Arbeitseinheiten übersetzt. Die Stärke liegt nicht in einer Liste, sondern in der Trennung — und der späteren Verknüpfung zu einer Akte.",
  lead_en:
    "Unstructured discourse is translated into reusable work units. The strength is not a list, but separation — and later linking into a decision file.",
};

const blockItems = [
  {
    id: "b-claim",
    label_de: "Behauptung",
    label_en: "Claim",
    explainer_de: "Ein prüfbarer Satz, der als Kernaussage geführt wird (mit Statuslogik).",
    explainer_en: "A verifiable statement tracked as a core claim (with status logic).",
  },
  {
    id: "b-source",
    label_de: "Quelle",
    label_en: "Source",
    explainer_de: "Beleg mit Kontext: Gesetz, Studie, Datensatz, Bericht — oder markierte Lücke.",
    explainer_en: "Evidence with context: law, study, dataset, report — or a marked gap.",
  },
  {
    id: "b-question",
    label_de: "Prüffrage",
    label_en: "Check question",
    explainer_de: "Ein offener Klärpunkt mit Entscheidungsrelevanz (priorisiert, nachgeführt).",
    explainer_en: "An open clarification point relevant for decisions (prioritized, tracked).",
  },
  {
    id: "b-option",
    label_de: "Handlungsoption",
    label_en: "Action option",
    explainer_de: "Eine umsetzbare Alternative (mindestens zwei), inkl. Voraussetzungen und Zuständigkeit.",
    explainer_en: "An implementable alternative (at least two), incl. prerequisites and responsibility.",
  },
  {
    id: "b-impact",
    label_de: "Auswirkung",
    label_en: "Impact",
    explainer_de: "Folgenprofil je Option (mind. sozial/ökologisch), plus Kosten, Recht, Risiken, Zeithorizont.",
    explainer_en: "Impact profile per option (min. social/ecological), plus cost, law, risks, time horizon.",
  },
];

const process = {
  id: "process",
  title_de: "Prozess: vom Beitrag zum Mandat",
  title_en: "Process: from input to mandate",
  lead_de:
    "Das Verfahren trennt Erkundung von Entscheidung. Erst wird strukturiert und geprüft, dann werden Optionen fixiert und abgestimmt; danach folgt Rückkopplung, Umsetzung und Revision.",
  lead_en:
    "The procedure separates exploration from decision. First structure and review, then fix options and vote; afterwards: feedback, implementation, and revision.",
};

const processSteps = [
  {
    id: "p1",
    title_de: "Einreichung",
    title_en: "Submission",
    text_de: "Ein Anliegen wird als Rohbeitrag erfasst (Ziel, Region, Kontext, erste Hinweise).",
    text_en: "A concern is captured as raw input (goal, region, context, initial hints).",
  },
  {
    id: "p2",
    title_de: "Check",
    title_en: "Check",
    text_de: "Trennung in Behauptungen, Quellen, Prüffragen; Dubletten werden zusammengeführt.",
    text_en: "Separate into claims, sources, check questions; merge duplicates.",
  },
  {
    id: "p3",
    title_de: "Dossier",
    title_en: "Dossier",
    text_de: "Verdichtung: Quellenstatus, Gegenpositionen, Optionen und Auswirkungsprofile werden vergleichbar gemacht.",
    text_en: "Consolidation: evidence status, counter-positions, options and impact profiles become comparable.",
  },
  {
    id: "p4",
    title_de: "Beteiligung",
    title_en: "Participation",
    text_de: "Abstimmung über dokumentierte Optionen — mit Quorum/Fristen nach Tragweite.",
    text_en: "Vote on documented options — with quorum/deadlines by impact.",
  },
  {
    id: "p5",
    title_de: "Mandat, Rückkopplung, Umsetzung",
    title_en: "Mandate, feedback, implementation",
    text_de: "Zuständigkeit, Plan und Fortschritt werden in der Akte geführt; Änderungen bleiben versioniert.",
    text_en: "Responsibility, plan and progress are tracked in the file; changes remain versioned.",
  },
];

const roles = {
  id: "roles",
  title_de: "Rollenmodell: Verantwortung sichtbar machen",
  title_en: "Role model: making responsibility visible",
  lead_de:
    "Die Agenda entsteht von unten: Themen und Beobachtungen kommen aus der Bevölkerung und der Nutzung. Institutionen stärken die Qualität, indem sie strukturieren, prüfen, koordinieren und Rückkopplung verbindlich leisten.",
  lead_en:
    "The agenda is bottom-up: topics and observations originate from citizens and users. Institutions strengthen quality by structuring, reviewing, coordinating, and providing binding feedback.",
};

const roleCards = [
  {
    id: "r-citizens",
    title_de: "Einreichende (Bürger:innen / Nutzer:innen)",
    title_en: "Submitters (citizens / users)",
    text_de:
      "Benennen Bedarf und Betroffenheit, liefern Hinweise, Quellen und präzisieren Behauptungen. Ihr Beitrag wird als prüfbare Einheit geführt — nicht als flüchtiger Kommentar.",
    text_en:
      "Describe needs and affectedness, provide hints and sources, refine claims. Contributions are tracked as verifiable units — not ephemeral comments.",
  },
  {
    id: "r-moderation",
    title_de: "Struktur-Moderation / Redaktion (z. B. Kommune, Initiative)",
    title_en: "Structure moderation / editorial (e.g., municipality, initiative)",
    text_de:
      "Sichert Formqualität ohne Inhaltszensur: Trennung der Bausteine, Dublettenlogik, Dossierpflege, Veröffentlichungstexte. Ziel ist Verarbeitbarkeit, nicht Deutungshoheit.",
    text_en:
      "Ensures form quality without censoring content: separates building blocks, handles duplicates, maintains dossiers, publishes summaries. The goal is processability, not narrative control.",
  },
  {
    id: "r-expert",
    title_de: "Fachstellen & Wissenschaft (ggf. Ressorts/Ministerien)",
    title_en: "Expert units & academia (incl. departments/ministries where relevant)",
    text_de:
      "Prüfen strittige Kernaussagen, ordnen Quellen ein, ergänzen Risiken, Rechtsrahmen, Umsetzbarkeit und Messpunkte. So wird aus Debatte eine belastbare Entscheidungsgrundlage.",
    text_en:
      "Review disputed core claims, contextualize sources, add risks, legal frames, feasibility and metrics. This turns debate into decision-grade input.",
  },
  {
    id: "r-admin",
    title_de: "Verwaltung / Umsetzungskoordination",
    title_en: "Administration / implementation coordination",
    text_de:
      "Übersetzt Mandate in Aufgabenpakete (wer, was, bis wann), führt Monitoring und dokumentiert Rückkopplung: Übernahme, Nicht-Übernahme und Gründe.",
    text_en:
      "Translates mandates into task packages (who, what, by when), monitors progress and documents feedback: adoption, non-adoption, and reasons.",
  },
  {
    id: "r-media",
    title_de: "Journalismus & Zivilgesellschaft (regional)",
    title_en: "Journalism & civil society (regional)",
    text_de:
      "Macht Relevanz sichtbar, begleitet Dossiers und übersetzt Akten in öffentliche Einordnung. So entsteht wieder regionale Berichterstattung, die nicht an Empörung, sondern an Prüfpfaden hängt.",
    text_en:
      "Surfaces relevance, accompanies dossiers and translates files into public context. This enables regional reporting anchored in audit trails rather than outrage cycles.",
  },
];

const integrity = {
  id: "integrity",
  title_de: "Integrität, Auditierbarkeit, Versionierung",
  title_en: "Integrity, auditability, versioning",
  lead_de:
    "Entscheidungsakten sind nur dann vertrauensfähig, wenn Änderungen rekonstruierbar sind: wer hat was wann warum geändert — und worauf bezieht sich die Änderung (Behauptung, Quelle, Option, Auswirkung).",
  lead_en:
    "Decision files are trustworthy only if changes are reconstructible: who changed what, when, why — and what the change refers to (claim, source, option, impact).",
  bullets_de: [
    "Sichtbare Unsicherheit: fehlende Quellen sind markiert, nicht kaschiert.",
    "Alternativenpflicht: Abstimmung setzt echte Optionen voraus (oder begründete Ausnahme).",
    "Proportionalität: Prüfintensität steigt mit Tragweite und Risiko.",
    "Minderheitsvotum: Gegenpositionen bleiben Bestandteil der Akte.",
  ],
  bullets_en: [
    "Visible uncertainty: missing sources are marked, not hidden.",
    "Mandatory alternatives: voting requires real options (or a justified exception).",
    "Proportionality: review intensity scales with impact and risk.",
    "Minority record: dissent remains part of the file.",
  ],
};

const support = {
  id: "support",
  title_de: "Pilot, Skalierung und private Unterstützung je Thema",
  title_en: "Pilot, scaling, and private support per topic",
  p1_de:
    "Ein Pilot ist ein kontrolliertes Lernformat (z. B. 12 Wochen, 5–10 Themen) mit klaren Metriken: Durchlaufzeiten, Quellenstatus je Behauptung, Anteil geklärter Prüffragen, Optionenanzahl, Auswirkungsprofile sowie Rückkopplungs- und Umsetzungsquote.",
  p1_en:
    "A pilot is a controlled learning format (e.g., 12 weeks, 5–10 topics) with clear metrics: cycle times, evidence status per claim, share of resolved check questions, number of options, impact profiles, and feedback/implementation rates.",
  p2_de:
    "Zusätzlich kann jedes Thema von Privatpersonen oder Partnern unterstützt werden — nicht um Ergebnisse zu kaufen, sondern um Strukturarbeit zu ermöglichen (z. B. Quellenarbeit, Faktenprüfung, Dossierpflege).",
  p2_en:
    "In addition, each topic can be supported by private persons or partners — not to buy outcomes, but to enable the structural work (e.g., source work, fact checking, dossier maintenance).",
};

export default function HowToWorksEDebattePage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "howtoworks-edebatte" });

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
          <div className="flex flex-wrap items-center gap-2">
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Check
            </span>
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              Dossier
            </span>
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
              Beteiligung
            </span>
          </div>

          <h1 className={`text-4xl font-extrabold leading-tight tracking-tight ${HEADLINE_GRAD}`}>
            {text(hero, "title")}
          </h1>

          <div className={CARD}>
            <p className="text-lg text-[rgb(var(--fg))]">{text(hero, "lead")}</p>
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
              {text(hero, "secondary")}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {heroChips.map((chip) => (
                <span key={chip.id} className={CHIP}>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/90" />
                  {text(chip, "label")}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {heroButtons.map((btn) => (
                <Link
                  key={btn.id}
                  href={btn.href}
                  className={btn.primary ? BUTTON_PRIMARY : BUTTON_GHOST}
                >
                  {text(btn, "label")}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* FRAMING */}
        <section className={CARD} id="einordnung">
          <SectionTitle lead={pick(framing.p1_de, framing.p1_en)}>
            {text(framing, "title")}
          </SectionTitle>
          <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {pick(framing.p2_de, framing.p2_en)}
          </p>
        </section>

        {/* FIVE BLOCKS */}
        <section className={CARD} id="bausteine">
          <SectionTitle lead={text(blocks, "lead")}>
            {text(blocks, "title")}
          </SectionTitle>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {blockItems.map((it) => (
              <div key={it.id} className={SUBCARD}>
                <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                  {text(it, "label")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {text(it, "explainer")}
                </p>
              </div>
            ))}
          </div>

          <div className={`mt-4 ${SUBCARD}`}>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
              {pick(
                "Kernidee: erst Trennung (prüfbar machen), dann Verknüpfung (Akte bilden). So wird aus vielen Beiträgen eine strukturierte Abwägung — und nicht nur ein Stimmungsbild.",
                "Core idea: separate first (make verifiable), then link (form a file). This turns many inputs into structured weighing — not just sentiment.",
              )}
            </p>
          </div>
        </section>

        {/* PROCESS */}
        <section className={CARD} id="prozess">
          <SectionTitle lead={text(process, "lead")}>
            {text(process, "title")}
          </SectionTitle>

          <ol className="mt-4 space-y-3">
            {processSteps.map((s, idx) => (
              <li key={s.id} className={SUBCARD}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {pick("Station", "Stage")} {idx + 1}
                    </p>
                    <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                      {pick(s.title_de, s.title_en)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                      {pick(s.text_de, s.text_en)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ROLES */}
        <section className={CARD} id="rollen">
          <SectionTitle lead={text(roles, "lead")}>
            {text(roles, "title")}
          </SectionTitle>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {roleCards.map((r) => (
              <div key={r.id} className={SUBCARD}>
                <h3 className={`text-lg font-extrabold ${HEADLINE_GRAD}`}>
                  {pick(r.title_de, r.title_en)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {pick(r.text_de, r.text_en)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/vormerken" className={BUTTON_PRIMARY}>
              {pick("Pilot vormerken", "Register pilot interest")}
            </Link>
            <Link href="/howtoworks/bewegung" className={BUTTON_GHOST}>
              {pick("Bewegung & Prinzipien", "Movement & principles")}
            </Link>
          </div>
        </section>

        {/* INTEGRITY */}
        <section className={CARD} id="integritaet">
          <SectionTitle lead={text(integrity, "lead")}>
            {text(integrity, "title")}
          </SectionTitle>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {(lang === "en" ? integrity.bullets_en : integrity.bullets_de).map((b, i) => (
              <li key={`integrity-${i}`}>{b}</li>
            ))}
          </ul>
        </section>

        {/* SUPPORT */}
        <section className={CARD} id="pilot">
          <SectionTitle lead={pick(support.p1_de, support.p1_en)}>
            {text(support, "title")}
          </SectionTitle>

          <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {pick(support.p2_de, support.p2_en)}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/vormerken" className={BUTTON_PRIMARY}>
              {pick("Pilot & Themen vormerken", "Register pilot & topics")}
            </Link>
            <Link href="/start" className={BUTTON_GHOST}>
              {pick("Anliegen einreichen", "Submit a concern")}
            </Link>
            <Link href="/kontakt" className={BUTTON_GHOST}>
              {pick("Kontakt aufnehmen", "Contact")}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
