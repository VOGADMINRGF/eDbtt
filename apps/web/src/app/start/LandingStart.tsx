"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import TaskFirstQuickActionCenter from "@/components/quickActions/TaskFirstQuickActionCenter";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import type { StartExperienceModel } from "@/features/start/startExperience";

type LandingStartProps = {
  blocks: BucketBlock[];
  experience?: StartExperienceModel;
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

const SIGNALS_DE = [
  "Warum bekomme ich so schwer einen Termin?",
  "Wie bleibt Wohnen bezahlbar?",
  "Wie sichern wir Pflege langfristig?",
  "Wie werden Schulwege sicherer?",
  "Wie wird Verwaltung erreichbarer?",
] as const;

const FLOW_STEPS_DE = [
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

export default function LandingStart({ blocks: _blocks, experience = DEFAULT_START_EXPERIENCE }: LandingStartProps) {
  const quickActionCenter = useMemo(() => experience.quickActionCenter, [experience.quickActionCenter]);
  const quickActionsBeforeHero = experience.familiarity !== "unknown_visitor";

  return (
    <main className="landing-canvas">
      <div className="landing-shell">
        <header className="landing-header">
          <a href="/start" className="landing-logo" aria-label="eDebatte Startseite">
            eDebatte
          </a>
          <nav aria-label="Landing-Navigation" className="landing-nav">
            {NAV_LINKS_DE.map((item) => (
              <a key={item.href} href={item.href} className="landing-nav-link">
                {item.label}
              </a>
            ))}
          </nav>
          <a href="/login" className="landing-nav-link landing-login">
            Anmelden
          </a>
        </header>

        {quickActionsBeforeHero ? <TaskFirstQuickActionCenter model={quickActionCenter} tone="dark" /> : null}

        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">{experience.eyebrow}</p>
            <h1 id="landing-hero-title" className="landing-hero-title no-grad">
              Was Menschen <span className="landing-gradient-title">bewegt</span>, wird{" "}
              <span className="landing-gradient-title">sichtbar.</span>
            </h1>
            <p className="landing-lead">{experience.description}</p>
            <p className="landing-helper">{experience.helperText}</p>
            <p className="landing-trustline">{experience.trustText}</p>
            {experience.workspaceHref && experience.workspaceLabel ? (
              <p className="landing-inline-note">
                <a href={experience.workspaceHref}>{experience.workspaceLabel}</a> ist direkt erreichbar. Du siehst immer, was als nächstes passiert.
              </p>
            ) : null}
            <div className="landing-cta-row" aria-label="Direkte Einstiege">
              <a href="/create?intent=check" data-requires-privacy-gate="true" className="landing-cta landing-cta-primary">
                Thema prüfen
              </a>
              <a href="/create?intent=contribute" data-requires-privacy-gate="true" className="landing-cta landing-cta-secondary">
                Anliegen einbringen
              </a>
              <a href="/themen" className="landing-cta landing-cta-secondary">
                Thema ansehen
              </a>
            </div>
          </div>

          <aside className="landing-voxy-stage" aria-label="VOXY Orientierung">
            <div className="landing-voxy-orbit" aria-hidden="true">
              <div className="landing-voxy-face">
                <span className="landing-voxy-eye" />
                <span className="landing-voxy-eye" />
              </div>
              <div className="landing-voxy-body" />
            </div>
            <p className="landing-voxy-label">VOXY sortiert mit dir Anliegen, Quellen und nächste Schritte.</p>
            <div className="landing-voxy-notes" aria-label="Was VOXY unterstützt">
              <span>Meinung ≠ Behauptung</span>
              <span>Quelle sichtbar</span>
              <span>Review vor Veröffentlichung</span>
            </div>
          </aside>
        </section>

        <section className="landing-pill-row" aria-label="Vertrauenshinweise">
          {TRUST_PILLS_DE.map((pill) => (
            <span key={pill} className="landing-soft-pill">
              {pill}
            </span>
          ))}
        </section>

        {!quickActionsBeforeHero ? <TaskFirstQuickActionCenter model={quickActionCenter} tone="dark" /> : null}

        <section className="landing-section landing-section-intro">
          <p className="landing-eyebrow">Signale statt Lärm</p>
          <h2 className="landing-section-title no-grad">Hier zeigt sich, wo es gerade drückt.</h2>
          <p className="landing-copy">
            Viele Menschen erleben ähnliche Probleme — beim Wohnen, in der Pflege, in der Verwaltung, in der Schule,
            im Verkehr oder in der Nachbarschaft. eDebatte macht solche Anliegen sichtbar und hilft, sie
            weiterzuverfolgen.
          </p>
          <div className="landing-signal-stream" aria-label="Beispielhafte Alltagssignale">
            {SIGNALS_DE.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </section>

        {experience.showExtendedOrientation ? (
          <>
            <section className="landing-section">
              <p className="landing-eyebrow">Beteiligungsfluss</p>
              <h2 className="landing-section-title no-grad">Nicht noch ein Feed. Nicht nur Ja oder Nein.</h2>
              <p className="landing-copy">
                Viele Anliegen verschwinden nach kurzer Aufmerksamkeit wieder. Bei eDebatte bleibt die Sache im
                Mittelpunkt: Was ist passiert? Was ist belegt? Was ist offen? Welche Optionen gibt es? Wer kann handeln?
              </p>
              <ol className="landing-process-line" aria-label="Vom Anliegen zur Beteiligung">
                {FLOW_STEPS_DE.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ol>
              <p className="landing-accent-copy">
                Nicht der lauteste Kommentar gewinnt. Das Thema wird Schritt für Schritt verständlicher.
              </p>
            </section>

            <section className="landing-section landing-split-section">
              <div>
                <p className="landing-eyebrow">In 30 Sekunden einordnen</p>
                <h2 className="landing-section-title no-grad">Schnell einsteigen mit Swipe.</h2>
                <p className="landing-copy">
                  Nicht jede Beteiligung beginnt mit einem langen Text. Mit Swipe können Menschen schnell zeigen, wie sie
                  ein Thema einschätzen — zustimmen, ablehnen, offen bleiben oder markieren, was fehlt.
                </p>
                <p className="landing-copy">
                  Ein Swipe ist bei eDebatte kein Endpunkt. Er kann zeigen, wo Zustimmung, Zweifel, offene Fragen oder neue
                  Vorschläge entstehen.
                </p>
              </div>
              <div className="landing-inline-preview" aria-label="Swipe-Vorschau">
                <p className="landing-eyebrow">Swipe-Vorschau</p>
                <h3>Thema: Erreichbare Verwaltung</h3>
                <p>Kurze Frage: Wird ein digitaler Terminservice den Alltag spürbar entlasten?</p>
                <div className="landing-pill-row landing-pill-row-tight">
                  {SWIPE_OPTIONS_DE.map((option) => (
                    <span key={option} className="landing-soft-pill">
                      {option}
                    </span>
                  ))}
                </div>
                <a href="/swipes" data-requires-privacy-gate="true" className="landing-cta landing-cta-primary">
                  Themenlage ansehen
                </a>
                <a href="/runden?intent=create" className="landing-inline-link">
                  Anlassraum/Event starten
                </a>
              </div>
            </section>

            <section className="landing-section">
              <p className="landing-eyebrow">Arbeitsraum</p>
              <h2 className="landing-section-title no-grad">Der Anlassraum: ein Ort, an dem ein Thema nicht verloren geht.</h2>
              <p className="landing-copy">
                Ein einzelner Hinweis reicht oft nicht aus. Im Anlassraum werden Beiträge, Quellen, offene Fragen,
                Sichtweisen und mögliche Lösungen zu einem Thema gesammelt. So bleibt ein Anliegen über Zeit
                nachvollziehbar.
              </p>
              <div className="landing-thread-tags">
                {ANLASSRAUM_MODULES_DE.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <p className="landing-accent-copy">
                Ein Anlassraum ist der Arbeitsraum zwischen erstem Unmut und belastbarer Entscheidungsgrundlage.
              </p>
            </section>

            <section className="landing-section">
              <p className="landing-eyebrow">Prüfspur</p>
              <h2 className="landing-section-title no-grad">Faktencheck statt Behauptung gegen Behauptung.</h2>
              <p className="landing-copy">
                Wenn Aussagen im Raum stehen, braucht es mehr als schnelle Reaktionen. eDebatte hilft, Behauptungen zu
                prüfen, Quellen sichtbar zu machen und offene Punkte sauber zu benennen.
              </p>
              <ol className="landing-check-trace" aria-label="Faktencheck-Prüfspur">
                {FACTCHECK_QUESTIONS_DE.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
              <p className="landing-accent-copy">Das Ziel ist nicht künstliche Einigkeit. Das Ziel ist mehr Klarheit.</p>
              <a href="/create?intent=check" data-requires-privacy-gate="true" className="landing-cta landing-cta-primary">
                Aussage prüfen
              </a>
            </section>

            <section className="landing-section landing-dossier-flow">
              <p className="landing-eyebrow">Dossier</p>
              <h2 className="landing-section-title no-grad">Aus Hinweisen wird ein Dossier.</h2>
              <p className="landing-copy">
                Wenn ein Thema größer wird, entsteht daraus ein Dossier. Es zeigt nicht nur Meinungen, sondern den Stand
                der Klärung.
              </p>
              <p className="landing-accent-copy">Ein Dossier ist keine Schlagzeile. Es ist ein nachvollziehbarer Arbeitsstand.</p>
              <div className="landing-dossier-grid">
                <DossierPart title="Worum geht es?">
                  Der Bedarf an Pflegeleistungen steigt, während Fachkräfte knapp sind und Kosten wachsen. Gesucht sind
                  tragfähige Lösungswege für eine verlässliche, bezahlbare und menschliche Pflege.
                </DossierPart>
                <DossierPart title="Was ist belegt?" items={DOSSIER_FACTS_DE} />
                <DossierPart title="Was ist offen?" items={DOSSIER_OPEN_QUESTIONS_DE} />
                <DossierPart title="Welche Optionen gibt es?" items={DOSSIER_OPTIONS_DE} />
                <DossierPart title="Wer ist zuständig?" items={DOSSIER_RESPONSIBLE_DE} />
                <DossierPart title="Wie sehen andere es?">
                  Illustrative Vorschau · keine laufende Abstimmung: Zustimmung 46 %, offen 33 %, Ablehnung 21 %.
                </DossierPart>
              </div>
              <a href="/dossier/demo" className="landing-cta landing-cta-secondary">
                Dossier öffnen
              </a>
            </section>

            <section className="landing-section">
              <p className="landing-eyebrow">Blickwinkel</p>
              <h2 className="landing-section-title no-grad">Ein Thema. Verschiedene Blickpunkte.</h2>
              <p className="landing-copy">
                Ein Anliegen sieht je nach Perspektive anders aus. eDebatte macht diese Unterschiede sichtbar, ohne das
                Thema aus dem Blick zu verlieren.
              </p>
              <div className="landing-perspective-flow">
                {PERSPECTIVES_DE.map((perspective) => (
                  <article key={perspective.title}>
                    <h3>{perspective.title}</h3>
                    <p>{perspective.text}</p>
                  </article>
                ))}
              </div>
              <p className="landing-accent-copy">
                Verschiedene Blickpunkte helfen nur, wenn die Sache im Mittelpunkt bleibt.
              </p>
            </section>

            <section className="landing-section">
              <p className="landing-eyebrow">Mitmachen</p>
              <h2 className="landing-section-title no-grad">Kostenlos mitmachen. Verbindlich weiterentwickeln.</h2>
              <p className="landing-copy">
                Bei eDebatte kann jede Person kostenlos mitmachen: Themen ansehen, swipen, Anliegen einreichen, Hinweise
                geben und sich beteiligen.
              </p>
              <p className="landing-copy">
                Neue Hauptthemen starten aktive Mitglieder. So verbinden wir Offenheit mit Verantwortung: Jedes Anliegen
                kann eingebracht werden, aber nicht jeder kurze Impuls wird sofort ein neues Hauptthema.
              </p>
              <div className="landing-pill-row landing-pill-row-tight">
                {MEMBERSHIP_PILLS_DE.map((pill) => (
                  <span key={pill} className="landing-soft-pill">
                    {pill}
                  </span>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="landing-section">
            <p className="landing-eyebrow">Arbeitsmodus</p>
            <h2 className="landing-section-title no-grad">Schon dabei? Arbeite direkt weiter.</h2>
            <p className="landing-copy">
              Beitrag, Anlassraum, Themen und Organisationsbereich bleiben dieselben production-ready-v1 Pfade.
              Der Unterschied liegt nur in der Gewichtung: Arbeitsaktionen stehen vorne, Orientierung bleibt kurz.
            </p>
            <ul className="landing-check-trace">
              <li>Wir veröffentlichen nichts ungeprüft.</li>
              <li>Du siehst immer, was als nächstes passiert.</li>
              <li>Arbeitsbereich und Freischaltung bleiben klar getrennt.</li>
              <li>Keine versteckten AI-Kosten. Keine Datenverkäufe.</li>
            </ul>
          </section>
        )}

        <section className="landing-section landing-split-section">
          <div>
            <p className="landing-eyebrow">Für Institutionen</p>
            <h2 className="landing-section-title no-grad">Beteiligung organisieren, ohne bei null anzufangen.</h2>
            <p className="landing-copy">
              Kommunen, Bezirke, Medien, Vereine und Organisationen können eDebatte nutzen, um Themenräume, Dossiers und
              Beteiligungsrunden aufzusetzen — transparent, nachvollziehbar und anschlussfähig an bestehende Verfahren.
            </p>
            <p className="landing-copy">
              Produktive Organisationsrechte laufen review-first über verifizierte Organisationen, manuelle Zugangs- und
              Vertragsfreigabe sowie klare Scope- und Entitlement-Grenzen.
            </p>
          </div>
          <div className="landing-thread-tags">
            {PROFESSIONAL_USE_CASES_DE.map((useCase) => (
              <span key={useCase}>{useCase}</span>
            ))}
          </div>
          <div className="landing-cta-row">
            <a href="/account/organization" className="landing-cta landing-cta-primary">
              Organisation anmelden
            </a>
            <a href="/pricing/institutionen" className="landing-cta landing-cta-secondary">
              Für Institutionen
            </a>
          </div>
        </section>

        <section className="landing-section">
          <p className="landing-eyebrow">Abgrenzung</p>
          <h2 className="landing-section-title no-grad">Öffentliche Beteiligung braucht einen besseren Ort.</h2>
          <div className="landing-perspective-flow">
            {DIFFERENTIATION_CARDS_DE.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="landing-footer">
          <p>
            VoiceOpenGov ist die Initiative hinter eDebatte. Ziel ist eine offenere, nachvollziehbarere und besser
            überprüfbare Beteiligungskultur.
          </p>
          <div className="landing-cta-row">
            <a href="/create?intent=contribute" data-requires-privacy-gate="true" className="landing-cta landing-cta-primary">
              Eigenes Thema starten
            </a>
            <a href="/themen" className="landing-cta landing-cta-secondary">
              Beispiel ansehen
            </a>
            <a href="/swipes" className="landing-cta landing-cta-secondary">
              Swipes ansehen
            </a>
            <a href="/pricing" className="landing-cta landing-cta-secondary">
              Pakete &amp; Preise ansehen
            </a>
            <a href="/initiative" className="landing-inline-link">
              Mehr zur Initiative
            </a>
            <a href="/so-funktionierts" className="landing-inline-link">
              So funktioniert’s
            </a>
            <a href="/initiative" className="landing-inline-link">
              Zur Initiative
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function DossierPart({
  title,
  children,
  items,
}: {
  title: string;
  children?: ReactNode;
  items?: readonly string[];
}) {
  return (
    <section>
      <h3>{title}</h3>
      {items ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{children}</p>
      )}
    </section>
  );
}
