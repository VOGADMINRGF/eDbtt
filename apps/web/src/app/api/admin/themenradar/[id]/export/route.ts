import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  createThemenradarManualExport,
  THEMENRADAR_EXPORT_FORMATS,
  type ThemenradarExportFormat,
} from "@features/themenradar";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: Context) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const format =
    typeof body.format === "string" &&
    THEMENRADAR_EXPORT_FORMATS.includes(body.format as ThemenradarExportFormat)
      ? (body.format as ThemenradarExportFormat)
      : null;
  if (!format) {
    return NextResponse.json({ ok: false, error: "invalid_export_format" }, { status: 400 });
  }

  try {
    const draft = await createThemenradarManualExport(
      id,
      format,
      {
        userId: String((gate as any)?._id ?? ""),
        email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
      },
    );
    return NextResponse.json({
      ok: true,
      draft,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "themenradar_export_failed";
    const status =
      message === "themenradar_item_not_found"
        ? 404
        : message === "themenradar_export_requires_review_ready" ||
            message === "themenradar_export_requires_share_ready"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
