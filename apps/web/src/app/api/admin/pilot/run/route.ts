import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getPilotSettings } from "@core/pilotSettings";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    scope: z.string().optional(), // forwarded to /api/feeds/pull
    maxFeeds: z.number().int().min(1).max(50).optional(),
    regionCode: z.string().optional(),
    dryRun: z.boolean().optional(),
    analyzeLimit: z.number().int().min(1).max(50).optional(),
  })
  .strict();

async function forwardJson(req: NextRequest, path: string, payload: unknown) {
  const url = new URL(path, req.url);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const bodyRaw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(bodyRaw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const settings = await getPilotSettings();
  const runId = `PILOT-${Date.now().toString(36)}`;

  const pullPayload = {
    scope: parsed.data.scope,
    maxFeeds: parsed.data.maxFeeds,
    maxItemsPerFeed: settings.maxItemsPerFeed,
    dryRun: parsed.data.dryRun,
    regionCode: parsed.data.regionCode,
  };

  const pullRes = await forwardJson(req, "/api/feeds/pull", pullPayload);
  if (!pullRes.ok) {
    return NextResponse.json(
      { ok: false, runId, step: "feeds.pull", ...pullRes },
      { status: pullRes.status },
    );
  }

  const analyzeRes = await forwardJson(req, "/api/feeds/analyze-pending", {
    limit: parsed.data.analyzeLimit ?? 10,
  });
  if (!analyzeRes.ok) {
    return NextResponse.json(
      { ok: false, runId, step: "feeds.analyze_pending", pull: pullRes, ...analyzeRes },
      { status: analyzeRes.status },
    );
  }

  return NextResponse.json({
    ok: true,
    runId,
    settings,
    pull: pullRes.data,
    analyze: analyzeRes.data,
  });
}

