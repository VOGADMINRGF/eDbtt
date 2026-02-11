import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { publicOrigin } from "@/utils/publicOrigin";
import { pullFeeds } from "@/lib/feeds/pullFeeds";
import { analyzePendingStatementCandidates } from "@features/feeds/analyzePending";
import { voteDraftsCol } from "@features/feeds/db";
import { ObjectId } from "@core/db/triMongo";
import type { StatementRecord } from "@features/analyze/schemas";
import { safeRandomId } from "@core/utils/random";
import {
  getPilotSettings,
  logPilotRunReceipt,
  sumPilotCostsSince,
} from "@core/pilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RunSchema = z.object({
  scope: z.enum(["de", "global"]).optional(),
  regionCode: z.string().optional(),
  maxFeeds: z.number().int().min(1).max(100).optional(),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
});

function startOfDayUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function loadDraftClaims(draftId: string): Promise<StatementRecord[]> {
  if (!ObjectId.isValid(draftId)) return [];
  const col = await voteDraftsCol();
  const doc = await col.findOne({ _id: new ObjectId(draftId) });
  return Array.isArray(doc?.claims) ? (doc?.claims as StatementRecord[]) : [];
}

async function canSpendBudget(topic: string | null, settings: { daily_budget: number; per_topic_budget: number }) {
  const since = startOfDayUtc();
  const dailySpent = await sumPilotCostsSince({ since });
  if (settings.daily_budget > 0 && dailySpent >= settings.daily_budget) {
    return { ok: false, reason: "daily_budget_exceeded" as const };
  }
  if (topic) {
    const topicSpent = await sumPilotCostsSince({ since, topic });
    if (settings.per_topic_budget > 0 && topicSpent >= settings.per_topic_budget) {
      return { ok: false, reason: "per_topic_budget_exceeded" as const };
    }
  }
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = RunSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const body = parsed.data;

  const { settings } = await getPilotSettings();
  if (!settings.auto_run_enabled && !body.force) {
    return NextResponse.json({ ok: false, error: "auto_run_disabled" }, { status: 403 });
  }

  const runId = `pilot_${safeRandomId()}`;
  const feedResult = await pullFeeds({
    scope: body.scope ?? "de",
    regionCode: body.regionCode ?? null,
    maxFeeds: body.maxFeeds ?? 20,
    maxItemsPerFeed: settings.max_items_per_feed,
    dryRun: body.dryRun ?? false,
  });

  if (!feedResult.ok) {
    const error = "error" in feedResult ? feedResult.error : "feeds_error";
    return NextResponse.json({ ok: false, error, details: feedResult }, { status: 500 });
  }

  const analyzeLimit = Math.min(50, Math.max(1, feedResult.inserted || settings.max_items_per_feed));
  const analyzeResult = await analyzePendingStatementCandidates({ limit: analyzeLimit });

  let factchecked = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of analyzeResult.processed) {
    const budget = await canSpendBudget(item.topic ?? null, settings);
    if (!budget.ok) {
      skipped += 1;
      await logPilotRunReceipt({
        runId,
        candidateId: item.candidateId,
        draftId: item.draftId ?? null,
        topic: item.topic ?? null,
        checkLevel: settings.check_level,
        status: "skipped",
        reason: budget.reason,
        costEur: 0,
        createdAt: new Date(),
      });
      continue;
    }

    if (!item.draftId) {
      skipped += 1;
      await logPilotRunReceipt({
        runId,
        candidateId: item.candidateId,
        draftId: null,
        topic: item.topic ?? null,
        checkLevel: settings.check_level,
        status: "skipped",
        reason: "missing_draft",
        costEur: 0,
        createdAt: new Date(),
      });
      continue;
    }

    const checkLevel = settings.check_level;
    const useSerp = checkLevel >= 2;
    const claims = checkLevel === 0 ? await loadDraftClaims(item.draftId) : [];

    if (checkLevel === 0 && !claims.length) {
      skipped += 1;
      await logPilotRunReceipt({
        runId,
        candidateId: item.candidateId,
        draftId: item.draftId,
        topic: item.topic ?? null,
        checkLevel,
        status: "skipped",
        reason: "no_claims_for_level0",
        costEur: 0,
        createdAt: new Date(),
      });
      continue;
    }

    try {
      const res = await fetch(`${publicOrigin()}/api/factcheck/enqueue`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-role": "admin",
        },
        body: JSON.stringify({
          draftId: item.draftId,
          contributionId: item.candidateId,
          claims: claims.length ? claims : undefined,
          withSerp: useSerp,
        }),
      });
      const bodyJson = await res.json().catch(() => ({}));
      if (!res.ok || !bodyJson?.ok) {
        errors += 1;
        await logPilotRunReceipt({
          runId,
          candidateId: item.candidateId,
          draftId: item.draftId,
          topic: item.topic ?? null,
          checkLevel,
          status: "error",
          reason: bodyJson?.error ?? `http_${res.status}`,
          costEur: 0,
          createdAt: new Date(),
        });
        continue;
      }

      const fallbackCost = checkLevel >= 2 ? 2 : checkLevel === 1 ? 1 : 0;
      const costEur = typeof bodyJson?.costEur === "number" ? bodyJson.costEur : fallbackCost;
      factchecked += 1;

      await logPilotRunReceipt({
        runId,
        candidateId: item.candidateId,
        draftId: item.draftId,
        topic: item.topic ?? null,
        checkLevel,
        status: "factchecked",
        costEur,
        jobId: bodyJson?.jobId ?? null,
        createdAt: new Date(),
      });
    } catch (error: any) {
      errors += 1;
      await logPilotRunReceipt({
        runId,
        candidateId: item.candidateId,
        draftId: item.draftId,
        topic: item.topic ?? null,
        checkLevel,
        status: "error",
        reason: error?.message ?? "factcheck_failed",
        costEur: 0,
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    runId,
    settings,
    feeds: feedResult,
    analyzed: analyzeResult.analyzed,
    analysisErrors: analyzeResult.errors,
    factchecked,
    skipped,
    errors,
  });
}
