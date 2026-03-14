"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { StatementVote } from "@/components/statements/StatementCard";
import { buildSwipeDossierHref, buildSwipeEvidenceHref } from "@/features/surfaces/swipes/detailRoutes";
import {
  FreeVoteGate,
  SwipeDetailSheet,
  SwipesDeck,
  SwipesHeader,
  SwipesOutcomeSummary,
  SwipesToolbar,
  type DecisionHistoryItem,
} from "@/features/surfaces/swipes/components";
import { useFreeVoteLimit } from "@/features/surfaces/swipes/useFreeVoteLimit";
import type {
  EDebattePackage,
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


type SwipesClientProps = {
  edebattePackage: EDebattePackage;
  initialTopic?: string;
  focusStatementId?: string;
  variant?: "full" | "solo";
  showHero?: boolean;
  mode?: SurfaceMode;
  audience?: SurfaceAudience;
  requireAuthAfterFreeVotes?: boolean;
};

export function SwipesClient({
  edebattePackage,
  initialTopic = "",
  focusStatementId,
  variant = "full",
  showHero = true,
  mode = "live",
  audience = "none",
  requireAuthAfterFreeVotes = false,
}: SwipesClientProps) {
  const [topicQuery, setTopicQuery] = useState(variant === "solo" ? "" : initialTopic);
  const [activeLevel, setActiveLevel] = useState<"ALL" | "Bund" | "Land" | "Kommune" | "EU">("ALL");
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flashDecision, setFlashDecision] = useState<{ id: string; decision: SwipeDecision } | null>(null);
  const [screenFlash, setScreenFlash] = useState<SwipeDecision | null>(null);
  const [lastAction, setLastAction] = useState<{ item: SwipeItem; decision: SwipeDecision; index: number; removed: boolean } | null>(null);
  const [decisionStats, setDecisionStats] = useState({ agree: 0, neutral: 0, disagree: 0 });
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([]);
  const [liveMessage, setLiveMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SwipeItem | null>(null);
  const [detailEventualities, setDetailEventualities] = useState<Eventuality[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
  const freeVote = useFreeVoteLimit({
    enabled: requireAuthAfterFreeVotes && mode === "live" && !isSolo,
    limit: 3,
  });
  const isVoteLocked = freeVote.enabled && !freeVote.canVote;

  const openDossierRoute = useCallback(
    (statementId: string) => buildSwipeDossierHref(statementId, { mode, audience }),
    [audience, mode],
  );

  const openEvidenceRoute = useCallback(
    (statementId: string) => buildSwipeEvidenceHref(statementId, { mode, audience }),
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

  const openDetail = useCallback(async (item: SwipeItem) => {
    setDetailItem(item);
    setDetailOpen(true);
    setDetailLoading(true);
    const evts = await fetchEventualities(item.id);
    setDetailEventualities(evts);
    setDetailLoading(false);
  }, []);

  const handleDecision = useCallback((item: SwipeItem, decision: SwipeDecision, idxOverride?: number) => {
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
  }, [announce, filteredSwipes, isBasic, openDossierRoute]);

  const attemptDecision = useCallback(
    (item: SwipeItem, decision: SwipeDecision, idxOverride?: number) => {
      if (isVoteLocked) {
        freeVote.setGateOpen(true);
        return;
      }
      const allowed = freeVote.registerVote();
      if (!allowed) return;
      handleDecision(item, decision, idxOverride);
    },
    [freeVote, handleDecision, isVoteLocked],
  );

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
        attemptDecision(current, "disagree", activeIndex);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        attemptDecision(current, "agree", activeIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        void openDetail(current);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        attemptDecision(current, "neutral", activeIndex);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredSwipes, activeIndex, attemptDecision, openDetail]);

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

  const activeItem = filteredSwipes[activeIndex] ?? filteredSwipes[0] ?? null;

  return (
    <div className={`mx-auto flex flex-col gap-6 px-4 pt-3 md:pt-8 ${isSolo ? "max-w-3xl" : "max-w-6xl"}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>

      {screenFlash ? (
        <div
          className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-200 ${
            screenFlash === "agree"
              ? "bg-emerald-200/40"
              : screenFlash === "disagree"
                ? "bg-rose-200/40"
                : "bg-sky-200/35"
          }`}
        />
      ) : null}

      {isSolo ? <SoloHeader statementId={focusStatementId} /> : null}

      {!isSolo && showHero ? (
        <div className="hidden md:block">
          <SwipesHeader
            edebattePackage={edebattePackage}
            isBasic={isBasic}
            isStartOrPro={isStartOrPro}
          />
        </div>
      ) : null}

      {!isSolo ? (
        <div className="hidden md:block">
          <SwipesToolbar
            topicQuery={topicQuery}
            onTopicChange={setTopicQuery}
            activeLevel={activeLevel}
            onLevelChange={setActiveLevel}
            isBasic={isBasic}
          />
        </div>
      ) : null}

      <div className={isSolo ? "relative space-y-3" : "grid gap-5 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.3fr)]"}>
        <div className="space-y-3 relative">
          {!isSolo && freeVote.enabled ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              Freier Einstieg: {Math.min(freeVote.count, freeVote.limit)}/{freeVote.limit} Abstimmungen genutzt.
            </p>
          ) : null}
          {lastAction ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                ↩︎ Swipe rückgängig
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] ring-1 ring-dashed ring-[rgb(var(--border))]">
              Lade Swipes …
            </div>
          ) : filteredSwipes.length === 0 ? (
            <EmptyState
              message="Keine passenden Karten. Wähle ein anderes Thema oder setze die Filter zurück."
              onResetFilters={() => {
                setTopicQuery("");
                setActiveLevel("ALL");
              }}
            />
          ) : (
            <SwipesDeck
              items={filteredSwipes}
              activeIndex={activeIndex}
              flashDecision={flashDecision}
              onRequestActive={setActiveIndex}
              onOpen={(item) => {
                void openDetail(item);
              }}
              onSwipeDecision={(item, decision, index) => attemptDecision(item, decision, index)}
              onVote={(item, vote, index) => attemptDecision(item, mapVoteToDecision(vote), index)}
            />
          )}
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

      {!isSolo && activeItem ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 py-2 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => attemptDecision(activeItem, "disagree", activeIndex)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700"
            >
              Nein
            </button>
            <button
              type="button"
              onClick={() => attemptDecision(activeItem, "neutral", activeIndex)}
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-xs font-semibold text-[rgb(var(--muted))]"
            >
              Offen
            </button>
            <button
              type="button"
              onClick={() => attemptDecision(activeItem, "agree", activeIndex)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700"
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() => {
                void openDetail(activeItem);
              }}
              className="rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700"
            >
              Mehr
            </button>
          </div>
        </nav>
      ) : null}

      {!isSolo ? (
        <>
          <div className="md:hidden">
            <SwipesToolbar
              topicQuery={topicQuery}
              onTopicChange={setTopicQuery}
              activeLevel={activeLevel}
              onLevelChange={setActiveLevel}
              isBasic={isBasic}
            />
          </div>
          <SwipesOutcomeSummary stats={decisionStats} history={decisionHistory} />
        </>
      ) : null}

      <FreeVoteGate
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
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Vertiefung</p>
      {item ? (
        <>
          <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Öffne Dossier, Evidenz und Varianten direkt aus der aktuellen Karte.
          </p>
          <button type="button" onClick={onOpenDetail} className="mt-3 vog-chip vog-chip--active">
            Mehr zur Karte
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Wähle eine Karte, um die Vertiefung zu öffnen.</p>
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
