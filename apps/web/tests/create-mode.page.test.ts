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
    "Scenario D: canonical /create?mode=%s is reflected in UI",
    async (mode) => {
      const tree = await CreatePage({
        searchParams: Promise.resolve({ mode }),
      });
      const html = renderToStaticMarkup(tree);
      expect(html).toContain(`Aktiver Modus: ${mode}`);
      const lastCall = mocks.analyzeWorkspaceCalls.at(-1);
      expect(lastCall?.createMode).toBe(mode);
    },
  );
});
