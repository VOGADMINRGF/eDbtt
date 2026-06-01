"use client";

import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import PwaRouteStatusHint from "@/components/mobile/PwaRouteStatusHint";
import TaskFirstQuickActionCenter from "@/components/quickActions/TaskFirstQuickActionCenter";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { getVoxyCopy } from "@/features/voxy/voxyCopy";

type LandingStartProps = {
  blocks?: BucketBlock[];
  experience?: StartExperienceModel;
};

type PressureSignal = {
  label: string;
  topic: string;
  status: string;
};

const TRUST_PILLS_DE = [
  "kostenlos mitmachen",
  "keine Datenverkäufe",
  "keine versteckten KI-Kosten",
  "review-first",
] as const;

const PRESSURE_SIGNALS_DE: readonly PressureSignal[] = [
  {
    label: "Alltag",
    topic: "Warum bekomme ich so schwer einen Termin?",
    status: "offene Frage",
  },
  {
    label: "Wohnen",
    topic: "Wie bleibt Wohnen bezahlbar?",
    status: "Beteiligung möglich",
  },
  {
    label: "Pflege",
    topic: "Wie sichern wir Pflege langfristig?",
    status: "prüfbar",
  },
  {
    label: "Nachbarschaft",
    topic: "Was braucht unsere Nachbarschaft wirklich?",
    status: "offene Frage",
  },
  {
    label: "Verwaltung",
    topic: "Wie wird Verwaltung erreichbarer?",
    status: "Beteiligung möglich",
  },
  {
    label: "Kosten",
    topic: "Wie sichern wir Versorgung, ohne Menschen zu überfordern?",
    status: "prüfbar",
  },
] as const;

const PARTICIPATION_STEPS_DE = [
  "Anliegen verstehen",
  "Optionen sichtbar machen",
  "Fakten prüfen",
  "Beteiligung starten",
] as const;

const VOXY_MARKERS_DE = [
  "Ich sortiere Anliegen.",
  "Ich trenne Meinung, Behauptung und Quelle.",
  "Review vor Veröffentlichung.",
] as const;

const FACTCHECK_FLOW_DE = [
  {
    label: "Behauptung",
    text: "Ein digitaler Terminservice entlastet Bürgerinnen und Bürger sofort.",
  },
  {
    label: "Quelle",
    text: "Welche belastbaren Daten, Erfahrungen oder Studien stützen die Aussage?",
  },
  {
    label: "Gegenposition",
    text: "Welche Einwände, Nebenfolgen oder ausgeschlossenen Gruppen müssen mitgedacht werden?",
  },
  {
    label: "Offene Frage",
    text: "Was ist noch nicht geklärt, bevor daraus ein öffentlicher Arbeitsstand wird?",
  },
] as const;

const ANLASSRAUM_THREAD_TAGS_DE = [
  "Hinweise sammeln",
  "Quellen prüfen",
  "Fragen klären",
  "Beteiligung vorbereiten",
] as const;

const DOSSIER_PROOF_DE = [
  {
    title: "Was ist belegt?",
    items: [
      "Bevölkerungsanteil 65+ steigt deutlich",
      "Fachkräftelücke in der Pflege wächst",
      "Pflegekosten belasten Haushalte und Träger",
    ],
  },
  {
    title: "Was ist offen?",
    items: [
      "Welche Finanzierungsmodelle sind tragfähig?",
      "Welche Rolle kann Technologie sinnvoll spielen?",
      "Wie gewinnen wir mehr Menschen für Pflegeberufe?",
    ],
  },
  {
    title: "Welche Optionen gibt es?",
    items: [
      "Ausbildungsoffensive und Anreize",
      "Angehörige besser entlasten",
      "Technologie sinnvoll einsetzen",
      "Finanzierung solidarisch stärken",
    ],
  },
] as const;

const MEMBERSHIP_PILLS_DE = [
  "Beteiligung kostenlos",
  "Anliegen einreichen möglich",
  "Hauptthemen durch aktive Mitglieder",
  "transparentes Modell",
  "Keine Datenverkäufe",
] as const;

const ORGANIZATION_USE_CASES_DE = [
  "Bürgerhinweise und Themenräume",
  "Faktenchecks und Dossiers",
  "Swipes und Beteiligungsrunden",
  "Auswertung, Mandat und Umsetzungsstatus",
] as const;

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Einfach anfangen",
  title: "Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.",
  description:
    "eDebatte macht aus Themen, Fragen und Vorschlägen einen nachvollziehbaren Arbeitsraum: mit Optionen, Quellen, offenen Fragen und Beteiligung.",
  helperText: "Wähle den Einstieg, der zu deinem Anliegen passt.",
  trustText:
    "Du entscheidest, was als Nächstes passiert. KI bleibt optional und es gibt keine versteckten Kosten.",
  showExtendedOrientation: true,
  workspaceHref: null,
  workspaceLabel: null,
  quickActionCenter: buildPublicTaskFirstQuickActionCenter({
    context: "unknown_visitor",
  }),
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function LandingStart({
  experience = DEFAULT_START_EXPERIENCE,
}: LandingStartProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const showExtendedOrientation = experience.showExtendedOrientation;
  const showReturningCenter = !isUnknownVisitor;
  const heroEyebrow = isUnknownVisitor
    ? "Was Menschen bewegt, wird sichtbar."
    : experience.eyebrow;

  return (
    <section className="landing-canvas public-canvas">
      <div className="landing-shell public-shell">
        <header className="landing-header public-header">
          <div className="landing-hero-grid public-hero-grid public-reader-grid">
            <aside className="public-voxy-rail order-2 lg:order-1" aria-label="VOXY Bühne">
              <VoxyGuide appearance="hero" title="Voxy als Orientierung" variant="confident">
                <>
                  <p>{getVoxyCopy("start")}</p>
                  <div className="public-thread-tags mt-4">
                    {VOXY_MARKERS_DE.map((marker) => (
                      <span key={marker} className="public-voxy-marker">
                        {marker}
                      </span>
                    ))}
                  </div>
                </>
              </VoxyGuide>
            </aside>

            <article className="landing-section landing-section--hero public-section public-dialog-area order-1 lg:order-2">
              <div className="space-y-5">
                <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                  {heroEyebrow}
                </p>

                {isUnknownVisitor ? (
                  <>
                    <h1 className="no-grad text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[4.4rem]">
                      Was Menschen <span className="landing-gradient-title">bewegt</span>, wird{" "}
                      <span className="landing-gradient-title">sichtbar</span>.
                    </h1>
                    <p className="max-w-3xl text-base font-semibold text-[rgb(var(--fg))] sm:text-xl">
                      {experience.title}
                    </p>
                  </>
                ) : (
                  <h1 className="no-grad text-4xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-5xl lg:text-[4.2rem]">
                    {experience.title}
                  </h1>
                )}

                <p className="max-w-3xl text-base leading-8 sm:text-lg">{experience.description}</p>
                <p className="max-w-3xl text-sm font-semibold text-[rgb(var(--fg))] sm:text-base">
                  {experience.helperText}
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/create?intent=contribute"
                    data-requires-privacy-gate="true"
                    className="landing-cta-primary vog-btn-brand"
                  >
                    Anliegen einbringen
                  </a>
                  <a href="/themen" className="vog-btn-secondary landing-cta-secondary">
                    Thema ansehen
                  </a>
                </div>

                <div className="flex flex-wrap gap-2">
                  {TRUST_PILLS_DE.map((pill) => (
                    <span key={pill} className="landing-soft-pill">
                      {pill}
                    </span>
                  ))}
                </div>

                <p className="max-w-3xl text-sm">{experience.trustText}</p>
              </div>
            </article>
          </div>
        </header>

        <div className="landing-hero-grid landing-hero-grid--lower">
          <section className="landing-section">
            {showExtendedOrientation ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">
                    Signalfluss
                  </p>
                  <h2 className="no-grad text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-3xl">
                    Hier zeigt sich, wo es gerade drückt.
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    Themen erscheinen nicht als Kartenstapel, sondern als wiederkehrende Signale:
                    Fragen, Spannungen, Hinweise und offene Prüfpfade, die zusammen sichtbar
                    bleiben.
                  </p>
                </div>

                <div className="landing-flow-line">
                  <div className="flex flex-wrap gap-2.5">
                    {PRESSURE_SIGNALS_DE.map((signal) => (
                      <span
                        key={`${signal.label}-${signal.topic}`}
                        className="landing-soft-pill landing-soft-pill--signal"
                      >
                        <strong>{signal.label}</strong>
                        <span>{signal.topic}</span>
                        <em>{signal.status}</em>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="landing-process-line">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Nicht noch ein Feed. Nicht nur Ja oder Nein.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      eDebatte führt vom ersten Anliegen bis zur sichtbaren Beteiligung in einem
                      nachvollziehbaren Pfad.
                    </p>
                  </div>
                  <ol className="landing-process-grid">
                    {PARTICIPATION_STEPS_DE.map((step, index) => (
                      <li key={step} className="landing-process-step">
                        <span className="landing-process-count">0{index + 1}</span>
                        <span className="text-sm font-semibold text-[rgb(var(--fg))]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="landing-check-trace">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Faktencheck statt Behauptung gegen Behauptung.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Prüfspuren bleiben offen lesbar: Was wird behauptet, worauf stützt es sich,
                      welche Gegenposition gibt es und was ist noch ungeklärt?
                    </p>
                  </div>
                  <div className="landing-check-grid">
                    {FACTCHECK_FLOW_DE.map((item) => (
                      <div key={item.label} className="landing-check-step">
                        <p className="landing-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/create?intent=check"
                      data-requires-privacy-gate="true"
                      className="vog-btn-secondary landing-cta-secondary"
                    >
                      Aussage prüfen
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">
                    Arbeitsfluss
                  </p>
                  <h2 className="no-grad text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-3xl">
                    Schon dabei? Arbeite direkt weiter.
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    Beitrag, Anlassraum, Themen und Organisationsbereich bleiben dieselben Wege.
                    Der Unterschied liegt nur in der Gewichtung: Arbeitsaktionen stehen vorne,
                    Orientierung bleibt kurz.
                  </p>
                </div>

                <div className="landing-process-line">
                  <ol className="landing-process-grid">
                    {PARTICIPATION_STEPS_DE.map((step, index) => (
                      <li key={step} className="landing-process-step">
                        <span className="landing-process-count">0{index + 1}</span>
                        <span className="text-sm font-semibold text-[rgb(var(--fg))]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </section>

          <section className="landing-section landing-proof-zone">
            <div className="space-y-4">
              <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">
                Einstieg
              </p>
              <h2 className="no-grad text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-3xl">
                Öffne einen Dialog, statt ein Formular auszufüllen.
              </h2>
              <p className="max-w-3xl text-sm leading-7 sm:text-base">
                Quick Actions bleiben offen und lesbar: klare Wege nach vorn, ohne Box-in-Box,
                ohne Dashboard-Look und ohne zweiten Produktpfad.
              </p>
            </div>

            <TaskFirstQuickActionCenter model={experience.quickActionCenter} tone="landing" />

            {showExtendedOrientation ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                    Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.
                  </h3>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    Anlassräume bündeln Hinweise, Optionen, Prüfpfade und Beteiligung in einem
                    sichtbaren Thread. Nicht als Modulwand, sondern als fortlaufender Arbeitsraum.
                  </p>
                  <div className="landing-thread-tags">
                    {ANLASSRAUM_THREAD_TAGS_DE.map((item, index) => (
                      <span
                        key={item}
                        className={joinClasses(
                          "landing-soft-pill",
                          index === 0 && "landing-soft-pill--active",
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/runden/new"
                      data-requires-privacy-gate="true"
                      className="vog-btn-secondary landing-cta-secondary"
                    >
                      Anlassraum/Event starten
                    </a>
                  </div>
                </div>

                <div className="landing-flow-line">
                  <div className="space-y-3">
                    <p className="landing-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em]">
                      Swipe
                    </p>
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Schnell einsteigen mit Swipe.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      In 30 Sekunden ein erstes Signal setzen. Danach kann daraus ein
                      Faktencheck, ein Anlassraum oder ein Dossier werden.
                    </p>
                    <a
                      href="/swipes"
                      data-requires-privacy-gate="true"
                      className="landing-inline-link"
                    >
                      Themen ansehen
                    </a>
                  </div>
                </div>

                <div className="landing-proof-zone">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Aus Hinweisen wird ein Dossier.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Dossiers verdichten den Stand der Klärung: belastbare Punkte, offene Fragen
                      und reale Optionen ohne Sammelmappe aus Einzelkarten.
                    </p>
                  </div>
                  <div className="landing-proof-grid">
                    {DOSSIER_PROOF_DE.map((column) => (
                      <div key={column.title} className="landing-proof-column">
                        <h4 className="text-sm font-semibold text-[rgb(var(--fg))]">{column.title}</h4>
                        <ul className="mt-3 space-y-2 text-sm">
                          {column.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a href="/dossier" className="vog-btn-secondary landing-cta-secondary">
                      Dossier öffnen
                    </a>
                  </div>
                </div>

                <div className="landing-flow-line">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Kostenlos mitmachen. Verbindlich weiterentwickeln.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Jede Person kann Themen ansehen, swipen, Anliegen einreichen und sich
                      beteiligen. Neue Hauptthemen starten aktive Mitglieder.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MEMBERSHIP_PILLS_DE.map((pill) => (
                        <span key={pill} className="landing-soft-pill">
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="landing-flow-line">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Beteiligung organisieren, ohne bei null anzufangen.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Kommunen, Bezirke, Medien, Vereine und Organisationen nutzen dieselben
                      sichtbaren Pfade für Themenräume, Dossiers und Beteiligungsrunden.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ORGANIZATION_USE_CASES_DE.map((useCase) => (
                        <span key={useCase} className="landing-soft-pill">
                          {useCase}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a href="/account/organization" className="vog-btn-secondary landing-cta-secondary">
                        Für Institutionen
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {showReturningCenter ? (
          <PwaRouteStatusHint
            title="Mobil starten"
            body="Swipes bleibt der schnelle Einstieg. Anlassräume, Streams und Dossiers bleiben dieselben Wege und öffnen keine zweite App-Welt."
            caution="Wenn die Verbindung schwankt, bleiben bereits geladene Inhalte sichtbar. Neue Schritte werden erst mit stabiler Verbindung übertragen."
            actions={[
              { href: "/swipes", label: "Swipes öffnen" },
              { href: "/runden", label: "Anlassräume ansehen" },
              { href: "/stream", label: "Event-Pfade öffnen" },
              { href: "/dossier", label: "Dossier öffnen" },
            ]}
          />
        ) : null}

        <section className="landing-section landing-section--footer">
          <div className="space-y-4">
            <h2 className="no-grad text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-3xl">
              Öffentliche Beteiligung braucht einen besseren Ort.
            </h2>
            <p className="max-w-4xl text-sm leading-7 sm:text-base">
              eDebatte ist nicht dafür gebaut, Aufmerksamkeit zu verkaufen. Quellen, Material,
              Faktenchecks und Distribution bleiben geprüft. Partner- und Funding-Hinweise sind
              transparent, beeinflussen aber weder Quellengewichtung noch Ergebnisse.
            </p>
          </div>

          <div className="landing-proof-grid">
            <div className="landing-proof-column">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Nicht Social Media</h3>
              <p className="mt-3 text-sm leading-7">
                Keine Reichweite durch Aufregung. Themen werden geordnet statt weggescrollt.
              </p>
            </div>
            <div className="landing-proof-column">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Mehr als Bürgerbüro</h3>
              <p className="mt-3 text-sm leading-7">
                Anliegen können jederzeit eingebracht werden, auch wenn am Anfang noch nicht klar
                ist, welche Stelle zuständig ist.
              </p>
            </div>
          </div>

          <div className="landing-flow-line space-y-3">
            <p className="text-sm leading-7 text-[rgb(var(--fg))]">
              eDebatte ist das Beteiligungs- und Dossier-Produkt. VoiceOpenGov ist die Initiative
              für offene, nachvollziehbare öffentliche Meinungsbildung.
            </p>
            <div>
              <a href="/howtoworks/initiative" className="vog-btn-secondary landing-cta-secondary">
                Mehr zur Initiative
              </a>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
