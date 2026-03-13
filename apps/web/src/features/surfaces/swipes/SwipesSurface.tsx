import Link from "next/link";
import { SwipesClient } from "@/app/swipes/SwipesClient";
import type { EDebattePackage } from "@/features/swipes/types";
import type { SurfaceContext } from "@/features/surface";

type SwipesSurfaceProps = {
  context: SurfaceContext;
  edebattePackage: EDebattePackage;
  initialTopic?: string;
};

export function SwipesSurface({ context, edebattePackage, initialTopic = "" }: SwipesSurfaceProps) {
  const isDemo = context.mode === "demo";
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pb-14 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4">
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {isDemo ? "Demo - Swipes" : "Swipes"}
          </p>
          <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
            Schnell orientieren, dann in Dossier und Abstimmung vertiefen
          </h1>
          <p className="max-w-4xl text-sm text-[rgb(var(--muted))]">
            Swipes ist der schnelle Vorqualifizierungsraum: bewerten, in Evidenz springen, Dossier öffnen
            und bei Bedarf direkt in die Abstimmung oder Mitwirkung wechseln.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="vog-chip vog-chip--status">Bewerten</span>
            <span className="vog-chip vog-chip--status">Vertiefen</span>
            <span className="vog-chip vog-chip--status">Dossier öffnen</span>
            <span className="vog-chip vog-chip--status">Evidenz prüfen</span>
            <span className="vog-chip vog-chip--status">Abstimmen / Mitwirken</span>
            <span className="vog-chip vog-chip--status">
              Datenquelle: {context.dataSource === "seed" ? "seed" : "live"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/demo/dossier?mode=lesen&persona=citizen" className="btn-secondary text-xs">
              Demo-Dossier öffnen
            </Link>
            <Link href="/abstimmungen" className="btn-secondary text-xs">
              Abstimmungen ansehen
            </Link>
            <Link href="/mitwirken" className="btn-secondary text-xs">
              Mitwirken starten
            </Link>
          </div>
          {isDemo ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              Demo-Hinweis: Diese Ansicht nutzt kuratierte Seed-/Fallback-Daten und simulierte Aktionen.
            </p>
          ) : null}
        </section>
      </div>

      <SwipesClient
        edebattePackage={edebattePackage}
        initialTopic={initialTopic}
        showHero={false}
        mode={context.mode}
        audience={context.audience}
      />
    </main>
  );
}
