"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { DossierRuntimeRecord } from "@/features/create/dossierRuntime";

type DossierRuntimeAction =
  | "approveDossierCreation"
  | "rejectDossierCreation"
  | "createApprovedDossier";

type Props = {
  record: DossierRuntimeRecord;
};

async function postAction(input: {
  sourceHandoffId: string;
  action: DossierRuntimeAction;
}) {
  const response = await fetch(
    `/api/admin/dossier-runtime/${encodeURIComponent(input.sourceHandoffId)}`,
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
    throw new Error(body?.error ?? "dossier_runtime_action_failed");
  }
}

export default function DossierRuntimeCreationActions({ record }: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<DossierRuntimeAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const canApprove =
    record.status !== "created" &&
    record.status !== "rejected" &&
    record.blockers.every((blocker) => blocker === "review_not_approved");
  const canCreate =
    record.status === "approved_for_creation" && record.blockers.length === 0;

  async function runAction(action: DossierRuntimeAction) {
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
          : "dossier_runtime_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted))]">
        Dieses Dossier wird nur nach redaktioneller Freigabe erstellt. Erstellung bedeutet nicht
        Veröffentlichung.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Quellen, Community-Hinweise und Graph-Bezüge sind Review-Kontext, keine automatische
        Wahrheit. Es wird kein Anlassraum und kein Beteiligungsraum automatisch erstellt.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`approve-dossier-runtime-${record.sourceHandoffId}`}
          disabled={!canApprove || pendingAction === "approveDossierCreation"}
          onClick={() => runAction("approveDossierCreation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Erstellung freigeben
        </button>
        <button
          type="button"
          data-testid={`reject-dossier-runtime-${record.sourceHandoffId}`}
          disabled={record.status === "created" || pendingAction === "rejectDossierCreation"}
          onClick={() => runAction("rejectDossierCreation")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Erstellung ablehnen
        </button>
        <button
          type="button"
          data-testid={`create-dossier-runtime-${record.sourceHandoffId}`}
          disabled={!canCreate || pendingAction === "createApprovedDossier"}
          onClick={() => runAction("createApprovedDossier")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Dossier jetzt erstellen
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
