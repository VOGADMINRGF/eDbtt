import "server-only";

import { after } from "next/server";
import { coreCol, getCol, ObjectId } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { sendMail } from "@/utils/mailer";
import { renderTransactionalMail } from "@/utils/mailRenderer";

export const OPERATOR_RECIPIENTS = {
  createSubmission: "social@edebatte.org",
  supportTicket: "qa-auth@edebatte.org",
  memberRegistration: "members@edebatte.org",
  dailyDigest: "rgf@voiceopengov.org",
} as const;

export type OperatorNotificationKind =
  | "create_submission"
  | "support_ticket"
  | "member_registration";

type OperatorNotificationEvent = {
  _id: string;
  kind: OperatorNotificationKind;
  recipient: string;
  subject: string;
  summary: string;
  details: Record<string, string | null>;
  createdAt: Date;
  berlinDate: string;
  deliveryStatus: "pending" | "sent" | "failed";
  messageId: string | null;
  failureCategory: string | null;
};

type OperatorDigestRecord = {
  _id: string;
  berlinDate: string;
  createdAt: Date;
  deliveryStatus: "claimed" | "sent" | "failed";
  messageId: string | null;
};

type OperatorUserProjection = {
  _id: ObjectId;
  email?: string | null;
  name?: string | null;
  profile?: { locale?: string | null } | null;
};

const EVENTS_COLLECTION = "operator_notification_events";
const DIGEST_COLLECTION = "operator_notification_digests";

function berlinParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number(read("hour")),
  };
}

export function isBerlinDigestHour(date = new Date()) {
  return berlinParts(date).hour === 18;
}

function compact(value: unknown, max = 1200) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.slice(0, max);
}

function eventMail(input: {
  subject: string;
  title: string;
  summary: string;
  details: Record<string, string | null>;
}) {
  const rows = Object.entries(input.details)
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: String(value) }));
  return renderTransactionalMail({
    locale: "de",
    subject: input.subject,
    preheader: input.summary,
    title: input.title,
    greeting: "Interne eDebatte-Information",
    blocks: [
      { kind: "paragraph", text: input.summary },
      ...(rows.length > 0 ? [{ kind: "details" as const, rows }] : []),
    ],
    reason: "eine interne Betriebsbenachrichtigung für eDebatte ausgelöst wurde.",
  });
}

async function ensureAndDeliver(input: {
  idempotencyKey: string;
  kind: OperatorNotificationKind;
  recipient: string;
  subject: string;
  title: string;
  summary: string;
  details?: Record<string, string | null | undefined>;
}) {
  const col = await coreCol<OperatorNotificationEvent>(EVENTS_COLLECTION);
  const now = new Date();
  const _id = stableHash({ scope: "operator_notification", key: input.idempotencyKey });
  const details = Object.fromEntries(
    Object.entries(input.details ?? {}).map(([key, value]) => [
      key,
      value == null ? null : compact(value, 4000),
    ]),
  );
  const record: OperatorNotificationEvent = {
    _id,
    kind: input.kind,
    recipient: input.recipient,
    subject: input.subject,
    summary: compact(input.summary, 1200),
    details,
    createdAt: now,
    berlinDate: berlinParts(now).date,
    deliveryStatus: "pending",
    messageId: null,
    failureCategory: null,
  };

  const insert = await col.updateOne(
    { _id },
    { $setOnInsert: record },
    { upsert: true },
  );
  if (!insert.upsertedId) return;

  const result = await sendMail({
    to: input.recipient,
    mail: eventMail({
      subject: input.subject,
      title: input.title,
      summary: record.summary,
      details,
    }),
    delivery: "best_effort_delivery",
    tag: `operator_${input.kind}`,
  });

  await col.updateOne(
    { _id },
    {
      $set: {
        deliveryStatus: result.ok ? "sent" : "failed",
        messageId: result.messageId ?? null,
        failureCategory: result.ok ? null : result.category,
      },
    },
  );
}

function schedule(work: () => Promise<void>) {
  try {
    after(async () => {
      try {
        await work();
      } catch (error) {
        console.error("[operator-notifications] delivery failed", error);
      }
    });
  } catch (error) {
    console.error("[operator-notifications] scheduling unavailable", error);
  }
}

export function scheduleCreateSubmissionNotification(input: {
  draftId: string;
  text: string;
  locale?: string | null;
}) {
  const text = compact(input.text, 10_000);
  if (!text) return;
  schedule(() =>
    ensureAndDeliver({
      idempotencyKey: `create:${input.draftId}`,
      kind: "create_submission",
      recipient: OPERATOR_RECIPIENTS.createSubmission,
      subject: "[eDebatte] Neuer /create-Eintrag",
      title: "Neuer Eintrag in /create",
      summary: text,
      details: {
        Sprache: input.locale ?? null,
      },
    }),
  );
}

export function scheduleSupportTicketNotification(input: {
  ticketNumber: string;
  affectedUserId?: string | null;
  technicalErrorCode?: string | null;
  provider?: string | null;
  reason?: string | null;
}) {
  schedule(() =>
    ensureAndDeliver({
      idempotencyKey: `support:${input.ticketNumber}`,
      kind: "support_ticket",
      recipient: OPERATOR_RECIPIENTS.supportTicket,
      subject: `[eDebatte QA/Auth] ${input.ticketNumber}`,
      title: "Neuer technischer /create-Fall",
      summary: `Technischer Fall ${input.ticketNumber} wurde erfasst.`,
      details: {
        Ticket: input.ticketNumber,
        Nutzer: input.affectedUserId ?? null,
        Fehlercode: input.technicalErrorCode ?? null,
        Provider: input.provider ?? null,
        Ursache: input.reason ?? null,
      },
    }),
  );
}

export function scheduleMemberRegistrationNotification(userId: string) {
  if (!ObjectId.isValid(userId)) return;
  schedule(async () => {
    const users = await getCol<OperatorUserProjection>("users");
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { _id: 1, email: 1, name: 1, "profile.locale": 1 } },
    );
    if (!user) return;
    await ensureAndDeliver({
      idempotencyKey: `member:${userId}`,
      kind: "member_registration",
      recipient: OPERATOR_RECIPIENTS.memberRegistration,
      subject: "[eDebatte] Neue Registrierung",
      title: "Neue Registrierung bei eDebatte",
      summary: `${compact(user.name ?? "Neue Person", 160)} hat sich registriert.`,
      details: {
        "Nutzer-ID": userId,
        Name: compact(user.name, 160) || null,
        "E-Mail": compact(user.email, 320) || null,
        Sprache: compact(user.profile?.locale, 20) || null,
      },
    });
  });
}

function digestMail(date: string, events: OperatorNotificationEvent[]) {
  const counts = {
    create: events.filter((event) => event.kind === "create_submission").length,
    support: events.filter((event) => event.kind === "support_ticket").length,
    members: events.filter((event) => event.kind === "member_registration").length,
  };
  const recent = events
    .slice(-40)
    .reverse()
    .map((event) => `${event.kind}: ${event.summary}`)
    .join("\n");
  return renderTransactionalMail({
    locale: "de",
    subject: `[eDebatte] Tageszusammenfassung ${date}`,
    preheader: `${counts.create} Create-Einträge, ${counts.members} Registrierungen, ${counts.support} Technikfälle`,
    title: "eDebatte Tageszusammenfassung",
    greeting: "Hallo Ricky,",
    blocks: [
      {
        kind: "details",
        rows: [
          { label: "Create-Einträge", value: String(counts.create) },
          { label: "Neue Registrierungen", value: String(counts.members) },
          { label: "Technische Fälle", value: String(counts.support) },
        ],
      },
      {
        kind: "paragraph",
        text: recent || "Heute wurden bislang keine Operator-Ereignisse erfasst.",
      },
    ],
    reason: "du die tägliche eDebatte-Betriebszusammenfassung angefordert hast.",
  });
}

export async function sendDailyOperatorDigest(now = new Date()) {
  const berlin = berlinParts(now);
  const eventsCol = await coreCol<OperatorNotificationEvent>(EVENTS_COLLECTION);
  const digestCol = await coreCol<OperatorDigestRecord>(DIGEST_COLLECTION);
  const digestId = `operator-digest:${berlin.date}`;

  const claim = await digestCol.updateOne(
    { _id: digestId },
    {
      $setOnInsert: {
        _id: digestId,
        berlinDate: berlin.date,
        createdAt: now,
        deliveryStatus: "claimed",
        messageId: null,
      },
    },
    { upsert: true },
  );
  if (!claim.upsertedId) {
    return {
      ok: true as const,
      skipped: "already_claimed" as const,
      berlinDate: berlin.date,
    };
  }

  const events = await eventsCol
    .find({ berlinDate: berlin.date })
    .sort({ createdAt: 1 })
    .limit(500)
    .toArray();

  const result = await sendMail({
    to: OPERATOR_RECIPIENTS.dailyDigest,
    mail: digestMail(berlin.date, events),
    delivery: "best_effort_delivery",
    tag: "operator_daily_digest",
  });

  await digestCol.updateOne(
    { _id: digestId },
    {
      $set: {
        deliveryStatus: result.ok ? "sent" : "failed",
        messageId: result.messageId ?? null,
      },
    },
  );

  return {
    ok: result.ok,
    berlinDate: berlin.date,
    eventCount: events.length,
    category: result.ok ? null : result.category,
  };
}
