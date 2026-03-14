import { SwipesClient } from "@/app/swipes/SwipesClient";
import type { EDebattePackage } from "@/features/swipes/types";
import type { SurfaceContext } from "@/features/surface";

type SwipesSurfaceProps = {
  context: SurfaceContext;
  edebattePackage: EDebattePackage;
  initialTopic?: string;
  requireAuthAfterFreeVotes?: boolean;
};

export function SwipesSurface({
  context,
  edebattePackage,
  initialTopic = "",
  requireAuthAfterFreeVotes = false,
}: SwipesSurfaceProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pb-14 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <SwipesClient
        edebattePackage={edebattePackage}
        initialTopic={initialTopic}
        showHero={false}
        mode={context.mode}
        audience={context.audience}
        requireAuthAfterFreeVotes={requireAuthAfterFreeVotes}
      />
    </main>
  );
}
