export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/feeds/pull
 * Pullt RSS/Atom Feeds aus core/feeds/civic_feeds.<scope>.json und speichert
 * als StatementCandidates (triMongo core -> statement_candidates).
 *
 * Ziel: "Intro → Feeds-Abruf → Analyze-Pending → Drafts → Publish → Swipe" end-to-end.
 *
 * POST Body (optional):
 * {
 *   "scope": "de" | "global",
 *   "maxFeeds": 20,
 *   "maxItemsPerFeed": 12,
 *   "dryRun": false,
 *   "regionCode": "DE" | "DE:BE" | "DE:BE:11000"
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { pullFeeds } from "@/lib/feeds/pullFeeds";
import { requireAdminOrEditor } from "../_auth";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrEditor(req);
  if (gate) return gate;

  const body = await req.json().catch(() => ({} as any));
  const result = await pullFeeds({
    scope: body?.scope === "global" ? "global" : "de",
    maxFeeds: body?.maxFeeds,
    maxItemsPerFeed: body?.maxItemsPerFeed,
    dryRun: body?.dryRun,
    regionCode: body?.regionCode,
  });

  if (!result.ok) {
    const error = "error" in result ? result.error : "feeds_error";
    const status = error === "invalid_region" ? 400 : 500;
    return NextResponse.json(result, { status, headers: JSON_HEADERS });
  }

  return NextResponse.json(result, { headers: JSON_HEADERS });
}
