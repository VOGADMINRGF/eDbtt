import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, WithId } from "mongodb";
import type { PilotSettings, PilotSettingsChange } from "./types";

type PilotSettingsDoc = Omit<PilotSettings, "id"> & { _id: ObjectId };
type PilotSettingsChangeDoc = Omit<PilotSettingsChange, "id"> & { _id: ObjectId };

const SETTINGS_KEY: PilotSettings["settingsKey"] = "default";

const DEFAULT_SETTINGS: Omit<PilotSettingsDoc, "_id"> = {
  settingsKey: SETTINGS_KEY,
  checkLevel: 1,
  dailyBudget: 0,
  perTopicBudget: 0,
  autoRunEnabled: false,
  maxItemsPerFeed: 12,
  updatedAt: new Date(),
  updatedByUserId: null,
};

async function pilotSettingsCol(): Promise<Collection<PilotSettingsDoc>> {
  return coreCol<PilotSettingsDoc>("pilotSettings");
}

async function pilotSettingsChangesCol(): Promise<Collection<PilotSettingsChangeDoc>> {
  return coreCol<PilotSettingsChangeDoc>("pilotSettingsChanges");
}

function sanitizeSettings(doc: WithId<PilotSettingsDoc>): PilotSettings {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toHexString() };
}

export async function getPilotSettings(): Promise<PilotSettings> {
  const col = await pilotSettingsCol();
  const existing = await col.findOne({ settingsKey: SETTINGS_KEY });
  if (existing) return sanitizeSettings(existing);

  const now = new Date();
  const doc: PilotSettingsDoc = {
    _id: new ObjectId(),
    ...DEFAULT_SETTINGS,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return sanitizeSettings(doc);
}

export async function updatePilotSettings(
  patch: PilotSettingsChange["patch"],
  ctx: { userId: string | null },
): Promise<PilotSettings> {
  const col = await pilotSettingsCol();
  const changesCol = await pilotSettingsChangesCol();
  const now = new Date();

  await col.updateOne(
    { settingsKey: SETTINGS_KEY },
    {
      $set: {
        ...patch,
        updatedAt: now,
        updatedByUserId: ctx.userId,
      },
      $setOnInsert: {
        ...DEFAULT_SETTINGS,
        updatedAt: now,
        updatedByUserId: ctx.userId,
      },
    },
    { upsert: true },
  );

  await changesCol.insertOne({
    _id: new ObjectId(),
    settingsKey: SETTINGS_KEY,
    changedAt: now,
    changedByUserId: ctx.userId,
    patch,
  });

  const updated = await col.findOne({ settingsKey: SETTINGS_KEY });
  if (!updated) return getPilotSettings();
  return sanitizeSettings(updated);
}

