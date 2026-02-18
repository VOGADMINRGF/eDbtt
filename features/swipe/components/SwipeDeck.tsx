"use client";
import { useEffect, useMemo, useState } from "react";
import SwipeCard from "./SwipeCard";

type VoteVal = "agree" | "neutral" | "disagree";
type SwipeStats = {
  xp: number;
  swipeCountTotal: number;
  contributionCredits: number;
  engagementLevel: string;
  nextCreditIn: number;
};

const voteToDirection: Record<VoteVal, "pro" | "neutral" | "contra"> = {
  agree: "pro",
  neutral: "neutral",
  disagree: "contra",
};

export default function SwipeDeck({ userHash }: { userHash: string }) {
  const [statements, setStatements] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [usage, setUsage] = useState<SwipeStats | null>(null);
  const [guestGate, setGuestGate] = useState<{ visible: boolean; count: number; limit: number }>({
    visible: false,
    count: 0,
    limit: 3,
  });

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setLoadError(null);
    fetch("/api/swipeStatements")
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error("Konnte Statements nicht laden");
        return data;
      })
      .then((data) => {
        if (!aborted) {
          setStatements(Array.isArray(data) ? data : []);
          setCurrent(0);
        }
      })
      .catch((err) => {
        if (!aborted) {
          setLoadError(err?.message ?? "Konnte Statements nicht laden");
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, []);

  const currentStatement = useMemo(() => statements[current], [statements, current]);

  async function handleVote(vote: VoteVal) {
    if (!currentStatement || guestGate.visible) return;
    setStatusMessage(null);
    try {
      const res = await fetch("/api/swipes/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          statementId: currentStatement.id ?? currentStatement._id ?? currentStatement.statementId,
          direction: voteToDirection[vote],
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.error === "GUEST_LIMIT_REACHED") {
          setGuestGate({
            visible: true,
            count: body.count ?? guestGate.count,
            limit: body.limit ?? guestGate.limit,
          });
          return;
        }
        setStatusMessage(body?.error ?? "Swipe konnte nicht gespeichert werden.");
        return;
      }
      if (body?.stats) {
        setUsage(body.stats as SwipeStats);
      }
      setStatusMessage("Danke für deine Stimme!");
      setTimeout(() => setStatusMessage(null), 2500);
      setCurrent((c) => c + 1);
    } catch {
      setStatusMessage("Netzwerkfehler – bitte später erneut versuchen.");
    }
  }

  if (loading) return <div>Lade Statements…</div>;
  if (loadError) return <div className="text-red-600">{loadError}</div>;
  if (!currentStatement) return <div>Alle Statements beantwortet!</div>;

  return (
    <>
      <div className="space-y-6">
        {usage ? (
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm text-sm text-[rgb(var(--muted))]">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Engagement-Level</p>
                <p className="text-base font-semibold text-[rgb(var(--fg))] capitalize">{usage.engagementLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">XP</p>
                <p className="text-base font-semibold text-[rgb(var(--fg))]">{usage.xp}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Swipes gesamt</p>
                <p className="text-base font-semibold text-[rgb(var(--fg))]">{usage.swipeCountTotal}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Contribution-Credits</p>
                <p className="text-base font-semibold text-[rgb(var(--fg))]">{usage.contributionCredits}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Noch {usage.nextCreditIn} Swipes bis zum nächsten Credit
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {statusMessage && (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm text-[rgb(var(--muted))]">
            {statusMessage}
          </div>
        )}

        <SwipeCard
          statement={currentStatement}
          userHash={userHash}
          onVote={handleVote}
        />
      </div>

      {guestGate.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="max-w-md rounded-3xl bg-[rgb(var(--card))] p-6 text-center shadow-xl">
            <p className="text-xs uppercase tracking-wide text-brand-blue">Kostenloses Kontingent erreicht</p>
            <h3 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
              Du hast deine {guestGate.limit} kostenlosen Swipes genutzt.
            </h3>
            <p className="mt-3 text-sm text-[rgb(var(--muted))]">
              Registriere dich kostenfrei, sammle XP und erhalte nach 100 Swipes deinen ersten Contribution-Credit.
            </p>
            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <a
                href="/register"
                className="flex-1 rounded-full bg-brand-grad px-4 py-2 text-center text-white font-semibold shadow-md"
              >
                Jetzt registrieren
              </a>
              <button
                className="flex-1 rounded-full border border-[rgb(var(--border))] px-4 py-2 text-[rgb(var(--muted))] font-semibold"
                onClick={() => setGuestGate((prev) => ({ ...prev, visible: false }))}
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
