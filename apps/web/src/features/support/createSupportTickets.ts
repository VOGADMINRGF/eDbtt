import "server-only";

import crypto from "node:crypto";
import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { getAccountOverview } from "@features/account/service";
import { sendMail } from "@/utils/mailer";
import type {
  CreateSupportHandoffPublic,
  CreateSupportTicketPublic,
} from "@/features/support/createSupportTicketContract";

export type {
  CreateSupportHandoffPublic,
  CreateSupportTicketPublic,
} from "@/features/support/createSupportTicketContract";

export const CREATE_SUPPORT_TICKET_STATUSES = [
  "open",
  "investigating",
  "resolved",
  "closed",
] as const;

export type CreateSupportTicketStatus =
  (typeof CREATE_SUPPORT_TICKET_STATUSES)[number];

export type CreateSupportNotificationStatus =
  | "pending"
  | "in_app_created"
  | "email_sent"
  | "email_failed"
  | "not_applicable";

export type CreateSupportTicketRecord = {
  id: string;
  ticketNumber: string;
  status: CreateSupportTicketStatus;
  affectedUserId: string | null;
  anonymousSessionId: string | null;
  route: "/create";
  orchestrationPhase: string;
  correlationId: string;
  traceId: string;
  technicalErrorCode: string;
  technicalDiagnosis: {
    provider: string | null;
    reason: string;
    providerErrorCode: string | null;
    attemptCount: number;
  };
  failureFingerprint: string;
  draftId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  notificationRecipientLinked: boolean;
  notificationStatus: CreateSupportNotificationStatus;
};

export type AccountSupportNotification = {
  id: string;
  userId: string;
  type: "support_ticket_resolved";
  ticketId: string;
  ticketNumber: string;
  title: string;
  body: string;
  href: string;
  locale: "de" | "en";
  createdAt: string;
  readAt: string | null;
  emailDeliveryStatus: "not_attempted" | "sent" | "failed";
  emailMessageId: string | null;
};

type TicketAuditEvent = {
  id: string;
  ticketId: string;
  ticketNumber: string;
  action: "created" | "status_changed" | "notification_created";
  actorId: string;
  fromStatus: CreateSupportTicketStatus | null;
  toStatus: CreateSupportTicketStatus;
  createdAt: string;
};

type TicketRepository = {
  ensure(record: CreateSupportTicketRecord): Promise<{
    record: CreateSupportTicketRecord;
    created: boolean;
  }>;
  findByNumber(ticketNumber: string): Promise<CreateSupportTicketRecord | null>;
  listByUser(userId: string, limit: number): Promise<CreateSupportTicketRecord[]>;
  listNotifications(
    userId: string,
    limit: number,
  ): Promise<AccountSupportNotification[]>;
  updateStatus(input: {
    ticketNumber: string;
    status: CreateSupportTicketStatus;
    updatedAt: string;
    resolvedAt: string | null;
  }): Promise<CreateSupportTicketRecord | null>;
  updateNotification(input: {
    ticketNumber: string;
    status: CreateSupportNotificationStatus;
    updatedAt: string;
  }): Promise<CreateSupportTicketRecord | null>;
  upsertNotification(notification: AccountSupportNotification): Promise<void>;
  appendAudit(event: TicketAuditEvent): Promise<void>;
};

const TICKETS_COLLECTION = "support_tickets";
const NOTIFICATIONS_COLLECTION = "account_notifications";
const AUDIT_COLLECTION = "support_ticket_audit";

let repoSingleton: TicketRepository | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeSafeCode(value: unknown, fallback: string) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, "_")
    .slice(0, 96);
  return normalized || fallback;
}

function normalizeOptionalId(value: unknown) {
  const normalized = String(value ?? "").trim().slice(0, 160);
  return normalized || null;
}

function normalizeLocale(value: unknown): "de" | "en" {
  return String(value ?? "").toLowerCase().startsWith("en") ? "en" : "de";
}

function localizedCopy(locale: "de" | "en", ticketNumber: string) {
  if (locale === "en") {
    return {
      safeUserMessage:
        "Your contribution is saved. The analysis could not be completed. The incident was handed over to our IT team.",
      notificationTitle: `Ticket ${ticketNumber} has been resolved`,
      notificationBody:
        "The technical incident affecting your contribution has been resolved. You can continue your saved draft.",
      emailSubject: `eDebatte: Ticket ${ticketNumber} has been resolved`,
    };
  }
  return {
    safeUserMessage:
      "Dein Beitrag ist gespeichert. Die Analyse konnte nicht abgeschlossen werden. Der Fall wurde an unser IT-Team übergeben.",
    notificationTitle: `Ticket ${ticketNumber} wurde gelöst`,
    notificationBody:
      "Der technische Fall zu deinem Beitrag wurde gelöst. Du kannst deinen gespeicherten Arbeitsstand fortsetzen.",
    emailSubject: `eDebatte: Ticket ${ticketNumber} wurde gelöst`,
  };
}

function buildTicketNumber(createdAt: string, fingerprint: string) {
  const compactDate = createdAt.slice(0, 10).replaceAll("-", "");
  return `EDB-${compactDate}-${fingerprint.slice(0, 8).toUpperCase()}`;
}

async function ensureIndexes() {
  if (indexesReady) return;
  const tickets = await coreCol(TICKETS_COLLECTION);
  const notifications = await coreCol(NOTIFICATIONS_COLLECTION);
  const audit = await coreCol(AUDIT_COLLECTION);
  await Promise.all([
    tickets.createIndex({ failureFingerprint: 1 }, { unique: true }),
    tickets.createIndex({ ticketNumber: 1 }, { unique: true }),
    tickets.createIndex({ affectedUserId: 1, createdAt: -1 }),
    notifications.createIndex({ id: 1 }, { unique: true }),
    notifications.createIndex({ userId: 1, createdAt: -1 }),
    audit.createIndex({ ticketId: 1, createdAt: -1 }),
  ]);
  indexesReady = true;
}

function createMongoRepo(): TicketRepository {
  return {
    async ensure(record) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const result = await tickets.findOneAndUpdate(
        { failureFingerprint: record.failureFingerprint },
        { $setOnInsert: record },
        { upsert: true, returnDocument: "after" },
      );
      return {
        record: clone(result ?? record),
        created: Boolean(result?.id === record.id),
      };
    },
    async findByNumber(ticketNumber) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOne({ ticketNumber });
      return record ? clone(record) : null;
    },
    async listByUser(userId, limit) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const records = await tickets
        .find({ affectedUserId: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return records.map(clone);
    },
    async listNotifications(userId, limit) {
      await ensureIndexes();
      const notifications = await coreCol<AccountSupportNotification>(
        NOTIFICATIONS_COLLECTION,
      );
      const records = await notifications
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return records.map(clone);
    },
    async updateStatus(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        { ticketNumber: input.ticketNumber },
        {
          $set: {
            status: input.status,
            updatedAt: input.updatedAt,
            resolvedAt: input.resolvedAt,
          },
        },
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async updateNotification(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        { ticketNumber: input.ticketNumber },
        {
          $set: {
            notificationStatus: input.status,
            updatedAt: input.updatedAt,
          },
        },
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async upsertNotification(notification) {
      await ensureIndexes();
      const notifications = await coreCol<AccountSupportNotification>(
        NOTIFICATIONS_COLLECTION,
      );
      await notifications.updateOne(
        { id: notification.id },
        { $set: notification },
        { upsert: true },
      );
    },
    async appendAudit(event) {
      await ensureIndexes();
      const audit = await coreCol<TicketAuditEvent>(AUDIT_COLLECTION);
      await audit.updateOne(
        { id: event.id },
        { $setOnInsert: event },
        { upsert: true },
      );
    },
  };
}

export function createInMemoryCreateSupportTicketRepo(): TicketRepository {
  const tickets = new Map<string, CreateSupportTicketRecord>();
  const ticketByFingerprint = new Map<string, string>();
  const notifications = new Map<string, AccountSupportNotification>();
  const audit = new Map<string, TicketAuditEvent>();

  return {
    async ensure(record) {
      const existingNumber = ticketByFingerprint.get(record.failureFingerprint);
      if (existingNumber) {
        return { record: clone(tickets.get(existingNumber)!), created: false };
      }
      tickets.set(record.ticketNumber, clone(record));
      ticketByFingerprint.set(record.failureFingerprint, record.ticketNumber);
      return { record: clone(record), created: true };
    },
    async findByNumber(ticketNumber) {
      const record = tickets.get(ticketNumber);
      return record ? clone(record) : null;
    },
    async listByUser(userId, limit) {
      return Array.from(tickets.values())
        .filter((ticket) => ticket.affectedUserId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
        .map(clone);
    },
    async listNotifications(userId, limit) {
      return Array.from(notifications.values())
        .filter((notification) => notification.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
        .map(clone);
    },
    async updateStatus(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current) return null;
      const next = {
        ...current,
        status: input.status,
        updatedAt: input.updatedAt,
        resolvedAt: input.resolvedAt,
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async updateNotification(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current) return null;
      const next = {
        ...current,
        notificationStatus: input.status,
        updatedAt: input.updatedAt,
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async upsertNotification(notification) {
      notifications.set(notification.id, clone(notification));
    },
    async appendAudit(event) {
      if (!audit.has(event.id)) audit.set(event.id, clone(event));
    },
  };
}

function getRepo() {
  if (!repoSingleton) {
    repoSingleton = shouldUseInMemoryMongoFallback()
      ? createInMemoryCreateSupportTicketRepo()
      : createMongoRepo();
  }
  return repoSingleton;
}

export async function ensureCreateSupportTicket(input: {
  affectedUserId?: string | null;
  anonymousSessionId?: string | null;
  orchestrationPhase: string;
  correlationId: string;
  traceId?: string | null;
  technicalErrorCode: string;
  provider?: string | null;
  reason?: string | null;
  providerErrorCode?: string | null;
  attemptCount?: number;
  draftId?: string | null;
  locale?: string | null;
}): Promise<CreateSupportTicketPublic> {
  const createdAt = new Date().toISOString();
  const correlationId = normalizeSafeCode(input.correlationId, crypto.randomUUID());
  const technicalErrorCode = normalizeSafeCode(
    input.technicalErrorCode,
    "CREATE_ORCHESTRATION_FAILED",
  );
  const orchestrationPhase = normalizeSafeCode(
    input.orchestrationPhase,
    "intelligent_followup",
  );
  const affectedUserId = normalizeOptionalId(input.affectedUserId);
  const anonymousSessionId = affectedUserId
    ? null
    : normalizeOptionalId(input.anonymousSessionId);
  if (!affectedUserId && !anonymousSessionId) {
    throw new Error("create_support_ticket_actor_required");
  }
  const actorBinding = affectedUserId
    ? `user:${affectedUserId}`
    : `anonymous:${anonymousSessionId}`;
  const failureFingerprint = stableHash({
    route: "/create",
    actorBinding,
    correlationId,
    orchestrationPhase,
    technicalErrorCode,
  });
  const ticketNumber = buildTicketNumber(createdAt, failureFingerprint);
  const record: CreateSupportTicketRecord = {
    id: crypto.randomUUID(),
    ticketNumber,
    status: "open",
    affectedUserId,
    anonymousSessionId,
    route: "/create",
    orchestrationPhase,
    correlationId,
    traceId: normalizeSafeCode(input.traceId ?? correlationId, correlationId),
    technicalErrorCode,
    technicalDiagnosis: {
      provider: normalizeOptionalId(input.provider),
      reason: normalizeSafeCode(input.reason, "provider_error"),
      providerErrorCode: normalizeOptionalId(input.providerErrorCode),
      attemptCount: Math.min(2, Math.max(0, Number(input.attemptCount ?? 0))),
    },
    failureFingerprint,
    draftId: normalizeOptionalId(input.draftId),
    createdAt,
    updatedAt: createdAt,
    resolvedAt: null,
    notificationRecipientLinked: Boolean(affectedUserId),
    notificationStatus: affectedUserId ? "pending" : "not_applicable",
  };
  const ensured = await getRepo().ensure(record);
  if (ensured.created) {
    await getRepo().appendAudit({
      id: `support-audit-created-${ensured.record.id}`,
      ticketId: ensured.record.id,
      ticketNumber: ensured.record.ticketNumber,
      action: "created",
      actorId: "create_orchestration",
      fromStatus: null,
      toStatus: "open",
      createdAt,
    });
  }
  const locale = normalizeLocale(input.locale);
  return {
    ticketNumber: ensured.record.ticketNumber,
    status: ensured.record.status,
    safeUserMessage: localizedCopy(locale, ensured.record.ticketNumber).safeUserMessage,
    viewHref: ensured.record.affectedUserId
      ? `/account?ticket=${encodeURIComponent(
          ensured.record.ticketNumber,
        )}#support-tickets`
      : "",
    notificationLinked: ensured.record.notificationRecipientLinked,
  };
}

export async function getCreateSupportTicketForUser(
  ticketNumber: string,
  userId: string,
) {
  const ticket = await getRepo().findByNumber(ticketNumber.trim());
  if (!ticket || ticket.affectedUserId !== userId) return null;
  return ticket;
}

export async function getCreateSupportTicketByNumberForAdmin(ticketNumber: string) {
  return getRepo().findByNumber(ticketNumber.trim());
}

export async function listCreateSupportTicketsForUser(userId: string, limit = 10) {
  return getRepo().listByUser(userId, Math.min(25, Math.max(1, limit)));
}

export async function listCreateSupportNotificationsForUser(
  userId: string,
  limit = 5,
) {
  return getRepo().listNotifications(
    userId,
    Math.min(10, Math.max(1, limit)),
  );
}

export async function transitionCreateSupportTicketStatus(input: {
  ticketNumber: string;
  status: CreateSupportTicketStatus;
  actorId: string;
}) {
  const current = await getRepo().findByNumber(input.ticketNumber.trim());
  if (!current) return null;
  if (current.status === input.status) return current;

  const updatedAt = new Date().toISOString();
  const resolvedAt =
    input.status === "resolved" || input.status === "closed"
      ? current.resolvedAt ?? updatedAt
      : null;
  let updated = await getRepo().updateStatus({
    ticketNumber: current.ticketNumber,
    status: input.status,
    updatedAt,
    resolvedAt,
  });
  if (!updated) return null;

  await getRepo().appendAudit({
    id: `support-audit-status-${current.id}-${input.status}`,
    ticketId: current.id,
    ticketNumber: current.ticketNumber,
    action: "status_changed",
    actorId: normalizeSafeCode(input.actorId, "admin"),
    fromStatus: current.status,
    toStatus: input.status,
    createdAt: updatedAt,
  });

  if (
    input.status !== "resolved" ||
    current.status === "resolved" ||
    !updated.affectedUserId
  ) {
    return updated;
  }

  const overview = await getAccountOverview(updated.affectedUserId).catch(() => null);
  const locale = normalizeLocale(overview?.uiLocale ?? overview?.readingLocale);
  const copy = localizedCopy(locale, updated.ticketNumber);
  const notification: AccountSupportNotification = {
    id: `support-resolution-${updated.id}`,
    userId: updated.affectedUserId,
    type: "support_ticket_resolved",
    ticketId: updated.id,
    ticketNumber: updated.ticketNumber,
    title: copy.notificationTitle,
    body: copy.notificationBody,
    href: `/account?ticket=${encodeURIComponent(
      updated.ticketNumber,
    )}#support-tickets`,
    locale,
    createdAt: updatedAt,
    readAt: null,
    emailDeliveryStatus: "not_attempted",
    emailMessageId: null,
  };
  await getRepo().upsertNotification(notification);
  await getRepo().appendAudit({
    id: `support-audit-notification-${updated.id}`,
    ticketId: updated.id,
    ticketNumber: updated.ticketNumber,
    action: "notification_created",
    actorId: normalizeSafeCode(input.actorId, "admin"),
    fromStatus: "resolved",
    toStatus: "resolved",
    createdAt: updatedAt,
  });

  let notificationStatus: CreateSupportNotificationStatus = "in_app_created";
  if (overview?.email) {
    const mail = await sendMail({
      to: overview.email,
      subject: copy.emailSubject,
      text: copy.notificationBody,
      html: `<p>${copy.notificationBody}</p>`,
      tag: "support_ticket_resolved",
    });
    notification.emailDeliveryStatus = mail.ok ? "sent" : "failed";
    notification.emailMessageId = mail.messageId;
    await getRepo().upsertNotification(notification);
    notificationStatus = mail.ok ? "email_sent" : "email_failed";
  }
  updated =
    (await getRepo().updateNotification({
      ticketNumber: updated.ticketNumber,
      status: notificationStatus,
      updatedAt,
    })) ?? updated;
  return updated;
}

export function setCreateSupportTicketRepoForTests(repo: TicketRepository | null) {
  repoSingleton = repo;
  indexesReady = false;
}
