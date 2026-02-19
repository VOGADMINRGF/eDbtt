type ExportPanelProps = {
  dossierId: string;
  exportBase?: string;
};

export function ExportPanel({ dossierId, exportBase }: ExportPanelProps) {
  const base = exportBase ?? `/api/dossier/${dossierId}/export`;
  const jsonHref = `${base}?format=json`;
  const csvHref = `${base}?format=csv`;
  const embedSnippet =
    `<iframe src="/dossier/demo" title="Dossier Embed" style="width:100%;height:720px;border:0;"></iframe>`;

  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Export & Einbettung
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <a href={jsonHref} className="btn btn-ghost text-xs" target="_blank" rel="noreferrer">
          Export JSON
        </a>
        <a href={csvHref} className="btn btn-ghost text-xs" target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>
      <details className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[11px] text-[rgb(var(--muted))]">
        <summary className="cursor-pointer text-[11px] font-semibold text-[rgb(var(--fg))]">
          Embed-Code anzeigen
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-all text-[10px] text-[rgb(var(--muted))]">
          {embedSnippet}
        </pre>
      </details>
    </section>
  );
}

export default ExportPanel;
