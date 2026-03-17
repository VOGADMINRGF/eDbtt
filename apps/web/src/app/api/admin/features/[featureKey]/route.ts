import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { ACCESS_TIERS, normalizeAccessTier, type AccessTier } from "@/config/accessTiers";
import { FEATURE_DEFINITIONS, type FeatureKey, type FeatureValue } from "@/config/featureMatrix";
import {
  getFeaturesWithOverrides,
  upsertFeatureOverrides,
  validateFeatureValue,
} from "@/lib/server/access/featureOverrides";

export const runtime = "nodejs";

const updateSchema = z.object({
  values: z.record(z.string(), z.unknown()),
});

function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_DEFINITIONS.some((entry) => entry.key === value);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ featureKey: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const accessTier = normalizeAccessTier(gate.accessTier ?? gate.b2cPlanId ?? null);
  if (accessTier !== "staff") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const params = await ctx.params;
  const featureKeyRaw = params.featureKey;
  if (!isFeatureKey(featureKeyRaw)) {
    return NextResponse.json({ ok: false, error: "unknown_feature" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const values: Partial<Record<AccessTier, FeatureValue>> = {};

  for (const tier of ACCESS_TIERS) {
    const rawValue = parsed.data.values[tier];
    if (rawValue === undefined) continue;

    const validation = validateFeatureValue(featureKeyRaw, rawValue);
    if (validation.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_value",
          message: validation.error,
          tier,
        },
        { status: 400 },
      );
    }

    values[tier] = validation.value;
  }

  if (Object.keys(values).length === 0) {
    return NextResponse.json({ ok: false, error: "no_values" }, { status: 400 });
  }

  await upsertFeatureOverrides({
    featureKey: featureKeyRaw,
    updatedById: String(gate._id),
    values,
  });

  const payload = await getFeaturesWithOverrides();
  return NextResponse.json({
    ok: true,
    feature: payload.features.find((entry) => entry.key === featureKeyRaw) ?? null,
  });
}
