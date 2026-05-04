"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ExampleItem } from "@/lib/examples/types";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import { ExamplesMarqueeRows } from "@/components/landing/ExamplesMarqueeRows";
import { useLocale } from "@/context/LocaleContext";
import { normalizeLang } from "@features/landing/landingCopy";

type LandingStartProps = {
  blocks: BucketBlock[];
};

type RadarRegion = {
  level: string;
  topics: string[];
};

const NAV_LINKS_DE = [
  { href: "/themen", label: "Themen" },
  { href: "/dossier/demo", label: "Dossiers" },
  { href: "/howtoworks/edebatte", label: "So funktioniert’s" },
  { href: "/pricing", label: "Pakete & Preise" },
  { href: "/pricing/institutionen", label: "Professionell nutzen" },
  { href: "/howtoworks/initiative", label: "Zur Initiative" },
  { href: "/login", label: "Anmelden" },
] as const;

const RADAR_REGIONS_DE: readonly RadarRegion[] = [
  {
    level: "Welt",
    topics: [
      "Wie stoppen wir Plastikmüll in Ozeanen?",
      "Wie wird Migration fair und geordnet gestaltet?",
    ],
  },
  {
    level: "EU",
    topics: [
      "Wie sichern wir bezahlbare Energieversorgung?",
      "Wie sichern wir Pflege langfristig?",
    ],
  },
  {
    level: "Deutschland",
    topics: [
      "Wie wird Wohnen bezahlbarer?",
      "Soll die Verwaltung digitaler werden?",
    ],
  },
  {
    level: "Berlin",
    topics: [
      "Soll Berlin mehr Geld für Radwege bereitstellen?",
      "Wie können Schulhöfe klimaresilienter werden?",
    ],
  },
  {
    level: "Bezirk / Nachbarschaft",
    topics: [
      "Wie gestalten wir Grünflächen verantwortungsvoll?",
      "Wie sichern wir Nachbarschaftshilfe im Alltag?",
    ],
  },
] as const;

const PROCESS_STEPS_DE = [
  {
    title: "Signal",
    text: "Themen und Hinweise erkennen und sammeln",
  },
  {
    title: "Dossier",
    text: "Fakten, Quellen und Argumente ordnen",
  },
  {
    title: "Runde",
    text: "Strukturiert diskutieren und priorisieren",
  },
  {
    title: "Mandat",
    text: "Empfehlungen und Aufträge sichtbar machen",
  },
  {
    title: "Umsetzung",
    text: "Maßnahmen planen und nachvollziehen",
  },
  {
    title: "Wirkung",
    text: "Ergebnisse prüfen und öffentlich lernen",
  },
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

const DOSSIER_RESPONSIBLE_DE = ["Bund", "Länder", "Kommunen / Sozialämter", "Pflegekassen", "Träger und Einrichtungen"] as const;

const TARGET_GROUPS_DE = [
  {
    title: "Für Bürgerinnen und Bürger",
    points: [
      "Themen einbringen und mitdiskutieren",
      "Argumente kennenlernen und bewerten",
      "Entscheidungen besser nachvollziehen",
    ],
  },
  {
    title: "Für Journalismus, Vereine und Fachöffentlichkeit",
    points: [
      "Dossiers als Recherchegrundlage nutzen",
      "Quellen, Daten und Perspektiven bündeln",
      "Öffentliche Debatten konstruktiv stärken",
    ],
  },
  {
    title: "Für Verwaltungen, Gremien und Organisationen",
    points: [
      "Hinweise und Stimmungen früh erkennen",
      "Beteiligung strukturiert organisieren",
      "Entscheidungen und Zuständigkeiten nachvollziehbar machen",
    ],
  },
] as const;

export default function LandingStart({ blocks }: LandingStartProps) {
  const { locale } = useLocale();
  const lang = useMemo(() => normalizeLang(locale), [locale]);
  const router = useRouter();

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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_540px_at_50%_0%,rgba(6,182,212,0.22),transparent_62%),radial-gradient(1000px_520px_at_100%_0%,rgba(59,130,246,0.15),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/60" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
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

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
          <article className="rounded-3xl border border-cyan-300/30 bg-slate-900/75 p-6 shadow-[0_24px_70px_rgba(14,116,144,0.25)] backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Informationsstruktur für öffentliche Debatten
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Was Menschen bewegt, wird sichtbar.
            </h1>
            <p className="mt-2 text-lg font-medium text-cyan-100">Was offen ist, wird klärbar.</p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-base">
              eDebatte sammelt Hinweise, Themen, Quellen, Argumente und mögliche Lösungswege — und macht daraus
              nachvollziehbare Dossiers, Beteiligungsrunden und Entscheidungsgrundlagen.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="/create"
                className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Thema prüfen
              </a>
              <a
                href="/dossier/demo"
                className="rounded-full border border-slate-600 bg-slate-900/70 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Beispiel-Dossier ansehen
              </a>
              <a
                href="/pricing/institutionen"
                className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Professionell nutzen
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Illustrative Produktvorschau · keine Live-Abstimmung, keine Echtzeit-Auswertung
            </p>
          </article>

          <aside className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Debattenradar · Beispielthemen</p>
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
        </section>

        <section className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/75 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">So entsteht Entscheidungsreife aus Debatte</p>
          <p className="mt-2 text-sm text-slate-300">Signal → Dossier → Runde → Mandat → Umsetzung → Wirkung</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS_STEPS_DE.map((step) => (
              <article key={step.title} className="rounded-2xl border border-slate-700 bg-slate-950/55 p-3">
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 shadow-[0_22px_60px_rgba(8,145,178,0.2)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">Dossier-Vorschau</span>
            <span className="rounded-full border border-slate-600 px-2.5 py-1 text-[11px] text-slate-300">Illustrativ</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Dossier-Vorschau: Wie sichern wir Pflege langfristig?</h2>

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
            href="/dossier/demo"
            className="mt-5 inline-flex rounded-full border border-cyan-300/45 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Dossier öffnen
          </a>
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-3">
          {TARGET_GROUPS_DE.map((group) => (
            <article key={group.title} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
              <h3 className="text-base font-semibold text-white">{group.title}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {group.points.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-white">Beteiligung organisieren, ohne eine eigene Plattform aufzubauen.</h2>
          <p className="mt-3 max-w-4xl text-sm text-slate-200">
            eDebatte unterstützt Kommunen, Bezirke, Medien, Vereine und Organisationen dabei, Themenräume, Dossiers
            und Beteiligungsrunden aufzusetzen — transparent, nachvollziehbar und anschlussfähig an bestehende
            Verfahren.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-3">
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Bürgerhinweise und Themenräume</li>
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Dossiers und Beteiligungsrunden</li>
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Auswertung, Mandat und Umsetzungsstatus</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/pricing"
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Pakete & Preise ansehen
            </a>
            <a
              href="/pricing/institutionen"
              className="rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Für Institutionen
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-white">Öffentliche Debatten nachvollziehbar machen.</h2>
          <p className="mt-3 text-sm text-slate-200">
            eDebatte ersetzt keine demokratischen Verfahren. Es macht sichtbar, worüber Menschen sprechen, was belegt
            ist, welche Optionen bestehen und wo Entscheidungen nachvollzogen werden müssen.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Politisch unabhängig</li>
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Quellen und KI-Nutzung transparent</li>
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Anonym, mit Nickname oder verifiziert teilnehmen</li>
            <li className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2">Keine Umsetzungsgarantie, aber klare Zuständigkeiten</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
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
