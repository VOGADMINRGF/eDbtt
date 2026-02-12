import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId, coreCol, piiCol } from "@core/db/triMongo";
import { z } from "zod";
import type { HouseholdInvite } from "@core/pii/households/types";
import { safeRandomId } from "@core/utils/random";
import type { MembershipApplication } from "@core/memberships/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  membershipId: z.string().min(8),
  members: z
    .array(
      z.object({
        email: z.string().email(),
        givenName: z.string().min(1).max(120).optional(),
        familyName: z.string().min(1).max(160).optional(),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const now = new Date();
  const membershipObjectId = new ObjectId(parsed.data.membershipId);
  const Applications = await coreCol<MembershipApplication>("membership_applications");
  const application = await Applications.findOne({
    _id: membershipObjectId,
    coreUserId: new ObjectId(userId),
  });
  if (!application) {
    return NextResponse.json({ ok: false, error: "membership_not_found" }, { status: 404 });
  }
  if (["cancelled", "household_locked", "rejected"].includes(application.status)) {
    return NextResponse.json({ ok: false, error: "membership_locked" }, { status: 409 });
  }
  const invitesCol = await piiCol<HouseholdInvite>("household_invites");

  const invites: HouseholdInvite[] = parsed.data.members.map((m) => ({
    _id: new ObjectId(),
    membershipId: membershipObjectId,
    coreUserId: new ObjectId(userId),
    targetEmail: m.email,
    targetGivenName: m.givenName ?? null,
    targetFamilyName: m.familyName ?? null,
    token: safeRandomId(),
    status: "pending",
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  }));

  await invitesCol.insertMany(invites);

  return NextResponse.json({
    ok: true,
    data: { invitesCreated: invites.length },
  });
}
