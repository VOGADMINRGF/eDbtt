"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { ParticipationSpaceRuntimeRecord } from "@/features/create/participationSpaceRuntime";

type ParticipationSpaceRuntimeAction =
  | "approveParticipationSpaceCreation"
  | "rejectParticipationSpaceCreation"
  | "createApprovedParticipationSpace";

type Props = {
  record: ParticipationSpaceRuntimeRecord;
};

async function postAction(input: {
  sourceHandoffId: string;
  action: ParticipationSpaceRuntimeAction;
}) {
  const response = await fetch(
    `/api/admin/participation-space-runtime/${encodeURIComponent(input.sourceHandoffId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: input.action,
      }),
    },
  );
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    throw new Error(body?.error ?? "participation_space_runtime_action_failed");
  }
}

export default function ParticipationSpaceRuntimeCreationActions({
  record,
}: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<ParticipationSpaceRuntimeAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canApprove =
    record.status !== "created" &&
    record.status !== "rejected" &&
    record.blockers.every((blocker) => blocker === "review_not_approved");
  const canCreate =
    record.status === "approved_for_creation" && record.blockers.length === 0;

  async function runAction(action: ParticipationSpaceRuntimeAction) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        sourceHandoffId: record.sourceHandoffId,
        action,
      });
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "participation_space_runtime_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted))]">
        Dieser Beteiligungsraum wird nur nach redaktioneller Freigabe erstellt.
        Erstellung bedeutet nicht Veröffentlichung.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Erstellung bedeutet keine öffentliche Aktivierung. Quellen,
        Community-Hinweise, Dossier-, Anlassraum- und Graph-Bezüge sind
        Review-Kontext, keine automatische Wahrheit.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Es wird kein Public-Go-Live automatisch ausgelöst.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-participation-space-runtime-${record.sourceHandoffId}`}
          disabled={
            !canApprove || pendingAction === "approveParticipationSpaceCreation"
          }
          onClick={() => runAction("approveParticipationSpaceCreation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Erstellung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-participation-space-runtime-${record.sourceHandoffId}`}
          disabled={
            record.status === "created" ||
            pendingAction === "rejectParticipationSpaceCreation"
          }
          onClick={() => runAction("rejectParticipationSpaceCreation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Erstellung ablehnen
        </button>
        <button
          type="button"
          data-testid={`create-participation-space-runtime-${record.sourceHandoffId}`}
          disabled={
            !canCreate || pendingAction === "createApprovedParticipationSpace"
          }
          onClick={() => runAction("createApprovedParticipationSpace")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Beteiligungsraum jetzt erstellen
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
