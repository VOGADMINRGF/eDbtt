import Link from "next/link";
import * as React from "react";
import {
  parseCreateDraftNextActionParam,
  resolveDraftNextActionsForStartDraft,
} from "@/features/start/draftNextActionGate";
import type { StartDraftContext } from "@/features/start/startDraftContext";

type CreateDraftNextActionGateProps = {
  draft: StartDraftContext;
  initialNextActionParam?: string | null;
  hasStarted: boolean;
  isAuthenticated: boolean;
  canDeepResearch: boolean;
  onStartLightAnalysis: () => void;
  onConfirmFactcheck: () => void;
};

export default function CreateDraftNextActionGate({
  draft,
  initialNextActionParam,
  hasStarted,
  isAuthenticated,
  canDeepResearch,
  onStartLightAnalysis,
  onConfirmFactcheck,
}: CreateDraftNextActionGateProps) {
  const initialDraftNextAction = React.useMemo(
    () => parseCreateDraftNextActionParam(initialNextActionParam),
    [initialNextActionParam],
  );
  const [factcheckConfirmationVisible, setFactcheckConfirmationVisible] = React.useState(
    initialDraftNextAction === "factcheck",
  );

  const startDraftNextActionSummary = React.useMemo(
    () =>
      resolveDraftNextActionsForStartDraft(draft, {
        isAuthenticated,
        canDeepResearch,
      }),
    [canDeepResearch, draft, isAuthenticated],
  );

  if (!startDraftNextActionSummary.actions.length) return null;
  if (hasStarted && !factcheckConfirmationVisible) return null;

  return (
    <section
      className="rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
      data-testid="create-draft-next-action-gate"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Geschützter nächster Schritt
        </p>
        <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
          {factcheckConfirmationVisible || initialDraftNextAction === "factcheck"
            ? "Vertiefte Prüfung benötigt Bestätigung"
            : "Leichte Einordnung starten"}
        </h2>
        <p className="text-sm leading-6 text-[rgb(var(--fg))]/84">
          {factcheckConfirmationVisible || initialDraftNextAction === "factcheck"
            ? canDeepResearch
              ? "Faktencheck und Quellenprüfung starten nie automatisch. Öffne erst den Prüfmodus oder bestätige bewusst den nächsten Schritt."
              : "Für eine vertiefte Quellenprüfung brauchst du ein passendes Kontingent oder Paket. Beim normalen Draft-Handoff entstehen keine Kosten."
            : startDraftNextActionSummary.statusLabel}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="landing-cta-primary public-cta-primary vog-btn-brand"
          onClick={onStartLightAnalysis}
        >
          Leichte Einordnung starten
        </button>
        {factcheckConfirmationVisible || initialDraftNextAction === "factcheck" ? (
          canDeepResearch ? (
            <button
              type="button"
              className="vog-btn-secondary landing-cta-secondary"
              onClick={() => {
                setFactcheckConfirmationVisible(false);
                onConfirmFactcheck();
              }}
            >
              Vertiefte Prüfung bestätigen
            </button>
          ) : (
            <Link href="/pricing" className="vog-btn-secondary landing-cta-secondary">
              Pakete ansehen
            </Link>
          )
        ) : null}
        <Link
          href={
            startDraftNextActionSummary.actions.find((action) => action.kind === "request_editorial_review")
              ?.href ?? "/start?review=editorial"
          }
          className="vog-btn-secondary landing-cta-secondary"
        >
          Zur redaktionellen Prüfung geben
        </Link>
      </div>
    </section>
  );
}
