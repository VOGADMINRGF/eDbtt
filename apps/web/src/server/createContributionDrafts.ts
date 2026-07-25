import "server-only";

import { getCreateContributionDraftForResumeRecord } from "@/server/serverDrafts";

export async function getCreateContributionDraftForResume(draftId: string, userId: string) {
  const draft = await getCreateContributionDraftForResumeRecord(draftId, userId);
  if (!draft) return null;
  return {
    id: draft.id,
    text: draft.text,
    storage: draft.storage,
    missingFields: draft.missingFields,
  };
}
