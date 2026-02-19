type InboxItem = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  priority?: string;
};

type EditorialInboxProps = {
  items?: InboxItem[];
};

const STATUS_STYLES: Record<string, string> = {
  offen: "border-slate-500/45 bg-slate-500/10",
  in_pruefung: "border-violet-500/45 bg-violet-500/12",
  erledigt: "border-emerald-500/45 bg-emerald-500/12",
};

const STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_pruefung: "In Prüfung",
  erledigt: "Erledigt",
};

const PRIORITY_LABELS: Record<string, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export function EditorialInbox({ items = [] }: EditorialInboxProps) {
  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Redaktions-Postfach (Demo)
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[rgb(var(--muted))]">
                <span className="font-semibold text-[rgb(var(--fg))]">{item.title}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_STYLES[item.status ?? "offen"] ?? "border-[rgb(var(--border))]"}`}
                >
                  {STATUS_LABELS[item.status ?? "offen"] ?? item.status ?? "Offen"}
                </span>
              </div>
              {item.subtitle ? <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{item.subtitle}</p> : null}
              {item.priority ? (
                <p className="mt-2 text-[10px] text-[rgb(var(--muted))]">
                  Priorität: {PRIORITY_LABELS[item.priority] ?? item.priority}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[rgb(var(--muted))]">Keine offenen redaktionellen Aufgaben.</p>
      )}
    </section>
  );
}

export default EditorialInbox;
