import type { VoxyRenderRuntimeCutoverGatePanelModel } from "@/features/create/voxyRenderRuntimeCutoverGateContract";

type VoxyRenderRuntimeCutoverGatePanelProps = {
  model: VoxyRenderRuntimeCutoverGatePanelModel | null;
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

export default function VoxyRenderRuntimeCutoverGatePanel({
  model,
  title,
  dataTestId,
}: VoxyRenderRuntimeCutoverGatePanelProps) {
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
          <StatusChip label={model.runtimeCutoverGateStatusLabel} muted />
          <StatusChip label={model.nextStepLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-6">
        {[
          {
            title: "Runtime noch nicht aktiviert",
            summary: "Jede Runtime-Ausführung bleibt ausgeschaltet und wird nicht freigeschaltet.",
          },
          {
            title: "Feature Flag nicht aktiviert",
            summary: "Es gibt bewusst keine aktive Feature-Flag-Freigabe und keinen Rollout.",
          },
          {
            title: "Provider nicht ausgeführt",
            summary: "Kein Provider wird aufgerufen, keine Secrets werden gelesen, kein Render startet.",
          },
          {
            title: "Kein Worker gestartet",
            summary: "Queue und Worker bleiben Noop. Es läuft bewusst kein Hintergrundjob.",
          },
          {
            title: "Kein Upload erlaubt",
            summary: "Es wird keine Datei geschrieben, hochgeladen oder extern verteilt.",
          },
          {
            title: "Kein Publish erlaubt",
            summary: "Scheduling, Publish und Social Posting bleiben vollständig blockiert.",
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
          title="Cutover-Kandidat"
          items={model.cutoverCandidateLines}
          emptyLabel="Noch kein Cutover-Kandidat sichtbar."
        />
        <TextList
          title="Gates"
          items={model.gateLines}
          emptyLabel="Noch keine Gates sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Blocker"
          items={model.blockerLines}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <TextList
          title="Nächste Aktion"
          items={model.nextActionLines}
          emptyLabel="Noch keine nächste Aktion sichtbar."
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
          items={model.executionLines}
          emptyLabel="Noch keine Wirkung sichtbar."
        />
      </div>

      <div className="mt-4">
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Store-Grenze
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.storeStateLabel}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.storeStateSummary}
        </p>
        <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
          Runtime Observability:{" "}
          {model.commandPreview.runtimeObservabilityId ?? "noch keine Persistenz"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Vorschau erstellt: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Status: {model.commandPreview.runtimeCutoverGateStatusLabel} ·{" "}
          {model.commandPreview.nextStepLabel}
        </p>
        {model.latestRecord ? (
          <>
            <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
              Letzter persistierter Runtime Cutover Gate
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {model.latestRecord.runtimeCutoverGateStatusLabel}
              {model.latestRecord.runtimeCutoverGateVersion
                ? ` · Version ${model.latestRecord.runtimeCutoverGateVersion}`
                : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              Runtime Observability: {model.latestRecord.runtimeObservabilityId ?? "keine"}
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
            Noch kein persistierter Runtime Cutover Gate sichtbar.
          </p>
        )}
      </div>
    </section>
  );
}
