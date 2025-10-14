import { NextResponse } from "next/server";
import { getVoteStats, getVoteTimeseries } from "@/lib/vote/stats";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: { statementId: string } },
) {
  const [stats, timeseries] = await Promise.all([
    getVoteStats(params.statementId),
    getVoteTimeseries(params.statementId, 60),
  ]);
  return NextResponse.json({ ok: true, stats, timeseries });
}
