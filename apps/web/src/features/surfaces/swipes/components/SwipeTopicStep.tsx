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
  const coreThesis = resolveCoreThesis(item.text);
  const cardRef = useRef<HTMLElement | null>(null);
  const gestureRef = useRef<{ pointerId: number; x: number; y: number; startTs: number; lastX: number; lastTs: number; axis: "x" | "y" | null } | null>(null);
  const voteTimeoutRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipePreview, setSwipePreview] = useState<SwipeDecision | null>(null);

  useEffect(() => {
    setDragX(0); setDragY(0); setIsDragging(false); setSwipePreview(null);
    if (voteTimeoutRef.current) { window.clearTimeout(voteTimeoutRef.current); voteTimeoutRef.current = null; }
  }, [item.id]);

  useEffect(() => () => { if (voteTimeoutRef.current) window.clearTimeout(voteTimeoutRef.current); }, []);

  function resetCardPosition() { setDragX(0); setDragY(0); setIsDragging(false); setSwipePreview(null); }
  function commitSwipe(decision: SwipeDecision, dy: number) {
    setIsDragging(false); setSwipePreview(decision);
    const exitOffset = Math.max(window.innerWidth * 0.9, 360);
    setDragX(decision === "agree" ? exitOffset : -exitOffset);
    setDragY(Math.max(-24, Math.min(24, dy * 0.25)));
    if (voteTimeoutRef.current) window.clearTimeout(voteTimeoutRef.current);
    voteTimeoutRef.current = window.setTimeout(() => { onVote(decision); resetCardPosition(); voteTimeoutRef.current = null; }, 130);
  }
  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (voteTimeoutRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = event.target as Element | null;
    if (target?.closest("button,a,input,textarea,select,summary,[role='button'],[role='link'],[data-swipe-no-drag]")) return;
    const now = performance.now();
    gestureRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startTs: now, lastX: event.clientX, lastTs: now, axis: null };
    setIsDragging(false); setDragX(0); setDragY(0); setSwipePreview(null); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current; if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x; const dy = event.clientY - gesture.y;
    if (gesture.axis === null) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; gesture.axis = Math.abs(dx) > Math.abs(dy) * 1.1 ? "x" : "y"; }
    if (gesture.axis !== "x") return;
    if (event.cancelable) event.preventDefault();
    gesture.lastX = event.clientX; gesture.lastTs = performance.now(); setIsDragging(true); setDragX(dx); setDragY(Math.max(-18, Math.min(18, dy * 0.3)));
    setSwipePreview(Math.abs(dx) >= 28 ? (dx > 0 ? "agree" : "disagree") : null);
  }
  function finishPointer(event: PointerEvent<HTMLElement>, cancelled = false) {
    const gesture = gestureRef.current; if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled || gesture.axis !== "x") { resetCardPosition(); return; }
    const dx = event.clientX - gesture.x; const dy = event.clientY - gesture.y;
    const decision = resolveSwipeGestureDecision({ dx, dy, cardWidth: cardRef.current?.offsetWidth ?? window.innerWidth, durationMs: performance.now() - gesture.startTs });
    if (!decision) { resetCardPosition(); return; }
    commitSwipe(decision, dy);
  }

  const rotate = dragX / 34;
  const opacity = Math.max(0.86, 1 - Math.abs(dragX) / 620);

  return (
    <article ref={cardRef} className={`relative min-h-[480px] overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.2)] backdrop-blur touch-pan-y will-change-transform ${swipePreview === "agree" ? "ring-2 ring-emerald-300/70" : swipePreview === "disagree" ? "ring-2 ring-rose-300/70" : ""}`}
      style={{ transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotate}deg)`, opacity, transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, box-shadow 220ms ease" }}
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={(event) => finishPointer(event)} onPointerCancel={(event) => finishPointer(event, true)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_120%_at_0%_0%,rgba(56,189,248,0.1),rgba(15,23,42,0)_45%),radial-gradient(90%_110%_at_100%_100%,rgba(16,185,129,0.08),rgba(15,23,42,0)_40%)]" />
      {swipePreview ? <div className={`pointer-events-none absolute inset-0 ${swipePreview === "agree" ? "bg-emerald-300/12" : "bg-rose-300/12"}`} /> : null}

      <div className="relative flex flex-wrap items-center gap-2 text-xs">
        <span className="vog-chip vog-chip--active">Frage {step}</span>
        {chips.map((chip) => <span key={chip} className="vog-chip">{chip}</span>)}
      </div>
      <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Was meinst du?</p>
      <h2 className="relative mt-3 text-2xl font-semibold leading-tight tracking-tight text-[rgb(var(--fg))] md:text-[2rem]">{item.title}</h2>
      {coreThesis ? <p className="relative mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{coreThesis}</p> : null}
      {item.supplyLabel ? <p className="relative mt-4 text-xs text-[rgb(var(--muted))]">Warum hier? {item.supplyLabel}{item.supplyHint ? ` · ${item.supplyHint}` : ""}</p> : null}

      <div className="relative mt-7 flex items-center justify-center gap-3" data-swipe-no-drag>
        <button type="button" onClick={() => onVote("disagree")} className="btn-vote btn-vote-disagree min-h-12 rounded-full px-5 text-sm font-semibold" aria-label="Nein">← Nein</button>
        {onQuickFollowup ? <button type="button" onClick={() => onQuickFollowup("more_context")} className="min-h-12 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-5 text-sm font-semibold text-[rgb(var(--fg))]" data-swipe-no-drag>Mehr erfahren</button> : null}
        <button type="button" onClick={() => onVote("agree")} className="btn-vote btn-vote-agree min-h-12 rounded-full px-5 text-sm font-semibold" aria-label="Ja">Ja →</button>
      </div>
      <div className="relative mt-3 flex justify-center">
        <button type="button" onClick={() => onVote("neutral")} className="text-xs font-semibold text-[rgb(var(--muted))] underline-offset-4 hover:underline">Noch offen / weiß ich nicht</button>
      </div>
      <p className="relative mt-5 text-center text-xs text-[rgb(var(--muted))]">Wischen: links Nein · rechts Ja · nach oben bzw. „Mehr erfahren“ für Hintergründe.</p>

      {onQuickFollowup ? <div className="relative mt-5 flex flex-wrap justify-center gap-2 border-t border-[rgb(var(--border))] pt-4 text-xs">
        <button type="button" onClick={() => onQuickFollowup("variants")} className="vog-chip" data-swipe-no-drag>Andere Möglichkeiten</button>
        <button type="button" onClick={() => onQuickFollowup("later")} className="vog-chip" data-swipe-no-drag>Für später speichern</button>
      </div> : null}
    </article>
  );
}

function buildMetaChips(item: SwipeItem) {
  const normalizedTitle = normalize(item.title);
  const values = [item.level, item.category, item.domainLabel, item.topicTags[0]].map((entry) => entry?.trim()).filter((entry): entry is string => Boolean(entry)).filter((entry) => normalize(entry) !== normalizedTitle);
  const seen = new Set<string>(); const unique: string[] = [];
  for (const value of values) { const key = normalize(value); if (seen.has(key)) continue; seen.add(key); unique.push(value); }
  return unique.slice(0, 2);
}
function normalize(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9äöüß]+/g, ""); }
function resolveCoreThesis(text?: string) { if (!text) return null; const trimmed = text.trim(); if (!trimmed) return null; const [firstSentence] = trimmed.split(/(?<=[.!?])\s+/); return firstSentence ?? trimmed; }
