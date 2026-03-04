import Link from "next/link";

export default function VoteNewPage({
  searchParams,
}: {
  searchParams?: { fromContribution?: string };
}) {
  const from = typeof searchParams?.fromContribution === "string"
    ? searchParams.fromContribution
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Abstimmung erstellen</h1>
      <p className="text-[rgb(var(--muted))]">
        Diese Funktion ist derzeit noch nicht freigeschaltet. Dein Entwurf ist vorhanden:
      </p>
      <pre className="rounded-xl bg-[rgb(var(--bg))] p-3 text-sm">{from ?? "—"}</pre>
      <div className="flex gap-3">
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-white" href="/votes">
          Zu Abstimmungen
        </Link>
        <Link className="rounded-full border px-4 py-2" href="/create?intent=contribution">
          Zurück
        </Link>
      </div>
    </main>
  );
}
