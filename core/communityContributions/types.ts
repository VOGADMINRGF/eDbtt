export type CommunityContributionType = "source" | "option" | "question" | "impact" | "view";
export type CommunityContributionStatus = "proposed" | "approved" | "rejected";
export type CommunityContributionTranslationStatus = "missing" | "pending" | "translated" | "failed";

export interface CommunityContributionLocalizedText {
  originalLanguage?: string | null;
  originalText?: string | null;
  translations?: Record<string, string | null> | null;
  translationStatus?: CommunityContributionTranslationStatus | null;
  translatedAt?: Date | string | null;
  translationProvider?: string | null;
  translationModel?: string | null;
}

export interface CommunityContribution {
  id?: string;
  type: CommunityContributionType;
  status?: CommunityContributionStatus;
  topicId?: string | null;
  candidateId?: string | null;
  title?: string | null;
  body?: string | null;
  titleContent?: CommunityContributionLocalizedText | null;
  bodyContent?: CommunityContributionLocalizedText | null;
  url?: string | null;
  authorName?: string | null;
  authorId?: string | null;
  reviewNote?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
