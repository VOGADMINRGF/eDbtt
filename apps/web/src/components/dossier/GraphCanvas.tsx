"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EDGE_KIND_LABELS } from "./labels";

type GraphNode = {
  id: string;
  label: string;
};

type GraphEdge = {
  from: string;
  to: string;
  kind?: string;
  weight?: number;
};

type Line = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  kind?: string;
  weight?: number;
  fromLabel?: string;
  toLabel?: string;
};

type GraphCanvasProps = {
  claims: GraphNode[];
  sources: GraphNode[];
  edges: GraphEdge[];
};

function getCenter(el: HTMLElement, container: DOMRect) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - container.left + rect.width / 2,
    y: rect.top - container.top + rect.height / 2,
  };
}

export function GraphCanvas({ claims, sources, edges }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<Line[]>([]);

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of [...claims, ...sources]) map.set(node.id, node.label);
    return map;
  }, [claims, sources]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const box = container.getBoundingClientRect();
      const next: Line[] = [];
      for (const edge of edges) {
        const fromEl = container.querySelector<HTMLElement>(`[data-node-id="${edge.from}"]`);
        const toEl = container.querySelector<HTMLElement>(`[data-node-id="${edge.to}"]`);
        if (!fromEl || !toEl) continue;
        const from = getCenter(fromEl, box);
        const to = getCenter(toEl, box);
        next.push({
          id: `${edge.from}-${edge.to}-${edge.kind ?? "edge"}`,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          midX: (from.x + to.x) / 2,
          midY: (from.y + to.y) / 2,
          kind: edge.kind,
          weight: edge.weight,
          fromLabel: labelById.get(edge.from),
          toLabel: labelById.get(edge.to),
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
  }, [edges, labelById]);

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Statements
          </div>
          {claims.map((node) => (
            <div
              key={node.id}
              data-node-id={node.id}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
            >
              {node.label}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Quellen
          </div>
          {sources.map((node) => (
            <div
              key={node.id}
              data-node-id={node.id}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
            >
              {node.label}
            </div>
          ))}
        </div>
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="edgeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--grad-from))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(var(--grad-to))" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#edgeGradient)"
            strokeWidth={2}
          />
        ))}
      </svg>

      {lines.map((line) => (
        <span
          key={`${line.id}-badge`}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] text-[rgb(var(--muted))]"
          style={{ left: line.midX, top: line.midY }}
        >
          {EDGE_KIND_LABELS[line.kind ?? "mentions"] ?? line.kind ?? "verknüpft"}
          {typeof line.weight === "number" ? ` · ${line.weight.toFixed(2)}` : ""}
        </span>
      ))}
    </div>
  );
}

export default GraphCanvas;
