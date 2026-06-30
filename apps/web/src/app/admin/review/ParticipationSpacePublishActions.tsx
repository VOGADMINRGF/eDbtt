"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  canActivateParticipationSpace,
  canApproveParticipationSpaceActivation,
  canApproveParticipationSpacePublication,
  canPublishParticipationSpace,
  type ParticipationSpacePublishRecord,
} from "@/features/create/participationSpacePublishWorkflow";

type ParticipationSpacePublishAction =
  | "approveParticipationSpaceActivation"
  | "rejectParticipationSpaceActivation"
  | "activateApprovedParticipationSpace"
  | "approveParticipationSpacePublication"
  | "rejectParticipationSpacePublication"
  | "publishApprovedParticipationSpace";

type Props = {
  record: ParticipationSpacePublishRecord;
};

async function postAction(input: {
  sourceHandoffId: string;
  action: ParticipationSpacePublishAction;
}) {
  const response = await fetch(
    `/api/admin/participation-space-publish/${encodeURIComponent(input.sourceHandoffId)}`,
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
    throw new Error(body?.error ?? "participation_space_publish_action_failed");
  }
}

export default function ParticipationSpacePublishActions({ record }: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<ParticipationSpacePublishAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: ParticipationSpacePublishAction) {
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
          : "participation_space_publish_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const canApproveActivation = canApproveParticipationSpaceActivation(record);
  const canActivate = canActivateParticipationSpace(record);
  const canApprovePublication = canApproveParticipationSpacePublication(record);
  const canPublish = canPublishParticipationSpace(record);

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted))]">
        Aktivierung ist ein separater Freigabeschritt. Veröffentlichung ist
        nicht Teil der Erstellung.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Öffentliche Sichtbarkeit entsteht nur nach expliziter Veröffentlichung.
        Quellen, Community-Hinweise, Dossier-, Anlassraum- und Graph-Bezüge
        sind Review-Kontext, keine automatische Wahrheit.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Es gibt keinen Auto-Publish, keine Auto-Aktivierung, keinen Auto-Graph
        und keinen Auto-Merge.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-participation-space-activation-${record.sourceHandoffId}`}
          disabled={
            !canApproveActivation ||
            pendingAction === "approveParticipationSpaceActivation"
          }
          onClick={() => runAction("approveParticipationSpaceActivation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Aktivierung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-participation-space-activation-${record.sourceHandoffId}`}
          disabled={pendingAction === "rejectParticipationSpaceActivation"}
          onClick={() => runAction("rejectParticipationSpaceActivation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Aktivierung ablehnen
        </button>
        <button
          type="button"
          data-testid={`activate-participation-space-${record.sourceHandoffId}`}
          disabled={
            !canActivate ||
            pendingAction === "activateApprovedParticipationSpace"
          }
          onClick={() => runAction("activateApprovedParticipationSpace")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Intern aktivieren
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-participation-space-publication-${record.sourceHandoffId}`}
          disabled={
            !canApprovePublication ||
            pendingAction === "approveParticipationSpacePublication"
          }
          onClick={() => runAction("approveParticipationSpacePublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-participation-space-publication-${record.sourceHandoffId}`}
          disabled={pendingAction === "rejectParticipationSpacePublication"}
          onClick={() => runAction("rejectParticipationSpacePublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung ablehnen
        </button>
        <button
          type="button"
          data-testid={`publish-participation-space-${record.sourceHandoffId}`}
          disabled={
            !canPublish || pendingAction === "publishApprovedParticipationSpace"
          }
          onClick={() => runAction("publishApprovedParticipationSpace")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Öffentlich veröffentlichen
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
