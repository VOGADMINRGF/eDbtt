"use client";

import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import TaskFirstQuickActionCenter from "@/components/quickActions/TaskFirstQuickActionCenter";
import PwaRouteStatusHint from "@/components/mobile/PwaRouteStatusHint";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import type { StartExperienceModel } from "@/features/start/startExperience";

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
  "Optionen sammeln",
  "Fakten prüfen",
  "Beteiligung sichtbar machen",
] as const;

const SWIPE_OPTIONS_DE = [
  "Zustimmung",
  "Ablehnung",
  "Offen / unsicher",
  "Fehlt etwas?",
] as const;

const ANLASSRAUM_MODULES_DE = [
  "Hinweise sammeln",
  "Quellen prüfen",
  "Fragen klären",
  "Beteiligung vorbereiten",
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

const DOSSIER_COLUMNS_DE = [
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
  const heroEyebrow =
    experience.familiarity === "unknown_visitor"
      ? "Was Menschen bewegt, wird sichtbar."
      : experience.eyebrow;
  const showExtendedOrientation = experience.showExtendedOrientation;
  const showReturningCenter = experience.familiarity !== "unknown_visitor";

  return (
    <section className="vog-page-stage relative min-h-screen overflow-x-clip">
      <div className="vog-landing-top-glow pointer-events-none absolute inset-x-0 top-0 h-[32rem]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[84rem] flex-col gap-8 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,6.5fr)_minmax(21rem,5.5fr)] lg:items-stretch">
          <article className="vog-landing-band vog-landing-band--accent flex min-h-[30rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] vog-text-secondary">
                {heroEyebrow}
              </p>
              <h1 className="no-grad text-4xl font-semibold tracking-tight vog-text-primary sm:text-5xl lg:text-6xl">
                {experience.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 vog-text-secondary sm:text-lg">
                {experience.description}
              </p>
              <p className="max-w-3xl text-sm font-semibold vog-text-primary sm:text-base">
                {experience.helperText}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <a
                  href="/create?intent=contribute"
                  data-requires-privacy-gate="true"
                  className="vog-btn-brand"
                >
                  Anliegen einreichen
                </a>
                <a href="/runden/new" className="vog-btn-secondary">
                  Anlassraum anlegen
                </a>
                <a href="/themen" className="vog-btn-secondary">
                  Themen ansehen
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {TRUST_PILLS_DE.map((pill) => (
                  <span key={pill} className="vog-chip">
                    {pill}
                  </span>
                ))}
              </div>

              <p className="text-sm vog-text-secondary">{experience.trustText}</p>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <VoxyGuide
              appearance="hero"
              title="Voxy als Orientierung"
              variant={showExtendedOrientation ? "podcastStage" : "presenting"}
            >
              <p>
                Ich helfe, Anliegen zu sortieren. Ich erkenne offene Fragen, unterscheide Meinung,
                Behauptung und Quelle und zeige, wo Beteiligung möglich wird.
              </p>
            </VoxyGuide>

            <section className="vog-landing-band vog-landing-band--calm p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] vog-text-secondary">
                Aus einem Anliegen wird
              </p>
              <div className="mt-4 grid gap-3">
                <div className="vog-surface-soft p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                    Sichtbar
                  </p>
                  <p className="mt-1 text-sm font-semibold vog-text-primary">
                    Thema, offene Frage und nächste Schritte bleiben zusammen.
                  </p>
                </div>
                <div className="vog-surface-soft p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                    Nachvollziehbar
                  </p>
                  <p className="mt-1 text-sm font-semibold vog-text-primary">
                    Quellen, Gegenpositionen und Optionen wachsen im selben Arbeitsraum.
                  </p>
                </div>
                <div className="vog-surface-soft p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                    Review-first
                  </p>
                  <p className="mt-1 text-sm font-semibold vog-text-primary">
                    Nichts wird automatisch veröffentlicht oder künstlich aufgewertet.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-start">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] vog-text-secondary">
                Einstieg
              </p>
              <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                Öffne einen Dialog, statt ein Formular auszufüllen.
              </h2>
              <p className="max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                Starte mit deinen eigenen Worten. Der erste Schritt bleibt leicht und ruhig, egal ob
                du ein Anliegen schilderst, einen Anlassraum anlegst oder erst ein Thema ansiehst.
              </p>

              <a
                href="/create?intent=contribute"
                data-requires-privacy-gate="true"
                className="vog-landing-composer vog-focus-ring block p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="vog-chip vog-chip--active">Anliegen schildern</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] vog-text-secondary">
                    review-first
                  </span>
                </div>
                <p className="mt-5 text-lg font-semibold vog-text-primary">
                  Was bewegt dich gerade?
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                  Beschreibe dein Anliegen, deine Frage oder deinen Vorschlag in eigenen Worten.
                  eDebatte ordnet später ein, was Thema, Option, Behauptung oder offene Frage ist.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="vog-chip">Frage</span>
                  <span className="vog-chip">Hinweis</span>
                  <span className="vog-chip">Vorschlag</span>
                  <span className="vog-chip">Quelle</span>
                </div>
              </a>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/create?intent=contribute"
                  data-requires-privacy-gate="true"
                  className="vog-btn-brand"
                >
                  Anliegen schildern
                </a>
                <a href="/runden/new" className="vog-btn-secondary">
                  Anlassraum anlegen
                </a>
                <a href="/themen" className="vog-btn-secondary">
                  Thema ansehen
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <VoxyGuide appearance="panel" title="Voxy begleitet den Einstieg" variant="welcome">
                <p>Ich helfe, Anliegen zu sortieren. Noch keine perfekte Formulierung nötig.</p>
              </VoxyGuide>
              <div className="vog-surface-soft p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                  Drei erste Wege
                </p>
                <ul className="mt-3 space-y-3 text-sm vog-text-secondary">
                  <li>
                    <span className="font-semibold vog-text-primary">Anliegen schildern</span>
                    {" "}führt in den Beitragspfad.
                  </li>
                  <li>
                    <span className="font-semibold vog-text-primary">Anlassraum anlegen</span>
                    {" "}startet mit Rahmen, Optionen und Sichtbarkeit.
                  </li>
                  <li>
                    <span className="font-semibold vog-text-primary">Thema ansehen</span>
                    {" "}öffnet sichtbare Themen, Swipes und Dossiers.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {showReturningCenter ? (
          <TaskFirstQuickActionCenter model={experience.quickActionCenter} tone="light" />
        ) : null}

        {experience.familiarity !== "unknown_visitor" ? (
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

        {showExtendedOrientation ? (
          <>
            <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                    Hier zeigt sich, wo es gerade drückt.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                    eDebatte macht sichtbar, welche Fragen, Hinweise und Spannungen gerade
                    wiederkehren. Nicht als Feed, sondern als ruhiger Überblick über Themen, die
                    Menschen betreffen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESSURE_SIGNALS_DE.map((signal) => (
                    <div key={`${signal.label}-${signal.topic}`} className="vog-surface-soft min-w-[14rem] flex-1 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                        {signal.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold vog-text-primary">{signal.topic}</p>
                      <span className="vog-chip mt-3 inline-flex">{signal.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm vog-text-secondary">
                Voxy-Hinweis: Ich erkenne Muster, offene Fragen und mögliche nächste Schritte.
              </p>
            </section>

            <section className="vog-landing-band vog-landing-band--calm p-6 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                    Nicht noch ein Feed. Nicht nur Ja oder Nein.
                  </h2>
                  <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
                    Ein Thema wird nicht besser, nur weil es lauter wird. eDebatte führt von der
                    ersten Beobachtung über Optionen und Quellen bis zur sichtbaren Beteiligung.
                  </p>
                </div>
                <a href="/create?intent=check" data-requires-privacy-gate="true" className="vog-btn-secondary">
                  Aussage prüfen
                </a>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4 md:items-center">
                {PARTICIPATION_STEPS_DE.map((step, index) => (
                  <div key={step} className="space-y-3">
                    <div className="vog-surface-soft p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                        Schritt {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold vog-text-primary">{step}</p>
                    </div>
                    {index < PARTICIPATION_STEPS_DE.length - 1 ? (
                      <div className="hidden md:block">
                        <div className="vog-flow-line" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                    Schnell einsteigen mit Swipe.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                    Nicht jede Beteiligung beginnt mit einem langen Text. In 30 Sekunden lässt sich
                    ein erstes Signal abgeben, ohne dass das Thema auf Ja oder Nein reduziert wird.
                  </p>
                  <p className="mt-4 text-sm font-semibold vog-text-primary">
                    Beispielthema: Wird ein digitaler Terminservice den Alltag spürbar entlasten?
                  </p>
                </div>

                <div className="vog-surface-soft p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                    In 30 Sekunden einordnen
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SWIPE_OPTIONS_DE.map((option, index) => (
                      <span
                        key={option}
                        className={joinClasses("vog-chip", index === 0 ? "vog-chip--active" : false)}
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm vog-text-secondary">
                    Aus einer ersten Reaktion kann später ein Anlassraum, ein Faktencheck oder ein
                    Dossier entstehen.
                  </p>
                  <div className="mt-5 flex justify-end">
                    <a href="/swipes" data-requires-privacy-gate="true" className="vog-btn-brand">
                      Themen ansehen
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="vog-landing-band vog-landing-band--accent p-6 sm:p-7 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                    Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                    Ein Anlassraum hält Hinweise, offene Fragen, Optionen und spätere Beteiligung
                    zusammen. So wächst aus einem ersten Anliegen ein nachvollziehbarer Arbeitsraum.
                  </p>
                  <p className="mt-4 text-sm font-semibold vog-text-primary">
                    Rahmen, Optionen und Sichtbarkeit bleiben zuerst klar. Alles Weitere ist
                    anschließbar.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {ANLASSRAUM_MODULES_DE.map((item, index) => (
                      <span
                        key={item}
                        className={joinClasses("vog-chip", index === 0 ? "vog-chip--active" : false)}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="vog-surface-soft p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                          Anliegen
                        </p>
                        <p className="mt-1 text-sm font-semibold vog-text-primary">
                          Sichere Schulwege rund um die Grundschule
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                          Nächster Schritt
                        </p>
                        <p className="mt-1 text-sm font-semibold vog-text-primary">
                          Optionen und Sichtbarkeit festlegen
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm vog-text-secondary">
                      <p>Hinweise sammeln, bevor das Thema auseinanderfällt.</p>
                      <p>Quellen prüfen, ohne den Anlass neu zu starten.</p>
                      <p>Beteiligung vorbereiten, wenn der Rahmen trägt.</p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a href="/runden/new" className="vog-btn-brand">
                        Anlassraum anlegen
                      </a>
                      <a href="/runden" className="vog-btn-secondary">
                        Anlassräume ansehen
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-start">
                <div>
                  <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                    Faktencheck statt Behauptung gegen Behauptung.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 vog-text-secondary sm:text-base">
                    Aussagen bekommen bei eDebatte einen ruhigen Prüfkontext: Was wird behauptet,
                    wodurch ist es gestützt, welche Gegenposition gibt es und was bleibt offen?
                  </p>

                  <div className="mt-5 space-y-3">
                    {FACTCHECK_FLOW_DE.map((item) => (
                      <div key={item.label} className="vog-surface-soft p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] vog-text-secondary">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold vog-text-primary">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <VoxyGuide appearance="panel" title="Voxy im Prüfbereich" variant="thinking">
                    <p>
                      Ich unterscheide Meinung, Behauptung und Quelle. So wird sichtbar, was
                      bereits trägt und was erst noch geklärt werden muss.
                    </p>
                  </VoxyGuide>
                  <div className="flex flex-wrap gap-3">
                    <a href="/create?intent=check" data-requires-privacy-gate="true" className="vog-btn-brand">
                      Aussage prüfen
                    </a>
                    <a href="/dossier" className="vog-btn-secondary">
                      Dossier ansehen
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="vog-landing-band vog-landing-band--calm p-6 sm:p-7 lg:p-8">
              <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                Aus Hinweisen wird ein Dossier.
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
                Wenn ein Thema größer wird, entsteht daraus ein Dossier. Es zeigt nicht nur
                Meinungen, sondern den Stand der Klärung, offene Punkte und belastbare Optionen.
              </p>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {DOSSIER_COLUMNS_DE.map((column) => (
                  <article key={column.title} className="vog-surface-soft p-4">
                    <h3 className="text-sm font-semibold vog-text-primary">{column.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm vog-text-secondary">
                      {column.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href="/dossier" className="vog-btn-secondary">
                  Dossier-Kontext öffnen
                </a>
              </div>
            </section>

            <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
              <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
                Kostenlos mitmachen. Verbindlich weiterentwickeln.
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
                Jede Person kann Themen ansehen, swipen, Anliegen einreichen und sich beteiligen.
                Neue Hauptthemen starten aktive Mitglieder. So bleiben Offenheit und Verantwortung
                verbunden.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {MEMBERSHIP_PILLS_DE.map((pill) => (
                  <span key={pill} className="vog-chip">
                    {pill}
                  </span>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="vog-landing-band vog-landing-band--accent p-6 sm:p-7">
            <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
              Schon dabei? Arbeite direkt weiter.
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
              Beitrag, Anlassraum, Themen und Organisationsbereich bleiben dieselben Wege. Der
              Unterschied liegt nur in der Gewichtung: Arbeitsaktionen stehen vorne, Orientierung
              bleibt kurz.
            </p>
          </section>
        )}

        <section className="vog-landing-band p-6 sm:p-7 lg:p-8">
          <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
            Beteiligung organisieren, ohne bei null anzufangen.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
            Kommunen, Bezirke, Medien, Vereine und Organisationen können eDebatte nutzen, um
            Themenräume, Dossiers und Beteiligungsrunden aufzusetzen, ohne Sichtbarkeit und Review
            zu vermischen.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ORGANIZATION_USE_CASES_DE.map((useCase) => (
              <span key={useCase} className="vog-chip">
                {useCase}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/account/organization" className="vog-btn-brand">
              Organisation anmelden
            </a>
            <a href="/account/organization/dashboard" className="vog-btn-secondary">
              Dashboard öffnen
            </a>
          </div>
        </section>

        <section className="vog-landing-band vog-landing-band--accent p-6 sm:p-7 lg:p-8">
          <h2 className="text-2xl font-semibold vog-text-primary sm:text-3xl">
            Öffentliche Beteiligung braucht einen besseren Ort.
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 vog-text-secondary sm:text-base">
            eDebatte ist nicht dafür gebaut, Aufmerksamkeit zu verkaufen. Quellen, Material,
            Faktenchecks und Distribution bleiben geprüft. Partner- und Funding-Hinweise sind
            transparent, beeinflussen aber weder Quellengewichtung noch Ergebnisse.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="vog-surface-soft p-4">
              <h3 className="text-sm font-semibold vog-text-primary">Nicht Social Media</h3>
              <p className="mt-2 text-sm vog-text-secondary">
                Keine Reichweite durch Aufregung. Themen werden geordnet statt weggescrollt.
              </p>
            </div>
            <div className="vog-surface-soft p-4">
              <h3 className="text-sm font-semibold vog-text-primary">Mehr als Bürgerbüro</h3>
              <p className="mt-2 text-sm vog-text-secondary">
                Anliegen können jederzeit eingebracht werden, auch wenn am Anfang noch nicht klar
                ist, welche Stelle zuständig ist.
              </p>
            </div>
          </div>
        </section>

        <section className="vog-landing-band vog-landing-band--calm p-4 sm:p-5">
          <p className="text-sm leading-7 vog-text-primary">
            eDebatte ist das Beteiligungs- und Dossier-Produkt. VoiceOpenGov ist die Initiative für
            offene, nachvollziehbare öffentliche Meinungsbildung.
          </p>
          <div className="mt-3">
            <a href="/howtoworks/initiative" className="vog-btn-secondary text-xs">
              Mehr zur Initiative
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
