import { NextResponse, type NextRequest } from "next/server";
import { listTasks, getContributionsByTaskId } from "@core/research";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const taskId = req.nextUrl.searchParams.get("taskId");
  const statusParam = req.nextUrl.searchParams.get("status");
  const status = statusParam === "all" ? undefined : statusParam || undefined;
  const level = req.nextUrl.searchParams.get("level") || undefined;
  const tag = req.nextUrl.searchParams.get("tag") || undefined;
  const kind = req.nextUrl.searchParams.get("kind") || undefined;
  const sort = req.nextUrl.searchParams.get("sort") || undefined;
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const items = await listTasks({
      status: status as any,
      level: level as any,
      tag: tag || undefined,
      kind: kind as any,
      sort: sort as any,
      limit,
    });
    const contributions = taskId ? await getContributionsByTaskId(taskId) : [];
    return NextResponse.json({ ok: true, items, contributions });
  } catch (err: any) {
    logger.error({ msg: "admin.research.tasks.list_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
