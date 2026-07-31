import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccountOverview: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("@features/account/service", () => ({
  getAccountOverview: (...args: unknown[]) => mocks.getAccountOverview(...args),
}));
vi.mock("@/utils/mailer", () => ({
  sendMail: (...args: unknown[]) => mocks.sendMail(...args),
}));

import {
  createInMemoryCreateSupportTicketRepo,
  ensureCreateSupportTicket,
  getCreateSupportTicketByNumberForAdmin,
  getCreateSupportTicketForUser,
  listCreateSupportNotificationsForUser,
  setCreateSupportTicketRepoForTests,
  transitionCreateSupportTicketStatus,
} from "@/features/support/createSupportTickets";

describe("create support ticket contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCreateSupportTicketRepoForTests(createInMemoryCreateSupportTicketRepo());
    mocks.getAccountOverview.mockResolvedValue({
      email: "nachbar@edebatte.de",
      uiLocale: "de",
    });
    mocks.sendMail.mockResolvedValue({
      ok: true,
      messageId: "mail-1",
    });
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

  it("creates the linked resolution notification and sends one account email", async () => {
    const created = await ensureCreateSupportTicket({
      affectedUserId: "user-1",
      orchestrationPhase: "intelligent_followup",
      correlationId: "correlation-resolve-1",
      technicalErrorCode: "CREATE_AI_FAILED",
      reason: "provider_error",
      draftId: "draft-2",
      locale: "de",
    });

    const resolved = await transitionCreateSupportTicketStatus({
      ticketNumber: created.ticketNumber,
      status: "resolved",
      actorId: "admin-1",
    });

    expect(resolved).toMatchObject({
      status: "resolved",
      notificationStatus: "email_sent",
    });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "nachbar@edebatte.de",
        tag: "support_ticket_resolved",
      }),
    );
    await expect(
      getCreateSupportTicketByNumberForAdmin(created.ticketNumber),
    ).resolves.toMatchObject({ resolvedAt: expect.any(String) });
    await expect(
      listCreateSupportNotificationsForUser("user-1"),
    ).resolves.toEqual([
      expect.objectContaining({
        ticketNumber: created.ticketNumber,
        emailDeliveryStatus: "sent",
      }),
    ]);
  });
});
