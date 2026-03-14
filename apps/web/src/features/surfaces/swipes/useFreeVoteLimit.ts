"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "edb_swipes_free_votes_v1";

type UseFreeVoteLimitArgs = {
  enabled: boolean;
  limit?: number;
};

export function useFreeVoteLimit({ enabled, limit = 3 }: UseFreeVoteLimitArgs) {
  const [count, setCount] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      setGateOpen(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : 0;
      const next = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
      setCount(next);
      if (next >= limit) setGateOpen(true);
    } catch {
      setCount(0);
    }
  }, [enabled, limit]);

  const canVote = !enabled || count < limit;
  const remaining = Math.max(limit - count, 0);

  const registerVote = useCallback(() => {
    if (!enabled) return true;
    if (count >= limit) {
      setGateOpen(true);
      return false;
    }
    const next = count + 1;
    setCount(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore storage errors
    }
    if (next >= limit) setGateOpen(true);
    return true;
  }, [count, enabled, limit]);

  return useMemo(
    () => ({
      enabled,
      limit,
      count,
      remaining,
      canVote,
      gateOpen,
      setGateOpen,
      registerVote,
    }),
    [enabled, limit, count, remaining, canVote, gateOpen, registerVote],
  );
}

