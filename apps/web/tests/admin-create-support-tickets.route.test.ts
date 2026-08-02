import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  getByNumber: vi.fn(),
  transitionStatus: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) =>
    mocks.requireAdminOrResponse(...args),
}));
vi.mock("@/features/support/createSupportTickets", () => ({
  CREATE_SUPPORT_TICKET_STATUSES: [
    "open",
    "investigating",
    "resolved",
    "closed",
  ],
  getCreateSupportTicketByNumberForAdmin: (...args: unknown[]) =>
    mocks.getByNumber(...args),
  transitionCreateSupportTicketStatus: (...args: unknown[]) =>
    mocks.transitionStatus(...args),
}));

import {
  GET,
  PATCH,
} from "@/app/api/admin/support-tickets/[ticketNumber]/route";

describe("admin create support ticket route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toString: () => "admin-1" },
    });
  });

  it("returns the internal ticket only behind the admin gate", async () => {
    mocks.getByNumber.mockResolvedValue({
      ticketNumber: "EDB-20260729-ADMIN001",
      status: "open",
      technicalErrorCode: "CREATE_AI_FAILED",
    });
    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/support-tickets/EDB-20260729-ADMIN001",
      ),
      {
        params: Promise.resolve({
          ticketNumber: "EDB-20260729-ADMIN001",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      ticket: { technicalErrorCode: "CREATE_AI_FAILED" },
    });
    expect(mocks.requireAdminOrResponse).toHaveBeenCalledTimes(1);
  });

  it("transitions the status with the authenticated admin as actor", async () => {
    mocks.transitionStatus.mockResolvedValue({
      ticketNumber: "EDB-20260729-ADMIN001",
      status: "resolved",
    });
    const response = await PATCH(
      new NextRequest(
        "http://localhost/api/admin/support-tickets/EDB-20260729-ADMIN001",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        },
      ),
      {
        params: Promise.resolve({
          ticketNumber: "EDB-20260729-ADMIN001",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.transitionStatus).toHaveBeenCalledWith({
      ticketNumber: "EDB-20260729-ADMIN001",
      status: "resolved",
      actorId: "admin-1",
    });
  });
});
