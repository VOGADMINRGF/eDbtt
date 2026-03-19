import { NextRequest, NextResponse } from "next/server";
import {
  listRoundSeedContractsAuthorized,
  type RoundSeedContractStatus,
} from "@features/topicRound/seedContract";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { mapGovernanceContractError } from "../contractsError";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const statusRaw = req.nextUrl.searchParams.get("status");
  const status = normalizeStatus(statusRaw);
  if (statusRaw && !status) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  if (limitRaw && !Number.isFinite(limit)) {
    return NextResponse.json({ ok: false, error: "invalid_limit" }, { status: 400 });
  }

  try {
    const items = await listRoundSeedContractsAuthorized(gate.actor, {
      status,
      qrSetCode: req.nextUrl.searchParams.get("qrSetCode") ?? undefined,
      anlassraumId: req.nextUrl.searchParams.get("anlassraumId") ?? undefined,
      limit,
    });

    return NextResponse.json({ ok: true, items });
  } catch (error: unknown) {
    const mapped = mapGovernanceContractError(error);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}

function normalizeStatus(value: string | null): RoundSeedContractStatus | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "review_required") return "review_required";
  if (normalized === "draft_created") return "draft_created";
  if (normalized === "rejected") return "rejected";
  return undefined;
}
