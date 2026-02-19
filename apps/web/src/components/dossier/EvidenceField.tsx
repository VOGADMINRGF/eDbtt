"use client";

import { useMemo, useState } from "react";
import { EDGE_KIND_LABELS } from "./labels";

type ClaimNode = {
  id: string;
  label: string;
  cluster?: string;
};

type SourceNode = {
  id: string;
  label: string;
};

type GraphEdge = {
  from: string;
  to: string;
  kind?: string;
  weight?: number;
};

type EvidenceEdge = {
  id: string;
  claimId: string;
  sourceId: string;
  kind?: string;
  weight?: number;
};

type EvidenceFieldProps = {
  claims: ClaimNode[];
  sources: SourceNode[];
  edges: GraphEdge[];
};

const CLUSTER_STYLES: Record<string, string> = {
  "Kosten/Haushalt": "border-amber-400/40 bg-amber-400/10",
  "Pädagogik/Raumkonzept": "border-sky-400/40 bg-sky-400/10",
  "Klima/Energie": "border-emerald-400/40 bg-emerald-400/10",
  "Bauzeit/Übergang": "border-violet-400/40 bg-violet-400/10",
};

function resolveEdges(edges: GraphEdge[], claimIds: Set<string>, sourceIds: Set<string>) {
  const resolved: EvidenceEdge[] = [];
  for (const edge of edges) {
    const fromIsClaim = claimIds.has(edge.from);
    const toIsClaim = claimIds.has(edge.to);
    const fromIsSource = sourceIds.has(edge.from);
    const toIsSource = sourceIds.has(edge.to);
    if (fromIsClaim && toIsSource) {
      resolved.push({
        id: `${edge.from}-${edge.to}-${edge.kind ?? "edge"}`,
        claimId: edge.from,
        sourceId: edge.to,
        kind: edge.kind,
        weight: edge.weight,
      });
      continue;
    }
    if (toIsClaim && fromIsSource) {
      resolved.push({
        id: `${edge.to}-${edge.from}-${edge.kind ?? "edge"}`,
        claimId: edge.to,
        sourceId: edge.from,
        kind: edge.kind,
        weight: edge.weight,
      });
    }
  }
  return resolved;
}

function weightToWidth(weight?: number) {
  if (typeof weight !== "number") return 2;
  return Math.max(2, Math.round(weight * 6));
}

function edgeStyle(kind?: string) {
  if (kind === "supports") return "border-emerald-400/40 bg-emerald-400/10";
  if (kind === "mentions") return "border-slate-400/40 bg-slate-400/10";
  return "border-[rgb(var(--border))] bg-[rgb(var(--bg))]";
}

export function EvidenceField({ claims, sources, edges }: EvidenceFieldProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const claimIds = useMemo(() => new Set(claims.map((claim) => claim.id)), [claims]);
  const sourceIds = useMemo(() => new Set(sources.map((source) => source.id)), [sources]);

  const resolvedEdges = useMemo(
    () => resolveEdges(edges, claimIds, sourceIds),
    [edges, claimIds, sourceIds],
  );

  const activeClaim = focused ?? hovered;
  const activeLabel = claims.find((claim) => claim.id === activeClaim)?.label ?? null;
  const visibleEdges = activeClaim
    ? resolvedEdges.filter((edge) => edge.claimId === activeClaim)
    : resolvedEdges;

  const visibleSourceIds = new Set(visibleEdges.map((edge) => edge.sourceId));

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Evidenzfeld
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Beziehungen zwischen Statements und Quellen im Fokus.
          </p>
          {activeLabel ? (
            <p className="text-[11px] text-[rgb(var(--muted))]">Fokus: {activeLabel}</p>
          ) : null}
        </div>
        {focused ? (
          <button
            type="button"
            onClick={() => setFocused(null)}
            className="text-xs font-semibold text-[rgb(var(--fg))] underline"
          >
            Fokus zurücksetzen
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr_1.1fr]">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Statements
          </div>
          <div className="space-y-2">
            {claims.map((claim) => {
              const isActive = !activeClaim || activeClaim === claim.id;
              const clusterClass = claim.cluster ? CLUSTER_STYLES[claim.cluster] : "";
              return (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => setFocused((prev) => (prev === claim.id ? null : claim.id))}
                  onMouseEnter={() => setHovered(claim.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition ${
                    isActive ? "opacity-100" : "opacity-40"
                  } ${clusterClass || "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"}`}
                >
                  {claim.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Verknüpfungen
          </div>
          <div className="space-y-2">
            {visibleEdges.length ? (
              visibleEdges.map((edge) => (
                <div
                  key={edge.id}
                  className={`rounded-xl border px-3 py-2 ${edgeStyle(edge.kind)}`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                    <span
                      className="inline-block rounded-full bg-[rgb(var(--muted))]"
                      style={{ width: 22, height: weightToWidth(edge.weight) }}
                    />
                    <span className="font-semibold text-[rgb(var(--fg))]">
                      {EDGE_KIND_LABELS[edge.kind ?? "mentions"] ?? edge.kind ?? "verknüpft"}
                    </span>
                    {typeof edge.weight === "number" ? (
                      <span className="text-[10px]">Gewicht {edge.weight.toFixed(2)}</span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Verknüpfungen gefunden.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Quellen
          </div>
          <div className="space-y-2">
            {sources.map((source) => {
              const isVisible = !activeClaim || visibleSourceIds.has(source.id);
              return (
                <div
                  key={source.id}
                  className={`rounded-xl border px-3 py-2 text-sm text-[rgb(var(--fg))] transition ${
                    isVisible ? "opacity-100" : "opacity-40"
                  } border-[rgb(var(--border))] bg-[rgb(var(--bg))]`}
                >
                  {source.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-[rgb(var(--muted))]">
        <span className="vog-chip">stützt</span>
        <span className="vog-chip">erwähnt</span>
        <span className="vog-chip">Gewichtung: Strichstärke</span>
      </div>
    </section>
  );
}

export default EvidenceField;
