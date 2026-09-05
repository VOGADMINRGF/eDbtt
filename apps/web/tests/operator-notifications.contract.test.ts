import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const afterCallbacks: Array<() => void | Promise<void>> = [];
  const events = new Map<string, AnyDoc>();
  const digests = new Map<string, AnyDoc>();
  const users = new Map<string, AnyDoc>();

  function collection(store: Map<string, AnyDoc>) {
    return {
      async updateOne(filter: AnyDoc, update: AnyDoc) {
        const key = String(filter._id);
        const existing = store.get(key);
        if (!existing && update.$setOnInsert) {
          store.set(key, { ...update.$setOnInsert });
          return { acknowledged: true, upsertedId: key, matchedCount: 0 };
        }
        if (existing && update.$set) {
          store.set(key, { ...existing, ...update.$set });
        }
        return { acknowledged: true, upsertedId: null, matchedCount: existing ? 1 : 0 };
      },
      find(filter: AnyDoc) {
        const matching = [...store.values()].filter(
          (entry) => !filter.berlinDate || entry.berlinDate === filter.berlinDate,
        );
        return {
          sort() {
            return {
              limit(limit: number) {
                return {
                  async toArray() {
                    return matching.slice(0, limit);
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  return {
    afterCallbacks,
    events,
    digests,
    users,
    after: vi.fn((callback: () => void | Promise<void>) => {
      afterCallbacks.push(callback);
    }),
    coreCol: vi.fn(async (name: string) => {
      if (name === "operator_notification_events") return collection(events);
      if (name === "operator_notification_digests") return collection(digests);
      throw new Error(`unexpected_collection_${name}`);
    }),
    getCol: vi.fn(async (name: string) => {
      if (name !== "users") throw new Error(`unexpected_collection_${name}`);
      return {
        async findOne(filter: AnyDoc) {
          return users.get(String(filter._id)) ?? null;
        },
      };
    }),
    sendMail: vi.fn(async () => ({
      ok: true as const,
      status: "delivered" as const,
      transport: "smtp" as const,
      category: null,
      retryable: false,
      attemptedCount: 1,
      deliveredCount: 1,
      failedCount: 0 as const,
      messageId: "message-1",
    })),
  };
});

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: mocks.after };
});

vi.mock("@core/db/triMongo", async () => {
  const { ObjectId } = await import("mongodb");
  return {
    ObjectId,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

import { NextRequest } from "next/server";
import { GET as operatorDigestGET } from "@/app/api/cron/operator-digest/route";
import {
  isBerlinDigestHour,
  OPERATOR_RECIPIENTS,
  scheduleCreateSubmissionNotification,
  scheduleMemberRegistrationNotification,
  scheduleSupportTicketNotification,
  sendDailyOperatorDigest,
} from "@/features/operator/operatorNotifications";

async function runLastScheduledWork() {
  const callback = mocks.afterCallbacks.at(-1);
  expect(callback).toBeTypeOf("function");
  await callback?.();
}

describe("operator notification routing contract", () => {
  beforeEach(() => {
    mocks.afterCallbacks.length = 0;
    mocks.events.clear();
    mocks.digests.clear();
    mocks.users.clear();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.restoreAllMocks();
  });

  it("pins operational recipients and allowlist domains to the requested inboxes", () => {
    expect(OPERATOR_RECIPIENTS).toEqual({
      createSubmission: "social@edebatte.org",
      supportTicket: "qa-auth@edebatte.org",
      memberRegistration: "members@edebatte.org",
      dailyDigest: "rgf@voiceopengov.org",
    });
    expect(new Set(Object.values(OPERATOR_RECIPIENTS).map((value) => value.split("@")[1]))).toEqual(
      new Set(["edebatte.org", "voiceopengov.org"]),
    );
  });

  it("recognizes 18:00 Europe/Berlin in summer and winter", () => {
    expect(isBerlinDigestHour(new Date("2026-09-05T16:00:00.000Z"))).toBe(true);
    expect(isBerlinDigestHour(new Date("2026-01-05T17:00:00.000Z"))).toBe(true);
  });

  it("rejects the neighboring UTC cron slot after Berlin 18:00 already passed", () => {
    expect(isBerlinDigestHour(new Date("2026-09-05T17:00:00.000Z"))).toBe(false);
    expect(isBerlinDigestHour(new Date("2026-01-05T16:00:00.000Z"))).toBe(false);
  });

  it("keeps the two DST slots as separate once-daily Vercel cron jobs", () => {
    const config = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "../../vercel.json"), "utf8"),
    );
    expect(config.crons).toEqual([
      {
        path: "/api/cron/operator-digest?slot=summer",
        schedule: "0 16 * * *",
      },
      {
        path: "/api/cron/operator-digest?slot=winter",
        schedule: "0 17 * * *",
      },
    ]);
  });

  it("schedules each durable create draft through after(), routes it to Social, and deduplicates retries", async () => {
    const input = {
      draftId: "draft-123",
      text: "Ein Beitrag zu barrierefreier Arbeit und fairem Mindestlohn.",
      locale: "de",
    };

    expect(() => scheduleCreateSubmissionNotification(input)).not.toThrow();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.afterCallbacks).toHaveLength(1);

    await runLastScheduledWork();
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "social@edebatte.org",
        delivery: "best_effort_delivery",
        tag: "operator_create_submission",
      }),
    );
    const firstMail = mocks.sendMail.mock.calls[0]?.[0]?.mail;
    expect(firstMail.text).toContain(input.text);
    expect(firstMail.text).not.toContain(input.draftId);

    scheduleCreateSubmissionNotification(input);
    await runLastScheduledWork();
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.events).toHaveLength(1);
  });

  it("routes technical ticket metadata to QA/Auth without copying contribution content", async () => {
    scheduleSupportTicketNotification({
      ticketNumber: "CREATE-42",
      affectedUserId: "user-9",
      technicalErrorCode: "CREATE_AI_FAILED",
      provider: "openai",
      reason: "provider_timeout",
    });
    await runLastScheduledWork();

    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "qa-auth@edebatte.org", tag: "operator_support_ticket" }),
    );
    const mail = mocks.sendMail.mock.calls[0]?.[0]?.mail;
    expect(mail.text).toContain("CREATE-42");
    expect(mail.text).toContain("CREATE_AI_FAILED");
    expect(mail.text).toContain("provider_timeout");
    expect(mail.text).not.toContain("Ein Beitrag zu barrierefreier Arbeit");
  });

  it("loads only the registration projection and routes necessary member data to Members", async () => {
    const userId = "65f000000000000000000011";
    mocks.users.set(userId, {
      _id: userId,
      name: "Ada Beispiel",
      email: "ada@edebatte.org",
      profile: { locale: "de" },
    });

    scheduleMemberRegistrationNotification(userId);
    await runLastScheduledWork();

    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "members@edebatte.org", tag: "operator_member_registration" }),
    );
    const mail = mocks.sendMail.mock.calls[0]?.[0]?.mail;
    expect(mail.text).toContain("Ada Beispiel");
    expect(mail.text).toContain("ada@edebatte.org");
    expect(mail.text).toContain("Nutzer-ID");
    expect(mail.text).toContain("E-Mail");
  });

  it("routes one digest per Berlin calendar day to the operator inbox", async () => {
    const now = new Date("2026-09-05T16:00:00.000Z");
    await expect(sendDailyOperatorDigest(now)).resolves.toMatchObject({
      ok: true,
      berlinDate: "2026-09-05",
      eventCount: 0,
    });
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "rgf@voiceopengov.org", tag: "operator_daily_digest" }),
    );

    await expect(sendDailyOperatorDigest(now)).resolves.toMatchObject({
      ok: true,
      skipped: "already_claimed",
      berlinDate: "2026-09-05",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("fails cron authorization closed when CRON_SECRET is missing or too short", async () => {
    const missing = await operatorDigestGET(
      new NextRequest("http://localhost/api/cron/operator-digest"),
    );
    expect(missing.status).toBe(401);

    process.env.CRON_SECRET = "short";
    const short = await operatorDigestGET(
      new NextRequest("http://localhost/api/cron/operator-digest", {
        headers: { authorization: "Bearer short" },
      }),
    );
    expect(short.status).toBe(401);
    expect(mocks.coreCol).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("contains an asynchronous mail failure so it cannot alter the completed citizen request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.sendMail.mockRejectedValueOnce(new Error("smtp_unavailable"));

    expect(() =>
      scheduleCreateSubmissionNotification({
        draftId: "draft-mail-failure",
        text: "Der Entwurf ist bereits dauerhaft gespeichert.",
        locale: "de",
      }),
    ).not.toThrow();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    await expect(runLastScheduledWork()).resolves.toBeUndefined();
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });
});
