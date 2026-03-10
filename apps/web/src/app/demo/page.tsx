import Link from "next/link";
import { DEMO_BADGE, DEMO_CARD, DEMO_MUTED, DEMO_SUBTLE } from "@/lib/ui/demoUi";

const DEMO_SECTIONS = [
  {
    href: "/demo/dossier",
    title: "Dossier Studio",
    lead: "Reports & evidenzbasierte Dossiers mit konsistenter Demo-Lage.",
    tags: ["Claims", "Quellen", "Findings"],
  },
  {
    href: "/demo/votes",
    title: "Votes Preview",
    lead: "Abstimmungs-Flow mit Entscheidungsbaum & Eventualitäten.",
    tags: ["Optionen", "Mehrheit", "Pfadlogik"],
  },
  {
    href: "/demo/mandat",
    title: "Mandat & Umsetzung",
    lead: "Read-only Board mit Timeline, Zuständigkeiten & Wirkung.",
    tags: ["Timeline", "Verantwortung", "Impact"],
  },
  {
    href: "/demo/factcheck",
    title: "Factcheck Demo",
    lead: "Schneller Faktenscreen mit reproduzierbaren Ergebnissen.",
    tags: ["Claims", "Konsens", "Confidence"],
  },
];

export default function DemoStudioPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${DEMO_SUBTLE}`}>
          Demo Studio
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Screenshot-Ansichten mit stabilen Demo-Daten
        </h1>
        <p className={`max-w-3xl text-sm ${DEMO_MUTED}`}>
          Jede Ansicht ist reproduzierbar, ohne Live-Daten oder Zufall. Ideal für
          Website-Screenshots, Pitches und Demos.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {DEMO_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`${DEMO_CARD} group p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {section.title}
              </h2>
              <span className={`text-xs font-semibold ${DEMO_SUBTLE}`}>
                Öffnen {"->"}
              </span>
            </div>
            <p className={`mt-2 text-sm ${DEMO_MUTED}`}>{section.lead}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className={DEMO_BADGE}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
