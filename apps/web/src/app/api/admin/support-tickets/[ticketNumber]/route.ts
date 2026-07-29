import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  CREATE_SUPPORT_TICKET_STATUSES,
  getCreateSupportTicketByNumberForAdmin,
  transitionCreateSupportTicketStatus,
} from "@/features/support/createSupportTickets";

const UpdateSchema = z.object({
  status: z.enum(CREATE_SUPPORT_TICKET_STATUSES),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { ticketNumber } = await params;
  const ticket = await getCreateSupportTicketByNumberForAdmin(ticketNumber);
  if (!ticket) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ticket });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const { ticketNumber } = await params;
  const ticket = await transitionCreateSupportTicketStatus({
    ticketNumber,
    status: parsed.data.status,
    actorId: gate._id.toString(),
  });
  if (!ticket) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ticket });
}
