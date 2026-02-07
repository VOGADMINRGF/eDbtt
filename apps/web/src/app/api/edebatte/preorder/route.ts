import { NextRequest, NextResponse } from "next/server";
import { createPreorderLead } from "@features/pricing/usecases/createPreorderLead";
import { readSession } from "@/utils/session";
import { sendMail as sendMailInternal } from "@/utils/mailer";
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
      sendMail: async ({ to, subject, html, text }) => {
        await sendMailInternal({ to, subject, html, text });
      },
      publicOrigin,
      buildConfirmationMail: buildEdebatePreorderMail,
    },
  );

  if (!result.ok) {
    const error = "error" in result ? result.error : "invalid_input";
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, mailSent: result.mailSent });
}
