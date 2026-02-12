import { NextRequest, NextResponse } from "next/server";
import { safeRandomId } from "@core/utils/random";
import { projectsCol } from "@features/project/db";
import type { ProjectDoc, ProjectOption, ProjectTopic, ProjectStatus } from "@features/project/types";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_TOPICS = 3;
const MAX_TOPICS = 5;
const MIN_OPTIONS = 5;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function normalizeTopic(topic: any): ProjectTopic | null {
  const title = typeof topic?.title === "string" ? topic.title.trim() : "";
  if (!title) return null;
  const description = typeof topic?.description === "string" ? topic.description.trim() : null;
  const optionsInput = Array.isArray(topic?.options) ? topic.options : [];
  const options: ProjectOption[] = optionsInput
    .map((opt: any) => ({
      id: typeof opt?.id === "string" && opt.id.trim().length > 0 ? opt.id.trim() : safeRandomId(),
      label: typeof opt?.label === "string" ? opt.label.trim() : "",
      status: opt?.status === "proposed" ? "proposed" : "approved",
      createdAt: new Date(),
      createdBy: typeof opt?.createdBy === "string" ? opt.createdBy : null,
    }))
    .filter((opt) => opt.label.length > 0);

  return {
    id: typeof topic?.id === "string" && topic.id.trim().length > 0 ? topic.id.trim() : safeRandomId(),
    title,
    description,
    options,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  let body: Record<string, any> | null = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const titleSource =
    typeof body?.name === "string"
      ? body.name
      : typeof body?.title === "string"
        ? body.title
        : "";
  const title = titleSource.trim();
  if (!title) return badRequest("missing_title");

  const status: ProjectStatus =
    body?.status === "active" || body?.status === "completed" || body?.status === "archived"
      ? body.status
      : "planned";

  const topicsRaw = Array.isArray(body?.topics) ? body.topics : [];
  const topics = topicsRaw.map(normalizeTopic).filter(Boolean) as ProjectTopic[];

  if (topics.length < MIN_TOPICS || topics.length > MAX_TOPICS) {
    return badRequest("invalid_topic_count");
  }

  for (const topic of topics) {
    if (topic.options.length < MIN_OPTIONS) {
      return badRequest("min_options_required");
    }
  }

  const now = new Date();
  const doc: ProjectDoc = {
    title,
    description: typeof body?.description === "string" ? body.description.trim() : null,
    regionCode: typeof body?.region === "string" ? body.region.trim() : null,
    orgId: typeof body?.orgId === "string" ? body.orgId.trim() : null,
    status,
    topics: topics.map((topic) => ({
      ...topic,
      options: topic.options.map((opt) => ({
        ...opt,
        createdAt: now,
        createdBy: staff.context?.userId ?? null,
      })),
      createdAt: now,
      updatedAt: now,
    })),
    createdBy: staff.context?.userId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const col = await projectsCol();
  const result = await col.insertOne(doc);
  const inserted = await col.findOne({ _id: result.insertedId });
  if (!inserted) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    project: {
      id: inserted._id?.toString() ?? "",
      title: inserted.title,
      description: inserted.description ?? null,
      status: inserted.status,
      regionCode: inserted.regionCode ?? null,
      topics: inserted.topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description ?? null,
        options: topic.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          status: opt.status,
        })),
      })),
      createdAt: inserted.createdAt.toISOString(),
      updatedAt: inserted.updatedAt.toISOString(),
    },
  });
}
