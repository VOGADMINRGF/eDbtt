"use client";

import * as React from "react";
import { useReadingMode } from "@/components/providers/reading-mode-provider";

const BASE_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]";

export default function ReadingModeToggle({ className }: { className?: string }) {
  const { enabled, setEnabled } = useReadingMode();

  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => setEnabled(!enabled)}
      className={[BASE_CLASS, className].filter(Boolean).join(" ")}
    >
      <span>Lesemodus</span>
      <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--fg))]">
        {enabled ? "An" : "Aus"}
      </span>
    </button>
  );
}
