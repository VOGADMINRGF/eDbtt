import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/utils/session";
import {
  normalizeCommunityDeepLinkParams,
  toCommunityParamRecord,
} from "@/features/community/deepLinkContract";
import {
  resolveCommunityGroupSurface,
} from "@/features/community/groupSurface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = toCommunityParamRecord(url);
  const normalized = normalizeCommunityDeepLinkParams(searchParams);
  if ("error" in normalized) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const session = await readSession();
  const viewerId = typeof session?.uid === "string" ? session.uid.trim() || null : null;

  try {
    const model = await resolveCommunityGroupSurface({ searchParams, viewerId });
    return NextResponse.json({ ok: true, ...model });
  } catch {
    return NextResponse.json(
      { ok: false, error: "community_group_source_unavailable" },
      { status: 503 },
    );
  }
}
