import "server-only";

import { ObjectId, coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  CheckoutSessionSchema,
  type BillingStatusV2,
  type CheckoutSession,
  type CheckoutSessionStatus,
  type PaymentProviderId,
  defaultPlanAssignmentForOrder,
  deriveBillingStatusFromCheckoutSession,
} from "@features/pricing";
import {
  getRegionEntitlementRuntimeRepo,
  type OrganizationType,
} from "@features/region";
import { EDEBATTE_PACKAGES_DE } from "../domain/plans.de";
import { updatePricingOrderReview } from "./leadsRepo";

const CHECKOUT_SESSIONS_COLLECTION = "edebatte_checkout_sessions";

export type CheckoutSessionAuditEventType =
  | "created"
  | "payment_marked_pending"
  | "payment_confirmed"
  | "payment_failed"
  | "cancelled"
  | "refund_pending"
  | "entitlement_granted";

export type CheckoutSessionAuditEvent = {
  id: string;
  sessionId: string;
  eventType: CheckoutSessionAuditEventType;
  previousStatus: CheckoutSessionStatus | null;
  nextStatus: CheckoutSessionStatus | null;
  billingStatus: BillingStatusV2;
  note: string | null;
  createdAt: string;
  createdBy: string;
};

export type CheckoutSessionRecord = CheckoutSession & {
  provider: PaymentProviderId;
  orderRecordId: string | null;
  approvalRequired: false;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  auditEvents: CheckoutSessionAuditEvent[];
};

export type CreateCheckoutSessionInput = {
  provider: PaymentProviderId;
  planId: string;
  organizationId: string;
  userId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  orderRecordId?: string | null;
  providerSessionId?: string | null;
};

type CheckoutSessionDoc = {
  _id: string;
  session: CheckoutSessionRecord;
  createdAt: Date;
  updatedAt: Date;
};

type CompleteCheckoutSessionInput = {
  sessionId: string;
  actorUserId: string;
  status: Extract<CheckoutSessionStatus, "paid" | "failed" | "cancelled" | "refund_pending">;
  organizationName: string;
  organizationType: OrganizationType;
  regionId?: string | null;
  note?: string | null;
};

export type CheckoutSessionsRepo = {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionRecord>;
  getCheckoutSessionById(id: string): Promise<CheckoutSessionRecord | null>;
  listCheckoutSessionsForOrganization(organizationId: string): Promise<CheckoutSessionRecord[]>;
  completeCheckoutSession(input: CompleteCheckoutSessionInput): Promise<CheckoutSessionRecord | null>;
};

let repoForTests: CheckoutSessionsRepo | null = null;
let repoSingleton: CheckoutSessionsRepo | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isoNow() {
  return new Date().toISOString();
}

function resolvePlanLabel(planId: string): string {
  return EDEBATTE_PACKAGES_DE.find((plan) => plan.id === planId)?.titel ?? planId;
}

function createAuditEvent(input: {
  sessionId: string;
  eventType: CheckoutSessionAuditEventType;
  previousStatus: CheckoutSessionStatus | null;
  nextStatus: CheckoutSessionStatus | null;
  createdBy: string;
  note?: string | null;
}): CheckoutSessionAuditEvent {
  return {
    id: new ObjectId().toHexString(),
    sessionId: input.sessionId,
    eventType: input.eventType,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    billingStatus: deriveBillingStatusFromCheckoutSession({
      status: input.nextStatus ?? input.previousStatus ?? "draft",
    }),
    note: input.note?.trim() || null,
    createdAt: isoNow(),
    createdBy: input.createdBy,
  };
}

function mapDoc(doc: CheckoutSessionDoc | null): CheckoutSessionRecord | null {
  if (!doc?.session) return null;
  return clone(doc.session);
}

function createCheckoutSessionRecord(input: CreateCheckoutSessionInput): CheckoutSessionRecord {
  const createdAt = isoNow();
  const record: CheckoutSessionRecord = {
    ...CheckoutSessionSchema.parse({
      id: new ObjectId().toHexString(),
      planId: input.planId,
      organizationId: input.organizationId,
      userId: input.userId,
      amount: input.amount,
      currency: input.currency.trim().toUpperCase(),
      status: "checkout_pending",
      providerSessionId: input.providerSessionId?.trim() || null,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    }),
    provider: input.provider,
    orderRecordId: input.orderRecordId?.trim() || null,
    approvalRequired: false,
    approvedBy: null,
    createdAt,
    updatedAt: createdAt,
    auditEvents: [],
  };
  record.auditEvents = [
    createAuditEvent({
      sessionId: record.id,
      eventType: "created",
      previousStatus: null,
      nextStatus: record.status,
      createdBy: record.userId,
      note: "Self-Service-Checkout-Session angelegt.",
    }),
  ];
  return record;
}

export function createInMemoryCheckoutSessionsRepo(seed?: {
  sessions?: CheckoutSessionRecord[];
}): CheckoutSessionsRepo {
  const sessions = new Map<string, CheckoutSessionRecord>();
  for (const session of seed?.sessions ?? []) sessions.set(session.id, clone(session));

  return {
    async createCheckoutSession(input) {
      const record = createCheckoutSessionRecord(input);
      sessions.set(record.id, clone(record));
      return record;
    },

    async getCheckoutSessionById(id) {
      const session = sessions.get(id);
      return session ? clone(session) : null;
    },

    async listCheckoutSessionsForOrganization(organizationId) {
      return Array.from(sessions.values())
        .map((session) => clone(session))
        .filter((session) => session.organizationId === organizationId)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    },

    async completeCheckoutSession(input) {
      const current = sessions.get(input.sessionId);
      if (!current) return null;
      const updated: CheckoutSessionRecord = {
        ...current,
        status: input.status,
        updatedAt: isoNow(),
      };
      const statusEvent = createAuditEvent({
        sessionId: current.id,
        eventType:
          input.status === "paid"
            ? "payment_confirmed"
            : input.status === "failed"
              ? "payment_failed"
              : input.status === "cancelled"
                ? "cancelled"
                : "refund_pending",
        previousStatus: current.status,
        nextStatus: input.status,
        createdBy: input.actorUserId,
        note: input.note,
      });
      updated.auditEvents = [...current.auditEvents, statusEvent];

      if (input.status === "paid") {
        const planLabel = resolvePlanLabel(updated.planId);
        await getRegionEntitlementRuntimeRepo().createPaidDashboardEntitlement({
          organizationId: updated.organizationId,
          organizationName: input.organizationName,
          organizationType: input.organizationType,
          regionId: input.regionId ?? null,
          planId: updated.planId,
          planLabel,
          status: "active",
          scope: "organization",
          createdBy: input.actorUserId,
          source: "external_checkout",
        });
        updated.auditEvents = [
          ...updated.auditEvents,
          createAuditEvent({
            sessionId: current.id,
            eventType: "entitlement_granted",
            previousStatus: input.status,
            nextStatus: input.status,
            createdBy: input.actorUserId,
            note:
              "Entitlement aus bezahlter Checkout-Session erzeugt. Kein public_official, keine publication_approved-Freigabe.",
          }),
        ];

        if (updated.orderRecordId) {
          await updatePricingOrderReview(updated.orderRecordId, {
            status: "active",
            actorUserId: input.actorUserId,
            note:
              "Selbst-Service-Checkout bestätigt. Nur vertraglich definierte Entitlements aktiviert; keine automatische Amtlichkeit oder Publikationsfreigabe.",
            organizationId: updated.organizationId,
            contractStatus: "active",
            billingStatus: "active",
            billingSource: "external_checkout_integrated",
            planAssignment: defaultPlanAssignmentForOrder({
              packageId: updated.planId,
              planLabel,
            }),
            accessProvisioningDecision: "activate",
            billingFinanceNote: "Checkout bezahlt und auditierbar bestätigt.",
            invoiceReference: updated.providerSessionId ?? `checkout:${updated.id}`,
          });
        }
      }

      sessions.set(updated.id, clone(updated));
      return updated;
    },
  };
}

export function createMongoCheckoutSessionsRepo(): CheckoutSessionsRepo {
  return {
    async createCheckoutSession(input) {
      const record = createCheckoutSessionRecord(input);
      const sessions = await coreCol<CheckoutSessionDoc>(CHECKOUT_SESSIONS_COLLECTION);
      const now = new Date();
      await sessions.insertOne({
        _id: record.id,
        session: record,
        createdAt: now,
        updatedAt: now,
      });
      return record;
    },

    async getCheckoutSessionById(id) {
      const sessions = await coreCol<CheckoutSessionDoc>(CHECKOUT_SESSIONS_COLLECTION);
      const doc = await sessions.findOne({ _id: id });
      return mapDoc(doc);
    },

    async listCheckoutSessionsForOrganization(organizationId) {
      const sessions = await coreCol<CheckoutSessionDoc>(CHECKOUT_SESSIONS_COLLECTION);
      const docs = await sessions
        .find({ "session.organizationId": organizationId })
        .sort({ updatedAt: -1 })
        .limit(200)
        .toArray();
      return docs
        .map((doc) => mapDoc(doc))
        .filter((entry): entry is CheckoutSessionRecord => Boolean(entry));
    },

    async completeCheckoutSession(input) {
      const sessions = await coreCol<CheckoutSessionDoc>(CHECKOUT_SESSIONS_COLLECTION);
      const existing = await sessions.findOne({ _id: input.sessionId });
      const current = mapDoc(existing);
      if (!current) return null;

      const inMemoryRepo = createInMemoryCheckoutSessionsRepo({ sessions: [current] });
      const updated = await inMemoryRepo.completeCheckoutSession(input);
      if (!updated) return null;

      await sessions.updateOne(
        { _id: input.sessionId },
        {
          $set: {
            session: updated,
            updatedAt: new Date(),
          },
        },
      );
      return updated;
    },
  };
}

export function getCheckoutSessionsRepo(): CheckoutSessionsRepo {
  if (repoForTests) return repoForTests;
  if (shouldUseInMemoryMongoFallback()) {
    if (!repoSingleton) repoSingleton = createInMemoryCheckoutSessionsRepo();
    return repoSingleton;
  }
  if (!repoSingleton) repoSingleton = createMongoCheckoutSessionsRepo();
  return repoSingleton;
}

export function setCheckoutSessionsRepoForTests(repo: CheckoutSessionsRepo | null) {
  repoForTests = repo;
  repoSingleton = repo ? null : repoSingleton;
}
