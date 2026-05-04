import { SwipesClient } from "@/app/swipes/SwipesClient";
import type { SurfaceContext } from "@/features/surface";

type SwipesSurfaceProps = {
  context: SurfaceContext;
  initialTopic?: string;
  fromDraftId?: string | null;
  requireAuthAfterFreeVotes?: boolean;
  showWelcomeHint?: boolean;
};

export function SwipesSurface({
  context,
  initialTopic = "",
  fromDraftId = null,
  requireAuthAfterFreeVotes = false,
  showWelcomeHint = false,
}: SwipesSurfaceProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--bg))] pb-14 text-[rgb(var(--fg))]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-emerald-500/8 dark:from-sky-500/18 dark:to-emerald-500/12" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="absolute top-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-600/10" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-600/10" />
      </div>

      <div className="relative z-10">
        <SwipesClient
          initialTopic={initialTopic}
          fromDraftId={fromDraftId}
          mode={context.mode}
          audience={context.audience}
          requireAuthAfterFreeVotes={requireAuthAfterFreeVotes}
          showWelcomeHint={showWelcomeHint}
        />
      </div>
    </main>
  );
}
