import { NextResponse, type NextRequest } from "next/server";
import { listTasks } from "@core/research";
import { logger } from "@/utils/logger";
import { getCookie } from "@/lib/http/typedCookies";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

async function readCookie(name: string): Promise<string | undefined> {
  const raw = await getCookie(name);
  return typeof raw === "string" ? raw : (raw as any)?.value;
}

export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get("level") || undefined;
  const status = req.nextUrl.searchParams.get("status") || "open";
  const tag = req.nextUrl.searchParams.get("tag") || undefined;
  const sort = (req.nextUrl.searchParams.get("sort") || "recent") as
    | "recent"
    | "due";
  const search = req.nextUrl.searchParams.get("q") || undefined;
  const userId = req.cookies.get("u_id")?.value ?? (await readCookie("u_id"));
  const verified = req.cookies.get("u_verified")?.value ?? (await readCookie("u_verified")) ?? "0";

  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (verified !== "1") {
    return NextResponse.json({ ok: false, error: "verification_required" }, { status: 403 });
  }

  const rl = await rateLimitOrThrow(`research:list:${userId}`, 60, 60 * 60 * 1000, {
    salt: "research",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryInMs: rl.retryIn },
      { status: 429 },
    );
  }

  try {
    const items = await listTasks({
      status: status as any,
      level: level as any,
      tag,
      sort,
      search,
    });
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    logger.error({ msg: "research.tasks.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
