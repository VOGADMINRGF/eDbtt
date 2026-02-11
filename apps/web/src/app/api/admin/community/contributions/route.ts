import { NextRequest, NextResponse } from "next/server";
import { listCommunityContributions, type CommunityContributionStatus } from "@core/communityContributions";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALUES = new Set<CommunityContributionStatus>(["proposed", "approved", "rejected"]);

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { searchParams } = new URL(req.url);
  const statusRaw = searchParams.get("status")?.trim() as CommunityContributionStatus | null;
  const status = STATUS_VALUES.has(statusRaw as CommunityContributionStatus)
    ? statusRaw!
    : ("proposed" as CommunityContributionStatus);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 100) || 100));

  const items = await listCommunityContributions({ status, limit });
  return NextResponse.json({ ok: true, items });
}
