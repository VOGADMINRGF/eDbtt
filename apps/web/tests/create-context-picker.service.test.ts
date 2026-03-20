import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listRundenEntryItems: vi.fn(),
}));

vi.mock("@features/topicRound/entrySource", () => ({
  listRundenEntryItems: (...args: unknown[]) => mocks.listRundenEntryItems(...args),
}));

import {
  listCreateContextPickerItems,
  normalizeSelectedAnlassraumId,
} from "@/features/create/contextPicker";

describe("create context picker service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario A: returns productive active context items only", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([
      {
        anlassraumId: "65f000000000000000000001",
        lifecycle: "active",
        title: "Mobilitaet Innenstadt",
        summary: "Kontext A",
        topicKey: "mobility",
        anlassraumType: "policy",
        anlassraumStatus: "reviewed",
        sourceMode: "feed",
        outputStatus: "review",
        updatedAt: "2026-03-19T10:00:00.000Z",
      },
      {
        anlassraumId: "65f000000000000000000001",
        lifecycle: "active",
        title: "Duplicate",
        summary: "Duplicate",
        topicKey: "mobility",
        anlassraumType: "policy",
        anlassraumStatus: "reviewed",
        sourceMode: "feed",
        outputStatus: "review",
        updatedAt: "2026-03-19T11:00:00.000Z",
      },
      {
        anlassraumId: null,
        lifecycle: "active",
      },
      {
        anlassraumId: "65f000000000000000000099",
        lifecycle: "closed",
      },
    ]);

    const items = await listCreateContextPickerItems({ limit: 20 });
    expect(mocks.listRundenEntryItems).toHaveBeenCalledWith({ limit: 20 });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      anlassraumId: "65f000000000000000000001",
      title: "Mobilitaet Innenstadt",
      outputStatus: "review",
    });
  });

  it("Scenario B: returns explicit empty list when source has no selectable contexts", async () => {
    mocks.listRundenEntryItems.mockResolvedValue([]);
    await expect(listCreateContextPickerItems()).resolves.toEqual([]);
  });

  it("Scenario C: maps source failure to stable error", async () => {
    mocks.listRundenEntryItems.mockRejectedValue(new Error("round_entry_source_unavailable"));
    await expect(listCreateContextPickerItems()).rejects.toThrow("create_context_source_unavailable");
  });

  it("normalizes selected anlassraum id safely", () => {
    expect(normalizeSelectedAnlassraumId("65F0000000000000000000AA")).toBe("65f0000000000000000000aa");
    expect(normalizeSelectedAnlassraumId("invalid")).toBeNull();
    expect(normalizeSelectedAnlassraumId(undefined)).toBeNull();
  });
});
