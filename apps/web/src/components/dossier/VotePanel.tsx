"use client";

import { useEffect, useState } from "react";

type VoteOption = { id: string; label: string };

type VotePanelProps = {
  dossierId: string;
  options: VoteOption[];
};

export function VotePanel({ dossierId, options }: VotePanelProps) {
  const storageKey = `dossierVote:${dossierId}`;
  const [pending, setPending] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setPending(stored);
      setSaved(stored);
    }
  }, [storageKey]);

  const saveVote = () => {
    if (!pending || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, pending);
    setSaved(pending);
  };

  return (
    <div className="vog-card p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Abstimmung
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">Stimme für eine Option im Entscheidungsraum.</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-[rgb(var(--fg))] transition ${
              pending === option.id
                ? "border-[rgb(var(--grad-from))] bg-[color-mix(in_oklab,rgb(var(--card))_80%,rgb(var(--bg))_20%)]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
            }`}
          >
            <input
              type="radio"
              name={`vote-${dossierId}`}
              value={option.id}
              checked={pending === option.id}
              onChange={() => setPending(option.id)}
            />
            <span>{option.label}</span>
            {saved === option.id ? (
              <span className="ml-auto rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px] text-[rgb(var(--muted))]">
                Deine Auswahl
              </span>
            ) : null}
          </label>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={saveVote}
        disabled={!pending || pending === saved}
      >
        Stimme speichern
      </button>
    </div>
  );
}

export default VotePanel;
