"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildSwipeDossierHref, buildSwipeEvidenceHref, buildSwipeVotingHref } from "@/features/surfaces/swipes/detailRoutes";
import {
  SwipeAuthGate,
  SwipeDetailSheet,
  SwipeEventualitiesStep,
  SwipesHeaderProgress,
  SwipesSearchTrigger,
  SwipeTopicStep,
  SwipesOutcomeSummary,
  type DecisionHistoryItem,
} from "@/features/surfaces/swipes/components";
import { useFreeVoteLimit } from "@/features/surfaces/swipes/useFreeVoteLimit";
import type {
  Eventuality,
  SwipeDecision,
  SwipeFeedFilter,
  SwipeItem,
} from "@/features/swipes/types";
import type { SurfaceAudience, SurfaceMode } from "@/features/surface";

async function fetchSwipeFeed(
  filter: SwipeFeedFilter,
  cursor?: string | null,
): Promise<{ items: SwipeItem[]; nextCursor?: string | null }> {
  const res = await fetch("/api/swipes/feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filter, cursor }),
  });
  if (!res.ok) {
    console.error("[swipes] feed failed", res.status);
    return { items: [], nextCursor: null };
  }
  return res.json();
}

async function fetchEventualities(statementId: string): Promise<Eventuality[]> {
  const res = await fetch("/api/swipes/eventualities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statementId }),
  });
  if (!res.ok) {
    console.error("[swipes] eventualities failed", res.status);
    return [];
  }
  const data = (await res.json()) as { statementId: string; eventualities: Eventuality[] };
  return data.eventualities;
}

async function postSwipeVote(payload: {
  statementId: string;
  eventualityId?: string;
  decision: SwipeDecision;
  variantWeight?: 1 | 3 | 5;
  variantReason?: string;
  variantRankedIds?: string[];
  excludedEventualityIds?: string[];
}) {
  const res = await fetch("/api/swipes/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("[swipes] vote failed", res.status);
  }
}

function transitionLabel(decision: SwipeDecision) {
  if (decision === "agree") return "Eher zustimmend erfasst. Variante folgt.";
  if (decision === "disagree") return "Eher ablehnend erfasst. Prüfe optionale Einschränkungen.";
  return "Noch offen erfasst. Jetzt Ausgestaltung wählen.";
}

function buildTransitionHint(decision: SwipeDecision, remainingToAnalysis: number) {
  return `+1 Swipe gespeichert · ${remainingToAnalysis} bis zur Analyse. ${transitionLabel(decision)}`;
}

type SwipesClientProps = {
  initialTopic?: string;
  focusStatementId?: string;
  variant?: "full" | "solo";
  mode?: SurfaceMode;
  audience?: SurfaceAudience;
  requireAuthAfterFreeVotes?: boolean;
};

export function SwipesClient({
  initialTopic = "",
  focusStatementId,
  variant = "full",
  mode = "live",
  audience = "none",
  requireAuthAfterFreeVotes = false,
}: SwipesClientProps) {
  const [topicQuery, setTopicQuery] = useState(variant === "solo" ? "" : initialTopic);
  const [activeLevel, setActiveLevel] = useState<"ALL" | "Bund" | "Land" | "Kommune" | "EU">("ALL");
  const [searchOpen, setSearchOpen] = useState(false);
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [decisionStats, setDecisionStats] = useState({ agree: 0, neutral: 0, disagree: 0 });
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([]);
  const [transitionHint, setTransitionHint] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const [screenFlash, setScreenFlash] = useState<SwipeDecision | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SwipeItem | null>(null);
  const [detailEventualities, setDetailEventualities] = useState<Eventuality[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [eventualityStepOpen, setEventualityStepOpen] = useState(false);
  const [eventualityStepDecision, setEventualityStepDecision] = useState<SwipeDecision | null>(null);
  const [eventualityStepItem, setEventualityStepItem] = useState<SwipeItem | null>(null);
  const [eventualityStepItems, setEventualityStepItems] = useState<Eventuality[]>([]);
  const [eventualityStepLoading, setEventualityStepLoading] = useState(false);
  const [openGateAfterStep, setOpenGateAfterStep] = useState(false);

  const liveTimerRef = useRef<number | null>(null);

  const isSolo = variant === "solo";

  const freeVote = useFreeVoteLimit({
    enabled: requireAuthAfterFreeVotes && mode === "live" && !isSolo,
    limit: 3,
  });

  const isVoteLocked = freeVote.enabled && !freeVote.canVote;
  const swipeProgressCount = Math.max(completedCount, freeVote.count);

  const openDossierRoute = useCallback(
    (statementId: string) => buildSwipeDossierHref(statementId, { mode, audience }),
    [audience, mode],
  );

  const openEvidenceRoute = useCallback(
    (statementId: string) => buildSwipeEvidenceHref(statementId, { mode, audience }),
    [audience, mode],
  );

  const openVotesRoute = useCallback(
    (statementId: string, title?: string | null) =>
      buildSwipeVotingHref(statementId, { mode, audience }, { title }),
    [audience, mode],
  );

  const announce = useCallback((message: string) => {
    setLiveMessage(message);
    if (liveTimerRef.current) window.clearTimeout(liveTimerRef.current);
    liveTimerRef.current = window.setTimeout(() => setLiveMessage(""), 1400);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const resp = await fetchSwipeFeed(
        {
          topicQuery: variant === "solo" ? undefined : topicQuery,
          level: activeLevel,
          statementId: focusStatementId,
        },
        null,
      );
      if (!cancelled) {
        setItems(resp.items);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [topicQuery, activeLevel, focusStatementId, variant]);

  const activeItem = useMemo(() => items[0] ?? null, [items]);

  const openDetail = useCallback(async (item: SwipeItem) => {
    setDetailItem(item);
    setDetailOpen(true);
    setDetailLoading(true);
    const evts = await fetchEventualities(item.id);
    setDetailEventualities(evts);
    setDetailLoading(false);
  }, []);

  const moveToNextTopic = useCallback(() => {
    setItems((prev) => prev.slice(1));
    setCompletedCount((prev) => prev + 1);
  }, []);

  const beginEventualityStep = useCallback(
    async (item: SwipeItem, decision: SwipeDecision, openGateAfterTopic: boolean) => {
      if (!item.hasEventualities) {
        moveToNextTopic();
        if (openGateAfterTopic) {
          freeVote.setGateOpen(true);
        }
        return;
      }
      setOpenGateAfterStep(openGateAfterTopic);
      setEventualityStepOpen(true);
      setEventualityStepDecision(decision);
      setEventualityStepItem(item);
      setEventualityStepLoading(true);
      const evts = await fetchEventualities(item.id);
      setEventualityStepItems(evts.slice(0, 4));
      setEventualityStepLoading(false);
      if (evts.length === 0) {
        setTransitionHint("Keine Varianten vorhanden. Nächstes Thema wird geladen.");
        window.setTimeout(() => {
          setEventualityStepOpen(false);
          setEventualityStepDecision(null);
          setEventualityStepItem(null);
          setEventualityStepItems([]);
          moveToNextTopic();
          if (openGateAfterTopic) {
            freeVote.setGateOpen(true);
          }
        }, 500);
      }
    },
    [freeVote, moveToNextTopic],
  );

  const handlePrimaryVote = useCallback(
    async (item: SwipeItem, decision: SwipeDecision) => {
      if (isVoteLocked) {
        freeVote.setGateOpen(true);
        return;
      }
      const nextCount = freeVote.registerVote();
      if (nextCount === null) {
        freeVote.setGateOpen(true);
        return;
      }
      const openGateAfterTopic = freeVote.enabled && nextCount >= freeVote.limit;
      const nextProgress = Math.max(completedCount, freeVote.count) + 1;
      const remainingToAnalysis = Math.max(100 - nextProgress, 0);

      setDecisionStats((prev) => ({
        ...prev,
        [decision]: prev[decision] + 1,
      }));
      setDecisionHistory((prev) => {
        const next: DecisionHistoryItem[] = [
          ...prev,
          {
            id: item.id,
            title: item.title,
            category: item.category || item.domainLabel || "Thema",
            decision,
            detailHref: openDossierRoute(item.id),
          },
        ];
        return next.slice(-20);
      });

      setScreenFlash(decision);
      setTransitionHint(buildTransitionHint(decision, remainingToAnalysis));
      announce(
        decision === "agree"
          ? "Zustimmung gespeichert."
          : decision === "disagree"
            ? "Ablehnung gespeichert."
            : "Offene Bewertung gespeichert.",
      );
      postSwipeVote({ statementId: item.id, decision }).catch(() => {});
      window.setTimeout(() => setScreenFlash(null), 260);

      await beginEventualityStep(item, decision, openGateAfterTopic);
      if (!item.hasEventualities) {
        window.setTimeout(() => setTransitionHint("Nächstes Thema"), 320);
      }
    },
    [announce, beginEventualityStep, completedCount, freeVote, isVoteLocked, openDossierRoute],
  );

  const finishEventualityStep = useCallback(() => {
    setEventualityStepOpen(false);
    setEventualityStepDecision(null);
    setEventualityStepItem(null);
    setEventualityStepItems([]);
    moveToNextTopic();
    if (openGateAfterStep) {
      setOpenGateAfterStep(false);
      freeVote.setGateOpen(true);
    }
  }, [freeVote, moveToNextTopic, openGateAfterStep]);

  const handleEventualitySelect = useCallback(
    (selection: {
      eventualityId: string;
      variantWeight: 1 | 3 | 5;
      variantReason?: string;
      variantRankedIds?: string[];
      excludedEventualityIds?: string[];
    }) => {
      if (!eventualityStepItem || !eventualityStepDecision) {
        finishEventualityStep();
        return;
      }
      postSwipeVote({
        statementId: eventualityStepItem.id,
        eventualityId: selection.eventualityId,
        decision: eventualityStepDecision,
        variantWeight: selection.variantWeight,
        variantReason: selection.variantReason,
        variantRankedIds: selection.variantRankedIds,
        excludedEventualityIds: selection.excludedEventualityIds,
      }).catch(() => {});
      setTransitionHint("Variante mit Gewichtung gespeichert. Nächstes Thema folgt.");
      finishEventualityStep();
    },
    [eventualityStepDecision, eventualityStepItem, finishEventualityStep],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!activeItem || eventualityStepOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable) return;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        void handlePrimaryVote(activeItem, "disagree");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        void handlePrimaryVote(activeItem, "agree");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        void openDetail(activeItem);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        void handlePrimaryVote(activeItem, "neutral");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeItem, eventualityStepOpen, handlePrimaryVote, openDetail]);

  return (
    <div className={`mx-auto flex flex-col gap-4 px-4 pt-2 md:pt-6 ${isSolo ? "max-w-3xl" : "max-w-6xl"} pb-24`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {screenFlash ? (
        <div
          className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-200 ${
            screenFlash === "agree"
              ? "bg-emerald-200/35"
              : screenFlash === "disagree"
                ? "bg-rose-200/35"
                : "bg-sky-200/35"
          }`}
        />
      ) : null}

      {isSolo ? <SoloHeader statementId={focusStatementId} /> : null}

      {!isSolo ? (
        <SwipesHeaderProgress swipeCount={swipeProgressCount} onOpenSearch={() => setSearchOpen(true)} />
      ) : null}

      {!isSolo ? (
        <SwipesSearchTrigger
          open={searchOpen}
          topicQuery={topicQuery}
          activeLevel={activeLevel}
          onClose={() => setSearchOpen(false)}
          onTopicChange={setTopicQuery}
          onLevelChange={setActiveLevel}
        />
      ) : null}

      <div className={isSolo ? "space-y-3" : "grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]"}>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-3xl bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] ring-1 ring-dashed ring-[rgb(var(--border))]">
              Lade Thema …
            </div>
          ) : activeItem ? (
            <SwipeTopicStep
              item={activeItem}
              step={completedCount + 1}
              disabled={isVoteLocked}
              onVote={(decision) => {
                void handlePrimaryVote(activeItem, decision);
              }}
              onMore={() => {
                void openDetail(activeItem);
              }}
            />
          ) : (
            <EmptyState
              message="Aktuell keine weiteren Themen im Stream. Passe Filter an oder starte mit Trendthemen."
              onResetFilters={() => {
                setTopicQuery("");
                setActiveLevel("ALL");
              }}
            />
          )}
          {!isSolo && transitionHint ? <p className="text-xs text-[rgb(var(--muted))]">{transitionHint}</p> : null}
        </div>

        {!isSolo ? (
          <aside className="hidden md:block">
            <DesktopDetailHint
              item={activeItem}
              onOpenDetail={() => {
                if (!activeItem) return;
                void openDetail(activeItem);
              }}
            />
          </aside>
        ) : null}
      </div>

      {!isSolo ? (
        <SwipesOutcomeSummary
          stats={decisionStats}
          history={decisionHistory}
          votesHref={activeItem ? openVotesRoute(activeItem.id, activeItem.title) : "/abstimmungen"}
        />
      ) : null}

      {!isSolo && activeItem && !eventualityStepOpen && !detailOpen && !freeVote.gateOpen ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.55rem)] backdrop-blur md:hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent" />
          <div className="relative mx-auto grid max-w-xl grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                void handlePrimaryVote(activeItem, "disagree");
              }}
              className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 shadow-sm"
            >
              Nein
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePrimaryVote(activeItem, "neutral");
              }}
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-xs font-semibold text-[rgb(var(--muted))] shadow-sm"
            >
              Offen
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePrimaryVote(activeItem, "agree");
              }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 shadow-sm"
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() => {
                void openDetail(activeItem);
              }}
              className="rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700 shadow-sm"
            >
              Mehr
            </button>
          </div>
        </nav>
      ) : null}

      <SwipeEventualitiesStep
        open={eventualityStepOpen}
        item={eventualityStepItem}
        decision={eventualityStepDecision}
        eventualities={eventualityStepItems}
        loading={eventualityStepLoading}
        onSelect={handleEventualitySelect}
        onOpenDetail={() => {
          if (!eventualityStepItem) return;
          const item = eventualityStepItem;
          setEventualityStepOpen(false);
          setEventualityStepDecision(null);
          setEventualityStepItem(null);
          setEventualityStepItems([]);
          setEventualityStepLoading(false);
          setOpenGateAfterStep(false);
          void openDetail(item);
        }}
        onSkip={() => {
          setTransitionHint("Variante übersprungen. Nächstes Thema folgt.");
          finishEventualityStep();
        }}
      />

      <SwipeAuthGate
        open={freeVote.gateOpen}
        count={freeVote.count}
        limit={freeVote.limit}
        onClose={() => freeVote.setGateOpen(false)}
      />

      <SwipeDetailSheet
        open={detailOpen}
        item={detailItem}
        eventualities={detailEventualities}
        loadingEventualities={detailLoading}
        dossierHref={detailItem ? openDossierRoute(detailItem.id) : null}
        evidenceHref={detailItem ? openEvidenceRoute(detailItem.id) : null}
        votesHref={detailItem ? openVotesRoute(detailItem.id, detailItem.title) : null}
        onClose={() => {
          setDetailOpen(false);
          setDetailItem(null);
          setDetailEventualities(null);
        }}
      />
    </div>
  );
}

function SoloHeader({ statementId }: { statementId?: string }) {
  return (
    <header className="flex items-center justify-between gap-3 rounded-3xl bg-[rgb(var(--card))] px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))]">
      <Link
        href="/swipes"
        className="inline-flex items-center rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--fg))] shadow-sm ring-1 ring-[rgb(var(--border))] transition hover:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        Alle Swipes anzeigen
      </Link>
      {statementId ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Karte #{statementId}
        </span>
      ) : null}
    </header>
  );
}

function DesktopDetailHint({ item, onOpenDetail }: { item: SwipeItem | null; onOpenDetail: () => void }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,rgba(56,189,248,0.14),rgba(15,23,42,0)_45%)]" />
      <div className="pointer-events-none absolute -top-16 -right-10 h-32 w-32 rounded-full bg-cyan-500/12 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Vertiefung</p>
      {item ? (
        <>
          <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Öffne Dossier, Evidenz und Varianten direkt aus dem aktuellen Thema.
          </p>
          <button
            type="button"
            onClick={onOpenDetail}
            className="mt-3 rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-50 to-cyan-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:brightness-105 dark:border-sky-400/30 dark:from-sky-500/14 dark:to-cyan-500/10 dark:text-sky-200"
          >
            Mehr zum Thema
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Wähle ein Thema, um die Vertiefung zu öffnen.</p>
      )}
    </article>
  );
}

type EmptyStateProps = {
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
  onResetFilters?: () => void;
};

function EmptyState({
  message = "Keine Themen im aktuellen Filter. Setze Filter zurück oder starte mit Trendthemen.",
  ctaHref,
  ctaLabel,
  onResetFilters,
}: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))] shadow-sm">
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onResetFilters ? (
          <button type="button" onClick={onResetFilters} className="vog-chip vog-chip--active">
            Filter zurücksetzen
          </button>
        ) : null}
        <Link href="/swipes?topic=Wohnen" className="vog-chip">
          Wohnen
        </Link>
        <Link href="/swipes?topic=Bildung" className="vog-chip">
          Bildung
        </Link>
        <Link href="/swipes?topic=Mobilität" className="vog-chip">
          Mobilität
        </Link>
      </div>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="mt-3 inline-flex items-center text-sky-600 hover:text-sky-500">
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
