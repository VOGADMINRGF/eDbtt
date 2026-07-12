import type { VoxyVideoBriefingFlowMasterClosurePanelModel } from "@/features/create/voxyVideoBriefingFlowMasterClosureContract";

type VoxyVideoBriefingFlowMasterClosurePanelProps = {
  model: VoxyVideoBriefingFlowMasterClosurePanelModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean; muted?: boolean }) {
  const className = props.muted
    ? "rounded-full border border-emerald-300/60 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900"
    : props.subtle
      ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
      : "rounded-full border border-amber-300/60 bg-amber-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900";
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

export default function VoxyVideoBriefingFlowMasterClosurePanel({
  model,
  title,
  dataTestId,
}: VoxyVideoBriefingFlowMasterClosurePanelProps) {
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
          <StatusChip label={model.masterStatusLabel} muted />
          <StatusChip label={model.nextStepLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-6">
        {[
          {
            title: "Review-first Architektur geschlossen",
            summary:
              model.preview.semantics.reviewFirstArchitectureComplete
                ? "Die Kette ist als Master-Closure vollständig dokumentiert."
                : "Die Kette ist sichtbar, aber noch nicht vollständig geschlossen.",
          },
          {
            title: "Runtime noch nicht aktiviert",
            summary: "Runtime, Render und Feature-Flags bleiben vollständig ausgeschaltet.",
          },
          {
            title: "Keine Videodatei",
            summary: "Es wird bewusst keine Preview-Datei und kein finales Video erzeugt.",
          },
          {
            title: "Kein Upload",
            summary: "Es gibt keinen Storage-Write, keinen Upload und keine URL-Freigabe.",
          },
          {
            title: "Kein Scheduling",
            summary: "Es startet weder ein Job noch ein Kalender- oder Publish-Termin.",
          },
          {
            title: "Kein Publish",
            summary: "Publish, Social Posting und Veröffentlichung bleiben blockiert.",
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
          title="Gesamtstatus"
          items={model.overallStatusLines}
          emptyLabel="Noch kein Gesamtstatus sichtbar."
        />
        <TextList
          title="Readiness Areas"
          items={model.readinessAreaLines}
          emptyLabel="Noch keine Readiness Areas sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Top Blocker"
          items={model.blockerLines}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
        <TextList
          title="Runtime Pending Requirements"
          items={model.requirementLines}
          emptyLabel="Noch keine Runtime-Pending-Anforderungen sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Nächste Aktion"
          items={["Nächster Schritt: Runtime-Pfad entscheiden", ...model.nextActionLines]}
          emptyLabel="Noch keine nächste Aktion sichtbar."
        />
        <TextList
          title="Semantik"
          items={model.semanticsLines}
          emptyLabel="Noch keine Semantik sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Wirkung ohne Ausführung"
          items={model.executionLines}
          emptyLabel="Noch keine Wirkung sichtbar."
        />
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
          Runtime Cutover Gate: {model.commandPreview.runtimeCutoverGateId ?? "noch keine Persistenz"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Vorschau erstellt: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Status: {model.commandPreview.masterStatusLabel} · {model.commandPreview.nextStepLabel}
        </p>
        {model.latestRecord ? (
          <>
            <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
              Letzter persistierter Master-Closure-Stand
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {model.latestRecord.masterStatusLabel}
              {model.latestRecord.masterClosureVersion
                ? ` · Version ${model.latestRecord.masterClosureVersion}`
                : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              Runtime Cutover Gate: {model.latestRecord.runtimeCutoverGateId ?? "keine"}
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
            Noch kein persistierter Master-Closure-Stand sichtbar.
          </p>
        )}
      </div>
    </section>
  );
}
