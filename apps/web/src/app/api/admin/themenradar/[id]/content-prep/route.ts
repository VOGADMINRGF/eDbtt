import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { createContentPrepForThemenradarItem } from "@features/themenradar/store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: Context) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  try {
    const detail = await createContentPrepForThemenradarItem(id, {
      userId: String((gate as any)?._id ?? ""),
      email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
    });
    return NextResponse.json({
      ok: true,
      detail,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "themenradar_content_prep_failed";
    const status =
      message === "themenradar_item_not_found"
        ? 404
        : message === "themenradar_content_prep_locked" ||
            message === "themenradar_content_prep_locked_after_publish"
          ? 409
          : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
