type SwipeProgressHintProps = {
  completedCount: number;
  goal?: number;
  transitionHint?: string | null;
};

export function SwipeProgressHint({
  completedCount,
  goal = 100,
  transitionHint,
}: SwipeProgressHintProps) {
  const normalized = Math.max(0, Math.min(completedCount, goal));
  const progress = goal > 0 ? Math.min((normalized / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - normalized, 0);
  const tendencyCountdown = Math.max(5 - completedCount, 0);

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[rgb(var(--fg))]">{normalized} von {goal} Swipes</span>
        <span className="text-[rgb(var(--muted))]">{remaining} bis zur Analyse</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--bg))]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {tendencyCountdown > 0 ? (
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Noch {tendencyCountdown} {tendencyCountdown === 1 ? "Thema" : "Themen"} bis zur ersten Tendenz.
        </p>
      ) : null}
      {transitionHint ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{transitionHint}</p> : null}
    </section>
  );
}
