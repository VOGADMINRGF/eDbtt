import { NextRequest, NextResponse } from "next/server";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import { readSession } from "@/utils/session";
import { sendMail } from "@/utils/mailer";
import { publicOrigin } from "@/utils/publicOrigin";
import { buildEdebatePreorderMail } from "@/utils/emailTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const session = await readSession();

  const result = await createPreorderLead(
    json ?? {},
    { userId: session?.uid ?? null },
    {
      sendMail,
      publicOrigin,
      buildConfirmationMail: buildEdebatePreorderMail,
    },
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, mailSent: result.mailSent });
}
