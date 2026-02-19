import type { ReactNode } from "react";

type MetaChip = { label: string; value: string };

type DossierPageShellProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  note?: string;
  metaChips?: MetaChip[];
  left: ReactNode;
  right: ReactNode;
};

export function DossierPageShell({
  eyebrow,
  title,
  lead,
  note,
  metaChips = [],
  left,
  right,
}: DossierPageShellProps) {
  return (
    <section className="space-y-8">
      <header className="space-y-4 border-b border-[rgb(var(--border))] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-5xl">
          {title}
        </h1>
        {lead ? (
          <p className="max-w-3xl text-lg text-[rgb(var(--muted))]">
            {lead}
          </p>
        ) : null}
        {note ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            {note}
          </p>
        ) : null}
        {metaChips.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
            {metaChips.map((chip) => (
              <span key={`${chip.label}-${chip.value}`} className="vog-chip">
                {chip.label}: <span className="font-semibold text-[rgb(var(--fg))]">{chip.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-10">{left}</div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">{right}</aside>
      </div>
    </section>
  );
}

export default DossierPageShell;
