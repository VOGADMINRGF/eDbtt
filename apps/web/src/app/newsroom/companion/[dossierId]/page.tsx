import Link from "next/link";
import { notFound } from "next/navigation";
import { findDossierByAnyId } from "@features/dossier/lookup";
import { buildDossierEmbedPath, buildOpenDossierPath } from "@features/newsroom";

type PageProps = {
  params: Promise<{ dossierId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function read(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const dynamic = "force-dynamic";

export default async function NewsroomCompanionPage({ params, searchParams }: PageProps) {
  const { dossierId } = await params;
  const resolved = searchParams ? await searchParams : {};
  const anchorId = read(resolved.anchor);
  const medium = read(resolved.medium);
  const format = read(resolved.format);
  const publishedAt = read(resolved.publishedAt);

  const dossier = await findDossierByAnyId(dossierId);
  if (!dossier) return notFound();

  const openDossierPath = buildOpenDossierPath({ dossierId: dossier.dossierId, anchorId });
  const embedPath = buildDossierEmbedPath({
    dossierId: dossier.dossierId,
    anchorId,
    medium,
    format,
    publishedAt,
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-10 text-[rgb(var(--fg))]">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Newsroom Companion
        </p>
        <h1 className="text-2xl font-semibold">{dossier.title ?? "Offener Dossierraum"}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Dieser Einstieg ist ein publizistischer Anlassgeber. Das Dossier bleibt offen für
          Gegenquellen, Factcheck, Widerspruch und weitere Evidenz.
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Anlass-Kontext
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
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
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-soft space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Offener Zielraum
        </p>
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
    </main>
  );
}
