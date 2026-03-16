import { useEffect, useMemo, useState } from "react";
import type { Eventuality, SwipeDecision, SwipeItem } from "@/features/swipes/types";

type SwipeEventualitiesStepProps = {
  open: boolean;
  item: SwipeItem | null;
  decision: SwipeDecision | null;
  eventualities: Eventuality[];
  loading: boolean;
  voteFeedback?: string | null;
  onSelect: (selection: {
    eventualityId: string;
    variantWeight: 1 | 3 | 5;
    variantReason?: string;
    variantRankedIds?: string[];
    excludedEventualityIds?: string[];
  }) => void;
  onSkip: () => void;
  onOpenDetail: () => void;
};

const TITLE_BY_DECISION: Record<SwipeDecision, string> = {
  agree: "Welche Variante passt am besten?",
  disagree: "Wenn überhaupt: welche Variante wäre noch vertretbar?",
  neutral: "Welche Variante ist aktuell am plausibelsten?",
};

const LEAD_BY_DECISION: Record<SwipeDecision, string> = {
  agree: "Du bist eher zustimmend. Priorisiere jetzt die passende Ausgestaltung.",
  disagree: "Du bist eher ablehnend. Optional kannst du eine engere Variante markieren.",
  neutral: "Du bist noch offen. Sortiere die Varianten nach Plausibilität.",
};

const DECISION_BADGE_CLASS: Record<SwipeDecision, string> = {
  agree: "border-emerald-300/55 bg-emerald-500/16 text-emerald-100",
  disagree: "border-rose-300/55 bg-rose-500/16 text-rose-100",
  neutral: "border-sky-300/55 bg-sky-500/16 text-sky-100",
};

const DECISION_BADGE_LABEL: Record<SwipeDecision, string> = {
  agree: "Grundhaltung: eher zustimmend",
  disagree: "Grundhaltung: eher ablehnend",
  neutral: "Grundhaltung: offen",
};

const WEIGHT_OPTIONS = [
  { value: 1 as const, label: "Niedrig" },
  { value: 3 as const, label: "Mittel" },
  { value: 5 as const, label: "Hoch" },
];

function labelForWeight(value: 1 | 3 | 5) {
  if (value === 5) return "Hoch";
  if (value === 3) return "Mittel";
  return "Niedrig";
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function SwipeEventualitiesStep({
  open,
  item,
  decision,
  eventualities,
  loading,
  voteFeedback,
  onSelect,
  onSkip,
  onOpenDetail,
}: SwipeEventualitiesStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [variantWeights, setVariantWeights] = useState<Record<string, 1 | 3 | 5>>({});
  const [excludedIds, setExcludedIds] = useState<Record<string, boolean>>({});
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [variantReason, setVariantReason] = useState("");

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setVariantWeights({});
    setExcludedIds({});
    setOrderedIds([]);
    setVariantReason("");
  }, [open, item?.id, decision]);

  const eventualityById = useMemo(() => {
    const map: Record<string, Eventuality> = {};
    for (const evt of eventualities) {
      map[evt.id] = evt;
    }
    return map;
  }, [eventualities]);

  const rankedVariants = useMemo(
    () => orderedIds.map((id) => eventualityById[id]).filter((evt): evt is Eventuality => Boolean(evt) && !excludedIds[evt.id]),
    [eventualityById, excludedIds, orderedIds],
  );

  const excludedVariants = useMemo(() => eventualities.filter((evt) => excludedIds[evt.id]), [eventualities, excludedIds]);

  const selectedVariant = useMemo(() => {
    if (selectedId && !excludedIds[selectedId] && eventualityById[selectedId]) return eventualityById[selectedId];
    return rankedVariants[0] ?? null;
  }, [eventualityById, excludedIds, rankedVariants, selectedId]);

  const selectedWeight: 1 | 3 | 5 = selectedVariant ? (variantWeights[selectedVariant.id] ?? 3) : 3;

  function activateVariant(eventualityId: string) {
    setSelectedId(eventualityId);
    setExcludedIds((prev) => ({ ...prev, [eventualityId]: false }));
    setVariantWeights((prev) => (prev[eventualityId] ? prev : { ...prev, [eventualityId]: 3 }));
    setOrderedIds((prev) => (prev.includes(eventualityId) ? prev : [...prev, eventualityId]));
  }

  function setWeightForVariant(eventualityId: string, weight: 1 | 3 | 5) {
    activateVariant(eventualityId);
    setVariantWeights((prev) => ({ ...prev, [eventualityId]: weight }));
  }

  function toggleExclude(eventualityId: string) {
    const willExclude = !excludedIds[eventualityId];
    setExcludedIds((prev) => ({ ...prev, [eventualityId]: willExclude }));
    if (willExclude) {
      setOrderedIds((prev) => prev.filter((id) => id !== eventualityId));
      if (selectedId === eventualityId) setSelectedId(null);
      return;
    }
    activateVariant(eventualityId);
  }

  function moveVariant(eventualityId: string, direction: -1 | 1) {
    setOrderedIds((prev) => {
      const currentIndex = prev.indexOf(eventualityId);
      if (currentIndex < 0) return prev;
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      return reorder(prev, currentIndex, targetIndex);
    });
  }

  if (!open || !item || !decision) return null;

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
      <section className="absolute inset-x-0 bottom-0 flex h-[82dvh] flex-col overflow-hidden rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-[0_-24px_60px_rgba(2,6,23,0.45)] md:bottom-8 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-[700px] md:-translate-x-1/2 md:rounded-3xl md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_110%_at_100%_0%,rgba(14,165,233,0.12),rgba(15,23,42,0)_45%)]" />

        <div className="relative shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Varianten-Schritt</p>
              <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{TITLE_BY_DECISION[decision]}</h3>
            </div>
            <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
              Schritt 2/2
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${DECISION_BADGE_CLASS[decision]}`}>
              {DECISION_BADGE_LABEL[decision]}
            </span>
            {voteFeedback ? (
              <span className="rounded-full border border-sky-300/45 bg-sky-500/14 px-2 py-1 text-[10px] font-semibold text-sky-100">
                {voteFeedback}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{LEAD_BY_DECISION[decision]}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">Tippen wählt. Hoch/Mittel/Niedrig priorisiert. Ausschließen entfernt aus der Reihenfolge.</p>
        </div>

        <div className="relative mt-2 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1" style={{ WebkitOverflowScrolling: "touch" }}>
          {loading ? (
            <p className="text-sm text-[rgb(var(--muted))]">Lade Eventualitäten …</p>
          ) : eventualities.length > 0 ? (
            <div className="grid gap-2">
              {eventualities.slice(0, 4).map((evt) => {
                const isSelected = selectedId === evt.id;
                const isExcluded = Boolean(excludedIds[evt.id]);
                const rank = rankedVariants.findIndex((entry) => entry.id === evt.id);
                const currentWeight = variantWeights[evt.id];

                return (
                  <article
                    key={evt.id}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      isExcluded
                        ? "border-rose-300/50 bg-rose-500/8"
                        : isSelected
                          ? "border-sky-300/90 bg-gradient-to-r from-sky-500/24 via-cyan-500/12 to-transparent shadow-[0_12px_24px_rgba(14,165,233,0.22)]"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] hover:border-sky-300/70 hover:bg-sky-500/8"
                    }`}
                  >
                    <button type="button" onClick={() => activateVariant(evt.id)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{evt.shortLabel || evt.title}</p>
                        <div className="flex items-center gap-1.5">
                          {rank >= 0 ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-300/50 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100">
                              #{rank + 1}
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                              isExcluded
                                ? "border-rose-300/60 bg-rose-500/16 text-rose-100"
                                : isSelected
                                  ? "border-sky-300/80 bg-sky-500/20 text-sky-100"
                                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
                            }`}
                          >
                            {isExcluded ? "Ausgeschlossen" : isSelected ? "Markiert" : "Auswahl"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {evt.description ? <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--muted))]">{evt.description}</p> : null}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {WEIGHT_OPTIONS.map((option) => {
                        const active = currentWeight === option.value && !isExcluded;
                        return (
                          <button
                            key={`${evt.id}-${option.value}`}
                            type="button"
                            disabled={isExcluded}
                            onClick={() => setWeightForVariant(evt.id, option.value)}
                            className={
                              active
                                ? "rounded-full border border-emerald-300/80 bg-gradient-to-r from-emerald-500/22 to-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 shadow-[0_8px_18px_rgba(16,185,129,0.24)]"
                                : "rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 text-[11px] font-medium text-[rgb(var(--muted))] hover:border-emerald-400/40 hover:text-[rgb(var(--fg))] disabled:opacity-40"
                            }
                          >
                            {option.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        disabled={isExcluded || rank <= 0}
                        onClick={() => moveVariant(evt.id, -1)}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[11px] font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={isExcluded || rank < 0 || rank >= rankedVariants.length - 1}
                        onClick={() => moveVariant(evt.id, 1)}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[11px] font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExclude(evt.id)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          isExcluded
                            ? "border-emerald-300/60 bg-emerald-500/14 text-emerald-100"
                            : "border-rose-300/60 bg-rose-500/12 text-rose-100"
                        }`}
                      >
                        {isExcluded ? "Wieder aufnehmen" : "Ausschließen"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">
              Für dieses Thema liegen aktuell keine Varianten vor. Du kannst direkt zum nächsten Thema wechseln.
            </p>
          )}

          {rankedVariants.length > 0 ? (
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Aktuelle Reihenfolge</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {rankedVariants.map((evt, index) => (
                  <span key={`rank-${evt.id}`} className="rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                    {index + 1}. {evt.shortLabel || evt.title} ({labelForWeight(variantWeights[evt.id] ?? 3)})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {excludedVariants.length > 0 ? (
            <div className="mt-2 rounded-xl border border-rose-300/30 bg-rose-500/8 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-100">Ausgeschlossen</p>
              <p className="mt-1 text-xs text-rose-100/80">
                {excludedVariants.map((evt) => evt.shortLabel || evt.title).join(", ")}
              </p>
            </div>
          ) : null}

          {selectedVariant ? (
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-gradient-to-b from-[rgb(var(--bg))] to-[rgb(var(--card))] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Kurzbegründung für „{selectedVariant.shortLabel || selectedVariant.title}“ (optional)
              </p>
              <label className="mt-2 block text-xs text-[rgb(var(--muted))]">
                Warum ist diese Variante für dich aktuell am sinnvollsten?
                <textarea
                  value={variantReason}
                  onChange={(event) => setVariantReason(event.target.value)}
                  placeholder="Kurz begründen ..."
                  className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-sky-200"
                  rows={2}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="relative mt-3 shrink-0 -mx-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur md:-mx-4 md:px-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!selectedVariant}
              onClick={() => {
                if (!selectedVariant) return;
                onSelect({
                  eventualityId: selectedVariant.id,
                  variantWeight: selectedWeight,
                  variantReason: variantReason.trim() || undefined,
                  variantRankedIds: rankedVariants.map((evt) => evt.id),
                  excludedEventualityIds: excludedVariants.map((evt) => evt.id),
                });
              }}
              className="btn-primary min-h-[44px] min-w-[190px] text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Variante speichern
            </button>
            <button type="button" onClick={onSkip} className="btn-secondary min-h-[44px] text-sm">
              Varianten überspringen
            </button>
            <button type="button" onClick={onOpenDetail} className="btn-secondary min-h-[44px] text-sm">
              Mehr Kontext
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
