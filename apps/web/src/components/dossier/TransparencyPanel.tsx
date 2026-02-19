import type { Dossier } from "@features/dossier";

type TransparencyPanelProps = {
  sources: Dossier["sourceSet"];
  runReceipt?: Dossier["analyze"]["runReceipt"];
  createdAt?: string | null;
  updatedAt?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function dataPolicyText(contentPolicy: Dossier["analyze"]["runReceipt"]["contentPolicy"] | undefined) {
  if (!contentPolicy) {
    return "Es werden keine Volltexte gespeichert. Nur Titel und Links.";
  }
  if (contentPolicy.storeFullText) {
    return "Volltexte können gespeichert werden; Auszüge sind begrenzt.";
  }
  if (!contentPolicy.storeFullText && contentPolicy.storeTitles) {
    return "Es werden keine Volltexte gespeichert. Nur Titel und Links.";
  }
  return "Daten werden in komprimierter Form dokumentiert.";
}

export function TransparencyPanel({ sources, runReceipt, createdAt, updatedAt }: TransparencyPanelProps) {
  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Transparenz & Protokoll
      </div>
      <div className="space-y-1 text-sm text-[rgb(var(--fg))]">
        <div>Analyseverfahren: {runReceipt?.pipelineVersion ?? "Strukturiertes Analyseverfahren"}</div>
        <div>Verfahrensversion: {runReceipt?.promptVersion ?? "—"}</div>
        <div>Protokoll-ID: {runReceipt?.id ?? "—"}</div>
        <div>Dokumentationsstand: {runReceipt?.snapshotId ?? "—"}</div>
      </div>
      <div className="text-[11px] text-[rgb(var(--muted))]">
        Erstellt: {formatDate(createdAt)} · Aktualisiert: {formatDate(updatedAt ?? createdAt)}
      </div>
      <div className="text-[11px] text-[rgb(var(--muted))]">{dataPolicyText(runReceipt?.contentPolicy)}</div>
      <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</div>
      <ul className="space-y-2 text-sm text-[rgb(var(--fg))]">
        {sources.length ? (
          sources.map((src, idx) => (
            <li key={`${src.canonicalUrl}-${idx}`}>
              {src.canonicalUrl ? (
                <a
                  href={src.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {src.title ?? src.canonicalUrl}
                </a>
              ) : (
                <span>{src.title ?? "Quelle"}</span>
              )}
              <span className="text-[rgb(var(--muted))]"> ({src.publisher ?? "-"})</span>
            </li>
          ))
        ) : (
          <li className="text-[11px] text-[rgb(var(--muted))]">Keine Quellen hinterlegt.</li>
        )}
      </ul>
    </section>
  );
}

export default TransparencyPanel;
