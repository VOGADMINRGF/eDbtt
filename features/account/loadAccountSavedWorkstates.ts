import {
  listCreateSavedWorkstates,
} from "@/features/create/createSavedWorkstateRepo";

function timestampForSort(value: string | null | undefined) {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function canSeeAdminInternal(viewerRoles: string[]) {
  return viewerRoles.some((role) => ["admin", "staff", "superadmin"].includes(role));
}

export async function loadAccountSavedWorkstates(
  userId: string,
  viewerRoles: string[],
  limit = 40,
) {
  const showAdminInternal = canSeeAdminInternal(viewerRoles);
  const records = await listCreateSavedWorkstates().catch(() => []);

  return records
    .filter((record) => record.ownerUserId === userId)
    .filter((record) => showAdminInternal || record.visibility !== "admin_internal")
    .sort(
      (left, right) =>
        timestampForSort(right.updatedAt) - timestampForSort(left.updatedAt),
    )
    .slice(0, Math.max(1, limit));
}
