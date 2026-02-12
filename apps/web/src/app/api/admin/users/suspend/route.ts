import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { getCol, coreCol } from "@core/db/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    id: z.string().min(1),
    suspend: z.boolean().optional().default(true),
    reason: z.string().max(240).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const bodyRaw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const userId = parsed.data.id;
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }

  const now = new Date();
  const suspend = parsed.data.suspend ?? true;
  const reason = parsed.data.reason?.trim() || (suspend ? "admin_suspend" : "admin_unsuspend");

  const Users = await getCol("users");
  const update: Record<string, unknown> = {
    suspended: suspend,
    suspendedAt: suspend ? now : null,
    suspendedReason: suspend ? reason : null,
    updatedAt: now,
  };

  await Users.updateOne({ _id: new ObjectId(userId) }, { $set: update });

  // Lightweight audit trail (optional collection).
  const Logs = await coreCol("activity_logs").catch(() => null);
  if (Logs) {
    await Logs.insertOne({
      ts: now,
      type: suspend ? "user.suspended" : "user.unsuspended",
      userId,
      meta: {
        reason,
        byUserId: gate?._id ? String((gate as any)._id) : null,
      },
    });
  }

  return NextResponse.json({ ok: true, suspended: suspend });
}

