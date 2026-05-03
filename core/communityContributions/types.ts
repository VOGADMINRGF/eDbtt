export type CommunityContributionType = "source" | "option" | "question" | "impact" | "view";
export type CommunityContributionStatus = "proposed" | "approved" | "rejected";
export type CommunityContributionTranslationStatus = "missing" | "pending" | "translated" | "failed";
export type CommunityContributionAuthorVisibility = "anonymous" | "nickname" | "real_name";
export type CommunityContributionAuthorKind =
  | "person"
  | "organization"
  | "representative_person";
export type CommunityContributionHostedRoomScope = "public_open" | "closed_hosted";

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
  authorVisibility?: CommunityContributionAuthorVisibility | null;
  authorKind?: CommunityContributionAuthorKind | null;
  organizationLabel?: string | null;
  representativeName?: string | null;
  hostedRoomScope?: CommunityContributionHostedRoomScope | null;
  confidentialHint?: boolean | null;
  authorId?: string | null;
  reviewNote?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
