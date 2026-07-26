import type { ObjectId } from "mongodb";
import type { UserVerification } from "@core/auth/verificationTypes";
import type { UserRole } from "@/types/user";
import type { AccessTier } from "@core/access/accessTiers";

export type CoreAccessTier = AccessTier;

export type CoreUserProfile = {
  displayName?: string | null;
  locale?: string | null;
  location?: string | null;
  headline?: string | null;
  bio?: string | null;
  tagline?: string | null;
  avatarStyle?: "initials" | "abstract" | "emoji" | null;
  topTopics?: Array<{
    key?: string;
    title?: string;
    statement?: string | null;
  }>;
  publicLocation?: {
    city?: string | null;
    region?: string | null;
    countryCode?: string | null;
  };
  publicShareId?: string | null;
  publicFlags?: {
    showRealName?: boolean;
    showCity?: boolean;
    showJoinDate?: boolean;
    showEngagementLevel?: boolean;
    showStats?: boolean;
    showMembership?: boolean;
  };
};

export type CoreUserSettings = {
  preferredLocale?: string | null;
  uiLocale?: string | null;
  readingLocale?: string | null;
  preferredOutputLocales?: string[] | null;
  showOriginalByDefault?: boolean;
  newsletterOptIn?: boolean;
};

export type CoreUserDoc = {
  _id: ObjectId;
  email: string;
  name?: string | null;
  role?: string | null;
  roles?: UserRole[];
  accessTier?: CoreAccessTier;
  profile?: CoreUserProfile;
  settings?: CoreUserSettings;
  verification?: UserVerification;
  verifiedEmail?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
