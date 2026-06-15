"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  GraphMergeCandidate,
  ProductiveGraphMergeGate,
} from "@features/graphMergeCandidatesClient";

type GraphAction =
  | "accept_for_staging"
  | "mark_duplicate"
  | "resolve_duplicate"
  | "prepare_productive_merge"
  | "confirm_productive_merge"
  | "revert_productive_merge"
  | "return_to_clarification"
  | "reject"
  | "archive";

async function postAction(input: {
  candidateId: string;
  action: GraphAction;
  note?: string | null;
}) {
  const res = await fetch(`/api/admin/graph-merge-candidates/${encodeURIComponent(input.candidateId)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      note: input.note,
    }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "graph_merge_candidate_action_failed");
  }
}

export default function GraphMergeCandidateActions({
  candidate,
  prepareGate,
  confirmGate,
}: {
  candidate: GraphMergeCandidate;
  prepareGate: ProductiveGraphMergeGate;
  confirmGate: ProductiveGraphMergeGate;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<GraphAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const archived = candidate.reviewStatus === "archived";
  const merged =
    candidate.reviewStatus === "merged" || candidate.mergeStatus === "merged";
  const acceptDisabled =
    archived ||
    candidate.reviewStatus === "accepted_for_staging" ||
    candidate.reviewStatus === "staged" ||
    candidate.reviewStatus === "rejected" ||
    merged;
  const canResolveDuplicate = (candidate.duplicateCandidates?.length ?? 0) > 0;
  const prepareDisabled = archived || merged || pendingAction === "prepare_productive_merge" || !prepareGate.allowed;
  const confirmNeedsOverride = confirmGate.reason === "override_required";
  const canConfirm = confirmGate.allowed || confirmNeedsOverride;
  const confirmDisabled =
    archived ||
    merged ||
    pendingAction === "confirm_productive_merge" ||
    !canConfirm ||
    (confirmNeedsOverride && note.trim().length === 0);

  async function runAction(action: GraphAction) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        candidateId: candidate.id,
        action,
        note: note.trim() || null,
      });
      if (action === "reject" || action === "return_to_clarification") {
        setNote("");
      }
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "graph_merge_candidate_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Begründung / Notiz
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Duplikatentscheidung, Rückfrage, Revert- oder Override-Begründung"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Nur Admin/Redaktion kann hier Staging- und Zusammenführungsentscheidungen treffen. Keine dieser Aktionen veröffentlicht etwas direkt, erstellt ein Dossier oder startet einen Anlassraum.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={acceptDisabled || pendingAction === "accept_for_staging"}
          onClick={() => runAction("accept_for_staging")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Für Staging akzeptieren
        </button>
        <button
          type="button"
          disabled={archived || merged || pendingAction === "mark_duplicate"}
          onClick={() => runAction("mark_duplicate")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Als Duplikat markieren
        </button>
        <button
          type="button"
          disabled={archived || merged || !canResolveDuplicate || pendingAction === "resolve_duplicate"}
          onClick={() => runAction("resolve_duplicate")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Duplikat als gelöst markieren
        </button>
        <button
          type="button"
          disabled={prepareDisabled}
          onClick={() => runAction("prepare_productive_merge")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Merge vorbereiten
        </button>
        {canConfirm ? (
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={() => runAction("confirm_productive_merge")}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--fg))] px-4 py-2 text-xs font-semibold text-[rgb(var(--bg))] disabled:opacity-60"
          >
            Produktiven Merge bestätigen
          </button>
        ) : null}
        <button
          type="button"
          disabled={archived || !merged || pendingAction === "revert_productive_merge"}
          onClick={() => runAction("revert_productive_merge")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Zusammenführung zurücknehmen
        </button>
        <button
          type="button"
          disabled={archived || merged || pendingAction === "return_to_clarification"}
          onClick={() => runAction("return_to_clarification")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Zur Klärung zurückgeben
        </button>
        <button
          type="button"
          disabled={archived || merged || pendingAction === "reject"}
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

      {candidate.statusNote ? (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">Letzte Begründung: {candidate.statusNote}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
