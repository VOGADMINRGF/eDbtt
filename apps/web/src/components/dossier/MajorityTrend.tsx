"use client";

import { useEffect, useMemo, useState } from "react";

type VoteOption = { id: string; label: string };

type MajorityDemo = { id: string; pct: number };

type MajorityTrendProps = {
  dossierId: string;
  options: VoteOption[];
  majorityDemo: MajorityDemo[];
};

export function MajorityTrend({ dossierId, options, majorityDemo }: MajorityTrendProps) {
  const storageKey = `dossierVote:${dossierId}`;
  const [userVote, setUserVote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setUserVote(stored);
  }, [storageKey]);

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

  const userRelation = useMemo(() => {
    if (!userVote) return null;
    const userPct = majorityById.get(userVote);
    if (userPct === undefined) return null;
    if (userPct === stats.max) return "Ihre Auswahl entspricht der höchsten Tendenz.";
    if (userPct < stats.max) return "Ihre Auswahl liegt aktuell unter der höchsten Tendenz.";
    return "Ihre Auswahl liegt aktuell über der höchsten Tendenz.";
  }, [userVote, majorityById, stats.max]);

  return (
    <div className="vog-card p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Mehrheitstendenz (Demonstration)
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Aggregierte Werte sind in dieser Demo simuliert.
        </p>
      </div>

      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const pct = majorityById.get(option.id) ?? 0;
          const isTop = stats.topOption === option.id;
          const isUser = userVote === option.id;
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
      {userRelation ? <div className="text-[11px] text-[rgb(var(--muted))]">{userRelation}</div> : null}
    </div>
  );
}

export default MajorityTrend;
