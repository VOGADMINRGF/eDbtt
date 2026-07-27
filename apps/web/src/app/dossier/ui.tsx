import Link from "next/link";
import type { PublicDossierRuntimeItem } from "@/features/dossier/publicRuntime";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DossierIndex({
  items = [],
  loadFailed = false,
}: {
  items?: PublicDossierRuntimeItem[];
  loadFailed?: boolean;
  handoffId?: string | null;
  createAction?: string | null;
  seedTopic?: string | null;
}) {
  return (
    <div className="public-shell mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Dossiers
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-[rgb(var(--fg))] sm:text-5xl">
          Debattenstände verstehen und weiterprüfen
        </h1>
        <p className="mt-4 text-base leading-7 text-[rgb(var(--muted))]">
          Dossiers bündeln Kernaussagen, Positionen, Quellen und offene Fragen. Sie zeigen den
          aktuellen veröffentlichten Arbeitsstand, nicht automatisch eine amtliche oder endgültige
          Wahrheit.
        </p>
      </header>

      {loadFailed ? (
        <section className="mt-8 rounded-3xl border border-rose-300/60 bg-rose-500/10 p-5">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
            Dossiers konnten nicht geladen werden
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Die veröffentlichten Laufzeitdaten sind derzeit nicht erreichbar. Es werden keine
            Beispieldossiers als Ersatz angezeigt.
          </p>
        </section>
      ) : items.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
            Noch keine veröffentlichten Dossiers
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Sobald ein geprüfter Dossierstand ausdrücklich veröffentlicht wurde, erscheint er hier.
            Entwürfe und Demo-Daten werden in dieser Übersicht nicht eingeblendet.
          </p>
        </section>
      ) : (
        <section className="mt-8" aria-labelledby="published-dossiers-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="published-dossiers-heading" className="text-xl font-semibold text-[rgb(var(--fg))]">
                Veröffentlichte Dossiers
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                {items.length} {items.length === 1 ? "Dossier" : "Dossiers"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex h-full flex-col rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_18px_42px_rgba(2,6,23,0.05)]"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 font-semibold text-[rgb(var(--fg))]">
                    {item.statusLabel}
                  </span>
                  <span className="text-[rgb(var(--muted))]">Stand: {formatDate(item.updatedAt)}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-7 text-[rgb(var(--fg))]">
                  {item.title}
                </h3>
                {item.coreQuestion ? (
                  <p className="mt-2 text-sm font-semibold leading-6 text-[rgb(var(--fg))]">
                    {item.coreQuestion}
                  </p>
                ) : null}
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-[rgb(var(--muted))]">
                  {item.summary}
                </p>
                <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
                  Quellenstatus: {item.sourceStatusLabel}
                </p>
                <div className="mt-auto pt-5">
                  <Link
                    href={`/dossier/${encodeURIComponent(item.slug)}`}
                    className="btn-primary inline-flex min-h-11 items-center px-4 py-2 text-sm"
                  >
                    Debattenstand öffnen
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
