type SwipesHeaderProgressProps = {
  swipeCount: number;
  sessionCount: number;
  deckProgressLabel: string;
  goal?: number;
  onOpenSearch: () => void;
  mode?: "idle" | "active";
};

export function SwipesHeaderProgress({
  swipeCount,
  sessionCount,
  deckProgressLabel,
  goal = 100,
  onOpenSearch,
  mode = "active",
}: SwipesHeaderProgressProps) {
  const clamped = Math.max(0, Math.min(swipeCount, goal));
  const remaining = Math.max(goal - clamped, 0);
  const progress = goal > 0 ? Math.min((clamped / goal) * 100, 100) : 0;
  const isActive = mode === "active";

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 py-2 shadow-[0_16px_45px_rgba(2,6,23,0.18)] backdrop-blur md:py-3">
      <div className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-sky-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3 text-xs">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Analysefortschritt</p>
          {isActive ? (
            <>
              <p className="mt-0.5 text-[15px] font-semibold text-[rgb(var(--fg))] md:mt-1 md:text-base">
                {clamped} von {goal} Swipes
              </p>
              <p className="mt-1 hidden text-[rgb(var(--muted))] sm:block">
                {remaining} bis zur Analyse · {deckProgressLabel} · Session: {sessionCount}
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-[15px] font-semibold text-[rgb(var(--fg))] md:mt-1 md:text-base">
                Schnell reagieren
              </p>
              <p className="mt-1 hidden text-[rgb(var(--muted))] sm:block">
                Starte mit Ja, Nein oder Offen. Vertiefung bleibt optional.
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/60 bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 shadow-[0_8px_20px_rgba(14,165,233,0.18)] transition hover:brightness-105 dark:border-sky-400/30 dark:from-sky-500/16 dark:to-cyan-500/10 dark:text-sky-200 md:h-10 md:w-10"
          aria-label="Suche und Filter öffnen"
        >
          <SearchIcon />
        </button>
      </div>
      {isActive ? (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--bg))]">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-white/0 to-white/35 dark:to-white/10" />
          </div>
        </div>
      ) : null}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M11 4a7 7 0 1 0 4.42 12.42l4.08 4.08 1.4-1.4-4.08-4.08A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
        fill="currentColor"
      />
    </svg>
  );
}
