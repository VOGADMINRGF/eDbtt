import { dossierRevisionsCol, dossiersCol } from "./db";
import { makeDossierEntityId } from "./ids";
import type { DossierActorRole, RevisionAction } from "./schemas";
import { computeRevisionHash, REVISION_HASH_ALGO } from "./revisionHash";

const DISABLE_HASH_CHAIN = process.env.VOG_DISABLE_REVISION_HASH_CHAIN === "1";

type RevisionInput = {
  dossierId: string;
  entityType: string;
  entityId: string;
  action: RevisionAction;
  diffSummary: string;
  byRole: DossierActorRole;
  byUserId?: string;
};

export async function logDossierRevision(input: RevisionInput) {
  const col = await dossierRevisionsCol();
  const dossierCol = await dossiersCol();
  const now = new Date();
  if (DISABLE_HASH_CHAIN) {
    const doc = {
      revId: makeDossierEntityId("rev"),
      dossierId: input.dossierId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diffSummary: input.diffSummary,
      byRole: input.byRole,
      byUserId: input.byUserId,
      timestamp: now,
    };
    await col.insertOne(doc as any);
    return doc;
  }
  let prevHash: string | undefined;
  let hash = "";
  let attempts = 0;
  let updatedChain = false;

  while (attempts < 5) {
    attempts += 1;
    const dossier = await dossierCol.findOne(
      { dossierId: input.dossierId },
      { projection: { lastRevisionHash: 1 } },
    );
    prevHash = dossier?.lastRevisionHash ?? undefined;
    if (!prevHash) {
      const last = await col
        .find({ dossierId: input.dossierId })
        .sort({ timestamp: -1, _id: -1 })
        .limit(1)
        .next();
      prevHash = last?.hash ?? undefined;
    }
    hash = computeRevisionHash({
      prevHash,
      dossierId: input.dossierId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diffSummary: input.diffSummary,
      byRole: input.byRole,
      byUserId: input.byUserId,
      timestamp: now,
    });

    if (!dossier) break;

    const filter = prevHash
      ? { dossierId: input.dossierId, lastRevisionHash: prevHash }
      : { dossierId: input.dossierId, lastRevisionHash: { $exists: false } };
    const res = await dossierCol.updateOne(
      filter,
      { $set: { lastRevisionHash: hash, lastRevisionAt: now }, $inc: { revisionSeq: 1 } },
    );
    if (res.modifiedCount === 1) {
      updatedChain = true;
      break;
    }
  }

  if (!updatedChain) {
    console.warn("[dossier] revision hash chain update failed", {
      dossierId: input.dossierId,
      prevHash,
      attempts,
    });
    prevHash = undefined;
    hash = "";
  }
  const doc = {
    revId: makeDossierEntityId("rev"),
    dossierId: input.dossierId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    diffSummary: input.diffSummary,
    byRole: input.byRole,
    byUserId: input.byUserId,
    timestamp: now,
    ...(updatedChain && prevHash ? { prevHash } : {}),
    ...(updatedChain && hash ? { hash } : {}),
    ...(updatedChain && hash ? { hashAlgo: REVISION_HASH_ALGO } : {}),
  };

  await col.insertOne(doc as any);
  return doc;
}
