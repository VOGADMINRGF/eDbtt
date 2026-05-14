import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { safeRandomId } from "@core/utils/random";
import { projectsCol } from "@features/project/db";
import type { ProjectDoc, ProjectOption, ProjectTopic, ProjectStatus } from "@features/project/types";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { sessionHasPassedTwoFactor, sessionSatisfiesProtectedTwoFactor, userRequiresTwoFactor } from "@/lib/server/auth/twoFactor";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_TOPICS = 5;
const MAX_TOPICS = 10;
const MIN_OPTIONS = 5;

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

async function gateProjectCreator(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!userRequiresTwoFactor(user) && !sessionSatisfiesProtectedTwoFactor(user)) {
    return NextResponse.json({ ok: false, error: "two_factor_setup_required" }, { status: 403 });
  }

  if (userRequiresTwoFactor(user) && !sessionHasPassedTwoFactor(user) && !sessionSatisfiesProtectedTwoFactor(user)) {
    return NextResponse.json({ ok: false, error: "two_factor_required" }, { status: 403 });
  }

  if (userIsAdminDashboard(user)) {
    return { userId: String(user._id) };
  }

  const Users = await coreCol("users");
  const row = await Users.findOne(
    { _id: new ObjectId(String(user._id)) },
    { projection: { edebatte: 1, roles: 1, role: 1 } },
  );
  const pkg = (row as any)?.edebatte?.package;
  const status = (row as any)?.edebatte?.status;
  const roles = Array.isArray((row as any)?.roles) ? (row as any)?.roles : (row as any)?.role ? [(row as any).role] : [];
  const isOrgAdmin = roles.includes("org_admin");

  if (pkg === "pro" && status === "active") return { userId: String(user._id) };
  if (isOrgAdmin && status === "active") return { userId: String(user._id) };

  return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
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
  const gate = await gateProjectCreator(req);
  if (gate instanceof Response) return gate;

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
        createdBy: gate.userId ?? null,
      })),
      createdAt: now,
      updatedAt: now,
    })),
    createdBy: gate.userId ?? null,
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
