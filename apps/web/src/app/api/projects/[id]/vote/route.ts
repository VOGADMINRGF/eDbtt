import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { projectVotesCol, projectsCol } from "@features/project/db";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

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
  const optionId = typeof body?.optionId === "string" ? body.optionId.trim() : "";
  if (!topicId || !optionId) return badRequest("missing_fields");

  const projects = await projectsCol();
  const project = await projects.findOne({ _id: projectId });
  if (!project) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const topic = project.topics.find((entry) => entry.id === topicId);
  if (!topic) return badRequest("topic_not_found");
  const option = topic.options.find((opt) => opt.id === optionId);
  if (!option || option.status !== "approved") return badRequest("option_not_allowed");

  const cookieStore = await cookies();
  const user = await getSessionUser(req);
  const anonCookie = cookieStore.get("edb_anon")?.value;
  const anonId =
    anonCookie || (typeof crypto !== "undefined" && "randomUUID" in crypto ? `anon_${crypto.randomUUID()}` : null);
  const voterKey = user?._id ? `user:${user._id.toString()}` : `anon:${anonId ?? "anon"}`;

  const votesCol = await projectVotesCol();
  const now = new Date();
  try {
    await votesCol.insertOne({ projectId, topicId, optionId, voterKey, createdAt: now });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ ok: true, alreadyVoted: true });
    }
    throw err;
  }

  const res = NextResponse.json({ ok: true });
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
