import { coreCol, ObjectId } from "@core/db/triMongo";
import { ACCESS_TIERS, type AccessTier } from "@/config/accessTiers";
import { XP_EVENTS, ENGAGEMENT_LEVEL_THRESHOLDS, type EngagementLevel } from "@/config/engagement";
import {
  MAX_STORED_CONTRIBUTION_CREDITS,
  SWIPES_PER_CONTRIBUTION_CREDIT,
} from "@/config/credits";
import {
  FEATURE_DEFINITIONS,
  FEATURE_MATRIX_DEFAULTS,
  type FeatureDefinition,
  type FeatureKey,
  type FeatureSet,
  type FeatureValue,
} from "@/config/featureMatrix";

export const FEATURE_OVERRIDE_COLLECTION = "feature_overrides" as const;
export const FEATURE_CONTROL_SETTINGS_COLLECTION = "feature_control_settings" as const;

export type FeatureOverrideDoc = {
  _id?: ObjectId;
  featureKey: FeatureKey;
  accessTier: AccessTier;
  valueJson: FeatureValue;
  createdAt: Date;
  updatedAt: Date;
  updatedById: string;
};

type OverrideMap = Partial<Record<FeatureKey, Partial<Record<AccessTier, FeatureValue>>>>;

export type FeatureControlSettingsDoc = {
  _id: "global";
  xpEvents?: Record<string, number>;
  engagementThresholds?: Array<{ level: EngagementLevel; minXp: number }>;
  credits?: {
    swipesPerContributionCredit: number;
    maxStoredContributionCredits: number;
  };
  updatedAt?: Date;
  updatedById?: string;
};

const FEATURE_DEFINITION_BY_KEY: Record<FeatureKey, FeatureDefinition> = Object.fromEntries(
  FEATURE_DEFINITIONS.map((entry) => [entry.key, entry]),
) as Record<FeatureKey, FeatureDefinition>;

export function validateFeatureValue(featureKey: FeatureKey, rawValue: unknown): {
  ok: true;
  value: FeatureValue;
} | {
  ok: false;
  error: string;
} {
  const definition = FEATURE_DEFINITION_BY_KEY[featureKey];
  if (!definition) {
    return { ok: false, error: "unknown_feature" };
  }

  if (definition.valueType === "boolean") {
    if (typeof rawValue !== "boolean") return { ok: false, error: "boolean_required" };
    return { ok: true, value: rawValue };
  }

  if (definition.valueType === "number") {
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      return { ok: false, error: "number_required" };
    }
    return { ok: true, value: Math.max(0, Math.floor(rawValue)) };
  }

  if (definition.valueType === "enum") {
    if (typeof rawValue !== "string") return { ok: false, error: "enum_string_required" };
    if (!definition.enumValues?.includes(rawValue)) {
      return { ok: false, error: "enum_value_invalid" };
    }
    return { ok: true, value: rawValue as FeatureValue };
  }

  return { ok: false, error: "unsupported_type" };
}

export async function listFeatureOverrides(): Promise<FeatureOverrideDoc[]> {
  const col = await coreCol<FeatureOverrideDoc>(FEATURE_OVERRIDE_COLLECTION);
  const docs = await col.find({}).toArray();
  return docs;
}

export function foldOverrides(docs: FeatureOverrideDoc[]): OverrideMap {
  return docs.reduce<OverrideMap>((acc, doc) => {
    if (!acc[doc.featureKey]) acc[doc.featureKey] = {};
    acc[doc.featureKey]![doc.accessTier] = doc.valueJson;
    return acc;
  }, {});
}

export function buildEffectiveFeatureMatrix(overridesMap: OverrideMap): Record<AccessTier, FeatureSet> {
  const matrix = structuredClone(FEATURE_MATRIX_DEFAULTS) as Record<AccessTier, FeatureSet>;

  for (const definition of FEATURE_DEFINITIONS) {
    for (const tier of ACCESS_TIERS) {
      const override = overridesMap[definition.key]?.[tier];
      if (override === undefined) continue;
      (matrix[tier] as any)[definition.key] = override;
    }
  }

  return matrix;
}

export async function getFeaturesWithOverrides() {
  const docs = await listFeatureOverrides();
  const overrides = foldOverrides(docs);
  const effectiveMatrix = buildEffectiveFeatureMatrix(overrides);

  const features = FEATURE_DEFINITIONS.map((definition) => {
    const defaults: Partial<Record<AccessTier, FeatureValue>> = {};
    const overrideValues: Partial<Record<AccessTier, FeatureValue | null>> = {};
    const effective: Partial<Record<AccessTier, FeatureValue>> = {};

    for (const tier of ACCESS_TIERS) {
      defaults[tier] = (FEATURE_MATRIX_DEFAULTS[tier] as any)[definition.key];
      overrideValues[tier] = overrides[definition.key]?.[tier] ?? null;
      effective[tier] = (effectiveMatrix[tier] as any)[definition.key];
    }

    return {
      ...definition,
      defaults,
      overrides: overrideValues,
      effective,
    };
  });

  return {
    features,
    docs,
    effectiveMatrix,
  };
}

export async function getFeatureControlSettings() {
  const col = await coreCol<FeatureControlSettingsDoc>(FEATURE_CONTROL_SETTINGS_COLLECTION);
  const doc = await col.findOne({ _id: "global" });

  return {
    xpEvents: doc?.xpEvents ?? XP_EVENTS,
    engagementThresholds: doc?.engagementThresholds ?? ENGAGEMENT_LEVEL_THRESHOLDS,
    credits: doc?.credits ?? {
      swipesPerContributionCredit: SWIPES_PER_CONTRIBUTION_CREDIT,
      maxStoredContributionCredits: MAX_STORED_CONTRIBUTION_CREDITS,
    },
  };
}

export async function upsertFeatureControlSettings(input: {
  updatedById: string;
  xpEvents?: Record<string, number>;
  engagementThresholds?: Array<{ level: EngagementLevel; minXp: number }>;
  credits?: {
    swipesPerContributionCredit: number;
    maxStoredContributionCredits: number;
  };
}) {
  const col = await coreCol<FeatureControlSettingsDoc>(FEATURE_CONTROL_SETTINGS_COLLECTION);
  const now = new Date();

  await col.updateOne(
    { _id: "global" },
    {
      $set: {
        ...(input.xpEvents ? { xpEvents: input.xpEvents } : {}),
        ...(input.engagementThresholds ? { engagementThresholds: input.engagementThresholds } : {}),
        ...(input.credits ? { credits: input.credits } : {}),
        updatedAt: now,
        updatedById: input.updatedById,
      },
      $setOnInsert: {
        _id: "global",
      },
    },
    { upsert: true },
  );
}

export async function upsertFeatureOverrides(input: {
  featureKey: FeatureKey;
  updatedById: string;
  values: Partial<Record<AccessTier, FeatureValue>>;
}) {
  const col = await coreCol<FeatureOverrideDoc>(FEATURE_OVERRIDE_COLLECTION);
  const now = new Date();

  for (const tier of ACCESS_TIERS) {
    const value = input.values[tier];
    if (value === undefined) continue;

    await col.updateOne(
      {
        featureKey: input.featureKey,
        accessTier: tier,
      },
      {
        $set: {
          valueJson: value,
          updatedAt: now,
          updatedById: input.updatedById,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }
}
