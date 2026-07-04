import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  buildPersistedRegionAccessContext,
  canViewOrganizationResource,
  canViewRegionResource,
  regionScopeFromRegionAccessContext,
} from "@features/region";
import {
  getPersistedCreateHandoffRecord,
  toCreateHandoffDraft,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  ensurePersistedDossierRuntimeDraft,
  getDossierRuntimeHandoffSummary,
} from "@/features/create/dossierRuntimeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ handoffId: string }> },
) {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;
  if (!user || !user.sessionValid || !userId) return unauthorized();

  const { handoffId } = await context.params;
  const record = await getPersistedCreateHandoffRecord(handoffId);
  if (!record) {
    return NextResponse.json({ ok: false, error: "create_handoff_not_found" }, { status: 404 });
  }

  const isOwner = record.createdByUserId === userId;
  const roles = Array.isArray(user.roles)
    ? user.roles.map((role) => String(role ?? "").trim()).filter(Boolean)
    : [];
  const isAdmin = userIsAdminDashboard(user);
  const accessContext = await buildPersistedRegionAccessContext({
    userId,
    actorRole: String(roles[0] ?? (isAdmin ? "admin" : "organization_member")).trim() || "organization_member",
    isAdmin,
    roles,
    regionId: record.regionId,
  });
  const scope = regionScopeFromRegionAccessContext({ accessContext });
  const canViewRecord =
    isOwner ||
    isAdmin ||
    canViewOrganizationResource(scope, {
      organizationId: record.organizationId,
      ownerUserId: record.createdByUserId,
    }) ||
    canViewRegionResource(scope, {
      regionId: record.regionId,
      organizationId: record.organizationId,
      ownerUserId: record.createdByUserId,
    });
  if (!canViewRecord) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const dossierRuntime =
    record.selectedAction === "create_dossier"
      ? await ensurePersistedDossierRuntimeDraft(handoffId).then(() =>
          getDossierRuntimeHandoffSummary(handoffId),
        )
      : null;

  return NextResponse.json({
    ok: true,
    draft: toCreateHandoffDraft(record),
    dossierRuntime,
    context: {
      regionId: record.regionId,
      organizationId: record.organizationId,
      dossierId: record.dossierId,
      anlassraumId: record.anlassraumId,
    },
  });
}
