import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz-Dossier",
  description: "Verständliche Erklärung, wie eDebatte mit Eingaben, KI, Dossiers und Beteiligung umgeht.",
};

const SECTIONS = [
  {
    title: "Welche Daten entstehen bei eDebatte?",
    body:
      "Je nach Schritt entstehen dein eingegebener Text, technische Sitzungsdaten, freiwillige Dateien oder Links sowie Arbeitsstände, die du selbst speicherst oder weiterführen lässt. Nicht jede Eingabe wird automatisch öffentlich.",
  },
  {
    title: "Was passiert mit einer Eingabe?",
    body:
      "Eine Eingabe kann in Themen, offene Fragen, Argumente, mögliche Claims oder nächste Schritte strukturiert werden. Das dient dazu, aus einem Hinweis einen nachvollziehbaren Arbeitsstand zu machen.",
  },
  {
    title: "Wann wird KI eingesetzt?",
    body:
      "KI wird dort eingesetzt, wo Strukturierung, Zusammenfassung, Quellenhinweise oder fachliche Vorentscheidungen helfen. Das ist Teil des Dienstes, nicht Werbung. KI bedeutet bei eDebatte nicht automatisch Veröffentlichung und nicht automatisch Fakten-Siegel.",
  },
  {
    title: "Welche Daten sind nicht öffentlich?",
    body:
      "Interne Arbeitsstände, Review-Hinweise, nicht bestätigte Handoffs, Rohmaterialien oder sensible Hinweise werden nicht automatisch öffentlich angezeigt. Öffentliche Sichtbarkeit entsteht nur über die jeweils vorgesehenen und bestätigten Wege.",
  },
  {
    title: "Was wird gespeichert?",
    body:
      "Gespeichert werden nur die Daten, die für den gewünschten Dienst, die Nachvollziehbarkeit des Arbeitsstands, Missbrauchsschutz oder deine ausdrücklichen Folgeaktionen erforderlich sind. Optionale Statistik bleibt separat und freiwillig.",
  },
  {
    title: "Wie laufen Dossier, Faktencheck, Beteiligung und Hinweise?",
    body:
      "Ein Dossier bündelt einen Arbeitsstand, ein Faktencheck prüft geeignete Behauptungen, Beteiligung sammelt Reaktionen und Hinweise können in einen reviewbaren Kontext überführt werden. Nichts davon soll still im Hintergrund passieren.",
  },
  {
    title: "Welche Rechte haben Nutzer?",
    body:
      "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und – wo einschlägig – Widerruf freiwilliger Einwilligungen ausüben. Einstellungen können später erneut geändert werden.",
  },
  {
    title: "Warum ist eDebatte keine Werbe- oder Tracking-Plattform?",
    body:
      "eDebatte finanziert Beteiligung nicht über Datenverkauf. Optionale Statistik ist datensparsam, standardmäßig aus und von der notwendigen Dienstverarbeitung getrennt.",
  },
] as const;

export default function PrivacyDossierPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-[0_24px_64px_rgba(2,6,23,0.10)] sm:p-8">
        <div className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 dark:text-cyan-100">
          Datenschutz-Dossier
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
          Wie eDebatte mit Eingaben, KI und Beteiligung umgeht
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
          Dieses Dossier erklärt in einfacher Sprache, welche Daten bei eDebatte entstehen, wann KI eingesetzt wird,
          was öffentlich wird und was nicht. Es ist kein Werbebanner, sondern Teil der Debatten-Infrastruktur.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link href="/datenschutz" className="btn btn-ghost">
            Zur ausführlichen Datenschutzerklärung
          </Link>
          <Link href="/create" className="btn btn-primary">
            Zu /create
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Anonym, mit Nickname oder mit Namen?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
          Je nach Oberfläche und Funktion kann ein Arbeitsstand anonym, unter einem Nickname oder im Rahmen einer
          benannten Verantwortlichkeit geführt werden. Maßgeblich ist immer der jeweilige Kontext, nicht ein stilles
          Tracking-Profil.
        </p>
      </section>
    </main>
  );
}
