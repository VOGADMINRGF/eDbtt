import { NextResponse } from "next/server";
import { shouldAllowDemoDossierFallback } from "@/features/runtimeDataGuardrails";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VoteBody = {
  optionId?: string;
};

function readId(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const dossierId = readId(id);
  const body = (await req.json().catch(() => ({}))) as VoteBody;
  const optionId = readId(body.optionId);

  if (!dossierId) {
    return NextResponse.json({ ok: false, error: "dossierId_missing" }, { status: 400 });
  }

  if (!optionId) {
    return NextResponse.json({ ok: false, error: "optionId_missing" }, { status: 400 });
  }

  if (shouldAllowDemoDossierFallback(dossierId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "use_demo_vote_route",
        message: "Demo-Abstimmungen müssen über die explizite Demo-Route laufen.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "vote_runtime_unavailable",
      message: "Die Abstimmungsruntime für dieses Dossier ist aktuell nicht verfügbar.",
      dossierId,
      retryable: true,
    },
    { status: 503 },
  );
}
