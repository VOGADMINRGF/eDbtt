import { ObjectId, coreCol } from "@core/db/triMongo";
import { notFound } from "next/navigation";
import type { MaterialLink } from "@features/dossier/infra/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ dossierId?: string }>;
};

const EDGE_LABEL: Record<string, string> = {
  supports: "stützt",
  mentions: "erwähnt",
  contradicts: "widerspricht",
  unknown: "unklar",
};

function formatDate(value?: Date | string | null) {
  if (!value) return "–";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function ContributionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  let doc: any = null;
  const contributionsCol = await coreCol("contributions");
  if (ObjectId.isValid(id)) {
    doc = await contributionsCol.findOne({ _id: new ObjectId(id) });
  }
  if (!doc) {
    doc = await contributionsCol.findOne({ id });
  }

  let draft: any = null;
  if (!doc && ObjectId.isValid(id)) {
    const draftsCol = await coreCol("contribution_drafts");
    draft = await draftsCol.findOne({ _id: new ObjectId(id) });
  }

  if (!doc && !draft) return notFound();

  const title = doc?.title ?? draft?.title ?? "Beitrag";
  const text = doc?.text ?? draft?.text ?? draft?.analysis?.summary ?? "";
  const createdAt = doc?.createdAt ?? draft?.createdAt ?? null;
  const dossierId = resolvedSearch?.dossierId;

  const linksCol = await coreCol<MaterialLink>("dossier_material_links");
  const linkIds = [id];
  if (doc?._id) linkIds.push(String(doc._id));
  if (doc?.id) linkIds.push(String(doc.id));
  if (draft?._id) linkIds.push(String(draft._id));
  const materialLinks = await linksCol
    .find({ kind: "contribution", itemId: { $in: linkIds } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .toArray();

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <section className="mx-auto w-full max-w-4xl px-4 py-12 space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Beitrag (Detailansicht)
          </p>
          <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{title}</h1>
          <p className="text-[11px] text-[rgb(var(--muted))]">ID: {id}</p>
          <p className="text-[11px] text-[rgb(var(--muted))]">Erstellt: {formatDate(createdAt)}</p>
          {dossierId ? (
            <a
              href={`/dossier/${encodeURIComponent(dossierId)}#material-links`}
              className="inline-block text-[11px] text-[rgb(var(--muted))] underline"
            >
              Zurück zum Dossier
            </a>
          ) : null}
        </header>

        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          {text ? (
            <p className="text-sm leading-relaxed text-[rgb(var(--fg))] whitespace-pre-line">{text}</p>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">
              Kein Text hinterlegt. Dieser Eintrag stammt aus einem Draft oder einem älteren Beitrag.
            </p>
          )}
        </article>

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
      </section>
    </main>
  );
}
