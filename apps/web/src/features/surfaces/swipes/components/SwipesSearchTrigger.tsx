type ScopeLevel = "ALL" | "Bund" | "Land" | "Kommune" | "EU";

type SwipesSearchTriggerProps = {
  open: boolean;
  topicQuery: string;
  activeLevel: ScopeLevel;
  onClose: () => void;
  onTopicChange: (value: string) => void;
  onLevelChange: (value: ScopeLevel) => void;
};

const SCOPE_OPTIONS: Array<{ label: string; value: ScopeLevel }> = [
  { label: "Meine Region", value: "Kommune" },
  { label: "Mein Land", value: "Bund" },
  { label: "Weltweit", value: "EU" },
  { label: "Alle", value: "ALL" },
];

const INTERESTS = ["Wohnen", "Bildung", "Mobilität", "Gesundheit", "Klima"];

export function SwipesSearchTrigger({
  open,
  topicQuery,
  activeLevel,
  onClose,
  onTopicChange,
  onLevelChange,
}: SwipesSearchTriggerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Suche schließen"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />
      <section className="absolute inset-x-0 top-0 rounded-b-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.35)] md:left-1/2 md:w-[760px] md:-translate-x-1/2 md:rounded-3xl md:top-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Suche & Filter</p>
          <button type="button" onClick={onClose} className="vog-chip">
            Schließen
          </button>
        </div>

        <label className="mt-3 block text-xs font-medium text-[rgb(var(--muted))]">Thema oder Stichwort</label>
        <input
          type="text"
          value={topicQuery}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="z. B. Wohnen, Mobilität, Bildung"
          className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-sky-200"
        />

        <div className="mt-3">
          <p className="text-xs font-medium text-[rgb(var(--muted))]">Scope</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map((option) => {
              const active = activeLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onLevelChange(option.value)}
                  className={active ? "vog-chip vog-chip--active" : "vog-chip"}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-[rgb(var(--muted))]">Interessen</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button key={interest} type="button" onClick={() => onTopicChange(interest)} className="vog-chip">
                {interest}
              </button>
            ))}
            <button type="button" onClick={() => onTopicChange("")} className="vog-chip">
              Zurücksetzen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
