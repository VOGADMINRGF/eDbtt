"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ExampleItem } from "@/lib/examples/types";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import { ExamplesMarqueeRows } from "@/components/landing/ExamplesMarqueeRows";
import TaskFirstQuickActionCenter from "@/components/quickActions/TaskFirstQuickActionCenter";
import { useLocale } from "@/context/LocaleContext";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { normalizeLang } from "@features/landing/landingCopy";
import PwaRouteStatusHint from "@/components/mobile/PwaRouteStatusHint";

type LandingStartProps = {
  blocks: BucketBlock[];
  experience?: StartExperienceModel;
};

type RadarRegion = {
  level: string;
  topics: string[];
};

const NAV_LINKS_DE = [
  { href: "/create?intent=contribute", label: "Beitragen" },
  { href: "/themen", label: "Themen" },
  { href: "/runden?intent=create", label: "Anlassraum / Event" },
  { href: "/account/organization", label: "Organisation" },
] as const;

const TRUST_PILLS_DE = [
  "review-first",
  "kein Auto-Publish",
  "Keine Datenverkäufe",
  "Keine versteckten AI-Kosten",
] as const;

const RADAR_REGIONS_DE: readonly RadarRegion[] = [
  {
    level: "Alltag",
    topics: [
      "Warum bekomme ich so schwer einen Termin?",
      "Wie bleibt Wohnen bezahlbar?",
    ],
  },
  {
    level: "Pflege und Gesundheit",
    topics: [
      "Wie sichern wir Pflege langfristig?",
      "Wie bleibt Beteiligung auch für Menschen ohne Zeit erreichbar?",
    ],
  },
  {
    level: "Verwaltung und Zuständigkeit",
    topics: [
      "Warum sind Zuständigkeiten oft so unklar?",
      "Wie wird Verwaltung erreichbarer?",
    ],
  },
  {
    level: "Nachbarschaft und Stadt",
    topics: [
      "Was braucht unsere Nachbarschaft wirklich?",
      "Wie werden Schulwege sicherer?",
    ],
  },
  {
    level: "Kosten und Versorgung",
    topics: [
      "Wie gehen wir mit Leerstand und steigenden Kosten um?",
      "Wie sichern wir Versorgung, ohne Menschen zu überfordern?",
    ],
  },
] as const;

const FEED_ALTERNATIVE_POINTS_DE = [
  "Anliegen aufnehmen",
  "Kontext ergänzen",
  "Aussagen prüfen",
  "Optionen entwickeln",
  "Zuständigkeiten sichtbar machen",
  "Beteiligung nachvollziehbar machen",
] as const;

const SWIPE_OPTIONS_DE = [
  "Zustimmung",
  "Ablehnung",
  "Offen / unsicher",
  "Fehlt etwas?",
  "Andere Lösung vorschlagen",
] as const;

const ANLASSRAUM_MODULES_DE = [
  "Hinweise sammeln",
  "Quellen und Fakten ergänzen",
  "offene Fragen klären",
  "Optionen entwickeln",
  "Zuständigkeiten sichtbar machen",
  "Beteiligung vorbereiten",
] as const;

const FACTCHECK_QUESTIONS_DE = [
  "Was wird behauptet?",
  "Was ist belegt?",
  "Welche Quellen gibt es?",
  "Was ist unklar?",
  "Welche Gegenpositionen müssen berücksichtigt werden?",
  "Welche Zuständigkeit ist betroffen?",
] as const;

const DOSSIER_FACTS_DE = [
  "Bevölkerungsanteil 65+ steigt deutlich",
  "Fachkräftelücke in der Pflege wächst",
  "Pflegekosten belasten Haushalte und Träger",
] as const;

const DOSSIER_OPEN_QUESTIONS_DE = [
  "Welche Rolle kann Technologie sinnvoll spielen?",
  "Welche Finanzierungsmodelle sind tragfähig?",
  "Wie gewinnen wir mehr Menschen für Pflegeberufe?",
] as const;

const DOSSIER_OPTIONS_DE = [
  "Ausbildungsoffensive und Anreize",
  "Angehörige besser entlasten",
  "Technologie sinnvoll einsetzen",
  "Finanzierung solidarisch stärken",
] as const;

const DOSSIER_RESPONSIBLE_DE = [
  "Bund",
  "Länder",
  "Kommunen / Sozialämter",
  "Pflegekassen",
  "Träger und Einrichtungen",
] as const;

const PERSPECTIVES_DE = [
  {
    title: "Bürger / Nutzer",
    text: "Ich will sagen, was mich betrifft — ohne erst den richtigen Ansprechpartner suchen zu müssen.",
  },
  {
    title: "Verwaltung / Kommune",
    text: "Wir wollen erkennen, wo Hinweise, Fragen und Zielkonflikte entstehen, bevor Beteiligung unübersichtlich wird.",
  },
  {
    title: "Verein / Träger / Verband",
    text: "Wir wollen Themen geordnet weiterentwickeln, ohne Reichweite mit Verlässlichkeit zu verwechseln.",
  },
  {
    title: "Medienpartner / Redaktion",
    text: "Wir brauchen Quellen, Gegenpositionen und offene Fragen an einem Ort, ohne ungeprüfte Behauptungen zu verstärken.",
  },
  {
    title: "Beteiligungsbüro / Agentur",
    text: "Wir brauchen einen auditierbaren Arbeitsraum für Review, Dossiers, Runden und freigegebene Distribution.",
  },
  {
    title: "Stiftung / Programmträger",
    text: "Wir wollen Wirkung, Transparenzhinweise und Reporting sehen, ohne Einfluss auf Ergebnisse oder Siegel zu erhalten.",
  },
] as const;

const MEMBERSHIP_PILLS_DE = [
  "Beteiligung kostenlos",
  "Anliegen einreichen möglich",
  "Hauptthemen durch aktive Mitglieder",
  "transparentes Modell",
  "Keine Datenverkäufe",
] as const;

const PROFESSIONAL_USE_CASES_DE = [
  "Bürgerhinweise und Themenräume",
  "Faktenchecks und Dossiers",
  "Swipes und Beteiligungsrunden",
  "Auswertung, Mandat und Umsetzungsstatus",
] as const;

const DIFFERENTIATION_CARDS_DE = [
  {
    title: "Nicht Social Media",
    text: "Keine Reichweite durch Aufregung. Themen werden geordnet statt weggescrollt.",
  },
  {
    title: "Nicht Zeitung",
    text: "Keine Beteiligung hinter teuren Abos. Dossiers sollen Orientierung schaffen, nicht nur Schlagzeilen liefern.",
  },
  {
    title: "Nicht Partei",
    text: "Keine politische Bindung. Menschen können Anliegen einbringen, ohne sich einem Lager zuordnen zu müssen.",
  },
  {
    title: "Mehr als Bürgerbüro",
    text: "Anliegen können jederzeit eingebracht werden — auch außerhalb von Öffnungszeiten und ohne vorher die richtige Zuständigkeit zu kennen.",
  },
] as const;

const ALWAYS_REACHABLE_POINTS_DE = [
  "jederzeit erreichbar",
  "auch ohne Vorwissen nutzbar",
  "Anliegen zuerst beschreiben",
  "Zuständigkeit später klären",
  "Verlauf nachvollziehbar machen",
] as const;

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Öffentliche Debatten verständlich machen",
  title: "Was Menschen bewegt, wird sichtbar.",
  description:
    "Bei eDebatte geht es nicht um laute Kommentare, sondern um echte Anliegen. Wir sammeln Hinweise, Fragen, Erfahrungen und Vorschläge, ordnen sie review-first mit Kontext und halten Arbeitsstände auditierbar fest.",
  helperText: "Neu hier? Starte mit einem Beitrag oder schau dir Themen an.",
  trustText:
    "Wir veröffentlichen nichts ungeprüft. Keine Datenverkäufe. Keine versteckten AI-Kosten.",
  showExtendedOrientation: true,
  workspaceHref: null,
  workspaceLabel: null,
  quickActionCenter: buildPublicTaskFirstQuickActionCenter({
    context: "unknown_visitor",
  }),
};

export default function LandingStart({ blocks, experience = DEFAULT_START_EXPERIENCE }: LandingStartProps) {
  const { locale } = useLocale();
  const lang = useMemo(() => normalizeLang(locale), [locale]);
  const router = useRouter();
  const quickActionCenter = useMemo(() => experience.quickActionCenter, [experience.quickActionCenter]);
  const quickActionsBeforeHero = experience.familiarity !== "unknown_visitor";

  const titleForLang = useCallback(
    (item: ExampleItem) => (lang === "en" ? item.title_en || item.title_de : item.title_de),
    [lang],
  );

  const ingestExample = useCallback(
    (item: ExampleItem) => {
      const title = titleForLang(item);
      const topics = lang === "en" ? item.topics_en || item.topics : item.topics;
      try {
        void fetch("/api/examples/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            exampleId: item.id,
            lang,
            title,
            kind: item.kind,
            scope: item.scope,
            topics,
            country: item.country,
            region: item.region,
          }),
        });
      } catch {
        // ignore
      }
    },
    [lang, titleForLang],
  );

  return (
    <section className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <ExamplesMarqueeRows
        blocks={blocks}
        lang={lang}
        onPick={(item) => {
          ingestExample(item);
          router.push("/swipes" as any);
        }}
        onOpen={(item) => {
          ingestExample(item);
          const target =
            `/demo/dossier?persona=citizen` +
            `&from=landing` +
            `&kind=${encodeURIComponent(item.kind)}` +
            `&scope=${encodeURIComponent(item.scope)}`;
          router.push(target as any);
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_540px_at_50%_0%,rgba(6,182,212,0.19),transparent_62%),radial-gradient(950px_520px_at_100%_0%,rgba(59,130,246,0.12),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/62" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/70 px-4 py-3 shadow-[0_10px_30px_rgba(8,145,178,0.2)] backdrop-blur-xl">
          <nav aria-label="Landing-Navigation" className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200">
            <span className="mr-2 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[11px] tracking-wide text-cyan-200">
              eDebatte
            </span>
            {NAV_LINKS_DE.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-cyan-300/40 hover:bg-slate-800/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {quickActionsBeforeHero ? (
          <TaskFirstQuickActionCenter model={quickActionCenter} tone="dark" />
        ) : null}

        <div className="mt-6">
          <PwaRouteStatusHint
            title="Mobil starten"
            body="Swipes bleibt der schnellste Bürgerpfad. QR- und Event-Links führen in dieselben bestehenden Anlassraum-, Stream- und Dossier-Kontexte statt in eine zweite App-Welt."
            caution="Wenn die Verbindung schwankt, bleiben bereits geladene Inhalte sichtbar. Neue Swipes, Beiträge oder QR-Schritte werden erst mit stabiler Verbindung übertragen."
            actions={[
              { href: "/swipes", label: "Swipes öffnen" },
              { href: "/runden", label: "Anlassraum ansehen" },
              { href: "/stream", label: "Event-Pfade öffnen" },
              { href: "/dossier", label: "Dossier-Kontext öffnen" },
            ]}
          />
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <article className="rounded-3xl border border-cyan-300/30 bg-slate-900/75 p-6 shadow-[0_24px_70px_rgba(14,116,144,0.25)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              {experience.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {experience.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {experience.description}
            </p>
            <p className="mt-4 max-w-3xl text-sm font-semibold text-cyan-100">
              {experience.helperText}
            </p>
            <p className="mt-4 text-xs text-slate-300">
              {experience.trustText}
            </p>
            {experience.workspaceHref && experience.workspaceLabel ? (
              <p className="mt-4 text-sm text-slate-200">
                <a
                  href={experience.workspaceHref}
                  className="font-semibold text-cyan-100 underline decoration-cyan-300/50 underline-offset-4"
                >
                  {experience.workspaceLabel}
                </a>{" "}
                ist direkt erreichbar. Du siehst immer, was als nächstes passiert.
              </p>
            ) : null}
          </article>

          {experience.showExtendedOrientation ? (
            <aside className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Debattenradar · Alltagsthemen
              </p>
              <div className="mt-3 space-y-3 overflow-x-auto pb-2 lg:overflow-visible">
                {RADAR_REGIONS_DE.map((region) => (
                  <section key={region.level} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">{region.level}</p>
                    <ul className="mt-2 space-y-1">
                      {region.topics.map((topic) => (
                        <li key={topic} className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-200">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </aside>
          ) : (
            <aside className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Schneller Überblick
              </p>
              <div className="mt-3 space-y-3">
                <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">So arbeitest du weiter</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-200">
                    <li>Beitrag starten oder weiter schärfen</li>
                    <li>Anlassraum vorbereiten oder Status prüfen</li>
                    <li>Arbeitsstände bleiben review-first und nachvollziehbar</li>
                  </ul>
                </section>
                <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Vertrauen</p>
                  <p className="mt-2 text-xs text-slate-200">
                    Wir veröffentlichen nichts ungeprüft. Du siehst immer, was als nächstes passiert.
                  </p>
                </section>
              </div>
            </aside>
          )}
        </section>

        <section className="mt-4 flex flex-wrap gap-2">
          {TRUST_PILLS_DE.map((pill) => (
            <span
              key={pill}
              className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
            >
              {pill}
            </span>
          ))}
        </section>

        {!quickActionsBeforeHero ? (
          <TaskFirstQuickActionCenter model={quickActionCenter} tone="dark" />
        ) : null}

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/75 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Hier zeigt sich, wo es gerade drückt.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Viele Menschen erleben ähnliche Probleme — beim Wohnen, in der Pflege, in der Verwaltung, in der Schule,
            im Verkehr oder in der Nachbarschaft. eDebatte macht solche Anliegen sichtbar und hilft, sie
            weiterzuverfolgen.
          </p>
        </section>

        {experience.showExtendedOrientation ? (
          <>
        <section className="mt-10 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Nicht noch ein Feed. Nicht nur Ja oder Nein.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Viele Anliegen verschwinden nach kurzer Aufmerksamkeit wieder. Bei eDebatte bleibt die Sache im
            Mittelpunkt: Was ist passiert? Was ist belegt? Was ist offen? Welche Optionen gibt es? Wer kann handeln?
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEED_ALTERNATIVE_POINTS_DE.map((point) => (
              <li key={point} className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-cyan-100">
            Nicht der lauteste Kommentar gewinnt. Das Thema wird Schritt für Schritt verständlicher.
          </p>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Schnell einsteigen mit Swipe.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Nicht jede Beteiligung beginnt mit einem langen Text. Mit Swipe können Menschen schnell zeigen, wie sie
            ein Thema einschätzen — zustimmen, ablehnen, offen bleiben oder markieren, was fehlt.
          </p>
          <p className="mt-3 text-sm text-slate-200">
            Ein Swipe ist bei eDebatte kein Endpunkt. Er kann zeigen, wo Zustimmung, Zweifel, offene Fragen oder neue
            Vorschläge entstehen.
          </p>
          <article className="mt-4 rounded-2xl border border-cyan-300/30 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Swipe-Vorschau</p>
            <h3 className="mt-2 text-base font-semibold text-white">Thema: Erreichbare Verwaltung</h3>
            <p className="mt-1 text-sm text-slate-200">Kurze Frage: Wird ein digitaler Terminservice den Alltag spürbar entlasten?</p>
            <ul className="mt-3 grid gap-2 text-xs text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {SWIPE_OPTIONS_DE.map((option) => (
                <li key={option} className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5">
                  {option}
                </li>
              ))}
            </ul>
          </article>
          <p className="mt-3 text-sm text-cyan-100">
            Aus einer ersten Reaktion kann ein Anlassraum, ein Faktencheck oder ein Dossier entstehen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/swipes"
              data-requires-privacy-gate="true"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Themenlage ansehen
            </a>
            <a
              href="/runden?intent=create"
              className="rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Anlassraum/Event starten
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Ein einzelner Hinweis reicht oft nicht aus. Im Anlassraum werden Beiträge, Quellen, offene Fragen,
            Sichtweisen und mögliche Lösungen zu einem Thema gesammelt. So bleibt ein Anliegen über Zeit
            nachvollziehbar.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {ANLASSRAUM_MODULES_DE.map((item) => (
              <li key={item} className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-cyan-100">
            Ein Anlassraum ist der Arbeitsraum zwischen erstem Unmut und belastbarer Entscheidungsgrundlage.
          </p>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Faktencheck statt Behauptung gegen Behauptung.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Wenn Aussagen im Raum stehen, braucht es mehr als schnelle Reaktionen. eDebatte hilft, Behauptungen zu
            prüfen, Quellen sichtbar zu machen und offene Punkte sauber zu benennen.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FACTCHECK_QUESTIONS_DE.map((question) => (
              <li key={question} className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                {question}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-cyan-100">Das Ziel ist nicht künstliche Einigkeit. Das Ziel ist mehr Klarheit.</p>
          <a
            href="/create?intent=check"
            data-requires-privacy-gate="true"
            className="mt-4 inline-flex rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Aussage prüfen
          </a>
        </section>

        <section className="mt-10 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 shadow-[0_22px_60px_rgba(8,145,178,0.2)] sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Aus Hinweisen wird ein Dossier.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Wenn ein Thema größer wird, entsteht daraus ein Dossier. Es zeigt nicht nur Meinungen, sondern den Stand
            der Klärung.
          </p>
          <p className="mt-2 text-sm text-cyan-100">Ein Dossier ist keine Schlagzeile. Es ist ein nachvollziehbarer Arbeitsstand.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <figure className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
              <Image src="/edebatte_startpage/Dossier.png" alt="Dossier-Vorschau" width={1200} height={720} className="h-40 w-full object-cover opacity-75" />
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
              <Image src="/edebatte_startpage/Abstimmen.png" alt="Beteiligungsrunde-Vorschau" width={1200} height={720} className="h-40 w-full object-cover opacity-75" />
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/60">
              <Image src="/edebatte_startpage/Mandat.png" alt="Mandat-Vorschau" width={1200} height={720} className="h-40 w-full object-cover opacity-75" />
            </figure>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Worum geht es?</h3>
              <p className="mt-2 text-sm text-slate-200">
                Der Bedarf an Pflegeleistungen steigt, während Fachkräfte knapp sind und Kosten wachsen. Gesucht sind
                tragfähige Lösungswege für eine verlässliche, bezahlbare und menschliche Pflege.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Was ist belegt?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                {DOSSIER_FACTS_DE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Was ist offen?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                {DOSSIER_OPEN_QUESTIONS_DE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Welche Optionen gibt es?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                {DOSSIER_OPTIONS_DE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Wer ist zuständig?</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-200">
                {DOSSIER_RESPONSIBLE_DE.map((item) => (
                  <li key={item} className="rounded-full border border-slate-600 bg-slate-900/80 px-2 py-1">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
              <h3 className="text-sm font-semibold text-cyan-100">Wie sehen andere es?</h3>
              <p className="mt-2 text-xs text-slate-400">Illustrative Vorschau · keine laufende Abstimmung</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <div>
                  <div className="mb-1 flex justify-between text-xs"><span>Zustimmung</span><span>46 %</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-2 w-[46%] rounded-full bg-cyan-400" /></div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs"><span>Offen</span><span>33 %</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-2 w-[33%] rounded-full bg-violet-400" /></div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs"><span>Ablehnung</span><span>21 %</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-2 w-[21%] rounded-full bg-slate-400" /></div>
                </div>
              </div>
            </article>
          </div>
          <a
            href="/dossier"
            className="mt-5 inline-flex rounded-full border border-cyan-300/45 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Dossier-Kontext öffnen
          </a>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ein Thema. Verschiedene Blickpunkte.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Ein Anliegen sieht je nach Perspektive anders aus. eDebatte macht diese Unterschiede sichtbar, ohne das
            Thema aus dem Blick zu verlieren.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERSPECTIVES_DE.map((perspective) => (
              <article key={perspective.title} className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
                <h3 className="text-sm font-semibold text-cyan-100">{perspective.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{perspective.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-cyan-100">
            Verschiedene Blickpunkte helfen nur, wenn die Sache im Mittelpunkt bleibt.
          </p>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Kostenlos mitmachen. Verbindlich weiterentwickeln.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Bei eDebatte kann jede Person kostenlos mitmachen: Themen ansehen, swipen, Anliegen einreichen, Hinweise
            geben und sich beteiligen.
          </p>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Neue Hauptthemen starten aktive Mitglieder. So verbinden wir Offenheit mit Verantwortung: Jedes Anliegen
            kann eingebracht werden, aber nicht jeder kurze Impuls wird sofort ein neues Hauptthema.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MEMBERSHIP_PILLS_DE.map((pill) => (
              <span key={pill} className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-100">
                {pill}
              </span>
            ))}
          </div>
        </section>
          </>
        ) : (
          <section className="mt-10 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 sm:p-7">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Schon dabei? Arbeite direkt weiter.</h2>
            <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
              Beitrag, Anlassraum, Themen und Organisationsbereich bleiben dieselben production-ready-v1 Pfade.
              Der Unterschied liegt nur in der Gewichtung: Arbeitsaktionen stehen vorne, Orientierung bleibt kurz.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
              <li className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                Wir veröffentlichen nichts ungeprüft.
              </li>
              <li className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                Du siehst immer, was als nächstes passiert.
              </li>
              <li className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                Arbeitsbereich und Freischaltung bleiben klar getrennt.
              </li>
              <li className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                Keine versteckten AI-Kosten. Keine Datenverkäufe.
              </li>
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Beteiligung organisieren, ohne bei null anzufangen.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Kommunen, Bezirke, Medien, Vereine und Organisationen können eDebatte nutzen, um Themenräume, Dossiers und
            Beteiligungsrunden aufzusetzen — transparent, nachvollziehbar und anschlussfähig an bestehende Verfahren.
          </p>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Produktive Organisationsrechte laufen review-first über verifizierte Organisationen, manuelle Zugangs- und
            Vertragsfreigabe sowie klare Scope- und Entitlement-Grenzen.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {PROFESSIONAL_USE_CASES_DE.map((useCase) => (
              <li key={useCase} className="rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
                {useCase}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/account/organization"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Organisation anmelden
            </a>
            <a
              href="/account/organization/dashboard"
              className="rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Dashboard öffnen
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 sm:p-7">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Öffentliche Beteiligung braucht einen besseren Ort.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            eDebatte ist nicht dafür gebaut, Aufmerksamkeit zu verkaufen. Wir wollen keine Empörung verlängern, keine
            Daten hinten heraus verwerten und keine Beteiligung hinter einer Paywall verstecken.
          </p>
          <p className="mt-3 max-w-4xl text-sm text-slate-200 sm:text-base">
            Quellen, Material, Factchecks und Distribution bleiben geprüft. Partner- und Funding-Hinweise sind
            transparent, beeinflussen aber weder Quellengewichtung noch Ergebnisse oder Siegelentscheidungen.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DIFFERENTIATION_CARDS_DE.map((card) => (
              <article key={card.title} className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
                <h3 className="text-sm font-semibold text-cyan-100">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{card.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
            <h3 className="text-lg font-semibold text-white">Jedes Anliegen braucht einen erreichbaren Ort.</h3>
            <p className="mt-2 text-sm text-slate-200">
              Viele Anliegen entstehen nicht während einer Sprechzeit. Und oft ist am Anfang nicht klar, welche Stelle
              zuständig ist. eDebatte nimmt Themen zuerst als Sache auf — und hilft dann, Kontext, Zuständigkeiten und
              nächste Schritte sichtbar zu machen.
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {ALWAYS_REACHABLE_POINTS_DE.map((point) => (
                <li key={point} className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2">
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold text-cyan-100">
              Man muss nicht zuerst das System verstehen, um ein Anliegen einzubringen.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          eDebatte ist das Beteiligungs- und Dossier-Produkt. VoiceOpenGov ist die Initiative für offene,
          nachvollziehbare öffentliche Meinungsbildung.
          <div className="mt-2">
            <a
              href="/howtoworks/initiative"
              className="inline-flex rounded-full border border-cyan-300/45 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Mehr zur Initiative
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
