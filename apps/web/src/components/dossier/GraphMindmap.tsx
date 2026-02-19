import { EDGE_KIND_LABELS } from "./labels";

type GraphNode = {
  id: string;
  type: "claim" | "evidence" | string;
  label: string;
};

type GraphEdge = {
  from: string;
  to: string;
  kind?: "supports" | "refutes" | "mentions" | string;
  weight?: number;
};

type GraphSummary = {
  claimCount?: number;
  evidenceCount?: number;
  linkedClaimCount?: number;
  unlinkedClaimCount?: number;
};

type GraphMindmapProps = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  summary?: GraphSummary;
};

export function GraphMindmap({ nodes = [], edges = [], summary }: GraphMindmapProps) {
  const claims = nodes.filter((node) => node.type === "claim");
  const evidence = nodes.filter((node) => node.type === "evidence");
  const labelById = new Map(nodes.map((node) => [node.id, node.label]));

  const claimCount = summary?.claimCount ?? claims.length;
  const evidenceCount = summary?.evidenceCount ?? evidence.length;
  const edgeCount = edges.length;
  const linkedClaims = summary?.linkedClaimCount ?? claimCount - (summary?.unlinkedClaimCount ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
        <span className="vog-chip">Statements: {claimCount}</span>
        <span className="vog-chip">Quellen: {evidenceCount}</span>
        <span className="vog-chip">Kanten: {edgeCount}</span>
        <span className="vog-chip">Verknüpfte Statements: {linkedClaims}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
          {claims.map((node) => (
            <div
              key={node.id}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
            >
              {node.label}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {edges.map((edge, idx) => (
            <div
              key={`${edge.from}-${edge.to}-${idx}`}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[11px] text-[rgb(var(--muted))]"
            >
              <span className="font-semibold text-[rgb(var(--fg))]">
                {labelById.get(edge.from) ?? edge.from}
              </span>
              <span className="mx-1">→</span>
              <span className="font-semibold text-[rgb(var(--fg))]">
                {labelById.get(edge.to) ?? edge.to}
              </span>
              {edge.kind ? (
                <span className="ml-2 rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px]">
                  {EDGE_KIND_LABELS[edge.kind] ?? edge.kind}
                  {typeof edge.weight === "number" ? ` · ${edge.weight.toFixed(2)}` : ""}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {evidence.map((node) => (
            <div
              key={node.id}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
            >
              {node.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GraphMindmap;
