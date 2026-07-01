"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  canApproveDossierPublication,
  canPublishDossier,
  canRequestDossierPublicationReview,
  canUnpublishDossier,
  type DossierPublicationRecord,
} from "@/features/create/dossierPublishWorkflow";

type DossierPublicationAction =
  | "requestDossierPublicationReview"
  | "approveDossierPublication"
  | "publishApprovedDossier"
  | "unpublishPublishedDossier"
  | "rejectDossierPublication"
  | "blockDossierPublication"
  | "archiveDossierPublication";

type Props = {
  record: DossierPublicationRecord;
};

async function postAction(input: {
  sourceHandoffId: string;
  action: DossierPublicationAction;
}) {
  const response = await fetch(
    `/api/admin/dossier-publish/${encodeURIComponent(input.sourceHandoffId)}`,
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
    throw new Error(body?.error ?? "dossier_publish_action_failed");
  }
}

export default function DossierPublishActions({ record }: Props) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<DossierPublicationAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: DossierPublicationAction) {
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
          : "dossier_publish_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs text-[rgb(var(--muted))]">
        Freigabe bedeutet Veröffentlichung, nicht Wahrheitszertifikat.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Quellen bleiben prüfbare Belege und Kontext, keine automatische Verifikation.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Dossier-Veröffentlichung erzeugt keinen Graph Merge und keinen Anlassraum.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`request-dossier-publication-review-${record.sourceHandoffId}`}
          disabled={
            !canRequestDossierPublicationReview(record) ||
            pendingAction === "requestDossierPublicationReview"
          }
          onClick={() => runAction("requestDossierPublicationReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichungsprüfung anfordern
        </button>
        <button
          type="button"
          data-testid={`approve-dossier-publication-${record.sourceHandoffId}`}
          disabled={
            !canApproveDossierPublication(record) ||
            pendingAction === "approveDossierPublication"
          }
          onClick={() => runAction("approveDossierPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung freigeben
        </button>
        <button
          type="button"
          data-testid={`publish-dossier-${record.sourceHandoffId}`}
          disabled={
            !canPublishDossier(record) ||
            pendingAction === "publishApprovedDossier"
          }
          onClick={() => runAction("publishApprovedDossier")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Öffentlich veröffentlichen
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid={`unpublish-dossier-${record.sourceHandoffId}`}
          disabled={
            !canUnpublishDossier(record) ||
            pendingAction === "unpublishPublishedDossier"
          }
          onClick={() => runAction("unpublishPublishedDossier")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung zurückziehen
        </button>
        <button
          type="button"
          data-testid={`reject-dossier-publication-${record.sourceHandoffId}`}
          disabled={pendingAction === "rejectDossierPublication"}
          onClick={() => runAction("rejectDossierPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Veröffentlichung ablehnen
        </button>
        <button
          type="button"
          data-testid={`block-dossier-publication-${record.sourceHandoffId}`}
          disabled={pendingAction === "blockDossierPublication"}
          onClick={() => runAction("blockDossierPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Blockieren
        </button>
        <button
          type="button"
          data-testid={`archive-dossier-publication-${record.sourceHandoffId}`}
          disabled={pendingAction === "archiveDossierPublication"}
          onClick={() => runAction("archiveDossierPublication")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Archivieren
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
