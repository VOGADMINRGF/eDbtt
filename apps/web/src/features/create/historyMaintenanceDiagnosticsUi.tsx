import type { CreatePrepareAttachHistoryBackfillReport } from "@/features/create/attachDraftHistoryBackfill";

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
  const reasonEntries = Object.entries(report?.reasonBuckets || {}).sort((left, right) => right[1] - left[1]);
  const samples = report?.samples || [];

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Create History Maintenance</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Read-only Diagnose fuer Legacy-History-Events. Dieser Screen ist dry-run only und fuehrt kein Apply aus.
        </p>
      </header>

      <div className="rounded-xl border border-sky-300/50 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-100">
        Read-only / dry-run only. Kein Backfill-Apply aus diesem Screen.
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
            {samples.length === 0 ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map((sample) => (
                      <tr key={`${sample.rowId ?? "missing"}:${sample.draftId ?? "missing"}:${sample.status}`} className="border-b border-[rgb(var(--border))]/60 align-top">
                        <td className="px-2 py-1 font-mono text-[11px] text-[rgb(var(--fg))]">{sample.rowId ?? "missing"}</td>
                        <td className="px-2 py-1 font-mono text-[11px] text-[rgb(var(--fg))]">{sample.draftId ?? "missing"}</td>
                        <td className="px-2 py-1 text-[rgb(var(--fg))]">{sample.status}</td>
                        <td className="px-2 py-1">{sample.inferredEventType ?? "unknown"}</td>
                        <td className="px-2 py-1">
                          {sample.reasons.length > 0 ? sample.reasons.join(", ") : "none"}
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
