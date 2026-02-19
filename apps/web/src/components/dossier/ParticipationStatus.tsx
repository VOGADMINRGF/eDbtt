"use client";

import { useMemo } from "react";

type VoteOption = { id: string; label: string };

type MajorityDemo = { id: string; pct: number };

type VoteHistoryItem = { date: string; text: string };

type ParticipationStatusProps = {
  options: VoteOption[];
  majorityDemo: MajorityDemo[];
  savedOptionId: string | null;
  savedAt: string | null;
  totalVotes?: number;
  updatedAt?: string;
  history?: VoteHistoryItem[];
  showUserVote?: boolean;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ParticipationStatus({
  options,
  majorityDemo,
  savedOptionId,
  savedAt,
  totalVotes,
  updatedAt,
  history,
  showUserVote = true,
}: ParticipationStatusProps) {
  const labelById = useMemo(() => new Map(options.map((opt) => [opt.id, opt.label])), [options]);
  const majorityById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of majorityDemo) map.set(item.id, item.pct);
    return map;
  }, [majorityDemo]);

  const stats = useMemo(() => {
    const values = majorityDemo.map((item) => item.pct);
    const max = values.length ? Math.max(...values) : 0;
    const min = values.length ? Math.min(...values) : 0;
    const spread = Math.round(max - min);
    const topOption = majorityDemo.find((item) => item.pct === max)?.id ?? null;
    return { max, min, spread, topOption };
  }, [majorityDemo]);

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => (majorityById.get(b.id) ?? 0) - (majorityById.get(a.id) ?? 0));
  }, [options, majorityById]);

  const selectedLabel = savedOptionId ? labelById.get(savedOptionId) ?? savedOptionId : null;

  const historyItems = history?.length
    ? history
    : [
        { date: "2026-02-19", text: "Dossierstart und Eröffnung der Beteiligung" },
        { date: "2026-02-20", text: "Neue Quelle hinzugefügt" },
        { date: "2026-02-21", text: "Frage delegiert an die zuständige Stelle" },
      ];

  return (
    <div className="vog-card p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Beteiligungsstatus
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Mehrheitslage und Verlauf werden in dieser Demo simuliert.
        </p>
      </div>

      {showUserVote ? (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">Deine Stimme</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            {selectedLabel ?? "Keine Stimme gespeichert"}
          </p>
          <p className="text-[11px] text-[rgb(var(--muted))]">Gespeichert am: {formatDateTime(savedAt)}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="font-semibold text-[rgb(var(--fg))]">Mehrheitslage (Demonstration)</span>
          <span>Stimmen insgesamt: {totalVotes ?? "—"}</span>
        </div>
        <div className="text-[11px] text-[rgb(var(--muted))]">Letzte Aktualisierung: {formatDate(updatedAt)}</div>
      </div>

      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const pct = majorityById.get(option.id) ?? 0;
          const isTop = stats.topOption === option.id;
          const isUser = savedOptionId === option.id;
          return (
            <div key={`trend-${option.id}`} className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
                <span className="font-semibold text-[rgb(var(--fg))]">{option.label}</span>
                <span>{pct}%</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-[rgb(var(--border))]">
                <div
                  className="h-2 rounded-full bg-brand-grad transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
                {isTop ? (
                  <span
                    className="absolute -top-4 text-[10px] text-[rgb(var(--muted))]"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                  >
                    ▲
                  </span>
                ) : null}
                {isUser ? (
                  <span
                    className="absolute -top-1.5 text-[12px] text-[rgb(var(--fg))]"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                  >
                    ●
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[rgb(var(--muted))]">
        Verteilungsspanne: {stats.spread} Prozentpunkte
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Verlauf</p>
        <ul className="space-y-1 text-[11px] text-[rgb(var(--muted))]">
          {historyItems.map((item) => (
            <li key={`${item.date}-${item.text}`}>{formatDate(item.date)}: {item.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ParticipationStatus;
