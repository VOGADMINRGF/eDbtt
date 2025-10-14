// features/vote/components/VoteBar.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Votes = { agree: number; neutral: number; disagree: number };

type Props = {
  statementId: string;
  labels?: string[];
  userHash?: string; // optional Header für Server-Ratelimit/De-Dupe
};

export default function VoteBar({
  statementId,
  labels = ["Zustimmung", "Neutral", "Ablehnung"],
  userHash,
}: Props) {
  const [votes, setVotes] = useState<Votes>({ agree: 0, neutral: 0, disagree: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/votes/summary?statementId=${encodeURIComponent(statementId)}`,
          { cache: "no-store", signal: ctrl.signal, headers: userHash ? { "x-user-hash": userHash } : {} }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Summary failed");
        const s = json.data as Partial<Votes>;
        setVotes({
          agree: Number(s?.agree ?? 0),
          neutral: Number(s?.neutral ?? 0),
          disagree: Number(s?.disagree ?? 0),
        });
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "Fehler");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [statementId, userHash]);

  const total = Math.max(1, votes.agree + votes.neutral + votes.disagree);
  const pct = (n: number) => 100 * (n / total);

  return (
    <div className="w-full">
      {loading && <div className="h-2 w-full bg-neutral-100 rounded" />}
      {!loading && (
        <div className="w-full rounded overflow-hidden border border-neutral-200">
          <div className="flex h-3 w-full">
            <motion.div className="h-full bg-green-500" style={{ width: `${pct(votes.agree)}%` }} />
            <motion.div className="h-full bg-gray-300" style={{ width: `${pct(votes.neutral)}%` }} />
            <motion.div className="h-full bg-red-500" style={{ width: `${pct(votes.disagree)}%` }} />
          </div>
          <div className="flex justify-between text-[11px] mt-1 text-neutral-600">
            <span>{labels[0]}: {votes.agree}</span>
            <span>{labels[1]}: {votes.neutral}</span>
            <span>{labels[2]}: {votes.disagree}</span>
          </div>
        </div>
      )}
      {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
    </div>
  );
}
