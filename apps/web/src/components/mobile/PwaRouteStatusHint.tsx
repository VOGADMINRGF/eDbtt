import Link from "next/link";

type PwaRouteStatusHintAction = {
  href: string;
  label: string;
};

type PwaRouteStatusHintProps = {
  title: string;
  body: string;
  caution?: string;
  actions?: readonly PwaRouteStatusHintAction[];
  className?: string;
  tone?: "dark" | "light";
};

export default function PwaRouteStatusHint({
  title,
  body,
  caution = "Bereits geladene Inhalte bleiben lesbar. Neue Schritte brauchen Verbindung; es gibt keine stille Offline-Synchronisation.",
  actions = [],
  className = "",
  tone = "dark",
}: PwaRouteStatusHintProps) {
  const palette =
    tone === "light"
      ? {
          root: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
          eyebrow: "text-sky-700",
          title: "text-[rgb(var(--fg))]",
          body: "text-[rgb(var(--muted))]",
          caution: "text-[rgb(var(--muted))]",
          primaryAction: "inline-flex items-center justify-center rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500",
          secondaryAction:
            "inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] transition hover:border-sky-300/60",
        }
      : {
          root: "border-sky-300/30 bg-sky-500/10 text-slate-100",
          eyebrow: "text-sky-200",
          title: "text-white",
          body: "text-slate-200",
          caution: "text-slate-300",
          primaryAction:
            "inline-flex items-center justify-center rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300",
          secondaryAction:
            "inline-flex items-center justify-center rounded-full border border-slate-500 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-cyan-300/60",
        };

  return (
    <section
      className={`rounded-2xl border p-4 text-sm ${palette.root} ${className}`.trim()}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>PWA / mobil</p>
      <h2 className={`mt-1 text-base font-semibold ${palette.title}`}>{title}</h2>
      <p className={`mt-2 leading-6 ${palette.body}`}>{body}</p>
      <p className={`mt-2 text-xs leading-5 ${palette.caution}`}>{caution}</p>
      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={index === 0 ? palette.primaryAction : palette.secondaryAction}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
