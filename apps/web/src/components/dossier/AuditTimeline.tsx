"use client";

import { useMemo, useState } from "react";
import type { InstitutionalAuditEvent } from "./useInstitutionalDossier";

function formatDateTime(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function short(value?: string | null, n = 12) {
  if (!value) return "–";
  return value.length <= n ? value : `${value.slice(0, n)}…`;
}

const ACTION_LABELS: Record<string, string> = {
  snapshot_created: "Snapshot erstellt",
  workflow_transition: "Workflow geändert",
  editorial_accept: "Editorial Accept",
  editorial_decision: "Editorial Entscheidung",
  clarification_requested: "Klärung angefragt",
  issue_delegated: "Delegation gesetzt",
};

const ACTION_GROUPS: Record<string, "workflow" | "snapshot" | "editorial" | "export" | "delegation"> = {
  workflow_transition: "workflow",
  snapshot_created: "snapshot",
  editorial_accept: "editorial",
  editorial_decision: "editorial",
  clarification_requested: "editorial",
  issue_delegated: "delegation",
};

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "workflow", label: "Workflow" },
  { id: "snapshot", label: "Snapshot" },
  { id: "editorial", label: "Editorial" },
  { id: "delegation", label: "Delegation" },
] as const;

export function AuditTimeline({ events }: { events: InstitutionalAuditEvent[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((ev) => ACTION_GROUPS[ev.action] === filter);
  }, [events, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, InstitutionalAuditEvent[]>();
    for (const ev of filtered) {
      const date = formatDateTime(ev.timestamp).split(",")[0];
      const list = map.get(date) ?? [];
      list.push(ev);
      map.set(date, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (!events?.length) {
    return (
      <section className="vog-card p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Änderungsprotokoll
        </div>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keine Ereignisse protokolliert.</p>
      </section>
    );
  }

  return (
    <section className="vog-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Änderungsprotokoll
        </div>
        <div className="text-[11px] text-[rgb(var(--muted))]">
          {filtered.length} Einträge
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`vog-chip ${filter === item.id ? "border-[rgb(var(--fg))] text-[rgb(var(--fg))]" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {grouped.map(([date, items]) => (
          <div key={date} className="space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              {date}
            </div>
            {items.map((ev, idx) => (
              <div key={ev.eventId} className="relative pl-6">
                <div className="absolute left-[7px] top-[6px] h-full w-px bg-[rgb(var(--border))]" />
                <div className="absolute left-[2px] top-[6px] h-3 w-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))]" />

                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[rgb(var(--fg))]">
                      {ACTION_LABELS[ev.action] ?? ev.action}
                    </div>
                    <div className="text-[11px] text-[rgb(var(--muted))]">
                      {formatDateTime(ev.timestamp)} · Rolle:{" "}
                      <span className="text-[rgb(var(--fg))]">{ev.actorRole}</span>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1 text-[11px] text-[rgb(var(--muted))]">
                    <div>
                      Event-Hash: <span className="font-mono text-[rgb(var(--fg))]">{short(ev.eventHash)}</span>
                    </div>
                    <div>
                      Vorheriger Hash: <span className="font-mono text-[rgb(var(--fg))]">{short(ev.previousHash)}</span>
                    </div>
                    {idx === 0 ? (
                      <div className="pt-1 text-[11px] text-[rgb(var(--muted))]">
                        Hinweis: Neueste Einträge oben. Die Hash-Kette macht Manipulationen sichtbar.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default AuditTimeline;
