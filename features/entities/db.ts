import { coreCol } from "@core/db/triMongo";
import type { EntityDoc } from "./types";

const ENTITY_COLLECTION = "governance_entities";

const ensured = {
  entities: false,
};

async function ensureEntityIndexes() {
  if (ensured.entities) return;
  const col = await coreCol<EntityDoc>(ENTITY_COLLECTION);
  await col.createIndex({ slug: 1 }, { unique: true });
  await col.createIndex({ type: 1, status: 1, updatedAt: -1 });
  await col.createIndex({ regionKey: 1, scope: 1, updatedAt: -1 });
  ensured.entities = true;
}

export async function entityCol() {
  await ensureEntityIndexes();
  return coreCol<EntityDoc>(ENTITY_COLLECTION);
}
