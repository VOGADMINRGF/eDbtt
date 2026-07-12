import type { VoxyRenderMediaStorageTruthPanelModel } from "@/features/create/voxyRenderMediaStorageTruthContract";

type VoxyRenderMediaStorageTruthPanelProps = {
  model: VoxyRenderMediaStorageTruthPanelModel | null;
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

export default function VoxyRenderMediaStorageTruthPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderMediaStorageTruthPanelProps) {
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
          <StatusChip label={model.mediaStorageTruthStatusLabel} muted />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-6">
        {[
          {
            title: "Noch keine Medien-Datei",
            summary: "Media Candidate bleibt explizit getrennt von jeder realen Datei.",
          },
          {
            title: "Kein Storage-Write",
            summary: "Dieser Layer definiert höchstens Anforderungen, aber schreibt nichts.",
          },
          {
            title: "Kein Upload",
            summary: "Es gibt keine Upload-URL, keinen Blob-Write und keinen Dateitransfer.",
          },
          {
            title: "Keine Preview-URL",
            summary: "Public URL, Signed URL und Storage-Pfad bleiben leer.",
          },
          {
            title: "Kein Thumbnail",
            summary: "Thumbnail-Kandidat ist nicht gleich Thumbnail-Datei.",
          },
          {
            title: "Keine Veröffentlichung",
            summary: "Media Ready wäre später noch kein Publish, kein Scheduling und kein Social Post.",
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
          title="Media Candidate"
          items={[model.candidateLine]}
          emptyLabel="Noch kein Media Candidate sichtbar."
        />
        <TextList
          title="Storage Target"
          items={[model.storageLine]}
          emptyLabel="Noch kein Storage Target sichtbar."
        />
        <TextList
          title="Nächster Schritt"
          items={[model.nextStep]}
          emptyLabel="Noch kein nächster Schritt sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Top-Blocker"
          items={model.topBlockers}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
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
          Approval-Semantik: {model.commandPreview.approvalSemanticsId ?? "noch keine Persistenz"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Vorschau erstellt: {model.commandPreview.createdAt ?? "nur als Readmodel-Vorschau"}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          Status: {model.commandPreview.mediaStorageTruthStatusLabel} · {model.commandPreview.nextStepLabel}
        </p>
        {model.latestRecord ? (
          <>
            <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
              Letzte persistierte Media-/Storage-Wahrheit
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {model.latestRecord.mediaStorageTruthStatusLabel}
              {model.latestRecord.mediaStorageTruthVersion
                ? ` · Version ${model.latestRecord.mediaStorageTruthVersion}`
                : ""}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              Approval-Semantik: {model.latestRecord.approvalSemanticsId ?? "keine"}
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
            Noch keine persistierte Media-/Storage-Wahrheit sichtbar.
          </p>
        )}
      </div>
    </section>
  );
}
