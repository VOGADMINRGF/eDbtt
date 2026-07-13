import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/context/LocaleContext";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );
  return {
    ...actual,
    useParams: () => ({ id: "65f000000000000000000111" }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
  };
});

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: () => null,
}));

import type { SupportedLocale } from "@/config/locales";
import { getOperatorSystemTexts } from "@/features/i18n/operatorSystemTexts";
import CreateClient from "@/app/create/CreateClient";
import AdminFeedsPage from "@/app/admin/feeds/page";
import AdminFeedDraftsPage from "@/app/admin/feeds/drafts/page";
import AdminAnlassraumPage from "@/app/admin/feeds/anlassraum/page";
import AdminAnlassraumDetailPage from "@/app/admin/feeds/anlassraum/[id]/page";

const ENTITLEMENTS = {
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
  serverTimeIso: "2026-03-22T12:00:00.000Z",
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

function renderWithLocale(locale: SupportedLocale, node: JSX.Element) {
  return renderToStaticMarkup(<LocaleProvider initialLocale={locale}>{node}</LocaleProvider>);
}

const LOCALE_CASES: SupportedLocale[] = ["de", "en", "es", "fr", "zh"];

describe("operator surface locale render", () => {
  it.each(LOCALE_CASES)(
    "renders key operator surfaces in %s",
    (locale) => {
      const expected = getOperatorSystemTexts(locale);
      const createHtml = renderWithLocale(
        locale,
        <CreateClient initialEntitlements={ENTITLEMENTS as any} overview={OVERVIEW as any} />,
      );
      // Create is currently DE-first in the primary intake block; keep this
      // assertion stable against locale while still checking render viability.
      expect(createHtml).toContain("Beitrag vorbereiten");

      const feedHtml = renderWithLocale(locale, <AdminFeedsPage />);
      expect(feedHtml).toContain(expected.feeds.headerTitle);

      const draftsHtml = renderWithLocale(locale, <AdminFeedDraftsPage />);
      expect(draftsHtml).toContain(expected.feedDrafts.headerTitle);
      expect(draftsHtml).toContain(`aria-label="${expected.feedDrafts.selectAllAriaLabel}"`);

      const anlassraumListHtml = renderWithLocale(locale, <AdminAnlassraumPage />);
      expect(anlassraumListHtml).toContain(expected.anlassraumList.loading);

      const anlassraumDetailHtml = renderWithLocale(locale, <AdminAnlassraumDetailPage />);
      expect(anlassraumDetailHtml).toContain(expected.anlassraumDetail.loading);
    },
  );
});
