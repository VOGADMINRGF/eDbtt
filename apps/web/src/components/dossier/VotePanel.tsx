"use client";

type VoteOption = { id: string; label: string };

type VotePanelProps = {
  options: VoteOption[];
  selectedOptionId: string | null;
  savedOptionId: string | null;
  onSelect: (optionId: string) => void;
  onSave: () => void;
  saveNotice: boolean;
  savedAt?: string | null;
  canVote?: boolean;
  roleLabel?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function VotePanel({
  options,
  selectedOptionId,
  savedOptionId,
  onSelect,
  onSave,
  saveNotice,
  savedAt,
  canVote = true,
  roleLabel,
}: VotePanelProps) {
  const showPreselect = selectedOptionId && selectedOptionId !== savedOptionId;
  const isSaved = selectedOptionId && selectedOptionId === savedOptionId;

  return (
    <div className="vog-card p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Abstimmung</p>
        <p className="text-sm text-[rgb(var(--muted))]">Stimme für eine Option im Entscheidungsraum.</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-[rgb(var(--fg))] transition ${
              selectedOptionId === option.id
                ? "border-[rgb(var(--grad-from))] bg-[color-mix(in_oklab,rgb(var(--card))_80%,rgb(var(--bg))_20%)]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
            }`}
          >
            <input
              type="radio"
              name="vote"
              value={option.id}
              checked={selectedOptionId === option.id}
              disabled={!canVote}
              onChange={() => onSelect(option.id)}
            />
            <span>{option.label}</span>
            {savedOptionId === option.id ? (
              <span className="ml-auto rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px] text-[rgb(var(--muted))]">
                Deine Auswahl
              </span>
            ) : null}
          </label>
        ))}
      </div>

      {showPreselect ? (
        <p className="text-[11px] text-[rgb(var(--muted))]">
          Vorauswahl gesetzt. Stimme speichern, um sie zu registrieren.
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={onSave}
        disabled={!canVote || !selectedOptionId || selectedOptionId === savedOptionId}
      >
        {isSaved ? "✔ Stimme gespeichert" : "Stimme speichern"}
      </button>

      {!canVote ? (
        <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
          Abstimmen ist Bürgerinnen und Bürgern vorbehalten. In der Rollenansicht „{roleLabel ?? "Organisation"}“
          werden Materialien bereitgestellt und Prozesse moderiert.
        </p>
      ) : null}

      {saveNotice ? (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="text-[rgb(var(--fg))]">✓</span>
          <span className="ml-1">Stimme gespeichert · Danke</span>
          {savedAt ? <span className="ml-1">({formatDateTime(savedAt)})</span> : null}
        </div>
      ) : null}
      {isSaved ? (
        <p className="text-[11px] text-[rgb(var(--muted))]">
          Du kannst deine Stimme innerhalb des Zeitfensters ändern.
        </p>
      ) : null}
    </div>
  );
}

export default VotePanel;
