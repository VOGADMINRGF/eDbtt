"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  status: string;
};

type FactcheckAction =
  | "run"
  | "take_review"
  | "retry"
  | "cancel"
  | "archive";

async function patchAction(input: {
  jobId: string;
  action: FactcheckAction;
  note?: string | null;
}) {
  const res = await fetch(`/api/factcheck/status/${encodeURIComponent(input.jobId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      note: input.note,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.message ?? body?.error ?? "factcheck_job_action_failed");
  }
}

export default function FactcheckJobActions({ jobId, status }: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<FactcheckAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: FactcheckAction) {
    setPendingAction(action);
    setError(null);
    try {
      await patchAction({
        jobId,
        action,
        note: note.trim() || null,
      });
      if (action !== "run") {
        setNote("");
      }
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "factcheck_job_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const archived = status === "archived";

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Notiz
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Review-Hinweis oder Wiederholungsgrund"
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Keine dieser Aktionen veröffentlicht etwas direkt oder startet automatische Folgepfade.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={archived || pendingAction === "run"}
          onClick={() => runAction("run")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Ergebnis ansehen
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "take_review"}
          onClick={() => runAction("take_review")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          In Review übernehmen
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "retry"}
          onClick={() => runAction("retry")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Erneut prüfen
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "cancel"}
          onClick={() => runAction("cancel")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Abbrechen
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "archive"}
          onClick={() => runAction("archive")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
        >
          Archivieren
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
