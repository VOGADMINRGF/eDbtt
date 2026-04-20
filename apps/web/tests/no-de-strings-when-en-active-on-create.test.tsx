import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: () => null,
}));

import CreateClient, { type CreateClientProps } from "@/app/create/CreateClient";
import { LocaleProvider } from "@/context/LocaleContext";

const PROPS: CreateClientProps = {
  initialEntitlements: {
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
    serverTimeIso: "2026-04-18T12:00:00.000Z",
  },
  overview: {
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
    preferredLocale: "en",
    newsletterOptIn: false,
    emailVerified: true,
    verificationLevel: "none",
    verificationMethods: [],
  },
};

describe("no DE strings when EN active on create", () => {
  it("renders core entry copy fully in EN", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="en">
        <CreateClient {...PROPS} />
      </LocaleProvider>,
    );

    expect(html).toContain("Contribute");
    expect(html).toContain("Review");
    expect(html).toContain("Draft together");
    expect(html).toContain("Attach");
    expect(html).toContain("Voice");

    expect(html).not.toContain("Beitragen");
    expect(html).not.toContain("Prüfen");
    expect(html).not.toContain("Entwerfen");
    expect(html).not.toContain("Zu den Anlässen");
    expect(html).not.toContain("Kontext (optional)");
  });
});
