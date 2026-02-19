import Link from "next/link";
import { notFound } from "next/navigation";
import demoDossier from "@features/dossier/data/demoDossier";

type PresentationStream = { id: string; title: string; date: string };

type PresentationNote = { kind?: string | null; text?: string };

type PresentationPayload = {
  inputs?: { streams?: PresentationStream[] };
};

function findStream(id: string): PresentationStream | null {
  for (const note of demoDossier.analyze.notes as PresentationNote[]) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload;
      if (!parsed.inputs?.streams) continue;
      const match = parsed.inputs.streams.find((stream) => stream.id === id);
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

export default async function StreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stream = findStream(id);
  if (!stream) return notFound();

  return (
    <main className="dark min-h-screen bg-[radial-gradient(circle_at_top,rgb(15,23,42)_0%,rgb(2,6,23)_45%,rgb(2,6,23)_100%)]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/dossier/demo" className="text-xs text-[rgb(var(--muted))] underline">
          Zurück zum Dossier
        </Link>
        <div className="mt-6 space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Themenstrom (Demo)</p>
          <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{stream.title}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Datum: {formatDate(stream.date)}</p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Dieser Eintrag ist Teil der Demonstration. Inhalte werden im Dossier strukturiert zusammengeführt.
          </p>
        </div>
      </div>
    </main>
  );
}
