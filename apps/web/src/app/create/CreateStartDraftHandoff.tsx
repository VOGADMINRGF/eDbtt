import GlobalDraftStatusBar from "@/features/start/GlobalDraftStatusBar";
import StartDraftWorkspaceChooser from "@/features/start/StartDraftWorkspaceChooser";
import {
  clearStartDraftContext,
  updateStartDraftContext,
  type StartDraftContext,
} from "@/features/start/startDraftContext";

type CreateStartDraftHandoffProps = {
  draft: StartDraftContext;
  pendingImport: StartDraftContext | null;
  onApplyPendingImport: (draft: StartDraftContext) => void;
  onDismissPendingImport: () => void;
  onClearDraftState: () => void;
};

export default function CreateStartDraftHandoff({
  draft,
  pendingImport,
  onApplyPendingImport,
  onDismissPendingImport,
  onClearDraftState,
}: CreateStartDraftHandoffProps) {
  return (
    <>
      <GlobalDraftStatusBar
        draft={draft}
        surface="create"
        eyebrow="Aktiver Entwurf"
        title="Aus deiner Startseiten-Eingabe übernommen."
        body={
          pendingImport
            ? "Es gibt bereits einen Entwurf in /create. Du kannst die Startseiten-Eingabe übernehmen oder mit dem bestehenden Entwurf weiterarbeiten."
            : "Dein Text wurde als Ausgangstext für diesen Beitrag übernommen. Nichts wurde automatisch veröffentlicht oder weiterverarbeitet."
        }
        primaryAction={
          pendingImport
            ? {
                label: "Übernehmen",
                onClick: () => onApplyPendingImport(pendingImport),
              }
            : null
        }
        secondaryAction={{
          label: pendingImport ? "Bestehenden Entwurf behalten" : "Bearbeiten",
          tone: "secondary",
          onClick: onDismissPendingImport,
        }}
        tertiaryAction={{
          label: "Verwerfen",
          tone: "secondary",
          onClick: () => {
            clearStartDraftContext();
            onClearDraftState();
          },
        }}
        quaternaryAction={
          draft.targetHint === "themes"
            ? {
                label: "Anderen Weg wählen",
                href: "/themen?startDraft=1",
              }
            : draft.targetHint === "rounds"
              ? {
                  label: "Anderen Weg wählen",
                  href: "/runden/new?startDraft=1&from=start",
                }
              : null
        }
      />
      <StartDraftWorkspaceChooser
        activeKey="create"
        options={[
          {
            key: "create",
            title: "Beitrag ausarbeiten",
            description: "Mit demselben Entwurf im Beitragsmodus weiterarbeiten.",
            href: "/create?startDraft=1",
            onClick: () => updateStartDraftContext({ targetHint: "create" }),
          },
          {
            key: "themes",
            title: "Passende Themen finden",
            description: "Zum Themenmodus wechseln, ohne den Text zu verlieren.",
            href: "/themen?startDraft=1",
            onClick: () => updateStartDraftContext({ targetHint: "themes" }),
          },
          {
            key: "rounds",
            title: "Runde vorbereiten",
            description: "Aus demselben Anliegen eine Runde oder Beteiligung vorbereiten.",
            href: "/runden/new?startDraft=1&from=create",
            onClick: () => updateStartDraftContext({ targetHint: "rounds" }),
          },
          {
            key: "editorial",
            title: "Redaktionelle Prüfung anfragen",
            description: "Denselben Entwurf review-first prüfen lassen.",
            href: "/start?review=editorial",
            onClick: () => updateStartDraftContext({ origin: "start_relevance_review" }),
          },
          {
            key: "later",
            title: "Später weiterarbeiten",
            description: "Als Arbeitsstand behalten und später im Konto fortsetzen.",
            href: "/account",
            onClick: () => updateStartDraftContext({ targetHint: "create" }),
          },
        ]}
      />
    </>
  );
}
