import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { projectVotesCol, projectsCol } from "@features/project/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function resolveId(raw: string): ObjectId | null {
  if (!ObjectId.isValid(raw)) return null;
  return new ObjectId(raw);
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const projectId = resolveId(String(params?.id ?? ""));
  if (!projectId) return badRequest("invalid_id");

  const col = await projectsCol();
  const project = await col.findOne({ _id: projectId });
  if (!project) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const votesCol = await projectVotesCol();
  const voteRows = await votesCol
    .aggregate([
      { $match: { projectId } },
      { $group: { _id: { topicId: "$topicId", optionId: "$optionId" }, count: { $sum: 1 } } },
    ])
    .toArray();

  const counts = new Map<string, number>();
  for (const row of voteRows) {
    const key = `${row._id.topicId}:${row._id.optionId}`;
    counts.set(key, row.count ?? 0);
  }

  const topics = project.topics.map((topic) => {
    const options = topic.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      status: opt.status,
      votes: counts.get(`${topic.id}:${opt.id}`) ?? 0,
    }));
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes ?? 0), 0);
    return {
      id: topic.id,
      title: topic.title,
      description: topic.description ?? null,
      options,
      totalVotes,
    };
  });

  return NextResponse.json({
    ok: true,
    project: {
      id: project._id?.toString() ?? "",
      title: project.title,
      description: project.description ?? null,
      regionCode: project.regionCode ?? null,
      status: project.status,
      topics,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
  });
}
