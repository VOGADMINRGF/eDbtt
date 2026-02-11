export type CommunityRoomStatus = "open" | "archived";

export interface CommunityRoom {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  status?: CommunityRoomStatus;
  tags?: string[];
  createdBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CommunityMessage {
  id?: string;
  roomId: string;
  authorId?: string | null;
  authorIdMasked?: string | null;
  body: string;
  locale?: string | null;
  createdAt?: Date | string;
}
