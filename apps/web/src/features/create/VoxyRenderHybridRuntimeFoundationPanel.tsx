import type { VoxyRenderHybridRuntimeFoundationPanelModel } from "@/features/create/voxyRenderHybridRuntimeFoundationContract";

type VoxyRenderHybridRuntimeFoundationPanelProps = {
  model: VoxyRenderHybridRuntimeFoundationPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean; muted?: boolean }) {
  const className = props.muted
    ? "rounded-full border border-emerald-300/60 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900"
    : props.subtle
      ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
      : "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900";
  return <span className={className}>{props.label}</span>;
}

function TextList(props: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <div className="mt-2 space-y-1 text-sm leading-6 text-[rgb(var(--muted))]">
          {props.items.map((item) => (
            <p key={`${props.title}-${item}`}>{item}</p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
  );
}

export default function VoxyRenderHybridRuntimeFoundationPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderHybridRuntimeFoundationPanelProps) {
  if (!model) return null;

  return (
    <section
      data-testid={dataTestId}
      className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {title ?? model.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.foundationStatusLabel} muted />
          <StatusChip label={model.nextStepLabel} />
          <StatusChip label="runtimeEnabled = false" subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {[
          {
            title: "Foundation bereit",
            summary: "Die Foundation kann vorbereitet sein, obwohl Runtime weiter deaktiviert bleibt.",
          },
          {
            title: "Provider-neutral",
            summary: "eDebatte behält Script, Review, Approval, Gates und Handoffs; externer Render bleibt austauschbarer Adapter-Rand.",
          },
          {
            title: "Secrets nur Requirement",
            summary: "Provider-, Storage- und Queue-Secrets bleiben rein deklarativ und werden nicht gelesen.",
          },
          {
            title: "Noop statt Runtime",
            summary: "Keine API-Calls, keine Queue/Worker-Ausführung, kein Storage-Write, kein Upload, kein Publish.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              {card.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{card.summary}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Runtime-Gates"
          items={model.gateLines}
          emptyLabel="Noch keine Runtime-Gates sichtbar."
        />
        <TextList
          title="Semantik"
          items={model.semanticsLines}
          emptyLabel="Noch keine Semantik sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Config-Requirements"
          items={model.configRequirementLines}
          emptyLabel="Noch keine Config-Requirements sichtbar."
        />
        <TextList
          title="Secret-Requirements"
          items={model.secretRequirementLines}
          emptyLabel="Noch keine Secret-Requirements sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Ohne Ausführung"
          items={model.executionLines}
          emptyLabel="Noch keine Guardrails sichtbar."
        />
        <TextList
          title="Blocker"
          items={model.blockerLines}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
      </div>

      <div className="mt-4">
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
      </div>
    </section>
  );
}
