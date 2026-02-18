"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type JoinState = "idle" | "loading" | "success" | "error";

export default function CampaignJoinPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const sessionId = searchParams?.get("session") ?? null;
  const [state, setState] = useState<JoinState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [participants, setParticipants] = useState<number | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let ignore = false;
    async function join() {
      setState("loading");
      try {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/join`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "web", sessionId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) {
          setParticipants(typeof body?.participants === "number" ? body.participants : null);
          setState("success");
        }
      } catch (err: any) {
        if (!ignore) {
          setMessage(err?.message ?? "Teilnahme fehlgeschlagen.");
          setState("error");
        }
      }
    }
    join();
    return () => {
      ignore = true;
    };
  }, [campaignId, sessionId]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Campaign</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Teilnahme</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Wir registrieren deine Teilnahme und leiten dich anschliessend weiter.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm shadow-sm">
        {state === "loading" && <p className="text-[rgb(var(--muted))]">Teilnahme wird gespeichert…</p>}
        {state === "success" && (
          <div className="space-y-2">
            <p className="font-semibold text-emerald-700">Teilnahme gespeichert.</p>
            {participants !== null && (
              <p className="text-[rgb(var(--muted))]">Aktuelle Teilnehmerzahl: {participants}</p>
            )}
            {sessionId && (
              <p className="text-[rgb(var(--muted))]">
                Session: <span className="font-semibold text-[rgb(var(--fg))]">{sessionId}</span>
              </p>
            )}
            <p className="text-[rgb(var(--muted))]">Du kannst jetzt zur Kampagne wechseln oder Streams ansehen.</p>
          </div>
        )}
        {state === "error" && <p className="text-rose-600">{message ?? "Teilnahme fehlgeschlagen."}</p>}
      </section>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`/campaign/${encodeURIComponent(campaignId)}`}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Zur Kampagne
        </Link>
        <Link href="/stream" className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]">
          Streams ansehen
        </Link>
      </div>
    </main>
  );
}
