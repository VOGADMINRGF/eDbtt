"use client";

import { useEffect, useRef, useState } from "react";

export type VoteKind = "agree" | "neutral" | "disagree";

export type Totals = { agree: number; neutral: number; disagree: number };
export type VoteEvent =
  | { type: "init"; totals: Totals; myVote: VoteKind | null }
  | { type: "delta"; totals: Totals }
  | { type: "confirm"; myVote: VoteKind };

type Options = {
  reportId: string;
  userId?: string;           // optional für personalisierte Streams
  baseUrl?: string;          // z. B. "" oder "/api"
  prefer?: "ws" | "sse" | "auto";
  pollMs?: number;           // fallback Polling-Intervall
};

export function useVoteStream(opts: Options) {
  const { reportId, userId, baseUrl = "", prefer = "auto", pollMs = 10_000 } = opts;
  const [totals, setTotals] = useState<Totals>({ agree: 0, neutral: 0, disagree: 0 });
  const [myVote, setMyVote] = useState<VoteKind | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Helper: initial laden
  async function fetchSnapshot(signal?: AbortSignal) {
    const url = `${baseUrl}/vote/snapshot?reportId=${encodeURIComponent(reportId)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;
    const res = await fetch(url, { signal, credentials: "include" });
    if (!res.ok) throw new Error(`snapshot ${res.status}`);
    return (await res.json()) as { totals: Totals; myVote: VoteKind | null };
  }

  // Helper: Vote absetzen
  async function castVote(next: VoteKind) {
    const res = await fetch(`${baseUrl}/vote/cast`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reportId, vote: next, userId })
    });
    if (!res.ok) throw new Error(`cast ${res.status}`);
    const data = (await res.json()) as { totals?: Totals; myVote?: VoteKind };
    if (data.totals) setTotals(data.totals);
    if (data.myVote) setMyVote(data.myVote);
  }

  // Verbindungsaufbau (WS -> SSE -> Poll)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    // 1) initial snapshot
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    fetchSnapshot(abortRef.current.signal)
      .then(({ totals, myVote }) => {
        if (cancelled) return;
        setTotals(totals);
        setMyVote(myVote);
      })
      .catch((e) => !cancelled && setErr(e))
      .finally(() => !cancelled && setLoading(false));

    // 2) Realtime
    const tryWS = prefer === "ws" || prefer === "auto";
    const trySSE = prefer === "sse" || prefer === "auto";

    // WS
    function connectWS(): boolean {
      try {
        if (!tryWS) return false;
        const url = getWSUrl(`${baseUrl}/vote/stream?reportId=${encodeURIComponent(reportId)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as VoteEvent;
            if (msg.type === "init") {
              setTotals(msg.totals);
              setMyVote(msg.myVote);
            } else if (msg.type === "delta") {
              setTotals(msg.totals);
            } else if (msg.type === "confirm") {
              setMyVote(msg.myVote);
            }
          } catch {/* ignore */}
        };
        ws.onerror = () => {/* handled by onclose */};
        ws.onclose = () => { /* fallback on close */ connectSSE() || startPolling(); };

        return true;
      } catch { return false; }
    }

    // SSE
    function connectSSE(): boolean {
      try {
        if (!trySSE) return false;
        const url = `${baseUrl}/vote/stream-sse?reportId=${encodeURIComponent(reportId)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;
        const sse = new EventSource(url, { withCredentials: true });
        sseRef.current = sse;

        sse.addEventListener("message", (e) => {
          try {
            const msg = JSON.parse((e as MessageEvent).data) as VoteEvent;
            if (msg.type === "init") {
              setTotals(msg.totals);
              setMyVote(msg.myVote);
            } else if (msg.type === "delta") {
              setTotals(msg.totals);
            } else if (msg.type === "confirm") {
              setMyVote(msg.myVote);
            }
          } catch {/* ignore */}
        });
        sse.addEventListener("error", () => { sse.close(); startPolling(); });
        return true;
      } catch { return false; }
    }

    // Polling
    function startPolling(): boolean {
      try {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const { totals } = await fetchSnapshot();
            setTotals(totals);
          } catch { /* ignore transient */ }
        }, pollMs);
        return true;
      } catch { return false; }
    }

    // Start-Reihenfolge
    if (!connectWS()) {
      if (!connectSSE()) startPolling();
    }

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (wsRef.current && wsRef.current.readyState <= 1) wsRef.current.close();
      sseRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, userId, baseUrl, prefer, pollMs]);

  return { totals, myVote, loading, error, castVote };
}

// Hilfsfunktion: HTTP(s) -> WS(s) URL
function getWSUrl(httpish: string) {
  const a = document.createElement("a");
  a.href = httpish;
  a.protocol = a.protocol.replace("http", "ws");
  return a.href;
}
