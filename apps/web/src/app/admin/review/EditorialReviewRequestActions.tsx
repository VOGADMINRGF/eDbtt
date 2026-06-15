"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorialReviewRequest } from "@features/editorialReviewQueueClient";

type Props = {
  request: EditorialReviewRequest;
  currentUserId: string;
};

type EditorialAction =
  | "assign"
  | "unassign"
  | "add_note"
  | "mark_in_review"
  | "needs_user_clarification"
  | "accept_for_workup"
  | "reject"
  | "archive";

async function postAction(input: {
  requestId: string;
  action: EditorialAction;
  assignedToUserId?: string | null;
  note?: string | null;
}) {
  const res = await fetch(`/api/admin/editorial-review-requests/${encodeURIComponent(input.requestId)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      assignedToUserId: input.assignedToUserId,
      note: input.note,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "editorial_review_action_failed");
  }
}

export default function EditorialReviewRequestActions({
  request,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [assignee, setAssignee] = useState(request.assignedToUserId ?? "");
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<EditorialAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const archived = request.status === "archived";

  async function runAction(action: EditorialAction) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        requestId: request.id,
        action,
        assignedToUserId: assignee.trim() || null,
        note: note.trim() || null,
      });
      if (action === "add_note" || action === "needs_user_clarification" || action === "reject") {
        setNote("");
      }
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "editorial_review_action_failed");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
          Zugewiesen an
          <input
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="user- oder team-id"
            className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            disabled={archived || pendingAction === "assign"}
            onClick={() => runAction("assign")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Zuweisen
          </button>
          <button
            type="button"
            disabled={archived || pendingAction === "assign"}
            onClick={() => {
              setAssignee(currentUserId);
              void postAction({
                requestId: request.id,
                action: "assign",
                assignedToUserId: currentUserId,
                note: note.trim() || null,
              })
                .then(() => startTransition(() => router.refresh()))
                .catch((actionError) =>
                  setError(
                    actionError instanceof Error
                      ? actionError.message
                      : "editorial_review_action_failed",
                  ),
                );
            }}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Mir zuweisen
          </button>
          <button
            type="button"
            disabled={archived || pendingAction === "unassign" || !request.assignedToUserId}
            onClick={() => {
              setAssignee("");
              void runAction("unassign");
            }}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
          >
            Zuweisung entfernen
          </button>
        </div>
      </div>

      <label className="mt-4 block space-y-2 text-xs text-[rgb(var(--muted))]">
        Begründung / Notiz
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Rückfrage, Ablehnungsgrund oder Arbeitsnotiz"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>

      {request.statusNote ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">Letzte Begründung: {request.statusNote}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendingAction === "add_note"}
          onClick={() => runAction("add_note")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Notiz speichern
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "mark_in_review"}
          onClick={() => runAction("mark_in_review")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          In Prüfung nehmen
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "needs_user_clarification"}
          onClick={() => runAction("needs_user_clarification")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Rückfrage erforderlich
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "accept_for_workup"}
          onClick={() => runAction("accept_for_workup")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          {request.sourceType === "factcheck_request"
            ? "Quellenprüfung vorbereiten"
            : "Zur Weiterarbeit freigeben"}
        </button>
        <button
          type="button"
          disabled={archived || pendingAction === "reject"}
          onClick={() => runAction("reject")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Ablehnen
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

      {request.assignedToUserId ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Zugewiesen an {request.assignedToUserId}
          {request.assignedAt ? ` · ${new Date(request.assignedAt).toLocaleString("de-DE")}` : ""}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
