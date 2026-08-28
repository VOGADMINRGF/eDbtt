import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";

const COLLECTION = "edebatte_material_full_text";
const memory = new Map<string, string>();

function normalizeText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, 250_000);
}

export async function persistMaterialFullText(input: {
  materialId: string;
  text: string | null | undefined;
}) {
  const materialId = String(input.materialId ?? "").trim();
  const text = normalizeText(input.text);
  if (!materialId || !text) return { stored: false, mode: "none" as const };

  if (shouldUseInMemoryMongoFallback()) {
    memory.set(materialId, text);
    return { stored: true, mode: "in_memory" as const };
  }

  const col = await coreCol<any>(COLLECTION);
  await col.updateOne(
    { _id: materialId },
    {
      $set: {
        materialId,
        text,
        privateOnly: true,
        reviewRequired: true,
        noAutoPublish: true,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return { stored: true, mode: "persistent" as const };
}

export async function getMaterialFullText(materialId: string) {
  const id = String(materialId ?? "").trim();
  if (!id) return null;

  if (shouldUseInMemoryMongoFallback()) {
    return memory.get(id) ?? null;
  }

  const col = await coreCol<any>(COLLECTION);
  const doc = await col.findOne({ _id: id });
  return typeof doc?.text === "string" ? doc.text : null;
}
