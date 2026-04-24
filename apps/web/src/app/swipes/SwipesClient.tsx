"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildSwipeDossierHref, buildSwipeEvidenceHref, buildSwipeVotingHref } from "@/features/surfaces/swipes/detailRoutes";
import { useMobileChromeVisibility } from "@/hooks/useMobileChromeVisibility";
import {
  buildSwipesFeedFilter,
  countFromDraftFocusItems,
  resolveFromDraftArrivalStatus,
  resolveInitialSwipesArrivalMode,
  resolveSwipesArrivalToggle,
  resolveSwipesEmptyStateMessage,
  resolveThematicContextHref,
  shouldShowArrivalContextReminder,
  type SwipesArrivalMode,
} from "@/features/surfaces/swipes/arrival";
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
import { resolveSwipesProgressState } from "@/features/surfaces/swipes/progressContract";
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

type SwipeVotePersistPayload = {
  statementId: string;
  eventualityId?: string;
  decision: SwipeDecision;
  variantWeight?: 1 | 3 | 5;
  variantReason?: string;
  variantRankedIds?: string[];
  excludedEventualityIds?: string[];
};

async function postSwipeVote(payload: SwipeVotePersistPayload) {
  const res = await fetch("/api/swipes/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("[swipes] vote failed", res.status);
  }
}

async function deleteSwipeVote(statementId: string) {
  const res = await fetch("/api/swipes/vote", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statementId }),
  });
  if (!res.ok) {
    console.error("[swipes] vote undo failed", res.status);
  }
}

function transitionLabel(decision: SwipeDecision) {
  if (decision === "agree") return "Ja gespeichert. Optional direkt Variante wählen.";
  if (decision === "disagree") return "Nein gespeichert. Optional direkt Variante wählen.";
  return "Offen gespeichert. Optional direkt Variante wählen.";
}

function buildTransitionHint(decision: SwipeDecision, remainingToAnalysis: number) {
  return `+1 Swipe gespeichert · ${remainingToAnalysis} bis zur Analyse. ${transitionLabel(decision)}`;
}

type SwipesClientProps = {
  initialTopic?: string;
  fromDraftId?: string | null;
  focusStatementId?: string;
  variant?: "full" | "solo";
  mode?: SurfaceMode;
  audience?: SurfaceAudience;
  requireAuthAfterFreeVotes?: boolean;
};

type LastVoteSnapshot = {
  item: SwipeItem;
  decision: SwipeDecision;
  historyEntry: DecisionHistoryItem;
  prevHint: string | null;
};

export function SwipesClient({
  initialTopic = "",
  fromDraftId = null,
  focusStatementId,
  variant = "full",
  mode = "live",
  audience = "none",
  requireAuthAfterFreeVotes = false,
}: SwipesClientProps) {
  const [topicQuery, setTopicQuery] = useState(variant === "solo" ? "" : initialTopic);
  const [activeLevel, setActiveLevel] = useState<"ALL" | "Bund" | "Land" | "Kommune" | "EU">("ALL");
  const [arrivalMode, setArrivalMode] = useState<SwipesArrivalMode>(() => resolveInitialSwipesArrivalMode(fromDraftId));
  const [searchOpen, setSearchOpen] = useState(false);
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [decisionStats, setDecisionStats] = useState({ agree: 0, neutral: 0, disagree: 0 });
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([]);
  const [transitionHint, setTransitionHint] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [lastVote, setLastVote] = useState<LastVoteSnapshot | null>(null);

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
  const [chromeRevealSignal, setChromeRevealSignal] = useState(0);

  const liveTimerRef = useRef<number | null>(null);
  const pendingVoteTimerRef = useRef<number | null>(null);
  const pendingVotePayloadRef = useRef<SwipeVotePersistPayload | null>(null);

  const isSolo = variant === "solo";
  const isSwipeFocusMode = !isSolo;
  const fromDraftArrivalEnabled = !isSolo && Boolean(fromDraftId);
  const showingFromDraftOnly = fromDraftArrivalEnabled && arrivalMode === "from_draft";

  const freeVote = useFreeVoteLimit({
    enabled: requireAuthAfterFreeVotes && mode === "live" && !isSolo,
    limit: 3,
  });
  const mobileActionChromeVisible = useMobileChromeVisibility({
    disabled: isSolo || eventualityStepOpen || detailOpen || freeVote.gateOpen,
    minY: 72,
    hideDelta: 12,
    showDelta: 14,
    revealSignal: chromeRevealSignal,
    holdVisibleMs: 900,
  });

  const isVoteLocked = freeVote.enabled && !freeVote.canVote;
  const swipeProgressCount = Math.max(completedCount, freeVote.count);
  const progressState = resolveSwipesProgressState({
    swipeCount: swipeProgressCount,
    decisionCount: decisionHistory.length,
    fromDraftMode: showingFromDraftOnly,
  });

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

  const flushPendingVote = useCallback(() => {
    const pending = pendingVotePayloadRef.current;
    if (!pending) return;
    if (pendingVoteTimerRef.current) {
      window.clearTimeout(pendingVoteTimerRef.current);
      pendingVoteTimerRef.current = null;
    }
    pendingVotePayloadRef.current = null;
    postSwipeVote(pending).catch(() => {});
  }, []);

  const cancelPendingVote = useCallback(() => {
    if (pendingVoteTimerRef.current) {
      window.clearTimeout(pendingVoteTimerRef.current);
      pendingVoteTimerRef.current = null;
    }
    pendingVotePayloadRef.current = null;
  }, []);

  const queueVotePayload = useCallback(
    (payload: SwipeVotePersistPayload) => {
      if (pendingVotePayloadRef.current) {
        flushPendingVote();
      }
      pendingVotePayloadRef.current = payload;
      pendingVoteTimerRef.current = window.setTimeout(() => {
        flushPendingVote();
      }, 900);
    },
    [flushPendingVote],
  );

  useEffect(
    () => () => {
      flushPendingVote();
    },
    [flushPendingVote],
  );

  useEffect(() => {
    if (typeof document === "undefined" || !isSwipeFocusMode) return;
    document.body.classList.add("vog-mobile-swipe-focus");
    return () => {
      document.body.classList.remove("vog-mobile-swipe-focus");
    };
  }, [isSwipeFocusMode]);

  useEffect(() => {
    setArrivalMode(resolveInitialSwipesArrivalMode(fromDraftId));
  }, [fromDraftId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const resp = await fetchSwipeFeed(
        buildSwipesFeedFilter({
          topicQuery: variant === "solo" ? undefined : topicQuery,
          level: activeLevel,
          statementId: focusStatementId,
          fromDraftId: showingFromDraftOnly ? fromDraftId : null,
          arrivalMode,
        }),
        null,
      );
      if (!cancelled) {
        setItems(resp.items);
        setLoading(false);
        setLastVote(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [topicQuery, activeLevel, focusStatementId, fromDraftId, showingFromDraftOnly, arrivalMode, variant]);

  const activeItem = useMemo(() => items[0] ?? null, [items]);
  const fromDraftFocusCount = useMemo(() => countFromDraftFocusItems(items), [items]);
  const thematicContextHref = useMemo(() => resolveThematicContextHref(activeItem), [activeItem]);
  const showArrivalContextReminder = useMemo(
    () => shouldShowArrivalContextReminder(thematicContextHref),
    [thematicContextHref],
  );

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
        setTransitionHint((prev) =>
          prev
            ? `${prev} Keine Varianten vorhanden, nächstes Thema wird geladen.`
            : "Keine Varianten vorhanden, nächstes Thema wird geladen.",
        );
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
      const historyEntry: DecisionHistoryItem = {
        id: item.id,
        title: item.title,
        category: item.category || item.domainLabel || "Thema",
        decision,
        detailHref: openDossierRoute(item.id),
      };

      setDecisionStats((prev) => ({
        ...prev,
        [decision]: prev[decision] + 1,
      }));
      setLastVote({
        item,
        decision,
        historyEntry,
        prevHint: transitionHint,
      });
      setDecisionHistory((prev) => {
        const next: DecisionHistoryItem[] = [...prev, historyEntry];
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
      setChromeRevealSignal((prev) => prev + 1);
      if (!item.hasEventualities) {
        queueVotePayload({ statementId: item.id, decision });
      }
      window.setTimeout(() => setScreenFlash(null), 260);

      await beginEventualityStep(item, decision, openGateAfterTopic);
    },
    [announce, beginEventualityStep, completedCount, freeVote, isVoteLocked, openDossierRoute, queueVotePayload, transitionHint],
  );

  const handleUndoLastVote = useCallback(() => {
    if (!lastVote) return;

    const { item, decision, historyEntry, prevHint } = lastVote;
    const shouldReinsert = !activeItem || activeItem.id !== item.id;

    setDecisionStats((prev) => ({
      ...prev,
      [decision]: Math.max(prev[decision] - 1, 0),
    }));
    setDecisionHistory((prev) => {
      const idx = [...prev].reverse().findIndex((entry) => entry.id === historyEntry.id && entry.decision === historyEntry.decision);
      if (idx === -1) return prev;
      const absoluteIndex = prev.length - 1 - idx;
      return prev.filter((_, entryIndex) => entryIndex !== absoluteIndex);
    });
    if (shouldReinsert) {
      setItems((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)]);
      setCompletedCount((prev) => Math.max(prev - 1, 0));
    }

    if (eventualityStepOpen) {
      setEventualityStepOpen(false);
      setEventualityStepDecision(null);
      setEventualityStepItem(null);
      setEventualityStepItems([]);
      setEventualityStepLoading(false);
    }

    setOpenGateAfterStep(false);
    setScreenFlash(null);
    setTransitionHint(prevHint ?? "Letzte Entscheidung zurückgenommen.");
    const pendingVote = pendingVotePayloadRef.current;
    if (pendingVote && pendingVote.statementId === item.id) {
      cancelPendingVote();
    } else {
      void deleteSwipeVote(item.id);
    }
    if (freeVote.enabled) {
      freeVote.unregisterVote();
    }
    freeVote.setGateOpen(false);
    announce("Letzte Bewertung wurde zurückgenommen.");
    setChromeRevealSignal((prev) => prev + 1);
    setLastVote(null);
  }, [activeItem, announce, cancelPendingVote, eventualityStepOpen, freeVote, lastVote]);

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
      queueVotePayload({
        statementId: eventualityStepItem.id,
        eventualityId: selection.eventualityId,
        decision: eventualityStepDecision,
        variantWeight: selection.variantWeight,
        variantReason: selection.variantReason,
        variantRankedIds: selection.variantRankedIds,
        excludedEventualityIds: selection.excludedEventualityIds,
      });
      setTransitionHint("Variante mit Gewichtung gespeichert. Nächstes Thema folgt.");
      setChromeRevealSignal((prev) => prev + 1);
      finishEventualityStep();
    },
    [eventualityStepDecision, eventualityStepItem, finishEventualityStep, queueVotePayload],
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
    <div className={`mx-auto flex flex-col gap-3 px-3 pt-1.5 md:gap-4 md:px-4 md:pt-6 ${isSolo ? "max-w-3xl" : "max-w-6xl"} pb-36 md:pb-24`}>
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
        <SwipesHeaderProgress
          swipeCount={swipeProgressCount}
          mode={progressState.mode}
          onOpenSearch={() => setSearchOpen(true)}
        />
      ) : null}

      {fromDraftArrivalEnabled && fromDraftId ? (
        <FinalizeArrivalBanner
          draftId={fromDraftId}
          arrivalMode={arrivalMode}
          focusedCount={fromDraftFocusCount}
          showContextReminder={showArrivalContextReminder}
          onSwitchMode={setArrivalMode}
        />
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
              onVote={(decision) => {
                void handlePrimaryVote(activeItem, decision);
              }}
              onQuickFollowup={(action) => {
                if (action === "more_context") {
                  void openDetail(activeItem);
                  return;
                }
                if (action === "variants") {
                  void beginEventualityStep(activeItem, "neutral", false);
                  return;
                }
                setTransitionHint("Als später vertiefbar markiert. Nächstes Thema bleibt frei wählbar.");
                setChromeRevealSignal((prev) => prev + 1);
              }}
            />
          ) : (
            <EmptyState
              message={resolveSwipesEmptyStateMessage({ showingFromDraftOnly })}
              onResetFilters={() => {
                setTopicQuery("");
                setActiveLevel("ALL");
                if (fromDraftArrivalEnabled) {
                  setArrivalMode("all");
                }
              }}
            />
          )}
          {!isSolo && transitionHint ? <p className="text-xs text-[rgb(var(--muted))]">{transitionHint}</p> : null}
          {!isSolo && thematicContextHref ? (
            <Link
              href={thematicContextHref}
              className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))]"
            >
              Zum Themenkontext in /create
            </Link>
          ) : null}
          {!isSolo && lastVote ? (
            <button
              type="button"
              onClick={handleUndoLastVote}
              className="btn-secondary hidden w-fit items-center px-3 py-1.5 text-xs md:inline-flex"
            >
              Letzte Bewertung rückgängig
            </button>
          ) : null}
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
        <nav
          className={`fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-30 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 pt-2 pb-3 backdrop-blur transition-all duration-200 md:hidden ${
            mobileActionChromeVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent" />
          <div className="relative mx-auto max-w-xl space-y-2">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[rgb(var(--border))]/80" aria-hidden />
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              Schnellaktionen
            </p>
            <div className={`grid gap-2 ${lastVote ? "grid-cols-2" : "grid-cols-1"}`}>
              <button
                type="button"
                onClick={() => {
                  void openDetail(activeItem);
                }}
                className="btn-secondary min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              >
                Mehr Kontext
              </button>
              {lastVote ? (
                <button
                  type="button"
                  onClick={handleUndoLastVote}
                  className="btn-secondary min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                >
                  Rückgängig
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  void handlePrimaryVote(activeItem, "disagree");
                }}
                aria-label="Ablehnen"
                className="btn-vote btn-vote-disagree min-h-[52px] rounded-xl px-2 py-2 text-xs"
              >
                <span className="flex flex-col items-center gap-0.5 leading-none">
                  <span className="text-sm" aria-hidden>
                    👎
                  </span>
                  <span>Nein</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handlePrimaryVote(activeItem, "neutral");
                }}
                aria-label="Neutral"
                className="btn-vote btn-vote-neutral min-h-[52px] rounded-xl px-2 py-2 text-xs"
              >
                <span className="flex flex-col items-center gap-0.5 leading-none">
                  <span className="text-sm" aria-hidden>
                    😐
                  </span>
                  <span>Offen</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handlePrimaryVote(activeItem, "agree");
                }}
                aria-label="Zustimmen"
                className="btn-vote btn-vote-agree min-h-[52px] rounded-xl px-2 py-2 text-xs"
              >
                <span className="flex flex-col items-center gap-0.5 leading-none">
                  <span className="text-sm" aria-hidden>
                    👍
                  </span>
                  <span>Ja</span>
                </span>
              </button>
            </div>
          </div>
        </nav>
      ) : null}

      <SwipeEventualitiesStep
        open={eventualityStepOpen}
        item={eventualityStepItem}
        decision={eventualityStepDecision}
        eventualities={eventualityStepItems}
        loading={eventualityStepLoading}
        voteFeedback={transitionHint}
        onSelect={handleEventualitySelect}
        onUndoLastVote={lastVote ? handleUndoLastVote : undefined}
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
          if (eventualityStepItem && eventualityStepDecision) {
            queueVotePayload({ statementId: eventualityStepItem.id, decision: eventualityStepDecision });
          }
          setTransitionHint("Variante übersprungen. Nächstes Thema folgt.");
          setChromeRevealSignal((prev) => prev + 1);
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

function FinalizeArrivalBanner({
  draftId,
  arrivalMode,
  focusedCount,
  showContextReminder,
  onSwitchMode,
}: {
  draftId: string;
  arrivalMode: SwipesArrivalMode;
  focusedCount: number;
  showContextReminder: boolean;
  onSwitchMode: (mode: SwipesArrivalMode) => void;
}) {
  const showingFromDraftOnly = arrivalMode === "from_draft";
  const shortDraftId = draftId.slice(-8);
  const toggle = resolveSwipesArrivalToggle(arrivalMode);
  const statusText = resolveFromDraftArrivalStatus({
    showingFromDraftOnly,
    focusedCount,
  });
  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Beitrag eingereicht (Entwurf <span className="font-semibold">…{shortDraftId}</span>). {statusText}
        </p>
        <button
          type="button"
          onClick={() => onSwitchMode(toggle.nextMode)}
          aria-pressed={showingFromDraftOnly}
          className="inline-flex items-center rounded-full border border-emerald-300/70 bg-white/70 px-3 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-white dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-100"
        >
          {toggle.label}
        </button>
      </div>
      {showContextReminder ? (
        <p className="mt-1 text-[11px] text-emerald-700/90 dark:text-emerald-100/90">
          Der Themenkontext bleibt im Anlassraum über /runden; Swipes ist der Beteiligungsmodus.
        </p>
      ) : null}
    </section>
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
          <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">Aktives Thema vertiefen</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Dossier, Evidenz und Varianten im Detail prüfen.</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="vog-chip">Dossier</span>
            <span className="vog-chip">Evidenz</span>
            <span className="vog-chip">Eventualitäten</span>
          </div>
          <button
            type="button"
            onClick={onOpenDetail}
            className="mt-3 rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-50 to-cyan-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:brightness-105 dark:border-sky-400/30 dark:from-sky-500/14 dark:to-cyan-500/10 dark:text-sky-200"
          >
            Thema vertiefen
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
