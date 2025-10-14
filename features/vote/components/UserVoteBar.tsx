"use client";
import { useEffect, useMemo, useState } from "react";
import { useVoteStream } from "../hooks/useVoteStream";

const colors = {
  agree: "#04bfbf",
  neutral: "#ffd166",
  disagree: "#ef476f",
  fallback: "#bdbdbd",
} as const;

type Totals = {
  agree: number; neutral: number; disagree: number; total: number;
  pctAgree: number; pctNeutral: number; pctDisagree: number;
};

export default function UserVoteBar({ statementId }: { statementId: string }) {
  const live = useVoteStream(statementId);

  const [totals, setTotals] = useState<Totals | null>(null);
  const [userVote, setUserVote] = useState<"agree"|"neutral"|"disagree"|null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 1) initial fetches
  useEffect(() => {
    let alive = true;

    // user vote (serverseitig ermittelt; keine userHash-Query)
    setLoadingUser(true);
    fetch(`/api/vote/user?statementId=${encodeURIComponent(statementId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { if (alive) setUserVote(d.vote); })
      .finally(()=> alive && setLoadingUser(false));

    // totals
    fetch(`/api/vote/stats/${encodeURIComponent(statementId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { if (alive) setTotals(d.stats.totals as Totals); })
      .catch(()=>{});

    return () => { alive = false; };
  }, [statementId]);

  // 2) Re-fetch totals on live event (debounced im Hook)
  useEffect(() => {
    if (!live || live.statementId !== statementId) return;
    let alive = true;
    fetch(`/api/vote/stats/${encodeURIComponent(statementId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { if (alive) setTotals(d.stats.totals as Totals); })
      .catch(()=>{});
    return () => { alive = false; };
  }, [live, statementId]);

  // „Deine Stimme“-Chip
  const chip = useMemo(() => {
    const c = userVote ?? "fallback";
    const map = {
      agree:  { text: "Zustimmung", icon: "👍", color: colors.agree },
      neutral:{ text: "Neutral",    icon: "🤔", color: colors.neutral },
      disagree:{text: "Ablehnung",  icon: "👎", color: colors.disagree },
      fallback:{text:"Keine Stimme",icon: "–",  color: colors.fallback },
    } as const;
    return map[c as keyof typeof map];
  }, [userVote]);

  const Bar = ({ v, label }: { v:number; label:string }) => (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full bg-neutral-200 rounded">
        <div className="h-2 rounded" style={{ width: `${v}%` }} />
      </div>
      <span className="w-16 text-right tabular-nums">{v.toFixed(1)}%</span>
      <span className="w-20">{label}</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Statuschip */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
        aria-live="polite"
        style={{
          background: "#f6f7fa",
          border: `1.5px solid ${chip.color}`,
          color: chip.color,
          minWidth: 110,
          opacity: loadingUser ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
        title={loadingUser ? "Lade deine Stimme…" : `Deine Stimme: ${chip.text}`}
      >
        <span className="mr-1 text-neutral-500">Deine&nbsp;Stimme:</span>
        <span className="flex items-center font-bold">
          {chip.icon} <span className="ml-1">{chip.text}</span>
        </span>
      </div>

      {/* Totals */}
      {!totals ? (
        <div className="text-sm opacity-70">Lade Abstimmung…</div>
      ) : (
        <div className="space-y-2">
          <Bar v={totals.pctAgree} label="Zustimmung" />
          <Bar v={totals.pctNeutral} label="Neutral" />
          <Bar v={totals.pctDisagree} label="Ablehnung" />
          <div className="text-xs opacity-70">Gesamt: {totals.total}</div>
        </div>
      )}
    </div>
  );
}
