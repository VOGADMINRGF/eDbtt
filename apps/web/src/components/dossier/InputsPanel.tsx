import Link from "next/link";
import type { PresentationContribution, PresentationStream, PresentationTraceability } from "./presentation";

type InputsPanelProps = {
  streams: PresentationStream[];
  contributions: PresentationContribution[];
  traceability: PresentationTraceability;
  statementTitleById: Map<string, string>;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function renderStatementHint(ids: string[] | undefined, statementTitleById: Map<string, string>) {
  if (!ids || ids.length === 0) return "Keine Zuordnung";
  const titles = ids.map((id) => statementTitleById.get(id) ?? id);
  const preview = titles.slice(0, 2).join(", ");
  return `${titles.length} Kernaussagen${preview ? ` · ${preview}` : ""}`;
}

export function InputsPanel({ streams, contributions, traceability, statementTitleById }: InputsPanelProps) {
  const streamMap = traceability.streamsToStatements ?? {};
  const contributionMap = traceability.contributionsToStatements ?? {};

  return (
    <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <div id="streams" className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Material</div>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Themenströme</p>
            <div className="space-y-2 text-sm">
              {streams.length ? (
                streams.map((stream) => (
                  <Link
                    key={stream.id}
                    href={`/streams/${stream.id}`}
                    className="block rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[rgb(var(--fg))]"
                  >
                    <div className="text-sm font-semibold">{stream.title}</div>
                    <div className="text-[11px] text-[rgb(var(--muted))]">{formatDate(stream.date)}</div>
                    <div className="text-[11px] text-[rgb(var(--muted))]">
                      {renderStatementHint(streamMap[stream.id], statementTitleById)}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">Keine Themenströme hinterlegt.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="beitraege" className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beiträge</div>
        <div className="space-y-2 text-sm">
          {contributions.length ? (
            contributions.map((item) => (
              <Link
                key={item.id}
                href={`/beitraege/${item.id}`}
                className="block rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[rgb(var(--fg))]"
              >
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-[11px] text-[rgb(var(--muted))]">{formatDate(item.date)}</div>
                <div className="text-[11px] text-[rgb(var(--muted))]">
                  {renderStatementHint(contributionMap[item.id], statementTitleById)}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Keine Beiträge hinterlegt.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default InputsPanel;
