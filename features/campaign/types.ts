import type { ObjectId } from "@core/db/triMongo";

export type CampaignStatus = "draft" | "active" | "paused" | "ended";

export interface CampaignDoc {
  _id?: ObjectId;
  title: string;
  description?: string | null;
  regionCode?: string | null;
  topicKey?: string | null;
  status: CampaignStatus;
  supportEnabled?: boolean;
  supportSlug?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSessionDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  label?: string | null;
  status: "planned" | "live" | "ended";
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignParticipantDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  sessionId?: ObjectId | null;
  userId?: string | null;
  anonHash?: string | null;
  joinedAt: Date;
  source?: string | null;
}

export type SupportTargetType = "campaign" | "project" | "question";
export type SupportCampaignStatus = "draft" | "active" | "closed";
export type SupportPledgeStatus = "waiting_payment" | "paid" | "canceled";

export interface SupportCampaignDoc {
  _id?: ObjectId;
  targetType: SupportTargetType;
  targetId: string;
  slug: string;
  title: string;
  description?: string | null;
  goalCents: number;
  currency: "EUR";
  status: SupportCampaignStatus;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportPledgeDoc {
  _id?: ObjectId;
  supportCampaignId: ObjectId;
  amountCents: number;
  status: SupportPledgeStatus;
  paymentReference: string;
  isAnonymous: boolean;
  publicName?: string | null;
  publicRegionCode?: string | null;
  message?: string | null;
  createdByUserId?: string | null;
  bookedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date | null;
  canceledAt?: Date | null;
}
