"use client";

import { useEffect, useMemo, useState } from "react";

type VoteOption = { id: string; label: string };

type MajorityDemo = { id: string; pct: number };

type VotePanelProps = {
  dossierId: string;
  options: VoteOption[];
  majorityDemo: MajorityDemo[];
};

export function VotePanel({ dossierId, options, majorityDemo }: VotePanelProps) {
  const storageKey = `dossierVote:${dossierId}`;
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setSelected(stored);
      setPending(stored);
      setSaved(stored);
    }
  }, [storageKey]);

  const majorityById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of majorityDemo) map.set(item.id, item.pct);
    return map;
  }, [majorityDemo]);

  const topOption = useMemo(() => {
    let best: MajorityDemo | null = null;
    for (const item of majorityDemo) {
      if (!best || item.pct > best.pct) best = item;
    }
    return best?.id ?? null;
  }, [majorityDemo]);

  const saveVote = () => {
    if (!pending || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, pending);
    setSaved(pending);
    setSelected(pending);
  };

  return (
    <div className="vog-card p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Abstimmung (Demo)
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Die Abstimmungsdarstellung ist in dieser Demo simuliert und dient der Veranschaulichung der Beteiligungsebene.
        </p>
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

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Mehrheitstendenz (Demonstration)
        </p>
        <p className="text-[11px] text-[rgb(var(--muted))]">
          In der Demo werden aggregierte Werte simuliert.
        </p>
        <div className="space-y-2">
          {options.map((option) => {
            const pct = majorityById.get(option.id) ?? 0;
            return (
              <div key={`majority-${option.id}`} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
                  <span className="font-semibold text-[rgb(var(--fg))]">{option.label}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgb(var(--border))]">
                  <div
                    className="h-2 rounded-full bg-brand-grad"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {topOption === option.id ? (
                  <span className="text-[10px] text-[rgb(var(--muted))]">Höchste Tendenz</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VotePanel;
