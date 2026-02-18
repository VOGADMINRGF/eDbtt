"use client";

import { useMemo, useState } from "react";
import type {
  ConsequenceRecord,
  ResponsibilityPath,
  ResponsibilityRecord,
} from "@features/analyze/schemas";

export const CONSEQUENCE_SCOPE_LABELS: Record<string, string> = {
  local_short: "Lokal · kurzfristig",
  local_long: "Lokal · langfristig",
  national: "National",
  global: "EU / global",
  systemic: "Systemische Effekte",
};

export const CONSEQUENCE_SCOPE_ORDER = [
  "local_short",
  "local_long",
  "national",
  "global",
  "systemic",
] as const;

export const RESPONSIBILITY_LEVEL_LABELS: Record<string, string> = {
  municipality: "Gemeinde / Stadt",
  district: "Bezirk / Kreis",
  state: "Bundesland",
  federal: "Bund",
  eu: "EU / international",
  ngo: "NGO / Verband",
  private: "Private / Unternehmen",
  unknown: "Unbestimmt",
};

type ConsequencesPreviewProps = {
  consequences: ConsequenceRecord[];
  responsibilities: ResponsibilityRecord[];
  maxItems?: number;
};

export function ConsequencesPreviewCard({
  consequences,
  responsibilities,
  maxItems = 3,
}: ConsequencesPreviewProps) {
  const grouped = useMemo(() => {
    return consequences.reduce<Record<string, ConsequenceRecord[]>>((acc, cons) => {
      if (!acc[cons.scope]) acc[cons.scope] = [];
      acc[cons.scope].push(cons);
      return acc;
    }, {});
  }, [consequences]);

  const hasEntries = consequences.length > 0;
  const highlightedResponsibilities = responsibilities.slice(0, 2);

  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Mögliche Folgen</h2>
      {!hasEntries ? (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Noch keine strukturierte Folgenabschätzung vorhanden. Sobald KI-Analyse oder Redaktion eindeutige
          Wirkungen erkennt, erscheinen sie hier.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm text-[rgb(var(--muted))]">
          {CONSEQUENCE_SCOPE_ORDER.map((scope) => {
            const list = grouped[scope];
            if (!list || list.length === 0) return null;
            return (
              <div key={scope}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {CONSEQUENCE_SCOPE_LABELS[scope] ?? scope} ({list.length})
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {list.slice(0, maxItems).map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          {consequences.length > maxItems && (
            <p className="text-xs text-[rgb(var(--muted))]">
              +{consequences.length - maxItems} weitere Folgen im detaillierten Level‑2‑Modus.
            </p>
          )}
        </div>
      )}
      {highlightedResponsibilities.length > 0 && (
        <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Erste Zuständigkeitshinweise</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {highlightedResponsibilities.map((entry) => (
              <li key={entry.id}>
                <span className="font-semibold text-[rgb(var(--fg))]">
                  {entry.actor || RESPONSIBILITY_LEVEL_LABELS[entry.level] || entry.level}
                </span>
                <span className="text-[rgb(var(--muted))]"> – {entry.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type ResponsibilityPreviewProps = {
  responsibilities: ResponsibilityRecord[];
  paths: ResponsibilityPath[];
  showPathOverlay?: boolean;
  overlayButtonLabel?: string;
};

export function ResponsibilityPreviewCard({
  responsibilities,
  paths,
  showPathOverlay = false,
  overlayButtonLabel = "Zuständigkeitsweg anzeigen",
}: ResponsibilityPreviewProps) {
  const grouped = useMemo(() => {
    return responsibilities.reduce<Record<string, ResponsibilityRecord[]>>((acc, entry) => {
      if (!acc[entry.level]) acc[entry.level] = [];
      acc[entry.level].push(entry);
      return acc;
    }, {});
  }, [responsibilities]);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const hasData =
    responsibilities.length > 0 || paths.some((path) => Array.isArray(path.nodes) && path.nodes.length > 0);

  const hasPathNodes = paths.some((path) => path.nodes?.length);

  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Wer wäre zuständig?</h2>
        {showPathOverlay && hasPathNodes && (
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="text-xs font-semibold text-sky-600 underline"
          >
            {overlayButtonLabel}
          </button>
        )}
      </div>

      {!hasData ? (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Noch keine Verantwortlichen hinterlegt. Sobald Directory oder Redaktion Zuständigkeiten zuordnet,
          siehst du sie hier.
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-sm text-[rgb(var(--muted))]">
          {Object.entries(grouped).map(([level, entries]) => (
            <div key={level} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {RESPONSIBILITY_LEVEL_LABELS[level] ?? level}
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[rgb(var(--muted))]">
                {entries.slice(0, 3).map((entry) => (
                  <li key={entry.id}>
                    <span className="font-semibold text-[rgb(var(--fg))]">
                      {entry.actor || entry.text || RESPONSIBILITY_LEVEL_LABELS[entry.level] || entry.level}
                    </span>
                    {entry.text && <span className="text-[rgb(var(--muted))]"> – {entry.text}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {overlayOpen && showPathOverlay && hasPathNodes && (
        <ResponsibilityPathOverlay paths={paths} onClose={() => setOverlayOpen(false)} />
      )}
    </div>
  );
}

function ResponsibilityPathOverlay({
  paths,
  onClose,
}: {
  paths: ResponsibilityPath[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[rgb(var(--card))] p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Zuständigkeitswege</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Schließen
          </button>
        </div>
        {paths.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Noch keine Pfade erfasst. Redaktion kann sie später ergänzen.
          </p>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {paths.map((path) => (
              <div key={path.id ?? path.statementId} className="rounded-xl border border-[rgb(var(--border))] p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  Pfad zu Statement {path.statementId}
                </div>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-[rgb(var(--muted))]">
                  {(path.nodes ?? []).map((node, idx) => (
                    <li key={`${path.id ?? path.statementId}-${idx}`}>
                      <span className="font-semibold">
                        {node.displayName || RESPONSIBILITY_LEVEL_LABELS[node.level] || node.level}
                      </span>
                      {typeof node.relevance === "number" && (
                        <span className="text-xs text-[rgb(var(--muted))]">
                          {" "}
                          · Relevanz {(node.relevance * 100).toFixed(0)}%
                        </span>
                      )}
                      {node.processHint && <div className="text-xs text-[rgb(var(--muted))]">{node.processHint}</div>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
