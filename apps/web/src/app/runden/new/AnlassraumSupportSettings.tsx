import {
  MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_CHOICES,
  type ManualAnlassraumAiSupportMode,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

type AnlassraumSupportSettingsProps = {
  aiSupportMode: ManualAnlassraumAiSupportMode;
  onAiSupportModeChange: (value: ManualAnlassraumAiSupportMode) => void;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function AnlassraumSupportSettings(
  props: AnlassraumSupportSettingsProps,
) {
  return (
    <section
      className="vog-surface-elevated p-4 md:p-5"
      data-manual-anlassraum-step="unterstuetzung"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        Schritt 4
      </p>
      <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">
        Unterstützung &amp; Start
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
        Der Anlass startet zuerst manuell. KI kann später nur dort dazukommen, wo du sie bewusst einschaltest.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_CHOICES.map((choice) => {
          const selected = props.aiSupportMode === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={selected}
              onClick={() => props.onAiSupportModeChange(choice.value)}
              className={joinClasses(
                "rounded-xl border px-3 py-3 text-left transition",
                selected
                  ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]",
              )}
            >
              <span className="block text-sm font-semibold">{choice.label}</span>
              <span className="mt-1 block text-xs leading-5">{choice.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
