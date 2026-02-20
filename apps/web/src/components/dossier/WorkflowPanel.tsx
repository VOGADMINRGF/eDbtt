import { useState } from "react";
import type { WorkflowState } from "./useInstitutionalDossier";

const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  draft: "Entwurf",
  in_review: "In Prüfung",
  approved: "Freigegeben",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

function formatDate(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

type WorkflowPanelProps = {
  workflow?: { state: WorkflowState; updatedAt?: string; updatedByRole?: string } | null;
  viewerRole: string;
  onTransition?: (nextState: WorkflowState, note?: string) => void;
  notice?: string | null;
};

export function WorkflowPanel({ workflow, viewerRole, onTransition, notice }: WorkflowPanelProps) {
  const state = workflow?.state ?? "draft";
  const canTransitionUi = viewerRole === "admin" || viewerRole === "staff";
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const handlePublish = () => {
    if (state === "approved") {
      const note = window.prompt("Begründung für Veröffentlichung", "");
      if (!note || note.trim().length < 3) {
        setLocalNotice("Begründung erforderlich (mindestens 3 Zeichen).");
        return;
      }
      setLocalNotice(null);
      onTransition?.("published", note.trim());
      return;
    }
    onTransition?.("published");
  };

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Workflow-Status
      </p>
      <div className="text-sm font-semibold text-[rgb(var(--fg))]">{WORKFLOW_LABELS[state]}</div>
      <div className="text-[12px] text-[rgb(var(--muted))]">
        Letzte Änderung: <span className="text-[rgb(var(--fg))]">{formatDate(workflow?.updatedAt ?? null)}</span>
      </div>
      <div className="text-[12px] text-[rgb(var(--muted))]">
        Rolle: <span className="text-[rgb(var(--fg))]">{workflow?.updatedByRole ?? "–"}</span>
      </div>

      {canTransitionUi ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost text-xs" onClick={() => onTransition?.("in_review")}>In Prüfung setzen</button>
          <button type="button" className="btn btn-ghost text-xs" onClick={() => onTransition?.("approved")}>Freigeben</button>
          <button type="button" className="btn btn-ghost text-xs" onClick={handlePublish}>Veröffentlichen</button>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">
          Workflow-Änderungen sind in dieser Rollenansicht nicht freigeschaltet.
        </div>
      )}

      {notice ? <div className="text-[11px] text-[rgb(var(--muted))]">{notice}</div> : null}
      {localNotice ? <div className="text-[11px] text-[rgb(var(--muted))]">{localNotice}</div> : null}
    </div>
  );
}

export default WorkflowPanel;
