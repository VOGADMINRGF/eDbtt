import Link from "next/link";
import { notFound } from "next/navigation";
import demoDossier from "@features/dossier/data/demoDossier";
import { getPresentation } from "@/components/dossier/presentation";
import { buildCanonicalDossierHref } from "@/components/dossier/runtimeTruth";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function StreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { streams, traceability } = getPresentation(demoDossier);
  const stream = streams.find((entry) => entry.id === id);
  if (!stream) return notFound();
  const dossierHref = buildCanonicalDossierHref(demoDossier.meta.id) ?? "/dossier";

  const statementTitleById = new Map(
    demoDossier.analyze.claims.map((claim) => [claim.id, claim.title ?? claim.id]),
  );
  const statementIds = traceability.streamsToStatements?.[stream.id] ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(248,250,252)_0%,rgb(241,245,249)_45%,rgb(226,232,240)_100%)] dark:bg-[radial-gradient(circle_at_top,rgb(15,23,42)_0%,rgb(2,6,23)_45%,rgb(2,6,23)_100%)]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href={dossierHref} className="text-xs text-[rgb(var(--muted))] underline">
          Zurück zum Dossier
        </Link>
        <div className="mt-6 space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Themenstrom (Demo)</p>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{stream.title}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Datum: {formatDate(stream.date)}</p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Verknüpfte Statements
            </p>
            {statementIds.length ? (
              <ul className="space-y-1 text-sm">
                {statementIds.map((statementId) => (
                  <li key={statementId}>
                    <Link
                      href={
                        buildCanonicalDossierHref(demoDossier.meta.id, {
                          anchor: `stmt-${statementId}`,
                        }) ?? dossierHref
                      }
                      className="text-[rgb(var(--fg))] underline"
                    >
                      {statementTitleById.get(statementId) ?? statementId}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Statements zugeordnet.</p>
            )}
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">
            Dieser Eintrag ist Teil der Demonstration. Inhalte werden im Dossier strukturiert zusammengeführt.
          </p>
        </div>
      </div>
    </main>
  );
}
