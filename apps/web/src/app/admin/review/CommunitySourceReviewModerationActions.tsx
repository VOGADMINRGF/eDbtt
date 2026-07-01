"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CommunitySourceReviewWorkbenchPriority,
  CommunitySourceReviewWorkbenchUiItem,
} from "@/features/create/communitySourceReviewWorkbench";

type CommunitySourceReviewAction =
  | "allowAsHint"
  | "hideHint"
  | "rejectHint"
  | "escalateHint"
  | "markNeedsSourceReview"
  | "markNeedsEditorialReview"
  | "markAsSpamRisk"
  | "markAsAbuseRisk"
  | "clearAbuseSignal"
  | "escalateAbuseReview"
  | "markSourceQualityReviewed"
  | "markTrustQualityReviewed"
  | "setReviewPriorityFromTrustQuality"
  | "clearTrustQualitySignals"
  | "setPriority"
  | "archive"
  | "addInternalNote";

async function postAction(input: {
  contributionId: string;
  action: CommunitySourceReviewAction;
  note?: string | null;
  priority?: CommunitySourceReviewWorkbenchPriority;
}) {
  const res = await fetch(
    `/api/admin/community-source-review/${encodeURIComponent(input.contributionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: input.action,
        note: input.note,
        priority: input.priority,
      }),
    },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "community_source_review_action_failed");
  }
}

export default function CommunitySourceReviewModerationActions({
  item,
}: {
  item: CommunitySourceReviewWorkbenchUiItem;
}) {
  const router = useRouter();
  const [note, setNote] = useState(item.latestAudit?.note ?? "");
  const [priority, setPriority] = useState<CommunitySourceReviewWorkbenchPriority>(
    item.priorityOverride ?? item.priority,
  );
  const [pendingAction, setPendingAction] =
    useState<CommunitySourceReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noteValue = note.trim();
  const availableActions = new Set(item.availableActions);

  async function runAction(
    action: CommunitySourceReviewAction,
    input?: { priority?: CommunitySourceReviewWorkbenchPriority },
  ) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        contributionId: item.id,
        action,
        note: noteValue || null,
        priority: input?.priority,
      });
      startTransition(() => router.refresh());
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "community_source_review_action_failed",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const noteRequiredDisabled = noteValue.length === 0 || pendingAction !== null;

  function buttonDisabled(action: CommunitySourceReviewAction) {
    if (pendingAction !== null) return true;
    if (
      [
        "allowAsHint",
        "hideHint",
        "rejectHint",
        "escalateHint",
        "markNeedsSourceReview",
        "markNeedsEditorialReview",
        "markAsSpamRisk",
        "markAsAbuseRisk",
        "clearAbuseSignal",
        "escalateAbuseReview",
        "markSourceQualityReviewed",
        "markTrustQualityReviewed",
        "setReviewPriorityFromTrustQuality",
        "clearTrustQualitySignals",
        "setPriority",
        "archive",
        "addInternalNote",
      ].includes(action)
    ) {
      if (noteValue.length === 0) return true;
    }

    if (action === "allowAsHint") return !availableActions.has("allow_as_hint");
    if (action === "hideHint") return !availableActions.has("hide_hint");
    if (action === "rejectHint") return !availableActions.has("reject_hint");
    if (action === "escalateHint") return !availableActions.has("escalate_hint");
    if (action === "markNeedsSourceReview") {
      return !availableActions.has("mark_needs_source_review");
    }
    if (action === "markNeedsEditorialReview") {
      return !availableActions.has("mark_needs_editorial_review");
    }
    if (action === "setPriority") return !availableActions.has("set_priority");
    if (action === "archive") return !availableActions.has("archive");
    if (action === "addInternalNote") {
      return !availableActions.has("add_internal_note");
    }
    return false;
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Audit-Begründung oder interne Notiz
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Warum soll der Hinweis erlaubt, versteckt, abgelehnt, eskaliert oder intern notiert werden?"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>

      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Hinweis ist kein verifizierter Fakt. Gegenquelle bedeutet nicht automatisch Widerlegung.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Freigabe als Hinweis bedeutet nicht Veröffentlichung als Wahrheit.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Trust- und Qualitätswerte dienen nur der Priorisierung.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Keine Aktion veröffentlicht direkt, schreibt in den Graph oder erzeugt Merge, Dossier, Anlassraum oder Beteiligungsraum.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
          Priorität
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.currentTarget.value as CommunitySourceReviewWorkbenchPriority)
            }
            className="block rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs font-semibold text-[rgb(var(--fg))]"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <button
          type="button"
          disabled={buttonDisabled("setPriority")}
          onClick={() => runAction("setPriority", { priority })}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Priorität setzen
        </button>
        <button
          type="button"
          disabled={buttonDisabled("addInternalNote")}
          onClick={() => runAction("addInternalNote")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Interne Notiz speichern
        </button>
        <button
          type="button"
          disabled={buttonDisabled("archive")}
          onClick={() => runAction("archive")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Archivieren
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={buttonDisabled("allowAsHint")}
          onClick={() => runAction("allowAsHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Als Hinweis zulassen
        </button>
        <button
          type="button"
          disabled={buttonDisabled("hideHint")}
          onClick={() => runAction("hideHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Verstecken
        </button>
        <button
          type="button"
          disabled={buttonDisabled("rejectHint")}
          onClick={() => runAction("rejectHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Ablehnen
        </button>
        <button
          type="button"
          disabled={buttonDisabled("escalateHint")}
          onClick={() => runAction("escalateHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Eskalieren
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("markAsSpamRisk")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Als Spam-Risiko markieren
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("markAsAbuseRisk")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Als Abuse-Risiko markieren
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("clearAbuseSignal")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Abuse-Signale zurücksetzen
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("markSourceQualityReviewed")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Quellenqualität geprüft
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("markTrustQualityReviewed")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Trust/Quality geprüft
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("setReviewPriorityFromTrustQuality")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Trust/Quality priorisieren
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("clearTrustQualitySignals")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Trust/Quality-Signale zurücksetzen
        </button>
        <button
          type="button"
          disabled={buttonDisabled("markNeedsSourceReview")}
          onClick={() => runAction("markNeedsSourceReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Quellenprüfung anfordern
        </button>
        <button
          type="button"
          disabled={noteRequiredDisabled}
          onClick={() => runAction("escalateAbuseReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Abuse-Review eskalieren
        </button>
        <button
          type="button"
          disabled={buttonDisabled("markNeedsEditorialReview")}
          onClick={() => runAction("markNeedsEditorialReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Redaktionelle Prüfung anfordern
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
