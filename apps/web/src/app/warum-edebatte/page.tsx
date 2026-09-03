import type { Metadata } from "next";
import Link from "next/link";
import { buildPublicPageMetadata } from "@/lib/seo/publicDiscovery";

const TITLE = "Warum eDebatte? Bürgerbeteiligung vor dem Verfahren";
const DESCRIPTION =
  "eDebatte beginnt beim ungeklärten Anliegen: Problem klären, Quellen und Perspektiven verbinden, Handlungsoptionen verstehen und erst dann priorisieren.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    path: "/warum-edebatte",
    title: TITLE,
    description: DESCRIPTION,
    ogType: "website",
  }),
  title: { absolute: TITLE },
};

const journey = [
  {
    number: "01",
    title: "Anliegen",
    body: "Du musst noch keine fertige Forderung haben. Ein Problem, eine Beobachtung, eine offene Frage oder eine Quelle kann der Anfang sein.",
  },
  {
    number: "02",
    title: "Problem klären",
    body: "Worum geht es wirklich? Welche Ebene ist betroffen? Was wissen wir bereits – und was ist noch unklar?",
  },
  {
    number: "03",
    title: "Wissen verbinden",
    body: "Quellen, Perspektiven, Gegenargumente, Widersprüche und Unsicherheiten bleiben unterscheidbar und werden gemeinsam nachvollziehbar.",
  },
  {
    number: "04",
    title: "Optionen verstehen",
    body: "Welche Handlungswege gibt es? Welche Ziele, Folgen und Zielkonflikte gehören zu den unterschiedlichen Möglichkeiten?",
  },
  {
    number: "05",
    title: "Priorisieren",
    body: "Erst auf dieser Grundlage werden Positionen, Prioritäten, Bewertungen und mögliche Lösungen zur Beteiligung gestellt.",
  },
  {
    number: "06",
    title: "Anschluss schaffen",
    body: "Politik, Verwaltung, Initiativen, Wissenschaft, Medien und Organisationen können Wissen beitragen, Ergebnisse aufnehmen und Umsetzung ermöglichen.",
  },
];

const differences = [
  [
    "Nicht erst bei der fertigen Frage",
    "Viele Beteiligungsverfahren beginnen, wenn ein Projekt, eine Fragestellung oder ein Vorschlag bereits benannt ist. eDebatte soll schon beim ungeklärten Anliegen beginnen können.",
  ],
  [
    "Nicht Meinung ohne Grundlage",
    "Positionen stehen nicht isoliert. Quellen, Belege, Widersprüche und Unsicherheiten sollen nachvollziehbar mit dem Debattenstand verbunden bleiben.",
  ],
  [
    "Nicht nur Ja oder Nein",
    "Vor einer Abstimmung können Problemdefinition, mögliche Handlungsoptionen und Zielkonflikte sichtbar werden. Über Fakten oder Wahrheit wird nicht abgestimmt.",
  ],
  [
    "Nicht gegen Verwaltung",
    "Citizen-first bedeutet nicht citizen-only. Verwaltung und Institutionen bleiben wichtige Wissens-, Verfahrens- und Umsetzungspartner – sie müssen nur nicht den ersten Impuls besitzen.",
  ],
] as const;

export default function WhyEDebattePage() {
  return (
    <main id="main-content" className="min-h-[100svh] bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Beteiligung beginnt vor dem Verfahren.
          </p>
          <h1 className="mt-4 max-w-5xl text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Nicht erst mitreden, wenn die Frage schon feststeht.
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            eDebatte setzt beim Menschen und seinem Anliegen an – auch dann, wenn Problem, Forderung oder Lösung noch nicht fertig formuliert sind. Aus einem Signal kann Schritt für Schritt ein nachvollziehbarer Debattenstand mit Quellen, Perspektiven, offenen Fragen und möglichen Handlungswegen entstehen.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-black text-slate-950">
              Anliegen einbringen →
            </Link>
            <Link href="/vergleich/consul" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--border)] px-6 py-3 font-black">
              Mit Beteiligungsplattformen vergleichen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              Der eigentliche Unterschied
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-5xl">
              Vom Anliegen zur gemeinsamen Agenda.
            </h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-[color:var(--muted)]">
            <p>
              Die erste demokratische Frage ist nicht immer „Welche Option wählst du?“. Oft lautet sie vorher: „Was ist eigentlich das Problem, das wir gemeinsam lösen sollten?“
            </p>
            <p>
              Genau zwischen einem gesellschaftlichen Signal und einem formellen Beteiligungsverfahren liegt ein wichtiger Raum: Problemdefinition, Agenda-Setting, Quellen, Perspektiven, Widersprüche, Alternativen und Zielkonflikte. eDebatte macht diesen Raum zum Teil der Beteiligung.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journey.map((step) => (
            <article key={step.number} className="rounded-[1.5rem] border border-[color:var(--border)] p-6">
              <span className="text-xs font-black text-cyan-700 dark:text-cyan-300">{step.number}</span>
              <h3 className="mt-3 text-xl font-black">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[color:var(--border)] bg-[color:var(--surface)]/35">
        <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Citizen-first, nicht citizen-only
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.03em] sm:text-5xl">
            Verwaltung ist Partner. Aber nicht zwingend der Startknopf.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-7 text-[color:var(--muted)]">
            Kommunen, Behörden, Politik, Wissenschaft, Medien, Vereine und Organisationen können Fachwissen, Daten, Verfahren und Umsetzungskraft einbringen. eDebatte verändert nur die Reihenfolge: Ein gesellschaftliches Anliegen darf bereits sichtbar, strukturiert und gemeinsam weiterentwickelt werden, bevor eine Institution dafür ein eigenes Verfahren eröffnet.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          {differences.map(([title, body]) => (
            <article key={title} className="rounded-[1.5rem] border border-[color:var(--border)] p-6">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Kurz gesagt</p>
          <h2 className="mt-3 max-w-5xl text-balance text-3xl font-black tracking-[-0.03em] sm:text-5xl">
            Andere Systeme können Beteiligung hervorragend organisieren. eDebatte will zusätzlich den Schritt davor organisieren: gemeinsam herausfinden, worüber wir überhaupt entscheiden sollten.
          </h2>
        </div>
      </section>
    </main>
  );
}
