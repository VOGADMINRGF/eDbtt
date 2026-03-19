import { NextRequest, NextResponse } from "next/server";
import { rejectDossierUpsertContractAuthorized } from "@features/dossier/protocolUpsert";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import { mapGovernanceContractError } from "../../../contractsError";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ contractId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { contractId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    reason?: string | null;
  };

  try {
    const result = await rejectDossierUpsertContractAuthorized({
      contractId,
      actor: gate.actor,
      reason: normalizeOptionalString(body.reason),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const mapped = mapGovernanceContractError(error);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}
