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

function publicSupportChoiceLabel(label: string) {
  return label
    .replace(/KI/gi, "Voxy")
    .replace(/AI/gi, "Voxy")
    .replace(/Dossier/g, "Themen-Zusammenfassung");
}

function publicSupportChoiceDescription(description: string) {
  return description
    .replace(/KI/gi, "Voxy")
    .replace(/AI/gi, "Voxy")
    .replace(/Dossier/g, "Themen-Zusammenfassung");
}

export default function AnlassraumSupportSettings(
  props: AnlassraumSupportSettingsProps,
) {
  return (
    <section
      className="public-flow-line p-0"
      data-manual-anlassraum-step="unterstuetzung"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        Schritt 4
      </p>
      <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">
        Unterstützung &amp; Start
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
        Du kannst ohne Voxy direkt speichern oder mit Voxy weiter strukturieren. Nichts davon geht automatisch online.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Ohne Voxy</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Direkt speichern</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Dein Entwurf bleibt erhalten. Du kannst Titel, Frage und Antworten später weiter anpassen.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Mit Voxy</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Struktur vorschlagen</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Voxy kann offene Fragen, Anschlussstellen und bessere Formulierungen vorschlagen.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themen-Zusammenfassung</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Erst nach Prüfung weiterführen</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Eine Zusammenfassung mit Quellenfragen und offenen Punkten entsteht erst nach einem bewussten nächsten Schritt.
          </p>
        </div>
      </div>

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
              <span className="block text-sm font-semibold">{publicSupportChoiceLabel(choice.label)}</span>
              <span className="mt-1 block text-xs leading-5">{publicSupportChoiceDescription(choice.description)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
