"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunitySourceReviewRecord } from "@/features/create/communitySourceReviewServer";

type CommunitySourceReviewAction =
  | "allowAsHint"
  | "hideHint"
  | "rejectHint"
  | "escalateHint"
  | "markNeedsSourceReview"
  | "markNeedsEditorialReview";

async function postAction(input: {
  contributionId: string;
  action: CommunitySourceReviewAction;
  note?: string | null;
}) {
  const res = await fetch(
    `/api/admin/community-source-review/${encodeURIComponent(input.contributionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: input.action,
        note: input.note,
      }),
    },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? "community_source_review_action_failed");
  }
}

export default function CommunitySourceReviewModerationActions({
  record,
}: {
  record: CommunitySourceReviewRecord;
}) {
  const router = useRouter();
  const [note, setNote] = useState(record.latestDecisionNote ?? "");
  const [pendingAction, setPendingAction] =
    useState<CommunitySourceReviewAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noteValue = note.trim();
  const routeDecisionBlocked =
    record.decisionStatus === "hidden" || record.decisionStatus === "rejected";

  async function runAction(action: CommunitySourceReviewAction) {
    setPendingAction(action);
    setError(null);
    try {
      await postAction({
        contributionId: record.id,
        action,
        note: noteValue || null,
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

  const buttonDisabled = noteValue.length === 0 || pendingAction !== null;

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <label className="block space-y-2 text-xs text-[rgb(var(--muted))]">
        Audit-Begründung
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Warum soll der Hinweis als Hinweis erlaubt, ausgeblendet, zurückgewiesen oder weitergeroutet werden?"
          rows={3}
          className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        />
      </label>

      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Community-Hinweise sind Review-Signale, keine bestätigten Fakten.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Viele Hinweise bedeuten keine Wahrheit.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Trust priorisiert Prüfung, ersetzt sie aber nicht.
      </p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Es wird nichts automatisch veröffentlicht, verifiziert oder in den Graph geschrieben.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => runAction("allowAsHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Als Hinweis erlauben
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => runAction("hideHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Hinweis ausblenden
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => runAction("rejectHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Hinweis zurückweisen
        </button>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={() => runAction("escalateHint")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Review priorisieren
        </button>
        <button
          type="button"
          disabled={buttonDisabled || routeDecisionBlocked}
          onClick={() => runAction("markNeedsSourceReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Zur Quellenprüfung routen
        </button>
        <button
          type="button"
          disabled={buttonDisabled || routeDecisionBlocked}
          onClick={() => runAction("markNeedsEditorialReview")}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Zur Redaktion routen
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
