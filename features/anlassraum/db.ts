import { coreCol } from "@core/db/triMongo";
import type {
  AnlassraumDoc,
  AnlassraumSourceLinkDoc,
  AnlassraumStructureDoc,
  OutputSeedDoc,
} from "./types";

const ANLASSRAUM_COLLECTION = "anlassraum";
const ANLASSRAUM_SOURCES_COLLECTION = "anlassraum_source_links";
const ANLASSRAUM_STRUCTURE_COLLECTION = "anlassraum_structure";
const OUTPUT_SEED_COLLECTION = "output_seed";

const ensured = {
  anlassraum: false,
  sources: false,
  structures: false,
  outputs: false,
};

async function ensureAnlassraumIndexes() {
  if (ensured.anlassraum) return;
  const col = await coreCol<AnlassraumDoc>(ANLASSRAUM_COLLECTION);
  await col.createIndex({ slug: 1 }, { unique: true });
  await col.createIndex({ status: 1, sourceMode: 1, updatedAt: -1 });
  await col.createIndex({ clusterKey: 1, "regionCode.countryCode": 1 }, { sparse: true });
  ensured.anlassraum = true;
}

async function ensureSourceIndexes() {
  if (ensured.sources) return;
  const col = await coreCol<AnlassraumSourceLinkDoc>(ANLASSRAUM_SOURCES_COLLECTION);
  await col.createIndex({ anlassraumId: 1, role: 1 });
  await col.createIndex({ statementCandidateId: 1 }, { unique: true, sparse: true });
  ensured.sources = true;
}

async function ensureStructureIndexes() {
  if (ensured.structures) return;
  const col = await coreCol<AnlassraumStructureDoc>(ANLASSRAUM_STRUCTURE_COLLECTION);
  await col.createIndex({ anlassraumId: 1 }, { unique: true });
  ensured.structures = true;
}

async function ensureOutputIndexes() {
  if (ensured.outputs) return;
  const col = await coreCol<OutputSeedDoc>(OUTPUT_SEED_COLLECTION);
  await col.createIndex({ anlassraumId: 1, outputType: 1 }, { unique: true });
  await col.createIndex({ status: 1, outputType: 1, updatedAt: -1 });
  ensured.outputs = true;
}

export async function anlassraumCol() {
  await ensureAnlassraumIndexes();
  return coreCol<AnlassraumDoc>(ANLASSRAUM_COLLECTION);
}

export async function anlassraumSourceLinksCol() {
  await ensureSourceIndexes();
  return coreCol<AnlassraumSourceLinkDoc>(ANLASSRAUM_SOURCES_COLLECTION);
}

export async function anlassraumStructureCol() {
  await ensureStructureIndexes();
  return coreCol<AnlassraumStructureDoc>(ANLASSRAUM_STRUCTURE_COLLECTION);
}

export async function outputSeedCol() {
  await ensureOutputIndexes();
  return coreCol<OutputSeedDoc>(OUTPUT_SEED_COLLECTION);
}
