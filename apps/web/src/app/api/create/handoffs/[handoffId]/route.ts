import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  getPersistedCreateHandoffRecord,
  toCreateHandoffDraft,
} from "@/features/create/persistedHandoffReviewQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ handoffId: string }> },
) {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;
  if (!user || !user.sessionValid || !userId) return unauthorized();

  const { handoffId } = await context.params;
  const record = await getPersistedCreateHandoffRecord(handoffId);
  if (!record) {
    return NextResponse.json({ ok: false, error: "create_handoff_not_found" }, { status: 404 });
  }

  const isOwner = record.createdByUserId === userId;
  if (!isOwner && !userIsAdminDashboard(user)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    draft: toCreateHandoffDraft(record),
    context: {
      regionId: record.regionId,
      organizationId: record.organizationId,
      dossierId: record.dossierId,
      anlassraumId: record.anlassraumId,
    },
  });
}
