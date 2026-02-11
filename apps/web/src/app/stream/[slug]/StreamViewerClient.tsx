"use client";

import { useEffect, useMemo, useState } from "react";
import type { StreamAgendaKind, StreamAttributionMode, StreamSessionStatus } from "@features/stream/types";

type OverlayItem = {
  id: string;
  kind: StreamAgendaKind;
  title: string;
  body?: string | null;
  pollOptions?: string[];
  pollTotals?: Record<string, number>;
  allowAnonymousVoting: boolean;
  publicAttribution: StreamAttributionMode;
};

type OverlayResponse = {
  ok: boolean;
  session?: { title: string; description?: string | null; status?: StreamSessionStatus };
  items?: OverlayItem[];
  error?: string;
};

function formatVoteError(code?: string) {
  switch (code) {
    case "login_required":
      return "Bitte einloggen, um abzustimmen.";
    case "session_not_live":
      return "Der Stream ist nicht live.";
    case "poll_not_live":
      return "Diese Abstimmung ist nicht aktiv.";
    case "invalid_option":
      return "Ungueltige Option.";
    default:
      return code || "Abstimmung fehlgeschlagen.";
  }
}

export function StreamViewerClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<OverlayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [voteError, setVoteError] = useState<string | null>(null);
  const [lastChoice, setLastChoice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/streams/sessions/${sessionId}/overlay-feed`, { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as OverlayResponse | null;
        if (!ignore) {
          setData(body);
          setError(body?.ok === false ? body?.error ?? "unexpected_error" : null);
        }
      } catch (err) {
        if (!ignore) setError((err as Error)?.message ?? "overlay_fetch_failed");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const item = data?.items?.[0];
  const totals = item?.pollTotals ?? {};
  const totalVotes = useMemo(() => Object.values(totals).reduce((sum, count) => sum + count, 0), [totals]);
  const isLive = data?.session?.status === "live";

  useEffect(() => {
    setVoteStatus("idle");
    setVoteError(null);
    setLastChoice(null);
  }, [item?.id]);

  async function submitVote(choice: string) {
    if (!item || item.kind !== "poll") return;
    setVoteStatus("sending");
    setVoteError(null);
    setLastChoice(choice);
    try {
      const res = await fetch(`/api/streams/sessions/${sessionId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agendaItemId: item.id, choice }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(formatVoteError(body?.error || res.statusText));
      }
      setVoteStatus("sent");
    } catch (err: any) {
      setVoteStatus("error");
      setVoteError(err?.message ?? "Abstimmung fehlgeschlagen.");
    }
  }

  return (
    <div
      className="rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm space-y-4"
      aria-busy={loading}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live-Interaktion</p>
          <p className="text-lg font-semibold text-slate-900">{data?.session?.title ?? "Stream"}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isLive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isLive ? "Live" : "Offline"}
        </span>
      </div>

      {loading && (
        <p className="text-sm text-slate-500" aria-live="polite">
          Laedt Live-Daten...
        </p>
      )}
      {!loading && error && (
        <p className="text-sm text-rose-600" aria-live="polite">
          {error}
        </p>
      )}
      {!loading && !error && !item && (
        <p className="text-sm text-slate-600">Aktuell keine Live-Agenda.</p>
      )}

      {!loading && !error && item && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            {item.body && <p className="text-xs text-slate-600">{item.body}</p>}
          </div>

          {item.kind === "poll" ? (
            <div className="space-y-2">
              {(item.pollOptions ?? []).map((opt) => {
                const count = totals?.[opt] ?? 0;
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={opt} className="space-y-1">
                    <button
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:border-slate-300 disabled:opacity-60"
                      onClick={() => submitVote(opt)}
                      disabled={!isLive || voteStatus === "sending"}
                    >
                      {opt}
                    </button>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{pct}%</span>
                      <span>{count} Stimmen</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {voteStatus === "sent" && (
                <p className="text-xs text-emerald-600" aria-live="polite">
                  Danke! Deine Stimme ({lastChoice}) ist gespeichert.
                </p>
              )}
              {voteStatus === "error" && voteError && (
                <p className="text-xs text-rose-600" aria-live="polite">
                  {voteError}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Aktives Thema: {item.kind === "question" ? "Frage" : item.kind}.
            </p>
          )}
        </div>
      )}

      {item?.publicAttribution === "public" && (
        <p className="text-xs text-amber-600">Oeffentliche Abstimmung: Stimmabgabe sichtbar.</p>
      )}
    </div>
  );
}
