import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { findDossierByAnyId } from "@features/dossier/lookup";
import {
  type DossierStudioWorkspaceSource,
  getDossierStudioWorkspaceRepo,
} from "@features/dossier/server/studioPersistence";
import {
  MasterPostSchema,
  SocialCarouselOutputSchema,
  SocialDistributionDraftSchema,
} from "@features/outputEngine";
import {
  buildPersistedRegionAccessContext,
  canEditOrganizationResource,
  canApprovePublication,
  canCreateDossierDraft,
  canReadRegionDashboard,
  canViewRegionResource,
  findRegionSignalDraftRecordByDraftId,
  getOperationalRegionById,
  regionScopeFromRegionAccessContext,
} from "@features/region";
import { isExplicitDemoDossierId } from "@/features/runtimeDataGuardrails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WorkspaceWriteStatusSchema = z.enum(["draft", "needs_review"]);

const WorkspaceMutationSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    masterPostDraft: MasterPostSchema.optional(),
    distributionDraft: SocialDistributionDraftSchema.optional(),
    carouselDraft: SocialCarouselOutputSchema.optional(),
    audienceNotes: z.string().trim().min(1).nullable().optional(),
    reviewNotes: z.string().trim().min(1).nullable().optional(),
    status: WorkspaceWriteStatusSchema.optional(),
  })
  .strict();

const WorkspaceOfficialApprovalSchema = z
  .object({
    action: z.enum(["approve_publication", "revoke_publication"]),
    note: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

type RouteParams = { params: Promise<{ id: string }> };

type ResolvedStudioAccess = {
  dossierId: string;
  workspace: Awaited<
    ReturnType<ReturnType<typeof getDossierStudioWorkspaceRepo>["getDossierStudioWorkspace"]>
  >;
  regionId: string | null;
  organizationId: string | null;
  unitId: string | null;
  source: DossierStudioWorkspaceSource;
  title: string;
  provenance: {
    sourceSignalId?: string;
    sourceRegionId?: string;
    sourceDraftId?: string;
    notProductionData?: boolean;
    fixture?: boolean;
  };
  accessContext: Awaited<ReturnType<typeof buildPersistedRegionAccessContext>> | null;
};

async function buildAccessContextFromRuntime(input: {
  userId: string;
  actorRole: string;
  isAdmin: boolean;
  roles: string[];
  organizationIds: string[];
  regionId: string | null;
}) {
  if (!input.regionId && !input.isAdmin) return null;
  return buildPersistedRegionAccessContext({
    userId: input.userId,
    actorRole: input.actorRole,
    isAdmin: input.isAdmin,
    roles: input.roles,
    organizationIds: input.organizationIds,
    regionId: input.regionId ?? undefined,
  });
}

async function resolveStudioAccess(
  req: NextRequest,
  params: RouteParams,
): Promise<ResolvedStudioAccess | Response> {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await params.params;
  const repo = getDossierStudioWorkspaceRepo();
  const workspace = await repo.getDossierStudioWorkspace(id);
  const draftRecord = await findRegionSignalDraftRecordByDraftId(id);
  const dossier = await findDossierByAnyId(id).catch(() => null);

  const inferredRegionId = workspace?.regionId ?? draftRecord?.regionId ?? null;
  const region = inferredRegionId ? await getOperationalRegionById(inferredRegionId) : null;
  const regionId = region?.id ?? inferredRegionId ?? null;
  const accessContext = await buildAccessContextFromRuntime({
    userId: gate.actor.userId,
    actorRole: gate.actor.role,
    isAdmin: gate.actor.isAdmin,
    roles: gate.roles,
    organizationIds: gate.actor.scopedOwnerIds,
    regionId,
  });

  const source =
    workspace?.source ??
    (isExplicitDemoDossierId(id)
      ? "imported_demo"
      : draftRecord?.provenance.sourceSignalId?.startsWith("region-participation-")
        ? "public_participation_signal"
        : draftRecord
          ? "region_signal_draft"
          : "manual_admin");

  return {
    dossierId: id,
    workspace,
    regionId,
    organizationId:
      workspace?.organizationId ??
      accessContext?.organization.primaryOrganizationId ??
      null,
    unitId: workspace?.unitId ?? null,
    source,
    title:
      workspace?.title ??
      dossier?.title ??
      draftRecord?.title ??
      `Studio-Arbeitsstand ${id}`,
    provenance: {
      sourceSignalId: draftRecord?.provenance.sourceSignalId,
      sourceRegionId: draftRecord?.provenance.sourceRegionId,
      sourceDraftId: draftRecord?.draftId,
      notProductionData: draftRecord?.provenance.notProductionData,
      fixture: draftRecord?.provenance.pilotFixture,
    },
    accessContext,
  };
}

function readDeniedResponse() {
  return NextResponse.json(
    { ok: false, error: "studio_workspace_read_forbidden" },
    { status: 403 },
  );
}

function writeDeniedResponse() {
  return NextResponse.json(
    { ok: false, error: "studio_workspace_write_forbidden" },
    { status: 403 },
  );
}

function canReadWorkspace(access: ResolvedStudioAccess) {
  if (!access.regionId || !access.accessContext) return false;
  const scope = regionScopeFromRegionAccessContext({ accessContext: access.accessContext });
  if (!canViewRegionResource(scope, { regionId: access.regionId, organizationId: access.organizationId })) {
    return false;
  }
  return canReadRegionDashboard(access.accessContext, access.regionId);
}

function canWriteWorkspace(access: ResolvedStudioAccess) {
  if (!access.regionId || !access.accessContext) return false;
  const scope = regionScopeFromRegionAccessContext({ accessContext: access.accessContext });
  if (
    !canViewRegionResource(scope, { regionId: access.regionId, organizationId: access.organizationId }) ||
    !canEditOrganizationResource(scope, { organizationId: access.organizationId })
  ) {
    return false;
  }
  return canCreateDossierDraft(access.accessContext, access.regionId);
}

function canApproveWorkspacePublication(access: ResolvedStudioAccess) {
  if (!access.regionId || !access.accessContext) return false;
  const scope = regionScopeFromRegionAccessContext({ accessContext: access.accessContext });
  if (
    !canViewRegionResource(scope, { regionId: access.regionId, organizationId: access.organizationId }) ||
    !canEditOrganizationResource(scope, { organizationId: access.organizationId })
  ) {
    return false;
  }
  return canApprovePublication(access.accessContext, access.regionId);
}

function workspaceResponseBody(
  workspace: NonNullable<ResolvedStudioAccess["workspace"]> | null,
  access: ResolvedStudioAccess,
) {
  return {
    ok: true,
    workspace,
    access: {
      adminFallback: access.accessContext?.adminFallback ?? false,
      authoritySource: access.accessContext?.authoritySource ?? "unverified_hint_only",
      verificationStatus: access.accessContext?.verificationStatus ?? "none",
      canRead: canReadWorkspace(access),
      canEdit: canWriteWorkspace(access),
      canApproveOfficialPublication: canApproveWorkspacePublication(access),
    },
  };
}

export async function GET(req: NextRequest, params: RouteParams) {
  const access = await resolveStudioAccess(req, params);
  if (access instanceof Response) return access;
  if (!canReadWorkspace(access) && !access.accessContext?.isAdmin) {
    return readDeniedResponse();
  }
  return NextResponse.json(workspaceResponseBody(access.workspace, access), {
    status: 200,
  });
}

export async function POST(req: NextRequest, params: RouteParams) {
  const access = await resolveStudioAccess(req, params);
  if (access instanceof Response) return access;
  if (!canWriteWorkspace(access)) return writeDeniedResponse();

  try {
    const body = WorkspaceMutationSchema.parse(await req.json().catch(() => ({})));
    const repo = getDossierStudioWorkspaceRepo();
    const workspace = await repo.createOrGetDossierStudioWorkspace({
      dossierId: access.dossierId,
      regionId: access.regionId,
      organizationId: access.organizationId,
      unitId: access.unitId,
      source: access.source,
      title: body.title ?? access.title,
      createdBy: access.accessContext?.userId ?? "unknown",
      updatedBy: access.accessContext?.userId ?? "unknown",
      provenance: access.provenance,
      seed: {
        masterPostDraft: body.masterPostDraft,
        distributionDraft: body.distributionDraft,
        carouselDraft: body.carouselDraft,
        audienceNotes: body.audienceNotes ?? undefined,
        reviewNotes: body.reviewNotes ?? undefined,
        status: body.status ?? "draft",
      },
    });
    return NextResponse.json(workspaceResponseBody(workspace, access), {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "studio_workspace_create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, params: RouteParams) {
  const access = await resolveStudioAccess(req, params);
  if (access instanceof Response) return access;

  try {
    const rawBody = await req.json();
    const officialAction = WorkspaceOfficialApprovalSchema.safeParse(rawBody);
    if (officialAction.success) {
      if (!canApproveWorkspacePublication(access)) return writeDeniedResponse();
      const repo = getDossierStudioWorkspaceRepo();
      const workspace =
        officialAction.data.action === "approve_publication"
          ? await repo.approveDossierStudioWorkspaceOfficial({
              dossierId: access.dossierId,
              approvedBy: access.accessContext?.userId ?? "unknown",
              authority: access.accessContext?.isAdmin ? "admin_fallback" : "publication_approved",
              note: officialAction.data.note ?? null,
            })
          : await repo.revokeDossierStudioWorkspaceOfficial(
              access.dossierId,
              access.accessContext?.userId ?? "unknown",
              officialAction.data.note ?? null,
            );
      if (!workspace) {
        return NextResponse.json(
          { ok: false, error: "studio_workspace_official_publication_blocked" },
          { status: 400 },
        );
      }
      return NextResponse.json(workspaceResponseBody(workspace, access), {
        status: 200,
      });
    }

    if (!canWriteWorkspace(access)) return writeDeniedResponse();
    const body = WorkspaceMutationSchema.parse(rawBody);
    const repo = getDossierStudioWorkspaceRepo();
    const existing =
      access.workspace ??
      (await repo.createOrGetDossierStudioWorkspace({
        dossierId: access.dossierId,
        regionId: access.regionId,
        organizationId: access.organizationId,
        unitId: access.unitId,
        source: access.source,
        title: body.title ?? access.title,
        createdBy: access.accessContext?.userId ?? "unknown",
        updatedBy: access.accessContext?.userId ?? "unknown",
        provenance: access.provenance,
      }));
    const workspace = await repo.updateDossierStudioWorkspace({
      dossierId: existing.dossierId,
      updatedBy: access.accessContext?.userId ?? "unknown",
      patch: body,
    });
    return NextResponse.json(workspaceResponseBody(workspace, access), {
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "studio_workspace_update_failed";
    const status = message === "studio_workspace_locked" ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
