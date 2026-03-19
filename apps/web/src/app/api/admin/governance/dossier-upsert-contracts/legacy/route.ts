import { NextRequest, NextResponse } from "next/server";
import { listLegacyDossierUpsertContractsAuthorized } from "@features/dossier/protocolUpsert";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { mapGovernanceContractError } from "../../contractsError";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  if (limitRaw && Number.isFinite(limit) === false) {
    return NextResponse.json({ ok: false, error: "invalid_limit" }, { status: 400 });
  }

  try {
    const items = await listLegacyDossierUpsertContractsAuthorized(gate.actor, { limit });
    return NextResponse.json({ ok: true, items });
  } catch (error: unknown) {
    const mapped = mapGovernanceContractError(error);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}
