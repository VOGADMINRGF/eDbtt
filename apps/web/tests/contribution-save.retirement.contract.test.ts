import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createDraft: vi.fn(),
  patchDraft: vi.fn(),
}));

vi.mock("@/server/draftStore", () => ({
  createDraft: (...args: unknown[]) => mocks.createDraft(...args),
  patchDraft: (...args: unknown[]) => mocks.patchDraft(...args),
  getDraft: vi.fn(async () => null),
}));

import { POST as legacyDraftCreatePost } from "@/app/api/drafts/route";
import { POST as legacyDraftCreateAliasPost } from "@/app/api/drafts/create/route";
import { PATCH as legacyDraftPatch } from "@/app/api/drafts/[id]/route";
import { createDraft as createContributionNavigationDraft } from "@features/common/utils/draftNavigation";
import { createDraft as createRetiredServerDraft, patchDraft as patchRetiredServerDraft } from "@/server/drafts";

describe("contribution save retirement contract", () => {
  it("keeps the historical contribution save route removed", () => {
    const retiredRoutePath = path.join(process.cwd(), "src/app/api/contributions/save/route.ts");
    expect(existsSync(retiredRoutePath)).toBe(false);
  });

  it("points the contribution workspace save endpoint at the canonical create save runtime", () => {
    const contributionClientPath = path.join(process.cwd(), "src/app/contributions/new/ContributionNewClient.tsx");
    const contributionClientSource = readFileSync(contributionClientPath, "utf8");

    expect(contributionClientSource).toContain('saveEndpoint="/api/create/save"');
    expect(contributionClientSource).not.toContain('saveEndpoint="/api/contributions/save"');
  });

  it("fails closed for the legacy /api/drafts POST write path", async () => {
    const response = await legacyDraftCreatePost(
      new NextRequest("http://localhost/api/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "contribution",
          text: "Alter Draft-Create-Pfad darf keinen neuen Draft mehr schreiben.",
        }),
      }),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "legacy_draft_write_retired",
    });
    expect(mocks.createDraft).not.toHaveBeenCalled();
  });

  it("fails closed for the legacy /api/drafts/create POST alias", async () => {
    const response = await legacyDraftCreateAliasPost(
      new NextRequest("http://localhost/api/drafts/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "contribution",
          text: "Alias-Pfad darf keinen eigenen Legacy-Draft mehr erzeugen.",
        }),
      }),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "legacy_draft_write_retired",
    });
    expect(mocks.createDraft).not.toHaveBeenCalled();
  });

  it("fails closed for the legacy /api/drafts/[id] patch path", async () => {
    const response = await legacyDraftPatch(
      new NextRequest("http://localhost/api/drafts/legacy-id", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Patch darf keinen Legacy-Draft mehr fortschreiben." }),
      }),
      { params: Promise.resolve({ id: "legacy-id" }) },
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "legacy_draft_write_retired",
    });
    expect(mocks.patchDraft).not.toHaveBeenCalled();
  });

  it("keeps active contribution navigation off the retired /api/drafts POST path", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const draftId = await createContributionNavigationDraft({
      kind: "contribution",
      text: "Aktive Navigation darf keinen retired Draft-POST mehr treffen.",
      analysis: {},
    });

    expect(draftId).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("keeps the dormant server/drafts writer fail-closed", async () => {
    await expect(createRetiredServerDraft({ text: "retired" })).rejects.toThrow(
      "draft_writer_retired_use_saveUserScopedServerDraft",
    );
    await expect(patchRetiredServerDraft("draft-id", { text: "retired" })).rejects.toThrow(
      "draft_writer_retired_use_saveUserScopedServerDraft",
    );
  });

  it("keeps legacy draftStore create/patch fail-closed", async () => {
    const actualDraftStore = await vi.importActual<typeof import("@/server/draftStore")>("@/server/draftStore");

    await expect(actualDraftStore.createDraft({ kind: "contribution", text: "retired" })).rejects.toThrow(
      "legacy_draft_store_write_retired",
    );
    await expect(actualDraftStore.patchDraft("draft-id", { text: "retired" })).rejects.toThrow(
      "legacy_draft_store_write_retired",
    );
  });
});
