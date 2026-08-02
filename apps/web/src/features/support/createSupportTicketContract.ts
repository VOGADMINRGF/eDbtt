export type CreateSupportTicketPublicStatus =
  | "open"
  | "investigating"
  | "resolved"
  | "closed";

export type CreateSupportTicketPublic = {
  ticketNumber: string;
  status: CreateSupportTicketPublicStatus;
  safeUserMessage: string;
  viewHref: string;
  notificationLinked: boolean;
};

export type CreateSupportHandoffPublic =
  | {
      status: "created";
      ticket: CreateSupportTicketPublic;
    }
  | {
      status: "failed";
      technicalReference: string;
      safeUserMessage: string;
    };
