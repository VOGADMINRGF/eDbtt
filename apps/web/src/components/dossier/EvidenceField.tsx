"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OptionNode = { id: string; label: string };

type ClaimNode = {
  id: string;
  label: string;
  cluster?: string;
  importance?: number;
  domain?: string | null;
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

type OptionLink = { optionId: string; claimId: string };

type EvidenceEdge = {
  id: string;
  claimId: string;
  sourceId: string;
  kind?: string;
  weight?: number;
};

type Line = {
  id: string;
  fromKey: string;
  toKey: string;
  kind?: string;
  weight?: number;
  type: "option" | "evidence";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type EvidenceFieldProps = {
  options: OptionNode[];
  claims: ClaimNode[];
  sources: SourceNode[];
  edges: GraphEdge[];
  optionLinks: OptionLink[];
};

type ActiveNode = { type: "option" | "claim" | "source"; id: string } | null;

const CLUSTER_STYLES: Record<string, string> = {
  "Kosten/Haushalt": "border-amber-400/40 bg-amber-400/10",
  "Pädagogik/Raumkonzept": "border-sky-400/40 bg-sky-400/10",
  "Klima/Energie": "border-emerald-400/40 bg-emerald-400/10",
  "Bauzeit/Übergang": "border-violet-400/40 bg-violet-400/10",
};

function claimStyle(claim: ClaimNode) {
  const label = claim.label.toLowerCase();
  if (label.includes("kooperation") || claim.domain === "verwaltung") {
    return "border-violet-400/40 bg-violet-400/10";
  }
  if (claim.importance === 5) {
    return "border-sky-400/40 bg-sky-400/10";
  }
  return "border-teal-400/40 bg-teal-400/10";
}

function optionStyle() {
  return "border-amber-400/40 bg-amber-400/10";
}

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
  if (typeof weight !== "number") return 1.5;
  return Math.max(1.5, Math.round(weight * 6));
}

function nodeKey(type: "option" | "claim" | "source", id: string) {
  return `${type}-${id}`;
}

function edgeStroke(kind?: string) {
  if (kind === "supports") return "rgba(45,212,191,0.7)";
  if (kind === "mentions") return "rgba(148,163,184,0.6)";
  return "rgba(148,163,184,0.4)";
}

function edgeDash(kind?: string) {
  if (kind === "mentions") return "4 4";
  return undefined;
}

export function EvidenceField({ options, claims, sources, edges, optionLinks }: EvidenceFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [hovered, setHovered] = useState<ActiveNode>(null);
  const [focused, setFocused] = useState<ActiveNode>(null);

  const claimIds = useMemo(() => new Set(claims.map((claim) => claim.id)), [claims]);
  const sourceIds = useMemo(() => new Set(sources.map((source) => source.id)), [sources]);

  const evidenceEdges = useMemo(() => resolveEdges(edges, claimIds, sourceIds), [edges, claimIds, sourceIds]);

  const maps = useMemo(() => {
    const claimsByOption = new Map<string, string[]>();
    const optionsByClaim = new Map<string, string[]>();
    for (const link of optionLinks) {
      const claimList = claimsByOption.get(link.optionId) ?? [];
      claimList.push(link.claimId);
      claimsByOption.set(link.optionId, claimList);

      const optionList = optionsByClaim.get(link.claimId) ?? [];
      optionList.push(link.optionId);
      optionsByClaim.set(link.claimId, optionList);
    }

    const sourcesByClaim = new Map<string, string[]>();
    const claimsBySource = new Map<string, string[]>();
    for (const link of evidenceEdges) {
      const sourceList = sourcesByClaim.get(link.claimId) ?? [];
      sourceList.push(link.sourceId);
      sourcesByClaim.set(link.claimId, sourceList);

      const claimList = claimsBySource.get(link.sourceId) ?? [];
      claimList.push(link.claimId);
      claimsBySource.set(link.sourceId, claimList);
    }

    return { claimsByOption, optionsByClaim, sourcesByClaim, claimsBySource };
  }, [optionLinks, evidenceEdges]);

  const active = focused ?? hovered;

  const activeSets = useMemo(() => {
    if (!active) {
      return {
        options: new Set(options.map((opt) => opt.id)),
        claims: new Set(claims.map((claim) => claim.id)),
        sources: new Set(sources.map((source) => source.id)),
      };
    }

    const activeOptions = new Set<string>();
    const activeClaims = new Set<string>();
    const activeSources = new Set<string>();

    if (active.type === "option") {
      activeOptions.add(active.id);
      const claimIdsForOption = maps.claimsByOption.get(active.id) ?? [];
      claimIdsForOption.forEach((id) => activeClaims.add(id));
      claimIdsForOption.forEach((claimId) => {
        (maps.sourcesByClaim.get(claimId) ?? []).forEach((sourceId) => activeSources.add(sourceId));
      });
    }

    if (active.type === "claim") {
      activeClaims.add(active.id);
      (maps.optionsByClaim.get(active.id) ?? []).forEach((optionId) => activeOptions.add(optionId));
      (maps.sourcesByClaim.get(active.id) ?? []).forEach((sourceId) => activeSources.add(sourceId));
    }

    if (active.type === "source") {
      activeSources.add(active.id);
      (maps.claimsBySource.get(active.id) ?? []).forEach((claimId) => activeClaims.add(claimId));
      (maps.claimsBySource.get(active.id) ?? []).forEach((claimId) => {
        (maps.optionsByClaim.get(claimId) ?? []).forEach((optionId) => activeOptions.add(optionId));
      });
    }

    return { options: activeOptions, claims: activeClaims, sources: activeSources };
  }, [active, claims, options, sources, maps]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const box = container.getBoundingClientRect();
      const next: Line[] = [];

      for (const link of optionLinks) {
        const fromKey = nodeKey("option", link.optionId);
        const toKey = nodeKey("claim", link.claimId);
        const fromEl = container.querySelector<HTMLElement>(`[data-node-id="${fromKey}"]`);
        const toEl = container.querySelector<HTMLElement>(`[data-node-id="${toKey}"]`);
        if (!fromEl || !toEl) continue;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        next.push({
          id: `opt-${link.optionId}-${link.claimId}`,
          fromKey,
          toKey,
          type: "option",
          x1: fromRect.right - box.left,
          y1: fromRect.top - box.top + fromRect.height / 2,
          x2: toRect.left - box.left,
          y2: toRect.top - box.top + toRect.height / 2,
        });
      }

      for (const link of evidenceEdges) {
        const fromKey = nodeKey("claim", link.claimId);
        const toKey = nodeKey("source", link.sourceId);
        const fromEl = container.querySelector<HTMLElement>(`[data-node-id="${fromKey}"]`);
        const toEl = container.querySelector<HTMLElement>(`[data-node-id="${toKey}"]`);
        if (!fromEl || !toEl) continue;
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        next.push({
          id: `edge-${link.claimId}-${link.sourceId}`,
          fromKey,
          toKey,
          type: "evidence",
          kind: link.kind,
          weight: link.weight,
          x1: fromRect.right - box.left,
          y1: fromRect.top - box.top + fromRect.height / 2,
          x2: toRect.left - box.left,
          y2: toRect.top - box.top + toRect.height / 2,
        });
      }

      setLines(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [optionLinks, evidenceEdges]);

  const activeLabel = active
    ? active.type === "option"
      ? options.find((opt) => opt.id === active.id)?.label
      : active.type === "claim"
        ? claims.find((claim) => claim.id === active.id)?.label
        : sources.find((source) => source.id === active.id)?.label
    : null;

  return (
    <section
      ref={containerRef}
      className="relative rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 md:flex-nowrap">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Evidenzfeld
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Verknüpfungen zwischen Optionen, Statements und Quellen.
          </p>
          <p
            className={`min-h-[16px] truncate text-[11px] text-[rgb(var(--muted))] ${
              activeLabel ? "opacity-100" : "opacity-0"
            }`}
          >
            Fokus: {activeLabel ?? "—"}
          </p>
        </div>
        <div className="flex min-h-[32px] items-center gap-4 overflow-x-auto text-[10px] text-[rgb(var(--muted))] md:shrink-0">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-sky-400/70" />
            Kernposition
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-teal-400/70" />
            Teilaspekt
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-amber-400/70" />
            Entscheidungsdimension
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-violet-400/70" />
            Governance
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-slate-400/70" />
            Quelle
          </span>
        </div>
        <div className="min-h-[16px] md:shrink-0">
          {focused ? (
            <button
              type="button"
              onClick={() => setFocused(null)}
              className="text-xs font-semibold text-[rgb(var(--fg))] underline"
            >
              Fokus zurücksetzen
            </button>
          ) : (
            <span className="text-xs text-transparent">Fokus zurücksetzen</span>
          )}
        </div>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.3fr_1.1fr]">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Optionen</div>
          <div className="space-y-2">
            {options.map((option) => {
              const isActive = activeSets.options.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  data-node-id={nodeKey("option", option.id)}
                  onClick={() => setFocused((prev) => (prev?.id === option.id && prev.type === "option" ? null : { type: "option", id: option.id }))}
                  onMouseEnter={() => setHovered({ type: "option", id: option.id })}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  } ${optionStyle()}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Statements</div>
          <div className="space-y-2">
            {claims.map((claim) => {
              const isActive = activeSets.claims.has(claim.id);
              const clusterClass = claim.cluster ? CLUSTER_STYLES[claim.cluster] : "";
              const baseClass = claimStyle(claim);
              return (
                <button
                  key={claim.id}
                  type="button"
                  data-node-id={nodeKey("claim", claim.id)}
                  onClick={() => setFocused((prev) => (prev?.id === claim.id && prev.type === "claim" ? null : { type: "claim", id: claim.id }))}
                  onMouseEnter={() => setHovered({ type: "claim", id: claim.id })}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  } ${clusterClass || baseClass}`}
                >
                  {claim.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</div>
          <div className="space-y-2">
            {sources.map((source) => {
              const isActive = activeSets.sources.has(source.id);
              return (
                <button
                  key={source.id}
                  type="button"
                  data-node-id={nodeKey("source", source.id)}
                  onClick={() => setFocused((prev) => (prev?.id === source.id && prev.type === "source" ? null : { type: "source", id: source.id }))}
                  onMouseEnter={() => setHovered({ type: "source", id: source.id })}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full rounded-xl border border-slate-400/40 bg-slate-400/10 px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {lines.map((line) => {
          const fromActive = line.fromKey.startsWith("option-")
            ? activeSets.options.has(line.fromKey.replace("option-", ""))
            : line.fromKey.startsWith("claim-")
              ? activeSets.claims.has(line.fromKey.replace("claim-", ""))
              : activeSets.sources.has(line.fromKey.replace("source-", ""));
          const toActive = line.toKey.startsWith("option-")
            ? activeSets.options.has(line.toKey.replace("option-", ""))
            : line.toKey.startsWith("claim-")
              ? activeSets.claims.has(line.toKey.replace("claim-", ""))
              : activeSets.sources.has(line.toKey.replace("source-", ""));
          const isActive = fromActive && toActive;
          const opacity = active ? (isActive ? 0.9 : 0.08) : 0.4;
          const stroke = line.type === "option" ? "rgba(148,163,184,0.4)" : edgeStroke(line.kind);
          const dash = line.type === "option" ? "3 4" : edgeDash(line.kind);
          const width = line.type === "option" ? 1.5 : weightToWidth(line.weight);
          return (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={dash}
              opacity={opacity}
              style={{ transition: "opacity 200ms ease" }}
            />
          );
        })}
      </svg>

      <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-[rgb(var(--muted))]">
        <span className="vog-chip">Linienstärke: Evidenzgewicht</span>
        <span className="vog-chip">Durchgezogen: stützt</span>
        <span className="vog-chip">Gestrichelt: erwähnt</span>
      </div>
      <div className="mt-4 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Evidenzdichte</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>0 = Keine verknüpfte Quelle</li>
          <li>1 = Einzelquelle</li>
          <li>2+ = Mehrere unabhängige Quellen</li>
        </ul>
        <p className="mt-2">Je höher die Evidenzdichte, desto besser ist eine Aussage belegt.</p>
        <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
          Farben helfen, Argumenttypen schneller zu erkennen.
        </p>
      </div>
    </section>
  );
}

export default EvidenceField;
