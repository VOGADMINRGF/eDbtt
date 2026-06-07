import Link from "next/link";
import type {
  ManualAnlassraumActionState,
  ManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

type AnlassraumPrePublishCheckProps = {
  actionState: ManualAnlassraumActionState;
  continueCreateHref: string;
  onContinueCreate: () => void;
  onSaveDraft: () => void;
  onStartInternal: () => void;
  onSubmitPublicReview: () => void;
  setup: ManualAnlassraumSetup;
};

export default function AnlassraumPrePublishCheck(
  props: AnlassraumPrePublishCheckProps,
) {
  return (
    <section className="public-proof-zone">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Nächste Schritte</h2>
        <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
          Prüfe den Entwurf zum Schluss noch einmal. Danach kannst du ihn ohne KI speichern, in `/create`
          weiter ausarbeiten oder bewusst nach Review einreichen.
        </p>
      </div>

      <div className="runden-step-line rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Vor dem Start
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Rahmen
            </p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              {props.actionState.hasFrameInput ? "Vorhanden" : "Fehlt noch"}
            </p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Feste Optionen
            </p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              {props.actionState.optionCount}
            </p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              KI
            </p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              {props.setup.aiSupportMode === "disabled" ? "Aus" : "Optional später"}
            </p>
          </div>
        </div>

        {props.actionState.publicReviewRequirements.length > 0 ? (
          <div className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
            <p className="font-semibold">Für eine öffentliche Einreichung fehlt noch etwas.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {props.actionState.publicReviewRequirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="public-action-row mt-4">
        <button
          type="button"
          onClick={props.onSaveDraft}
          disabled={!props.actionState.canSaveDraft}
          className="vog-btn-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ohne KI speichern
        </button>
        <Link
          href={props.continueCreateHref}
          onClick={props.onContinueCreate}
          className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
            props.actionState.canContinueCreate
              ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
              : "pointer-events-none bg-[rgb(var(--bg))] text-[rgb(var(--muted))] opacity-50"
          }`}
          aria-disabled={!props.actionState.canContinueCreate}
          data-continue-create-href={props.continueCreateHref}
        >
          Mit KI in /create weiter
        </Link>
        <button
          type="button"
          onClick={props.onSubmitPublicReview}
          disabled={!props.actionState.canSubmitPublicReview}
          className="vog-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Öffentlich nach Review einreichen
        </button>
        <button
          type="button"
          onClick={props.onStartInternal}
          disabled={!props.actionState.canStartInternal}
          className="vog-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Intern starten
        </button>
      </div>
    </section>
  );
}
