import { NextRequest, NextResponse } from "next/server";
import {
  getMediaProjectById,
  listMediaProjectOptions,
  listMediaProjectTopics,
} from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await getMediaProjectById(projectId);
  if (!project) {
    return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }

  const [topics, options] = await Promise.all([
    listMediaProjectTopics(project.id),
    listMediaProjectOptions({ projectId: project.id, status: "approved" }),
  ]);

  const optionsByTopic = new Map<string, typeof options>();
  options.forEach((option) => {
    const list = optionsByTopic.get(option.topicId) ?? [];
    list.push(option);
    optionsByTopic.set(option.topicId, list);
  });

  const topicsWithOptions = topics.map((topic) => {
    const list = optionsByTopic.get(topic.id) ?? [];
    list.sort((a, b) => b.votes - a.votes);
    return { ...topic, options: list };
  });

  return NextResponse.json({
    ok: true,
    project,
    topics: topicsWithOptions,
  });
}
