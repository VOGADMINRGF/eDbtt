import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { SwipeDecision, SwipeItem } from "@/features/swipes/types";
import { resolveSwipeGestureDecision } from "@/features/surfaces/swipes/gestureContract";

type SwipeTopicStepProps = {
  item: SwipeItem;
  onVote: (decision: SwipeDecision) => void;
  step?: number;
  onQuickFollowup?: (action: "more_context" | "variants" | "later") => void;
};

export function SwipeTopicStep({ item, onVote, step = 1, onQuickFollowup }: SwipeTopicStepProps) {
  const chips = buildMetaChips(item);
  const cardRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    startTs: number;
    lastX: number;
    lastTs: number;
    axis: "x" | "y" | null;
  } | null>(null);
  const voteTimeoutRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipePreview, setSwipePreview] = useState<SwipeDecision | null>(null);

  useEffect(() => {
    setDragX(0);
    setDragY(0);
    setIsDragging(false);
    setSwipePreview(null);
    if (voteTimeoutRef.current) {
      window.clearTimeout(voteTimeoutRef.current);
      voteTimeoutRef.current = null;
    }
  }, [item.id]);

  useEffect(
    () => () => {
      if (voteTimeoutRef.current) {
        window.clearTimeout(voteTimeoutRef.current);
      }
    },
    [],
  );

  function resetCardPosition() {
    setDragX(0);
    setDragY(0);
    setIsDragging(false);
    setSwipePreview(null);
  }

  function commitSwipe(decision: SwipeDecision, dy: number) {
    setIsDragging(false);
    setSwipePreview(decision);
    const exitOffset = Math.max(window.innerWidth * 0.9, 360);
    setDragX(decision === "agree" ? exitOffset : -exitOffset);
    setDragY(Math.max(-24, Math.min(24, dy * 0.25)));
    if (voteTimeoutRef.current) {
      window.clearTimeout(voteTimeoutRef.current);
    }
    voteTimeoutRef.current = window.setTimeout(() => {
      onVote(decision);
      resetCardPosition();
      voteTimeoutRef.current = null;
    }, 130);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (voteTimeoutRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as Element | null;
    if (
      target?.closest(
        "button,a,input,textarea,select,summary,[role='button'],[role='link'],[data-swipe-no-drag]",
      )
    ) {
      return;
    }
    const now = performance.now();
    gestureRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startTs: now,
      lastX: event.clientX,
      lastTs: now,
      axis: null,
    };
    setIsDragging(false);
    setDragX(0);
    setDragY(0);
    setSwipePreview(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;

    if (gesture.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? "x" : "y";
    }

    if (gesture.axis !== "x") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    gesture.lastX = event.clientX;
    gesture.lastTs = performance.now();
    setIsDragging(true);
    setDragX(dx);
    setDragY(Math.max(-18, Math.min(18, dy * 0.3)));

    if (Math.abs(dx) >= 28) {
      setSwipePreview(dx > 0 ? "agree" : "disagree");
    } else {
      setSwipePreview(null);
    }
  }

  function finishPointer(event: PointerEvent<HTMLElement>, cancelled = false) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (cancelled || gesture.axis !== "x") {
      resetCardPosition();
      return;
    }

    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const cardWidth = cardRef.current?.offsetWidth ?? window.innerWidth;
    const totalDuration = performance.now() - gesture.startTs;
    const decision = resolveSwipeGestureDecision({
      dx,
      dy,
      cardWidth,
      durationMs: totalDuration,
    });
    if (!decision) {
      resetCardPosition();
      return;
    }

    commitSwipe(decision, dy);
  }

  const rotate = dragX / 34;
  const opacity = Math.max(0.86, 1 - Math.abs(dragX) / 620);

  return (
    <article
      ref={cardRef}
      className={`relative min-h-[520px] overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)] backdrop-blur touch-pan-y will-change-transform ${
        swipePreview === "agree"
          ? "ring-2 ring-emerald-300/70"
          : swipePreview === "disagree"
            ? "ring-2 ring-rose-300/70"
            : ""
      }`}
      style={{
        transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotate}deg)`,
        opacity,
        transition: isDragging
          ? "none"
          : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, box-shadow 220ms ease",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointer(event)}
      onPointerCancel={(event) => finishPointer(event, true)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_120%_at_0%_0%,rgba(56,189,248,0.1),rgba(15,23,42,0)_45%),radial-gradient(90%_110%_at_100%_100%,rgba(16,185,129,0.08),rgba(15,23,42,0)_40%)]" />
      <div className="pointer-events-none absolute -top-20 -right-12 h-44 w-44 rounded-full bg-sky-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-emerald-500/12 blur-3xl" />
      {swipePreview ? (
        <div
          className={`pointer-events-none absolute inset-0 ${
            swipePreview === "agree" ? "bg-emerald-300/12" : "bg-rose-300/12"
          }`}
        />
      ) : null}

      <div className="relative flex flex-wrap items-center gap-2 text-xs">
        <span className="vog-chip vog-chip--active">Thema {step}</span>
        {chips.map((chip) => (
          <span key={chip} className="vog-chip">
            {chip}
          </span>
        ))}
      </div>
      <h2 className="relative mt-3 text-2xl font-semibold leading-tight tracking-tight text-[rgb(var(--fg))] md:text-[2rem]">
        {item.title}
      </h2>
      {item.text ? <p className="relative mt-2 text-[15px] text-[rgb(var(--muted))]">{item.text}</p> : null}
      <p className="relative mt-2 text-xs text-[rgb(var(--muted))] md:hidden">
        Wische links/rechts für Nein/Ja oder nutze die fixe Leiste unten.
      </p>

      <div className="relative mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <MetaCard label="Zuständigkeit" value={item.responsibilityLabel.replace(/^Zuständigkeit:\\s*/i, "")} />
        <MetaCard label="Evidenz" value={`${item.evidenceCount} Quellenhinweise`} />
        <MetaCard label="Eventualitäten" value={`${item.eventualitiesCount} Varianten`} />
      </div>

      {onQuickFollowup ? (
        <div className="relative mt-3 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => onQuickFollowup("more_context")}
            className="vog-chip"
            data-swipe-no-drag
          >
            🤔 Mehr Kontext
          </button>
          <button
            type="button"
            onClick={() => onQuickFollowup("variants")}
            className="vog-chip"
            data-swipe-no-drag
          >
            ⚖️ Varianten
          </button>
          <button
            type="button"
            onClick={() => onQuickFollowup("later")}
            className="vog-chip"
            data-swipe-no-drag
          >
            ⏭️ Später vertiefen
          </button>
        </div>
      ) : null}

      <div className="relative mt-3 hidden grid-cols-3 gap-2 md:grid">
        <button
          type="button"
          onClick={() => onVote("disagree")}
          className="btn-vote btn-vote-disagree rounded-xl px-3 py-2 text-sm"
        >
          <span className="mr-1" aria-hidden>
            👎
          </span>
          Ablehnen
        </button>
        <button
          type="button"
          onClick={() => onVote("neutral")}
          className="btn-vote btn-vote-neutral rounded-xl px-3 py-2 text-sm"
        >
          <span className="mr-1" aria-hidden>
            😐
          </span>
          Neutral
        </button>
        <button
          type="button"
          onClick={() => onVote("agree")}
          className="btn-vote btn-vote-agree rounded-xl px-3 py-2 text-sm"
        >
          <span className="mr-1" aria-hidden>
            👍
          </span>
          Zustimmen
        </button>
      </div>
    </article>
  );
}

function buildMetaChips(item: SwipeItem) {
  const normalizedTitle = normalize(item.title);
  const values = [item.level, item.category, item.domainLabel, item.topicTags[0]]
    .map((entry) => entry?.trim())
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry) => {
      const normalized = normalize(entry);
      return normalized !== normalizedTitle;
    });
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique.slice(0, 2);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9äöüß]+/g, "");
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-gradient-to-b from-[rgb(var(--bg))] to-[rgb(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}
