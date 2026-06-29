import {
  communitySourceReviewSubmissionRuntimeStatus,
  getCommunitySourceReviewPersistenceState,
  listCommunitySourceReviewAudits,
  listCommunitySourceReviewRecords,
} from "@/features/create/communitySourceReviewServer";

export async function loadAdminCommunitySourceReviewSectionProps() {
  const [communitySourceReviewRecords, communitySourceReviewAudits] = await Promise.all([
    listCommunitySourceReviewRecords(80),
    listCommunitySourceReviewAudits({ limit: 240 }),
  ]);

  const communitySourceReviewAuditMap = new Map<string, typeof communitySourceReviewAudits>();
  for (const record of communitySourceReviewRecords) {
    communitySourceReviewAuditMap.set(
      record.id,
      communitySourceReviewAudits.filter((entry) => entry.contributionId === record.id),
    );
  }

  return {
    communitySourceReviewRecords,
    communitySourceReviewAuditMap,
    communitySourceReviewPersistence: getCommunitySourceReviewPersistenceState(),
    submissionRuntimeStatus: communitySourceReviewSubmissionRuntimeStatus(),
  };
}
