import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { normalizeAccessTier, ACCESS_TIERS } from "@/config/accessTiers";
import { ENGAGEMENT_LEVEL_THRESHOLDS, XP_EVENTS, normalizeEngagementLevel } from "@/config/engagement";
import {
  MAX_STORED_CONTRIBUTION_CREDITS,
  SWIPES_PER_CONTRIBUTION_CREDIT,
} from "@/config/credits";
import {
  getFeatureControlSettings,
  getFeaturesWithOverrides,
  upsertFeatureControlSettings,
} from "@/lib/server/access/featureOverrides";

export const runtime = "nodejs";

const settingsSchema = z.object({
  engagement: z
    .object({
      xpEvents: z.record(z.string(), z.number().int().nonnegative()).optional(),
      thresholds: z
        .array(
          z.object({
            level: z.string().min(1),
            minXp: z.number().int().nonnegative(),
          }),
        )
        .optional(),
    })
    .optional(),
  credits: z
    .object({
      swipesPerContributionCredit: z.number().int().positive(),
      maxStoredContributionCredits: z.number().int().positive(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const accessTier = normalizeAccessTier(gate.accessTier ?? gate.b2cPlanId ?? null);
  if (accessTier !== "staff") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const [payload, settings] = await Promise.all([
    getFeaturesWithOverrides(),
    getFeatureControlSettings(),
  ]);

  return NextResponse.json({
    ok: true,
    accessTiers: ACCESS_TIERS,
    features: payload.features,
    effectiveMatrix: payload.effectiveMatrix,
    engagement: {
      xpEvents: settings.xpEvents ?? XP_EVENTS,
      thresholds: settings.engagementThresholds ?? ENGAGEMENT_LEVEL_THRESHOLDS,
    },
    credits:
      settings.credits ??
      {
        swipesPerContributionCredit: SWIPES_PER_CONTRIBUTION_CREDIT,
        maxStoredContributionCredits: MAX_STORED_CONTRIBUTION_CREDITS,
      },
  });
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const accessTier = normalizeAccessTier(gate.accessTier ?? gate.b2cPlanId ?? null);
  if (accessTier !== "staff") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const normalizedThresholds = parsed.data.engagement?.thresholds?.map((entry) => ({
    level: normalizeEngagementLevel(entry.level),
    minXp: Math.max(0, Math.floor(entry.minXp)),
  }));

  await upsertFeatureControlSettings({
    updatedById: String(gate._id),
    xpEvents: parsed.data.engagement?.xpEvents,
    engagementThresholds: normalizedThresholds,
    credits: parsed.data.credits,
  });

  const settings = await getFeatureControlSettings();
  return NextResponse.json({
    ok: true,
    engagement: {
      xpEvents: settings.xpEvents,
      thresholds: settings.engagementThresholds,
    },
    credits: settings.credits,
  });
}
