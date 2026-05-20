import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  prepareContentReleaseTargetFromSourceResult,
  updateContentReleaseTargetFromSourceResult,
} from "@features/contentReleaseWorkbench";
import { buildOrganizationDashboardReadModel } from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContentReleaseBodySchema = z
  .object({
    sourceKind: z.enum(["region_source_result", "create_handoff"]),
    sourceId: z.string().trim().min(1),
    targetType: z.enum(["dossier", "anlassraum", "topic_page"]),
    action: z.enum([
      "prepare_target",
      "make_visible",
      "prepare_publication",
      "retract_visibility",
      "archive_target",
    ]),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

function denied(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const userId = String(gate.actor.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "governance_user_id_missing" }, { status: 400 });
    }

    const body = ContentReleaseBodySchema.parse(await req.json());
    const readModel = await buildOrganizationDashboardReadModel({
      userId,
      roles: gate.roles,
      isAdmin: gate.actor.isAdmin,
      actorRole: gate.actor.role,
    });
    const existingItem = readModel.openReviewItems.find(
      (item) =>
        item.contentReleaseWorkbench?.sourceKind === body.sourceKind &&
        item.contentReleaseWorkbench?.sourceId === body.sourceId,
    );
    if (!existingItem?.contentReleaseWorkbench) {
      return NextResponse.json({ ok: false, error: "content_release_item_not_found" }, { status: 404 });
    }
    const matchingTarget = existingItem.contentReleaseWorkbench.targets.find(
      (target) => target.targetType === body.targetType,
    );
    if (!matchingTarget) {
      return NextResponse.json({ ok: false, error: "content_release_target_not_found" }, { status: 404 });
    }

    if (body.action === "prepare_target" && !existingItem.moderationPermission.canPrepareOwnContentRelease) {
      return denied("content_release_prepare_forbidden");
    }
    if (
      (body.action === "make_visible" ||
        body.action === "prepare_publication" ||
        body.action === "retract_visibility") &&
      !existingItem.moderationPermission.canMakeOwnContentVisible
    ) {
      return denied("content_release_visibility_forbidden");
    }
    if (body.action === "archive_target" && !existingItem.moderationPermission.canArchiveOwnContent) {
      return denied("content_release_archive_forbidden");
    }

    if (body.action === "prepare_target") {
      const record = await prepareContentReleaseTargetFromSourceResult({
        sourceKind: body.sourceKind,
        sourceResultId: body.sourceId,
        targetType: body.targetType,
        requestedBy: userId,
        organizationId: readModel.organization.primaryOrganizationId ?? null,
      });
      return NextResponse.json({ ok: true, record }, { status: 201 });
    }

    const record = await updateContentReleaseTargetFromSourceResult({
      sourceKind: body.sourceKind,
      sourceResultId: body.sourceId,
      targetType: body.targetType,
      action: body.action,
      requestedBy: userId,
      note: body.note,
    });
    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "content_release_failed";
    const status =
      message === "content_release_item_not_found" || message === "content_release_target_not_found"
        ? 404
        : message === "content_release_prepare_forbidden" ||
            message === "content_release_visibility_forbidden" ||
            message === "content_release_archive_forbidden"
          ? 403
          : message === "public_official_requires_official_release"
            ? 400
            : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
