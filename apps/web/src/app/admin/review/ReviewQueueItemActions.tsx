"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ReviewQueueItem } from "@features/reviewQueue";

type Props = {
  item: ReviewQueueItem;
  currentUserId: string;
  endpoint?: string;
  visibleActions?: ReviewQueueAction[];
  showAssignmentActions?: boolean;
  scopeCopy?: string | null;
};

async function postReviewAction(input: {
  endpoint: string;
  itemId: string;
  action: ReviewQueueAction;
  assignedToUserId?: string | null;
  note?: string | null;
}) {
  const res = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: input.action,
      assignedToUserId: input.assignedToUserId,
      note: input.note,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "review_queue_operation_failed");
  }
}

export type ReviewQueueAction =
  | "assign"
  | "unassign"
  | "add_note"
  | "request_changes"
  | "mark_in_review"
  | "mark_ready"
  | "archive"
  | "block";

export default function ReviewQueueItemActions({
  item,
  currentUserId,
  endpoint,
  visibleActions,
  showAssignmentActions = true,
  scopeCopy = null,
}: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState(item.assignedToUserId ?? "");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actionEndpoint = endpoint ?? `/api/admin/review/items/${encodeURIComponent(item.id)}`;
  const allowedActions = new Set<ReviewQueueAction>(visibleActions ?? [
    "assign",
    "unassign",
    "add_note",
    "request_changes",
    "mark_in_review",
    "mark_ready",
    "archive",
    "block",
  ]);

  async function runAction(
    action: ReviewQueueAction,
    overrides?: {
      assignedToUserId?: string | null;
      note?: string | null;
    },
  ) {
    const nextNote = (overrides?.note ?? note.trim()) || null;
    const nextAssignee = (overrides?.assignedToUserId ?? assignee.trim()) || null;
    setPendingAction(action);
    setError(null);
    try {
      await postReviewAction({
        endpoint: actionEndpoint,
        itemId: item.id,
        action,
        assignedToUserId: nextAssignee,
        note: nextNote,
      });
      if (action === "add_note" || action === "request_changes" || action === "block") {
        setNote("");
      }
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "review_queue_operation_failed");
    } finally {
      setPendingAction(null);
    }
  }

  const archived = item.operationalStatus === "archived";

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
          {item.operationalStatusLabel}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
          {item.priorityLabel}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
          {item.scopeLabel}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
          {item.noteCount} Notizen
        </span>
      </div>

      {showAssignmentActions ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
            Zugewiesen an
            <input
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder="user- oder team-id"
              className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            {allowedActions.has("assign") ? (
              <button
                type="button"
                disabled={archived || pendingAction === "assign"}
                onClick={() => runAction("assign", { assignedToUserId: assignee.trim() || currentUserId })}
                className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
              >
                Zuweisen
              </button>
            ) : null}
            {allowedActions.has("assign") ? (
              <button
                type="button"
                disabled={archived || pendingAction === "assign"}
                onClick={() => {
                  setAssignee(currentUserId);
                  void runAction("assign", { assignedToUserId: currentUserId });
                }}
                className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
              >
                Mir zuweisen
              </button>
            ) : null}
            {allowedActions.has("unassign") ? (
              <button
                type="button"
                disabled={archived || pendingAction === "unassign" || !item.assignedToUserId}
                onClick={() => runAction("unassign", { assignedToUserId: null })}
                className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
              >
                Zuweisung entfernen
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <label className="mt-4 block space-y-2 text-xs text-[rgb(var(--muted))]">
        Notiz
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Kontext, Rückfrage oder Review-Hinweis"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none"
        />
      </label>

      {item.latestNote ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Letzte Notiz ({new Date(item.latestNote.at).toLocaleString("de-DE")}): {item.latestNote.text}
        </p>
      ) : null}
      {scopeCopy ? <p className="mt-3 text-xs text-[rgb(var(--muted))]">{scopeCopy}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {allowedActions.has("add_note") ? (
          <button
            type="button"
            disabled={pendingAction === "add_note"}
            onClick={() => runAction("add_note")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Notiz speichern
          </button>
        ) : null}
        {allowedActions.has("mark_in_review") ? (
          <button
            type="button"
            disabled={archived || pendingAction === "mark_in_review"}
            onClick={() => runAction("mark_in_review")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            In Prüfung setzen
          </button>
        ) : null}
        {allowedActions.has("request_changes") ? (
          <button
            type="button"
            disabled={archived || pendingAction === "request_changes"}
            onClick={() => runAction("request_changes")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Änderungen anfordern
          </button>
        ) : null}
        {allowedActions.has("mark_ready") ? (
          <button
            type="button"
            disabled={archived || pendingAction === "mark_ready"}
            onClick={() => runAction("mark_ready")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Bereit markieren
          </button>
        ) : null}
        {allowedActions.has("block") ? (
          <button
            type="button"
            disabled={archived || pendingAction === "block"}
            onClick={() => runAction("block")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
          >
            Blockieren
          </button>
        ) : null}
        {allowedActions.has("archive") ? (
          <button
            type="button"
            disabled={archived || pendingAction === "archive"}
            onClick={() => runAction("archive")}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
          >
            Archivieren
          </button>
        ) : null}
      </div>

      {item.assignedToUserId ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Zugewiesen an {item.assignedToUserId}
          {item.assignedAt ? ` · ${new Date(item.assignedAt).toLocaleString("de-DE")}` : ""}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
