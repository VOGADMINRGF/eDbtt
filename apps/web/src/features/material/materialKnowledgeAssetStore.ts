import { createHash } from "node:crypto";
import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import type { MaterialStructuredDraftResult } from "@/features/material/materialStructuredDrafts";

const COLLECTION = "edebatte_material_knowledge_assets";

export type MaterialKnowledgeIdentity = {
  title: string;
  publisher: string | null;
  documentType: string;
  publishedAt: string | null;
  versionLabel: string | null;
  sourceRef: string | null;
  sourceFormat: string | null;
  reviewState: "needs_review" | "approved_internal" | "approved_public_reference";
  ingestedAt: string;
};

export type MaterialKnowledgeAsset = {
  id: string;
  materialId: string;
  contentFingerprint: string;
  characterCount: number;
  identity: MaterialKnowledgeIdentity;
  structuredDrafts: MaterialStructuredDraftResult;
  privateOnly: true;
  reviewRequired: true;
  noAutoPublish: true;
  noAutoGraphWrite: true;
  noAutoMerge: true;
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

function normalizeIdentity(
  identity: Partial<MaterialKnowledgeIdentity> | null | undefined,
  fallback: { materialId: string; sourceFormat?: string | null },
): MaterialKnowledgeIdentity {
  const now = new Date().toISOString();
  return {
    title: String(identity?.title ?? fallback.materialId).trim() || fallback.materialId,
    publisher: String(identity?.publisher ?? "").trim() || null,
    documentType: String(identity?.documentType ?? "document").trim() || "document",
    publishedAt: String(identity?.publishedAt ?? "").trim() || null,
    versionLabel: String(identity?.versionLabel ?? "").trim() || null,
    sourceRef: String(identity?.sourceRef ?? fallback.materialId).trim() || null,
    sourceFormat: String(identity?.sourceFormat ?? fallback.sourceFormat ?? "").trim() || null,
    reviewState: identity?.reviewState ?? "needs_review",
    ingestedAt: String(identity?.ingestedAt ?? now).trim() || now,
  };
}

function fromDoc(doc: any, normalizedLength: number): MaterialKnowledgeAsset | null {
  if (!doc || typeof doc.contentFingerprint !== "string" || !doc.structuredDrafts) return null;
  const materialId = String(doc.materialId ?? "");
  return {
    id: String(doc._id ?? assetIdFor(doc.contentFingerprint)),
    materialId,
    contentFingerprint: doc.contentFingerprint,
    characterCount: typeof doc.characterCount === "number" ? doc.characterCount : normalizedLength,
    identity: normalizeIdentity(doc.identity, {
      materialId,
      sourceFormat: typeof doc.identity?.sourceFormat === "string" ? doc.identity.sourceFormat : null,
    }),
    structuredDrafts: clone(doc.structuredDrafts) as MaterialStructuredDraftResult,
    privateOnly: true,
    reviewRequired: true,
    noAutoPublish: true,
    noAutoGraphWrite: true,
    noAutoMerge: true,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
  };
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
  return fromDoc(doc, normalized.length);
}

export async function persistMaterialKnowledgeAsset(input: {
  materialId: string;
  text: string;
  structuredDrafts: MaterialStructuredDraftResult;
  identity?: Partial<MaterialKnowledgeIdentity> | null;
}) {
  if (input.structuredDrafts.status !== "generated") return null;
  const text = String(input.text ?? "").trim();
  const materialId = String(input.materialId ?? "").trim();
  if (!text || !materialId) return null;
  const fingerprint = fingerprintMaterialText(text);
  const now = new Date().toISOString();
  const identity = normalizeIdentity(input.identity, { materialId });
  const record: MaterialKnowledgeAsset = {
    id: assetIdFor(fingerprint),
    materialId,
    contentFingerprint: fingerprint,
    characterCount: text.length,
    identity,
    structuredDrafts: clone(input.structuredDrafts),
    privateOnly: true,
    reviewRequired: true,
    noAutoPublish: true,
    noAutoGraphWrite: true,
    noAutoMerge: true,
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
  await col.createIndex({ contentFingerprint: 1 }, { unique: true }).catch(() => undefined);
  await col.createIndex({ "identity.documentType": 1, "identity.publishedAt": 1 }).catch(() => undefined);
  await col.updateOne(
    { contentFingerprint: fingerprint },
    {
      $set: {
        materialId,
        contentFingerprint: fingerprint,
        characterCount: text.length,
        identity: clone(identity),
        structuredDrafts: clone(input.structuredDrafts),
        privateOnly: true,
        reviewRequired: true,
        noAutoPublish: true,
        noAutoGraphWrite: true,
        noAutoMerge: true,
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
