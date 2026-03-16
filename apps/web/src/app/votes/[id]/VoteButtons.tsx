"use client";

import { useState } from "react";

type Props = {
  statementId: string;
};

export function VoteButtons({ statementId }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function cast(choice: "yes" | "no" | "skip") {
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch(`/api/statements/${statementId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.ok === false) {
        throw new Error(body?.reason || "Vote fehlgeschlagen");
      }
      setStatus("success");
      setMessage("Danke! Deine Stimme wurde gespeichert.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Vote fehlgeschlagen");
    }
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Deine Stimme</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-vote btn-vote-agree rounded-full px-4 py-2 text-sm"
          disabled={status === "submitting"}
          onClick={() => cast("yes")}
        >
          Zustimmung
        </button>
        <button
          type="button"
          className="btn-vote btn-vote-disagree rounded-full px-4 py-2 text-sm"
          disabled={status === "submitting"}
          onClick={() => cast("no")}
        >
          Ablehnung
        </button>
        <button
          type="button"
          className="btn-vote btn-vote-neutral rounded-full px-4 py-2 text-sm"
          disabled={status === "submitting"}
          onClick={() => cast("skip")}
        >
          Enthaltung
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${
            status === "success" ? "text-emerald-600" : status === "error" ? "text-rose-600" : "text-[rgb(var(--muted))]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
