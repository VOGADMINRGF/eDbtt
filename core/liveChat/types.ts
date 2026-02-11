export type ModerationState = "pending" | "approved" | "rejected";

export type ChatMessage = {
  id: string;
  sessionId: string;
  authorId?: string | null;
  authorName?: string | null;
  body: string;
  locale?: string | null;
  moderation: ModerationState;
  createdAt: Date;
};

export type LiveSession = {
  id: string;
  title: string;
  status: "draft" | "live" | "ended";
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
};
