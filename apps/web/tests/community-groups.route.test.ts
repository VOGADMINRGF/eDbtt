import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  resolveCommunityGroupSurface: vi.fn(),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@/features/community/groupSurface", () => ({
  resolveCommunityGroupSurface: (...args: unknown[]) => mocks.resolveCommunityGroupSurface(...args),
}));

import { GET } from "@/app/api/community/groups/route";

describe("community groups route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "user-1" });
  });

  it("Scenario A: productive read success returns stable shape", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "group",
      context: { key: "mobility-berlin", label: "Mobilitaet Berlin", type: "regional_group", scope: "regional" },
      members: [{ id: "u2", displayName: "Member", relationshipState: "none", canMessage: false }],
      statements: [],
      dossier: null,
      topicHref: "/swipes?topic=mobility",
      dossierHref: null,
      source: { unavailable: false, error: null },
    });

    const res = await GET(
      new Request(
        "http://localhost/api/community/groups?group=mobility-berlin&type=regional_group&scope=regional&topicKey=mobility",
      ) as any,
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      mode: "group",
      source: { unavailable: false },
    });
    expect(mocks.resolveCommunityGroupSurface).toHaveBeenCalledTimes(1);
  });

  it("Scenario D: invalid params return stable 400 mapping", async () => {
    const res = await GET(new Request("http://localhost/api/community/groups?group=g1&scope=invalid") as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_group_scope",
    });
    expect(mocks.resolveCommunityGroupSurface).not.toHaveBeenCalled();
  });

  it("Scenario D: invalid type returns stable 400 mapping", async () => {
    const res = await GET(new Request("http://localhost/api/community/groups?group=g1&type=wrong") as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_group_type",
    });
    expect(mocks.resolveCommunityGroupSurface).not.toHaveBeenCalled();
  });

  it("Scenario D: malformed mixed params return stable invalid_group_context mapping", async () => {
    const res = await GET(new Request("http://localhost/api/community/groups?topic=mobility") as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_group_context",
    });
    expect(mocks.resolveCommunityGroupSurface).not.toHaveBeenCalled();
  });

  it("Scenario B: legacy alias query stays readable and route remains stable", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "group",
      context: { key: "mobility-berlin", label: "Mobilitaet Berlin", type: "regional_group", scope: "regional" },
      members: [],
      statements: [],
      dossier: null,
      topicHref: "/swipes?topic=mobility",
      dossierHref: null,
      source: { unavailable: false, error: null },
    });

    const res = await GET(
      new Request("http://localhost/api/community/groups?group=mobility-berlin&topic=mobility&region=Berlin") as any,
    );
    expect(res.status).toBe(200);
    expect(mocks.resolveCommunityGroupSurface).toHaveBeenCalledTimes(1);
  });

  it("Scenario C: source failure maps to explicit unavailable response", async () => {
    mocks.resolveCommunityGroupSurface.mockRejectedValue(new Error("boom"));

    const res = await GET(new Request("http://localhost/api/community/groups?group=g1") as any);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "community_group_source_unavailable",
    });
  });
});
