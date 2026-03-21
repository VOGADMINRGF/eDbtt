import { useMemo, useState } from "react";
import type { CreatePrepareAttachHistoryBackfillReport } from "@/features/create/attachDraftHistoryBackfill";
import type { CreatePrepareAttachHistoryBackfillStatus } from "@/features/create/attachDraftHistoryBackfill";

type Props = {
  report: CreatePrepareAttachHistoryBackfillReport | null;
  loading: boolean;
  error: string | null;
  previewLimit: string;
  scanLimit: string;
  onPreviewLimitChange: (value: string) => void;
  onScanLimitChange: (value: string) => void;
  onReload: () => void;
};

type StatusFilter = "all" | CreatePrepareAttachHistoryBackfillStatus;
type ReasonSort = "count_desc" | "count_asc" | "reason_asc" | "reason_desc";

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "canonical_already_ok", label: "canonical_already_ok" },
  { value: "normalizable", label: "normalizable" },
  { value: "unsafe_to_backfill", label: "unsafe_to_backfill" },
];

const REASON_SORT_OPTIONS: Array<{ value: ReasonSort; label: string }> = [
  { value: "count_desc", label: "Count absteigend" },
  { value: "count_asc", label: "Count aufsteigend" },
  { value: "reason_asc", label: "Reason A-Z" },
  { value: "reason_desc", label: "Reason Z-A" },
];

export function CreateHistoryMaintenanceDiagnosticsPanel({
  report,
  loading,
  error,
  previewLimit,
  scanLimit,
  onPreviewLimitChange,
  onScanLimitChange,
  onReload,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reasonSort, setReasonSort] = useState<ReasonSort>("count_desc");

  const reasonEntries = useMemo(() => {
    const entries = Object.entries(report?.reasonBuckets || {});
    return entries.sort((left, right) => {
      if (reasonSort === "count_desc") {
        const byCount = right[1] - left[1];
        if (byCount !== 0) return byCount;
        return left[0].localeCompare(right[0]);
      }
      if (reasonSort === "count_asc") {
        const byCount = left[1] - right[1];
        if (byCount !== 0) return byCount;
        return left[0].localeCompare(right[0]);
      }
      if (reasonSort === "reason_desc") return right[0].localeCompare(left[0]);
      return left[0].localeCompare(right[0]);
    });
  }, [report?.reasonBuckets, reasonSort]);

  const samples = report?.samples || [];
  const filteredSamples = useMemo(() => {
    if (statusFilter === "all") return samples;
    return samples.filter((sample) => sample.status === statusFilter);
  }, [samples, statusFilter]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Create History Maintenance</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Read-only Diagnose fuer Legacy-History-Events. Dieser Screen ist dry-run only und fuehrt kein Apply aus.
        </p>
      </header>

      <div className="rounded-xl border border-sky-300/50 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-100">
        Read-only / dry-run only. Kein Backfill-Apply aus diesem Screen. Apply bleibt weiterhin nur per Script:
        <code className="ml-1 rounded bg-sky-100/80 px-1 py-0.5 text-[11px] dark:bg-sky-700/30">
          pnpm -C apps/web exec tsx scripts/create.history-backfill.ts --apply --json
        </code>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            previewLimit
            <input
              type="number"
              min={1}
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={previewLimit}
              onChange={(event) => onPreviewLimitChange(event.target.value)}
            />
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            scanLimit (optional)
            <input
              type="number"
              min={1}
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={scanLimit}
              onChange={(event) => onScanLimitChange(event.target.value)}
              placeholder="leer = full scan"
            />
          </label>

          <button
            type="button"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            onClick={onReload}
          >
            Neu laden
          </button>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Sample-Status
            <select
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Reason-Sortierung
            <select
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={reasonSort}
              onChange={(event) => setReasonSort(event.target.value as ReasonSort)}
            >
              {REASON_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? <p className="text-sm text-[rgb(var(--muted))]">Diagnostics wird geladen ...</p> : null}

      {error ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {report ? (
        <>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Summary</h2>
            <dl className="mt-2 grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt>Total scanned</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.totalScanned}</dd>
              </div>
              <div>
                <dt>Canonical</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.canonical}</dd>
              </div>
              <div>
                <dt>Normalizable</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.normalizable}</dd>
              </div>
              <div>
                <dt>Unsafe</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.unsafe}</dd>
              </div>
              <div>
                <dt>Applied</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.applied}</dd>
              </div>
              <div>
                <dt>Apply skipped</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.applySkipped}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd className="font-semibold text-[rgb(var(--fg))]">{report.mode}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Reason buckets</h2>
            {reasonEntries.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine reason buckets gefunden.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                {reasonEntries.map(([reason, count]) => (
                  <li key={reason}>
                    <span className="font-semibold text-[rgb(var(--fg))]">{reason}</span>: {count}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Samples</h2>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Zeige {filteredSamples.length} von {samples.length} Samples (Filter: {statusFilter}).
            </p>
            {filteredSamples.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine Sample-Events im aktuellen Report.</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-xs text-[rgb(var(--muted))]">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))] text-[11px] uppercase tracking-wide">
                      <th className="px-2 py-1">rowId</th>
                      <th className="px-2 py-1">draftId</th>
                      <th className="px-2 py-1">status</th>
                      <th className="px-2 py-1">inferredEventType</th>
                      <th className="px-2 py-1">reasons</th>
                      <th className="px-2 py-1">links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSamples.map((sample) => (
                      <tr key={`${sample.rowId ?? "missing"}:${sample.draftId ?? "missing"}:${sample.status}`} className="border-b border-[rgb(var(--border))]/60 align-top">
                        <td className="px-2 py-1 font-mono text-[11px] text-[rgb(var(--fg))]">{sample.rowId ?? "missing"}</td>
                        <td className="px-2 py-1 font-mono text-[11px] text-[rgb(var(--fg))]">{sample.draftId ?? "missing"}</td>
                        <td className="px-2 py-1 text-[rgb(var(--fg))]">{sample.status}</td>
                        <td className="px-2 py-1">{sample.inferredEventType ?? "unknown"}</td>
                        <td className="px-2 py-1">
                          {sample.reasons.length > 0 ? sample.reasons.join(", ") : "none"}
                        </td>
                        <td className="px-2 py-1">
                          {sample.draftId ? (
                            <div className="flex flex-col gap-1">
                              <a
                                className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                                href={`/admin/create/attach-drafts?reviewState=all&q=${encodeURIComponent(sample.draftId)}`}
                              >
                                Queue
                              </a>
                              <a
                                className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                                href={`/api/admin/create/attach-drafts/${encodeURIComponent(sample.draftId)}/history?type=all&limit=20`}
                              >
                                History JSON
                              </a>
                            </div>
                          ) : (
                            "n/a"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
