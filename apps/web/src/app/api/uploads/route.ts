// apps/web/src/app/api/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildMaterialIntakeContract, type MaterialIntakeInputItem } from "@/features/material/materialIntakeContract";
import { createMaterialIntakeRecords } from "@/features/material/materialIntakeRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function materialItemFromFile(file: File, index: number): MaterialIntakeInputItem {
  return {
    id: `upload-${index + 1}`,
    kind: "upload_document",
    label: file.name || `Upload ${index + 1}`,
    url: null,
    uploadId: `upload-${index + 1}`,
    mimeType: file.type || null,
    fileName: file.name || null,
    text: null,
    pageRef: null,
    timestampRef: null,
    extractedBy: null,
    extractionStatus: "none",
  };
}

async function resolveMaterialUploadWorkflow(req: NextRequest) {
  const requestScopeModule = await import("@/lib/server/auth/requestScope").catch(() => null);
  const regionModule = await import("@features/region").catch(() => null);
  if (!requestScopeModule || !regionModule) {
    return {
      actorId: "anonymous",
      organizationId: null,
      regionId: null,
      scopeSummary: null,
      workflowState: "verification_required",
    } as const;
  }
  const { resolveRequestScopeContext, summarizeRequestScopeContext } = requestScopeModule;
  const {
    buildOrganizationEntitlementSummary,
    getRegionEntitlementRuntimeRepo,
    organizationEntitlementAllowsScope,
  } = regionModule;

  const scope = await resolveRequestScopeContext(req).catch(() => null);
  const scopeSummary = summarizeRequestScopeContext(scope);
  const actorId = scope?.actorId ?? "anonymous";
  const organizationId =
    scope?.membershipStatus === "verified"
      ? scope.organizationId
      : null;
  const regionId = scope?.regionIds[0] ?? null;
  const hasVerifiedMembership = Boolean(organizationId);
  let hasDossierStudioEntitlement = Boolean(scope?.isOperatorMode);

  if (scope && organizationId && !hasDossierStudioEntitlement) {
    const entitlementRepo = getRegionEntitlementRuntimeRepo();
    const [entitlements, auditEvents] = await Promise.all([
      entitlementRepo.getEntitlementsForOrganization(organizationId).catch(() => []),
      entitlementRepo.listEntitlementAuditEventsForOrganization(organizationId).catch(() => []),
    ]);
    const organization =
      scope.organizationMembership.organizations.find((entry) => entry.id === organizationId) ?? null;
    const verifiedMemberships = scope.organizationMembership.memberships.filter(
      (membership) => membership.organizationId === organizationId,
    );
    const entitlementSummary = buildOrganizationEntitlementSummary({
      organization,
      claims: [],
      verifiedMemberships,
      entitlements,
      auditEvents,
      productionTruth: true,
    });
    hasDossierStudioEntitlement = organizationEntitlementAllowsScope(
      entitlementSummary,
      "dossier_studio",
    );
  }

  return {
    actorId,
    organizationId,
    regionId,
    scopeSummary,
    workflowState: !hasVerifiedMembership
      ? "verification_required"
      : hasDossierStudioEntitlement
        ? "review_queue_ready"
        : "limited_intake",
  } as const;
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const files = fd.getAll("files").filter((entry): entry is File => entry instanceof File);
  const materialItems = files.map(materialItemFromFile);
  const workflow = await resolveMaterialUploadWorkflow(req);
  const registry = await createMaterialIntakeRecords({
    items: materialItems.map((item, index) => ({
      ...item,
      sizeBytes: files[index]?.size ?? null,
    })),
    actorId: workflow.actorId,
    organizationId: workflow.organizationId,
    regionId: workflow.regionId,
    workflowState: workflow.workflowState,
  });
  const materialIntake = buildMaterialIntakeContract({
    items: materialItems,
    productionTruth: registry.persistence.productionTruth,
    storageMode: registry.persistence.productionTruth ? "persistent_metadata_store" : "local_pending",
  });
  return NextResponse.json({
    ok: true,
    storageMode: registry.persistence.productionTruth ? "persistent_metadata_store" : "local_pending",
    productionTruth: registry.persistence.productionTruth,
    rawObjectStorageProductionTruth: false,
    scanProviderConfigured: false,
    extractionProviderConfigured: false,
    message:
      "Upload-Metadaten wurden angenommen und reviewpflichtig registriert. Es wurde kein Dateispeicher, kein Malware-Scan, keine Extraktion, keine KI-Recherche und keine Veröffentlichung automatisch gestartet.",
    files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    requestScope: workflow.scopeSummary,
    materialIntake,
    materialRegistry: {
      workflowState: workflow.workflowState,
      persistence: registry.persistence,
      records: registry.records,
      auditEvents: registry.auditEvents,
    },
  });
}
