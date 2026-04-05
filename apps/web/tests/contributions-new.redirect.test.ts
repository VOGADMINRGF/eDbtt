import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (href: string) => mocks.redirect(href),
}));

import ContributionNewPage from "@/app/contributions/new/page";

describe("/contributions/new legacy wrapper", () => {
  it("redirects to canonical /create with default contribution intent", async () => {
    await expect(
      ContributionNewPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/create?intent=source");
  });

  it("forwards query params and appends default intent when missing", async () => {
    await expect(
      ContributionNewPage({
        searchParams: Promise.resolve({
          dossierId: "dossier-7",
          anlassraumId: "65f000000000000000000011",
        }),
      }),
    ).rejects.toThrow(
      "REDIRECT:/create?dossierId=dossier-7&anlassraumId=65f000000000000000000011&intent=source",
    );
  });

  it("keeps explicit intent untouched while forwarding existing params", async () => {
    await expect(
      ContributionNewPage({
        searchParams: Promise.resolve({
          intent: "claim",
          dossierId: "dossier-8",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/create?intent=claim&dossierId=dossier-8");
  });

  it("forwards only allowed create handoff keys", async () => {
    await expect(
      ContributionNewPage({
        searchParams: Promise.resolve({
          signalTitle: "Signal Innenstadt",
          source: "legacy_entry",
          mode: "source",
          unknown: "drop-me",
          legacyMode: "manual",
        }),
      }),
    ).rejects.toThrow("/create?signalTitle=Signal+Innenstadt&source=legacy_entry&mode=source&intent=source");
  });

  it("forwards entry intent/mode hints for canonical create orchestration", async () => {
    await expect(
      ContributionNewPage({
        searchParams: Promise.resolve({
          entry_intent: "round_setup",
          entry_mode: "guided",
        }),
      }),
    ).rejects.toThrow("/create?entry_intent=round_setup&entry_mode=guided&intent=source");
  });
});
