import Link from "next/link";
import { notFound } from "next/navigation";
import demoDossier from "@features/dossier/data/demoDossier";

type PresentationContribution = { id: string; title: string; date: string; streamId?: string };

type PresentationNote = { kind?: string | null; text?: string };

type PresentationPayload = {
  inputs?: { contributions?: PresentationContribution[] };
};

function findContribution(id: string): PresentationContribution | null {
  for (const note of demoDossier.analyze.notes as PresentationNote[]) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload;
      if (!parsed.inputs?.contributions) continue;
      const match = parsed.inputs.contributions.find((entry) => entry.id === id);
      if (match) return match;
    } catch {
      continue;
    }
  }
  return null;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default async function ContributionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contribution = findContribution(id);
  if (!contribution) return notFound();

  return (
    <main className="dark min-h-screen bg-[radial-gradient(circle_at_top,rgb(15,23,42)_0%,rgb(2,6,23)_45%,rgb(2,6,23)_100%)]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/dossier/demo" className="text-xs text-[rgb(var(--muted))] underline">
          Zurück zum Dossier
        </Link>
        <div className="mt-6 space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beitrag (Demo)</p>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{contribution.title}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Datum: {formatDate(contribution.date)}</p>
          {contribution.streamId ? (
            <Link
              href={`/streams/${contribution.streamId}`}
              className="text-sm font-semibold text-[rgb(var(--fg))] underline"
            >
              Zum zugehörigen Themenstrom
            </Link>
          ) : null}
          <p className="text-sm text-[rgb(var(--muted))]">
            Dieser Beitrag ist Teil der Demonstration und dient der Nachvollziehbarkeit der Eingangsebene.
          </p>
        </div>
      </div>
    </main>
  );
}
