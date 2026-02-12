import { NextRequest, NextResponse } from "next/server";
import { coreCol, ObjectId, piiCol } from "@core/db/triMongo";
import type { MembershipApplication, MembershipStatus } from "@core/memberships/types";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { logMembershipStatusUpdated } from "@core/telemetry/identityEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipRow = {
  id: string;
  userId: string;
  amountPerPeriod: number;
  rhythm: string;
  householdSize: number;
  status: MembershipStatus;
  createdAt: string | null;
};

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const col = await coreCol<MembershipApplication>("membership_applications");
  const items = await col
    .find(
      {},
      {
        projection: {
          coreUserId: 1,
          amountPerPeriod: 1,
          rhythm: 1,
          householdSize: 1,
          status: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const data: MembershipRow[] = items.map((m) => {
    const status = (m as any).status as MembershipStatus | undefined;
    return {
      id: String(m._id),
      userId: String(m.coreUserId),
      amountPerPeriod: m.amountPerPeriod,
      rhythm: m.rhythm,
      householdSize: m.householdSize,
      status: status ?? "pending",
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : null,
    };
  });

  return NextResponse.json({ ok: true, items: data });
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const status = body?.status as string | undefined;
  if (!id || !ObjectId.isValid(id) || !status) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const col = await coreCol<MembershipApplication>("membership_applications");
  const application = await col.findOne({ _id: new ObjectId(id) });
  if (!application) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  const now = new Date();
  await col.updateOne(
    { _id: application._id },
    { $set: { status: status as MembershipStatus, updatedAt: now } },
  );

  const Users = await coreCol("users");
  const membershipUpdate: Record<string, any> = {
    "membership.status": status as MembershipStatus,
    updatedAt: now,
  };
  if (status === "active") {
    membershipUpdate["membership.activatedAt"] = now;
  }
  if (status === "cancelled" || status === "household_locked") {
    membershipUpdate["membership.cancelledAt"] = now;
    membershipUpdate["membership.cancelledReason"] = "admin_status_change";
  }
  await Users.updateOne(
    { _id: application.coreUserId },
    { $set: membershipUpdate },
  );

  if (status === "cancelled" || status === "household_locked") {
    const invitesCol = await piiCol("household_invites");
    await invitesCol.updateMany(
      { membershipId: application._id, status: "pending" },
      { $set: { status: "revoked", updatedAt: now, expiresAt: now } },
    );
  }

  await logMembershipStatusUpdated({
    userId: String(application.coreUserId),
    membershipId: String(application._id),
    status,
  }).catch((err) => {
    console.error("[membership.admin] logMembershipStatusUpdated failed", err);
  });
  return NextResponse.json({ ok: true });
}
