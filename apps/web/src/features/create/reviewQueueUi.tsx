import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import type { CreatePrepareAttachDraftReviewDecision } from "@/features/create/prepareAttachDraft";
import type { CreatePrepareAttachDraftHistoryEvent } from "@/features/create/attachDraftHistory";

export const REVIEW_GUARDRAILS = [
  "Kein Auto-Apply auf Live-Objekte.",
  "Apply bleibt manuell und additiv.",
  "Noch keine Publikation.",
  "Noch kein Merge.",
  "Ursprung bleibt erhalten.",
  "Review + expliziter Apply bleiben getrennte Schritte.",
] as const;

export function applyCreateAttachDraftLocalDecision(params: {
  items: CreatePrepareAttachDraftQueueItem[];
  updated: CreatePrepareAttachDraftQueueItem;
}) {
  return params.items.map((item) => (item.draftId === params.updated.draftId ? params.updated : item));
}

export function reviewDecisionLabel(value: CreatePrepareAttachDraftReviewDecision) {
  if (value === "accepted_for_apply") return "Akzeptieren für späteren Apply";
  if (value === "rejected") return "Ablehnen";
  return "Parken";
}

const APPLY_SUPPORTED_TARGET_TYPES = new Set(["claim", "anlassraum", "dossier"]);
const HISTORY_CODE_LABELS: Record<string, string> = {
  review_state_changed: "Review-Status aktualisiert",
  apply_success: "Apply erfolgreich",
  apply_failed_target_not_found: "Apply fehlgeschlagen: Ziel nicht gefunden",
  apply_failed_invalid_target: "Apply fehlgeschlagen: Ziel ungültig",
  apply_failed_unsupported_target_type: "Apply fehlgeschlagen: Zieltyp nicht unterstützt",
  apply_failed_wrong_review_state: "Apply fehlgeschlagen: falscher Review-Status",
  apply_failed_already_applied: "Apply fehlgeschlagen: bereits angewendet",
  apply_failed_state_conflict: "Apply fehlgeschlagen: State-Konflikt",
  apply_failed_unknown: "Apply fehlgeschlagen: unbekannter Fehler",
};

export function isSupportedApplyTargetType(value: string | null | undefined) {
  return APPLY_SUPPORTED_TARGET_TYPES.has(String(value || ""));
}

export function canApplyCreateAttachDraft(item: CreatePrepareAttachDraftQueueItem) {
  if (item.reviewState !== "accepted_for_apply") return false;
  if (item.applyState === "applied") return false;
  if (!isSupportedApplyTargetType(item.attachTargetType)) return false;
  return true;
}

function historyCodeLabel(code: string | null | undefined) {
  if (!code) return "ohne Code";
  return HISTORY_CODE_LABELS[code] || "unbekannter Code";
}

function historySortDesc(left: CreatePrepareAttachDraftHistoryEvent, right: CreatePrepareAttachDraftHistoryEvent) {
  const byCreated = String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
  if (byCreated !== 0) return byCreated;
  return String(right.eventId || "").localeCompare(String(left.eventId || ""));
}

function buildTimeline(item: CreatePrepareAttachDraftQueueItem): CreatePrepareAttachDraftHistoryEvent[] {
  return [...(item.reviewEvents ?? []), ...(item.applyEvents ?? [])].sort(historySortDesc);
}

export function CreateAttachDraftReviewList(props: {
  items: CreatePrepareAttachDraftQueueItem[];
  decisionBusyDraftId: string | null;
  applyBusyDraftId: string | null;
  reviewNoteByDraft: Record<string, string>;
  applyNoteByDraft: Record<string, string>;
  decisionError: string | null;
  applyError: string | null;
  historyLoadingDraftId?: string | null;
  historyHasMoreByDraft?: Record<string, boolean>;
  historyErrorByDraft?: Record<string, string | null | undefined>;
  onReviewNoteChange: (draftId: string, value: string) => void;
  onApplyNoteChange: (draftId: string, value: string) => void;
  onReviewDecision: (draftId: string, decision: CreatePrepareAttachDraftReviewDecision) => void;
  onApply: (draftId: string) => void;
  onLoadMoreHistory?: (draftId: string) => void;
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
          {(() => {
            const timeline = buildTimeline(item);
            const hasMore =
              props.historyHasMoreByDraft?.[item.draftId] ??
              item.historyHasMore ??
              false;
            const historyError = props.historyErrorByDraft?.[item.draftId];
            const historyBusy = props.historyLoadingDraftId === item.draftId;
            return (
              <>
                {(timeline.length > 0 || hasMore) ? (
                  <div className="mt-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-2 text-xs">
                    <p className="font-semibold text-[rgb(var(--fg))]">Audit-Timeline (neu -&gt; alt)</p>
                    {timeline.length > 0 ? (
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {timeline.map((event) => (
                          <li key={event.eventId}>
                            {event.createdAt || "-"} | {event.eventType} | by {event.actorUserId}
                            {event.eventType === "review" ? (
                              <>
                                {` | review ${event.previousReviewState} -> ${event.nextReviewState}`}
                                {` | apply ${event.previousApplyState} -> ${event.nextApplyState}`}
                                {` | code: ${event.resultCode} (${historyCodeLabel(event.resultCode)})`}
                                {event.reviewNote ? ` | note: ${event.reviewNote}` : ""}
                              </>
                            ) : (
                              <>
                                {` | result: ${event.result}`}
                                {` | target: ${event.targetType ?? "-"}:${event.targetId ?? "-"}`}
                                {` | apply ${event.previousApplyState} -> ${event.nextApplyState}`}
                                {` | code: ${event.resultCode} (${historyCodeLabel(event.resultCode)})`}
                                {event.errorCode
                                  ? ` | error: ${event.errorCode} (${historyCodeLabel(event.resultCode)})`
                                  : ""}
                              </>
                            )}
                            {event.normalizedFromLegacy ? " | legacy-normalized" : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-[rgb(var(--muted))]">Noch keine Timeline-Events geladen.</p>
                    )}
                    {historyError ? (
                      <p className="mt-2 rounded-md border border-rose-300/60 bg-rose-50/80 px-2 py-1 text-xs text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
                        {historyError}
                      </p>
                    ) : null}
                    {props.onLoadMoreHistory && hasMore ? (
                      <button
                        type="button"
                        className="mt-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:opacity-60"
                        disabled={historyBusy}
                        onClick={() => props.onLoadMoreHistory?.(item.draftId)}
                      >
                        {historyBusy ? "Lade Verlauf ..." : "Mehr Verlauf laden"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            );
          })()}

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
              Duplicate-Risk: nicht still durchwinken. Manuelle Prüfung erforderlich.
            </p>
          ) : null}
          {item.reviewState === "accepted_for_apply" &&
          item.applyState !== "applied" &&
          !isSupportedApplyTargetType(item.attachTargetType) ? (
            <p className="mt-2 rounded-md border border-amber-300/60 bg-amber-50/80 px-2 py-1 text-xs text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
              Apply ist für diesen Zieltyp noch nicht freigeschaltet. Draft bleibt reviewbar ohne Live-Apply.
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

          {item.appliedAt || item.appliedBy ? (
            <p className="mt-2 text-xs">
              applyAt: {item.appliedAt ?? "-"} | applyBy: {item.appliedBy ?? "-"}
            </p>
          ) : null}
          {item.applyNote ? (
            <p className="mt-1 text-xs">
              applyNote: <span className="font-semibold text-[rgb(var(--fg))]">{item.applyNote}</span>
            </p>
          ) : null}
          {item.applyError ? (
            <p className="mt-1 rounded-md border border-rose-300/60 bg-rose-50/80 px-2 py-1 text-xs text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
              applyError: {item.applyError}
            </p>
          ) : null}

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
          <div className="mt-2">
            <label className="text-xs font-semibold text-[rgb(var(--fg))]" htmlFor={`apply-note-${item.draftId}`}>
              Apply-Notiz (optional)
            </label>
            <textarea
              id={`apply-note-${item.draftId}`}
              className="mt-1 w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs"
              rows={2}
              value={props.applyNoteByDraft[item.draftId] ?? ""}
              onChange={(event) => props.onApplyNoteChange(item.draftId, event.target.value)}
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
            {canApplyCreateAttachDraft(item) ? (
              <button
                type="button"
                className="rounded-full border border-emerald-300/70 bg-emerald-50/70 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                disabled={props.applyBusyDraftId === item.draftId}
                onClick={() => props.onApply(item.draftId)}
              >
                {item.applyState === "apply_failed" ? "Apply erneut versuchen" : "Manuell applyen"}
              </button>
            ) : null}
          </div>
        </article>
      ))}
      {props.decisionError ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-2 py-1 text-xs text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {props.decisionError}
        </p>
      ) : null}
      {props.applyError ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-2 py-1 text-xs text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {props.applyError}
        </p>
      ) : null}
    </div>
  );
}
