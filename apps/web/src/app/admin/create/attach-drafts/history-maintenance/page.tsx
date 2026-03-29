"use client";

import { useEffect, useRef, useState } from "react";
import {
  CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT,
  CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MAX_PREVIEW_LIMIT,
  type CreatePrepareAttachHistoryBackfillReport,
} from "@/features/create/attachDraftHistoryBackfillContract";
import { CreateHistoryMaintenanceDiagnosticsPanel } from "@/features/create/historyMaintenanceDiagnosticsUi";

export default function AdminCreateAttachDraftHistoryMaintenancePage() {
  const [report, setReport] = useState<CreatePrepareAttachHistoryBackfillReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLimit, setPreviewLimit] = useState(
    String(CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_DEFAULT_PREVIEW_LIMIT),
  );
  const [scanLimit, setScanLimit] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const previewLimitRef = useRef(previewLimit);
  const scanLimitRef = useRef(scanLimit);

  useEffect(() => {
    previewLimitRef.current = previewLimit;
    scanLimitRef.current = scanLimit;
  }, [previewLimit, scanLimit]);

  useEffect(() => {
    let ignored = false;

    async function loadDiagnostics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (previewLimitRef.current.trim()) params.set("previewLimit", previewLimitRef.current.trim());
        if (scanLimitRef.current.trim()) params.set("scanLimit", scanLimitRef.current.trim());

        const res = await fetch(
          `/api/admin/create/attach-drafts/history-maintenance?${params.toString()}`,
          { cache: "no-store" },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || res.statusText);
        }
        if (ignored) return;
        setReport(body as CreatePrepareAttachHistoryBackfillReport);
      } catch (loadError: unknown) {
        if (ignored) return;
        setReport(null);
        setError(
          loadError instanceof Error ? loadError.message : "attach_draft_history_maintenance_load_failed",
        );
      } finally {
        if (!ignored) setLoading(false);
      }
    }

    void loadDiagnostics();

    return () => {
      ignored = true;
    };
  }, [reloadToken]);

  return (
    <main>
      <h1 className="sr-only">History-Maintenance fuer Attach-Drafts</h1>
      <CreateHistoryMaintenanceDiagnosticsPanel
        report={report}
        loading={loading}
        error={error}
        previewLimit={previewLimit}
        scanLimit={scanLimit}
        onPreviewLimitChange={(value) => {
          if (!value.trim()) {
            setPreviewLimit("");
            return;
          }
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) {
            setPreviewLimit(value);
            return;
          }
          const clamped = Math.max(
            1,
            Math.min(CREATE_PREPARE_ATTACH_HISTORY_BACKFILL_MAX_PREVIEW_LIMIT, Math.floor(numeric)),
          );
          setPreviewLimit(String(clamped));
        }}
        onScanLimitChange={setScanLimit}
        onReload={() => setReloadToken((prev) => prev + 1)}
      />
    </main>
  );
}
