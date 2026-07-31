import "server-only";

import crypto from "node:crypto";
import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { getAccountOverview } from "@features/account/service";
import { sendMail, type SendMailResult } from "@/utils/mailer";
import { buildSupportStatusMail } from "@/utils/emailTemplates";
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

export type CreateSupportResolutionDeliveryStatus =
  | "pending"
  | "claimed"
  | "delivered"
  | "failed_retryable"
  | "failed_terminal"
  | "delivery_unknown"
  | "not_applicable";

export type CreateSupportResolutionDelivery = {
  key: string;
  status: CreateSupportResolutionDeliveryStatus;
  attemptCount: number;
  claimId: string | null;
  claimedAt: string | null;
  leaseExpiresAt: string | null;
  completedAt: string | null;
  messageId: string | null;
  failureCategory: string | null;
  retryable: boolean | null;
};

export type CreateSupportTicketRecord = {
  id: string;
  ticketNumber: string;
  status: CreateSupportTicketStatus;
  affectedUserId: string | null;
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
  resolutionDelivery: CreateSupportResolutionDelivery;
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

type StatusTransitionResult = {
  record: CreateSupportTicketRecord;
  changed: boolean;
};

type ResolutionDeliveryCompletion = {
  status: Exclude<CreateSupportResolutionDeliveryStatus, "pending" | "claimed">;
  messageId: string | null;
  failureCategory: string | null;
  retryable: boolean;
  completedAt: string;
};

export type TicketRepository = {
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
  transitionStatus(input: {
    ticketNumber: string;
    expectedStatus: CreateSupportTicketStatus;
    status: CreateSupportTicketStatus;
    updatedAt: string;
    resolvedAt: string | null;
  }): Promise<StatusTransitionResult | null>;
  markInAppNotification(input: {
    ticketNumber: string;
    updatedAt: string;
  }): Promise<CreateSupportTicketRecord | null>;
  claimResolutionDelivery(input: {
    ticketNumber: string;
    claimId: string;
    claimedAt: string;
    leaseExpiresAt: string;
    allowRetry: boolean;
  }): Promise<CreateSupportTicketRecord | null>;
  reconcileExpiredResolutionDelivery(input: {
    ticketNumber: string;
    now: string;
  }): Promise<CreateSupportTicketRecord | null>;
  completeResolutionDelivery(input: {
    ticketNumber: string;
    claimId: string;
    completion: ResolutionDeliveryCompletion;
  }): Promise<CreateSupportTicketRecord | null>;
  markResolutionDeliveryNotApplicable(input: {
    ticketNumber: string;
    completedAt: string;
  }): Promise<CreateSupportTicketRecord | null>;
  upsertNotification(notification: AccountSupportNotification): Promise<void>;
  appendAudit(event: TicketAuditEvent): Promise<void>;
};

const TICKETS_COLLECTION = "support_tickets";
const NOTIFICATIONS_COLLECTION = "account_notifications";
const AUDIT_COLLECTION = "support_ticket_audit";
const RESOLUTION_CLAIM_LEASE_MS = 5 * 60_000;
const MAX_RESOLUTION_DELIVERY_ATTEMPTS = 2;

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
      resolvedStatus: "Resolved",
    };
  }
  return {
    safeUserMessage:
      "Dein Beitrag ist gespeichert. Die Analyse konnte nicht abgeschlossen werden. Der Fall wurde an unser IT-Team übergeben.",
    notificationTitle: `Ticket ${ticketNumber} wurde gelöst`,
    notificationBody:
      "Der technische Fall zu deinem Beitrag wurde gelöst. Du kannst deinen gespeicherten Arbeitsstand fortsetzen.",
    resolvedStatus: "Gelöst",
  };
}

function buildTicketNumber(createdAt: string, fingerprint: string) {
  const compactDate = createdAt.slice(0, 10).replaceAll("-", "");
  return `EDB-${compactDate}-${fingerprint.slice(0, 8).toUpperCase()}`;
}

function resolutionDeliveryForTicket(ticketId: string): CreateSupportResolutionDelivery {
  return {
    key: `support-resolution-${ticketId}`,
    status: "pending",
    attemptCount: 0,
    claimId: null,
    claimedAt: null,
    leaseExpiresAt: null,
    completedAt: null,
    messageId: null,
    failureCategory: null,
    retryable: null,
  };
}

export function normalizeCreateSupportTicketRecordForRuntime(
  record: CreateSupportTicketRecord,
): CreateSupportTicketRecord {
  if (record.resolutionDelivery?.key) return record;
  return {
    ...record,
    resolutionDelivery: resolutionDeliveryForTicket(record.id),
  };
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
    tickets.createIndex(
      { "resolutionDelivery.key": 1 },
      {
        unique: true,
        partialFilterExpression: {
          "resolutionDelivery.key": { $type: "string" },
        },
      },
    ),
    notifications.createIndex({ id: 1 }, { unique: true }),
    notifications.createIndex({ userId: 1, createdAt: -1 }),
    audit.createIndex({ id: 1 }, { unique: true }),
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
      if (!record) return null;
      if (record.resolutionDelivery?.key) return clone(record);

      const hydrated = await tickets.findOneAndUpdate(
        {
          ticketNumber,
          "resolutionDelivery.key": { $exists: false },
        } as any,
        {
          $set: {
            resolutionDelivery: resolutionDeliveryForTicket(record.id),
          },
        } as any,
        { returnDocument: "after" },
      );
      return clone(
        normalizeCreateSupportTicketRecordForRuntime(hydrated ?? record),
      );
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
      return records.map((record) =>
        clone(normalizeCreateSupportTicketRecordForRuntime(record)),
      );
    },
    async transitionStatus(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const changed = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          status: input.expectedStatus,
        },
        {
          $set: {
            status: input.status,
            updatedAt: input.updatedAt,
            resolvedAt: input.resolvedAt,
          },
        },
        { returnDocument: "after" },
      );
      if (changed) return { record: clone(changed), changed: true };
      const current = await tickets.findOne({ ticketNumber: input.ticketNumber });
      return current ? { record: clone(current), changed: false } : null;
    },
    async markInAppNotification(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          status: "resolved",
          notificationStatus: { $in: ["pending", "in_app_created"] },
        } as any,
        {
          $set: {
            notificationStatus: "in_app_created",
            updatedAt: input.updatedAt,
          },
        } as any,
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async claimResolutionDelivery(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          status: "resolved",
          $or: [
            {
              "resolutionDelivery.status": "pending",
              "resolutionDelivery.attemptCount": 0,
            },
            ...(input.allowRetry
              ? [
                  {
                    "resolutionDelivery.status": "failed_retryable",
                    "resolutionDelivery.attemptCount": {
                      $lt: MAX_RESOLUTION_DELIVERY_ATTEMPTS,
                    },
                  },
                ]
              : []),
          ],
        } as any,
        {
          $set: {
            "resolutionDelivery.status": "claimed",
            "resolutionDelivery.claimId": input.claimId,
            "resolutionDelivery.claimedAt": input.claimedAt,
            "resolutionDelivery.leaseExpiresAt": input.leaseExpiresAt,
            "resolutionDelivery.completedAt": null,
            "resolutionDelivery.failureCategory": null,
            "resolutionDelivery.retryable": null,
            notificationStatus: "in_app_created",
            updatedAt: input.claimedAt,
          },
          $inc: { "resolutionDelivery.attemptCount": 1 },
        } as any,
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async reconcileExpiredResolutionDelivery(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          "resolutionDelivery.status": "claimed",
          "resolutionDelivery.leaseExpiresAt": { $lt: input.now },
        } as any,
        {
          $set: {
            "resolutionDelivery.status": "delivery_unknown",
            "resolutionDelivery.completedAt": input.now,
            "resolutionDelivery.leaseExpiresAt": null,
            "resolutionDelivery.failureCategory": "claim_expired",
            "resolutionDelivery.retryable": false,
            notificationStatus: "email_failed",
            updatedAt: input.now,
          },
        } as any,
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async completeResolutionDelivery(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          "resolutionDelivery.status": "claimed",
          "resolutionDelivery.claimId": input.claimId,
        } as any,
        {
          $set: {
            "resolutionDelivery.status": input.completion.status,
            "resolutionDelivery.completedAt": input.completion.completedAt,
            "resolutionDelivery.leaseExpiresAt": null,
            "resolutionDelivery.messageId": input.completion.messageId,
            "resolutionDelivery.failureCategory":
              input.completion.failureCategory,
            "resolutionDelivery.retryable": input.completion.retryable,
            notificationStatus:
              input.completion.status === "delivered"
                ? "email_sent"
                : "email_failed",
            updatedAt: input.completion.completedAt,
          },
        } as any,
        { returnDocument: "after" },
      );
      return record ? clone(record) : null;
    },
    async markResolutionDeliveryNotApplicable(input) {
      await ensureIndexes();
      const tickets = await coreCol<CreateSupportTicketRecord>(TICKETS_COLLECTION);
      const record = await tickets.findOneAndUpdate(
        {
          ticketNumber: input.ticketNumber,
          status: "resolved",
          "resolutionDelivery.status": {
            $in: ["pending", "failed_retryable"],
          },
        } as any,
        {
          $set: {
            "resolutionDelivery.status": "not_applicable",
            "resolutionDelivery.completedAt": input.completedAt,
            "resolutionDelivery.leaseExpiresAt": null,
            "resolutionDelivery.failureCategory": null,
            "resolutionDelivery.retryable": false,
            notificationStatus: "in_app_created",
            updatedAt: input.completedAt,
          },
        } as any,
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
      if (!record) return null;
      const normalized =
        normalizeCreateSupportTicketRecordForRuntime(record);
      tickets.set(ticketNumber, clone(normalized));
      return clone(normalized);
    },
    async listByUser(userId, limit) {
      return Array.from(tickets.values())
        .filter((ticket) => ticket.affectedUserId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
        .map((record) =>
          clone(normalizeCreateSupportTicketRecordForRuntime(record)),
        );
    },
    async listNotifications(userId, limit) {
      return Array.from(notifications.values())
        .filter((notification) => notification.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
        .map(clone);
    },
    async transitionStatus(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current) return null;
      if (current.status !== input.expectedStatus) {
        return { record: clone(current), changed: false };
      }
      const next = {
        ...current,
        status: input.status,
        updatedAt: input.updatedAt,
        resolvedAt: input.resolvedAt,
      };
      tickets.set(input.ticketNumber, next);
      return { record: clone(next), changed: true };
    },
    async markInAppNotification(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current || current.status !== "resolved") return null;
      if (
        current.notificationStatus !== "pending" &&
        current.notificationStatus !== "in_app_created"
      ) {
        return clone(current);
      }
      const next = {
        ...current,
        notificationStatus: "in_app_created" as const,
        updatedAt: input.updatedAt,
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async claimResolutionDelivery(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current || current.status !== "resolved") return null;
      const delivery = current.resolutionDelivery;
      const canClaim =
        (delivery.status === "pending" && delivery.attemptCount === 0) ||
        (input.allowRetry &&
          delivery.status === "failed_retryable" &&
          delivery.attemptCount < MAX_RESOLUTION_DELIVERY_ATTEMPTS);
      if (!canClaim) return null;
      const next = {
        ...current,
        notificationStatus: "in_app_created" as const,
        updatedAt: input.claimedAt,
        resolutionDelivery: {
          ...delivery,
          status: "claimed" as const,
          attemptCount: delivery.attemptCount + 1,
          claimId: input.claimId,
          claimedAt: input.claimedAt,
          leaseExpiresAt: input.leaseExpiresAt,
          completedAt: null,
          failureCategory: null,
          retryable: null,
        },
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async reconcileExpiredResolutionDelivery(input) {
      const current = tickets.get(input.ticketNumber);
      if (
        !current ||
        current.resolutionDelivery.status !== "claimed" ||
        !current.resolutionDelivery.leaseExpiresAt ||
        current.resolutionDelivery.leaseExpiresAt >= input.now
      ) {
        return null;
      }
      const next = {
        ...current,
        notificationStatus: "email_failed" as const,
        updatedAt: input.now,
        resolutionDelivery: {
          ...current.resolutionDelivery,
          status: "delivery_unknown" as const,
          completedAt: input.now,
          leaseExpiresAt: null,
          failureCategory: "claim_expired",
          retryable: false,
        },
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async completeResolutionDelivery(input) {
      const current = tickets.get(input.ticketNumber);
      if (
        !current ||
        current.resolutionDelivery.status !== "claimed" ||
        current.resolutionDelivery.claimId !== input.claimId
      ) {
        return null;
      }
      const next = {
        ...current,
        notificationStatus:
          input.completion.status === "delivered"
            ? ("email_sent" as const)
            : ("email_failed" as const),
        updatedAt: input.completion.completedAt,
        resolutionDelivery: {
          ...current.resolutionDelivery,
          status: input.completion.status,
          completedAt: input.completion.completedAt,
          leaseExpiresAt: null,
          messageId: input.completion.messageId,
          failureCategory: input.completion.failureCategory,
          retryable: input.completion.retryable,
        },
      };
      tickets.set(input.ticketNumber, next);
      return clone(next);
    },
    async markResolutionDeliveryNotApplicable(input) {
      const current = tickets.get(input.ticketNumber);
      if (!current || current.status !== "resolved") return null;
      if (
        current.resolutionDelivery.status !== "pending" &&
        current.resolutionDelivery.status !== "failed_retryable"
      ) {
        return clone(current);
      }
      const next = {
        ...current,
        notificationStatus: "in_app_created" as const,
        updatedAt: input.completedAt,
        resolutionDelivery: {
          ...current.resolutionDelivery,
          status: "not_applicable" as const,
          completedAt: input.completedAt,
          leaseExpiresAt: null,
          failureCategory: null,
          retryable: false,
        },
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
  affectedUserId: string;
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
  if (!affectedUserId) {
    throw new Error("create_support_ticket_actor_required");
  }
  const actorBinding = `user:${affectedUserId}`;
  const failureFingerprint = stableHash({
    route: "/create",
    actorBinding,
    correlationId,
    orchestrationPhase,
    technicalErrorCode,
  });
  const ticketNumber = buildTicketNumber(createdAt, failureFingerprint);
  const id = crypto.randomUUID();
  const record: CreateSupportTicketRecord = {
    id,
    ticketNumber,
    status: "open",
    affectedUserId,
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
    notificationRecipientLinked: true,
    notificationStatus: "pending",
    resolutionDelivery: resolutionDeliveryForTicket(id),
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
    viewHref: `/account?ticket=${encodeURIComponent(
      ensured.record.ticketNumber,
    )}#support-tickets`,
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

function deliveryCompletionFromResult(
  result: SendMailResult,
  attemptCount: number,
  completedAt: string,
): ResolutionDeliveryCompletion {
  if (result.ok) {
    return {
      status: "delivered",
      messageId: result.messageId,
      failureCategory: null,
      retryable: false,
      completedAt,
    };
  }
  if (result.status === "partial" || result.deliveredCount > 0) {
    return {
      status: "delivery_unknown",
      messageId: result.messageId,
      failureCategory: result.category,
      retryable: false,
      completedAt,
    };
  }
  const mayRetry =
    result.retryable && attemptCount < MAX_RESOLUTION_DELIVERY_ATTEMPTS;
  return {
    status: mayRetry ? "failed_retryable" : "failed_terminal",
    messageId: result.messageId,
    failureCategory: result.category,
    retryable: mayRetry,
    completedAt,
  };
}

export async function transitionCreateSupportTicketStatus(input: {
  ticketNumber: string;
  status: CreateSupportTicketStatus;
  actorId: string;
  retryResolutionDelivery?: boolean;
}) {
  const repo = getRepo();
  const current = await repo.findByNumber(input.ticketNumber.trim());
  if (!current) return null;

  const transitionAt = new Date().toISOString();
  const resolvedAt =
    input.status === "resolved" || input.status === "closed"
      ? current.resolvedAt ?? transitionAt
      : null;
  const transition =
    current.status === input.status
      ? { record: current, changed: false }
      : await repo.transitionStatus({
          ticketNumber: current.ticketNumber,
          expectedStatus: current.status,
          status: input.status,
          updatedAt: transitionAt,
          resolvedAt,
        });
  if (!transition) return null;
  let updated = transition.record;

  if (transition.changed) {
    await repo.appendAudit({
      id: `support-audit-status-${updated.id}-${input.status}`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      action: "status_changed",
      actorId: normalizeSafeCode(input.actorId, "admin"),
      fromStatus: current.status,
      toStatus: input.status,
      createdAt: transitionAt,
    });
  }

  if (input.status !== "resolved" || !updated.affectedUserId) {
    return updated;
  }

  let overview: Awaited<ReturnType<typeof getAccountOverview>> | null = null;
  let accountLookupAvailable = true;
  try {
    overview = await getAccountOverview(updated.affectedUserId);
  } catch {
    accountLookupAvailable = false;
  }
  const locale = normalizeLocale(overview?.uiLocale ?? overview?.readingLocale);
  const copy = localizedCopy(locale, updated.ticketNumber);
  const notificationCreatedAt = updated.resolvedAt ?? transitionAt;
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
    createdAt: notificationCreatedAt,
    readAt: null,
    emailDeliveryStatus:
      updated.resolutionDelivery.status === "delivered"
        ? "sent"
        : updated.resolutionDelivery.status === "pending" ||
            updated.resolutionDelivery.status === "claimed"
          ? "not_attempted"
          : "failed",
    emailMessageId: updated.resolutionDelivery.messageId,
  };
  await repo.upsertNotification(notification);
  await repo.appendAudit({
    id: `support-audit-notification-${updated.id}`,
    ticketId: updated.id,
    ticketNumber: updated.ticketNumber,
    action: "notification_created",
    actorId: normalizeSafeCode(input.actorId, "admin"),
    fromStatus: "resolved",
    toStatus: "resolved",
    createdAt: notificationCreatedAt,
  });
  updated =
    (await repo.markInAppNotification({
      ticketNumber: updated.ticketNumber,
      updatedAt: transitionAt,
    })) ?? updated;

  const now = new Date();
  const expired = await repo.reconcileExpiredResolutionDelivery({
    ticketNumber: updated.ticketNumber,
    now: now.toISOString(),
  });
  if (expired) {
    notification.emailDeliveryStatus = "failed";
    notification.emailMessageId = expired.resolutionDelivery.messageId;
    await repo.upsertNotification(notification);
    return expired;
  }

  if (!accountLookupAvailable) {
    return updated;
  }

  const email = String(overview?.email ?? "").trim();
  if (!email) {
    return (
      (await repo.markResolutionDeliveryNotApplicable({
        ticketNumber: updated.ticketNumber,
        completedAt: new Date().toISOString(),
      })) ?? updated
    );
  }

  const claimId = crypto.randomUUID();
  const claimed = await repo.claimResolutionDelivery({
    ticketNumber: updated.ticketNumber,
    claimId,
    claimedAt: now.toISOString(),
    leaseExpiresAt: new Date(
      now.getTime() + RESOLUTION_CLAIM_LEASE_MS,
    ).toISOString(),
    allowRetry: input.retryResolutionDelivery === true,
  });
  if (!claimed) {
    return (await repo.findByNumber(updated.ticketNumber)) ?? updated;
  }

  const accountRecord = overview as unknown as Record<string, unknown> | null;
  const profile =
    accountRecord?.profile &&
    typeof accountRecord.profile === "object" &&
    !Array.isArray(accountRecord.profile)
      ? (accountRecord.profile as Record<string, unknown>)
      : null;
  const displayName = normalizeOptionalId(
    accountRecord?.displayName ?? profile?.displayName,
  );
  const mail = buildSupportStatusMail({
    displayName,
    ticketReference: claimed.ticketNumber,
    status: copy.resolvedStatus,
    resolution: copy.notificationBody,
    locale,
  });

  let completion: ResolutionDeliveryCompletion;
  try {
    const result = await sendMail({
      to: email,
      mail,
      delivery: "required_delivery",
      tag: "support_ticket_resolved",
    });
    completion = deliveryCompletionFromResult(
      result,
      claimed.resolutionDelivery.attemptCount,
      new Date().toISOString(),
    );
  } catch (error) {
    completion = {
      status: "delivery_unknown",
      messageId: null,
      failureCategory:
        error instanceof Error ? normalizeSafeCode(error.name, "unknown") : "unknown",
      retryable: false,
      completedAt: new Date().toISOString(),
    };
  }

  const completed = await repo.completeResolutionDelivery({
    ticketNumber: claimed.ticketNumber,
    claimId,
    completion,
  });
  if (!completed) {
    return (await repo.findByNumber(claimed.ticketNumber)) ?? claimed;
  }

  notification.emailDeliveryStatus =
    completion.status === "delivered" ? "sent" : "failed";
  notification.emailMessageId = completion.messageId;
  await repo.upsertNotification(notification);
  return completed;
}

export function setCreateSupportTicketRepoForTests(repo: TicketRepository | null) {
  repoSingleton = repo;
  indexesReady = false;
}
