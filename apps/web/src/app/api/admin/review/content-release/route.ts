import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  prepareContentReleaseTargetFromSourceResult,
  updateContentReleaseTargetFromSourceResult,
} from "@features/contentReleaseWorkbench";
import {
  buildPersistedRegionAccessContext,
  canApprovePublication,
  canCreateAnlassraumDraft,
  canCreateDossierDraft,
  getOperationalRegionById,
} from "@features/region";
import { getRegionSourceTestResultById } from "@features/region/server/sourceConnectionRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContentReleaseActionSchema = z.enum([
  "prepare_target",
  "make_visible",
  "prepare_publication",
  "retract_visibility",
  "archive_target",
]);

const ContentReleaseBodySchema = z
  .object({
    sourceResultId: z.string().trim().min(1),
    targetType: z.enum(["dossier", "anlassraum"]),
    action: ContentReleaseActionSchema,
    note: z.string().trim().min(1).optional(),
  })
  .strict();

async function buildAccessContext(input: {
  req: NextRequest;
  regionId: string;
}) {
  const gate = await requireGovernanceActorOrResponse(input.req);
  if (gate instanceof Response) return gate;
  const accessContext = await buildPersistedRegionAccessContext({
    userId: gate.actor.userId,
    actorRole: gate.actor.role,
    isAdmin: gate.actor.isAdmin,
    roles: gate.roles,
    organizationIds: gate.actor.scopedOwnerIds,
    regionId: input.regionId,
  });
  return { gate, accessContext };
}

function denied(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = ContentReleaseBodySchema.parse(await req.json());
    const sourceResult = await getRegionSourceTestResultById(body.sourceResultId);
    if (!sourceResult) {
      return NextResponse.json({ ok: false, error: "source_result_not_found" }, { status: 404 });
    }
    const region = await getOperationalRegionById(sourceResult.regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    const access = await buildAccessContext({ req, regionId: region.id });
    if (access instanceof Response) return access;

    const canPrepareTarget =
      access.accessContext.isAdmin ||
      (body.targetType === "dossier"
        ? canCreateDossierDraft(access.accessContext, region.id)
        : canCreateAnlassraumDraft(access.accessContext, region.id));
    const canPreparePublicationStep =
      access.accessContext.isAdmin || canApprovePublication(access.accessContext, region.id);

    if (body.action === "prepare_target") {
      if (!canPrepareTarget) return denied("content_release_prepare_forbidden");
      const record = await prepareContentReleaseTargetFromSourceResult({
        sourceResultId: body.sourceResultId,
        targetType: body.targetType,
        requestedBy: access.gate.actor.userId,
        organizationId: access.accessContext.organization.primaryOrganizationId,
      });
      return NextResponse.json({ ok: true, record }, { status: 201 });
    }

    if (body.action === "make_visible" && !canPrepareTarget) {
      return denied("content_release_visibility_forbidden");
    }
    if (
      (body.action === "prepare_publication" ||
        body.action === "retract_visibility" ||
        body.action === "archive_target") &&
      !canPreparePublicationStep
    ) {
      return denied("content_release_publication_forbidden");
    }

    const record = await updateContentReleaseTargetFromSourceResult({
      sourceResultId: body.sourceResultId,
      targetType: body.targetType,
      action: body.action,
      requestedBy: access.gate.actor.userId,
      note: body.note,
    });
    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "content_release_failed";
    const status =
      message === "source_result_not_found" ? 404 : message === "public_official_requires_official_release" ? 400 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
