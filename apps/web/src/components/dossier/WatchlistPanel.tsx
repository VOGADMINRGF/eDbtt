type WatchlistItem = {
  id: string;
  label: string;
  kind?: string;
  updatedAt?: string;
};

type WatchlistPanelProps = {
  items?: WatchlistItem[];
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export function WatchlistPanel({ items = [] }: WatchlistPanelProps) {
  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Beobachtungsliste & Updates (Demo)
      </div>
      {items.length ? (
        <div className="space-y-2 text-[11px] text-[rgb(var(--muted))]">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.label}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">
                Typ: {item.kind ?? "Eintrag"} · Aktualisiert: {formatDate(item.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[rgb(var(--muted))]">Keine Watchlist-Einträge hinterlegt.</p>
      )}
    </section>
  );
}

export default WatchlistPanel;
