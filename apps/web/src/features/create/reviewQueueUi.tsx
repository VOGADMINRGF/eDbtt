import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import type { CreatePrepareAttachDraftReviewDecision } from "@/features/create/prepareAttachDraft";

export const REVIEW_GUARDRAILS = [
  "Noch kein Apply auf Live-Objekte.",
  "Noch keine Publikation.",
  "Noch kein Merge.",
  "Ursprung bleibt erhalten.",
  "Review ist nur Vorstufe fuer spaeteren manuellen Apply.",
] as const;

export function applyCreateAttachDraftLocalDecision(params: {
  items: CreatePrepareAttachDraftQueueItem[];
  updated: CreatePrepareAttachDraftQueueItem;
}) {
  return params.items.map((item) => (item.draftId === params.updated.draftId ? params.updated : item));
}

export function reviewDecisionLabel(value: CreatePrepareAttachDraftReviewDecision) {
  if (value === "accepted_for_apply") return "Akzeptieren fuer spaeteren Apply";
  if (value === "rejected") return "Ablehnen";
  return "Parken";
}

export function CreateAttachDraftReviewList(props: {
  items: CreatePrepareAttachDraftQueueItem[];
  decisionBusyDraftId: string | null;
  reviewNoteByDraft: Record<string, string>;
  decisionError: string | null;
  onReviewNoteChange: (draftId: string, value: string) => void;
  onReviewDecision: (draftId: string, decision: CreatePrepareAttachDraftReviewDecision) => void;
}) {
  if (props.items.length === 0) {
    return (
      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 text-sm text-[rgb(var(--muted))]">
        Keine Prepare-Attach Drafts in der produktiven Review-Queue.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {props.items.map((item) => (
        <article
          key={item.draftId}
          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 text-sm text-[rgb(var(--muted))]"
        >
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
            Draft <span className="font-semibold text-[rgb(var(--fg))]">{item.draftId}</span>
          </p>
          <p className="mt-1">
            CTA: <span className="font-semibold text-[rgb(var(--fg))]">{item.ctaId}</span> | reviewState:{" "}
            <span className="font-semibold text-[rgb(var(--fg))]">{item.reviewState}</span> | applyState:{" "}
            <span className="font-semibold text-[rgb(var(--fg))]">{item.applyState}</span>
          </p>
          <p className="mt-1 text-xs">
            matchType: {item.matchType ?? "-"} | matchEntityType: {item.matchEntityType ?? "-"}
          </p>
          <p className="text-xs">
            target: {item.attachTargetType ?? "-"} | {item.attachTargetId ?? "-"} |{" "}
            {item.attachTargetLabel || "ohne Zieltitel"}
          </p>
          <p className="mt-1">{item.sourceSummary || "Keine Source-Summary vorhanden."}</p>

          {item.reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
              {item.reasons.map((reason, idx) => (
                <li key={`${item.draftId}-reason-${idx}`}>{reason}</li>
              ))}
            </ul>
          ) : null}

          {item.duplicateRisk ? (
            <p className="mt-2 rounded-md border border-amber-300/60 bg-amber-50/80 px-2 py-1 text-xs text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
              Duplicate-Risk: nicht still durchwinken. Manuelle Pruefung erforderlich.
            </p>
          ) : null}

          <div className="mt-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-xs">
            <p className="font-semibold text-[rgb(var(--fg))]">Guardrails</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {REVIEW_GUARDRAILS.map((line) => (
                <li key={`${item.draftId}-guardrail-${line}`}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="mt-2">
            <label className="text-xs font-semibold text-[rgb(var(--fg))]" htmlFor={`review-note-${item.draftId}`}>
              Review-Notiz (optional)
            </label>
            <textarea
              id={`review-note-${item.draftId}`}
              className="mt-1 w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs"
              rows={2}
              value={props.reviewNoteByDraft[item.draftId] ?? ""}
              onChange={(event) => props.onReviewNoteChange(item.draftId, event.target.value)}
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {(["accepted_for_apply", "rejected", "parked"] as const).map((decision) => (
              <button
                key={`${item.draftId}-${decision}`}
                type="button"
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:opacity-60"
                disabled={props.decisionBusyDraftId === item.draftId}
                onClick={() => props.onReviewDecision(item.draftId, decision)}
              >
                {reviewDecisionLabel(decision)}
              </button>
            ))}
          </div>
        </article>
      ))}
      {props.decisionError ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-2 py-1 text-xs text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {props.decisionError}
        </p>
      ) : null}
    </div>
  );
}
