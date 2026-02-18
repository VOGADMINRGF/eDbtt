import Link from "next/link";

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
    lead: "Abstimmungs-Flow mit Entscheidungsbaum & Eventualitaeten.",
    tags: ["Optionen", "Mehrheit", "Pfadlogik"],
  },
  {
    href: "/demo/mandat",
    title: "Mandat & Umsetzung",
    lead: "Read-only Board mit Timeline, Zustaendigkeiten & Wirkung.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          Demo Studio
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
          Screenshot-Ansichten mit stabilen Demo-Daten
        </h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Jede Ansicht ist reproduzierbar, ohne Live-Daten oder Zufall. Ideal fuer
          Website-Screenshots, Pitches und Demos.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {DEMO_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--border))] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {section.title}
              </h2>
              <span className="text-xs font-semibold text-[rgb(var(--muted))]">
                Oeffnen {"->"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">{section.lead}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]"
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
