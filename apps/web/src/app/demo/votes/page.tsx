import Link from "next/link";
import { demoVotes } from "@features/votes/demoVotes";

export default function DemoVotesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Demo - Abstimmungen</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Votes Preview</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Reproduzierbare Demo-Abstimmungen mit Entscheidungsbaum, Optionen und Evidenz-Snippets.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {demoVotes.map((vote) => (
          <article
            key={vote.id}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
              <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
                {vote.regionLabel}
              </span>
              <span>Status: {vote.status}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{vote.title}</h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{vote.summary}</p>
            </div>
            <div className="text-xs text-[rgb(var(--muted))]">
              <p>{vote.participationTarget}</p>
              <p>Letztes Update: {new Date(vote.updatedAt).toLocaleDateString("de-DE")}</p>
            </div>
            <Link
              href={`/demo/votes/${vote.id}`}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Details ansehen
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
