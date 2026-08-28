import { NextRequest, NextResponse } from "next/server";
import {
  buildMaterialExtractionJobReadModel,
  createMaterialExtractionJob,
  type MaterialExtractionMode,
} from "@/features/material/materialExtractionJobs";
import {
  buildMaterialGraphFirstContext,
  type MaterialGraphContextItem,
  type MaterialGraphTopicItem,
} from "@/features/material/materialGraphFirstContext";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readStringList(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readGraphFirstRuntime(req: NextRequest) {
  const contextUrl = new URL("/api/create/context?limit=80", req.nextUrl.origin);
  const topicsUrl = new URL("/api/topics", req.nextUrl.origin);
  const cookie = req.headers.get("cookie") ?? "";
  const headers = cookie ? { cookie } : undefined;

  const [contextResult, topicsResult] = await Promise.allSettled([
    fetch(contextUrl, { cache: "no-store", headers }).then(async (response) => {
      if (!response.ok) throw new Error("context_route_unavailable");
      return (await response.json()) as { items?: MaterialGraphContextItem[] };
    }),
    fetch(topicsUrl, { cache: "no-store", headers }).then(async (response) => {
      if (!response.ok) throw new Error("topics_route_unavailable");
      return (await response.json()) as { topics?: MaterialGraphTopicItem[] };
    }),
  ]);

  return {
    contextItems:
      contextResult.status === "fulfilled" && Array.isArray(contextResult.value.items)
        ? contextResult.value.items
        : [],
    topics:
      topicsResult.status === "fulfilled" && Array.isArray(topicsResult.value.topics)
        ? topicsResult.value.topics
        : [],
    blockers: [
      ...(contextResult.status === "rejected" ? ["context_route_unavailable"] : []),
      ...(topicsResult.status === "rejected" ? ["topics_route_unavailable"] : []),
    ],
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 24);
  const organizationIds = readStringList(params, "organizationId");
  const regionIds = readStringList(params, "regionId");

  const readModel = await buildMaterialExtractionJobReadModel({
    organizationIds,
    regionIds,
    limit: Number.isFinite(limit) ? limit : 24,
  });

  return NextResponse.json({
    ok: true,
    readModel,
  });
}

type Body = {
  materialId?: string;
  extractionMode?: MaterialExtractionMode;
  dossierId?: string;
  anlassraumId?: string;
  approveCost?: boolean;
};

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const materialId = String(body.materialId ?? "").trim();
  const extractionMode = String(body.extractionMode ?? "").trim() as MaterialExtractionMode;
  const dossierId = String(body.dossierId ?? "").trim() || null;
  const anlassraumId = String(body.anlassraumId ?? "").trim() || null;
  const approveCost = body.approveCost === true;

  if (!materialId || !extractionMode) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  try {
    const created = await createMaterialExtractionJob({
      materialId,
      extractionMode,
      submittedBy: gate.actor.userId,
      dossierId,
      anlassraumId,
      approveCost,
    });

    const graphRuntime = await readGraphFirstRuntime(req);
    const graphFirst = buildMaterialGraphFirstContext({
      job: created.job,
      contextItems: graphRuntime.contextItems,
      topics: graphRuntime.topics,
    });

    return NextResponse.json({
      ok: true,
      job: created.job,
      persistence: created.persistence,
      graphFirst: {
        ...graphFirst,
        blockers: graphRuntime.blockers,
      },
      message:
        "Extraktionsjob wurde review-first registriert und gegen vorhandenes eDebatte-Wissen geprüft. Es wurde weder automatisch veröffentlicht, gemergt noch in den Graph geschrieben.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "material_extraction_job_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
