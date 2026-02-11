export type CampaignStatus = "draft" | "active" | "completed" | "archived";
export type CampaignKind = "community" | "policy" | "event" | "custom";

export interface Campaign {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  status?: CampaignStatus;
  kind?: CampaignKind;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  goal?: string;
  tags?: string[];
  createdBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CampaignSessionSource = "qr" | "link" | "admin" | "api";

export interface CampaignSession {
  id?: string;
  campaignId: string;
  userId?: string | null;
  source?: CampaignSessionSource;
  regionCode?: string | null;
  joinedAt?: Date | string;
  meta?: Record<string, any>;
}
