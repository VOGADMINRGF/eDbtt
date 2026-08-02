import type { ObjectId } from "@core/db/triMongo";

export const ORG_ROLES = [
  "editor",
  "fact_checker",
  "publisher",
  "analyst",
  "org_admin",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_MEMBERSHIP_STATUSES = [
  "active",
  "invited",
  "pending_activation",
  "disabled",
] as const;
export type OrgMembershipStatus = (typeof ORG_MEMBERSHIP_STATUSES)[number];

export type OrgDoc = {
  _id?: ObjectId;
  slug: string;
  name: string;
  type?: string | null;
  members?: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
};

export type OrgMembershipDoc = {
  _id?: ObjectId;
  orgId: ObjectId;
  userId: ObjectId;
  role: OrgRole;
  status: OrgMembershipStatus;
  invitedEmail?: string | null;
  invitedByUserId?: ObjectId | null;
  inviteTokenHash?: string | null;
  inviteExpiresAt?: Date | null;
  inviteSetupTokenHash?: string | null;
  inviteSetupTokenExpiresAt?: Date | null;
  inviteDeliveryStatus?: "pending" | "delivered" | "failed";
  inviteDeliveryAttemptedAt?: Date | null;
  inviteDeliveryRetryable?: boolean | null;
  inviteDeliveryCategory?: string | null;
  inviteDeliveryClaimId?: string | null;
  inviteDeliveryClaimedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  disabledAt?: Date | null;
};

export type OrgMemberSummary = {
  id: string;
  orgId: string;
  userId: string;
  email?: string | null;
  name?: string | null;
  role: OrgRole;
  status: OrgMembershipStatus;
  invitedEmail?: string | null;
  inviteExpiresAt?: string | null;
  createdAt?: string | null;
};
