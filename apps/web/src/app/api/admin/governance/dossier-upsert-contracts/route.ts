import { NextRequest, NextResponse } from "next/server";
import {
  listDossierUpsertContractsAuthorized,
  type ProtocolDossierUpsertStatus,
} from "@features/dossier/protocolUpsert";
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
    const items = await listDossierUpsertContractsAuthorized(gate.actor, {
      status,
      qrSetCode: req.nextUrl.searchParams.get("qrSetCode") ?? undefined,
      anlassraumId: req.nextUrl.searchParams.get("anlassraumId") ?? undefined,
      targetDossierId: req.nextUrl.searchParams.get("targetDossierId") ?? undefined,
      limit,
    });

    return NextResponse.json({ ok: true, items });
  } catch (error: unknown) {
    const mapped = mapGovernanceContractError(error);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}

function normalizeStatus(value: string | null): ProtocolDossierUpsertStatus | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "pending_review") return "pending_review";
  if (normalized === "partially_applied") return "partially_applied";
  if (normalized === "applied") return "applied";
  if (normalized === "rejected") return "rejected";
  return undefined;
}
