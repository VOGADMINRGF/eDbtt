import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { applyThemenradarTelemetry } from "@features/themenradar/store";
import { type ThemenradarTelemetryEventType } from "@features/themenradar/telemetry";

type Context = {
  params: Promise<{ id: string }>;
};

const ALLOWED_EVENT_TYPES: ThemenradarTelemetryEventType[] = [
  "click",
  "lead",
  "membership",
];

export async function POST(req: NextRequest, context: Context) {
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

  const type =
    typeof body.type === "string" &&
    ALLOWED_EVENT_TYPES.includes(body.type as ThemenradarTelemetryEventType)
      ? (body.type as ThemenradarTelemetryEventType)
      : null;
  if (!type) {
    return NextResponse.json(
      { ok: false, error: "invalid_telemetry_type" },
      { status: 400 },
    );
  }

  try {
    const item = await applyThemenradarTelemetry(id, {
      type,
      amount: Number(body.amount ?? 1),
      campaignKey:
        typeof body.campaignKey === "string" ? body.campaignKey : null,
      at: typeof body.at === "string" ? body.at : undefined,
    }, {
      userId: String((gate as any)?._id ?? ""),
      email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
    });
    return NextResponse.json({
      ok: true,
      item,
      telemetrySnapshot: item.telemetrySnapshot ?? null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "themenradar_telemetry_failed";
    const status = message === "themenradar_item_not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
