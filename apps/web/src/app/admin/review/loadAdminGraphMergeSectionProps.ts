import { loadAdminGraphMergeData } from "./loadAdminGraphMergeData";

export async function loadAdminGraphMergeSectionProps() {
  const graphMergeData = await loadAdminGraphMergeData();

  return {
    graphAuditMap: new Map(
      graphMergeData.graphMergeAudits.map((entry) => [entry.candidateId, entry]),
    ),
    graphCandidatePersistence: graphMergeData.graphCandidatePersistence,
    graphMergeCandidates: graphMergeData.graphMergeCandidates,
  };
}
