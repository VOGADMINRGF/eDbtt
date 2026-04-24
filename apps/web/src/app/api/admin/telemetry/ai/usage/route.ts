import { NextRequest, NextResponse } from "next/server";
import { getAiUsageSnapshot } from "@core/telemetry/aiUsageSnapshot";
import type { AiPipelineName, AiProviderName } from "@core/telemetry/aiUsageTypes";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRange(value: string | null): number {
  switch (value) {
    case "7":
    case "week":
      return 7;
    case "90":
    case "quarter":
      return 90;
    case "30":
    case "month":
    default:
      return 30;
  }
}

function parseProvider(value: string | null): AiProviderName | null {
  if (!value || value === "all") return null;
  return value as AiProviderName;
}

function parsePipeline(value: string | null): AiPipelineName | null {
  if (!value || value === "all") return null;
  return value as AiPipelineName;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const { searchParams } = new URL(req.url);
    const rangeDays = parseRange(searchParams.get("range"));
    const region = searchParams.get("region");
    const provider = parseProvider(searchParams.get("provider"));
    const pipeline = parsePipeline(searchParams.get("pipeline"));
    const snapshot = await getAiUsageSnapshot(rangeDays, region, provider, pipeline, {
      budgetMonthlyEur: parsePositiveNumber(searchParams.get("budgetMonthlyEur")),
      projectedBudgetWarnPct: parsePositiveNumber(
        searchParams.get("projectedBudgetWarnPct"),
      ),
      errorRateWarnPct: parsePositiveNumber(searchParams.get("errorRateWarnPct")),
      avgDurationWarnMs: parsePositiveNumber(searchParams.get("avgDurationWarnMs")),
      costPerCallWarnEur: parsePositiveNumber(searchParams.get("costPerCallWarnEur")),
      fallbackRelianceWarnSharePct: parsePositiveNumber(
        searchParams.get("fallbackRelianceWarnSharePct"),
      ),
      researchHeavyWarnSharePct: parsePositiveNumber(
        searchParams.get("researchHeavyWarnSharePct"),
      ),
      sealedCostFootprintWarnSharePct: parsePositiveNumber(
        searchParams.get("sealedCostFootprintWarnSharePct"),
      ),
      timeoutWarnSharePct: parsePositiveNumber(searchParams.get("timeoutWarnSharePct")),
      badJsonWarnSharePct: parsePositiveNumber(searchParams.get("badJsonWarnSharePct")),
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error("[api] ai usage snapshot", error);
    return NextResponse.json({ ok: false, error: "usage snapshot failed" }, { status: 500 });
  }
}
