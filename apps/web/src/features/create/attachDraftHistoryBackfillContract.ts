export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MODES = ["dry_run", "apply"] as const;
export type CreatePrepareAttachHistoryBackfillMode =
  (typeof CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MODES)[number];

export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT = 8;
export const CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MAX_PREVIEW_LIMIT = 30;

export type CreatePrepareAttachHistoryBackfillStatus =
  | "canonical_already_ok"
  | "normalizable"
  | "unsafe_to_backfill";

export type CreatePrepareAttachHistoryBackfillSample = {
  rowId: string | null;
  draftId: string | null;
  status: CreatePrepareAttachHistoryBackfillStatus;
  inferredEventType: "review" | "apply" | null;
  reasons: string[];
};

export type CreatePrepareAttachHistoryBackfillReport = {
  mode: CreatePrepareAttachHistoryBackfillMode;
  totalScanned: number;
  canonical: number;
  normalizable: number;
  unsafe: number;
  applied: number;
  applySkipped: number;
  samples: CreatePrepareAttachHistoryBackfillSample[];
  reasonBuckets: Record<string, number>;
};
