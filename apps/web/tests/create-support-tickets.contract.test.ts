import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccountOverview: vi.fn(),
  sendMail: vi.fn(),
  buildSupportStatusMail: vi.fn(),
  renderedMail: {
    subject: "Support status",
    html: "<p>Support status</p>",
    text: "Support status",
    provenance: {
      renderer: "mailRenderer",
      version: "test",
    },
  },
}));

vi.mock("@features/account/service", () => ({
  getAccountOverview: (...args: unknown[]) => mocks.getAccountOverview(...args),
}));
vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));
vi.mock("@/utils/emailTemplates", () => ({
  buildSupportStatusMail: (...args: unknown[]) =>
    mocks.buildSupportStatusMail(...args),
}));

import {
  createInMemoryCreateSupportTicketRepo,
  ensureCreateSupportTicket,
  getCreateSupportTicketByNumberForAdmin,
  getCreateSupportTicketForUser,
  listCreateSupportNotificationsForUser,
  normalizeCreateSupportTicketRecordForRuntime,
  setCreateSupportTicketRepoForTests,
  transitionCreateSupportTicketStatus,
} from "@/features/support/createSupportTickets";

function delivered(messageId = "mail-1") {
  return {
    ok: true as const,
    status: "delivered" as const,
    transport: "smtp" as const,
    category: null,
    retryable: false as const,
    attemptedCount: 1,
    deliveredCount: 1,
    failedCount: 0 as const,
    messageId,
  };
}

function failed(input: {
  retryable: boolean;
  category?: "smtp_timeout" | "recipient_invalid";
  deliveredCount?: number;
}) {
  const deliveredCount = input.deliveredCount ?? 0;
  return {
    ok: false as const,
    status: deliveredCount > 0 ? ("partial" as const) : ("failed" as const),
    transport: "smtp" as const,
    code: "mail_transport_error" as const,
    category: input.category ?? "smtp_timeout",
    retryable: input.retryable,
    attemptedCount: 1,
    deliveredCount,
    failedCount: deliveredCount > 0 ? 0 : 1,
    messageId: null,
  };
}

async function createTicket(correlationId: string, locale = "de") {
  return ensureCreateSupportTicket({
    affectedUserId: "user-1",
    orchestrationPhase: "intelligent_followup",
    correlationId,
    technicalErrorCode: "CREATE_AI_FAILED",
    reason: "provider_error",
    draftId: "draft-2",
    locale,
  });
}

describe("create support ticket contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCreateSupportTicketRepoForTests(createInMemoryCreateSupportTicketRepo());
    mocks.getAccountOverview.mockResolvedValue({
      email: "nachbar@edebatte.de",
      uiLocale: "de",
      profile: { displayName: "Nachbarin" },
    });
    mocks.buildSupportStatusMail.mockReturnValue(mocks.renderedMail);
    mocks.sendMail.mockResolvedValue(delivered());
  });

  it("deduplicates one failed run but creates a new ticket for a controlled retry", async () => {
    const base = {
      affectedUserId: "user-1",
      orchestrationPhase: "intelligent_followup",
      technicalErrorCode: "CREATE_AI_FAILED",
      reason: "timeout",
      provider: "openai",
      attemptCount: 2,
      draftId: "draft-1",
      locale: "de",
    };
    const first = await ensureCreateSupportTicket({
      ...base,
      correlationId: "correlation-run-1",
    });
    const duplicate = await ensureCreateSupportTicket({
      ...base,
      correlationId: "correlation-run-1",
    });
    const retry = await ensureCreateSupportTicket({
      ...base,
      correlationId: "correlation-run-2",
    });

    expect(duplicate.ticketNumber).toBe(first.ticketNumber);
    expect(retry.ticketNumber).not.toBe(first.ticketNumber);
    await expect(
      getCreateSupportTicketForUser(first.ticketNumber, "another-user"),
    ).resolves.toBeNull();
    await expect(
      getCreateSupportTicketForUser(first.ticketNumber, "user-1"),
    ).resolves.toMatchObject({
      draftId: "draft-1",
      notificationRecipientLinked: true,
      resolutionDelivery: {
        status: "pending",
        attemptCount: 0,
      },
    });
  });

  it("requires a verified user binding and exposes tickets only to that account", async () => {
    await expect(
      ensureCreateSupportTicket({
        affectedUserId: "",
        orchestrationPhase: "intelligent_followup",
        correlationId: "correlation-without-actor",
        technicalErrorCode: "CREATE_AI_FAILED",
      }),
    ).rejects.toThrow("create_support_ticket_actor_required");

    const ticket = await ensureCreateSupportTicket({
      affectedUserId: "verified-user-1",
      orchestrationPhase: "intelligent_followup",
      correlationId: "correlation-user-1",
      technicalErrorCode: "CREATE_AI_FAILED",
      reason: "timeout",
      draftId: "draft-user-1",
      locale: "en",
    });

    expect(ticket).toMatchObject({
      viewHref: expect.stringContaining("/account?ticket="),
      notificationLinked: true,
    });
    await expect(
      getCreateSupportTicketByNumberForAdmin(ticket.ticketNumber),
    ).resolves.toMatchObject({
      affectedUserId: "verified-user-1",
      notificationRecipientLinked: true,
      notificationStatus: "pending",
    });
    await expect(
      getCreateSupportTicketForUser(ticket.ticketNumber, "later-user"),
    ).resolves.toBeNull();
  });

  it("does not deduplicate the same correlation across different actors", async () => {
    const first = await ensureCreateSupportTicket({
      affectedUserId: "user-actor-a",
      orchestrationPhase: "intelligent_followup",
      correlationId: "correlation-shared-by-actors",
      technicalErrorCode: "CREATE_AI_FAILED",
    });
    const second = await ensureCreateSupportTicket({
      affectedUserId: "user-actor-b",
      orchestrationPhase: "intelligent_followup",
      correlationId: "correlation-shared-by-actors",
      technicalErrorCode: "CREATE_AI_FAILED",
    });

    expect(second.ticketNumber).not.toBe(first.ticketNumber);
  });

  it("uses the canonical support renderer object unchanged and records delivery", async () => {
    const created = await createTicket("correlation-resolve-1");

    const resolved = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(resolved).toMatchObject({
      status: "resolved",
      notificationStatus: "email_sent",
      resolutionDelivery: {
        status: "delivered",
        attemptCount: 1,
        messageId: "mail-1",
      },
    });
    expect(mocks.buildSupportStatusMail).toHaveBeenCalledWith({
      displayName: "Nachbarin",
      ticketReference: created.ticketNumber,
      status: "Gelöst",
      resolution:
        "Der technische Fall zu deinem Beitrag wurde gelöst. Du kannst deinen gespeicherten Arbeitsstand fortsetzen.",
      locale: "de",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith({
      to: "nachbar@edebatte.de",
      mail: mocks.renderedMail,
      delivery: "required_delivery",
      tag: "support_ticket_resolved",
    });
    expect(mocks.sendMail.mock.calls[0]?.[0].mail).toBe(mocks.renderedMail);
    await expect(
      listCreateSupportNotificationsForUser("user-1"),
    ).resolves.toEqual([
      expect.objectContaining({
        ticketNumber: created.ticketNumber,
        emailDeliveryStatus: "sent",
        emailMessageId: "mail-1",
      }),
    ]);
  });

  it("hydrates a legacy ticket without a resolution-delivery record", async () => {
    const created = await createTicket("correlation-legacy-resolution");
    const current = await getCreateSupportTicketByNumberForAdmin(
      created.ticketNumber,
    );
    expect(current).not.toBeNull();

    const legacy = {
      ...current!,
      resolutionDelivery: undefined,
    } as any;
    const normalized =
      normalizeCreateSupportTicketRecordForRuntime(legacy);

    expect(normalized.resolutionDelivery).toMatchObject({
      key: `support-resolution-${current!.id}`,
      status: "pending",
      attemptCount: 0,
    });
  });

  it("does not downgrade a delivered resolution during replay", async () => {
    const created = await createTicket("correlation-delivered-replay");

    await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    const replayed = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(replayed).toMatchObject({
      notificationStatus: "email_sent",
      resolutionDelivery: {
        status: "delivered",
        attemptCount: 1,
      },
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("keeps delivery pending when account lookup is temporarily unavailable", async () => {
    const created = await createTicket("correlation-account-unavailable");
    mocks.getAccountOverview.mockRejectedValueOnce(
      new Error("temporary account read failure"),
    );

    const resolved = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(resolved).toMatchObject({
      status: "resolved",
      notificationStatus: "in_app_created",
      resolutionDelivery: {
        status: "pending",
        attemptCount: 0,
      },
    });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    await expect(
      listCreateSupportNotificationsForUser("user-1"),
    ).resolves.toHaveLength(1);
  });

  it("claims one delivery across parallel resolution calls and keeps one notification", async () => {
    const created = await createTicket("correlation-parallel-resolution");

    const results = await Promise.all([
      transitionCreateSupportTicketStatus({
        ticketNumber: created.ticketNumber,
        status: "resolved",
        actorId: "admin-a",
      }),
      transitionCreateSupportTicketStatus({
        ticketNumber: created.ticketNumber,
        status: "resolved",
        actorId: "admin-b",
      }),
    ]);

    expect(results.every((entry) => entry?.status === "resolved")).toBe(true);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    await expect(
      listCreateSupportNotificationsForUser("user-1"),
    ).resolves.toHaveLength(1);
    await expect(
      getCreateSupportTicketByNumberForAdmin(created.ticketNumber),
    ).resolves.toMatchObject({
      resolutionDelivery: { status: "delivered", attemptCount: 1 },
    });
  });

  it("allows exactly one explicit retry after a retryable failure", async () => {
    const created = await createTicket("correlation-retryable-resolution");
    mocks.sendMail
      .mockResolvedValueOnce(failed({ retryable: true }))
      .mockResolvedValueOnce(delivered("mail-retry"));

    const first = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(first).toMatchObject({
      resolutionDelivery: {
        status: "failed_retryable",
        attemptCount: 1,
      },
    });

    const replayWithoutRetry = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(replayWithoutRetry).toMatchObject({
      resolutionDelivery: {
        status: "failed_retryable",
        attemptCount: 1,
      },
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);

    const retry = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
      retryResolutionDelivery: true,
    });
    expect(retry).toMatchObject({
      resolutionDelivery: {
        status: "delivered",
        attemptCount: 2,
        messageId: "mail-retry",
      },
    });

    await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
      retryResolutionDelivery: true,
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
  });

  it("does not retry a terminal delivery failure", async () => {
    const created = await createTicket("correlation-terminal-resolution");
    mocks.sendMail.mockResolvedValue(
      failed({ retryable: false, category: "recipient_invalid" }),
    );

    const first = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(first).toMatchObject({
      resolutionDelivery: {
        status: "failed_terminal",
        attemptCount: 1,
        failureCategory: "recipient_invalid",
      },
    });

    await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("moves an unexpected or partial transport result to reconciliation without resend", async () => {
    const thrown = await createTicket("correlation-unknown-resolution");
    mocks.sendMail.mockRejectedValueOnce(new Error("transport state unknown"));

    const unknown = await transitionCreateSupportTicketStatus({
      ticketNumber: thrown.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(unknown).toMatchObject({
      resolutionDelivery: {
        status: "delivery_unknown",
        attemptCount: 1,
      },
    });
    await transitionCreateSupportTicketStatus({
      ticketNumber: thrown.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
  });

  it("creates the in-app notification but marks email not applicable without an address", async () => {
    const created = await createTicket("correlation-no-email");
    mocks.getAccountOverview.mockResolvedValue({ uiLocale: "de" });

    const resolved = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(resolved).toMatchObject({
      notificationStatus: "in_app_created",
      resolutionDelivery: {
        status: "not_applicable",
        attemptCount: 0,
      },
    });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    await expect(
      listCreateSupportNotificationsForUser("user-1"),
    ).resolves.toHaveLength(1);
  });

  it("renders the English resolution without mixed locale copy", async () => {
    const created = await createTicket("correlation-english-resolution", "en");
    mocks.getAccountOverview.mockResolvedValue({
      email: "neighbor@edebatte.de",
      uiLocale: "en",
    });

    await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(mocks.buildSupportStatusMail).toHaveBeenCalledWith({
      displayName: null,
      ticketReference: created.ticketNumber,
      status: "Resolved",
      resolution:
        "The technical incident affecting your contribution has been resolved. You can continue your saved draft.",
      locale: "en",
    });
  });
});
