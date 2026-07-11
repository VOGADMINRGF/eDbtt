import type {
  VoxyRenderApprovalSemanticsPanelModel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";

type VoxyRenderApprovalSemanticsPanelProps = {
  model: VoxyRenderApprovalSemanticsPanelModel | null;
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

export default function VoxyRenderApprovalSemanticsPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderApprovalSemanticsPanelProps) {
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
          <StatusChip label={model.approvalStatusLabel} muted />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-8">
        {[
          {
            title: "Review-ready ist nicht approved",
            summary: "Review-ready bleibt klar getrennt von menschlicher Freigabe.",
          },
          {
            title: "Publish-ready ist nicht published",
            summary: "Publish-ready bleibt weiter getrennt von jeder Veröffentlichung.",
          },
          {
            title: "Approved ist nicht uploaded",
            summary: "Eine spätere Freigabe wäre noch kein Upload.",
          },
          {
            title: "Approved ist nicht published",
            summary: "Approval bleibt strikt getrennt von Veröffentlichung.",
          },
          {
            title: "Kein Upload",
            summary: "Dieser Layer erzeugt keine Datei, keinen Upload und keine URL.",
          },
          {
            title: "Kein Social Posting",
            summary: "Es entsteht kein Post und kein Social API Call.",
          },
          {
            title: "Kein Scheduling",
            summary: "Es entsteht kein Termin, kein Job und kein Schedule.",
          },
          {
            title: "Keine Veröffentlichung",
            summary: "Approval ist kein Publish und kein Auto-Publish.",
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
          title="Approval-Kandidat"
          items={[model.candidateLine]}
          emptyLabel="Noch kein Approval-Kandidat sichtbar."
        />
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

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Gate-Übersicht
        </p>
        <div className="mt-3 space-y-2">
          {model.gateRows.map((gate) => (
            <div
              key={gate.gateKey}
              className="grid gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 md:grid-cols-[190px_120px_minmax(0,1fr)]"
            >
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{gate.label}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                {gate.statusLabel}
              </p>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">{gate.userVisibleReason}</p>
            </div>
          ))}
        </div>
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
            Distribution Handoff:{" "}
            {model.commandPreview.socialDistributionHandoffId ?? "noch keine Persistenz"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Vorschau erstellt: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Status: {model.commandPreview.approvalStatusLabel} · {model.commandPreview.nextStepLabel}
          </p>
          {model.latestRecord ? (
            <>
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                Letzte persistierte Approval-Semantik
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.approvalStatusLabel}
                {model.latestRecord.approvalVersion
                  ? ` · Version ${model.latestRecord.approvalVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Distribution Handoff: {model.latestRecord.socialDistributionHandoffId ?? "keiner"}
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
              Noch keine persistierte Approval-Semantik sichtbar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
