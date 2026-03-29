import { NextRequest, NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@core/auth/rbac";
import { formatError } from "@core/errors/formatError";
import { factcheckJobsCol } from "@features/factcheck/db";
import { logPermissionDenied, resolveRoleFromRequest } from "@/lib/server/auth/requestRole";
import {
  internalSystemIdentityAuditFields,
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const systemIdentity = resolveInternalSystemIdentity(req);
  const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
  const roleContext = resolveRoleFromRequest(req);
  const hasSessionAccess =
    roleContext.source === "cookie" && hasPermission(roleContext.role, PERMISSIONS.FACTCHECK_STATUS);
  const hasTrustedSystemAccess =
    trustedSystemIdentity?.source === "factcheck_queue" ||
    trustedSystemIdentity?.source === "factcheck_worker";
  if (!hasSessionAccess && !hasTrustedSystemAccess) {
    logPermissionDenied({
      req,
      scope: "factcheck.status.list",
      permission: PERMISSIONS.FACTCHECK_STATUS,
      role: roleContext.role,
      source: roleContext.source,
      details: {
        ...internalSystemIdentityAuditFields(systemIdentity),
        denyReason: systemIdentity
          ? "system_identity_untrusted_or_disallowed"
          : roleContext.source === "header"
            ? "header_role_not_allowed"
            : "missing_permission",
      },
    });
    const fe = formatError("FORBIDDEN", "Permission denied", { role: roleContext.role });
    return NextResponse.json(fe, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);

  const col = await factcheckJobsCol();
  const jobs = await col
    .aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          jobId: 1,
          status: 1,
          verdict: 1,
          confidence: 1,
          createdAt: 1,
          finishedAt: { $ifNull: ["$finishedAt", null] },
          draftId: { $ifNull: ["$draftId", null] },
          contributionId: { $ifNull: ["$contributionId", null] },
          claimsCount: { $size: { $ifNull: ["$claims", []] } },
          serpCount: { $size: { $ifNull: ["$serpResults", []] } },
        },
      },
    ])
    .toArray();

  return NextResponse.json({ ok: true, jobs });
}
