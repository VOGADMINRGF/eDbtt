import type { InstitutionalSnapshot } from "./useInstitutionalDossier";

const STATUS_CLASS = {
  verified: "text-emerald-400",
  invalid: "text-rose-400",
  verifying: "text-sky-400",
  error: "text-amber-300",
  unverified: "text-[rgb(var(--muted))]",
} as const;

function formatDate(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function mono(value: string) {
  return <span className="font-mono text-[12px] tracking-tight text-[rgb(var(--fg))]">{value}</span>;
}

type SnapshotPanelProps = {
  snapshot?: InstitutionalSnapshot | null;
  verify: { state: "unverified" | "verifying" | "verified" | "invalid" | "error" };
  onVerify?: () => void;
  loading?: boolean;
};

export function SnapshotPanel({ snapshot, verify, onVerify, loading }: SnapshotPanelProps) {
  const hasSnapshot = Boolean(snapshot?.snapshotId && snapshot?.contentHash);
  const statusLabel =
    verify.state === "verified"
      ? "Signatur gültig"
      : verify.state === "invalid"
        ? "Signatur ungültig"
        : verify.state === "verifying"
          ? "Signatur wird geprüft"
          : verify.state === "error"
            ? "Prüfung fehlgeschlagen"
            : "Signatur nicht geprüft";

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Verifizierter Snapshot
      </p>
      {hasSnapshot && snapshot ? (
        <>
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Snapshot vorhanden</div>
          <div className="grid gap-1 text-[12px] text-[rgb(var(--muted))]">
            <div>ID: {mono(snapshot.snapshotId)}</div>
            <div>Hash: {mono(`${snapshot.contentHash.slice(0, 12)}…`)}</div>
            <div>PublicKey-ID: {mono(`${snapshot.publicKeyId.slice(0, 12)}…`)}</div>
            <div>Stand: <span className="text-[rgb(var(--fg))]">{formatDate(snapshot.createdAt)}</span></div>
            <div className={`text-xs font-semibold ${STATUS_CLASS[verify.state]}`}>{statusLabel}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost text-xs"
              disabled={loading || verify.state === "verifying"}
              onClick={() => onVerify?.()}
            >
              Signatur prüfen
            </button>
            <span className="text-[11px] text-[rgb(var(--muted))]">
              Prüfung basiert auf Hash + Public Key.
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Kein Snapshot vorhanden</div>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Für dieses Dossier liegt aktuell kein verifizierter Snapshot vor.
          </p>
          <div className="text-[11px] text-[rgb(var(--muted))]">Signatur nicht geprüft</div>
        </>
      )}
    </div>
  );
}

export default SnapshotPanel;
