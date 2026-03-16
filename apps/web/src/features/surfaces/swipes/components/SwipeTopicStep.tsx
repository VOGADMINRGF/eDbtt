import { useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { SwipeDecision, SwipeItem } from "@/features/swipes/types";

type SwipeTopicStepProps = {
  item: SwipeItem;
  onMore: () => void;
  onVote: (decision: SwipeDecision) => void;
  step?: number;
};

export function SwipeTopicStep({ item, onMore, onVote, step = 1 }: SwipeTopicStepProps) {
  const chips = buildMetaChips(item);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [swipePreview, setSwipePreview] = useState<SwipeDecision | null>(null);

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSwipePreview(null);
  }

  function handleTouchMove(event: TouchEvent) {
    const start = touchStartRef.current;
    const touch = event.touches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 28 || Math.abs(dx) <= Math.abs(dy)) {
      setSwipePreview(null);
      return;
    }
    setSwipePreview(dx > 0 ? "agree" : "disagree");
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) {
      setSwipePreview(null);
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const isHorizontalSwipe = Math.abs(dx) >= 72 && Math.abs(dx) > Math.abs(dy) * 1.2;
    setSwipePreview(null);
    if (!isHorizontalSwipe) return;
    onVote(dx > 0 ? "agree" : "disagree");
  }

  return (
    <article
      className={`relative overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)] backdrop-blur touch-pan-y ${
        swipePreview === "agree"
          ? "ring-2 ring-emerald-300/70"
          : swipePreview === "disagree"
            ? "ring-2 ring-rose-300/70"
            : ""
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
        setSwipePreview(null);
      }}
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

      <div className="relative mt-3">
        <button
          type="button"
          onClick={onMore}
          className="w-full rounded-xl border border-sky-300/80 bg-gradient-to-r from-sky-50/95 to-cyan-50/85 px-3 py-2.5 text-left text-sm font-semibold text-sky-700 shadow-[0_10px_24px_rgba(14,165,233,0.12)] transition hover:from-sky-100 hover:to-cyan-100 dark:border-sky-400/30 dark:from-sky-500/14 dark:to-cyan-500/10 dark:text-sky-200 md:hidden"
        >
          Mehr Kontext öffnen: Dossier, Evidenz und Varianten
        </button>
      </div>

      <div className="relative mt-3 hidden grid-cols-3 gap-2 md:grid">
        <button
          type="button"
          onClick={() => onVote("disagree")}
          className="rounded-xl border border-rose-300/70 bg-gradient-to-r from-rose-100 to-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:brightness-105 dark:border-rose-400/40 dark:from-rose-500/20 dark:to-rose-500/10 dark:text-rose-100"
        >
          <span className="mr-1" aria-hidden>
            👎
          </span>
          Ablehnen
        </button>
        <button
          type="button"
          onClick={() => onVote("neutral")}
          className="rounded-xl border border-slate-300/80 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:brightness-105 dark:border-slate-500/45 dark:bg-slate-500/16 dark:text-slate-100"
        >
          <span className="mr-1" aria-hidden>
            😐
          </span>
          Neutral
        </button>
        <button
          type="button"
          onClick={() => onVote("agree")}
          className="rounded-xl border border-emerald-300/70 bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:brightness-105 dark:border-emerald-400/40 dark:from-emerald-500/20 dark:to-emerald-500/10 dark:text-emerald-100"
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
