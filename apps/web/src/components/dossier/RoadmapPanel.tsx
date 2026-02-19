type RoadmapItem = {
  id: string;
  label: string;
  status?: "live" | "in_arbeit" | "geplant" | string;
  eta?: string;
  ownerRole?: string;
  note?: string;
};

type RoadmapPanelProps = {
  items?: RoadmapItem[];
};

export function RoadmapPanel({ items = [] }: RoadmapPanelProps) {
  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Roadmap (Auszug)
      </div>
      {items.length ? (
        <div className="space-y-2 text-[11px] text-[rgb(var(--muted))]">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    item.status === "live"
                      ? "border-emerald-500/45 bg-emerald-500/10"
                      : item.status === "in_arbeit"
                        ? "border-amber-500/45 bg-amber-500/10"
                        : "border-slate-500/45 bg-slate-500/10"
                  }`}
                >
                  {item.status === "live"
                    ? "Live"
                    : item.status === "in_arbeit"
                      ? "In Arbeit"
                      : "Geplant"}
                </span>
              </div>
              <p className="text-[11px] text-[rgb(var(--muted))]">
                ETA: {item.eta ?? "—"} · Träger: {item.ownerRole ?? "—"}
              </p>
              {item.note ? <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">{item.note}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[rgb(var(--muted))]">Keine Roadmap-Einträge verfügbar.</p>
      )}
      <div className="text-[11px] text-[rgb(var(--muted))]">
        Hinweis: In der Demo sind einige Elemente als Slot sichtbar, um die spätere Nachvollziehbarkeit zu zeigen.
      </div>
    </section>
  );
}

export default RoadmapPanel;
