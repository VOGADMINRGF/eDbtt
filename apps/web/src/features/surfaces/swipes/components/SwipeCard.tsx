import { useCallback, useRef, useState } from "react";
import StatementCard, { type StatementVote } from "@/components/statements/StatementCard";
import type { SwipeDecision, SwipeItem } from "@/features/swipes/types";

function isInteractiveTarget(target: unknown) {
  if (!target || typeof target !== "object" || !("closest" in target)) return false;
  return Boolean(
    (target as { closest: (selector: string) => unknown }).closest(
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

export function SwipeableCardShell({
  onRequestActive,
  onOpen,
  onSwipeDecision,
  onSwipeUp,
  children,
}: SwipeableCardShellProps) {
  const ref = useRef<any>(null);
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

  const handlePointerDown = (e: React.PointerEvent<any>) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
    suppressNextClickRef.current = false;
    (e.currentTarget as any).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<any>) => {
    const start = startRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!didDragRef.current) {
      if (absX < 6 && absY < 6) return;
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

    suppressNextClickRef.current = true;
    e.preventDefault();
    setDragX(dx);
  };

  const handlePointerEnd = (e: React.PointerEvent<any>) => {
    if (!startRef.current) return;
    const commitThreshold = 120;
    const dx = dragX;
    const didDrag = didDragRef.current;

    startRef.current = null;
    didDragRef.current = false;
    setDragging(false);

    if (didDrag) suppressNextClickRef.current = true;

    if (didDrag && Math.abs(dx) >= commitThreshold) {
      const decision: SwipeDecision = dx > 0 ? "agree" : "disagree";
      const width = ref.current?.getBoundingClientRect().width ?? 340;
      setDragX(Math.sign(dx) * (width * 1.15));
      window.setTimeout(() => {
        setDragX(0);
        onSwipeDecision(decision);
      }, 160);
      return;
    }

    setDragX(0);
    try {
      (e.currentTarget as any).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
  };

  const handleClick = (e: React.MouseEvent<any>) => {
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
      {hint ? (
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl ring-1 ${
            hint === "agree" ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200"
          }`}
          style={{ opacity: overlayOpacity * 0.6 }}
        />
      ) : null}

      {hint ? (
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
      ) : null}

      {children}
    </div>
  );
}

type SwipeCardProps = {
  item: SwipeItem;
  isActive: boolean;
  flashDecision: SwipeDecision | null;
  onVote: (vote: StatementVote) => void;
  onOpenDetails: () => void;
  onOpenEventualities?: () => void;
};

export function SwipeCard({
  item,
  isActive,
  flashDecision,
  onVote,
  onOpenDetails,
  onOpenEventualities,
}: SwipeCardProps) {
  const cardText = item.text ?? item.title ?? "";
  const badgeRight = item.evidenceCount ? `${item.evidenceCount} Belege` : undefined;

  return (
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
      currentVote={flashDecision ? (flashDecision === "agree" ? "approve" : flashDecision === "disagree" ? "reject" : "neutral") : null}
      flashDecision={flashDecision ? (flashDecision === "agree" ? "approve" : flashDecision === "disagree" ? "reject" : "neutral") : null}
      onVoteChange={onVote}
      className={isActive ? "ring-2 ring-sky-200" : ""}
      isActive={isActive}
      showOpenLink
      onOpenDetails={onOpenDetails}
      onOpenEventualities={onOpenEventualities}
      badgeRight={badgeRight}
    />
  );
}
