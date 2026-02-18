import { ObjectId, piiCol } from "@core/db/triMongo";
import type { IdentityDocumentType, UserIdentityDocumentDoc } from "@core/pii/userIdentityDocumentTypes";

const COLLECTION = "user_identity_documents";

export async function getUserIdentityDocument(userId: ObjectId) {
  const col = await piiCol<UserIdentityDocumentDoc>(COLLECTION);
  return col.findOne({ userId });
}

export async function upsertUserIdentityDocument(
  userId: ObjectId,
  data: {
    documentType: IdentityDocumentType;
    frontImage: string;
    backImage?: string | null;
  },
) {
  const col = await piiCol<UserIdentityDocumentDoc>(COLLECTION);
  const now = new Date();
  await col.updateOne(
    { userId },
    {
      $set: {
        documentType: data.documentType,
        frontImage: data.frontImage,
        backImage: data.backImage ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        createdAt: now,
      },
    },
    { upsert: true },
  );
  return getUserIdentityDocument(userId);
}

export async function deleteUserIdentityDocument(userId: ObjectId) {
  const col = await piiCol<UserIdentityDocumentDoc>(COLLECTION);
  await col.deleteOne({ userId });
}
