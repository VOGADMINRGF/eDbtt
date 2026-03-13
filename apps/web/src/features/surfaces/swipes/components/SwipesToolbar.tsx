type SwipesToolbarProps = {
  topicQuery: string;
  onTopicChange: (value: string) => void;
  activeLevel: "ALL" | "Bund" | "Land" | "Kommune" | "EU";
  onLevelChange: (value: "ALL" | "Bund" | "Land" | "Kommune" | "EU") => void;
  isBasic: boolean;
};

export function SwipesToolbar({
  topicQuery,
  onTopicChange,
  activeLevel,
  onLevelChange,
  isBasic,
}: SwipesToolbarProps) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-[rgb(var(--card))] p-3 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:flex-row md:items-center md:justify-between md:p-4">
      <div className="flex-1">
        <label className="block text-[11px] font-medium text-[rgb(var(--muted))]">Thema oder Stichwort</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={topicQuery}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="z. B. Wohnen, Mobilität, Bildung, Pflege"
            className="w-full rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="button"
            onClick={() => onTopicChange("")}
            className="inline-flex items-center rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--fg))] shadow-sm ring-1 ring-[rgb(var(--border))] transition hover:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
        <span className="text-[11px] font-medium text-[rgb(var(--muted))]">Ebene:</span>
        {["ALL", "Kommune", "Land", "Bund", "EU"].map((level) => {
          const isActive = activeLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onLevelChange(level as SwipesToolbarProps["activeLevel"])}
              className={
                isActive
                  ? "inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm dark:bg-sky-500"
                  : "inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-medium text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
              }
            >
              {level === "ALL" ? "Alle" : level}
            </button>
          );
        })}
      </div>
      {isBasic ? (
        <p className="text-[11px] text-[rgb(var(--muted))] md:ml-2">
          Optional erweiterbar: Variantenvergleich und weitere Auswertungen in Start/Pro.
        </p>
      ) : null}
    </section>
  );
}

