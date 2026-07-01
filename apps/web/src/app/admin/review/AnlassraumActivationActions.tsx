"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  canActivateAnlassraum,
  canApproveAnlassraumActivation,
  canApproveAnlassraumPublication,
  canPublishAnlassraum,
  type AnlassraumActivationRecord,
} from "@/features/create/anlassraumActivationWorkflow";

type AnlassraumActivationAction =
  | "approveAnlassraumActivation"
  | "rejectAnlassraumActivation"
  | "activateApprovedAnlassraum"
  | "approveAnlassraumPublication"
  | "rejectAnlassraumPublication"
  | "publishApprovedAnlassraum";

type Props = {
  record: AnlassraumActivationRecord;
};

async function postAction(input: {
  sourceHandoffId: string;
  action: AnlassraumActivationAction;
}) {
  const response = await fetch(
    `/api/admin/anlassraum-activation/${encodeURIComponent(input.sourceHandoffId)}`,
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
    throw new Error(body?.error ?? "anlassraum_activation_action_failed");
  }
}

export default function AnlassraumActivationActions({ record }: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<AnlassraumActivationAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: AnlassraumActivationAction) {
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
          : "anlassraum_activation_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const canApproveActivation = canApproveAnlassraumActivation(record);
  const canActivate = canActivateAnlassraum(record);
  const canApprovePublication = canApproveAnlassraumPublication(record);
  const canPublish = canPublishAnlassraum(record);

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted))]">
        Erstellung ist nicht Aktivierung. Aktivierung ist nicht
        Veröffentlichung.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Öffentliche Sichtbarkeit entsteht nur nach expliziter Veröffentlichung.
        Quellen, Community-Hinweise, Dossier- und Graph-Bezüge sind
        Review-Kontext, keine automatische Wahrheit.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Es gibt keinen Auto-Publish, keine Auto-Aktivierung, keinen
        Auto-Graph, keinen Auto-Merge, keinen Auto-Factcheck und kein
        DeepSearch.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-anlassraum-activation-${record.sourceHandoffId}`}
          disabled={
            !canApproveActivation ||
            pendingAction === "approveAnlassraumActivation"
          }
          onClick={() => runAction("approveAnlassraumActivation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Aktivierung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-anlassraum-activation-${record.sourceHandoffId}`}
          disabled={pendingAction === "rejectAnlassraumActivation"}
          onClick={() => runAction("rejectAnlassraumActivation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Aktivierung ablehnen
        </button>
        <button
          type="button"
          data-testid={`activate-anlassraum-${record.sourceHandoffId}`}
          disabled={!canActivate || pendingAction === "activateApprovedAnlassraum"}
          onClick={() => runAction("activateApprovedAnlassraum")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Intern aktivieren
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-anlassraum-publication-${record.sourceHandoffId}`}
          disabled={
            !canApprovePublication ||
            pendingAction === "approveAnlassraumPublication"
          }
          onClick={() => runAction("approveAnlassraumPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-anlassraum-publication-${record.sourceHandoffId}`}
          disabled={pendingAction === "rejectAnlassraumPublication"}
          onClick={() => runAction("rejectAnlassraumPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung ablehnen
        </button>
        <button
          type="button"
          data-testid={`publish-anlassraum-${record.sourceHandoffId}`}
          disabled={!canPublish || pendingAction === "publishApprovedAnlassraum"}
          onClick={() => runAction("publishApprovedAnlassraum")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Öffentlich veröffentlichen
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
