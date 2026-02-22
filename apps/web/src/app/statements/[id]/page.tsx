// apps/web/src/app/statements/[id]/page.tsx

import { ObjectId } from "@core/db/triMongo";
import { notFound } from "next/navigation";
import type { MaterialLink } from "@features/dossier/infra/types";

import StatementDetailClient from "@features/statement/components/StatementDetailClient";
import ResponsibilityNavigator from "@features/statement/components/ResponsibilityNavigator";
import {
  ConsequencesPreviewCard,
  ResponsibilityPreviewCard,
} from "@features/statement/components/StatementImpactPreview";
import { getActors, type ResponsibilityPath } from "@core/responsibility";
import type { ConsequenceRecord, ResponsibilityRecord } from "@features/analyze/schemas";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ dossierId?: string }>;
};

type Stats = {
  votesTotal: number;
  votesAgree: number;
  votesNeutral: number;
  votesDisagree: number;
};

const EDGE_LABEL: Record<string, string> = {
  supports: "stützt",
  mentions: "erwähnt",
  contradicts: "widerspricht",
  unknown: "unklar",
};

function formatDate(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function StatementPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const dossierId = resolvedSearch?.dossierId;

  const tri: any = await import("@core/db/triMongo");
  const stmts = tri.coreCol
    ? await tri.coreCol("statements")
    : (await tri.getDb()).collection("statements");

  const selector = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

  const doc = await stmts.findOne(selector);
  if (!doc) {
    const proposals = tri.coreCol
      ? await tri.coreCol("statement_proposals")
      : (await tri.getDb()).collection("statement_proposals");
    const proposal = await proposals.findOne(selector);
    if (!proposal) return notFound();

    const linksCol = tri.coreCol
      ? await tri.coreCol("dossier_material_links")
      : (await tri.getDb()).collection("dossier_material_links");

    const linkIds = [id, String(proposal._id)];
    const links = await linksCol
      .find({ kind: "statement", itemId: { $in: linkIds } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .toArray();

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Aussage (Vorschlag)
          </p>
          <h1 className="text-2xl font-bold">{proposal.title ?? "Aussage"}</h1>
          <p className="text-[11px] text-[rgb(var(--muted))]">ID: {id}</p>
          {proposal.createdAt ? (
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Eingereicht: {formatDate(proposal.createdAt)}
            </p>
          ) : null}
          {dossierId ? (
            <a
              href={`/dossier/${encodeURIComponent(dossierId)}#material-links`}
              className="inline-block text-[11px] text-[rgb(var(--muted))] underline"
            >
              Zurück zum Dossier
            </a>
          ) : null}
        </header>

        <section className="bg-[rgb(var(--card))] border rounded-xl p-4">
          <p className="text-sm whitespace-pre-wrap">{proposal.text ?? "—"}</p>
        </section>

        {links.length ? (
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Verknüpft in Dossiers
            </div>
            {links.map((link: MaterialLink) => (
              <div key={link.linkId} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <a
                  href={`/dossier/${encodeURIComponent(link.dossierId)}#material-links`}
                  className="font-semibold underline"
                >
                  {link.dossierId}
                </a>
                <span className="vog-chip">
                  {EDGE_LABEL[link.edgeType ?? "unknown"] ?? (link.edgeType ?? "unklar")}
                </span>
                <span className="text-[rgb(var(--muted))]">{formatDate(link.createdAt) ?? "-"}</span>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    );
  }

  const statementId: string = doc.id ?? String(doc._id);
  const content: string | undefined = doc.text ?? doc.content ?? undefined;

  const stats: Stats = doc.stats ?? {
    votesTotal: 0,
    votesAgree: 0,
    votesNeutral: 0,
    votesDisagree: 0,
  };

  const consequences: ConsequenceRecord[] =
    (doc.analysis?.consequences?.consequences as ConsequenceRecord[] | undefined) ?? [];
  const responsibilities: ResponsibilityRecord[] =
    (doc.analysis?.consequences?.responsibilities as ResponsibilityRecord[] | undefined) ?? [];

  const responsibilityPaths: ResponsibilityPath[] =
    (doc.analysis?.responsibilityPaths as ResponsibilityPath[] | undefined) ??
    (doc.responsibilityPaths as ResponsibilityPath[] | undefined) ??
    [];

  const actors = await getActors();

  const linksCol = tri.coreCol
    ? await tri.coreCol("dossier_material_links")
    : (await tri.getDb()).collection("dossier_material_links");
  const linkIds = [id, statementId, String(doc._id)];
  const materialLinks: MaterialLink[] = await linksCol
    .find({ kind: "statement", itemId: { $in: linkIds } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        {doc.category && <p className="text-sm text-neutral-500">{doc.category}</p>}
      </header>

      {content && <p className="text-lg leading-relaxed">{content}</p>}

      <StatementDetailClient statementId={statementId} initialStats={stats} />

      <ConsequencesPreviewCard consequences={consequences} responsibilities={responsibilities} />

      <ResponsibilityPreviewCard
        responsibilities={responsibilities}
        paths={responsibilityPaths as any}
        showPathOverlay
      />

      <ResponsibilityNavigator paths={responsibilityPaths as any} actors={actors} statementTitle={doc.title} />

      {doc.analysis?.summary && (
        <section className="bg-[rgb(var(--card))] border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Analyse</h2>
          <pre className="text-sm whitespace-pre-wrap">{doc.analysis.summary}</pre>
        </section>
      )}

      {materialLinks.length ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Verknüpft in Dossiers
          </div>
          {materialLinks.map((link) => (
            <div key={link.linkId} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <a
                href={`/dossier/${encodeURIComponent(link.dossierId)}#material-links`}
                className="font-semibold underline"
              >
                {link.dossierId}
              </a>
              <span className="vog-chip">
                {EDGE_LABEL[link.edgeType ?? "unknown"] ?? (link.edgeType ?? "unklar")}
              </span>
              <span className="text-[rgb(var(--muted))]">{formatDate(link.createdAt) ?? "-"}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}