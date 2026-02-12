import type { ObjectId } from "@core/db/triMongo";

export type CampaignStatus = "draft" | "active" | "paused" | "ended";

export interface CampaignDoc {
  _id?: ObjectId;
  title: string;
  description?: string | null;
  regionCode?: string | null;
  topicKey?: string | null;
  status: CampaignStatus;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignSessionDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  status: "planned" | "live" | "ended";
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignParticipantDoc {
  _id?: ObjectId;
  campaignId: ObjectId;
  userId?: string | null;
  anonHash?: string | null;
  joinedAt: Date;
  source?: string | null;
}
