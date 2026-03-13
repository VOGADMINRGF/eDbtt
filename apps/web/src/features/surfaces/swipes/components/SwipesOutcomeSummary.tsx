import Link from "next/link";

type DecisionStats = { agree: number; neutral: number; disagree: number };

type DecisionHistoryItem = {
  id: string;
  title: string;
  category: string;
  decision: "agree" | "neutral" | "disagree";
  detailHref: string;
};

type SwipesOutcomeSummaryProps = {
  stats: DecisionStats;
  history: DecisionHistoryItem[];
};

function pickTopCategories(history: DecisionHistoryItem[]) {
  const counts = new Map<string, number>();
  for (const item of history) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));
}

function pickPriorityDossiers(history: DecisionHistoryItem[]) {
  const preferred = history.filter((item) => item.decision === "agree").slice(-3).reverse();
  if (preferred.length > 0) return preferred;
  return history.slice(-3).reverse();
}

export function SwipesOutcomeSummary({ stats, history }: SwipesOutcomeSummaryProps) {
  const total = stats.agree + stats.neutral + stats.disagree;
  if (total < 5) return null;

  const topCategories = pickTopCategories(history);
  const dossierSuggestions = pickPriorityDossiers(history);

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        Ergebnis nach {total} Entscheidungen
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <p className="text-xs font-semibold uppercase tracking-wide">Ja</p>
          <p className="mt-1 text-2xl font-semibold">{stats.agree}</p>
        </article>
        <article className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <p className="text-xs font-semibold uppercase tracking-wide">Offen</p>
          <p className="mt-1 text-2xl font-semibold">{stats.neutral}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-xs font-semibold uppercase tracking-wide">Nein</p>
          <p className="mt-1 text-2xl font-semibold">{stats.disagree}</p>
        </article>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Thematische Tendenz</p>
        {topCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {topCategories.map((item) => (
              <span key={item.category} className="vog-chip vog-chip--status">
                {item.category} · {item.count}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[rgb(var(--muted))]">
            Noch keine eindeutige Tendenz. Bewerte weitere Karten für ein stabileres Profil.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Passende Dossiers</p>
          <ul className="mt-2 space-y-2 text-sm">
            {dossierSuggestions.map((item) => (
              <li key={`${item.id}-${item.decision}`} className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-[rgb(var(--fg))]">{item.title}</span>
                <Link href={item.detailHref} className="vog-chip text-[10px]">
                  Öffnen
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Nächste Aktionen</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/abstimmungen" className="vog-chip vog-chip--active">
              Passende Abstimmungen
            </Link>
            <Link href="/mitwirken" className="vog-chip">
              Mitwirken
            </Link>
            <Link href="/factcheck" className="vog-chip">
              Faktencheck prüfen
            </Link>
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Bei strittigen Themen zuerst Quellen und Varianten prüfen, dann abstimmen oder eigene Perspektive einreichen.
          </p>
        </article>
      </div>
    </section>
  );
}

export type { DecisionHistoryItem };

