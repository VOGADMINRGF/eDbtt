import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoVote } from "@features/votes/demoVotes";
import { DEMO_BADGE, DEMO_CARD, DEMO_MUTED, DEMO_SUBTLE } from "@/lib/ui/demoUi";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  planned: "bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300",
};

export default async function DemoVoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vote = getDemoVote(id);
  if (!vote) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <Link href="/demo/votes" className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>
          &larr; Zur Übersicht
        </Link>
        <p className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>Demo · Abstimmung</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{vote.title}</h1>
        <p className={`text-sm max-w-3xl ${DEMO_MUTED}`}>{vote.summary}</p>
        <div className={`flex flex-wrap gap-3 text-xs ${DEMO_SUBTLE}`}>
          <span className={DEMO_BADGE}>
            {vote.regionLabel}
          </span>
          <span>Status: {vote.status}</span>
          <span>{vote.participationTarget}</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Optionen</h2>
          <div className="space-y-3">
            {vote.options.map((opt) => (
              <div key={opt.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{opt.label}</p>
                <p className={DEMO_MUTED}>{opt.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Claims & Evidenz</h2>
          <ol className="space-y-3 text-sm">
            {vote.claims.map((claim, idx) => (
              <li key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-slate-900 dark:text-slate-100">{claim.text}</p>
                {claim.sourceHint && (
                  <p className={`mt-1 text-xs ${DEMO_SUBTLE}`}>Quelle: {claim.sourceHint}</p>
                )}
              </li>
            ))}
          </ol>
          <div className="border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {vote.evidence.map((item) => (
              <div key={item.label} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{item.label}</span>
                <span>{item.source}</span>
                {item.url && (
                  <a href={item.url} className="text-sky-600 underline dark:text-sky-400" target="_blank" rel="noreferrer">
                    Link
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Entscheidungsbaum</h2>
          <ol className="space-y-3 text-sm">
            {vote.decisionTree.map((step, idx) => (
              <li key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                <p className={DEMO_MUTED}>{step.detail}</p>
                <p className={`text-xs ${DEMO_SUBTLE}`}>Dann: {step.outcome}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timeline</h2>
          <ol className="space-y-3 text-sm">
            {vote.timeline.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className={`text-xs ${DEMO_SUBTLE}`}>{new Date(item.date).toLocaleDateString("de-DE")}</p>
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                >
                  {item.status === "done"
                    ? "erledigt"
                    : item.status === "in_progress"
                    ? "läuft"
                    : "geplant"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
