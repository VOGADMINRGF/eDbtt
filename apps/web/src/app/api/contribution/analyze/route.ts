// apps/web/src/app/api/contribution/analyze/route.ts
import type { NextRequest } from "next/server";
import { handleAnalyzePost } from "@/server/handlers/contributions/analyzePost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = await handleAnalyzePost(req);
  res.headers.set("x-deprecated-endpoint", "use /api/contributions/analyze");
  return res;
}
