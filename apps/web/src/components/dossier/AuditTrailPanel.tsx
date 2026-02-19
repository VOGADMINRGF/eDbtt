import type { Dossier } from "@features/dossier";
import { useMemo, useState } from "react";

type AuditEntry = NonNullable<Dossier["auditTrail"]>[number];

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "source", label: "Quellen" },
  { id: "claim", label: "Kernaussagen" },
  { id: "question", label: "Fragen" },
  { id: "dossier", label: "Dossier" },
];

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export function AuditTrailPanel({ auditTrail = [] }: { auditTrail?: Dossier["auditTrail"] }) {
  const [filter, setFilter] = useState("all");
  const entries = useMemo(() => {
    if (filter === "all") return auditTrail;
    return auditTrail.filter((entry) => entry.targetType === filter);
  }, [auditTrail, filter]);

  return (
    <section className="vog-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Änderungsstand</p>
          <p className="text-[11px] text-[rgb(var(--muted))]">Chronologie der letzten Anpassungen.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-[rgb(var(--muted))]">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-2 py-1 ${
                filter === item.id ? "border-[rgb(var(--grad-from))] text-[rgb(var(--fg))]" : "border-[rgb(var(--border))]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 text-sm text-[rgb(var(--fg))]">
        {entries.length ? (
          entries.map((entry: AuditEntry) => (
            <div key={entry.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <div className="flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
                <span>
                  {entry.actorLabel ?? entry.actorRole} · {entry.action}
                </span>
                <span>{formatDate(entry.at)}</span>
              </div>
              {entry.note ? <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">{entry.note}</p> : null}
            </div>
          ))
        ) : (
          <p className="text-[11px] text-[rgb(var(--muted))]">Keine Einträge vorhanden.</p>
        )}
      </div>
    </section>
  );
}

export default AuditTrailPanel;
