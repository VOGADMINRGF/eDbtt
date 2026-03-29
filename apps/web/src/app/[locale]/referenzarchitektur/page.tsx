import Link from "next/link";
import { REFERENZARCHITEKTUR_V2_0 } from "@/content/referenzarchitektur/referenzarchitektur_v2_0";

export default async function ReferenzarchitekturPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const content = REFERENZARCHITEKTUR_V2_0;

  const highlightCards = [
    {
      title: "Vom Beitrag zur belastbaren Struktur",
      body: "Freitext, Zitate, Hinweise und Quellen bleiben nicht im Kommentarstrom stehen, sondern werden in nachvollziehbare Bausteine überführt. So entsteht aus unstrukturierter Beteiligung ein prüfbarer Arbeitsstand.",
    },
    {
      title: "Verdichtung statt Verkürzung",
      body: "Anlassräume werden nicht einfach zusammengefasst, sondern zu Dossiers mit Behauptungen, Quellen, Prüffragen, Optionen, Auswirkungen und offenen Punkten verdichtet. Das Ziel ist Nachvollziehbarkeit, nicht bloße Reduktion.",
    },
    {
      title: "Verantwortung dokumentieren",
      body: "Zwischen Hinweis, Prüfung, Bearbeitung und Entscheidung dürfen keine stillen Sprünge entstehen. Herkunft, Zuständigkeit, Bearbeitungsstand und Begründung müssen sichtbar bleiben.",
    },
  ];

  const principleCards = [
    {
      title: "Öffentliche Einordnung",
      body: "Die Referenzarchitektur beschreibt nicht nur Software, sondern einen nachvollziehbaren Ordnungsrahmen für digitale Beteiligung, Prüfung und dokumentierte Mehrheitsbildung.",
    },
    {
      title: "Keine automatische Wahrheit",
      body: "Weder KI noch Plattform erzeugen Legitimation von selbst. Aussagen, Prüfpfade, Alternativen und Entscheidungen müssen offen nachvollziehbar bleiben.",
    },
    {
      title: "Arbeitsraum vor Veröffentlichung",
      body: "Anlassräume sind bewusst als Arbeitsräume gedacht. Erst aus ihnen entstehen verdichtete Dossiers, veröffentlichbare Stände oder dokumentierte Entscheidungsvorlagen.",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
              {content.eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-400 sm:text-4xl lg:text-5xl">
              {content.title}
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-cyan-700 dark:text-cyan-200">
              {content.subtitle}
            </p>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[rgb(var(--muted))] sm:text-[1.05rem]">
              Öffentliche Entscheidungsprozesse scheitern heute oft nicht an fehlender
              Beteiligung, sondern am fehlenden Übergang von Beiträgen zu
              nachvollziehbarer Struktur. Die digitale Entscheidungsarchitektur
              beschreibt, wie aus Hinweisen, Quellen, Prüffragen und Optionen
              belastbare Entscheidungsgrundlagen werden können.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Im Mittelpunkt steht nicht nur Beteiligung als Eingabe, sondern der
              nachvollziehbare Weg von der Erfassung über Prüfung und Verdichtung bis
              hin zu Optionen, Verantwortung und Entscheidung. Diese Seite versteht sich
              als öffentliche Einordnung des Strukturmodells und seiner Rolle im
              größeren Zusammenhang von VoiceOpenGov und eDebatte.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {content.badge}
              </span>
              <span className="text-xs text-[rgb(var(--muted))]">
                {content.version} · {content.docDate}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/howtoworks/bewegung" className="btn-secondary text-sm">
                Zur Bewegung
              </Link>
              <a
                href="#prozess-vom-beitrag-zum-mandat"
                className="btn-secondary text-sm"
              >
                Vom Beitrag zur Entscheidung
              </a>
              <a href="#wer-dahintersteht" className="btn-secondary text-sm">
                Hintergrund
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 lg:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
              Worum es hier geht
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <p className="text-sm font-semibold text-cyan-300">
                  Mehr als ein Beteiligungstool
                </p>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                  Die Architektur beschreibt keinen bloßen Kommentar- oder
                  Abstimmungsraum, sondern einen belastbaren Ablauf für Erfassung,
                  Prüfung, Verdichtung, Einordnung und dokumentierte Verantwortung.
                </p>
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <p className="text-sm font-semibold text-cyan-300">
                  Anlassraum ist nicht gleich Dossier
                </p>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                  Anlassräume sind offene Arbeits- und Prüfkontexte. Dossiers sind die
                  verdichtete, strukturierte und nachvollziehbare Form, die aus ihnen
                  hervorgehen kann.
                </p>
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <p className="text-sm font-semibold text-cyan-300">
                  Keine unsichtbaren Sprünge
                </p>
                <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                  Weder Wahrheit noch Veröffentlichung noch Legitimation dürfen still
                  angenommen werden. Jeder relevante Übergang muss prüfbar,
                  begründbar und dokumentiert sein.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {highlightCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-cyan-300">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {card.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {principleCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-cyan-300">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {card.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-cyan-300">
              Inhalt / Navigationspunkte
            </h2>
            <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
              Die folgenden Abschnitte führen durch Problemraum, Strukturprinzipien,
              Governance, Pilotlogik und Vertiefung.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {content.toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] transition hover:border-cyan-300 hover:text-cyan-300"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-6">
        {content.toc.map((item) => {
          const section = content.sections[item.id as keyof typeof content.sections];
          if (!section) return null;

          return (
            <section
              key={item.id}
              id={item.id}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm lg:p-7"
            >
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold text-cyan-300 sm:text-2xl">
                  {section.title}
                </h2>

                <div className="mt-4 space-y-4 text-sm leading-7 text-[rgb(var(--muted))] sm:text-[0.98rem]">
                  {section.body.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                {item.id === "wer-dahintersteht" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/howtoworks/bewegung"
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-cyan-300 hover:text-cyan-300"
                    >
                      Zur Bewegung
                    </Link>
                    <a
                      href="#vertiefung"
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-cyan-300 hover:text-cyan-300"
                    >
                      Zur Vertiefung
                    </a>
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-cyan-300">Kurz-FAQ</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Häufige Einordnungsfragen zur Rolle der Referenzarchitektur, zur
            Abgrenzung von Arbeitsraum und Dossier sowie zum Anspruch dokumentierter
            Nachvollziehbarkeit.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {content.faqShort.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
            >
              <p className="text-sm font-semibold text-cyan-300">{item.q}</p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="vertiefung"
        className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm"
      >
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-cyan-300">
            Weiterdenken / Weitergehen
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Diese Seite beschreibt den strukturellen Rahmen. Wer den größeren
            Zusammenhang, die Bewegung und die praktischen Ableitungen verstehen
            möchte, findet die nächsten Schritte im inhaltlichen Gesamtzusammenhang
            von VoiceOpenGov.
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Die Referenzarchitektur beschreibt die strukturelle Logik. Die Bewegung
            dahinter beschreibt das größere gesellschaftliche Ziel: nachvollziehbare,
            überprüfbare und zugängliche Entscheidungsprozesse für das digitale
            Zeitalter.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/howtoworks/bewegung"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-cyan-300 hover:text-cyan-300"
          >
            Zur Bewegung
          </Link>
          <a
            href="#prozess-vom-beitrag-zum-mandat"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-cyan-300 hover:text-cyan-300"
          >
            Vom Beitrag zur Entscheidung
          </a>
          <Link
            href="/kontakt"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-cyan-300 hover:text-cyan-300"
          >
            Kontakt
          </Link>
        </div>
      </section>

      <section
        id="feedback"
        className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm"
      >
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-cyan-300">
            Feedback / Kontakt
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Hinweise, Korrekturen, Anmerkungen und Ergänzungen sind willkommen.
            Besonders hilfreich sind Rückmeldungen mit Bezug auf konkrete
            Abschnitts-IDs, Begriffe oder Formulierungen, damit Einordnung und
            Weiterentwicklung sauber dokumentiert werden können.
          </p>
        </div>

        <div className="mt-5">
          <Link
            href="/kontakt"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </section>
    </main>
  );
}
