import type {
  OutputSocialWorkbenchModel,
} from "@/features/create/outputSocialWorkbenchContract";

type OutputSocialWorkbenchPanelProps = {
  model: OutputSocialWorkbenchModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-emerald-300/60 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800"
      }
    >
      {props.label}
    </span>
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

export default function OutputSocialWorkbenchPanel({
  model,
  title,
  dataTestId,
}: OutputSocialWorkbenchPanelProps) {
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
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.outputStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Mögliche Ausgabeformate
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {model.outputFormatLabels.length > 0
              ? model.outputFormatLabels.join(" · ")
              : "Noch keine belastbaren Ausgabeformate sichtbar."}
          </p>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Kanal-Kandidaten
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {model.channelCandidates.length > 0
              ? model.channelCandidates.map((item) => item.label).join(" · ")
              : "Noch keine belastbaren Kanal-Kandidaten sichtbar."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Draft-Entwürfe
        </p>
        {model.draftItems.length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {model.draftItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {item.formatLabel}
                  </span>
                  {item.channelLabel ? (
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {item.channelLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{item.body}</p>
                <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{item.publicSafeLabel}</p>
                {item.risks.length > 0 ? (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    Risiken: {item.risks.join(", ")}
                  </p>
                ) : null}
                {item.blockers.length > 0 ? (
                  <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                    Blocker: {item.blockers.join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Noch keine belastbaren Output- oder Social-Entwürfe sichtbar.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TagList
          title="Copy-Risiken"
          items={model.copyRisks}
          emptyLabel="Noch keine zusätzlichen Copy-Risiken sichtbar."
        />
        <TagList
          title="Readiness-Signale"
          items={model.readinessSignals}
          emptyLabel="Noch keine zusätzlichen Output-Signale sichtbar."
        />
      </div>

      <TagList
        title="Kanal-Review"
        items={model.channelCandidates}
        emptyLabel="Noch keine zusätzlichen Kanal-Kandidaten sichtbar."
      />

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Downstream Readiness
        </p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {model.downstreamReadiness.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {item.statusLabel} · {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Nächste Output-Entscheidung
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextOutputDecision.label}</p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.nextOutputDecision.reason}
        </p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
