import "server-only";
import { ObjectId, coreCol } from "@core/db/triMongo";
import type { PreorderLeadRecord, PreorderUserUpdate, UserContact } from "../domain/types";

function toObjectId(value: string | null) {
  if (!value) return null;
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

export async function insertPreorderLead(lead: PreorderLeadRecord) {
  const Leads = await coreCol("edebatte_preorders");
  await Leads.insertOne({
    package: lead.packageId,
    planLabel: lead.planLabel,
    type: lead.type,
    email: lead.email,
    plz: lead.plz,
    note: lead.note,
    source: lead.source,
    priceMonthly: lead.priceMonthly,
    status: lead.status,
    userId: toObjectId(lead.userId),
    createdAt: lead.createdAt,
  });
}

export async function findPreorderUserById(userId: string): Promise<UserContact | null> {
  const oid = toObjectId(userId);
  if (!oid) return null;
  const Users = await coreCol("users");
  const user = await Users.findOne(
    { _id: oid },
    { projection: { email: 1, name: 1, displayName: 1, firstName: 1, lastName: 1 } },
  );
  return (user as UserContact) || null;
}

export async function updatePreorderUser(userId: string, update: PreorderUserUpdate) {
  const oid = toObjectId(userId);
  if (!oid) return;
  const Users = await coreCol("users");
  await Users.updateOne(
    { _id: oid },
    {
      $set: {
        "edebatte.package": update.packageId,
        "edebatte.status": update.status,
        "edebatte.updatedAt": update.updatedAt,
        "edebatte.preorderAt": update.preorderAt,
        "edebatte.source": update.source,
      },
    },
  );
}
