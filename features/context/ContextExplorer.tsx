// VPM25/features/context/ContextExplorer.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ContextType = "country" | "state" | "county" | "city" | "district" | "topic" | "org";

export interface ContextNode {
  id: string;
  label: string;
  type: ContextType;
  count?: number;                 // z.B. Anzahl Beiträge/Statements in diesem Kontext
  hasChildren?: boolean;          // true, wenn lazily nachladbar
  children?: ContextNode[];       // bereits geladene Kinder (optional)
  meta?: Record<string, any>;     // beliebige Zusatzinfos
}

export interface ContextExplorerProps {
  /** Vorbelegte Wurzelknoten (können auch leer sein, wenn ausschließlich lazy geladen wird) */
  roots: ContextNode[];

  /** Lazy-Loader für Kinder eines Knotens. Wird nur genutzt, wenn hasChildren=true und children fehlen */
  fetchChildren?: (parentId: string) => Promise<ContextNode[]>;

  /** Wird bei Auswahl eines Knotens ausgelöst */
  onSelect?: (node: ContextNode) => void;

  /** Suche aktivieren (default: true) */
  enableSearch?: boolean;

  /** Platzhaltertext für die Suche */
  searchPlaceholder?: string;

  /** Optional: maximal wie viele Ebenen auf einmal expandiert werden dürfen (0 = kein Limit) */
  maxExpandedDepth?: number;
}

/** kleine Badge */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
      {children}
    </span>
  );
}

/** Pfeil für expand/collapse */
function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block transition-transform duration-150 mr-1 ${open ? "rotate-90" : "rotate-0"}`}
      aria-hidden
    >
      ▶
    </span>
  );
}

type ExpandedMap = Record<string, boolean>;
type LoadingMap = Record<string, boolean>;

export default function ContextExplorer({
  roots,
  fetchChildren,
  onSelect,
  enableSearch = true,
  searchPlaceholder = "Suchen (Name, Typ)…",
  maxExpandedDepth = 0,
}: ContextExplorerProps) {
  const [tree, setTree] = useState<ContextNode[]>(roots ?? []);
  const [expanded, setExpanded] = useState<ExpandedMap>({});
  const [loading, setLoading] = useState<LoadingMap>({});
  const [query, setQuery] = useState("");

  // wenn sich roots ändern, synchronisieren
  useEffect(() => setTree(roots ?? []), [roots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;

    const match = (n: ContextNode) =>
      n.label.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q) ||
      (n.meta ? JSON.stringify(n.meta).toLowerCase().includes(q) : false);

    function filterNodes(nodes: ContextNode[]): ContextNode[] {
      const out: ContextNode[] = [];
      for (const n of nodes) {
        const c = n.children ? filterNodes(n.children) : [];
        if (match(n) || c.length) {
          out.push({ ...n, children: c });
        }
      }
      return out;
    }

    // Wenn nur flache Daten übergeben werden (keine Kinder), filtere flach
    if (!tree.some(n => n.children?.length)) {
      return tree.filter(match);
    }
    return filterNodes(tree);
  }, [tree, query]);

  async function toggle(node: ContextNode, depth: number) {
    const isOpen = !!expanded[node.id];
    // Collapse
    if (isOpen) {
      setExpanded((m) => ({ ...m, [node.id]: false }));
      return;
    }
    // Optional: Tiefenlimit
    if (maxExpandedDepth > 0 && depth >= maxExpandedDepth) return;

    // Expand
    setExpanded((m) => ({ ...m, [node.id]: true }));

    // Lazy-Load
    if (fetchChildren && node.hasChildren && (!node.children || node.children.length === 0)) {
      setLoading((m) => ({ ...m, [node.id]: true }));
      try {
        const kids = await fetchChildren(node.id);
        setTree((prev) => {
          function attach(nodes: ContextNode[]): ContextNode[] {
            return nodes.map((n) => {
              if (n.id === node.id) {
                return { ...n, children: kids, hasChildren: kids.length > 0 };
              }
              if (n.children?.length) {
                return { ...n, children: attach(n.children) };
              }
              return n;
            });
          }
          return attach(prev);
        });
      } finally {
        setLoading((m) => ({ ...m, [node.id]: false }));
      }
    }
  }

  function onPick(n: ContextNode) {
    onSelect?.(n);
  }

  function NodeRow({
    n,
    depth,
  }: {
    n: ContextNode;
    depth: number;
  }) {
    const isOpen = !!expanded[n.id];
    const isLoading = !!loading[n.id];
    const canExpand = !!(n.hasChildren || (n.children && n.children.length > 0));

    return (
      <div className="pl-2">
        <div className="flex items-center py-1.5">
          {/* Toggle */}
          <button
            type="button"
            className={`mr-1 select-none ${canExpand ? "text-gray-700 hover:text-gray-900" : "text-transparent"}`}
            onClick={() => (canExpand ? toggle(n, depth) : undefined)}
            aria-label={isOpen ? "Einklappen" : "Ausklappen"}
          >
            <Chevron open={isOpen} />
          </button>

          {/* Label */}
          <button
            type="button"
            onClick={() => onPick(n)}
            className="flex-1 text-left truncate hover:underline"
            title={`${n.label} (${n.type})`}
          >
            <span className="font-medium">{n.label}</span>
            <span className="ml-2 text-xs uppercase tracking-wide text-gray-500">{n.type}</span>
            {typeof n.count === "number" && <Badge>{n.count}</Badge>}
          </button>

          {/* Loading */}
          {isLoading && <span className="ml-2 animate-pulse text-xs text-gray-500">lädt…</span>}
        </div>

        {/* Children */}
        {isOpen && (n.children?.length ?? 0) > 0 && (
          <div className="ml-4 border-l border-gray-200">
            {n.children!.map((c) => (
              <NodeRow key={c.id} n={c} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 p-3">
        <h3 className="text-sm font-semibold tracking-tight">Kontext-Explorer</h3>
        {enableSearch && (
          <div className="ml-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-64 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="max-h-[60vh] overflow-auto p-2">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Keine Treffer.</div>
        ) : (
          filtered.map((n) => <NodeRow key={n.id} n={n} depth={1} />)
        )}
      </div>
    </div>
  );
}
