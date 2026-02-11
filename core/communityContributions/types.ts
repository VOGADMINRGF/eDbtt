export type CommunityContributionType = "source" | "option" | "question" | "impact" | "view";
export type CommunityContributionStatus = "proposed" | "approved" | "rejected";

export interface CommunityContribution {
  id?: string;
  type: CommunityContributionType;
  status?: CommunityContributionStatus;
  topicId?: string | null;
  candidateId?: string | null;
  title?: string | null;
  body?: string | null;
  url?: string | null;
  authorName?: string | null;
  authorId?: string | null;
  reviewNote?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
