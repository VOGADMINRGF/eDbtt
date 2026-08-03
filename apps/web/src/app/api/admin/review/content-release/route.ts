import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  prepareContentReleaseTargetFromSourceResult,
  updateContentReleaseTargetFromSourceResult,
} from "@features/contentReleaseWorkbench";
import { getPersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";
import {
  canEditOrganizationResource,
  canApprovePublication,
  canCreateAnlassraumDraft,
  canCreateDossierDraft,
  canViewRegionResource,
  getOperationalRegionById,
  regionScopeFromRegionAccessContext,
} from "@features/region";
import { getRegionSourceTestResultById } from "@features/region/server/sourceConnectionRuntime";
import {
  parseAiTransparencyRecord,
  resolveContentReleaseAiTransparencyGate,
} from "@/features/ai/aiTransparencyReleaseGuard";

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
    sourceKind: z.enum(["region_source_result", "create_handoff"]),
    sourceId: z.string().trim().min(1),
    targetType: z.enum(["dossier", "anlassraum", "topic_page"]),
    action: ContentReleaseActionSchema,
    note: z.string().trim().min(1).optional(),
    aiTransparency: z.unknown().optional(),
  })
  .strict();

async function buildAccessContext(input: { req: NextRequest; regionId?: string | null }) {
  const gate = await requireGovernanceActorOrResponse(input.req, {
    regionId: input.regionId ?? null,
  });
  if (gate instanceof Response) return gate;
  const accessContext = gate.requestScope.regionAccess;
  return { gate, accessContext, scope: regionScopeFromRegionAccessContext({ accessContext }) };
}

function denied(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = ContentReleaseBodySchema.parse(await req.json());
    const source =
      body.sourceKind === "region_source_result"
        ? await getRegionSourceTestResultById(body.sourceId)
        : await getPersistedCreateHandoffRecord(body.sourceId);
    if (!source) {
      return NextResponse.json(
        { ok: false, error: body.sourceKind === "region_source_result" ? "source_result_not_found" : "create_handoff_not_found" },
        { status: 404 },
      );
    }

    const regionId = source.regionId;
    const organizationId = source.organizationId ?? null;
    const sourceOwnerUserId =
      "createdByUserId" in source ? source.createdByUserId : null;
    const region = regionId ? await getOperationalRegionById(regionId) : null;
    const access = await buildAccessContext({ req, regionId: region?.id ?? null });
    if (access instanceof Response) return access;
    const { gate, accessContext, scope } = access;
    const canViewSource =
      gate.actor.isAdmin ||
      canViewRegionResource(scope, {
        regionId: region?.id ?? regionId,
        organizationId,
        ownerUserId: sourceOwnerUserId,
      });
    const canPrepareTarget =
      canViewSource &&
      (
        gate.actor.isAdmin ||
        (
          canEditOrganizationResource(scope, { organizationId, ownerUserId: sourceOwnerUserId }) &&
          region?.id &&
          (
            body.targetType === "dossier"
              ? canCreateDossierDraft(accessContext, region.id)
              : body.targetType === "anlassraum"
                ? canCreateAnlassraumDraft(accessContext, region.id)
                : true
          )
        )
      );
    const canPreparePublicationStep =
      gate.actor.isAdmin ||
      Boolean(
        canViewSource &&
        canEditOrganizationResource(scope, {
          organizationId,
          ownerUserId: sourceOwnerUserId,
        }) &&
        region?.id &&
        canApprovePublication(accessContext, region.id),
      );

    if (body.action === "prepare_target") {
      if (!canPrepareTarget) return denied("content_release_prepare_forbidden");
      const record = await prepareContentReleaseTargetFromSourceResult({
        sourceKind: body.sourceKind,
        sourceResultId: body.sourceId,
        targetType: body.targetType,
        requestedBy: gate.actor.userId,
        organizationId: accessContext?.organization.primaryOrganizationId ?? null,
      });
      return NextResponse.json(
        {
          ok: true,
          record,
          requestScope: {
            isOperatorMode: gate.requestScope.isOperatorMode,
            operatorModeLabel: gate.requestScope.operatorModeLabel,
            sourceOfTruth: gate.requestScope.sourceOfTruth,
            confidence: gate.requestScope.confidence,
          },
        },
        { status: 201 },
      );
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

    const aiTransparencyGate = resolveContentReleaseAiTransparencyGate({
      action: body.action,
      record: body.aiTransparency,
    });
    if (!aiTransparencyGate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "ai_transparency_guard_blocked",
          message:
            "KI-Transparenzstatus, menschliche Prüfung, redaktionelle Freigabe, Kennzeichnung und Provenienz müssen vor öffentlicher Sichtbarkeit vollständig dokumentiert sein.",
          blockers: aiTransparencyGate.gate.blockers,
        },
        { status: 409 },
      );
    }

    const record = await updateContentReleaseTargetFromSourceResult({
      sourceKind: body.sourceKind,
      sourceResultId: body.sourceId,
      targetType: body.targetType,
      action: body.action,
      requestedBy: gate.actor.userId,
      note: body.note,
      aiTransparency: parseAiTransparencyRecord(body.aiTransparency),
    });
    return NextResponse.json(
      {
        ok: true,
        record,
        requestScope: {
          isOperatorMode: gate.requestScope.isOperatorMode,
          operatorModeLabel: gate.requestScope.operatorModeLabel,
          sourceOfTruth: gate.requestScope.sourceOfTruth,
          confidence: gate.requestScope.confidence,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "content_release_failed";
    const status =
      message === "source_result_not_found" ? 404 : message === "public_official_requires_official_release" ? 400 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
