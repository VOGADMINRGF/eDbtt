import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  getThemenradarDetail,
  updateThemenradarItem,
} from "@features/themenradar/store";
import type {
  ThemenradarJurisdiction,
  ThemenradarLifecycleStatus,
} from "@features/themenradar/contracts";

type Context = {
  params: Promise<{ id: string }>;
};

const ALLOWED_LIFECYCLE: ThemenradarLifecycleStatus[] = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
];

const ALLOWED_JURISDICTION: ThemenradarJurisdiction[] = [
  "bund",
  "land",
  "kommune",
  "mixed",
];

export async function GET(req: NextRequest, context: Context) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  const detail = await getThemenradarDetail(id);
  if (!detail) {
    return NextResponse.json(
      { ok: false, error: "themenradar_item_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    detail,
  });
}

export async function PATCH(req: NextRequest, context: Context) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  try {
    const lifecycleStatus =
      typeof body.lifecycleStatus === "string" &&
      ALLOWED_LIFECYCLE.includes(body.lifecycleStatus as ThemenradarLifecycleStatus)
        ? (body.lifecycleStatus as ThemenradarLifecycleStatus)
        : undefined;
    const jurisdiction =
      typeof body.jurisdiction === "string" &&
      ALLOWED_JURISDICTION.includes(body.jurisdiction as ThemenradarJurisdiction)
        ? (body.jurisdiction as ThemenradarJurisdiction)
        : undefined;

    const actor = {
      userId: String((gate as any)?._id ?? ""),
      email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
    };

    const item = await updateThemenradarItem(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      rawSignal: typeof body.rawSignal === "string" ? body.rawSignal : undefined,
      jurisdiction,
      heatScore:
        typeof body.heatScore === "number" ? body.heatScore : undefined,
      everydayRelevanceScore:
        typeof body.everydayRelevanceScore === "number"
          ? body.everydayRelevanceScore
          : undefined,
      polarizationScore:
        typeof body.polarizationScore === "number"
          ? body.polarizationScore
          : undefined,
      membershipPotentialScore:
        typeof body.membershipPotentialScore === "number"
          ? body.membershipPotentialScore
          : undefined,
      linkedAnlassraumId:
        typeof body.linkedAnlassraumId === "string" || body.linkedAnlassraumId === null
          ? body.linkedAnlassraumId
          : undefined,
      linkedDossierId:
        typeof body.linkedDossierId === "string" || body.linkedDossierId === null
          ? body.linkedDossierId
          : undefined,
      campaignKey:
        typeof body.campaignKey === "string" || body.campaignKey === null
          ? body.campaignKey
          : undefined,
      lifecycleStatus,
      reviewNote:
        typeof body.reviewNote === "string" || body.reviewNote === null
          ? body.reviewNote
          : undefined,
      publishIntent: body.publishIntent === true,
    }, actor);

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "themenradar_update_failed";
    const status =
      message === "themenradar_item_not_found"
        ? 404
        : message === "invalid_lifecycle_transition" ||
            message === "review_ready_requires_share_ready_action" ||
            message === "publish_requires_review_ready" ||
            message === "publish_requires_explicit_intent"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
