import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { coreCol, piiCol } from "@core/db/db/triMongo";
import { ObjectId, getCol, getDb } from "@core/db/triMongo";
import { createEmailVerificationToken } from "@core/auth/emailVerificationService";
import { logIdentityEvent } from "@core/telemetry/identityEvents";
import { buildSetPasswordMail, buildVerificationMail } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/mailer";
import {
  mailLocaleFromUser,
  type TransactionalMail,
} from "@/utils/mailRenderer";
import { publicOrigin } from "@/utils/publicOrigin";
import { createToken } from "@/utils/tokens";
import { resetEmailLink } from "@/utils/email";
import { CREDENTIAL_COLLECTION } from "@/app/api/auth/sharedAuth";
import { requireAdminOrResponse, userIsSuperadmin } from "@/lib/server/auth/admin";
import { recordAuditEvent } from "@features/audit/recordAuditEvent";
import {
  activeAccountFilter,
  adminAccessFilter,
  hasAdminAccess,
  hasSuperadminRole,
  isAccountDisabled,
  isQaAccountDoc,
  mapAdminDashboardUser,
  resolveUserRoles,
  superadminAccessFilter,
  type AdminDashboardCredentialDoc,
  type AdminDashboardUserDoc,
} from "../../shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionSchema = z
  .object({
    action: z.enum([
      "resend_verification",
      "send_password_link",
      "disable_account",
      "reactivate_account",
      "hard_delete_qa",
    ]),
    actionId: z.string().trim().min(1).max(120).optional(),
    confirmEmail: z.string().trim().optional(),
  })
  .strict();

type ActionUserDoc = AdminDashboardUserDoc & {
  profile?: { displayName?: string | null } | null;
  verification?: {
    twoFA?: {
      enabled?: boolean | null;
      secret?: string | null;
    } | null;
  } | null;
};

type AdminDashboardUserView = ReturnType<typeof mapAdminDashboardUser>;

type ReferenceHit = {
  collection: string;
  count: number;
};

type MailActionName = "resend_verification" | "send_password_link";

type AdminMailActionDoc = {
  _id?: ObjectId;
  actionId: string;
  action: MailActionName;
  actorUserId: ObjectId;
  targetUserId: ObjectId;
  status: "queued" | "succeeded" | "failed" | "succeeded_with_audit_failure";
  responseStatus?: number | null;
  responseBody?: Record<string, unknown> | null;
  errorCode?: string | null;
  messageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
};

type ReferenceCheck = {
  collection: string;
  store: "core" | "pii";
  filter: (input: { userId: string; email: string; objectId: ObjectId }) => Record<string, unknown>;
};

const QA_HARD_DELETE_REFERENCE_INVENTORY: ReferenceCheck[] = [
  {
    collection: "audit_events",
    store: "core",
    filter: ({ objectId }) => ({ "actor.userId": objectId }),
  },
  {
    collection: "identity_events",
    store: "core",
    filter: ({ userId }) => ({ userId }),
  },
  {
    collection: "activity_logs",
    store: "core",
    filter: ({ userId }) => ({ $or: [{ userId }, { "meta.byUserId": userId }] }),
  },
  {
    collection: "drafts",
    store: "core",
    filter: ({ userId }) => ({ $or: [{ userId }, { authorId: userId }] }),
  },
  {
    collection: "projects",
    store: "core",
    filter: ({ userId }) => ({ createdBy: userId }),
  },
  {
    collection: "stream_sessions",
    store: "core",
    filter: ({ userId }) => ({ creatorId: userId }),
  },
  {
    collection: "community_contributions",
    store: "core",
    filter: ({ userId }) => ({ authorId: userId }),
  },
  {
    collection: "dossier_watchlist",
    store: "core",
    filter: ({ userId }) => ({ userId }),
  },
  {
    collection: "user_credentials",
    store: "pii",
    filter: ({ objectId }) => ({ coreUserId: objectId }),
  },
  {
    collection: "household_invites",
    store: "pii",
    filter: ({ userId, email }) => ({ $or: [{ userId }, { email }] }),
  },
];

const SAFE_QA_ACCOUNT_ROLES = new Set(["guest", "user", "verified"]);
const MAIL_ACTION_COLLECTION = "admin_user_mail_actions";

let mailActionIndexesEnsured = false;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const actor = await requireAdminOrResponse(req);
  if (actor instanceof Response) return actor;

  const { userId } = await context.params;
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "missing_user" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const users = await getCol<ActionUserDoc>("users");
  const target = await users.findOne({ _id: new ObjectId(userId) });
  if (!target) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const credentials = await piiCol<AdminDashboardCredentialDoc>(CREDENTIAL_COLLECTION);
  const credential = await credentials.findOne(
    { coreUserId: target._id } as any,
    {
      projection: {
        coreUserId: 1,
        passwordHash: 1,
        twoFactorEnabled: 1,
        otpSecret: 1,
        twoFactorMethod: 1,
      },
    },
  );

  const action = parsed.data.action;
  const actorUserId = String((actor as any)._id);
  const actorIsSuperadmin = userIsSuperadmin(actor as any);
  const targetRoles = resolveUserRoles(target);
  const before = mapAdminDashboardUser(target, credential);

  const reject = async (
    status: number,
    error: string,
    options?: { reason?: string | null; extra?: Record<string, unknown> },
  ) => {
    await auditLifecycleAction({
      req,
      actorUserId,
      action,
      target,
      result: "rejected",
      before,
      after: options?.extra,
      reason: options?.reason ?? error,
    });
    return NextResponse.json({ ok: false, error, ...options?.extra }, { status });
  };

  if (hasSuperadminRole(targetRoles) && !actorIsSuperadmin) {
    return reject(403, "forbidden_superadmin");
  }

  if ((action === "disable_account" || action === "hard_delete_qa") && actorUserId === userId) {
    return reject(422, action === "disable_account" ? "self_disable_forbidden" : "self_delete_forbidden");
  }

  if (action === "resend_verification") {
    if (before.emailVerified) {
      await auditLifecycleAction({
        req,
        actorUserId,
        action,
        target,
        result: "success",
        before,
        after: { alreadyVerified: true },
        reason: "already_verified",
      });
      return NextResponse.json({ ok: true, verificationMailQueued: false, alreadyVerified: true, user: before });
    }

    return handleMailAction({
      req,
      action,
      actionId: parsed.data.actionId?.trim() || null,
      actorUserId,
      target,
      before,
      buildMessage: async () => {
        const { rawToken } = await createEmailVerificationToken(target._id, target.email);
        const origin = publicOrigin();
        const verifyUrl = `${origin.replace(/\/$/, "")}/register/verify-email?token=${encodeURIComponent(
          rawToken,
        )}&email=${encodeURIComponent(target.email)}`;
        const mail = buildVerificationMail({
          verifyUrl,
          displayName: target.profile?.displayName ?? target.name ?? null,
          locale: mailLocaleFromUser(target),
        });

        return {
          mail,
          responseKey: "verificationMailQueued" as const,
          after: { verificationMailQueued: true },
          afterSend: async () => {
            await logIdentityEvent("identity_email_verify_start", {
              userId,
              meta: { source: "admin_resend", email: target.email },
            });
          },
        };
      },
    });
  }

  if (action === "send_password_link") {
    return handleMailAction({
      req,
      action,
      actionId: parsed.data.actionId?.trim() || null,
      actorUserId,
      target,
      before,
      buildMessage: async () => {
        const rawToken = await createToken(String(target._id), "reset", 60);
        const resetUrl = resetEmailLink(rawToken);
        const mail = buildSetPasswordMail({
          resetUrl,
          displayName: target.profile?.displayName ?? target.name ?? null,
          locale: mailLocaleFromUser(target),
        });

        return {
          mail,
          responseKey: "passwordMailQueued" as const,
          after: { passwordMailQueued: true },
        };
      },
    });
  }

  if (action === "disable_account") {
    const roleProtection = await getAdminDisableProtection(users, target);
    if (roleProtection) {
      return reject(422, roleProtection);
    }

    if (isAccountDisabled(target)) {
      const updated = await users.findOne({ _id: target._id });
      const after = updated ? mapAdminDashboardUser(updated, credential) : { ...before, accountDisabled: true };
      await auditLifecycleAction({
        req,
        actorUserId,
        action,
        target,
        result: "success",
        before,
        after,
      });
      return NextResponse.json({ ok: true, accountDisabled: true, user: after });
    }

    return completeStatusChange({
      req,
      users,
      actorUserId,
      action,
      target,
      before,
      credential,
      update: {
        $set: {
          suspended: true,
          suspendedAt: new Date(),
          suspendedReason: "admin_disabled",
          sessionRevokedAt: new Date(),
        },
        $currentDate: { updatedAt: true },
      },
      successBody: (after) => ({ ok: true, accountDisabled: true, user: after }),
      partialError: "account_disabled_audit_failed",
      ensureAllowed: (options) => getAdminDisableProtection(users, target, options),
    });
  }

  if (action === "reactivate_account") {
    if (!isAccountDisabled(target)) {
      await auditLifecycleAction({
        req,
        actorUserId,
        action,
        target,
        result: "success",
        before,
        after: before,
      });
      return NextResponse.json({ ok: true, accountReactivated: true, user: before });
    }

    return completeStatusChange({
      req,
      users,
      actorUserId,
      action,
      target,
      before,
      credential,
      update: {
        $set: {
          suspended: false,
          suspendedAt: null,
          suspendedReason: null,
          disabledAt: null,
        },
        $currentDate: { updatedAt: true },
      },
      successBody: (after) => ({ ok: true, accountReactivated: true, user: after }),
      partialError: "account_reactivated_audit_failed",
    });
  }

  if (!actorIsSuperadmin) {
    return reject(403, "superadmin_required");
  }

  const roleProtection = await getAdminDisableProtection(users, target);
  if (roleProtection) {
    return reject(422, roleProtection);
  }

  if (!isQaAccountDoc(target)) {
    return reject(422, "hard_delete_requires_qa_account");
  }

  if (targetRoles.some((role) => !SAFE_QA_ACCOUNT_ROLES.has(role))) {
    return reject(422, "account_has_productive_roles");
  }

  const confirmedEmail = normalizeEmail(parsed.data.confirmEmail ?? "");
  if (!confirmedEmail || confirmedEmail !== normalizeEmail(target.email)) {
    return reject(422, "email_confirmation_mismatch");
  }

  const referenceHits = await findReferenceHits(userId, target.email);
  if (referenceHits.length > 0) {
    return reject(409, "account_has_references", {
      extra: {
        referenceCollections: referenceHits.map((entry) => entry.collection),
      },
    });
  }

  return reject(409, "hard_delete_unavailable", {
    reason: "reference_inventory_incomplete",
    extra: {
      hardDeleteAvailable: false,
      referenceInventory: QA_HARD_DELETE_REFERENCE_INVENTORY.map((entry) => entry.collection),
    },
  });
}

async function handleMailAction(input: {
  req: NextRequest;
  action: MailActionName;
  actionId: string | null;
  actorUserId: string;
  target: ActionUserDoc;
  before: AdminDashboardUserView;
  buildMessage: () => Promise<{
    mail: TransactionalMail;
    responseKey: "verificationMailQueued" | "passwordMailQueued";
    after: Record<string, unknown>;
    afterSend?: () => Promise<void>;
  }>;
}) {
  const actionId = input.actionId ?? crypto.randomUUID();
  const mailActions = await getMailActionsCollection();
  const reservation = await reserveMailAction(mailActions, {
    actionId,
    action: input.action,
    actorUserId: new ObjectId(input.actorUserId),
    targetUserId: input.target._id,
  });

  if (reservation.kind === "conflict") {
    return NextResponse.json({ ok: false, error: "action_id_conflict" }, { status: 409 });
  }
  if (reservation.kind === "replay" && reservation.doc.responseStatus && reservation.doc.responseBody) {
    return NextResponse.json(reservation.doc.responseBody, { status: reservation.doc.responseStatus });
  }
  if (reservation.kind === "pending") {
    return NextResponse.json({ ok: false, error: "mail_action_in_progress" }, { status: 409 });
  }

  try {
    await auditLifecycleAction({
      req: input.req,
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target,
      result: "queued",
      before: input.before,
      after: { actionId },
    });
  } catch {
    const body = { ok: false, error: "mail_action_unavailable", actionId };
    await finalizeMailAction(mailActions, actionId, {
      status: "failed",
      responseStatus: 500,
      responseBody: body,
      errorCode: "audit_queue_failed",
      messageId: null,
    });
    return NextResponse.json(body, { status: 500 });
  }

  let message:
    | Awaited<ReturnType<typeof input.buildMessage>>
    | null = null;
  try {
    message = await input.buildMessage();
  } catch {
    const body = { ok: false, error: "mail_action_unavailable", actionId };
    await finalizeMailAction(mailActions, actionId, {
      status: "failed",
      responseStatus: 500,
      responseBody: body,
      errorCode: "token_issue_failed",
      messageId: null,
    });
    await safeAuditLifecycleAction({
      req: input.req,
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target,
      result: "failed",
      before: input.before,
      after: { actionId },
      reason: "token_issue_failed",
    });
    return NextResponse.json(body, { status: 500 });
  }

  const mailResult = await sendMail({
    to: input.target.email,
    mail: message.mail,
    delivery: "required_delivery",
    tag: input.action,
  });
  if (!mailResult.ok) {
    const mailFailure = mailResult as Extract<Awaited<ReturnType<typeof sendMail>>, { ok: false }>;
    const body = {
      ok: false,
      error: mailFailure.code === "mail_transport_unavailable" ? "mail_delivery_unavailable" : "mail_delivery_failed",
      actionId,
    };
    await finalizeMailAction(mailActions, actionId, {
      status: "failed",
      responseStatus: 502,
      responseBody: body,
      errorCode: body.error,
      messageId: mailFailure.messageId,
    });
    await safeAuditLifecycleAction({
      req: input.req,
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target,
      result: "failed",
      before: input.before,
      after: { actionId, deliveryFailed: true },
      reason: body.error,
    });
    return NextResponse.json(body, { status: 502 });
  }

  await message.afterSend?.().catch(() => {});

  const successBody = {
    ok: true,
    actionId,
    [message.responseKey]: true,
    user: input.before,
  };
  await finalizeMailAction(mailActions, actionId, {
    status: "succeeded",
    responseStatus: 200,
    responseBody: successBody,
    errorCode: null,
    messageId: mailResult.messageId,
  });

  try {
    await auditLifecycleAction({
      req: input.req,
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target,
      result: "success",
      before: input.before,
      after: { ...message.after, actionId },
    });
  } catch {
    const partialBody = {
      ok: false,
      error: "mail_sent_audit_failed",
      partial: true,
      actionId,
      [message.responseKey]: true,
      user: input.before,
    };
    await finalizeMailAction(mailActions, actionId, {
      status: "succeeded_with_audit_failure",
      responseStatus: 500,
      responseBody: partialBody,
      errorCode: "mail_sent_audit_failed",
      messageId: mailResult.messageId,
    });
    return NextResponse.json(partialBody, { status: 500 });
  }

  return NextResponse.json(successBody);
}

async function completeStatusChange(input: {
  req: NextRequest;
  users: Awaited<ReturnType<typeof getCol<ActionUserDoc>>>;
  actorUserId: string;
  action: "disable_account" | "reactivate_account";
  target: ActionUserDoc;
  before: AdminDashboardUserView;
  credential: AdminDashboardCredentialDoc | null;
  update: Record<string, unknown>;
  successBody: (after: AdminDashboardUserView) => Record<string, unknown>;
  partialError: string;
  ensureAllowed?: (options?: { mongoSession?: any }) => Promise<string | null>;
}) {
  const db = await getDb("core");
  const client = (db as any)?.client;

  if (client?.startSession) {
    const mongoSession = client.startSession();
    try {
      let after = input.before;
      await mongoSession.withTransaction(async () => {
        const guardError = await input.ensureAllowed?.({ mongoSession });
        if (guardError) {
          throw new StatusChangeGuardError(guardError, 422);
        }
        await input.users.updateOne({ _id: input.target._id }, input.update, { session: mongoSession } as any);
        const updated = await input.users.findOne({ _id: input.target._id }, { session: mongoSession } as any);
        after = updated ? mapAdminDashboardUser(updated, input.credential) : input.before;
        await auditLifecycleAction({
          req: input.req,
          actorUserId: input.actorUserId,
          action: input.action,
          target: input.target,
          result: "success",
          before: input.before,
          after,
          mongoSession,
        });
      });
      return NextResponse.json(input.successBody(after));
    } catch (error) {
      if (error instanceof StatusChangeGuardError) {
        return NextResponse.json({ ok: false, error: error.code }, { status: error.status });
      }
      return NextResponse.json({ ok: false, error: "status_change_unavailable" }, { status: 500 });
    } finally {
      await mongoSession.endSession();
    }
  }

  const guardError = await input.ensureAllowed?.();
  if (guardError) {
    return NextResponse.json({ ok: false, error: guardError }, { status: 422 });
  }

  await input.users.updateOne({ _id: input.target._id }, input.update);
  const updated = await input.users.findOne({ _id: input.target._id });
  const after = updated ? mapAdminDashboardUser(updated, input.credential) : input.before;

  try {
    await auditLifecycleAction({
      req: input.req,
      actorUserId: input.actorUserId,
      action: input.action,
      target: input.target,
      result: "success",
      before: input.before,
      after,
    });
    return NextResponse.json(input.successBody(after));
  } catch {
    const successBody = input.successBody(after);
    return NextResponse.json({
      ...successBody,
      ok: false,
      error: input.partialError,
      partial: true,
      auditRecorded: false,
    }, { status: 500 });
  }
}

async function getMailActionsCollection() {
  const col = await coreCol<AdminMailActionDoc>(MAIL_ACTION_COLLECTION);
  if (!mailActionIndexesEnsured) {
    await col.createIndex({ actionId: 1 }, { unique: true, name: "action_id_unique" });
    mailActionIndexesEnsured = true;
  }
  return col;
}

async function reserveMailAction(
  col: Awaited<ReturnType<typeof getMailActionsCollection>>,
  input: Pick<AdminMailActionDoc, "actionId" | "action" | "actorUserId" | "targetUserId">,
) {
  const now = new Date();
  try {
    await col.insertOne({
      ...input,
      status: "queued",
      responseStatus: null,
      responseBody: null,
      errorCode: null,
      messageId: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    } as AdminMailActionDoc);
    return { kind: "new" as const };
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const existing = await col.findOne({ actionId: input.actionId });
    if (!existing) return { kind: "pending" as const };
    if (
      existing.action !== input.action ||
      String(existing.actorUserId) !== String(input.actorUserId) ||
      String(existing.targetUserId) !== String(input.targetUserId)
    ) {
      return { kind: "conflict" as const, doc: existing };
    }
    if (existing.responseStatus && existing.responseBody) {
      return { kind: "replay" as const, doc: existing };
    }
    return { kind: "pending" as const, doc: existing };
  }
}

async function finalizeMailAction(
  col: Awaited<ReturnType<typeof getMailActionsCollection>>,
  actionId: string,
  input: Pick<AdminMailActionDoc, "status" | "responseStatus" | "responseBody" | "errorCode" | "messageId">,
) {
  await col.updateOne(
    { actionId },
    {
      $set: {
        status: input.status,
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        errorCode: input.errorCode,
        messageId: input.messageId,
        completedAt: new Date(),
      },
      $currentDate: { updatedAt: true },
    },
  );
}

async function getAdminDisableProtection(
  users: Awaited<ReturnType<typeof getCol<ActionUserDoc>>>,
  target: ActionUserDoc,
  options?: { mongoSession?: any },
) {
  const latestTarget =
    options?.mongoSession
      ? ((await users.findOne(
          { _id: target._id },
          {
            projection: { roles: 1, role: 1, suspended: 1, suspendedAt: 1, disabledAt: 1 },
            session: options.mongoSession,
          } as any,
        )) as ActionUserDoc | null) ?? target
      : target;

  if (isAccountDisabled(latestTarget)) return null;

  const targetRoles = resolveUserRoles(latestTarget);
  if (!hasAdminAccess(targetRoles)) return null;

  const activeAdminCount = await users.countDocuments({
      _id: { $ne: target._id },
      ...activeAccountFilter(),
      ...adminAccessFilter(),
    } as any, options?.mongoSession ? ({ session: options.mongoSession } as any) : undefined);
  if (activeAdminCount <= 0) {
    return "last_admin_required";
  }

  if (hasSuperadminRole(targetRoles)) {
    const activeSuperadminCount = await users.countDocuments({
      _id: { $ne: target._id },
      ...activeAccountFilter(),
      ...superadminAccessFilter(),
    } as any, options?.mongoSession ? ({ session: options.mongoSession } as any) : undefined);
    if (activeSuperadminCount <= 0) {
      return "last_superadmin_required";
    }
  }

  return null;
}

async function findReferenceHits(userId: string, email: string): Promise<ReferenceHit[]> {
  const objectId = new ObjectId(userId);
  const hits: ReferenceHit[] = [];

  for (const entry of QA_HARD_DELETE_REFERENCE_INVENTORY) {
    try {
      const collection =
        entry.store === "core"
          ? await coreCol(entry.collection)
          : await piiCol(entry.collection);
      const count = await collection.countDocuments(entry.filter({ userId, email, objectId }) as any);
      if (count > 0) {
        hits.push({ collection: entry.collection, count });
      }
    } catch {
      // Fail closed in the caller if inventory cannot be proven complete.
    }
  }

  return hits;
}

async function auditLifecycleAction(input: {
  req: NextRequest;
  actorUserId: string;
  action: string;
  target: ActionUserDoc;
  result?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  mongoSession?: any;
}) {
  await recordAuditEvent({
    scope: "admin",
    action: `admin.user.${input.action}`,
    actorUserId: input.actorUserId,
    actorIp: getRequestIp(input.req),
    target: { type: "user", id: String(input.target._id) },
    result: input.result ?? null,
    before: input.before,
    after: input.after,
    reason: input.reason ?? null,
  }, {
    mongoSession: input.mongoSession ?? null,
  });
}

async function safeAuditLifecycleAction(input: Parameters<typeof auditLifecycleAction>[0]) {
  try {
    await auditLifecycleAction(input);
  } catch {
    // Secondary audit attempts must not hide the primary error state.
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getRequestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

class StatusChangeGuardError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "StatusChangeGuardError";
  }
}
