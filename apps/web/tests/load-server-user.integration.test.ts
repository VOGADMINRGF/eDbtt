import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  findOne: vi.fn(),
  getCol: vi.fn(),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>("@core/db/triMongo");
  return {
    ...actual,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

import { ObjectId } from "@core/db/triMongo";
import { loadServerUser } from "@/lib/server/auth/loadServerUser";

describe("loadServerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCol.mockResolvedValue({ findOne: mocks.findOne });
  });

  it("returns a confirmed guest only after session resolution succeeds", async () => {
    mocks.readSession.mockResolvedValue(null);

    await expect(loadServerUser()).resolves.toBeNull();
    expect(mocks.getCol).not.toHaveBeenCalled();
  });

  it("returns the validated account for an active session", async () => {
    const id = new ObjectId("507f1f77bcf86cd799439011");
    mocks.readSession.mockResolvedValue({ uid: String(id) });
    mocks.findOne.mockResolvedValue({
      _id: id,
      email: "member@edebatte.org",
      name: "Ricky",
      roles: ["user"],
      accessTier: "basis",
      profile: { avatarStyle: "initials" },
    });

    await expect(loadServerUser()).resolves.toMatchObject({
      id: String(id),
      email: "member@edebatte.org",
      roles: ["user"],
      accessTier: "basis",
    });
  });

  it.each(["session", "database"])("returns unknown for a %s failure", async (failure) => {
    if (failure === "session") {
      mocks.readSession.mockRejectedValue(new Error("session unavailable"));
    } else {
      mocks.readSession.mockResolvedValue({ uid: "507f1f77bcf86cd799439011" });
      mocks.getCol.mockRejectedValue(new Error("database unavailable"));
    }

    await expect(loadServerUser()).resolves.toBeUndefined();
  });
});
