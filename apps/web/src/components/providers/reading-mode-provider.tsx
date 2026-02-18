"use client";

import * as React from "react";

type ReadingModeContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
};

const ReadingModeContext = React.createContext<ReadingModeContextValue | undefined>(undefined);

const STORAGE_KEY = "reading-mode";

export function ReadingModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1" || stored === "true") setEnabled(true);
    } catch {
      // ignore storage access issues
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.setAttribute("data-reading", "1");
    } else {
      root.removeAttribute("data-reading");
    }

    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // ignore storage access issues
    }
  }, [enabled]);

  const value = React.useMemo(() => ({ enabled, setEnabled }), [enabled]);

  return <ReadingModeContext.Provider value={value}>{children}</ReadingModeContext.Provider>;
}

export function useReadingMode(): ReadingModeContextValue {
  const ctx = React.useContext(ReadingModeContext);
  if (!ctx) {
    throw new Error("useReadingMode must be used within ReadingModeProvider");
  }
  return ctx;
}
