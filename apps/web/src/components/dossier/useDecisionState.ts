"use client";

import { useEffect, useState } from "react";

type DecisionState = {
  selectedOptionId: string | null;
  savedOptionId: string | null;
  setSelectedOptionId: (id: string | null) => void;
  saveSelection: () => void;
  saveNotice: boolean;
};

export function useDecisionState(dossierId: string): DecisionState {
  const storageKey = `dossierVote:${dossierId}`;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [savedOptionId, setSavedOptionId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setSelectedOptionId(stored);
      setSavedOptionId(stored);
    }
  }, [storageKey]);

  const saveSelection = () => {
    if (!selectedOptionId || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, selectedOptionId);
    setSavedOptionId(selectedOptionId);
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2200);
  };

  return { selectedOptionId, savedOptionId, setSelectedOptionId, saveSelection, saveNotice };
}

export default useDecisionState;
