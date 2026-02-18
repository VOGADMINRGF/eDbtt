import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoVote } from "@features/votes/demoVotes";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  planned: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
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
        <Link href="/demo/votes" className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">
          &larr; Zur Uebersicht
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Demo - Abstimmung</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{vote.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))] max-w-3xl">{vote.summary}</p>
        <div className="flex flex-wrap gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
            {vote.regionLabel}
          </span>
          <span>Status: {vote.status}</span>
          <span>{vote.participationTarget}</span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Optionen</h2>
          <div className="space-y-3">
            {vote.options.map((opt) => (
              <div key={opt.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm">
                <p className="font-semibold text-[rgb(var(--fg))]">{opt.label}</p>
                <p className="text-[rgb(var(--muted))]">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Claims & Evidenz</h2>
          <ol className="space-y-3 text-sm">
            {vote.claims.map((claim, idx) => (
              <li key={idx} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                <p className="text-[rgb(var(--fg))]">{claim.text}</p>
                {claim.sourceHint && (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Quelle: {claim.sourceHint}</p>
                )}
              </li>
            ))}
          </ol>
          <div className="border-t border-[rgb(var(--border))] pt-3 text-xs text-[rgb(var(--muted))]">
            {vote.evidence.map((item) => (
              <div key={item.label} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[rgb(var(--muted))]">{item.label}</span>
                <span>{item.source}</span>
                {item.url && (
                  <a href={item.url} className="text-sky-600 underline" target="_blank" rel="noreferrer">
                    Link
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Entscheidungsbaum</h2>
          <ol className="space-y-3 text-sm">
            {vote.decisionTree.map((step, idx) => (
              <li key={idx} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 space-y-1">
                <p className="font-semibold text-[rgb(var(--fg))]">{step.title}</p>
                <p className="text-[rgb(var(--muted))]">{step.detail}</p>
                <p className="text-xs text-[rgb(var(--muted))]">Dann: {step.outcome}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Timeline</h2>
          <ol className="space-y-3 text-sm">
            {vote.timeline.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                <div>
                  <p className="font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{new Date(item.date).toLocaleDateString("de-DE")}</p>
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                >
                  {item.status === "done"
                    ? "erledigt"
                    : item.status === "in_progress"
                    ? "laeuft"
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
