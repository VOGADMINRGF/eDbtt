import type { ObjectId } from "mongodb";
import type { IdentityMethod } from "./verificationTypes";

export type IdentityVerificationStatus = "pending" | "succeeded" | "failed" | "expired";
export type IdentityVerificationProvider = "mock" | "otb";
export type IdentityVerificationProofType = "test_adapter" | "otb_signed_callback";

export type IdentityVerificationProviderPayload = {
  adapter: "test";
  verificationId: string;
  verified: true;
  verifiedAt?: string | null;
};

export type IdentityVerificationSessionDoc = {
  _id: ObjectId;
  userId: ObjectId;
  method: IdentityMethod;
  provider: IdentityVerificationProvider;
  status: IdentityVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  failureReason?: string | null;
  providerProofType?: IdentityVerificationProofType | null;
  providerSessionId?: string;
  providerPayload?: IdentityVerificationProviderPayload | null;
};
