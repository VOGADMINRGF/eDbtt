import type { FactcheckJobDoc } from "./db";
import type { RequestScopeContext } from "@/lib/server/auth/requestScope";

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

export function canViewFactcheckRecord(input: {
  requestScope: RequestScopeContext | null;
  record: Pick<
    FactcheckJobDoc,
    "requestedByUserId" | "organizationId" | "regionId"
  >;
}): boolean {
  const { requestScope, record } = input;
  if (!requestScope?.actorId) return false;
  if (requestScope.isOperatorMode) return true;
  if (record.requestedByUserId && record.requestedByUserId === requestScope.actorId) return true;
  if (
    record.organizationId &&
    uniqueNonEmpty([
      requestScope.organizationId,
      ...requestScope.organizationMembership.organizationIds,
      ...requestScope.organizationMembership.verifiedOrganizationIds,
    ]).includes(record.organizationId)
  ) {
    return true;
  }
  if (
    record.regionId &&
    uniqueNonEmpty([
      ...requestScope.regionIds,
      ...requestScope.regionAccess.scopedRegionIds,
    ]).includes(record.regionId)
  ) {
    return true;
  }
  return false;
}

export function canAdministerFactcheckRecord(input: {
  requestScope: RequestScopeContext | null;
}): boolean {
  return Boolean(input.requestScope?.isOperatorMode && input.requestScope.actorId);
}
