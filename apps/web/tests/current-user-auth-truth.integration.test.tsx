// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCachedUser,
  fetchCurrentUser,
  useCurrentUser,
  type AuthUser,
} from "@/hooks/auth";

const user: AuthUser = {
  id: "507f1f77bcf86cd799439011",
  email: "member@edebatte.org",
  name: "Ricky",
  roles: ["user"],
  accessTier: "citizenBasic",
  b2cPlanId: null,
  planSlug: "citizenBasic",
  engagementXp: null,
  engagementLevel: null,
  contributionCredits: null,
  vogMembershipStatus: null,
  avatarUrl: null,
  avatarStyle: "initials",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("current user auth truth", () => {
  beforeEach(() => {
    clearCachedUser();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearCachedUser();
  });

  it("maps only the API's valid 401 response to confirmed guest", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ user: null }, 401)));

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it.each([
    ["HTTP 500", () => jsonResponse({ error: "internal_error" }, 500)],
    ["unexpected HTTP status", () => jsonResponse({ user: null }, 403)],
    ["invalid JSON", () => new Response("not-json", { status: 200 })],
    ["invalid user schema", () => jsonResponse({ user: { id: "incomplete" } })],
  ])("rejects %s as unknown", async (_label, response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));

    await expect(fetchCurrentUser()).rejects.toThrow();
  });

  it("rejects a network failure as unknown", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network unavailable")));

    await expect(fetchCurrentUser()).rejects.toThrow();
  });

  it("keeps initial resolution unknown until a valid user response arrives", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })),
    );

    const { result } = renderHook(() => useCurrentUser());
    expect(result.current).toMatchObject({ user: undefined, loading: true });

    await act(async () => {
      resolveFetch(jsonResponse({ user }));
    });

    await waitFor(() => expect(result.current).toMatchObject({ user, loading: false }));
  });

  it("adopts a successful revalidation", async () => {
    const refreshedUser = { ...user, name: "Ricky Aktualisiert" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ user: refreshedUser })));

    const { result } = renderHook(() => useCurrentUser(user));

    await waitFor(() => expect(result.current.user).toEqual(refreshedUser));
    expect(result.current.error).toBeUndefined();
  });

  it("preserves a confirmed authenticated user when revalidation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "internal_error" }, 500)));

    const { result } = renderHook(() => useCurrentUser(user));

    await waitFor(() => expect(result.current.error).toBe("auth_load_failed"));
    expect(result.current.user).toEqual(user);
    expect(result.current.loading).toBe(false);
  });

  it("does not preserve guest truth when guest revalidation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network unavailable")));

    const { result } = renderHook(() => useCurrentUser(null));

    await waitFor(() => expect(result.current.error).toBe("auth_load_failed"));
    expect(result.current.user).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("moves immediately to guest after logout and back to authenticated after login refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ user }))
      .mockResolvedValueOnce(jsonResponse({ user }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useCurrentUser(user));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.confirmLoggedOut();
    });
    expect(result.current).toMatchObject({ user: null, loading: false });

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current).toMatchObject({ user, loading: false });
  });

  it("does not let an older revalidation overwrite a confirmed logout", async () => {
    let resolveRevalidation!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => {
        resolveRevalidation = resolve;
      })),
    );
    const { result } = renderHook(() => useCurrentUser(user));

    await waitFor(() => expect(resolveRevalidation).toBeTypeOf("function"));
    act(() => result.current.confirmLoggedOut());
    await act(async () => resolveRevalidation(jsonResponse({ user })));

    expect(result.current).toMatchObject({ user: null, loading: false });
  });
});
