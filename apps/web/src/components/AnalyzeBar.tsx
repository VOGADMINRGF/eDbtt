"use client";
import * as React from "react";

export function AnalyzeBar({
  disabled,
  busy,
  onAnalyze,
  count,
}: {
  disabled?: boolean;
  busy?: boolean;
  onAnalyze: () => void;
  count?: number;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[rgb(var(--card))] backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--card))]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          {busy ? "Analysiere…" : "Bereit"} · {count ?? 0} Zeichen · Tipp: Cmd/Ctrl + Enter
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!!busy || !!disabled}
          className="btn btn-grad"
        >
          {busy ? "Analysiere…" : "Analysieren"}
        </button>
      </div>
    </div>
  );
}
