"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type DossierVoteRuntimeMode,
  persistDossierVoteSelection,
  resolveDossierVoteRuntime,
} from "./runtimeTruth";

type DecisionState = {
  selectedOptionId: string | null;
  savedOptionId: string | null;
  savedAt: string | null;
  setSelectedOptionId: (id: string | null) => void;
  saveSelection: () => Promise<void>;
  saveNotice: boolean;
  saveError: string | null;
  savePending: boolean;
};

type MajorityUpdatePayload = {
  totalVotes?: number;
  updatedAt?: string;
  majorityDemo?: { id: string; pct: number }[];
};

type DecisionStateOptions = {
  onMajorityUpdate?: (payload: MajorityUpdatePayload) => void;
  runtimeMode?: DossierVoteRuntimeMode;
};

export function useDecisionState(dossierId: string, options?: DecisionStateOptions): DecisionState {
  const storageKey = `dossierVote:${dossierId}`;
  const timeKey = `dossierVoteAt:${dossierId}`;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [savedOptionId, setSavedOptionId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const runtime = useMemo(
    () => resolveDossierVoteRuntime(dossierId, options?.runtimeMode),
    [dossierId, options?.runtimeMode],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !runtime.usesLocalPersistence) return;
    const stored = window.localStorage.getItem(storageKey);
    const storedAt = window.localStorage.getItem(timeKey);
    if (stored) {
      setSelectedOptionId(stored);
      setSavedOptionId(stored);
    }
    if (storedAt) setSavedAt(storedAt);
  }, [runtime.usesLocalPersistence, storageKey, timeKey]);

  const saveSelection = async () => {
    if (!selectedOptionId || typeof window === "undefined") return;
    setSaveError(null);
    setSaveNotice(false);
    setSavePending(true);

    const result = await persistDossierVoteSelection({
      dossierId,
      optionId: selectedOptionId,
      runtime,
      fetchImpl: fetch,
      storage: runtime.usesLocalPersistence ? window.localStorage : null,
      storageKey,
      timeKey,
    });

    setSavePending(false);

    if (result.ok === false) {
      setSaveError(result.error);
      return;
    }

    setSavedOptionId(selectedOptionId);
    setSavedAt(result.savedAt);
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2200);
    options?.onMajorityUpdate?.(result.payload as MajorityUpdatePayload);
  };

  return {
    selectedOptionId,
    savedOptionId,
    savedAt,
    setSelectedOptionId,
    saveSelection,
    saveNotice,
    saveError,
    savePending,
  };
}

export default useDecisionState;
