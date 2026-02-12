import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { safeRandomId } from "@core/utils/random";
import { projectsCol } from "@features/project/db";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function resolveId(raw: string): ObjectId | null {
  if (!ObjectId.isValid(raw)) return null;
  return new ObjectId(raw);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const projectId = resolveId(String(params?.id ?? ""));
  if (!projectId) return badRequest("invalid_id");

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const topicId = typeof body?.topicId === "string" ? body.topicId.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!topicId || !label) return badRequest("missing_fields");

  const cookieStore = await cookies();
  const user = await getSessionUser(req);
  const anonCookie = cookieStore.get("edb_anon")?.value;
  const anonId =
    anonCookie || (typeof crypto !== "undefined" && "randomUUID" in crypto ? `anon_${crypto.randomUUID()}` : null);

  const now = new Date();
  const option = {
    id: safeRandomId(),
    label,
    status: "proposed" as const,
    createdAt: now,
    createdBy: user?._id?.toString() ?? anonId ?? null,
  };

  const col = await projectsCol();
  const result = await col.updateOne(
    { _id: projectId, "topics.id": topicId },
    { $push: { "topics.$.options": option }, $set: { updatedAt: now, "topics.$.updatedAt": now } },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ ok: false, error: "topic_not_found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, option });
  if (!user?._id && !anonCookie && anonId) {
    res.cookies.set("edb_anon", anonId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const params = await ctx.params;
  const projectId = resolveId(String(params?.id ?? ""));
  if (!projectId) return badRequest("invalid_id");

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const topicId = typeof body?.topicId === "string" ? body.topicId.trim() : "";
  const optionId = typeof body?.optionId === "string" ? body.optionId.trim() : "";
  const status = body?.status === "approved" ? "approved" : "proposed";
  if (!topicId || !optionId) return badRequest("missing_fields");

  const now = new Date();
  const col = await projectsCol();
  const result = await col.updateOne(
    { _id: projectId },
    {
      $set: {
        "topics.$[topic].options.$[opt].status": status,
        "topics.$[topic].updatedAt": now,
        updatedAt: now,
      },
    },
    { arrayFilters: [{ "topic.id": topicId }, { "opt.id": optionId }] },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ ok: false, error: "option_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status });
}
