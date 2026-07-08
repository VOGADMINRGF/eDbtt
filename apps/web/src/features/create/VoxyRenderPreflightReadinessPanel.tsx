import type {
  VoxyRenderPreflightReadinessModel,
} from "@/features/create/voxyRenderPreflightReadinessContract";

type VoxyRenderPreflightReadinessPanelProps = {
  model: VoxyRenderPreflightReadinessModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
      }
    >
      {props.label}
    </span>
  );
}

function TagList(props: {
  title: string;
  items: Array<{ id: string; label: string; reason: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            {props.items.map((item) => (
              <span
                key={`${props.title}-${item.id}`}
                className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--fg))]"
                title={item.reason}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {props.items.slice(0, 3).map((item) => (
              <p key={`${props.title}-reason-${item.id}`} className="text-xs leading-5 text-[rgb(var(--muted))]">
                {item.reason}
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
  );
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

export default function VoxyRenderPreflightReadinessPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderPreflightReadinessPanelProps) {
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
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.languageLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
          </p>
          {model.rtlPreflightHint ? (
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{model.rtlPreflightHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.preflightStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Provider
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.providerSelectionStatusLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Anforderungen sichtbar, kein Providerlauf.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            `provider_available` ist nicht `provider_executed`.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Kosten & Credits
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.costStatusLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Keine Buchung, keine Credit-Abbuchung und keine Preisbehauptung.
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            `cost_estimate_needed` ist keine Buchung.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TagList
          title="Erforderliche Fähigkeiten"
          items={model.requiredCapabilities}
          emptyLabel="Noch keine zusätzlichen Render-Fähigkeiten sichtbar."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Asset-Status
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.assetStatusLabel}</p>
          <div className="mt-3 space-y-2">
            {model.requiredAssets.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {item.statusLabel} · {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Review-Gates
        </p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {model.reviewReadiness.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {item.statusLabel} · {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum noch nicht gerendert wird"
          items={model.blockers}
          emptyLabel="Kein zusätzlicher Blocker sichtbar, der Preflight bleibt trotzdem nur Vorschau."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nächste Entscheidung
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextPreflightDecision.label}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.nextPreflightDecision.reason}
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
        </div>
      </div>
    </section>
  );
}
