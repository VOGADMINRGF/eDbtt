import Link from "next/link";
import { notFound } from "next/navigation";
import { dossierClaimsCol, dossierFindingsCol, dossierSourcesCol, openQuestionsCol } from "@features/dossier/db";
import { selectEffectiveFindings } from "@features/dossier/effective";
import { findDossierByAnyId } from "@features/dossier/lookup";
import { buildDossierEmbedPath, buildOpenDossierPath } from "@features/newsroom";
import { resolveNewsroomCtaLabel } from "@features/embed";
import { JOURNALISM_ANLASS_NOTE, JOURNALISM_COMPANION_LINES } from "@features/journalism";

type PageProps = {
  params: Promise<{ dossierId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function read(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const dynamic = "force-dynamic";

function deriveFactcheckStatus(verdicts: string[]) {
  if (verdicts.some((item) => item === "refuted")) return "widersprüchlich";
  if (verdicts.some((item) => item === "mixed" || item === "unclear" || item === "in_review")) {
    return "in Prüfung";
  }
  if (verdicts.some((item) => item === "supported")) return "teilweise bestätigt";
  return "offen";
}

export default async function NewsroomCompanionPage({ params, searchParams }: PageProps) {
  const { dossierId } = await params;
  const resolved = searchParams ? await searchParams : {};
  const anchorId = read(resolved.anchor);
  const medium = read(resolved.medium);
  const format = read(resolved.format);
  const publishedAt = read(resolved.publishedAt);
  const ctaLabel = resolveNewsroomCtaLabel(read(resolved.cta));

  const dossier = await findDossierByAnyId(dossierId);
  if (!dossier) return notFound();
  const dossierKey = dossier.dossierId;

  const [sources, findings, claims, openQuestions] = await Promise.all([
    (await dossierSourcesCol()).find({ dossierId: dossierKey }).toArray(),
    (await dossierFindingsCol()).find({ dossierId: dossierKey }).sort({ updatedAt: -1 }).toArray(),
    (await dossierClaimsCol()).find({ dossierId: dossierKey }).toArray(),
    (await openQuestionsCol()).find({ dossierId: dossierKey }).toArray(),
  ]);
  const effectiveFindings = selectEffectiveFindings(findings);
  const factcheckStatus = deriveFactcheckStatus(effectiveFindings.map((item) => item.verdict));

  const openDossierPath = buildOpenDossierPath({ dossierId: dossierKey, anchorId });
  const embedPath = buildDossierEmbedPath({
    dossierId: dossierKey,
    anchorId,
    medium,
    format,
    publishedAt,
    cta: read(resolved.cta),
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-10 text-[rgb(var(--fg))]">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Newsroom Companion
        </p>
        <h1 className="text-2xl font-semibold">{dossier.title ?? "Offener Dossierraum"}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{JOURNALISM_ANLASS_NOTE}</p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Ausgelöst durch
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Medium</p>
            <p className="font-semibold">{medium ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Format</p>
            <p className="font-semibold">{format ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Datum</p>
            <p className="font-semibold">{publishedAt ?? "-"}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Anlass-ID</p>
            <p className="font-semibold">{anchorId ?? "-"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Offener Dossierstatus
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Factcheck-Stand</p>
            <p className="text-sm font-semibold">{factcheckStatus}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</p>
            <p className="text-sm font-semibold">{sources.length}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Beteiligung</p>
            <p className="text-sm font-semibold">{claims.length} Kernaussagen</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</p>
            <p className="text-sm font-semibold">{openQuestions.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Offener Zielraum
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">{ctaLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={openDossierPath} className="btn btn-primary text-sm">
            Dossier öffnen
          </Link>
          <Link href={embedPath} className="btn-secondary text-sm">
            Embed-Ansicht öffnen
          </Link>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">
          QR- und Embed-Verlinkungen zeigen immer auf den offenen Dossierraum, nicht auf eine
          proprietäre Medienseite.
        </p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Companion-Block (optional im Beitrag)
        </p>
        <ul className="mt-3 grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.mentionedInArticle}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.availableInDossier}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.stillOpen}
          </li>
          <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            {JOURNALISM_COMPANION_LINES.hasContradiction}
          </li>
        </ul>
      </section>
    </main>
  );
}
