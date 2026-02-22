import SnapshotPanel from "./SnapshotPanel";
import WorkflowPanel from "./WorkflowPanel";
import type { useInstitutionalDossier } from "./useInstitutionalDossier";

type ViewerRole =
  | "citizen"
  | "organization"
  | "administration"
  | "journalist"
  | "research"
  | "admin"
  | "staff";

function formatDateTime(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function chipIcon(
  name: "workflow" | "updated" | "snapshot" | "event",
  className = "h-3.5 w-3.5",
) {
  const cls = className;
  switch (name) {
    case "workflow":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M7 7h6a4 4 0 0 1 4 4v10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 7l3-3M7 7l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "updated":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "snapshot":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M12 3a7 7 0 0 0-7 7c0 4 3 9 7 11 4-2 7-7 7-11a7 7 0 0 0-7-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 8v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 10h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "event":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cls}>
          <path d="M6 12h4l2-5 2 10 2-5h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function InstitutionalHeader({
  dossierId: _dossierId,
  viewerRole,
  inst,
}: {
  dossierId: string;
  viewerRole: ViewerRole;
  inst: ReturnType<typeof useInstitutionalDossier>;
}) {
  void _dossierId;
  const { data, loading, verify, verifySignature, transition } = inst;
  const workflow = data?.workflow ?? null;
  const lastAudit = data?.auditTrail?.[0];
  const workflowLabel =
    workflow?.state === "in_review"
      ? "In Prüfung"
      : workflow?.state === "approved"
        ? "Freigegeben"
        : workflow?.state === "published"
          ? "Veröffentlicht"
          : workflow?.state === "archived"
            ? "Archiviert"
            : "Entwurf";
  const lastAuditLabel =
    lastAudit?.action === "workflow_transition"
      ? "Workflow geändert"
      : lastAudit?.action === "snapshot_created"
        ? "Snapshot erstellt"
        : lastAudit?.action === "editorial_accept"
          ? "Editorial Accept"
          : lastAudit?.action === "editorial_decision"
            ? "Editorial Entscheidung"
            : lastAudit?.action === "issue_delegated"
              ? "Delegation gesetzt"
              : lastAudit?.action ?? "–";
  const verifyLabel =
    verify.state === "verified"
      ? "verifiziert"
      : verify.state === "invalid"
        ? "ungültig"
        : verify.state === "verifying"
          ? "prüft"
          : verify.state === "error"
            ? "fehlerhaft"
            : "nicht geprüft";
  const updatedAt = formatDateTime(workflow?.updatedAt ?? lastAudit?.timestamp ?? null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            <span className="text-[rgb(var(--grad-from))]">{chipIcon("workflow")}</span>
            <span>
              Workflow: <span className="text-[rgb(var(--fg))]">{workflowLabel}</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            <span className="text-[rgb(var(--grad-from))]">{chipIcon("updated")}</span>
            <span>
              Zuletzt geändert: <span className="text-[rgb(var(--fg))]">{updatedAt}</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            <span className="text-[rgb(var(--grad-from))]">{chipIcon("snapshot")}</span>
            <span>
              Snapshot: <span className="text-[rgb(var(--fg))]">{verifyLabel}</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            <span className="text-[rgb(var(--grad-from))]">{chipIcon("event")}</span>
            <span>
              Letztes Ereignis: <span className="text-[rgb(var(--fg))]">{lastAuditLabel}</span>
            </span>
          </span>
        </div>
      </div>
      <SnapshotPanel
        snapshot={data?.snapshot ?? null}
        verify={verify}
        onVerify={verifySignature}
        loading={loading}
      />
      <WorkflowPanel
        workflow={workflow}
        viewerRole={viewerRole}
        onTransition={(next, note) => transition(next, note)}
      />
    </div>
  );
}

export default InstitutionalHeader;
