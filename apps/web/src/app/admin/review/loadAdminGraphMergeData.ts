import {
  getGraphMergeCandidatesPersistenceState,
  listGraphMergeAuditEntries,
  listGraphMergeCandidates,
} from "@features/graphMergeCandidates";

export async function loadAdminGraphMergeData() {
  const [graphMergeCandidates, graphMergeAudits] = await Promise.all([
    listGraphMergeCandidates({ limit: 80 }),
    listGraphMergeAuditEntries({ limit: 200 }),
  ]);

  return {
    graphMergeCandidates,
    graphMergeAudits,
    graphCandidatePersistence: getGraphMergeCandidatesPersistenceState(),
  };
}
