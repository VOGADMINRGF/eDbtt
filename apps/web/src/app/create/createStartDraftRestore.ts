import * as React from "react";
import {
  bumpStartDraftHandoff,
  getStartDraftForTarget,
  type StartDraftContext,
} from "@/features/start/startDraftContext";

type StoredPrimaryIntakeSnapshot = {
  intakeText: string;
};

type UseCreateStartDraftRestoreOptions = {
  initialText?: string | null;
  intakeText: string;
  readStoredIntake: () => StoredPrimaryIntakeSnapshot | null;
  setIntakeText: (value: string) => void;
  setIntakeRestoreInfo: (value: string | null) => void;
  setActionNotice: (value: string | null) => void;
};

export type CreateStartDraftRestoreState = {
  draft: StartDraftContext | null;
  pendingImport: StartDraftContext | null;
  applyPendingImport: () => void;
  dismissPendingImport: () => void;
  clearDraftState: () => void;
};

function hasPrimaryIntakeText(value?: string | null): boolean {
  return Boolean(String(value ?? "").trim());
}

export function resolveCreateStartDraftNotice(draft: StartDraftContext): string {
  if (draft.preview?.relevance === "needs_reframe") {
    return "Bitte mache das öffentliche Anliegen noch klarer, bevor du den Beitrag weitergibst.";
  }
  if (draft.preview?.relevance === "personal_only") {
    return "Beschreibe bitte, welche öffentliche Bedeutung dein Anliegen hat.";
  }
  return "Aus deiner Startseiten-Eingabe übernommen.";
}

export function useCreateStartDraftRestore(
  options: UseCreateStartDraftRestoreOptions,
): CreateStartDraftRestoreState {
  const {
    initialText,
    intakeText,
    readStoredIntake,
    setIntakeText,
    setIntakeRestoreInfo,
    setActionNotice,
  } = options;
  const [draft, setDraft] = React.useState<StartDraftContext | null>(null);
  const [pendingImport, setPendingImport] = React.useState<StartDraftContext | null>(null);

  const applyDraftToCreate = React.useCallback(
    (nextDraft: StartDraftContext) => {
      setIntakeText(nextDraft.text);
      setDraft(nextDraft);
      setPendingImport(null);
      setIntakeRestoreInfo("Aus deiner Startseiten-Eingabe übernommen.");
      setActionNotice(resolveCreateStartDraftNotice(nextDraft));
      bumpStartDraftHandoff("create");
    },
    [setActionNotice, setIntakeRestoreInfo, setIntakeText],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const startDraft = getStartDraftForTarget("create");
    if (!startDraft) return;
    setDraft(startDraft);

    const snapshot = readStoredIntake();
    const hasServerPrefill = hasPrimaryIntakeText(initialText);
    const hasLocalDraft = hasPrimaryIntakeText(snapshot?.intakeText);

    if (hasServerPrefill || hasLocalDraft) {
      setPendingImport(startDraft);
      return;
    }

    if (!hasPrimaryIntakeText(intakeText)) {
      applyDraftToCreate(startDraft);
    }
  }, [applyDraftToCreate, initialText, intakeText, readStoredIntake]);

  const applyPendingImport = React.useCallback(() => {
    if (!pendingImport) return;
    applyDraftToCreate(pendingImport);
  }, [applyDraftToCreate, pendingImport]);

  const dismissPendingImport = React.useCallback(() => {
    if (pendingImport) {
      setDraft(null);
    }
    setPendingImport(null);
  }, [pendingImport]);

  const clearDraftState = React.useCallback(() => {
    setDraft(null);
    setPendingImport(null);
  }, []);

  return {
    draft,
    pendingImport,
    applyPendingImport,
    dismissPendingImport,
    clearDraftState,
  };
}
