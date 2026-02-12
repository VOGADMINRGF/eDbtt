"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type JoinState = "idle" | "loading" | "success" | "error";

export default function CampaignJoinPage() {
  const params = useParams();
  const campaignId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
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
          body: JSON.stringify({ source: "web" }),
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
  }, [campaignId]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign</p>
        <h1 className="text-2xl font-bold text-slate-900">Teilnahme</h1>
        <p className="text-sm text-slate-600">
          Wir registrieren deine Teilnahme und leiten dich anschliessend weiter.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        {state === "loading" && <p className="text-slate-600">Teilnahme wird gespeichert…</p>}
        {state === "success" && (
          <div className="space-y-2">
            <p className="font-semibold text-emerald-700">Teilnahme gespeichert.</p>
            {participants !== null && (
              <p className="text-slate-600">Aktuelle Teilnehmerzahl: {participants}</p>
            )}
          </div>
        )}
        {state === "error" && <p className="text-rose-600">{message ?? "Teilnahme fehlgeschlagen."}</p>}
      </section>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/campaign/${encodeURIComponent(campaignId)}`} className="font-semibold text-slate-700">
          Zurueck zur Kampagne
        </Link>
        <Link href="/stream" className="font-semibold text-slate-500 hover:text-slate-700">
          Streams ansehen
        </Link>
      </div>
    </main>
  );
}
