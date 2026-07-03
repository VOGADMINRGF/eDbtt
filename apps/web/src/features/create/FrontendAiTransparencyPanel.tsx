import {
  getFrontendAiTransparencyStatusLabel,
  type FrontendAiTransparencyReadModel,
  type FrontendAiTransparencyStatus,
} from "@/features/create/frontendAiTransparency";

type FrontendAiTransparencyPanelProps = {
  model: FrontendAiTransparencyReadModel;
};

const STATUS_CLASSNAMES: Record<FrontendAiTransparencyStatus, string> = {
  not_started: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
  running: "border-sky-300/60 bg-sky-50/80 text-sky-800",
  completed: "border-emerald-300/60 bg-emerald-50/80 text-emerald-800",
  skipped_no_ai: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
  review_required: "border-amber-300/60 bg-amber-50/80 text-amber-800",
  planned_not_active: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
};

function StatusBadge({ status }: { status: FrontendAiTransparencyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${STATUS_CLASSNAMES[status]}`}
      data-ai-step-status={status}
    >
      {getFrontendAiTransparencyStatusLabel(status)}
    </span>
  );
}

export default function FrontendAiTransparencyPanel({
  model,
}: FrontendAiTransparencyPanelProps) {
  return (
    <section
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--fg))]"
      data-frontend-ai-transparency={model.surface}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        KI-Transparenz
      </p>
      <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{model.title}</h2>
      <p className="mt-2 max-w-3xl leading-6 text-[rgb(var(--muted))]">{model.summary}</p>

      <div className="mt-4 space-y-3">
        {model.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3"
            data-frontend-ai-step={step.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={step.status} />
              <p className="font-semibold text-[rgb(var(--fg))]">{step.label}</p>
            </div>
            <p className="mt-2 leading-6 text-[rgb(var(--muted))]">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Sichtbar jetzt
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            {model.visibleNow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nicht sichtbar
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            {model.hiddenByPolicy.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Später
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            {model.futurePathNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
