"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

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
  excerpt?: string;
  url?: string;
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
  optionRanking?: Map<string, number>;
  contestedClaimIds?: string[];
};

type ActiveNode = { type: "option" | "claim" | "source"; id: string } | null;
type FocusedEdgeDetail = {
  id: string;
  fromLabel: string;
  toLabel: string;
  weight?: number;
  kind?: string;
  excerpt?: string;
  url?: string;
};

type FocusDetails = {
  title: string;
  typeLabel: "Option" | "Kernaussage" | "Quelle";
  statements: string[];
  sources: string[];
  edges: FocusedEdgeDetail[];
  excerpt?: string;
};

type Category = "kernposition" | "teilaspekt" | "entscheidungsdimension" | "governance";

const CATEGORY_STYLES: Record<Category, string> = {
  kernposition: "border-cyan-500/35 bg-[rgb(var(--card))]",
  teilaspekt: "border-teal-500/35 bg-[rgb(var(--card))]",
  entscheidungsdimension: "border-sky-500/35 bg-[rgb(var(--card))]",
  governance: "border-violet-500/35 bg-[rgb(var(--card))]",
};

const CATEGORY_MARKERS: Record<Category, string> = {
  kernposition: "bg-cyan-500",
  teilaspekt: "bg-teal-500",
  entscheidungsdimension: "bg-sky-500",
  governance: "bg-violet-500",
};

const NODE_CLAMP_STYLE: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function claimCategory(claim: ClaimNode): Category {
  const label = claim.label.toLowerCase();
  if (claim.importance === 5) return "kernposition";
  if (label.includes("kooperation") || claim.domain === "verwaltung") return "governance";
  if (label.includes("entscheidungsdimension") || claim.domain === "finanzen" || claim.domain === "klima") {
    return "entscheidungsdimension";
  }
  return "teilaspekt";
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
  if (kind === "supports") return "rgba(45,212,191,0.72)";
  if (kind === "mentions") return "rgba(56,189,248,0.45)";
  return "rgba(149,164,182,0.35)";
}

function edgeDash(kind?: string) {
  if (kind === "mentions") return "4 4";
  return undefined;
}

function kindLabel(kind?: string) {
  if (kind === "supports") return "stützt";
  if (kind === "mentions") return "erwähnt";
  return "bezieht sich auf";
}

export function EvidenceField({ options, claims, sources, edges, optionLinks, optionRanking }: EvidenceFieldProps) {
  const contestedSet = useMemo(() => new Set(contestedClaimIds ?? []), [contestedClaimIds]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [hovered, setHovered] = useState<ActiveNode>(null);
  const [focused, setFocused] = useState<ActiveNode>(null);

  const claimIds = useMemo(() => new Set(claims.map((claim) => claim.id)), [claims]);
  const sourceIds = useMemo(() => new Set(sources.map((source) => source.id)), [sources]);

  const evidenceEdges = useMemo(() => resolveEdges(edges, claimIds, sourceIds), [edges, claimIds, sourceIds]);

  const evidenceByClaim = useMemo(() => {
    const map = new Map<string, EvidenceEdge[]>();
    for (const edge of evidenceEdges) {
      const list = map.get(edge.claimId) ?? [];
      list.push(edge);
      map.set(edge.claimId, list);
    }
    return map;
  }, [evidenceEdges]);

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

  const claimById = useMemo(() => {
    const map = new Map<string, ClaimNode>();
    for (const claim of claims) map.set(claim.id, claim);
    return map;
  }, [claims]);
  const sourceById = useMemo(() => {
    const map = new Map<string, SourceNode>();
    for (const source of sources) map.set(source.id, source);
    return map;
  }, [sources]);

  const optionCategoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const option of options) {
      const claimIdsForOption = maps.claimsByOption.get(option.id) ?? [];
      const categories = claimIdsForOption
        .map((id) => claimById.get(id))
        .filter(Boolean)
        .map((claim) => claimCategory(claim as ClaimNode));

      let category: Category = "teilaspekt";
      if (categories.includes("kernposition")) category = "kernposition";
      else if (categories.includes("governance")) category = "governance";
      else if (categories.includes("entscheidungsdimension")) category = "entscheidungsdimension";
      map.set(option.id, category);
    }
    return map;
  }, [options, maps.claimsByOption, claimById]);
  const evidenceCountByClaim = useMemo(() => {
    const map = new Map<string, number>();
    for (const edge of evidenceEdges) {
      map.set(edge.claimId, (map.get(edge.claimId) ?? 0) + 1);
    }
    return map;
  }, [evidenceEdges]);

  const active = focused ?? hovered;

  const scheduleHover = (next: ActiveNode) => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setHovered(next);
    }, 90);
  };

  const clearHover = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHovered(null);
  };

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

  useEffect(
    () => () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    },
    [],
  );

  const activeLabel = active
    ? active.type === "option"
      ? options.find((opt) => opt.id === active.id)?.label
      : active.type === "claim"
        ? claims.find((claim) => claim.id === active.id)?.label
        : sources.find((source) => source.id === active.id)?.label
    : null;

  const activeEvidenceCount =
    active?.type === "claim" ? evidenceCountByClaim.get(active.id) ?? 0 : null;

  const rankedOptions = useMemo(() => {
    if (!optionRanking || optionRanking.size === 0) return options;
    return [...options].sort(
      (a, b) => (optionRanking.get(b.id) ?? 0) - (optionRanking.get(a.id) ?? 0),
    );
  }, [options, optionRanking]);

  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    rankedOptions.forEach((opt, idx) => map.set(opt.id, idx));
    return map;
  }, [rankedOptions]);

  const labelMaps = useMemo(() => {
    const optionLabel = new Map(options.map((opt) => [opt.id, opt.label]));
    const claimLabel = new Map(claims.map((claim) => [claim.id, claim.label]));
    const sourceLabel = new Map(sources.map((src) => [src.id, src.label]));
    return { optionLabel, claimLabel, sourceLabel };
  }, [options, claims, sources]);

  const focusedDetails = useMemo<FocusDetails | null>(() => {
    if (!focused) return null;

    if (focused.type === "option") {
      const claimIdsForOption = maps.claimsByOption.get(focused.id) ?? [];
      const claimLabels = claimIdsForOption.map((id) => labelMaps.claimLabel.get(id) ?? id);
      const sourceIds = new Set<string>();
      const edgeDetails: FocusedEdgeDetail[] = [];

      for (const claimId of claimIdsForOption) {
        for (const edge of evidenceByClaim.get(claimId) ?? []) {
          const sourceNode = sourceById.get(edge.sourceId);
          sourceIds.add(edge.sourceId);
          edgeDetails.push({
            id: `${claimId}-${edge.sourceId}-${edge.kind ?? "edge"}`,
            fromLabel: labelMaps.claimLabel.get(claimId) ?? claimId,
            toLabel: labelMaps.sourceLabel.get(edge.sourceId) ?? edge.sourceId,
            weight: edge.weight,
            kind: edge.kind,
            excerpt: sourceNode?.excerpt,
            url: sourceNode?.url,
          });
        }
      }

      edgeDetails.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

      return {
        title: labelMaps.optionLabel.get(focused.id) ?? focused.id,
        typeLabel: "Option",
        statements: claimLabels,
        sources: Array.from(sourceIds).map((id) => labelMaps.sourceLabel.get(id) ?? id),
        edges: edgeDetails,
      };
    }

    if (focused.type === "claim") {
      const optionIds = maps.optionsByClaim.get(focused.id) ?? [];
      const sourceIds = maps.sourcesByClaim.get(focused.id) ?? [];
      const edgeDetails: FocusedEdgeDetail[] = (evidenceByClaim.get(focused.id) ?? []).map((edge) => ({
        ...(() => {
          const sourceNode = sourceById.get(edge.sourceId);
          return {
            id: `${focused.id}-${edge.sourceId}-${edge.kind ?? "edge"}`,
            fromLabel: labelMaps.claimLabel.get(focused.id) ?? focused.id,
            toLabel: labelMaps.sourceLabel.get(edge.sourceId) ?? edge.sourceId,
            weight: edge.weight,
            kind: edge.kind,
            excerpt: sourceNode?.excerpt,
            url: sourceNode?.url,
          };
        })(),
      }));
      edgeDetails.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

      return {
        title: labelMaps.claimLabel.get(focused.id) ?? focused.id,
        typeLabel: "Kernaussage",
        statements: optionIds.map((id) => labelMaps.optionLabel.get(id) ?? id),
        sources: sourceIds.map((id) => labelMaps.sourceLabel.get(id) ?? id),
        edges: edgeDetails,
      };
    }

    const claimIdsForSource = maps.claimsBySource.get(focused.id) ?? [];
    const sourceNode = sourceById.get(focused.id);
    const edgeDetails: FocusedEdgeDetail[] = claimIdsForSource.flatMap((claimId) =>
      (evidenceByClaim.get(claimId) ?? [])
        .filter((edge) => edge.sourceId === focused.id)
        .map((edge) => ({
          id: `${claimId}-${focused.id}-${edge.kind ?? "edge"}`,
          fromLabel: labelMaps.claimLabel.get(claimId) ?? claimId,
          toLabel: labelMaps.sourceLabel.get(focused.id) ?? focused.id,
          weight: edge.weight,
          kind: edge.kind,
          excerpt: sourceNode?.excerpt,
          url: sourceNode?.url,
        })),
    );
    edgeDetails.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

    return {
      title: labelMaps.sourceLabel.get(focused.id) ?? focused.id,
      typeLabel: "Quelle",
      statements: claimIdsForSource.map((id) => labelMaps.claimLabel.get(id) ?? id),
      sources: [],
      edges: edgeDetails,
      excerpt: sourceNode?.excerpt,
    };
  }, [focused, maps, labelMaps, evidenceByClaim, sourceById]);

  const rankClass = (rank?: number) => {
    if (rank === 0) return "ring-1 ring-teal-700/30";
    if (rank === 1) return "ring-1 ring-teal-700/22";
    if (rank === 2) return "ring-1 ring-teal-700/16";
    return "";
  };

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
            Verknüpfungen zwischen Optionen, Kernaussagen und Quellen.
          </p>
          <p
            className={`min-h-[16px] truncate text-[11px] text-[rgb(var(--muted))] ${
              activeLabel ? "opacity-100" : "opacity-0"
            }`}
          >
            Fokus: {activeLabel ?? "—"}
          </p>
          <p
            className={`min-h-[16px] text-[11px] text-[rgb(var(--muted))] ${
              active?.type === "claim" ? "opacity-100" : "opacity-0"
            }`}
          >
            Verknüpfte Quellen: {activeEvidenceCount ?? 0}
          </p>
        </div>
        <div className="flex min-h-[32px] items-center gap-4 overflow-x-auto text-[10px] text-[rgb(var(--muted))] md:shrink-0">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Kernposition
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Teilaspekt
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Entscheidungsdimension
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Governance
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-slate-400/70" />
            Quelle
          </span>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[10px] text-[rgb(var(--muted))] md:max-w-[280px]">
          <p className="font-semibold text-[rgb(var(--fg))]">So liest du das Evidenzfeld</p>
          <p>Option → Kernaussage → Quelle</p>
          <p>Dicke Linie = stärker belegt</p>
          <p>Durchgezogen = stützt, gestrichelt = erwähnt</p>
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
            {rankedOptions.map((option) => {
              const isActive = activeSets.options.has(option.id);
              const rank = rankById.get(option.id);
              const category = optionCategoryById.get(option.id) ?? "teilaspekt";
              const categoryClass = CATEGORY_STYLES[category];
              return (
                <button
                  key={option.id}
                  type="button"
                  data-node-id={nodeKey("option", option.id)}
                  onClick={() => setFocused((prev) => (prev?.id === option.id && prev.type === "option" ? null : { type: "option", id: option.id }))}
                  onMouseEnter={() => scheduleHover({ type: "option", id: option.id })}
                  onMouseLeave={clearHover}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  } ${categoryClass} ${rankClass(rank ?? 99)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`mt-0.5 h-10 w-0.5 rounded-full ${CATEGORY_MARKERS[category]}`} />
                    <span className="block min-h-[3.75rem] leading-snug" style={NODE_CLAMP_STYLE}>
                      {option.label}
                    </span>
                    {rank !== undefined && optionRanking ? (
                      <span className="shrink-0 rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]">
                        Rang {rank + 1}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Kernaussagen</div>
          <div className="space-y-2">
            {claims.map((claim) => {
              const isActive = activeSets.claims.has(claim.id);
              const category = claimCategory(claim);
              const evidenceCount = evidenceCountByClaim.get(claim.id) ?? 0;
              const evidenceLabel = evidenceCount > 1 ? "2+" : String(evidenceCount);
              const evidenceBadge = evidenceCount === 0 ? "Noch ohne Beleg" : `Evidenz: ${evidenceLabel}`;
              return (
                <button
                  key={claim.id}
                  type="button"
                  data-node-id={nodeKey("claim", claim.id)}
                  onClick={() => setFocused((prev) => (prev?.id === claim.id && prev.type === "claim" ? null : { type: "claim", id: claim.id }))}
                  onMouseEnter={() => scheduleHover({ type: "claim", id: claim.id })}
                  onMouseLeave={clearHover}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  } ${CATEGORY_STYLES[category]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`mt-0.5 h-10 w-0.5 rounded-full ${CATEGORY_MARKERS[category]}`} />
                    <span className="block min-h-[3.75rem] leading-snug" style={NODE_CLAMP_STYLE}>
                      {claim.label}
                    </span>
                    <span
                      title={
                        evidenceCount === 0
                          ? "Für diese Kernaussage fehlt aktuell eine Quelle. Material kann vorgeschlagen werden."
                          : "Evidenzdichte auf Basis verknüpfter Quellen im Dossier."
                      }
                      className="shrink-0 rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]"
                    >
                      {evidenceBadge}
                    </span>
                  </div>
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
                  onMouseEnter={() => scheduleHover({ type: "source", id: source.id })}
                  onMouseLeave={clearHover}
                  className={`w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-left text-sm text-[rgb(var(--fg))] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span className="block min-h-[3.75rem] leading-snug" style={NODE_CLAMP_STYLE}>
                    {source.label}
                  </span>
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
          const opacity = active ? (isActive ? 0.8 : 0.08) : 0.28;
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
      {focusedDetails ? (
        <div className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[11px] text-[rgb(var(--muted))]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Detailansicht (Fokus)
          </p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{focusedDetails.title}</p>
          <p className="text-[11px] text-[rgb(var(--muted))]">Typ: {focusedDetails.typeLabel}</p>
          {focusedDetails.typeLabel === "Quelle" && focusedDetails.excerpt ? (
            <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">Auszug: {focusedDetails.excerpt}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Verknüpfte {focusedDetails.typeLabel === "Kernaussage" ? "Optionen" : "Kernaussagen"}:{" "}
            {focusedDetails.statements.length ? focusedDetails.statements.join(", ") : "—"}
          </p>
          {focusedDetails.typeLabel !== "Quelle" ? (
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Verknüpfte Quellen: {focusedDetails.sources.length ? focusedDetails.sources.join(", ") : "—"}
            </p>
          ) : null}
          {focusedDetails.edges?.length ? (
            <div className="mt-2 space-y-1 text-[11px] text-[rgb(var(--muted))]">
              <p className="font-semibold text-[rgb(var(--fg))]">Kanten (Gewicht & Bezug)</p>
              {focusedDetails.edges.map((edge) => (
                <div key={edge.id} className="space-y-0.5 rounded-lg border border-[rgb(var(--border))] px-2 py-1">
                  <div className="text-[11px] text-[rgb(var(--fg))]">
                    {edge.fromLabel} → {edge.toLabel}
                  </div>
                  <div className="text-[10px] opacity-85">
                    Gewicht: {edge.weight ?? "—"} · Bezug: {kindLabel(edge.kind)}
                  </div>
                  {edge.excerpt ? <div className="text-[10px] opacity-80">Auszug: {edge.excerpt}</div> : null}
                  {edge.url ? (
                    <a
                      href={edge.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[10px] underline"
                    >
                      Quelle öffnen
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-[rgb(var(--muted))]">
          Klicke auf eine Option, eine Kernaussage oder eine Quelle, um Details zu sehen.
        </p>
      )}
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
