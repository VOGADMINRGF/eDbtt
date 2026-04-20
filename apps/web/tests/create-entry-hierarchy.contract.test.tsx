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
    preferredLocale: "de",
    newsletterOptIn: false,
    emailVerified: true,
    verificationLevel: "none",
    verificationMethods: [],
  },
};

function renderCreateDe() {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale="de">
      <CreateClient {...PROPS} />
    </LocaleProvider>,
  );
}

describe("create entry hierarchy contract", () => {
  it("keeps one primary intake field with three clear modes", () => {
    const html = renderCreateDe();

    expect((html.match(/<textarea/g) ?? []).length).toBe(1);
    expect(html).toContain("id=\"create-primary-intake\"");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Entwerfen");
    expect(html).toContain("Beitrag einbringen");
    expect(html).toContain("Kontext (optional)");
    expect(html).toContain("Hilfebereich");

    const intakeIndex = html.indexOf("id=\"create-primary-intake\"");
    const contextIndex = html.indexOf("Kontext (optional)");
    const helpIndex = html.indexOf("Hilfebereich");
    expect(intakeIndex).toBeGreaterThan(-1);
    expect(contextIndex).toBeGreaterThan(intakeIndex);
    expect(helpIndex).toBeGreaterThan(intakeIndex);
  });
});
