import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ResetSetSchema } from "@/utils/authSchemas";
import { consumeToken } from "@/utils/tokens";
import { coreCol, piiCol, ObjectId } from "@core/db/triMongo";
import { CREDENTIAL_COLLECTION } from "../sharedAuth";
import { orgMembershipsCol } from "@features/org/db";
import { hashInviteToken } from "@features/org/invite";
import { consumeOrgInviteSetupToken } from "@features/org/inviteDelivery";
import { recordAuditEvent } from "@features/audit/recordAuditEvent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { token, password, invite } = ResetSetSchema.parse(body);

  const resetUserId = await consumeToken(token, "reset");
  const orgSetup = resetUserId
    ? null
    : await consumeOrgInviteSetupToken(token);
  const uid = resetUserId ?? (orgSetup ? String(orgSetup.userId) : null);
  if (!uid)
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(password, rounds);

  const userId = ObjectId.createFromHexString(uid);
  const users = await coreCol("users");
  await users.updateOne({ _id: userId }, { $set: { passwordHash } });

  const creds = await piiCol(CREDENTIAL_COLLECTION);
  await creds.updateOne(
    { coreUserId: userId },
    {
      $set: { passwordHash },
      $setOnInsert: { coreUserId: userId },
      $currentDate: { updatedAt: true },
    },
    { upsert: true },
  );

  if (orgSetup) {
    try {
      const memberships = await orgMembershipsCol();
      const now = new Date();
      const membership = await memberships.findOne({
        _id: orgSetup.membershipId,
        userId,
        status: "invited",
        inviteSetupTokenHash: orgSetup.tokenHash,
        inviteSetupTokenExpiresAt: { $gt: now },
      });
      if (membership) {
        await memberships.updateOne(
          {
            _id: membership._id,
            status: "invited",
            inviteSetupTokenHash: orgSetup.tokenHash,
          },
          {
            $set: {
              status: "active",
              inviteTokenHash: null,
              inviteExpiresAt: null,
              inviteSetupTokenHash: null,
              inviteSetupTokenExpiresAt: null,
              updatedAt: now,
            },
          },
        );

        await recordAuditEvent({
          scope: "org",
          action: "org.invite.accept",
          actorUserId: String(userId),
          actorIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          target: { type: "org_membership", id: String(membership._id) },
          before: membership,
          after: { ...membership, status: "active" },
        });
      }
    } catch (err) {
      console.error("[auth.reset] org_setup_accept_failed", err);
    }
  } else if (invite) {
    try {
      const memberships = await orgMembershipsCol();
      const inviteTokenHash = hashInviteToken(invite);
      const now = new Date();
      const membership = await memberships.findOne({
        inviteTokenHash,
        status: "invited",
        inviteExpiresAt: { $gt: now },
        userId,
      });
      if (membership) {
        await memberships.updateOne(
          { _id: membership._id },
          {
            $set: {
              status: "active",
              inviteTokenHash: null,
              inviteExpiresAt: null,
              updatedAt: now,
            },
          },
        );

        await recordAuditEvent({
          scope: "org",
          action: "org.invite.accept",
          actorUserId: String(userId),
          actorIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          target: { type: "org_membership", id: String(membership._id) },
          before: membership,
          after: { ...membership, status: "active" },
        });
      }
    } catch (err) {
      console.error("[auth.reset] invite_accept_failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
