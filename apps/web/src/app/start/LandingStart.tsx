"use client";

import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import PwaRouteStatusHint from "@/components/mobile/PwaRouteStatusHint";
import TaskFirstQuickActionCenter from "@/components/quickActions/TaskFirstQuickActionCenter";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import LandingCreateLightEntry from "@/features/start/LandingCreateLightEntry";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { getStartCreateVoxyCopy } from "@/features/start/startCreateVoxyCopy";

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
  "kostenlos starten",
  "keine Datenverkäufe",
  "erst einordnen, dann bestätigen",
  "du behältst die Kontrolle",
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
    status: "Thema wächst",
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
    status: "Thema wächst",
  },
  {
    label: "Kosten",
    topic: "Wie sichern wir Versorgung, ohne Menschen zu überfordern?",
    status: "prüfbar",
  },
] as const;

const PARTICIPATION_STEPS_DE = [
  "Anliegen verstehen",
  "Fragen sortieren",
  "Optionen sichtbar machen",
  "Nächsten Schritt wählen",
] as const;

const VOXY_MARKERS_DE = [
  "Thema, Fragen und nächster Schritt bleiben sichtbar.",
  "Nichts wird automatisch veröffentlicht.",
  "Du bestätigst den nächsten Schritt selbst.",
] as const;

const START_GUIDE_CARDS_DE = [
  {
    eyebrow: "Schritt 1",
    title: "Themen erkennen",
    text: "Ein kurzer Text wird zuerst als Entwurf geordnet, damit dein Anliegen nicht wie ein Ticket oder Demo-Lead wirkt.",
  },
  {
    eyebrow: "Schritt 2",
    title: "Dossier aufbauen",
    text: "Du siehst früh, welche offenen Fragen, Belege und Anschlussstellen zu deinem Beitrag passen könnten.",
  },
  {
    eyebrow: "Schritt 3",
    title: "Sichtweisen sammeln",
    text: "Erst danach entscheidest du, ob du vertiefst, zu einem bestehenden Thema beiträgst oder später den Schritt „Abstimmen & auswerten“ vorbereitest.",
  },
] as const;

const START_SUPPORT_LINKS_DE = [
  {
    href: "/pricing/institutionen",
    label: "Für Verwaltung / Organisation ansehen",
  },
  {
    href: "/kontakt",
    label: "Demo anfragen",
  },
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
    text: "Was ist noch nicht geklärt, bevor daraus ein nächster öffentlicher Schritt wird?",
  },
] as const;

const ANLASSRAUM_THREAD_TAGS_DE = [
  "Hinweise sammeln",
  "Quellen prüfen",
  "Fragen klären",
  "Nächsten Schritt finden",
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
  "Mitmachen kostenlos",
  "Anliegen einreichen möglich",
  "Hauptthemen durch aktive Mitglieder",
  "transparentes Modell",
  "Keine Datenverkäufe",
] as const;

const ORGANIZATION_USE_CASES_DE = [
  "Themen erkennen",
  "Dossier aufbauen",
  "Sichtweisen sammeln",
  "Abstimmen & auswerten",
] as const;

const DEFAULT_START_EXPERIENCE: StartExperienceModel = {
  familiarity: "unknown_visitor",
  eyebrow: "Einfach anfangen",
  title: "Aus deinem Beitrag wird Orientierung.",
  description:
    "eDebatte hilft dir, deinen Beitrag einzuordnen: Was ist passiert? Was ist belegt? Welche Fragen sind offen? Und welcher nächste Schritt ist sinnvoll?",
  helperText: "Du kannst einen Beitrag einordnen, Beispiele ansehen oder einen nächsten Arbeitsraum öffnen.",
  trustText:
    "Nichts wird automatisch veröffentlicht. Du entscheidest, wann dein Beitrag weitergeht.",
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
  const heroEyebrow = isUnknownVisitor ? "Beitrag eingeben, Einordnung sehen, dann entscheiden." : experience.eyebrow;

  return (
    <section className="landing-canvas public-canvas public-start-canvas">
      <div className="landing-shell public-shell public-start-shell">
        <header className="landing-header public-header">
          <div className="landing-hero-grid public-hero-grid public-reader-grid public-start-hero-grid">
            <article className="landing-section landing-section--hero public-section public-dialog-area public-start-main">
              <div className="public-color-rail landing-hero-copy">
                <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                  {heroEyebrow}
                </p>

                {isUnknownVisitor ? (
                  <LandingCreateLightEntry trustText={experience.trustText} />
                ) : (
                  <h1 className="no-grad public-hero-title public-hero-title--start font-semibold tracking-tight">
                    {experience.title}
                  </h1>
                )}

                {!isUnknownVisitor ? (
                  <>
                    <p className="public-hero-lead max-w-3xl">{experience.description}</p>
                  <p className="max-w-3xl text-sm font-semibold text-[rgb(var(--fg))] sm:text-base">
                    {experience.helperText}
                  </p>
                  </>
                ) : null}
              </div>

              {!isUnknownVisitor ? (
                <div className="landing-hero-actions">
                  <div className="public-action-row landing-hero-action-row">
                    <a
                      href="/create?intent=contribute"
                      data-requires-privacy-gate="true"
                      className="landing-cta-primary public-cta-primary vog-btn-brand"
                    >
                      Beitrag einordnen
                    </a>
                    <a href="/themen" className="vog-btn-secondary landing-cta-secondary">
                      Beispiele ansehen
                    </a>
                    <a href="/pricing/institutionen" className="vog-btn-secondary landing-cta-secondary">
                      Für Verwaltung / Organisation ansehen
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {TRUST_PILLS_DE.map((pill) => (
                      <span key={pill} className="landing-soft-pill public-soft-pill">
                        {pill}
                      </span>
                    ))}
                  </div>

                  <p className="public-hero-trust max-w-3xl text-sm">{experience.trustText}</p>
                </div>
              ) : null}
            </article>

            <aside className="public-voxy-rail public-start-guide-rail" aria-label="VOXY Guide und Vorschau">
              <div className="public-start-guide-surface">
                <VoxyGuide
                  appearance="hero"
                  title="Schreib kurz, worum es geht — ich helfe beim Einordnen."
                  variant="confident"
                >
                  <>
                    <p>{getStartCreateVoxyCopy("start")}</p>
                    <div className="public-thread-tags mt-4">
                      {VOXY_MARKERS_DE.map((marker) => (
                        <span key={marker} className="public-voxy-marker">
                          {marker}
                        </span>
                      ))}
                    </div>
                  </>
                </VoxyGuide>

                {isUnknownVisitor ? (
                  <>
                    <div className="public-start-guide-card-grid">
                      {START_GUIDE_CARDS_DE.map((card) => (
                        <article key={card.title} className="public-start-guide-card">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                            {card.eyebrow}
                          </p>
                          <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{card.title}</h2>
                          <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/82">{card.text}</p>
                        </article>
                      ))}
                    </div>

                    <div className="public-start-support-links">
                      {START_SUPPORT_LINKS_DE.map((link) => (
                        <a key={link.href} href={link.href} className="landing-inline-link">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </aside>
          </div>
        </header>

        <div className="landing-hero-grid landing-hero-grid--lower">
          <section className="landing-section">
            {showExtendedOrientation ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">
                    Beispielthemen
                  </p>
                  <h2 className="no-grad public-section-title text-2xl font-semibold tracking-tight sm:text-3xl">
                    Themen, an die dein Beitrag <span className="public-gradient-text">anknüpfen</span> kann.
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    Viele Anliegen bleiben sonst einzelne Kommentare. eDebatte macht daraus erkennbare
                    Themen, offene Fragen und nachvollziehbare nächste Schritte.
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
                      Dein Beitrag kann mehr bewirken.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Erst wird dein Beitrag eingeordnet. Dann werden Fragen, Optionen und mögliche
                      nächste Schritte sichtbar.
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
                      Behauptung, Quelle und offene Frage klar trennen.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Du siehst, was behauptet wird, worauf es sich stützt, welche Einwände wichtig sind und was noch geklärt werden muss.
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
                    Direkt weiterarbeiten
                  </p>
                  <h2 className="no-grad public-section-title text-2xl font-semibold tracking-tight sm:text-3xl">
                    {experience.familiarity === "organization_verified" ||
                    experience.familiarity === "organization_pending" ||
                    experience.familiarity === "organization_blocked" ||
                    experience.familiarity === "operator"
                      ? "Bereite Beteiligung nachvollziehbar vor."
                      : "Mach mit deinem Anliegen weiter."}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    {experience.familiarity === "organization_verified" ||
                    experience.familiarity === "organization_pending" ||
                    experience.familiarity === "organization_blocked" ||
                    experience.familiarity === "operator"
                      ? "Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist."
                      : "Du kannst deinen Entwurf prüfen, ein Thema ansehen oder einen Anlassraum vorbereiten. Nichts wird automatisch veröffentlicht."}
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
              <h2 className="no-grad public-section-title text-2xl font-semibold tracking-tight sm:text-3xl">
                Beginne mit deinem <span className="public-gradient-text">Anliegen</span> – nicht mit einem Formular.
              </h2>
              <p className="max-w-3xl text-sm leading-7 sm:text-base">
                Du wählst den Weg, der gerade passt: Beitrag einordnen, Beispiel ansehen oder einen
                nächsten Arbeitsraum öffnen.
              </p>
            </div>

            <TaskFirstQuickActionCenter model={experience.quickActionCenter} tone="landing" />

            {showExtendedOrientation ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                    Ein Anlassraum hält ein gemeinsames Thema zusammen.
                  </h3>
                  <p className="max-w-3xl text-sm leading-7 sm:text-base">
                    Hinweise, Optionen, offene Fragen und nächste Schritte bleiben an einem Ort. So geht ein Thema nicht im Feed verloren.
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
                      Anlassraum starten
                    </a>
                  </div>
                </div>

                <div className="landing-flow-line">
                  <div className="space-y-3">
                    <p className="landing-eyebrow text-[11px] font-semibold uppercase tracking-[0.14em]">
                      Swipe
                    </p>
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                      Sichtweisen sammeln, später tiefer einsteigen.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Eine kurze Reaktion reicht als Start. Daraus können Fragen, Prüfpfade, Arbeitsräume
                      oder Dossiers entstehen.
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
                      Ein Dossier bündelt Belege, Fragen und Optionen.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Dossiers zeigen, was schon belastbar ist, welche Fragen offen sind und welche Optionen im Raum stehen.
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
                      Kostenlos mitmachen. Themen gemeinsam weiterentwickeln.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Jede Person kann Themen ansehen, reagieren und Anliegen einbringen. Neue Hauptthemen werden bewusst vorbereitet, damit sie nachvollziehbar bleiben.
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
                      Gemeinsam klären, ohne bei null anzufangen.
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 sm:text-base">
                      Kommunen, Vereine, Initiativen und Redaktionen nutzen dieselben sichtbaren
                      Wege für Themenräume, Dossiers und gemeinsame Klärung.
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
            <h2 className="no-grad public-section-title text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-3xl">
              Ein guter <span className="public-gradient-text">nächster Schritt</span> braucht einen verlässlichen Ort.
            </h2>
            <p className="max-w-4xl text-sm leading-7 sm:text-base">
              eDebatte ist nicht dafür gebaut, Aufmerksamkeit zu verkaufen. Quellen, Hinweise,
              Prüfungen und Weitergabe bleiben nachvollziehbar. Unterstützung und Finanzierung
              werden offengelegt, ohne Themen oder Ergebnisse zu verzerren.
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
              eDebatte ist der Ort, an dem aus Hinweisen, Fragen und offenen Themen ein
              nachvollziehbarer nächster Schritt werden kann. VoiceOpenGov ist die Initiative
              dahinter.
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
