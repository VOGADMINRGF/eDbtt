import type { ObjectId } from "mongodb";

export type EmailVerificationTokenDoc = {
  _id?: ObjectId;
  slotKey?: string | null;
  userId: ObjectId;
  email: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date | null;
  invalidatedAt?: Date | null;
  invalidationReason?: string | null;
  updatedAt?: Date | null;
  deliveryStatus?: "pending" | "delivered" | "failed" | "partial";
  deliveryRetryable?: boolean | null;
  deliveryCategory?: string | null;
  deliveryAttemptedAt?: Date | null;
};
