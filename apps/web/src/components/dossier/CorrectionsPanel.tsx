import type { Dossier } from "@features/dossier";

type Correction = NonNullable<Dossier["corrections"]>[number];

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  accepted: "Akzeptiert",
  rejected: "Abgelehnt",
};

const STATUS_STYLES: Record<string, string> = {
  open: "border-slate-500/45 bg-slate-500/10",
  accepted: "border-emerald-500/45 bg-emerald-500/12",
  rejected: "border-rose-500/45 bg-rose-500/12",
};

const KIND_LABELS: Record<string, string> = {
  correction: "Korrektur",
  objection: "Einspruch",
};

const TARGET_LABELS: Record<string, string> = {
  claim: "Kernaussage",
  source: "Quelle",
  question: "Frage",
};

export function CorrectionsPanel({ items = [] }: { items?: Dossier["corrections"] }) {
  return (
    <section className="vog-card p-5 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Korrekturen & Einspruch
      </div>
      {items.length ? (
        <div className="space-y-2 text-[11px] text-[rgb(var(--muted))]">
          {items.map((item: Correction) => (
            <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[rgb(var(--fg))]">
                  {KIND_LABELS[item.kind] ?? item.kind} · {TARGET_LABELS[item.targetType] ?? item.targetType}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    STATUS_STYLES[item.status] ?? "border-[rgb(var(--border))]"
                  }`}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{item.summary}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[rgb(var(--muted))]">Keine Korrekturen oder Einsprüche gemeldet.</p>
      )}
      <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[11px] text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Einspruch einreichen (Demo)</p>
        <p>In dieser Ansicht ist die Einreichung deaktiviert.</p>
      </div>
    </section>
  );
}

export default CorrectionsPanel;
