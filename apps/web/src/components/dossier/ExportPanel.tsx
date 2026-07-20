import { DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES } from "@/features/review/dossierExportShareTruth";
import { buildCanonicalDossierEmbedSnippet } from "./runtimeTruth";

type ExportPanelProps = {
  dossierId: string;
  exportBase?: string;
};

export function ExportPanel({ dossierId, exportBase }: ExportPanelProps) {
  const base = exportBase ?? `/api/dossier/${dossierId}/export`;
  const jsonHref = `${base}?format=json`;
  const csvHref = `${base}?format=csv`;
  const embedSnippet =
    buildCanonicalDossierEmbedSnippet(dossierId) ??
    "Einbettung ist erst verfügbar, sobald ein kanonisches Dossier bereitsteht.";

  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Verifizierbarer Export
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <a href={jsonHref} className="btn btn-ghost text-xs" target="_blank" rel="noreferrer">
          Export JSON
        </a>
        <a href={csvHref} className="btn btn-ghost text-xs" target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>
      <div className="text-[11px] text-[rgb(var(--muted))]">
        Export enthält: Snapshot · Signatur · Audit-Kette · Workflow-Status.
      </div>
      <div className="text-[11px] text-[rgb(var(--muted))]">
        {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[2]} {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[3]}
      </div>
      <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[11px] text-[rgb(var(--muted))]">
        <summary className="cursor-pointer text-[11px] font-semibold text-[rgb(var(--fg))]">
          Einbettung (optional)
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-all text-[10px] text-[rgb(var(--muted))]">
          {embedSnippet}
        </pre>
      </details>
    </section>
  );
}

export default ExportPanel;
