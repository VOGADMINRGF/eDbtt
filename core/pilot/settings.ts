import { getDb } from "@core/db/triMongo";
import { logPilotSettingsReceipt } from "./receipts";

export type PilotSettings = {
  check_level: 0 | 1 | 2;
  daily_budget: number;
  per_topic_budget: number;
  auto_run_enabled: boolean;
  max_items_per_feed: number;
};

export type PilotSettingsMeta = {
  updatedAt?: Date;
  updatedBy?: string | null;
};

const DEFAULTS: PilotSettings = {
  check_level: 1,
  daily_budget: 10,
  per_topic_budget: 3,
  auto_run_enabled: false,
  max_items_per_feed: 12,
};

type SettingsDoc = {
  _id: "global";
  pilot?: Partial<PilotSettings>;
  pilotUpdatedAt?: Date;
  pilotUpdatedBy?: string | null;
};

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function normalizeSettings(input?: Partial<PilotSettings> | null): PilotSettings {
  return {
    check_level: clampInt(input?.check_level, DEFAULTS.check_level, 0, 2) as 0 | 1 | 2,
    daily_budget: clampNumber(input?.daily_budget, DEFAULTS.daily_budget, 0, 10_000),
    per_topic_budget: clampNumber(input?.per_topic_budget, DEFAULTS.per_topic_budget, 0, 10_000),
    auto_run_enabled: clampBool(input?.auto_run_enabled, DEFAULTS.auto_run_enabled),
    max_items_per_feed: clampInt(
      input?.max_items_per_feed,
      DEFAULTS.max_items_per_feed,
      1,
      50,
    ),
  };
}

export async function getPilotSettings(): Promise<{ settings: PilotSettings; meta: PilotSettingsMeta }> {
  const db = await getDb();
  const doc = await db.collection<SettingsDoc>("settings").findOne({ _id: "global" });
  return {
    settings: normalizeSettings(doc?.pilot ?? null),
    meta: {
      updatedAt: doc?.pilotUpdatedAt,
      updatedBy: doc?.pilotUpdatedBy ?? null,
    },
  };
}

export async function updatePilotSettings(
  patch: Partial<PilotSettings>,
  actorId?: string | null,
): Promise<{ settings: PilotSettings; meta: PilotSettingsMeta }> {
  const db = await getDb();
  const col = db.collection<SettingsDoc>("settings");
  const current = await col.findOne({ _id: "global" });
  const merged = normalizeSettings({ ...(current?.pilot ?? {}), ...(patch ?? {}) });
  const now = new Date();

  await col.updateOne(
    { _id: "global" },
    {
      $set: {
        pilot: merged,
        pilotUpdatedAt: now,
        pilotUpdatedBy: actorId ?? null,
      },
    },
    { upsert: true },
  );

  await logPilotSettingsReceipt({
    actorId: actorId ?? null,
    patch,
    settings: merged,
    createdAt: now,
  });

  return {
    settings: merged,
    meta: {
      updatedAt: now,
      updatedBy: actorId ?? null,
    },
  };
}
