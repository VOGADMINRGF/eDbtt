import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getCreateEntitlementsForRequest: vi.fn(),
  getAccountOverview: vi.fn(),
  getDraft: vi.fn(),
  analyzeWorkspaceCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/server/entitlements/createEntitlements", () => ({
  getCreateEntitlementsForRequest: (...args: unknown[]) =>
    mocks.getCreateEntitlementsForRequest(...args),
}));

vi.mock("@features/account/service", () => ({
  getAccountOverview: (...args: unknown[]) => mocks.getAccountOverview(...args),
}));

vi.mock("@/server/draftStore", () => ({
  getDraft: (...args: unknown[]) => mocks.getDraft(...args),
}));

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mocks.analyzeWorkspaceCalls.push(props);
    return null;
  },
}));

import CreatePage from "@/app/create/page";

const AUTH_ENTITLEMENTS = {
  userId: "user-1",
  isAuthenticated: true,
  tier: "citizenBasic",
  edebattePackage: "basis",
  roles: [],
  maxVisibleAiProposals: 3,
  maxFinalizeClaimsPerInput: 3,
  monthlyContributionLimit: null,
  canSubmitStatement: true,
  canSubmitContribution: true,
  canUseAttachments: false,
  canUseExternalExtraction: false,
  canDeepResearch: false,
  swipesPerCredit: 100,
  contributionCredits: 12,
  nextCreditIn: null,
  creditRequiredForContribution: false,
  reasons: {},
  serverTimeIso: "2026-03-19T12:00:00.000Z",
} as const;

const OVERVIEW = {
  userId: "user-1",
  email: "u@example.org",
  displayName: "User",
  accessTier: "citizenBasic",
  roles: [],
  groups: [],
  vogMembershipStatus: "none",
  hasVogMembership: false,
  pricingTier: "citizenBasic",
  stats: {
    swipesThisMonth: 0,
    remainingPostsLevel1: 0,
    remainingPostsLevel2: 0,
    swipeCountTotal: 0,
    xp: 0,
    contributionCredits: 12,
    engagementLevel: "starter",
    nextCreditIn: 0,
    lastSwipeAt: null,
  },
  preferredLocale: "de",
  newsletterOptIn: false,
  emailVerified: true,
  verificationLevel: "none",
  verificationMethods: [],
} as const;

describe("/create canonical mode rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCreateEntitlementsForRequest.mockResolvedValue(AUTH_ENTITLEMENTS);
    mocks.getAccountOverview.mockResolvedValue(OVERVIEW);
    mocks.getDraft.mockResolvedValue(null);
    mocks.analyzeWorkspaceCalls.length = 0;
  });

  it.each(["manual", "source", "ai"] as const)(
    "Scenario D: legacy /create?mode=%s is read but freistart remains canonical",
    async (mode) => {
      const tree = await CreatePage({
        searchParams: Promise.resolve({ mode }),
      });
      const html = renderToStaticMarkup(tree);
      expect(html).toContain("Anlass eröffnen und Beitrag einreichen");
      expect(html).toContain("Ein gemeinsamer Einstieg");
      expect(html).toContain("Legacy-Mode-Parameter erkannt");
      const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
      expect(lastCall?.createMode).toBe("source");
    },
  );

  it("Scenario E: selected anlassraum context stays available on canonical contribution flow", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        mode: "source",
        anlassraumId: "65f000000000000000000011",
      }),
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Kontext-Picker");
    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.createMode).toBe("source");
    expect(lastCall?.selectedAnlassraumId).toBe("65f000000000000000000011");
  });

  it("Scenario E: legacy manual mode no longer suppresses context in canonical contribution flow", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        mode: "manual",
        anlassraumId: "65f000000000000000000011",
      }),
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Kontext-Picker");
    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.createMode).toBe("source");
    expect(lastCall?.selectedAnlassraumId).toBe("65f000000000000000000011");
  });

  it("Scenario E: statement-only entitlement keeps freistart but drops source context forwarding", async () => {
    mocks.getCreateEntitlementsForRequest.mockResolvedValue({
      ...AUTH_ENTITLEMENTS,
      canSubmitContribution: false,
      canSubmitStatement: true,
    });

    const tree = await CreatePage({
      searchParams: Promise.resolve({
        mode: "source",
        anlassraumId: "65f000000000000000000011",
      }),
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Anlass eröffnen und Beitrag einreichen");
    expect(html).not.toContain("Kontext-Picker");

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.createMode).toBe("manual");
    expect(lastCall?.selectedAnlassraumId).toBeUndefined();
  });

  it("uses /swipes as finalize fallback in canonical create flow without dossier", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({}),
    });
    renderToStaticMarkup(tree);

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.afterFinalizeNavigateTo).toBe("/swipes");
  });

  it("routes explicit round_setup entry towards /runden operating surface", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({ entry_intent: "round_setup", entry_mode: "guided" }),
    });
    renderToStaticMarkup(tree);

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.createMode).toBe("source");
    expect(lastCall?.afterFinalizeNavigateTo).toBe("/runden");
  });

  it("uses dossier redirect as finalize fallback when dossierId is present", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({ dossierId: "dossier-42" }),
    });
    renderToStaticMarkup(tree);

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.afterFinalizeNavigateTo).toBe("/dossier/dossier-42");
  });

  it("hydrates intake context from URL and seeds workspace text when no draft/prefill exists", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        anlassraumId: "65f000000000000000000011",
        source: "feed_drafts_queue",
        signalTitle: "Signal Innenstadt",
        sourceUrl: "https://example.org/a",
        region: "DE-BE",
        scope: "regional",
        reason: "manual_fast_path_via_create",
      }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Intake-Kontext");
    expect(html).toContain("Signal Innenstadt");
    expect(html).toContain("Signalspur: feed_drafts_queue");

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(String(lastCall?.initialText ?? "")).toContain("Intake-Kontext (Anlassraum-first)");
    expect(String(lastCall?.initialText ?? "")).toContain("Signal: Signal Innenstadt");
    expect(String(lastCall?.initialText ?? "")).toContain("Primärquelle öffnen URL: https://example.org/a");
  });

  it("ignores unknown legacy query params for intake-context hydration", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        legacyMode: "manual",
        unknown: "drop-me",
      }),
    });
    const html = renderToStaticMarkup(tree);
    expect(html).not.toContain("Intake-Kontext");

    const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
    expect(lastCall?.createMode).toBe("source");
    expect(lastCall?.initialText).toBeUndefined();
  });
});
