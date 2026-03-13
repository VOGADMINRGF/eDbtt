"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EDebattePackage, SwipeItem, Eventuality, SwipeDecision, SwipeFeedFilter } from "@/features/swipes/types";
import StatementCard, { type StatementVote } from "@/components/statements/StatementCard";
import { buildCreateHref } from "@/features/create/intents";

/** Fetch-Helper */

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

const mapDecisionToVote = (decision: SwipeDecision): StatementVote => {
  if (decision === "agree") return "approve";
  if (decision === "disagree") return "reject";
  return "neutral";
};

const mapVoteToDecision = (vote: StatementVote): SwipeDecision => {
  if (vote === "approve") return "agree";
  if (vote === "reject") return "disagree";
  return "neutral";
};

async function postSwipeVote(payload: { statementId: string; eventualityId?: string; decision: SwipeDecision }) {
  const res = await fetch("/api/swipes/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("[swipes] vote failed", res.status);
  }
}

/** ------------------------
 * Buttons im eDebatte-CI
 * ----------------------- */

const primaryChipClass =
  "inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_22px_rgba(14,116,144,0.35)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-sky-200";

const secondaryChipClass =
  "inline-flex items-center rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--fg))] shadow-sm ring-1 ring-[rgb(var(--border))] transition hover:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-200";

const subtleTextLinkClass =
  "text-[11px] font-medium text-[rgb(var(--muted))] underline-offset-2 hover:text-[rgb(var(--fg))] hover:underline";

function getSwipeDetailHref(statementId: string) {
  if (statementId.startsWith("seed-")) {
    return "/dossier/demo";
  }
  return `/dossier/${encodeURIComponent(statementId)}`;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button,a,input,textarea,select,summary,[role='button'],[role='link'],[data-swipe-no-drag]",
    ),
  );
}

type SwipeableCardShellProps = {
  onRequestActive: () => void;
  onOpen: () => void;
  onSwipeDecision: (decision: SwipeDecision) => void;
  onSwipeUp: () => void;
  children: React.ReactNode;
};

function SwipeableCardShell({
  onRequestActive,
  onOpen,
  onSwipeDecision,
  onSwipeUp,
  children,
}: SwipeableCardShellProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const suppressNextClickRef = useRef(false);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    startRef.current = null;
    didDragRef.current = false;
    setDragging(false);
    setDragX(0);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
    suppressNextClickRef.current = false;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!didDragRef.current) {
      if (absX < 6 && absY < 6) return;
      // Vertical scroll gesture: don't hijack; also suppress click-open.
      if (absY > absX) {
        if (dy < -80) {
          suppressNextClickRef.current = true;
          onSwipeUp();
        }
        suppressNextClickRef.current = true;
        reset();
        return;
      }
      didDragRef.current = true;
      setDragging(true);
    }

    // When actively swiping, prevent "ghost click" and keep motion smooth.
    suppressNextClickRef.current = true;
    e.preventDefault();
    setDragX(dx);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const commitThreshold = 120;
    const dx = dragX;
    const didDrag = didDragRef.current;

    startRef.current = null;
    didDragRef.current = false;
    setDragging(false);

    if (didDrag) {
      suppressNextClickRef.current = true;
    }

    if (didDrag && Math.abs(dx) >= commitThreshold) {
      const decision: SwipeDecision = dx > 0 ? "agree" : "disagree";
      const width = ref.current?.getBoundingClientRect().width ?? 340;
      // Animate out, then commit.
      setDragX(Math.sign(dx) * (width * 1.15));
      window.setTimeout(() => {
        setDragX(0);
        onSwipeDecision(decision);
      }, 160);
      return;
    }

    setDragX(0);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (isInteractiveTarget(e.target)) return;
    onOpen();
  };

  const commitThreshold = 120;
  const clampedRotate = Math.max(-9, Math.min(9, dragX / 32));
  const hint: SwipeDecision | null = Math.abs(dragX) < 24 ? null : dragX > 0 ? "agree" : "disagree";
  const overlayOpacity = Math.min(1, Math.abs(dragX) / commitThreshold);

  return (
    <div
      ref={ref}
      className="relative touch-pan-y select-none cursor-grab active:cursor-grabbing"
      onPointerDownCapture={() => onRequestActive()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={reset}
      onClick={handleClick}
      style={{
        transform: dragX ? `translateX(${dragX}px) rotate(${clampedRotate}deg)` : undefined,
        transition: dragging ? "none" : "transform 170ms cubic-bezier(0.2, 0.9, 0.2, 1)",
      }}
    >
      {hint && (
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl ring-1 ${
            hint === "agree" ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"
          }`}
          style={{ opacity: overlayOpacity * 0.6 }}
        />
      )}
      {hint && (
        <div
          className={`pointer-events-none absolute top-4 ${
            hint === "agree" ? "left-4" : "right-4"
          } rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
            hint === "agree" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
          style={{ opacity: Math.min(1, 0.35 + overlayOpacity * 0.65) }}
        >
          {hint === "agree" ? "Zustimmen" : "Ablehnen"}
        </div>
      )}

      {children}
    </div>
  );
}

/** ------------------------
 * Haupt-Component
 * ----------------------- */

type SwipesClientProps = {
  edebattePackage: EDebattePackage;
  initialTopic?: string;
  focusStatementId?: string;
  variant?: "full" | "solo";
  showHero?: boolean;
};

export function SwipesClient({
  edebattePackage,
  initialTopic = "",
  focusStatementId,
  variant = "full",
  showHero = true,
}: SwipesClientProps) {
  const router = useRouter();
  const [topicQuery, setTopicQuery] = useState(variant === "solo" ? "" : initialTopic);
  const [activeLevel, setActiveLevel] = useState<"ALL" | "Bund" | "Land" | "Kommune" | "EU">("ALL");
  const [selectedSwipe, setSelectedSwipe] = useState<SwipeItem | null>(null);
  const [eventualities, setEventualities] = useState<Eventuality[] | null>(null);
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flashDecision, setFlashDecision] = useState<{ id: string; decision: SwipeDecision } | null>(null);
  const [screenFlash, setScreenFlash] = useState<SwipeDecision | null>(null);
  const [lastAction, setLastAction] = useState<{ item: SwipeItem; decision: SwipeDecision; index: number; removed: boolean } | null>(null);
  const [decisionStats, setDecisionStats] = useState({ agree: 0, neutral: 0, disagree: 0 });
  const [liveMessage, setLiveMessage] = useState("");
  const liveTimerRef = useRef<number | null>(null);

  const isBasic = edebattePackage === "basis" || edebattePackage === "none";
  const isStartOrPro =
    edebattePackage === "start" ||
    edebattePackage === "pro" ||
    edebattePackage === "b2b_basis" ||
    edebattePackage === "b2b_pro" ||
    edebattePackage === "b2g_basis" ||
    edebattePackage === "b2g_pro";
  const isSolo = variant === "solo";

  const openDossier = useCallback(
    (statementId: string) => {
      router.push(getSwipeDetailHref(statementId) as any);
    },
    [router],
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
        setActiveIndex(0);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [topicQuery, activeLevel, focusStatementId, variant]);

  const filteredSwipes = useMemo(() => items, [items]);

  const handleOpenEventualities = async (item: SwipeItem) => {
    setSelectedSwipe(item);
    const evts = await fetchEventualities(item.id);
    // leichte Durchmischung, damit Varianten nicht immer in gleicher Reihenfolge kommen
    const shuffled = [...evts].sort(() => Math.random() - 0.5);
    setEventualities(shuffled);
  };

  const handleCloseEventualities = () => {
    setSelectedSwipe(null);
    setEventualities(null);
  };

  const handleDecision = useCallback((item: SwipeItem, decision: SwipeDecision, idxOverride?: number) => {
    setDecisionStats((prev) => ({
      ...prev,
      [decision]: prev[decision] + 1,
    }));
    setFlashDecision({ id: item.id, decision });
    setScreenFlash(decision);
    postSwipeVote({ statementId: item.id, decision }).catch(() => {});
    const shouldRemove = isBasic;
    const idx = typeof idxOverride === "number" ? idxOverride : filteredSwipes.findIndex((s) => s.id === item.id);
    setLastAction({ item, decision, index: idx >= 0 ? idx : 0, removed: shouldRemove });
    announce(
      decision === "agree"
        ? "Zustimmung gespeichert."
        : decision === "disagree"
          ? "Ablehnung gespeichert."
          : "Neutral gespeichert.",
    );

    if (shouldRemove) {
      setTimeout(() => {
        setItems((prev) => prev.filter((s) => s.id !== item.id));
        setFlashDecision(null);
        if (idx >= 0) {
          const next = Math.min(idx, Math.max(filteredSwipes.length - 2, 0));
          setActiveIndex(next);
        }
      }, 250);
    } else {
      const nextIdx = idx >= 0 ? Math.min(idx + 1, Math.max(filteredSwipes.length - 1, 0)) : 0;
      setTimeout(() => {
        setFlashDecision(null);
        if (filteredSwipes[nextIdx]) {
          setActiveIndex(nextIdx);
          const nextId = filteredSwipes[nextIdx]?.id;
          if (nextId) {
            const el = document.querySelector(`[data-statement-id="${nextId}"]`);
            (el as HTMLElement | null)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
      }, 240);
    }
    setTimeout(() => setScreenFlash(null), 320);
  }, [announce, filteredSwipes, isBasic]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!filteredSwipes.length) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.isContentEditable) return;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const current = filteredSwipes[activeIndex] ?? filteredSwipes[0];
      if (!current) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleDecision(current, "disagree", activeIndex);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleDecision(current, "agree", activeIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        openDossier(current.id);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecision(current, "neutral", activeIndex);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredSwipes, activeIndex, handleDecision, openDossier]);

  const handleUndo = () => {
    if (!lastAction) return;
    if (lastAction.removed) {
      setItems((prev) => {
        const next = [...prev];
        const insertIndex = Math.min(lastAction.index, next.length);
        next.splice(insertIndex, 0, lastAction.item);
        return next;
      });
      setActiveIndex(Math.min(lastAction.index, Math.max(items.length, 0)));
    }
    setFlashDecision(null);
    setScreenFlash(null);
    setLastAction(null);
  };

  const swipeCards = filteredSwipes.map((item, idx) => {
    const cardText = item.text ?? item.title ?? "";
    const isActiveCard = idx === activeIndex;
    const badgeRight = item.evidenceCount ? `${item.evidenceCount} Belege` : undefined;
    return (
      <SwipeableCardShell
        key={item.id}
        onRequestActive={() => setActiveIndex(idx)}
        onOpen={() => openDossier(item.id)}
        onSwipeDecision={(decision) => handleDecision(item, decision, idx)}
        onSwipeUp={() => openDossier(item.id)}
      >
        <StatementCard
          variant="swipe"
          statementId={item.id}
          title={item.title}
          text={cardText}
          mainCategory={item.category}
          jurisdiction={item.level}
          topic={item.domainLabel}
          tags={item.topicTags}
          metaRight={item.responsibilityLabel}
          currentVote={flashDecision?.id === item.id ? mapDecisionToVote(flashDecision.decision) : null}
          flashDecision={flashDecision?.id === item.id ? mapDecisionToVote(flashDecision.decision) : null}
          onVoteChange={(vote) => handleDecision(item, mapVoteToDecision(vote), idx)}
          className={isActiveCard ? "ring-2 ring-sky-200" : ""}
          isActive={isActiveCard}
          showOpenLink
          onOpenDetails={() => openDossier(item.id)}
          onOpenEventualities={item.hasEventualities && !isBasic ? () => handleOpenEventualities(item) : undefined}
          badgeRight={badgeRight}
        />
      </SwipeableCardShell>
    );
  });

  const activeItem = filteredSwipes[activeIndex] ?? filteredSwipes[0] ?? null;
  const totalDecisions = decisionStats.agree + decisionStats.neutral + decisionStats.disagree;

  return (
    <div className={`mx-auto flex flex-col gap-6 px-4 pt-10 ${isSolo ? "max-w-3xl" : "max-w-6xl"}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      {screenFlash && (
        <div
          className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-200 ${
            screenFlash === "agree"
              ? "bg-emerald-200/40"
              : screenFlash === "disagree"
              ? "bg-rose-200/40"
              : "bg-sky-200/35"
          }`}
        />
      )}

      {isSolo ? (
        <SoloHeader statementId={focusStatementId} />
      ) : (
        <>
          {showHero ? <SwipesHeader edebattePackage={edebattePackage} isBasic={isBasic} isStartOrPro={isStartOrPro} /> : null}
          <SwipesToolbar topicQuery={topicQuery} onTopicChange={setTopicQuery} activeLevel={activeLevel} onLevelChange={setActiveLevel} isBasic={isBasic} />
          <section className="rounded-3xl bg-[rgb(var(--card))] p-3 ring-1 ring-[rgb(var(--border))]">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="vog-chip vog-chip--status">Bewertungen: {totalDecisions}</span>
              <span className="vog-chip vog-chip--status">Ja: {decisionStats.agree}</span>
              <span className="vog-chip vog-chip--status">Offen: {decisionStats.neutral}</span>
              <span className="vog-chip vog-chip--status">Nein: {decisionStats.disagree}</span>
              {totalDecisions >= 5 ? (
                <>
                  <Link href="/abstimmungen" className="vog-chip vog-chip--active">Passende Abstimmungen</Link>
                  <Link href="/mitwirken" className="vog-chip">Mitwirken</Link>
                </>
              ) : (
                <span className="text-[rgb(var(--muted))]">Ab 5 Bewertungen zeigen wir nächste Prioritäten.</span>
              )}
            </div>
          </section>
        </>
      )}

      {isSolo ? (
        <div className="relative space-y-3">
          {lastAction && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                ↩︎ Swipe rückgängig
              </button>
            </div>
          )}
          {loading ? (
            <div className="rounded-3xl bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] ring-1 ring-dashed ring-[rgb(var(--border))]">Lade Swipes …</div>
          ) : filteredSwipes.length === 0 ? (
            <EmptyState
              message="Diese Swipe-Karte wurde nicht gefunden oder ist nicht freigeschaltet."
              ctaHref="/swipes"
              ctaLabel="Alle Swipes öffnen"
            />
          ) : (
            swipeCards
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.5fr)]">
          <div className="space-y-3 relative">
            {lastAction && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  ↩︎ Swipe rückgängig
                </button>
              </div>
            )}
            {loading ? (
              <div className="rounded-3xl bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] ring-1 ring-dashed ring-[rgb(var(--border))]">Lade Swipes …</div>
            ) : filteredSwipes.length === 0 ? (
              <EmptyState onResetFilters={() => {
                setTopicQuery("");
                setActiveLevel("ALL");
              }} />
            ) : (
              swipeCards
            )}
          </div>

          <div className="mt-3 hidden md:block">
            <EventualitiesPanel selectedSwipe={selectedSwipe} eventualities={eventualities} isBasic={isBasic} />
          </div>
        </div>
      )}

      {selectedSwipe && eventualities && (
        <MobileEventualitiesOverlay selectedSwipe={selectedSwipe} eventualities={eventualities} isBasic={isBasic} onClose={handleCloseEventualities} />
      )}

      {!isSolo && activeItem ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 py-2 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleDecision(activeItem, "disagree", activeIndex)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700"
            >
              Nein
            </button>
            <button
              type="button"
              onClick={() => handleDecision(activeItem, "neutral", activeIndex)}
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-xs font-semibold text-[rgb(var(--muted))]"
            >
              Offen
            </button>
            <button
              type="button"
              onClick={() => handleDecision(activeItem, "agree", activeIndex)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700"
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() => openDossier(activeItem.id)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700"
            >
              Mehr
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

/** Header / Hero */

function SoloHeader({ statementId }: { statementId?: string }) {
  return (
    <header className="flex items-center justify-between gap-3 rounded-3xl bg-[rgb(var(--card))] px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))]">
      <Link href="/swipes" className={secondaryChipClass}>
        Alle Swipes anzeigen
      </Link>
      {statementId && <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Karte #{statementId}</span>}
    </header>
  );
}

type SwipesHeaderProps = {
  edebattePackage: EDebattePackage;
  isBasic: boolean;
  isStartOrPro: boolean;
};

function SwipesHeader({ edebattePackage, isBasic, isStartOrPro }: SwipesHeaderProps) {
  const pkgLabel =
    edebattePackage === "basis"
      ? "eDebatte Basis"
      : edebattePackage === "start"
      ? "eDebatte Start"
      : edebattePackage === "pro"
      ? "eDebatte Pro"
      : edebattePackage === "b2b_basis"
      ? "B2B Basis"
      : edebattePackage === "b2b_pro"
      ? "B2B Pro"
      : edebattePackage === "b2g_basis"
      ? "B2G Basis"
      : edebattePackage === "b2g_pro"
      ? "B2G Pro"
      : "ohne eDebatte-Paket";

  return (
    <header className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Swipes · kostenloser Einstieg</p>
      <h1 className="text-2xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-3xl">
        <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">Swipes</span> – schnell einordnen, dann vertiefen.
      </h1>
      <p className="max-w-2xl text-sm text-[rgb(var(--muted))]">
        Mobile-first Themenkompass: links/rechts für erste Haltung, nach oben oder „Mehr“ für Dossier, Quellen und Varianten.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildCreateHref({ intent: "claim" })} className={primaryChipClass}>
          Thema einreichen
        </Link>
        <Link href={buildCreateHref({ intent: "source" })} className={secondaryChipClass}>
          Quelle ergänzen
        </Link>
        <Link href="/account" className={subtleTextLinkClass}>
          Konto
        </Link>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
        <span>
          Aktiver Modus: <span className="font-semibold text-[rgb(var(--fg))]">{pkgLabel}</span>
        </span>
        {isBasic && <span>· Offener Public-Stream ist aktiv.</span>}
        {isStartOrPro && <span>· Suche, Filter und Variantenvergleich sind aktiv.</span>}
      </p>
      <p className="text-[11px] text-[rgb(var(--muted))]">Gesten: links = eher ablehnen, rechts = eher zustimmen, oben = verstehen/vertiefen.</p>
    </header>
  );
}

/** Toolbar */

type SwipesToolbarProps = {
  topicQuery: string;
  onTopicChange: (value: string) => void;
  activeLevel: "ALL" | "Bund" | "Land" | "Kommune" | "EU";
  onLevelChange: (value: "ALL" | "Bund" | "Land" | "Kommune" | "EU") => void;
  isBasic: boolean;
};

function SwipesToolbar({ topicQuery, onTopicChange, activeLevel, onLevelChange, isBasic }: SwipesToolbarProps) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-[rgb(var(--card))] p-3 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:flex-row md:items-center md:justify-between md:p-4">
      <div className="flex-1">
        <label className="block text-[11px] font-medium text-[rgb(var(--muted))]">Thema oder Stichwort</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={topicQuery}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="z. B. Wohnen, Mobilität, Bildung, Pflege"
            className={`w-full rounded-full border px-3 py-1.5 text-sm text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-sky-200 ${
              "border-[rgb(var(--border))] bg-[rgb(var(--bg))] hover:bg-[rgb(var(--card))]"
            }`}
          />
          <button
            type="button"
            onClick={() => onTopicChange("")}
            className={secondaryChipClass}
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
        <span className="text-[11px] font-medium text-[rgb(var(--muted))]">Ebene:</span>
        {["ALL", "Kommune", "Land", "Bund", "EU"].map((level) => {
          const isActive = activeLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onLevelChange(level as SwipesToolbarProps["activeLevel"])}
              className={
                isActive
                  ? "inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                  : "inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-medium text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
              }
            >
              {level === "ALL" ? "Alle" : level}
            </button>
          );
        })}
      </div>
      {isBasic ? (
        <p className="text-[11px] text-[rgb(var(--muted))] md:ml-2">
          Optional erweiterbar: Variantenvergleich und weitere Auswertungen in Start/Pro.
        </p>
      ) : null}
    </section>
  );
}

/** Eventualitäten-Panel (Desktop) */

type EventualitiesPanelProps = {
  selectedSwipe: SwipeItem | null;
  eventualities: Eventuality[] | null;
  isBasic: boolean;
};

function EventualitiesPanel({ selectedSwipe, eventualities, isBasic }: EventualitiesPanelProps) {
  if (!selectedSwipe) {
    return (
      <aside className="rounded-3xl bg-slate-900 text-slate-50 p-4 shadow-[0_22px_65px_rgba(15,23,42,0.65)] ring-1 ring-[rgb(var(--border))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">Eventualitäten</p>
        <h3 className="mt-2 text-sm font-semibold text-white">Varianten zu deinen Swipes</h3>
        <p className="mt-2 text-[11px] text-slate-300">Wähle links eine Karte mit Eventualitäten aus, um alternative Vorschläge und Varianten zu sehen.</p>
        {isBasic && <p className="mt-3 text-[11px] text-[rgb(var(--muted))]">In eDebatte Start kannst du verschiedene Varianten direkt gegeneinander abwägen und bewerten.</p>}
      </aside>
    );
  }

  if (!eventualities || eventualities.length === 0) {
    return (
      <aside className="rounded-3xl bg-slate-900 text-slate-50 p-4 shadow-[0_22px_65px_rgba(15,23,42,0.65)] ring-1 ring-[rgb(var(--border))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">Eventualitäten</p>
        <h3 className="mt-2 text-sm font-semibold text-white">{selectedSwipe.title}</h3>
        <p className="mt-2 text-[11px] text-slate-300">Für dieses Statement sind noch keine Eventualitäten erfasst.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl bg-slate-900 text-slate-50 p-4 shadow-[0_22px_65px_rgba(15,23,42,0.65)] ring-1 ring-[rgb(var(--border))]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">Eventualitäten</p>
      <h3 className="mt-2 text-sm font-semibold text-white">Varianten zu:</h3>
      <p className="mt-1 text-[11px] text-slate-200">{selectedSwipe.title}</p>

      <div className="mt-3 space-y-2">
        {eventualities.map((evt) => (
          <EventualityRow key={evt.id} eventuality={evt} statementId={selectedSwipe.id} />
        ))}
      </div>

      <p className="mt-3 text-[10px] text-[rgb(var(--muted))]">Du kannst jede Eventualität separat bewerten. Später können daraus konkrete Szenarien und Beschlussvarianten gebaut werden.</p>
      {isBasic && (
        <p className="mt-2 text-[10px] text-[rgb(var(--muted))]">
          In eDebatte Start fließen deine Bewertungen direkt in Entscheidungsvarianten ein.{" "}
          <Link href="/pricing" className="underline">
            Mehr zu Paketen & Preisen
          </Link>
        </p>
      )}
    </aside>
  );
}

type EventualityRowProps = {
  eventuality: Eventuality;
  statementId: string;
};

function EventualityRow({ eventuality, statementId }: EventualityRowProps) {
  const handleDecision = (decision: SwipeDecision) => {
    postSwipeVote({ statementId, eventualityId: eventuality.id, decision }).catch(() => {});
  };

  return (
    <div className="rounded-2xl bg-slate-800/70 p-2 text-[11px]">
      <p className="font-medium text-slate-50">{eventuality.shortLabel ?? eventuality.title}</p>
      {eventuality.shortLabel && <p className="mt-0.5 text-[10px] text-slate-300">{eventuality.title}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => handleDecision("agree")}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
        >
          Variante gut
        </button>
        <button
          type="button"
          onClick={() => handleDecision("neutral")}
          className="inline-flex flex-[0.9] items-center justify-center rounded-full bg-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-50 hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-[rgb(var(--border))]"
        >
          Unentschieden
        </button>
        <button
          type="button"
          onClick={() => handleDecision("disagree")}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-rose-500/90 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-300"
        >
          Variante ablehnen
        </button>
      </div>
    </div>
  );
}

/** Mobile-Overlay */

type MobileEventualitiesOverlayProps = {
  selectedSwipe: SwipeItem;
  eventualities: Eventuality[];
  isBasic: boolean;
  onClose: () => void;
};

function MobileEventualitiesOverlay({ selectedSwipe, eventualities, isBasic, onClose }: MobileEventualitiesOverlayProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-900/40 px-2 pb-4 backdrop-blur-sm md:hidden">
      <div className="w-full max-h-[75vh] rounded-3xl bg-slate-900 p-4 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.6)] ring-1 ring-[rgb(var(--border))]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">Eventualitäten</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            ✕
          </button>
        </div>
        <p className="text-[11px] text-slate-200">{selectedSwipe.title}</p>
        {isBasic && <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">In eDebatte Start kannst du verschiedene Varianten direkt gegeneinander abwägen. Aktuell siehst du nur eine Vorschau.</p>}
        <div className="mt-3 space-y-2 overflow-y-auto pr-1">
          {eventualities.map((evt) => (
            <EventualityRow key={evt.id} eventuality={evt} statementId={selectedSwipe.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Empty State */

function EmptyState({
  message,
  ctaHref,
  ctaLabel,
  onResetFilters,
}: {
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
  onResetFilters?: () => void;
}) {
  return (
    <div className="rounded-3xl bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] ring-1 ring-dashed ring-[rgb(var(--border))]">
      {message ?? "Aktuell gibt es zu deiner Auswahl keine Swipes. Probiere einen anderen Suchbegriff, eine andere Ebene – oder entdecke neue Themen auf der Startseite."}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {onResetFilters ? (
          <button type="button" onClick={onResetFilters} className="vog-chip vog-chip--active">
            Filter zurücksetzen
          </button>
        ) : null}
        <Link href="/swipes?topic=wohnen" className="vog-chip">
          Wohnen
        </Link>
        <Link href="/swipes?topic=bildung" className="vog-chip">
          Bildung
        </Link>
        <Link href="/swipes?topic=mobilitaet" className="vog-chip">
          Mobilität
        </Link>
      </div>
      {ctaHref && ctaLabel && (
        <div className="mt-2">
          <Link href={ctaHref} className="text-[11px] font-semibold text-sky-700 underline-offset-2 hover:underline">
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
