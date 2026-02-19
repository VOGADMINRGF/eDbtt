"use client";

type VoteOption = { id: string; label: string };

type VotePanelProps = {
  options: VoteOption[];
  selectedOptionId: string | null;
  savedOptionId: string | null;
  onSelect: (optionId: string) => void;
  onSave: () => void;
  saveNotice: boolean;
};

export function VotePanel({
  options,
  selectedOptionId,
  savedOptionId,
  onSelect,
  onSave,
  saveNotice,
}: VotePanelProps) {
  const showPreselect = selectedOptionId && selectedOptionId !== savedOptionId;

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
        disabled={!selectedOptionId || selectedOptionId === savedOptionId}
      >
        Stimme speichern
      </button>

      {saveNotice ? (
        <div className="flex items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
          <span className="text-[rgb(var(--fg))]">✓</span>
          <span>Deine Stimme wurde registriert (Demonstration).</span>
        </div>
      ) : null}
    </div>
  );
}

export default VotePanel;
