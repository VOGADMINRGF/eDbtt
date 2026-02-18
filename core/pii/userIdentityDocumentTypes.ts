import type { ObjectId } from "mongodb";

export type IdentityDocumentType = "id_card" | "passport";

export type UserIdentityDocumentDoc = {
  _id: ObjectId;
  userId: ObjectId;
  documentType: IdentityDocumentType;
  frontImage: string;
  backImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
