import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  createMediaProject,
  listMediaProjectOptions,
  listMediaProjectTopics,
  listMediaProjects,
  type MediaProjectStatus,
} from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TopicSchema = z.object({
  title: z.string().min(1),
  options: z.array(z.string().min(1)).min(5),
});

const CreateSchema = z.object({
  title: z.string().min(3),
  summary: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  topics: z.array(TopicSchema).min(5).max(10),
});

function normalizePayload(input: any) {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const summary =
    typeof input?.summary === "string" ? input.summary.trim() : input?.summary ?? null;
  const status = input?.status as MediaProjectStatus | undefined;

  const topics = Array.isArray(input?.topics)
    ? input.topics
        .map((topic: any) => {
          const topicTitle = typeof topic?.title === "string" ? topic.title.trim() : "";
          const rawOptions = Array.isArray(topic?.options)
            ? topic.options.map((opt: any) => String(opt ?? "").trim()).filter(Boolean)
            : [];
          const seen = new Set<string>();
          const options = rawOptions.filter((opt: string) => {
            const key = opt.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          return { title: topicTitle, options };
        })
        .filter((topic: any) => topic.title)
    : [];

  return { title, summary, status, topics };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const projects = await listMediaProjects();
  const proposed = await listMediaProjectOptions({ status: "proposed" });

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const topicMap = new Map<string, { id: string; title: string; projectId: string }>();

  await Promise.all(
    projects.map(async (project) => {
      const topics = await listMediaProjectTopics(project.id);
      topics.forEach((topic) => {
        topicMap.set(topic.id, { id: topic.id, title: topic.title, projectId: topic.projectId });
      });
    }),
  );

  const proposedOptions = proposed.map((option) => {
    const project = projectMap.get(option.projectId);
    const topic = topicMap.get(option.topicId);
    return {
      optionId: option.id,
      label: option.label,
      projectId: option.projectId,
      projectTitle: project?.title ?? "Unbekannt",
      topicId: option.topicId,
      topicTitle: topic?.title ?? "Unbekannt",
      createdAt: option.createdAt,
    };
  });

  return NextResponse.json({ ok: true, projects, proposedOptions });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const raw = await req.json().catch(() => ({}));
  const normalized = normalizePayload(raw);
  const parsed = CreateSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createMediaProject(parsed.data);
  return NextResponse.json({ ok: true, ...created });
}
