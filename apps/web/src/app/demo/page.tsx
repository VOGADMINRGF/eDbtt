import Link from "next/link";
import {
  DEMO_PERSONAS,
  getDemoPersonaConfig,
  parseDemoPersona,
  withPersona,
  type DemoPersona,
} from "@/features/demo/personas";
import { DEMO_STATUS_GLOSSARY } from "@/features/demo/statusLanguage";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

const MODULES = [
  {
    id: "dossier",
    href: "/demo/dossier",
    title: "Dossier Studio",
    baseLead: "Claims, Evidenz, offene Fragen und Argumentationsraeume im Zusammenhang.",
    tags: ["Claims", "Quellen", "Findings", "Transparenz"],
  },
  {
    id: "votes",
    href: "/demo/votes",
    title: "Votes Preview",
    baseLead: "Abstimmungsstand mit Optionen, Status und journalistischen Signals.",
    tags: ["Optionen", "Mehrheit", "Kontroverse", "Review"],
  },
  {
    id: "mandat",
    href: "/demo/mandat",
    title: "Mandat & Umsetzung",
    baseLead: "Zustaendigkeiten, Fortschritt, Wirkung und Risiken im Umsetzungsbild.",
    tags: ["Timeline", "Delegation", "Wirkung", "Risiken"],
  },
  {
    id: "factcheck",
    href: "/demo/factcheck",
    title: "Factcheck Demo",
    baseLead: "Intake + Pruefverlauf fuer Text, Link, Datei und Video-URL (Demo).",
    tags: ["Intake", "Review", "Verdikt", "Status"],
  },
] as const;

const PERSONA_LEAD_BY_MODULE: Record<
  DemoPersona,
  Partial<Record<(typeof MODULES)[number]["id"], string>>
> = {
  journalist: {
    dossier: "Schnellzugriff auf Quellenlage, Einsprueche und exportfaehige Einordnung.",
    votes: "Newsworthy-Ansicht: offen/in Pruefung, strittige Themen und Update-Fokus.",
    mandat: "Monitoring von Stockungen, Risiken und Wirkung pro Verantwortungsbereich.",
    factcheck: "Quellen- und Verdikt-Fokus mit klarer Demo-Kennzeichnung.",
  },
  administration: {
    dossier: "Arbeitsfokus: Zustaendigkeiten, Delegation, Workflow und Dokumentationsstand.",
    votes: "Entscheidungsvorbereitung mit Status und priorisierter Umsetzungsrelevanz.",
    mandat: "Steuerungsfokus: Verantwortung, Umsetzungsgrad, Risiken und Wirkung.",
    factcheck: "Eingangspruefung fuer Hinweise aus Text/Link/Datei/Video mit Audit-Spur.",
  },
  citizen: {
    dossier: "Verstehen, einordnen, mitwirken: transparente Fragen- und Evidenzlage.",
    votes: "Klare Optionen mit sichtbarem Status, damit Beteiligung nachvollziehbar bleibt.",
    mandat: "Was wurde beschlossen und was passiert vor Ort als naechstes?",
    factcheck: "Niedrigschwelliger Einstieg fuer Pruefhinweise aus mehreren Input-Kanaelen.",
  },
};

function readPersona(raw?: string | string[]) {
  if (Array.isArray(raw)) return parseDemoPersona(raw[0]);
  return parseDemoPersona(raw);
}

export default async function DemoStudioPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = readPersona(resolved?.persona);
  const personaCfg = getDemoPersonaConfig(persona);

  const orderedModules = [...MODULES].sort((a, b) => {
    if (a.id === personaCfg.defaultModule) return -1;
    if (b.id === personaCfg.defaultModule) return 1;
    return 0;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          Demo Studio
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
          Gefuehrte Demo-Experience nach Persona
        </h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Startpunkt fuer Dossier, Votes, Mandat und Factcheck. Die Prioritaeten werden je Persona
          unterschiedlich gewichtet, damit Demo-Flows fuer Pitch und Review konsistent bleiben.
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Was willst du sehen?</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            Persona steuert Einstiegstexte, Prioritaeten und Default-Reihenfolge.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {DEMO_PERSONAS.map((item) => {
            const active = item.id === persona;
            return (
              <Link
                key={item.id}
                href={`/demo?persona=${item.id}`}
                className={`rounded-2xl border p-4 transition ${
                  active
                    ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--bg))]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
                }`}
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{item.lead}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  {item.priorities.map((priority) => (
                    <span key={priority} className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5">
                      {priority}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {orderedModules.map((module) => (
          <Link
            key={module.href}
            href={withPersona(module.href, persona)}
            className="group rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{module.title}</h2>
              <span className="text-xs font-semibold text-[rgb(var(--muted))]">Oeffnen {"->"}</span>
            </div>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              {PERSONA_LEAD_BY_MODULE[persona][module.id] ?? module.baseLead}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {module.tags.map((tag) => (
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Statussprache (systemweit)</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {DEMO_STATUS_GLOSSARY.map((status) => (
            <div key={status.key} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
              <p className="text-xs font-semibold text-[rgb(var(--fg))]">{status.label}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">{status.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
