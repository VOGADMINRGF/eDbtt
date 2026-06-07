"use client";

import { type FormEvent, useState } from "react";

type Props = {
  requestId: string;
  onSubmitted?: (() => Promise<void>) | (() => void);
};

export default function AccountEditorialReviewReplyForm({ requestId, onSubmitted }: Props) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/editorial/review-requests/${encodeURIComponent(requestId)}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message ?? body?.error ?? "editorial_review_reply_failed");
      }

      setText("");
      await onSubmitted?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Die Antwort konnte gerade nicht gespeichert werden.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Antwort
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder="Beschreibe den fehlenden Kontext, die Quelle oder den Ort möglichst konkret."
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Wird gesendet ..." : "Antwort senden"}
        </button>
        <span className="text-xs text-[rgb(var(--muted))]">Noch nicht veröffentlicht</span>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
