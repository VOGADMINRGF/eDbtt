import "server-only";
import { getCol, ObjectId } from "@core/db/triMongo";

type ContributionDraftResumeDoc = {
  _id: ObjectId;
  authorId: string;
  text?: string | null;
};

export async function getCreateContributionDraftForResume(draftId: string, userId: string) {
  if (!ObjectId.isValid(draftId)) return null;
  const Drafts = await getCol<ContributionDraftResumeDoc>("contribution_drafts");
  const draft = await Drafts.findOne(
    { _id: new ObjectId(draftId), authorId: userId },
    { projection: { text: 1, authorId: 1 } },
  );
  if (!draft) return null;
  return {
    id: String(draft._id),
    text: typeof draft.text === "string" ? draft.text : "",
  };
}
