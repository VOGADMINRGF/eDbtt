"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicGraphEdge } from "@/features/create/topicGraphRuntime";

type TopicGraphApprovalAction =
  | "approveGraphWrite"
  | "rejectGraphWrite"
  | "writeApprovedGraphEdge";

async function postAction(input: {
  edgeId: string;
  action: TopicGraphApprovalAction;
  note?: string | null;
}) {
  const res = await fetch(`/api/admin/topic-graph-edges/${encodeURIComponent(input.edgeId)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      note: input.note,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "topic_graph_approval_action_failed");
  }
}

export default function TopicGraphEdgeApprovalActions({
  edge,
  graphRuntimeAvailable,
}: {
  edge: TopicGraphEdge;
  graphRuntimeAvailable: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(edge.note ?? edge.auditContext.reason ?? "");
  const [pendingAction, setPendingAction] = useState<TopicGraphApprovalAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noteValue = note.trim();
  const written = edge.mutationStatus === "written";
  const rejected = edge.mutationStatus === "rejected";
  const approvalBlocked =
    edge.sourceReviewPending ||
    edge.moderationPending ||
    !edge.source.id ||
    !edge.target.id ||
    !graphRuntimeAvailable;
  const approveDisabled =
    written ||
    rejected ||
    edge.approvedForGraphWrite ||
    approvalBlocked ||
    pendingAction === "approveGraphWrite" ||
    noteValue.length === 0;
  const rejectDisabled =
    written ||
    rejected ||
    pendingAction === "rejectGraphWrite" ||
    noteValue.length === 0;
  const writeDisabled =
    written ||
    rejected ||
    !edge.approvedForGraphWrite ||
    edge.blockers.length > 0 ||
    pendingAction === "writeApprovedGraphEdge";

  async function runAction(action: TopicGraphApprovalAction) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        edgeId: edge.id,
        action,
        note: noteValue || null,
      });
      if (action === "rejectGraphWrite") {
        setNote("");
      }
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "topic_graph_approval_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Audit-Begründung
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Warum soll die Verknüpfung freigegeben, abgelehnt oder geschrieben werden?"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Diese Verknüpfung wird nur nach redaktioneller Freigabe in den Graph geschrieben.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        KI-/Community-Hinweise sind Entscheidungshilfen, keine automatische Wahrheit.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Es wird nichts zusammengeführt, gelöscht oder veröffentlicht.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={approveDisabled}
          onClick={() => runAction("approveGraphWrite")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Graph-Write freigeben
        </button>
        <button
          type="button"
          disabled={writeDisabled}
          onClick={() => runAction("writeApprovedGraphEdge")}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--fg))] px-4 py-2 text-xs font-semibold text-[rgb(var(--bg))] disabled:opacity-60"
        >
          Freigegebene Kante schreiben
        </button>
        <button
          type="button"
          disabled={rejectDisabled}
          onClick={() => runAction("rejectGraphWrite")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Graph-Write ablehnen
        </button>
      </div>

      {!graphRuntimeAvailable ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Graph-Runtime derzeit nicht verfügbar. Freigabe und Write bleiben deaktiviert.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
