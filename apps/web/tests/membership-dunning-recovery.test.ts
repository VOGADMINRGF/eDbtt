import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  application: null as Record<string, any> | null,
  user: {
    _id: "66b0bca9f1b1444b8f635502",
    email: "member@company.de",
    name: "Member",
  } as Record<string, any> | null,
  sendMail: vi.fn(),
}));

function applyUpdate(target: Record<string, any>, update: Record<string, any>) {
  Object.assign(target, update.$set ?? {});
  for (const key of Object.keys(update.$unset ?? {})) {
    delete target[key];
  }
}

const applicationsCollection = {
  find: vi.fn(() => ({
    toArray: async () => (mocks.application ? [mocks.application] : []),
  })),
  findOneAndUpdate: vi.fn(
    async (_query: Record<string, any>, update: Record<string, any>) => {
      const app = mocks.application;
      if (!app || app.status !== "waiting_payment") return null;
      if (app.dunningClaimId || app.dunningRecoveryStatus === "manual") {
        return null;
      }
      applyUpdate(app, update);
      return app;
    },
  ),
  updateOne: vi.fn(
    async (query: Record<string, any>, update: Record<string, any>) => {
      const app = mocks.application;
      if (!app) return { modifiedCount: 0 };
      if (query.dunningClaimId && query.dunningClaimId !== app.dunningClaimId) {
        return { modifiedCount: 0 };
      }
      applyUpdate(app, update);
      return { modifiedCount: 1 };
    },
  ),
};

const usersCollection = {
  findOne: vi.fn(async () => mocks.user),
  updateOne: vi.fn(async () => ({ modifiedCount: 1 })),
};

vi.mock("@core/db/triMongo", () => ({
  coreCol: vi.fn(async (name: string) =>
    name === "membership_applications"
      ? applicationsCollection
      : usersCollection,
  ),
}));

vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

import { runMembershipDunning } from "../../../scripts/membership_dunning";

const delivered = {
  ok: true,
  status: "delivered",
  transport: "smtp",
  category: null,
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 1,
  failedCount: 0,
  messageId: "dunning-message",
};

const transientFailure = {
  ok: false,
  status: "failed",
  transport: "smtp",
  code: "mail_transport_error",
  category: "smtp_timeout",
  retryable: true,
  attemptedCount: 1,
  deliveredCount: 0,
  failedCount: 1,
  messageId: null,
};

const permanentFailure = {
  ok: false,
  status: "failed",
  transport: "smtp",
  code: "mail_transport_error",
  category: "smtp_response_error",
  retryable: false,
  attemptedCount: 1,
  deliveredCount: 0,
  failedCount: 1,
  messageId: null,
};

const NOW = new Date("2026-07-30T12:00:00.000Z");

describe("membership dunning recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VOG_DUNNING_ENABLED = "1";
    process.env.VOG_DUNNING_DAYS_FIRST = "3";
    mocks.application = {
      _id: "66b0bca9f1b1444b8f635501",
      coreUserId: "66b0bca9f1b1444b8f635502",
      status: "waiting_payment",
      dunningLevel: 0,
      firstDueAt: new Date("2026-07-20T12:00:00.000Z"),
      createdAt: new Date("2026-07-20T12:00:00.000Z"),
      updatedAt: new Date("2026-07-20T12:00:00.000Z"),
      amountPerPeriod: 10,
      rhythm: "monthly",
      householdSize: 1,
      members: [],
      legalAcceptedAt: new Date("2026-07-20T12:00:00.000Z"),
      paymentReference: "EDB-123",
    };
    mocks.user = {
      _id: "66b0bca9f1b1444b8f635502",
      email: "member@company.de",
      name: "Member",
    };
    mocks.sendMail.mockResolvedValue(delivered);
  });

  it("moves permanent delivery failures to manual recovery and never auto-retries them", async () => {
    mocks.sendMail.mockResolvedValueOnce(permanentFailure);

    const first = await runMembershipDunning(NOW);
    const second = await runMembershipDunning(
      new Date(NOW.getTime() + 24 * 60 * 60_000),
    );

    expect(first).toMatchObject({ claimed: 1, manualRecovery: 1 });
    expect(second).toMatchObject({ claimed: 0 });
    expect(mocks.application).toMatchObject({
      dunningLevel: 0,
      dunningRecoveryStatus: "manual",
      dunningNextAttemptAt: null,
      lastReminderDeliveryRetryable: false,
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("backs off transient failures and advances the stage only after a later success", async () => {
    mocks.sendMail
      .mockResolvedValueOnce(transientFailure)
      .mockResolvedValueOnce(delivered);

    const first = await runMembershipDunning(NOW);
    const retryAt = mocks.application?.dunningNextAttemptAt as Date;
    const tooEarly = await runMembershipDunning(
      new Date(NOW.getTime() + 60_000),
    );
    const retry = await runMembershipDunning(
      new Date(retryAt.getTime() + 1),
    );

    expect(first).toMatchObject({ retryScheduled: 1, delivered: 0 });
    expect(tooEarly).toMatchObject({ claimed: 0 });
    expect(retry).toMatchObject({ delivered: 1 });
    expect(mocks.application).toMatchObject({
      dunningLevel: 1,
      lastReminderDeliveryStatus: "delivered",
      dunningFailureCount: 0,
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it("uses an atomic claim so parallel runs send a stage only once", async () => {
    let resolveDelivery!: (value: typeof delivered) => void;
    mocks.sendMail.mockImplementationOnce(
      () =>
        new Promise<typeof delivered>((resolve) => {
          resolveDelivery = resolve;
        }),
    );

    const firstPromise = runMembershipDunning(NOW);
    await vi.waitFor(() =>
      expect(mocks.application?.dunningClaimId).toEqual(expect.any(String)),
    );
    const second = await runMembershipDunning(NOW);

    expect(second).toMatchObject({ claimed: 0, delivered: 0 });
    resolveDelivery(delivered);
    const first = await firstPromise;

    expect(first).toMatchObject({ claimed: 1, delivered: 1 });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.application?.dunningLevel).toBe(1);
  });
});
