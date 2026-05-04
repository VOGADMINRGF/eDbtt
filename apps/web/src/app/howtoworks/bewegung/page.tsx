"use client";

import * as React from "react";
import { useLocale } from "@/context/LocaleContext";
import { resolveLocalizedField } from "@/lib/localization/getLocalizedField";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

/**
 * Dark-Design (CI blau→türkis) für /howtoworks/bewegung
 * - Inhalt angepasst an deine Klarstellung:
 *   1) kostenfreie Eintragung bei VoiceOpenGov (Bekenntnis + optional Spende)
 *   2) eDebatte-Pakete (Basis/Pro) sind Nutzungspakete, keine „Fördermitgliedschaft“
 *   3) Abstimmungen bleiben frei; kostenpflichtig sind Nutzung/Workflows (Streams, proaktive Einreichungen, Sichtung, KI/Redaktion)
 *   4) Zusätze als Aufpreis (Faktencheck, Dossier, Lektüre/Review, Streams etc.)
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

const heroCopy = {
  title_de: "VoiceOpenGov – die Bewegung. eDebatte – das Werkzeug.",
  title_en: "VoiceOpenGov — the movement. eDebatte — the tool.",
  lead_de:
    "VoiceOpenGov ist ein überparteiliches Bekenntnis zu fairen Verfahren und direkter, nachvollziehbarer Beteiligung. eDebatte macht das praktisch: Beiträge strukturieren, Fakten prüfen, Optionen vergleichen, entscheiden – und Wirkung dokumentieren.",
  lead_en:
    "VoiceOpenGov is a non-partisan commitment to fair procedures and transparent participation. eDebatte makes it practical: structure contributions, verify facts, compare options, decide — and document impact.",
  secondary_de:
    "Wir sind keine Partei und kein politischer Block. Entscheidend ist nicht, wer am lautesten ist, sondern ob ein Ergebnis nachvollziehbar zustande kam – mit Quellen, offenen Fragen, Alternativen und dokumentierten Minderheitenpositionen.",
  secondary_en:
    "We are not a party and not a camp. What matters is not who is loudest, but whether outcomes are traceable — with sources, open questions, alternatives and documented minority positions.",
};

const heroChips = [
  { id: "chip-1", label_de: "eine Person, eine Stimme", label_en: "one person, one vote" },
  { id: "chip-2", label_de: "Regeln sind offen & überprüfbar", label_en: "rules are open & auditable" },
  { id: "chip-3", label_de: "Dossiers statt Gerüchte", label_en: "dossiers instead of rumors" },
];

const heroButtons = [
  { id: "member", href: "/pricing", label_de: "Pakete ansehen", label_en: "See packages", primary: true },
  { id: "app", href: "/howtoworks/edebatte", label_de: "Mehr zur eDebatte", label_en: "More about eDebatte", primary: false },
];

const independenceSection = {
  title_de: "Unabhängig. Überparteilich. Gesellschaft im Mittelpunkt.",
  title_en: "Independent. Non-partisan. Society first.",
  paragraphs: [
    {
      id: "ind-1",
      body_de:
        "VoiceOpenGov ist keine Partei, keine Liste und kein neuer politischer Block. Es ist eine Bewegung, die Verfahren wieder sichtbar macht: Was wird behauptet? Was ist belegt? Was ist offen? Welche Optionen gibt es – und welche Folgen hätten sie?",
      body_en:
        "VoiceOpenGov is not a party, not a list, and not a new camp. It's a movement to make procedures visible again: what's claimed, what's evidenced, what's open, what options exist, and what consequences they have.",
    },
    {
      id: "ind-2",
      body_de:
        "Unser Ziel ist Beteiligung, die handhabbar wird: nicht mehr Texte, sondern bessere Entscheidungsakten. Das stärkt die Akzeptanz – auch dann, wenn eine eigene Position am Ende nicht gewinnt.",
      body_en:
        "Our goal is participation that becomes manageable: not more text, but better decision files. This strengthens acceptance — even if one's own position doesn't win.",
    },
    {
      id: "ind-3",
      body_de:
        "Unabhängigkeit ist dabei Grundbedingung: Stimmrecht ist nicht käuflich. Geld kann Infrastruktur und Arbeit finanzieren – aber nicht Einfluss auf Ergebnisse.",
      body_en:
        "Independence is a prerequisite: voting power cannot be bought. Money can fund infrastructure and work — not influence outcomes.",
    },
  ],
};

const joinModel = {
  title_de: "Mitmachen: zwei Wege – kostenloses Bekenntnis oder eDebatte nutzen",
  title_en: "Join: two ways — free commitment or using eDebatte",
  cards: [
    {
      id: "join-vog",
      title_de: "1) Kostenlos eintragen bei VoiceOpenGov",
      title_en: "1) Register with VoiceOpenGov (free)",
      body_de:
        "Die Eintragung ist kostenfrei. Sie gibt der Bewegung Rückenwind: sichtbar machen, wie viele Menschen faire Verfahren und direkte Beteiligung unterstützen. Wer möchte, kann freiwillig spenden – ohne Vorteile beim Stimmrecht.",
      body_en:
        "Registration is free. It strengthens the movement by showing how many people support fair procedures and transparent participation. Optional donations are possible — without voting advantages.",
      bullets_de: [
        "Kostenfrei: Bekenntnis und Sichtbarkeit.",
        "Freiwillige Spende möglich – ohne Gegenleistung beim Abstimmen.",
        "Stimmrecht bleibt immer gleich: eine Person, eine Stimme.",
      ],
      bullets_en: [
        "Free: commitment and visibility.",
        "Optional donation — without voting perks.",
        "Voting power stays equal: one person, one vote.",
      ],
      ctaHref: "https://voiceopengov.org",
      ctaLabel_de: "Zur Initiative",
      ctaLabel_en: "Go to initiative",
    },
    {
      id: "join-edebatte",
      title_de: "2) eDebatte nutzen (Basis/Pro)",
      title_en: "2) Use eDebatte (Base/Pro)",
      body_de:
        "Die Abstimmungen bleiben grundsätzlich offen und fair. Kosten entstehen dort, wo echte Arbeit anfällt: Sichtung, Moderation, Redaktion, KI-gestützte Strukturierung und laufender Betrieb. Dafür gibt es Nutzungspakete.",
      body_en:
        "Voting stays open and fair. Costs arise where real work happens: review, moderation, editorial work, AI-assisted structuring and ongoing operations. That is covered by usage packages.",
      bullets_de: [
        "Basis (z. B. 9,99 €): aktive Nutzung, Beiträge proaktiv einreichen, Streams/Format-Begleitung möglich.",
        "Pro (z. B. 29,99 €): für intensive Nutzung – täglich Themen regional sauber einreichen und zur Abstimmung bringen.",
        "Zusätze gegen Aufpreis: Faktencheck, Dossiererstellung, Lektüre/Review, Streams/Medienpakete usw.",
      ],
      bullets_en: [
        "Base (e.g., €9.99): active usage, submit contributions proactively, streaming/topic formats possible.",
        "Pro (e.g., €29.99): for heavy usage — submit regional issues regularly and bring them to a vote.",
        "Add-ons (paid): fact-checks, dossiers, review/editing, streaming/media packages, etc.",
      ],
      ctaHref: "/pricing",
      ctaLabel_de: "Pakete ansehen",
      ctaLabel_en: "See packages",
    },
  ],
};

const cooperationBlocks = [
  {
    id: "coop-politics",
    title_de: "Kooperation mit Kommunen, Politik und Institutionen",
    title_en: "Cooperation with municipalities, politics & institutions",
    body_de:
      "eDebatte ist keine Konkurrenz zu gewählten Vertretungen, sondern eine unabhängige Entscheidungsvorbereitung: strukturierte Akten, nachvollziehbare Faktenlage, saubere Fragestellungen, Optionen und Auswirkungen. So können Gremien besser entscheiden – und Bürger:innen sehen, wie ein Ergebnis zustande kam.",
    body_en:
      "eDebatte is not a competitor to elected bodies, but an independent decision-prep layer: structured files, traceable evidence, clear questions, options and impacts. This helps decisions — and keeps the path visible.",
    bullets_de: [
      "Institutionen nutzen Dossiers, ohne Einfluss zu kaufen: Stimmrecht bleibt gleich.",
      "Empfehlungen kommen mit Quellen, Unsicherheiten, offenen Fragen und Minderheitenpositionen.",
      "Kooperation heißt: gemeinsam testen, was funktioniert – und transparent in Regionen übertragen.",
    ],
    bullets_en: [
      "Institutions can use dossiers without buying influence: voting power stays equal.",
      "Recommendations include sources, uncertainty, open questions and minority positions.",
      "Cooperation means testing what works and scaling transparently to regions.",
    ],
  },
  {
    id: "coop-media",
    title_de: "Journalismus: vom Kommentieren zur überprüfbaren Begleitung",
    title_en: "Journalism: from commentary to verifiable accompaniment",
    body_de:
      "Viele Krisen sind schneller als Pressekonferenz, Kommentar und Nachberichterstattung. Wir wollen kritischen Journalismus, der früh einsteigt: Fragen sauber setzt, Quellen offenlegt, Widersprüche sichtbar macht und Dossiers als öffentlichen Prüfpfad nutzt – lokal, investigativ, transparent.",
    body_en:
      "Many crises move faster than press conferences and post-hoc commentary. We want critical journalism to join early: set questions cleanly, disclose sources, surface contradictions and use dossiers as a public audit trail — local, investigative, transparent.",
    bullets_de: [
      "Redaktionen sehen, welche Themen vor Ort wirklich brennen – inklusive Quellen, Gegenargumenten und offenen Fragen.",
      "Jede Vorlage liefert Fragengerüste und Datenpakete für Beiträge, Podcasts oder Live-Formate.",
      "Verfahren bleibt offen einsehbar, die Bewertung bleibt redaktionell – kritische Distanz ist ausdrücklich erwünscht.",
    ],
    bullets_en: [
      "Newsrooms see what matters locally — with sources, counter-arguments and open questions.",
      "Each template provides question sets and data packages for articles, podcasts or live formats.",
      "Procedures stay open; editorial assessment remains independent — critical distance encouraged.",
    ],
  },
];

const joinPanel = {
  title_de: "Mitmachen & Kooperation",
  title_en: "Participate & cooperate",
  intro_de:
    "Wenn dich die Idee überzeugt, kannst du als Bürger:in einsteigen, als Kommune/Organisation pilotieren oder als Redaktion/Creator Themen begleiten – jeweils mit klaren Rollen und transparenten Verfahren.",
  intro_en:
    "If the idea resonates, join as a citizen, pilot as a municipality/organisation, or participate as a newsroom/creator — with clear roles and transparent procedures.",
  segments: [
    {
      id: "segment-citizen",
      label_de: "Für Bürger:innen",
      label_en: "For citizens",
      body_de:
        "Kostenfrei bei VoiceOpenGov eintragen – und auf eDebatte Anliegen einreichen, abstimmen oder Themen begleiten.",
      body_en:
        "Register for free with VoiceOpenGov — and use eDebatte to submit concerns, vote, or accompany topics.",
    },
    {
      id: "segment-politics",
      label_de: "Für Kommunen & Organisationen",
      label_en: "For municipalities & organisations",
      body_de:
        "Pilot starten: 5–10 Themen, klare Metriken, saubere Akten und Rückkopplung in bestehende Beschlusswege.",
      body_en:
        "Run a pilot: 5–10 topics, clear metrics, clean decision files and feedback into existing processes.",
    },
    {
      id: "segment-media",
      label_de: "Für Medien & Creator",
      label_en: "For media & creators",
      body_de:
        "Dossiers und Prüfpfade redaktionell begleiten, Streams/Beiträge mit Quellen und Daten fundieren.",
      body_en:
        "Accompany dossiers editorially and support streams/content with sources and data.",
    },
  ],
  buttons: [
    { id: "panel-vog", href: "https://voiceopengov.org", label_de: "Kostenfrei eintragen", label_en: "Register free", primary: true },
    { id: "panel-pricing", href: "/pricing", label_de: "Pakete ansehen", label_en: "See packages", primary: false },
    { id: "panel-team", href: "/kontakt", label_de: "Kooperation anfragen", label_en: "Request cooperation", primary: false },
  ],
};

export default function HowToWorksBewegungPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "howtoworks-bewegung" });

  const text = React.useCallback(
    (entry: Record<string, any>, key: string) => {
      const base = resolveLocalizedField(entry, key, locale);
      const hint = entry?.id ? `${entry.id}.${key}` : key;
      return t(base, hint);
    },
    [locale, t],
  );

  const pick = React.useCallback(
    (entry: any, key: string) => {
      const isEn = String(locale ?? "de").slice(0, 2) === "en";
      return isEn ? entry[`${key}_en`] ?? entry[`${key}_de`] : entry[`${key}_de`] ?? entry[`${key}_en`];
    },
    [locale],
  );

  return (
    <main className={PAGE_BG}>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
        {/* HERO */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              VoiceOpenGov
            </span>
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
              eDebatte
            </span>
            <span className={CHIP}>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/90" />
              Dossiers
            </span>
          </div>

          <h1 className={`text-4xl font-extrabold leading-tight tracking-tight ${HEADLINE_GRAD}`}>
            {text(heroCopy, "title")}
          </h1>

          <div className={CARD}>
            <p className="text-lg text-[rgb(var(--fg))]">{text(heroCopy, "lead")}</p>
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">{text(heroCopy, "secondary")}</p>

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
                <a key={btn.id} href={btn.href} className={btn.primary ? BUTTON_PRIMARY : BUTTON_GHOST}>
                  {text(btn, "label")}
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* INDEPENDENCE */}
        <section className={CARD}>
          <SectionTitle lead={pick(independenceSection, "title")}>{pick(independenceSection, "title")}</SectionTitle>
          <div className="mt-4 space-y-3">
            {independenceSection.paragraphs.map((p) => (
              <p key={p.id} className="text-sm leading-relaxed text-[rgb(var(--muted))]">
                {text(p, "body")}
              </p>
            ))}
          </div>
        </section>

        {/* JOIN MODEL */}
        <section className="space-y-4">
          <SectionTitle>{pick(joinModel, "title")}</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            {joinModel.cards.map((c) => (
              <div key={c.id} className={CARD}>
                <h3 className={`text-xl font-extrabold ${HEADLINE_GRAD}`}>
                  {String(locale ?? "de").startsWith("en") ? c.title_en : c.title_de}
                </h3>
                <div className={SOFT_RULE + " mt-2"} />
                <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {String(locale ?? "de").startsWith("en") ? c.body_en : c.body_de}
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {(String(locale ?? "de").startsWith("en") ? c.bullets_en : c.bullets_de).map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
                <div className="mt-5">
                  <a href={c.ctaHref} className={BUTTON_PRIMARY}>
                    {String(locale ?? "de").startsWith("en") ? c.ctaLabel_en : c.ctaLabel_de}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COOPERATION + JOIN PANEL */}
        <section className={CARD}>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              {cooperationBlocks.map((block) => (
                <div key={block.id} className="space-y-3">
                  <h2 className={`text-2xl font-extrabold ${HEADLINE_GRAD}`}>
                    {String(locale ?? "de").startsWith("en") ? block.title_en : block.title_de}
                  </h2>
                  <div className={SOFT_RULE} />
                  <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
                    {String(locale ?? "de").startsWith("en") ? block.body_en : block.body_de}
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                    {(String(locale ?? "de").startsWith("en") ? block.bullets_en : block.bullets_de).map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex">
              <div className={CARD + " w-full"}>
                <h3 className={`text-xl font-extrabold ${HEADLINE_GRAD}`}>
                  {String(locale ?? "de").startsWith("en") ? joinPanel.title_en : joinPanel.title_de}
                </h3>
                <div className={SOFT_RULE + " mt-2"} />
                <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {String(locale ?? "de").startsWith("en") ? joinPanel.intro_en : joinPanel.intro_de}
                </p>

                <div className="mt-4 space-y-3 text-sm text-[rgb(var(--muted))]">
                  {joinPanel.segments.map((seg) => (
                    <div key={seg.id} className={SUBCARD}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        {String(locale ?? "de").startsWith("en") ? seg.label_en : seg.label_de}
                      </p>
                      <p className="mt-2 leading-relaxed">
                        {String(locale ?? "de").startsWith("en") ? seg.body_en : seg.body_de}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {joinPanel.buttons.map((btn) => (
                    <a key={btn.id} href={btn.href} className={btn.primary ? BUTTON_PRIMARY : BUTTON_GHOST}>
                      {String(locale ?? "de").startsWith("en") ? btn.label_en : btn.label_de}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
