import {
  getTopicGraphEdgeKindLabel,
  getTopicGraphMutationBlockerLabel,
  getTopicGraphMutationStatusLabel,
  getTopicGraphSignalSourceLabel,
  summarizeTopicGraphMutationState,
} from "@/features/create/topicGraphRuntime";
import type {
  TopicGraphMutationAuditEntry,
  TopicGraphRuntimePersistenceState,
} from "@/features/create/topicGraphRuntimeServer";
import TopicGraphEdgeApprovalActions from "./TopicGraphEdgeApprovalActions";

type TopicGraphEdgeItem = Awaited<
  ReturnType<typeof import("@/features/create/topicGraphRuntimeServer").listTopicGraphEdgeDrafts>
>[number];

type Props = {
  graphRuntimeAvailable: boolean;
  topicGraphAuditMap: Map<string, TopicGraphMutationAuditEntry[]>;
  topicGraphEdges: TopicGraphEdgeItem[];
  topicGraphPersistence: TopicGraphRuntimePersistenceState;
};

export default function AdminTopicGraphApprovalSection({
  graphRuntimeAvailable,
  topicGraphAuditMap,
  topicGraphEdges,
  topicGraphPersistence,
}: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Topic Graph Approval
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Bestehende Review-Workbench für explizite Graph-Freigaben auf vorhandenen Topic-Graph-Drafts.
            Keine neue Admin-Welt, kein Auto-Graph, kein Auto-Merge und kein Auto-Publish.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          {graphRuntimeAvailable ? "Graph-Runtime erreichbar" : "Graph-Runtime blockiert"}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
        {topicGraphPersistence.label}
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {topicGraphPersistence.summary}
      </p>

      <div className="mt-4 space-y-3">
        {topicGraphEdges.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Keine Topic-Graph-Verknüpfungen im aktuellen Zustand.
          </p>
        ) : (
          topicGraphEdges.map((edge) => {
            const audits = topicGraphAuditMap.get(edge.id) ?? [];
            const latestAudit = audits[0] ?? null;

            return (
              <article
                key={edge.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    Graph-Verknüpfung prüfen
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {edge.kind}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {getTopicGraphMutationStatusLabel(edge.mutationStatus)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                  {getTopicGraphEdgeKindLabel(edge.kind)}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Quelle: {edge.source.title}
                  {edge.source.id ? ` (${edge.source.id})` : " (noch ohne Knoten-ID)"} · Ziel:{" "}
                  {edge.target.title}
                  {edge.target.id ? ` (${edge.target.id})` : " (noch ohne Knoten-ID)"}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Herkunft:{" "}
                  {edge.sourceKinds.length > 0
                    ? edge.sourceKinds.map(getTopicGraphSignalSourceLabel).join(" · ")
                    : "noch keine Herkunft dokumentiert"}
                  {edge.auditContext.origin ? ` · Audit-Quelle ${edge.auditContext.origin}` : ""}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Audit-Kontext:{" "}
                  {edge.auditContext.actorUserId && edge.auditContext.reason && edge.auditContext.origin
                    ? `${edge.auditContext.actorUserId} · ${edge.auditContext.reason}`
                    : "unvollständig"}
                  {edge.auditContext.approvedAt
                    ? ` · ${new Date(edge.auditContext.approvedAt).toLocaleString("de-DE")}`
                    : ""}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {summarizeTopicGraphMutationState(edge)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {edge.approvedForMerge
                      ? "approved_for_merge vorhanden"
                      : "approved_for_merge fehlt"}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {edge.approvedForGraphWrite
                      ? "approved_for_graph_write gesetzt"
                      : "approved_for_graph_write fehlt"}
                  </span>
                  {edge.sourceReviewPending ? (
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      source_review_pending
                    </span>
                  ) : null}
                  {edge.moderationPending ? (
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      moderation_pending
                    </span>
                  ) : null}
                </div>

                {edge.blockers.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Blocker
                    </p>
                    <div className="mt-2 space-y-1">
                      {edge.blockers.map((blocker) => (
                        <p key={`${edge.id}:${blocker}`} className="text-xs text-[rgb(var(--muted))]">
                          {blocker} · {getTopicGraphMutationBlockerLabel(blocker)}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {latestAudit ? (
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    Letzter Audit-Eintrag: {latestAudit.action} ·{" "}
                    {new Date(latestAudit.at).toLocaleString("de-DE")}
                    {latestAudit.reason ? ` · ${latestAudit.reason}` : ""}
                  </p>
                ) : null}

                <TopicGraphEdgeApprovalActions
                  edge={edge}
                  graphRuntimeAvailable={graphRuntimeAvailable}
                />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
