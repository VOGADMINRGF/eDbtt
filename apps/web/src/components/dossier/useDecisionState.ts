"use client";

import { useEffect, useState } from "react";

type DecisionState = {
  selectedOptionId: string | null;
  savedOptionId: string | null;
  savedAt: string | null;
  setSelectedOptionId: (id: string | null) => void;
  saveSelection: () => void;
  saveNotice: boolean;
};

export function useDecisionState(dossierId: string): DecisionState {
  const storageKey = `dossierVote:${dossierId}`;
  const timeKey = `dossierVoteAt:${dossierId}`;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [savedOptionId, setSavedOptionId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    const storedAt = window.localStorage.getItem(timeKey);
    if (stored) {
      setSelectedOptionId(stored);
      setSavedOptionId(stored);
    }
    if (storedAt) setSavedAt(storedAt);
  }, [storageKey]);

  const saveSelection = () => {
    if (!selectedOptionId || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, selectedOptionId);
    const timestamp = new Date().toISOString();
    window.localStorage.setItem(timeKey, timestamp);
    setSavedOptionId(selectedOptionId);
    setSavedAt(timestamp);
    setSaveNotice(true);
    window.setTimeout(() => setSaveNotice(false), 2200);
  };

  return { selectedOptionId, savedOptionId, savedAt, setSelectedOptionId, saveSelection, saveNotice };
}

export default useDecisionState;
