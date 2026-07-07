import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";

type V3VoxyCocreationDialogProps = {
  model: V3VoxyCocreationDialogModel | null;
  dataTestId?: string;
};

function statusLabel(value: V3VoxyCocreationDialogModel["status"]) {
  if (value === "needs_user_input") return "Menschliche Ergänzung offen";
  if (value === "needs_review") return "Review bleibt nötig";
  if (value === "blocked_by_runtime_truth") return "Belastbare Laufwirklichkeit fehlt";
  if (value === "answered") return "Ergänzung vorhanden";
  if (value === "prepared") return "Vorbereitet";
  return "Nur Vorschau";
}

function cardStatusLabel(value: V3VoxyCocreationDialogModel["cards"][number]["status"]) {
  if (value === "needs_user_input") return "Noch nicht beantwortet";
  if (value === "needs_review") return "Review-Kontext offen";
  if (value === "blocked_by_runtime_truth") return "Blockiert ohne belastbare Laufwirklichkeit";
  if (value === "answered") return "Ergänzung vorhanden";
  if (value === "prepared") return "Vorbereitet";
  return "Nur Vorschau";
}

export default function V3VoxyCocreationDialog({
  model,
  dataTestId,
}: V3VoxyCocreationDialogProps) {
  if (!model || model.cards.length === 0) return null;

  return (
    <section
      className="mt-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
      data-testid={dataTestId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Voxy Co-Creation
          </p>
          <h3 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{model.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.summary}</p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            {model.cards[0]?.languageDisplay}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {model.cards[0]?.translationDisplay}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-300/40 bg-sky-50/80 px-3 py-2 text-xs text-sky-900">
          <p className="font-semibold">{statusLabel(model.status)}</p>
          <p className="mt-1">
            Antworten verbessern den Beitrag, veröffentlichen aber nichts.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]">
          Original erhalten
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]">
          Keine Manipulation
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]">
          Review-first
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]">
          Kein Auto-Publish
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {model.cards.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4"
            data-voxy-cocreation-card={card.dialogueMode}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {card.publicSafeLabel}
              </span>
              <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                {cardStatusLabel(card.status)}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
              {card.userVisibleQuestion}
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {card.userVisibleReason}
            </p>
            {card.optionalSuggestedAnswerFormat ? (
              <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
                Vorschlag für die Antwortform: {card.optionalSuggestedAnswerFormat}
              </p>
            ) : null}
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
              <p>Benötigt: {card.requiredHumanInput}</p>
              <p>Nächster Schritt: {card.nextStep}</p>
              <p>{card.languageDisplay}</p>
              <p>{card.currentInputStateLabel}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
