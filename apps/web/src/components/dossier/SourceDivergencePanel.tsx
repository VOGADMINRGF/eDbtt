import type { Dossier, TruthGuardrails } from "@features/dossier";

type Finding = Dossier["analyze"]["findings"][number];
type Source = Dossier["sourceSet"][number];

function sourceLabel(sourceId: string, sources: Source[]) {
  const numeric = /^src-(\d+)$/i.exec(sourceId);
  if (numeric) {
    const index = Number(numeric[1]) - 1;
    if (index >= 0 && index < sources.length) {
      return sources[index]?.title ?? sourceId;
    }
  }
  return sourceId;
}

export function SourceDivergencePanel({
  guardrails,
  findings,
  corrections = [],
  sources = [],
  sectionId,
}: {
  guardrails: TruthGuardrails;
  findings: Dossier["analyze"]["findings"];
  corrections?: Dossier["corrections"];
  sources?: Dossier["sourceSet"];
  sectionId?: string;
}) {
  const divergentFindings = findings.filter(
    (item) => item.finding === "contradicts" || item.finding === "unclear",
  );
  const openCounterEvidence = divergentFindings.slice(0, 5);

  return (
    <section id={sectionId} className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Abweichende Quellenlage
      </div>
      <p className="text-[11px] text-[rgb(var(--muted))]">
        Divergenzstatus:{" "}
        <span className="font-semibold text-[rgb(var(--fg))]">
          {guardrails.sourceDivergence.status}
        </span>{" "}
        ({Math.round(guardrails.sourceDivergence.score * 100)}% widersprüchliche Evidenz)
      </p>
      {divergentFindings.length > 0 ? (
        <div className="space-y-2">
          {divergentFindings.slice(0, 3).map((item: Finding) => (
            <div
              key={item.id}
              className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px]"
            >
              <p className="font-semibold text-[rgb(var(--fg))]">
                {item.finding === "contradicts" ? "Widerspruch" : "Unklare Evidenz"} ·{" "}
                {sourceLabel(item.sourceId, sources)}
              </p>
              {item.rationale ? (
                <p className="mt-1 text-[rgb(var(--muted))]">{item.rationale}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[rgb(var(--muted))]">
          Keine abweichenden Quellenbelege in den aktuellen Findings.
        </p>
      )}

      <div className="border-t border-[rgb(var(--border))] pt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Korrekturen & Widerspruch
        </p>
        {corrections.length > 0 ? (
          <div className="space-y-2">
            {corrections.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px]"
              >
                <p className="font-semibold text-[rgb(var(--fg))]">
                  {item.kind === "objection" ? "Einspruch" : "Korrektur"} · {item.status}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{item.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Aktuell keine Korrekturen oder Einsprüche.
          </p>
        )}
      </div>

      <div className="border-t border-[rgb(var(--border))] pt-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Offene Gegenbelege
        </p>
        {openCounterEvidence.length > 0 ? (
          <ul className="space-y-1 text-[11px] text-[rgb(var(--muted))]">
            {openCounterEvidence.map((item) => (
              <li key={`${item.id}-counter`}>
                · {sourceLabel(item.sourceId, sources)}: {item.rationale ?? "Beleg in Prüfung"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Keine offenen Gegenbelege markiert.
          </p>
        )}
      </div>
    </section>
  );
}

export default SourceDivergencePanel;
