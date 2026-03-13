import { notFound } from "next/navigation";
import Link from "next/link";
import {
  dossierClaimsCol,
  dossierFindingsCol,
  dossierSourcesCol,
  openQuestionsCol,
} from "@features/dossier/db";
import { findDossierByAnyId } from "@features/dossier/lookup";
import { selectEffectiveFindings } from "@features/dossier/effective";
import {
  buildNewsroomCompanionPath,
  buildOpenDossierPath,
} from "@features/newsroom";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ dossierId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusStyles: Record<string, string> = {
  supported: "border-emerald-200 bg-emerald-50 text-emerald-800",
  refuted: "border-rose-200 bg-rose-50 text-rose-800",
  mixed: "border-sky-200 bg-sky-50 text-sky-800",
  unclear: "border-amber-200 bg-amber-50 text-amber-800",
  open: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
  in_review: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
  answered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
};

function read(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DossierEmbedPage({ params, searchParams }: PageProps) {
  const { dossierId } = await params;
  const resolved = searchParams ? await searchParams : {};
  const dossier = await findDossierByAnyId(dossierId);
  if (!dossier) return notFound();

  const anchorId = read(resolved.anchor);
  const medium = read(resolved.medium);
  const format = read(resolved.format);
  const publishedAt = read(resolved.publishedAt);

  const dossierKey = dossier.dossierId;
  const openDossierPath = buildOpenDossierPath({ dossierId: dossierKey, anchorId });
  const companionPath = buildNewsroomCompanionPath({
    dossierId: dossierKey,
    anchorId,
    medium,
    format,
    publishedAt,
  });
  const [claims, sources, findings, openQuestions] = await Promise.all([
    (await dossierClaimsCol()).find({ dossierId: dossierKey }).sort({ createdAt: 1 }).toArray(),
    (await dossierSourcesCol()).find({ dossierId: dossierKey }).sort({ publishedAt: -1, createdAt: -1 }).toArray(),
    (await dossierFindingsCol()).find({ dossierId: dossierKey }).sort({ updatedAt: -1 }).toArray(),
    (await openQuestionsCol()).find({ dossierId: dossierKey }).sort({ status: 1, createdAt: 1 }).toArray(),
  ]);

  const effectiveFindings = selectEffectiveFindings(findings);

  return (
    <main className="min-h-screen bg-[rgb(var(--card))] px-4 py-6 text-[rgb(var(--fg))]">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Dossier Embed</p>
        <h1 className="text-xl font-semibold">{dossier.title ?? "Dossier"}</h1>
        <p className="text-xs text-[rgb(var(--muted))]">
          ID: <span className="font-mono">{dossier.dossierId}</span>
        </p>
      </header>
      <section className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold uppercase tracking-wide">Open Companion Flow</p>
        <p className="mt-1">
          Dieser Embed ist ein offener Begleitraum. Journalistische Einstiege bleiben Anlassgeber,
          nicht Endwahrheit.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={openDossierPath} className="btn-secondary text-xs">
            Offenen Dossierraum öffnen
          </Link>
          <Link href={companionPath} className="btn-secondary text-xs">
            Newsroom Companion
          </Link>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Claims</h2>
        {claims.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine Claims erfasst.</p>
        ) : (
          <div className="space-y-2">
            {claims.map((claim) => (
              <div key={claim.claimId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <span className={`rounded-full border px-2 py-0.5 ${statusStyles[claim.status] ?? statusStyles.open}`}>
                    {claim.status}
                  </span>
                  <span>{claim.kind}</span>
                </div>
                <p className="mt-1 text-[rgb(var(--fg))]">{claim.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Findings</h2>
        {effectiveFindings.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine Findings vorhanden.</p>
        ) : (
          <div className="space-y-2">
            {effectiveFindings.map((finding) => (
              <div key={finding.findingId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <span className={`rounded-full border px-2 py-0.5 ${statusStyles[finding.verdict] ?? statusStyles.open}`}>
                    {finding.verdict}
                  </span>
                  <span>{finding.claimId}</span>
                </div>
                {finding.rationale?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[rgb(var(--muted))]">
                    {finding.rationale.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine Quellen dokumentiert.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {sources.map((source) => (
              <div key={source.sourceId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2">
                <div className="text-xs text-[rgb(var(--muted))]">{source.type}</div>
                <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {source.title}
                </a>
                {source.publisher ? <div className="text-xs text-[rgb(var(--muted))]">{source.publisher}</div> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</h2>
        {openQuestions.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine offenen Fragen erfasst.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {openQuestions.map((q) => (
              <div key={q.questionId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2">
                <div className="text-xs text-[rgb(var(--muted))]">{q.status}</div>
                <p>{q.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 text-xs text-[rgb(var(--muted))]">
        <Link href={openDossierPath} className="underline">
          Vollansicht öffnen
        </Link>
      </footer>
    </main>
  );
}
