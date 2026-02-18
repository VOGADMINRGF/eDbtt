import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { coreCol } from "@core/db/triMongo";
import type { IdentityEventDoc, IdentityEventName } from "@core/telemetry/identityEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRangeDays(value: string | null): number {
  switch (value) {
    case "7":
    case "week":
      return 7;
    case "90":
    case "quarter":
      return 90;
    case "30":
    case "month":
    default:
      return 30;
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { searchParams } = new URL(req.url);
  const event = searchParams.get("event") as IdentityEventName | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("pageSize") ?? 25)));
  const rangeDays = parseRangeDays(searchParams.get("range"));

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - (rangeDays - 1));

  const filter: Record<string, unknown> = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  if (event) filter.event = event;

  const col = await coreCol<IdentityEventDoc>("identity_events");
  const total = await col.countDocuments(filter);
  const docs = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    total,
    rangeDays,
    items: docs.map((doc) => ({
      id: String(doc._id ?? ""),
      event: doc.event,
      userId: doc.userId ?? null,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
      meta: doc.meta ?? null,
    })),
  });
}
