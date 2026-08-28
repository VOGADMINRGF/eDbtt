import { createHash } from "node:crypto";
import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import type { MaterialStructuredDraftResult } from "@/features/material/materialStructuredDrafts";

const COLLECTION = "edebatte_material_knowledge_assets";

export type MaterialKnowledgeAsset = {
  id: string;
  materialId: string;
  contentFingerprint: string;
  characterCount: number;
  structuredDrafts: MaterialStructuredDraftResult;
  privateOnly: true;
  reviewRequired: true;
  noAutoPublish: true;
  noAutoGraphWrite: true;
  createdAt: string;
  updatedAt: string;
};

const memory = new Map<string, MaterialKnowledgeAsset>();

export function fingerprintMaterialText(text: string) {
  return createHash("sha256").update(String(text ?? "").trim(), "utf8").digest("hex");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assetIdFor(fingerprint: string) {
  return `material-knowledge:${fingerprint}`;
}

export async function getReusableMaterialKnowledgeAsset(text: string): Promise<MaterialKnowledgeAsset | null> {
  const normalized = String(text ?? "").trim();
  if (!normalized) return null;
  const fingerprint = fingerprintMaterialText(normalized);

  if (shouldUseInMemoryMongoFallback()) {
    return clone(memory.get(fingerprint) ?? null);
  }

  const col = await coreCol<any>(COLLECTION);
  const doc = await col.findOne({ contentFingerprint: fingerprint });
  if (!doc || typeof doc.contentFingerprint !== "string" || !doc.structuredDrafts) return null;
  return {
    id: String(doc._id ?? assetIdFor(fingerprint)),
    materialId: String(doc.materialId ?? ""),
    contentFingerprint: doc.contentFingerprint,
    characterCount: typeof doc.characterCount === "number" ? doc.characterCount : normalized.length,
    structuredDrafts: clone(doc.structuredDrafts) as MaterialStructuredDraftResult,
    privateOnly: true,
    reviewRequired: true,
    noAutoPublish: true,
    noAutoGraphWrite: true,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
  };
}

export async function persistMaterialKnowledgeAsset(input: {
  materialId: string;
  text: string;
  structuredDrafts: MaterialStructuredDraftResult;
}) {
  if (input.structuredDrafts.status !== "generated") return null;
  const text = String(input.text ?? "").trim();
  const materialId = String(input.materialId ?? "").trim();
  if (!text || !materialId) return null;
  const fingerprint = fingerprintMaterialText(text);
  const now = new Date().toISOString();
  const record: MaterialKnowledgeAsset = {
    id: assetIdFor(fingerprint),
    materialId,
    contentFingerprint: fingerprint,
    characterCount: text.length,
    structuredDrafts: clone(input.structuredDrafts),
    privateOnly: true,
    reviewRequired: true,
    noAutoPublish: true,
    noAutoGraphWrite: true,
    createdAt: now,
    updatedAt: now,
  };

  if (shouldUseInMemoryMongoFallback()) {
    const existing = memory.get(fingerprint);
    if (existing) record.createdAt = existing.createdAt;
    memory.set(fingerprint, clone(record));
    return clone(record);
  }

  const col = await coreCol<any>(COLLECTION);
  await col.updateOne(
    { contentFingerprint: fingerprint },
    {
      $set: {
        materialId,
        contentFingerprint: fingerprint,
        characterCount: text.length,
        structuredDrafts: clone(input.structuredDrafts),
        privateOnly: true,
        reviewRequired: true,
        noAutoPublish: true,
        noAutoGraphWrite: true,
        updatedAt: new Date(now),
      },
      $setOnInsert: {
        _id: assetIdFor(fingerprint),
        createdAt: new Date(now),
      },
    },
    { upsert: true },
  );
  return record;
}
