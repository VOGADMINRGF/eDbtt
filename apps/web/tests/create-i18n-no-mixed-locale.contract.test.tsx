import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
    push: () => undefined,
    replace: () => undefined,
    prefetch: async () => undefined,
    back: () => undefined,
    forward: () => undefined,
  }),
}));

import CreateClient, { type CreateClientProps } from "@/app/create/CreateClient";
import { LocaleProvider } from "@/context/LocaleContext";

const BASE_PROPS: CreateClientProps = {
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

function renderCreate(locale: "de" | "en") {
  return renderToStaticMarkup(
    <LocaleProvider initialLocale={locale}>
      <CreateClient
        {...BASE_PROPS}
        overview={{
          ...BASE_PROPS.overview,
          preferredLocale: locale,
        }}
      />
    </LocaleProvider>,
  );
}

describe("create i18n no mixed locale contract", () => {
  it("keeps EN entry copy free from DE leftovers", () => {
    const html = renderCreate("en");

    expect(html).toContain("What is on your mind?");
    expect(html).toContain("Prepare contribution");
    expect(html).toContain("Sort my text");
    expect(html).toContain("Check source/file");
    expect(html).toContain("Contribute");
    expect(html).toContain("Attach");
    expect(html).toContain("Voice");

    expect(html).not.toContain("Schreib auf, was dich beschäftigt.");
    expect(html).not.toContain("Beitrag vorbereiten");
    expect(html).not.toContain("Text sortieren lassen");
    expect(html).not.toContain("Quelle/Datei prüfen");
  });

  it("keeps DE entry copy free from EN leftovers", () => {
    const html = renderCreate("de");

    expect(html).toContain("Schreib auf, was dich");
    expect(html).toContain("beschäftigt");
    expect(html).toContain("Beitrag vorbereiten");
    expect(html).toContain("Text sortieren lassen");
    expect(html).toContain("Quelle/Datei prüfen");
    expect(html).toContain("Beitrag einreichen");

    expect(html).not.toContain("What is on your mind?");
    expect(html).not.toContain("Prepare contribution");
    expect(html).not.toContain("Sort my text");
  });
});
