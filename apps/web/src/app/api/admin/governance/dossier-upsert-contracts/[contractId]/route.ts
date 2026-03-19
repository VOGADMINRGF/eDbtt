import { NextRequest, NextResponse } from "next/server";
import { getDossierUpsertContractAuthorized } from "@features/dossier/protocolUpsert";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { mapGovernanceContractError } from "../../contractsError";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ contractId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { contractId } = await context.params;

  try {
    const contract = await getDossierUpsertContractAuthorized(gate.actor, contractId);
    return NextResponse.json({ ok: true, contract });
  } catch (error: unknown) {
    const mapped = mapGovernanceContractError(error);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}
