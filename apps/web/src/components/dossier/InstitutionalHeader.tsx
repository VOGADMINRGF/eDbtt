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
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            Workflow: <span className="text-[rgb(var(--fg))]">{workflowLabel}</span>
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            Zuletzt geändert: <span className="text-[rgb(var(--fg))]">{updatedAt}</span>
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            Snapshot: <span className="text-[rgb(var(--fg))]">{verifyLabel}</span>
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 uppercase tracking-wide">
            Letztes Ereignis: <span className="text-[rgb(var(--fg))]">{lastAuditLabel}</span>
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
