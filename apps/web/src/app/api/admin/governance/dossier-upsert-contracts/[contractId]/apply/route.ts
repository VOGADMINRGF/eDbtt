import { NextRequest, NextResponse } from "next/server";
import { applyDossierUpsertContractAuthorized } from "@features/dossier/protocolUpsert";
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
    targetDossierId?: string | null;
    actionNote?: string | null;
    selection?: {
      summary?: boolean;
      openQuestionIndexes?: number[];
      decisionIndexes?: number[];
      nextStepIndexes?: number[];
    };
  };

  try {
    const result = await applyDossierUpsertContractAuthorized({
      contractId,
      actor: gate.actor,
      targetDossierId: normalizeOptionalString(body.targetDossierId),
      actionNote: normalizeOptionalString(body.actionNote),
      selection: body.selection
        ? {
            summary: typeof body.selection.summary === "boolean" ? body.selection.summary : undefined,
            openQuestionIndexes: normalizeIndexes(body.selection.openQuestionIndexes),
            decisionIndexes: normalizeIndexes(body.selection.decisionIndexes),
            nextStepIndexes: normalizeIndexes(body.selection.nextStepIndexes),
          }
        : undefined,
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

function normalizeIndexes(value: number[] | undefined): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry));
  return out.length > 0 ? out : undefined;
}
