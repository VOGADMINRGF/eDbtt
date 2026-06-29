import {
  getTopicGraphRuntimePersistenceState,
  listTopicGraphEdgeDrafts,
  listTopicGraphMutationAudits,
  topicGraphRuntimeAvailable,
} from "@/features/create/topicGraphRuntimeServer";

export async function loadAdminTopicGraphApprovalSectionProps() {
  const [topicGraphEdges, topicGraphAudits] = await Promise.all([
    listTopicGraphEdgeDrafts(80),
    listTopicGraphMutationAudits({ limit: 240 }),
  ]);

  const topicGraphAuditMap = new Map<string, typeof topicGraphAudits>();
  for (const edge of topicGraphEdges) {
    topicGraphAuditMap.set(
      edge.id,
      topicGraphAudits.filter((entry) => entry.edgeId === edge.id),
    );
  }

  return {
    topicGraphEdges,
    topicGraphAuditMap,
    topicGraphPersistence: getTopicGraphRuntimePersistenceState(),
    graphRuntimeAvailable: topicGraphRuntimeAvailable(),
  };
}
