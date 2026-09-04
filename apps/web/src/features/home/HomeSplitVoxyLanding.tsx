"use client";

import Image from "next/image";
import Link from "next/link";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import { useLocale } from "@/context/LocaleContext";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";
import { buildVoxyExperienceShellHint } from "@/features/voxy/voxyExperienceShellContract";
import {
  buildFreeBallotStartHref,
  GO_TO_MARKET_PACKAGING,
} from "@features/pricing/goToMarketPackaging";

type HomeSplitVoxyLandingProps = {
  blocks?: BucketBlock[];
  experience: StartExperienceModel;
};

type EntryCard = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
};

type SegmentCard = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
};

type Step = {
  number: string;
  title: string;
  body: string;
};

const VOXY_LIGHT_HERO_ASSET = resolveVoxyAsset("createGuideLight");
const VOXY_DARK_HERO_ASSET = resolveVoxyAsset("createGuideDark");

function EntryLinkCard({ href, eyebrow, title, text, cta }: EntryCard) {
  return (
    <Link
      href={href}
      data-testid="home-entry-card"
      className="group flex h-full min-h-[13rem] flex-col rounded-[1.8rem] border border-[rgba(114,178,236,0.24)] bg-[linear-gradient(150deg,rgba(250,253,255,0.94),rgba(228,243,255,0.88)_52%,rgba(203,230,249,0.78))] px-5 py-5 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.16)] dark:bg-[linear-gradient(150deg,rgba(10,24,52,0.92),rgba(13,57,112,0.52)_52%,rgba(7,17,37,0.98))] sm:px-6"
      style={{ boxShadow: "0 20px 48px rgba(29, 88, 150, 0.13)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[1.3rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[1.45rem]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/72 sm:text-[15px]">{text}</p>
      <span className="mt-auto pt-6 text-sm font-semibold text-[rgb(var(--grad-to))] transition group-hover:translate-x-0.5">
        {cta} →
      </span>
    </Link>
  );
}

function SegmentLinkCard({ href, eyebrow, title, text }: SegmentCard) {
  return (
    <Link
      href={href}
      className="group rounded-[1.55rem] border border-[rgba(114,178,236,0.18)] bg-[rgba(237,247,255,0.66)] p-5 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.5)]"
      style={{ boxShadow: "0 16px 36px rgba(29, 88, 150, 0.09)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/70">{text}</p>
      <span className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--grad-to))]">
        {href === "/account" ? "Profil öffnen" : "Einstieg ansehen"} →
      </span>
    </Link>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const { locale } = useLocale();
  const de = locale === "de";
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";

  const heroTitle = isUnknownVisitor
    ? de
      ? "Was sollte sich ändern?"
      : "What should change?"
    : experience.title;
  const heroDescription = isUnknownVisitor
    ? de
      ? "Bring ein, was dich beschäftigt – oder verstehe zuerst, was sich verändert. eDebatte verbindet Anliegen, Quellen, Positionen und Beteiligung zu einem nachvollziehbaren nächsten Schritt."
      : "Bring what matters to you – or first understand what is changing. eDebatte connects concerns, sources, positions and participation into a traceable next step."
    : experience.description;

  const changeQuestions = de
    ? ["Was ist das Problem?", "Was ist belegt?", "Welche Optionen gibt es?", "Wer kann mitentscheiden?"]
    : ["What is the problem?", "What is supported?", "What options exist?", "Who can take part?"];

  const entryCards: readonly EntryCard[] = de
    ? [
        {
          href: "/create",
          eyebrow: "Dein Anliegen",
          title: "Einbringen, was sich ändern sollte",
          text: "Problem, Veränderungswunsch, Vorschlag, Frage, Beobachtung oder Quelle: Ein Satz reicht zum Start.",
          cta: "Anliegen einbringen",
        },
        {
          href: "/swipes",
          eyebrow: "Beteiligung",
          title: "Schnell mitentscheiden",
          text: "Beziehe Position zu laufenden Fragen und steige nur dann tiefer ein, wenn du mehr Kontext brauchst.",
          cta: "Zu den Swipes",
        },
        {
          href: "/themen",
          eyebrow: "Aktuelle Entwicklungen",
          title: "Verstehen, was sich verändert",
          text: "Sieh neue Quellen, Positionen, Entscheidungen und Beteiligungsmöglichkeiten in ihrem Zusammenhang.",
          cta: "Entwicklungen entdecken",
        },
        {
          href: "/dossier",
          eyebrow: "Dossiers",
          title: "Fakten, Positionen und offene Fragen verbinden",
          text: "Verfolge, was belegt ist, wo Quellen widersprechen und wie sich ein Debattenstand weiterentwickelt.",
          cta: "Dossiers verstehen",
        },
      ]
    : [
        {
          href: "/create",
          eyebrow: "Your concern",
          title: "Bring in what should change",
          text: "Problem, desired change, proposal, question, observation or source: one sentence is enough to begin.",
          cta: "Bring a concern",
        },
        {
          href: "/swipes",
          eyebrow: "Participation",
          title: "Take part quickly",
          text: "Take a position on live questions and only go deeper when you need more context.",
          cta: "Open swipes",
        },
        {
          href: "/themen",
          eyebrow: "Current developments",
          title: "Understand what is changing",
          text: "See new sources, positions, decisions and participation opportunities in context.",
          cta: "Explore developments",
        },
        {
          href: "/dossier",
          eyebrow: "Dossiers",
          title: "Connect facts, positions and open questions",
          text: "Follow what is supported, where sources disagree and how the state of a debate develops.",
          cta: "Explore dossiers",
        },
      ];

  const steps: readonly Step[] = de
    ? [
        {
          number: "01",
          title: "Sag, was dich bewegt",
          body: "Ein Satz reicht zum Start. Du musst kein Verfahren kennen und kein fertiges Konzept mitbringen.",
        },
        {
          number: "02",
          title: "Kontext statt Bürokratie",
          body: "Ort, Thema, Zuständigkeit, Quellen und ähnliche Anliegen werden nur so weit geklärt, wie es wirklich nötig ist.",
        },
        {
          number: "03",
          title: "Andere können sich beteiligen",
          body: "Menschen können zustimmen, widersprechen, ergänzen oder tiefer einsteigen. Unterschiede bleiben sichtbar.",
        },
      ]
    : [
        {
          number: "01",
          title: "Say what matters to you",
          body: "One sentence is enough to begin. You do not need to know a process or bring a finished proposal.",
        },
        {
          number: "02",
          title: "Context instead of bureaucracy",
          body: "Place, topic, responsibility, sources and related concerns are clarified only as far as genuinely needed.",
        },
        {
          number: "03",
          title: "Others can take part",
          body: "People can support, disagree, add nuance or go deeper. Differences remain visible.",
        },
      ];

  const segmentCards: readonly SegmentCard[] = de
    ? [
        {
          href: "/account",
          eyebrow: "Für Bürger:innen",
          title: "Verstehen, einbringen und mitwirken",
          text: "Folge Themen, Regionen und Beteiligungen und behalte deinen eigenen Stand im Blick.",
        },
        {
          href: "/account/organization",
          eyebrow: "Für Organisationen, Medien & Kultur",
          title: "Beteiligung professionell vorbereiten",
          text: "Verbinde Themen, Veranstaltungen, Publikum und Ergebnisse, ohne die Bürgerperspektive zu ersetzen.",
        },
        {
          href: "/account/organization",
          eyebrow: "Für Verwaltung & Behörden",
          title: "Zuständigkeiten und Rückmeldungen nachvollziehbar bearbeiten",
          text: "Begleite öffentliche Themen und dokumentiere Antworten, Verfahren und nächste Schritte transparent.",
        },
      ]
    : [
        {
          href: "/account",
          eyebrow: "For citizens",
          title: "Understand, contribute and take part",
          text: "Follow topics, regions and participation and keep track of your own status.",
        },
        {
          href: "/account/organization",
          eyebrow: "For organisations, media & culture",
          title: "Prepare participation professionally",
          text: "Connect topics, events, audiences and results without replacing the citizen perspective.",
        },
        {
          href: "/account/organization",
          eyebrow: "For public administration",
          title: "Handle responsibilities and feedback transparently",
          text: "Support public topics and document responses, procedures and next steps traceably.",
        },
      ];

  const professionalHref = buildFreeBallotStartHref(undefined, "homepage-professional");

  return (
    <section className="landing-canvas public-canvas public-start-canvas overflow-hidden">
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[82rem] !gap-0 !px-5 !pb-12 !pt-3 sm:!px-8 sm:!pb-16 lg:!px-10 lg:!pt-6">
        <section className="relative py-8 sm:py-12 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-22%] top-[-16rem] h-[32rem] rounded-full bg-[radial-gradient(circle,rgba(18,118,255,0.18),transparent_62%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10rem] top-[2rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(160,223,255,0.32),transparent_62%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.16),transparent_66%)]"
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-center lg:gap-14">
            <div className="relative z-[1] max-w-[43rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--grad-to))]">
                {isUnknownVisitor
                  ? de
                    ? "DEIN ANLIEGEN · QUELLEN · BETEILIGUNG"
                    : "YOUR CONCERN · SOURCES · PARTICIPATION"
                  : experience.eyebrow}
              </p>
              <h1 className="mt-4 max-w-[43rem] text-[2.85rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.2rem] lg:text-[4.8rem]">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-[40rem] text-xl font-semibold leading-8 text-[rgb(var(--fg))] sm:text-2xl">
                {de
                  ? "Verstehen, was sich verändert. Mitreden, wo es zählt."
                  : "Understand what is changing. Take part where it matters."}
              </p>
              <p className="mt-5 max-w-[40rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/create"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(24,207,200,0.96),rgba(26,140,255,0.98))] px-6 py-3 text-sm font-semibold text-[rgb(var(--btn-primary-fg))] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                  style={{ boxShadow: "0 14px 34px rgba(24, 140, 255, 0.26)" }}
                >
                  {de ? "Anliegen einbringen" : "Bring a concern"} →
                </Link>
                <Link
                  href="/swipes"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(74,142,204,0.24)] bg-[rgba(235,247,255,0.72)] px-6 py-3 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 hover:bg-[rgba(222,241,255,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:bg-[rgba(15,52,104,0.46)] dark:hover:bg-[rgba(18,65,126,0.58)]"
                >
                  {de ? "Schnell mitentscheiden" : "Take part quickly"}
                </Link>
                <Link
                  href="/themen"
                  className="inline-flex min-h-12 items-center justify-center px-2 py-3 text-sm font-semibold text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                >
                  {de ? "Erst Themen entdecken" : "Explore topics first"} →
                </Link>
              </div>

              <p className="mt-4 text-sm font-semibold text-[rgb(var(--fg))]/66">
                {de
                  ? "Ein Satz reicht zum Start. Nichts wird automatisch veröffentlicht."
                  : "One sentence is enough to begin. Nothing is published automatically."}
              </p>

              <div
                className="mt-7 rounded-[1.55rem] border border-[rgba(112,180,240,0.2)] bg-[rgba(238,248,255,0.66)] p-5 dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.46)]"
                style={{ boxShadow: "0 16px 38px rgba(29, 88, 150, 0.1)" }}
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {de ? "Nicht nur die nächste Schlagzeile." : "More than the next headline."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {changeQuestions.map((question) => (
                    <span
                      key={question}
                      className="rounded-full border border-[rgba(82,154,219,0.18)] bg-[rgba(255,255,255,0.5)] px-3 py-2 text-center text-xs font-semibold text-[rgb(var(--fg))]/76 dark:bg-[rgba(12,41,84,0.42)]"
                    >
                      {question}
                    </span>
                  ))}
                </div>
              </div>

              {!isUnknownVisitor ? (
                <div
                  className="mt-5 rounded-[1.55rem] border border-[rgba(112,180,240,0.18)] bg-[rgba(255,255,255,0.38)] p-5 dark:bg-[rgba(8,28,58,0.4)]"
                  style={{ boxShadow: "0 16px 38px rgba(29, 88, 150, 0.08)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
                    {de ? "Dein nächster Schritt" : "Your next step"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/74">
                    {experience.helperText}
                  </p>
                  {experience.workspaceHref ? (
                    <Link
                      href={experience.workspaceHref}
                      className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                    >
                      {experience.workspaceLabel ?? (de ? "Arbeitsbereich öffnen" : "Open workspace")} →
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-6 max-w-[40rem] text-sm leading-7 text-[rgb(var(--fg))]/64 sm:text-[15px]">
                {de
                  ? "Nichts geht automatisch online. Quellen, Prüfstatus und Beteiligung bleiben nachvollziehbar – du entscheidest den nächsten Schritt."
                  : "Nothing goes online automatically. Sources, review status and participation remain traceable – you decide the next step."}
              </p>
            </div>

            <aside className="relative mx-auto w-full max-w-[35rem]">
              <div
                className="relative overflow-hidden rounded-[2.4rem] border border-[rgba(112,180,240,0.2)] bg-[linear-gradient(155deg,rgba(248,252,255,0.94),rgba(220,240,255,0.9)_50%,rgba(194,226,248,0.82))] px-6 pb-7 pt-6 dark:border-[rgba(112,180,240,0.16)] dark:bg-[linear-gradient(155deg,rgba(7,18,40,0.94),rgba(11,42,86,0.8)_50%,rgba(6,16,34,0.98))]"
                style={{ boxShadow: "0 30px 72px rgba(29, 88, 150, 0.17)" }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-[12%] top-[8%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(47,160,255,0.24),rgba(24,207,200,0.13)_42%,transparent_76%)] blur-3xl"
                />
                <p className="relative z-[2] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
                  {de ? "Mit Voxy" : "With Voxy"}
                </p>
                <div className="relative z-[2] mx-auto mt-4 w-full max-w-[13rem]" data-voxy-avatar="">
                  <div className="relative" style={{ aspectRatio: VOXY_LIGHT_HERO_ASSET.aspectRatio }}>
                    <Image
                      alt={VOXY_LIGHT_HERO_ASSET.alt}
                      className="object-contain object-center dark:hidden"
                      fill
                      priority
                      sizes="220px"
                      src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                    />
                    <Image
                      alt={VOXY_DARK_HERO_ASSET.alt}
                      className="hidden object-contain object-center dark:block"
                      fill
                      priority
                      sizes="220px"
                      src={VOXY_DARK_HERO_ASSET.candidates[0]}
                    />
                  </div>
                </div>
                <div className="relative z-[2] mt-2 text-center">
                  <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))]">
                    {de
                      ? "Relevantes erkennen. Zusammenhänge verstehen."
                      : "Recognise what matters. Understand the connections."}
                  </h2>
                  <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-6 text-[rgb(var(--fg))]/72">
                    {de
                      ? "Voxy begleitet dich durch eDebatte und hilft beim Einordnen. Entscheidungen triffst du selbst."
                      : "Voxy guides you through eDebatte and helps with orientation. You make the decisions yourself."}
                  </p>
                  <p className="mx-auto mt-4 max-w-[28rem] text-xs leading-5 text-[rgb(var(--fg))]/58">
                    {buildVoxyExperienceShellHint("home")}
                  </p>
                  <p className="mx-auto mt-3 max-w-[28rem] text-xs font-semibold leading-5 text-[rgb(var(--fg))]/64">
                    {de ? "Voxy bleibt optional." : "Voxy remains optional."}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section aria-labelledby="home-steps-title" className="py-10 sm:py-14">
          <div className="max-w-[49rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
              {de ? "Vom Gedanken zur Beteiligung" : "From thought to participation"}
            </p>
            <h2 id="home-steps-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              {de ? "So einfach beginnt es." : "This is how simply it starts."}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[1.55rem] border border-[rgba(114,178,236,0.18)] bg-[rgba(237,247,255,0.5)] p-5 dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.38)]"
              >
                <span className="text-xs font-semibold text-[rgb(var(--grad-to))]">{step.number}</span>
                <h3 className="mt-3 text-xl font-semibold text-[rgb(var(--fg))]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[rgb(var(--fg))]/70">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="my-2 rounded-[2rem] border border-[rgba(112,180,240,0.16)] bg-[rgba(4,16,36,0.97)] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                {de ? "Dein Anliegen hat einen Kontext" : "Your concern has a context"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {de ? "Straße, Stadt, Bundesland, Bund oder EU." : "Street, city, state, country or EU."}
              </h2>
            </div>
            <p className="border-l-2 border-cyan-400 pl-6 text-sm leading-7 text-slate-300 sm:text-base">
              {de
                ? "Nicht jedes Anliegen gehört an denselben Ort. Regionale Fragen bleiben regional, überregionale Themen werden nicht künstlich in eine Kommune gedrückt. Entscheidend ist der Kontext des Anliegens – nicht einfach dein Wohnort."
                : "Not every concern belongs at the same level. Regional issues stay regional, while broader topics are not forced into a municipality. The concern's context matters – not simply where you live."}
            </p>
          </div>
        </section>

        <section aria-labelledby="home-entry-title" className="py-10 sm:py-14">
          <div className="max-w-[47rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
              {de ? "Dein Einstieg" : "Your entry point"}
            </p>
            <h2 id="home-entry-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              {de
                ? "Von deinem Anliegen zum nachvollziehbaren nächsten Schritt."
                : "From your concern to a traceable next step."}
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              {de
                ? "Einbringen, mitentscheiden, verstehen oder vertiefen – alles bleibt Teil derselben Themen-, Dossier- und Beteiligungsinfrastruktur."
                : "Contribute, take part, understand or go deeper – everything remains part of the same topic, dossier and participation infrastructure."}
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {entryCards.map((card) => (
              <EntryLinkCard key={card.href} {...card} />
            ))}
          </div>
        </section>

        <section aria-labelledby="home-audience-title" className="py-10 sm:py-14">
          <div className="max-w-[50rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
              {de ? "Professionelle Nutzung bleibt nachgelagert" : "Professional use remains secondary"}
            </p>
            <h2 id="home-audience-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              {de
                ? "Auch für Initiativen, Vereine, Kommunen und Organisationen."
                : "Also for initiatives, associations, municipalities and organisations."}
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              {de
                ? "Professionelle Beteiligung baut auf derselben Bürgerperspektive auf. Institutionen können Fragen und Runden vorbereiten – sie ersetzen aber nicht den Menschen als Ausgangspunkt."
                : "Professional participation builds on the same citizen perspective. Institutions can prepare questions and sessions, but they do not replace people as the starting point."}
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[rgb(var(--fg))]/64">
              {de
                ? `Für einfache eigene Fragen gilt die kostenlose Orientierung bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende.`
                : `For simple questions, the free guideline applies up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants.`}
            </p>
            <Link
              href={professionalHref}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(74,142,204,0.24)] px-6 py-3 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-[rgba(var(--grad-to),0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
            >
              {de ? "Eigene Frage oder Runde starten" : "Start a question or session"} →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {segmentCards.map((card) => (
              <SegmentLinkCard key={`${card.eyebrow}-${card.title}`} {...card} />
            ))}
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <div className="grid gap-8 rounded-[2rem] border border-[rgba(112,180,240,0.18)] bg-[rgba(237,247,255,0.5)] p-6 dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.36)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
                {de ? "Verständlich und kontrollierbar" : "Understandable and controllable"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
                {de ? "Du behältst die Kontrolle." : "You stay in control."}
              </h2>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-[rgb(var(--fg))]/72">
              <li>{de ? "Nichts geht automatisch online. Veröffentlichung bleibt eine bewusste Entscheidung." : "Nothing goes online automatically. Publication remains an explicit decision."}</li>
              <li>{de ? "Voxy bleibt optional und unterstützt beim Verstehen und Strukturieren." : "Voxy remains optional and helps with understanding and structuring."}</li>
              <li>{de ? "Aussagen, Quellen, Positionen und offene Fragen bleiben voneinander unterscheidbar." : "Claims, sources, positions and open questions remain distinguishable."}</li>
              <li>{de ? "eDebatte ordnet Menschen nicht in politische oder persönliche Schubladen ein." : "eDebatte does not place people into political or personal boxes."}</li>
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}
