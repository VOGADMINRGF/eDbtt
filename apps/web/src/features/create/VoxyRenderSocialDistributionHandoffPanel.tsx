import type {
  VoxyRenderSocialDistributionHandoffPanelModel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";

type VoxyRenderSocialDistributionHandoffPanelProps = {
  model: VoxyRenderSocialDistributionHandoffPanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean; muted?: boolean }) {
  const className = props.muted
    ? "rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
    : props.subtle
      ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
      : "rounded-full border border-rose-300/60 bg-rose-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-900";
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

export default function VoxyRenderSocialDistributionHandoffPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderSocialDistributionHandoffPanelProps) {
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
          <StatusChip label={model.handoffStatusLabel} muted />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-7">
        {[
          {
            title: "Noch kein Posting",
            summary: "Der Handoff beschreibt nur Kandidaten. Es entsteht kein Social Post.",
          },
          {
            title: "Kein Upload",
            summary: "Es gibt keine Upload-Runtime, keine Upload-URL und keine Datei-Wahrheit.",
          },
          {
            title: "Kein Scheduling",
            summary: "Es entsteht kein Termin, kein Job und keine Schedule-Wahrheit.",
          },
          {
            title: "Keine Veröffentlichung",
            summary: "publish_ready bleibt getrennt von published und bleibt hier false.",
          },
          {
            title: "Keine Plattform-API",
            summary: "platform_candidate bleibt strikt getrennt von jedem API Call.",
          },
          {
            title: "Copy nur als Review-Draft",
            summary: "Copy-Varianten bleiben Drafts und werden nicht gepostet.",
          },
          {
            title: "Social Workbench bleibt review-first",
            summary: "Dieser Layer bereitet nur spätere Distribution vor und startet keine Runtime.",
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

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <TextList
          title="Plattform-Kandidaten"
          items={model.platformLines}
          emptyLabel="Noch keine Plattform-Kandidaten sichtbar."
        />
        <TextList
          title="Copy-Varianten"
          items={model.copyVariantLines}
          emptyLabel="Noch keine Copy-Varianten sichtbar."
        />
        <TextList
          title="Schedule-Kandidat"
          items={model.scheduleLines}
          emptyLabel="Noch kein Schedule-Kandidat sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Semantik"
          items={model.semanticsLines}
          emptyLabel="Noch keine Semantik sichtbar."
        />
        <TextList
          title="Wirkung ohne Ausführung"
          items={model.effectLines}
          emptyLabel="Noch keine Wirkung sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Top-Blocker"
          items={model.topBlockers}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <TextList
          title="Nächster Schritt"
          items={[model.nextStep]}
          emptyLabel="Noch kein nächster Schritt sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Store-Grenze
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.storeStateLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.storeStateSummary}
          </p>
          <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
            Publish Guard: {model.commandPreview.publishReadinessGuardId ?? "noch keine Persistenz"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Vorschau erstellt: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Status: {model.commandPreview.handoffStatusLabel} · {model.commandPreview.nextStepLabel}
          </p>
          {model.latestRecord ? (
            <>
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                Letzter persistierter Social-Distribution-Handoff
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.handoffStatusLabel}
                {model.latestRecord.handoffVersion
                  ? ` · Version ${model.latestRecord.handoffVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Publish Guard: {model.latestRecord.publishReadinessGuardId ?? "keiner"}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein persistierter Social-Distribution-Handoff sichtbar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
