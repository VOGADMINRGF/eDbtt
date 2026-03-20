import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/create/context/route";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("@/features/create/contextPicker", () => ({
  listCreateContextPickerItems: (...args: unknown[]) => mocks.list(...args),
  normalizeSelectedAnlassraumId: (value: unknown) => {
    const normalized = String(value || "").trim().toLowerCase();
    return /^[a-f0-9]{24}$/.test(normalized) ? normalized : null;
  },
}));

describe("create context picker route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario A: returns productive picker items", async () => {
    mocks.list.mockResolvedValue([
      {
        anlassraumId: "65f000000000000000000001",
        title: "Mobilitaet Innenstadt",
        summary: "Kontext A",
      },
    ]);

    const res = await GET(new Request("http://localhost/api/create/context?limit=10"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      items: [{ anlassraumId: "65f000000000000000000001" }],
      selectedFound: null,
    });
    expect(mocks.list).toHaveBeenCalledWith({ limit: 10 });
  });

  it("Scenario B: supports explicit empty state response", async () => {
    mocks.list.mockResolvedValue([]);
    const res = await GET(new Request("http://localhost/api/create/context"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, items: [] });
  });

  it("Scenario C: maps source unavailable to stable 503", async () => {
    mocks.list.mockRejectedValue(new Error("create_context_source_unavailable"));
    const res = await GET(new Request("http://localhost/api/create/context"));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "create_context_source_unavailable",
    });
  });

  it("Scenario D: rejects invalid selected context id", async () => {
    const res = await GET(new Request("http://localhost/api/create/context?selectedAnlassraumId=invalid"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_anlassraum_id",
    });
  });

  it("Scenario D: marks stale selected context explicitly", async () => {
    mocks.list.mockResolvedValue([
      {
        anlassraumId: "65f000000000000000000001",
        title: "Mobilitaet Innenstadt",
        summary: "Kontext A",
      },
    ]);

    const res = await GET(
      new Request(
        "http://localhost/api/create/context?selectedAnlassraumId=65f000000000000000000099",
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      selectedAnlassraumId: "65f000000000000000000099",
      selectedFound: false,
    });
  });
});
