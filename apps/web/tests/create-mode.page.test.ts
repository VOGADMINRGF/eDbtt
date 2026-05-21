import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getCreateEntitlementsForRequest: vi.fn(),
  getAccountOverview: vi.fn(),
  getDraft: vi.fn(),
  resolveCurrentRequestScopeContext: vi.fn(),
  summarizeRequestScopeContext: vi.fn(),
  analyzeWorkspaceCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/server/entitlements/createEntitlements", () => ({
  getCreateEntitlementsForRequest: (...args: unknown[]) => mocks.getCreateEntitlementsForRequest(...args),
}));

vi.mock("@features/account/service", () => ({
  getAccountOverview: (...args: unknown[]) => mocks.getAccountOverview(...args),
}));

vi.mock("@/server/draftStore", () => ({
  getDraft: (...args: unknown[]) => mocks.getDraft(...args),
}));

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveCurrentRequestScopeContext: (...args: unknown[]) =>
    mocks.resolveCurrentRequestScopeContext(...args),
  summarizeRequestScopeContext: (...args: unknown[]) =>
    mocks.summarizeRequestScopeContext(...args),
}));

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mocks.analyzeWorkspaceCalls.push(props);
    return null;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

describe("/create start surface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCreateEntitlementsForRequest.mockResolvedValue(AUTH_ENTITLEMENTS);
    mocks.getAccountOverview.mockResolvedValue(OVERVIEW);
    mocks.getDraft.mockResolvedValue(null);
    mocks.resolveCurrentRequestScopeContext.mockResolvedValue(null);
    mocks.summarizeRequestScopeContext.mockReturnValue(null);
    mocks.analyzeWorkspaceCalls.length = 0;
  });

  it("renders only the primary start surface on first load", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Was möchtest du einbringen?");
    expect(html).toContain("Beschreibe dein Thema");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Entwerfen");
    expect(html).toContain("Beitrag strukturieren");
    expect(html).toContain("Anhang");
    expect(html).toContain("Sprache");
    expect(html).toContain("create-primary-intake");

    expect(html).not.toContain("Kontext-Picker");
    expect(html).not.toContain("Intake-Kontext");
    expect(mocks.analyzeWorkspaceCalls.length).toBe(0);
  });

  it("does not leak raw query intent/source flags into visible UI", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        source: "runden",
        reason: "round_first_contribution",
        entryIntent: "content_companion",
        entryMode: "guided",
      }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Aus laufendem Anlass gestartet");
    expect(html).not.toContain("round_first_contribution");
    expect(html).not.toContain("content_companion");
    expect(html).not.toContain("entryMode");
    expect(html).not.toContain("entryIntent");
  });

  it("keeps context query from auto-seeding technical prefill text", async () => {
    const tree = await CreatePage({
      searchParams: Promise.resolve({
        source: "feed_drafts_queue",
        signalTitle: "Signal Innenstadt",
        reason: "manual_fast_path_via_create",
      }),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).not.toContain("Intake-Kontext (Anlassraum-first)");
    expect(html).not.toContain("manual_fast_path_via_create");
    expect(html).not.toContain("feed_drafts_queue");
  });

  it("shows the resolved organization scope when available", async () => {
    mocks.resolveCurrentRequestScopeContext.mockResolvedValue({ actorId: "user-1" });
    mocks.summarizeRequestScopeContext.mockReturnValue({
      organizationId: "org-1",
      organizationLabel: "Stadtverwaltung Nord",
      membershipStatus: "organization_verified",
      organizationRole: "communications",
      roleLabel: "Kommunikation",
      regionIds: ["kommune-nord"],
      primaryRegionId: "kommune-nord",
      isOperatorMode: false,
      operatorModeLabel: null,
      sourceOfTruth: "local_membership_store",
      confidence: "high",
    });

    const tree = await CreatePage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(tree);

    expect(html).toContain("Stadtverwaltung Nord · Organisations-verifiziert");
    expect(html).toContain("im Scope deiner Organisation reviewfähig");
  });
});
