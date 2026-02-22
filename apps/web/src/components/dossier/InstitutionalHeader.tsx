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

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
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
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-soft">
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniCard label="Workflow" value={workflowLabel} />
        <MiniCard label="Zuletzt geändert" value={updatedAt} />
        <MiniCard label="Snapshot" value={verifyLabel} />
        <MiniCard label="Letztes Ereignis" value={lastAuditLabel} />
      </div>

      <details className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
        <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Details (Snapshot · Workflow)
        </summary>
        <div className="mt-3 space-y-4">
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
      </details>
    </div>
  );
}

export default InstitutionalHeader;
