import { NextResponse, type NextRequest } from "next/server";
import { listCommunityRooms } from "@core/community";
import { logger } from "@/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const statusRaw = req.nextUrl.searchParams.get("status") || "open";
  const search = req.nextUrl.searchParams.get("q") || undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);
  const status = statusRaw === "all" ? undefined : (statusRaw as any);

  try {
    const rooms = await listCommunityRooms({ status, search, limit });
    return NextResponse.json({ ok: true, items: rooms });
  } catch (err: any) {
    logger.error({ msg: "community.rooms.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
