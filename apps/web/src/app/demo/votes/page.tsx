import Link from "next/link";
import { demoVotes } from "@features/votes/demoVotes";
import { DEMO_BADGE, DEMO_CARD, DEMO_MUTED, DEMO_PRIMARY_BUTTON, DEMO_SUBTLE } from "@/lib/ui/demoUi";

export default function DemoVotesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>Demo · Abstimmungen</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Votes Preview</h1>
        <p className={`text-sm ${DEMO_MUTED}`}>
          Reproduzierbare Demo-Abstimmungen mit Entscheidungsbaum, Optionen und Evidenz-Snippets.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {demoVotes.map((vote) => (
          <article
            key={vote.id}
            className={`${DEMO_CARD} p-5 space-y-3`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-2 text-xs ${DEMO_SUBTLE}`}>
              <span className={DEMO_BADGE}>
                {vote.regionLabel}
              </span>
              <span>Status: {vote.status}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{vote.title}</h2>
              <p className={`mt-2 text-sm ${DEMO_MUTED}`}>{vote.summary}</p>
            </div>
            <div className={`text-xs ${DEMO_SUBTLE}`}>
              <p>{vote.participationTarget}</p>
              <p>Letztes Update: {new Date(vote.updatedAt).toLocaleDateString("de-DE")}</p>
            </div>
            <Link
              href={`/demo/votes/${vote.id}`}
              className={DEMO_PRIMARY_BUTTON}
            >
              Details ansehen
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
