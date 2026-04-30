import Link from "next/link";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import { participationPackages, procurementFollowupTasks } from "@features/procurement/participationPackages";

const partnerPackages = participationPackages.filter((pkg) =>
  ["dossier", "runde", "mandat", "studio", "onlinebeteiligung"].includes(pkg.id),
);

export default function ParticipationPartnerPage() {
  return (
    <ProductSurfaceShell>
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.12),transparent_42%)]" />
        <div className="relative max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Partner fuer Beteiligungsbueros
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
            Sie moderieren. eDebatte liefert die digitale Infrastruktur.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-[rgb(var(--muted))]">
            Beteiligungsbueros, Planungsbueros und Kommunikationsagenturen koennen eDebatte als
            Dossier-, Onlinebeteiligungs-, Auswertungs- und Mandatsbaustein in eigene Verfahren und
            Angebote einbinden, ohne ihre Rolle als Prozessgestalter zu verlieren.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/leistungen/buergerbeteiligung" className="btn-primary">
              Leistungslogik ansehen
            </Link>
            <Link href="/pricing/institutionen?segment=organisationen" className="btn-secondary">
              Institutionelle Konditionen
            </Link>
            <Link href="/demo/dossier" className="btn-secondary">
              Demo ansehen
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Keine Konkurrenz zur Moderation", "eDebatte ersetzt nicht das Beteiligungsbuero, sondern strukturiert Dossier, Online-Runde, Auswertung und Ergebnisarchiv."],
          ["Gemeinsame Angebote", "Partner koennen eDebatte als technischen Baustein fuer Onlinebeteiligung, Bericht und Gremienexport anbieten."],
          ["Vergabefaehige Sprache", "Leistungsbausteine sind so formuliert, dass sie in Ausschreibungen, Rahmenvertraegen und Miniwettbewerben anschlussfaehig sind."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Partner-Bausteine
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
          Was eDebatte im Partnerverfahren uebernimmt
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partnerPackages.map((pkg) => (
            <article key={pkg.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{pkg.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{pkg.subtitle}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Outputs</p>
              <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                {pkg.outputs.slice(0, 3).map((output) => (
                  <li key={`${pkg.id}-${output}`}>{output}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Rollenmodell</p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">Klar getrennte Verantwortung</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            <li>Partner gestaltet Prozess, Moderation, Stakeholder-Arbeit und Vor-Ort-Formate.</li>
            <li>eDebatte liefert Dossier, digitale Runde, Auswertung, Mandatslogik und Ergebnisarchiv.</li>
            <li>Kommunale Auftraggeber erhalten transparente Dokumentation statt nur Protokoll und PDF.</li>
            <li>Veroeffentlichung, Planung und Live-Schaltung bleiben explizite Freigabeentscheidungen.</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Naechste Slices</p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">Noch offen, jetzt aber SSOT-faehig</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {procurementFollowupTasks.map((task) => (
              <li key={task.id}>
                <span className="font-semibold text-[rgb(var(--fg))]">{task.id}:</span> {task.title}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </ProductSurfaceShell>
  );
}
