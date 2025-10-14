"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import StatementMiniChart from "./StatementMiniChart";
import VoteButtons from "../../vote/components/VoteButton";

type Stats = { votesTotal: number; votesAgree: number; votesNeutral: number; votesDisagree: number };

export default function StatementDetailClient({
  statementId,
  initialStats
}: {
  statementId: string;
  initialStats: Stats;
}) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const timer = useRef<number | null>(null);

  // simple debounce fetch of fresh stats
  const refreshStats = async () => {
    try {
      const r = await fetch(`/api/statements/${statementId}/stats`, { cache: "no-store" });
      const j = await r.json();
      if (r.ok && j?.stats) setStats(j.stats);
    } catch {}
  };

  useEffect(() => {
    // SSE stream
    const es = new EventSource(`/api/votes/stream?statementId=${encodeURIComponent(statementId)}`);
    es.onmessage = () => {
      // throttle: fetch consolidated stats (korrekt bei Vote-Änderungen)
      if (timer.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        refreshStats();
      }, 600);
    };
    es.onerror = () => { /* ignore: browser reconnects */ };
    return () => { es.close(); if (timer.current) window.clearTimeout(timer.current); };
  }, [statementId]);

  const pct = useMemo(() => {
    const total = stats.votesTotal || 1;
    return {
      agree: Math.round((stats.votesAgree / total) * 100),
      neutral: Math.round((stats.votesNeutral / total) * 100),
      disagree: Math.round((stats.votesDisagree / total) * 100),
    };
  }, [stats]);

  return (
    <section className="bg-white border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-3 w-full bg-neutral-100 rounded overflow-hidden">
            <div className="h-full" style={{ width: `${pct.agree}%` }} />
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {stats.votesTotal} Stimmen · {pct.agree}% Zustimmung · {pct.neutral}% neutral · {pct.disagree}% ablehnend
          </div>
        </div>
        <VoteButtons
          statementId={statementId}
          onAfter={() => refreshStats()}
        />
      </div>

      <div className="pt-2">
        <StatementMiniChart statementId={statementId} />
      </div>
    </section>
  );
}
