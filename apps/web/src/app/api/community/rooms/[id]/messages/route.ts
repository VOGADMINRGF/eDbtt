import { NextRequest, NextResponse } from "next/server";
import { createCommunityMessage, getCommunityRoomById, getCommunityRoomBySlug, listCommunityMessages } from "@core/community";
import { logger } from "@/utils/logger";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";
import { getCookie } from "@/lib/http/typedCookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readCookie(name: string): Promise<string | undefined> {
  const raw = await getCookie(name);
  return typeof raw === "string" ? raw : (raw as any)?.value;
}

async function resolveRoom(id: string) {
  return (await getCommunityRoomById(id)) ?? (await getCommunityRoomBySlug(id));
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_room" }, { status: 400 });
  }

  const room = await resolveRoom(rawId);
  if (!room?.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);
  const items = await listCommunityMessages(room.id, limit);
  const safeItems = items.map((entry) => ({ ...entry, authorId: null }));
  return NextResponse.json({ ok: true, room, items: safeItems });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const rawId = params?.id?.trim();
  if (!rawId) {
    return NextResponse.json({ ok: false, error: "missing_room" }, { status: 400 });
  }

  const room = await resolveRoom(rawId);
  if (!room?.id || room.status === "archived") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const userId = req.cookies.get("u_id")?.value ?? (await readCookie("u_id"));
  const verified = req.cookies.get("u_verified")?.value ?? (await readCookie("u_verified")) ?? "0";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (verified !== "1") {
    return NextResponse.json({ ok: false, error: "verification_required" }, { status: 403 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const rl = await rateLimitOrThrow(`community:message:${userId}:${ip}`, 20, 60 * 60 * 1000, {
    salt: "community-message",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryInMs: rl.retryIn },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const messageText = typeof body?.message === "string" ? body.message : "";
  if (!messageText.trim()) {
    return NextResponse.json({ ok: false, error: "missing_message" }, { status: 400 });
  }

  try {
    const message = await createCommunityMessage({
      roomId: room.id,
      authorId: userId,
      body: messageText,
      locale: typeof body?.locale === "string" ? body.locale : null,
    });
    if (!message) {
      return NextResponse.json({ ok: false, error: "unable_to_save" }, { status: 500 });
    }
    logger.info({ msg: "community.message.created", roomId: room.id, userId });
    return NextResponse.json({ ok: true, message: { ...message, authorId: null } });
  } catch (err: any) {
    logger.error({ msg: "community.message.failed", err: err?.message, roomId: room.id });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
