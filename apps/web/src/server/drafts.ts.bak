import "server-only";
/* @ts-nocheck */
import { coreCol } from "@core/triMongo";
import { ObjectId } from "mongodb";

export async function createDraft(data:any) {
  const col = await coreCol("drafts");
  const res = await col.insertOne({ ...data, updatedAt: new Date() });
  return { id: res.insertedId.toString(), data };
}

export async function patchDraft(id:string, patch:any) {
  const col = await coreCol("drafts");
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { ...patch, updatedAt: new Date() }});
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return { id, data: doc };
}

export async function getDraft(id:string) {
  const col = await coreCol("drafts");
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? { id: doc._id.toString(), data: doc } : null;
}
