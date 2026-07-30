import { ObjectId, piiCol } from "@core/db/triMongo";

type OrgInviteDeliveryPayload = {
  _id?: ObjectId;
  membershipId: ObjectId;
  inviteToken: string;
  resetToken: string;
  createdAt: Date;
  updatedAt: Date;
};

let indexesEnsured = false;

async function payloadsCol() {
  const col = await piiCol<OrgInviteDeliveryPayload>("org_invite_delivery_payloads");
  if (!indexesEnsured) {
    await col.createIndex({ membershipId: 1 }, { unique: true });
    indexesEnsured = true;
  }
  return col;
}

export async function storeOrgInviteDeliveryPayload(input: {
  membershipId: ObjectId;
  inviteToken: string;
  resetToken: string;
}) {
  const col = await payloadsCol();
  const now = new Date();
  await col.updateOne(
    { membershipId: input.membershipId },
    {
      $setOnInsert: {
        membershipId: input.membershipId,
        inviteToken: input.inviteToken,
        resetToken: input.resetToken,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

export async function getOrgInviteDeliveryPayload(membershipId: ObjectId) {
  const col = await payloadsCol();
  return col.findOne(
    { membershipId },
    { projection: { inviteToken: 1, resetToken: 1 } },
  );
}
