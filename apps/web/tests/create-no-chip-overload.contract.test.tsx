import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/components/analyze/AnalyzeWorkspace", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
  }),
}));

import CreateClient, {
  getCreateContextAnchorsForMode,
  resolveCreatePostStartSectionOrder,
  type CreateClientProps,
} from "@/app/create/CreateClient";
import { LocaleProvider } from "@/context/LocaleContext";
import { getCreateContextAnchorDefinitions } from "@/features/create/createSurfaceConfig";

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

describe("create no chip overload contract", () => {
  it("caps visible context chips per mode and keeps them mode-specific", () => {
    const anchors = getCreateContextAnchorDefinitions("de");

    const analyzeAnchors = getCreateContextAnchorsForMode({
      anchors,
      mode: "analyze",
      maxItems: 3,
    });
    const mediaAnchors = getCreateContextAnchorsForMode({
      anchors,
      mode: "media",
      maxItems: 3,
    });
    const guidedAnchors = getCreateContextAnchorsForMode({
      anchors,
      mode: "guided",
      maxItems: 3,
    });

    expect(analyzeAnchors).toHaveLength(3);
    expect(analyzeAnchors.every((anchor) => anchor.mode === "analyze")).toBe(true);
    expect(analyzeAnchors.map((anchor) => anchor.id)).toEqual([
      "question",
      "perspective",
      "objection",
    ]);

    expect(mediaAnchors).toHaveLength(1);
    expect(mediaAnchors[0]?.id).toBe("source");

    expect(guidedAnchors).toHaveLength(1);
    expect(guidedAnchors[0]?.id).toBe("option");
  });

  it("keeps the first load free of extra disclosure and public quota chips", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <CreateClient {...PROPS} />
      </LocaleProvider>,
    );
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const order = resolveCreatePostStartSectionOrder({
      showIntelligentFollowup: true,
      showPostInputModules: true,
      showFollowupQuestionCard: false,
      pickerEnabled: true,
    });

    expect(clientSource).toContain("hideAlternateModeDisclosure");
    expect(order).not.toContain("quotas");
    expect(html).not.toContain("Test stadt");
    expect(html).not.toContain("Checkliste");
    expect(html).not.toContain("Weitere Wege");
    expect(html).not.toContain("Kontingente und Zugriff</span></div><section");
    expect(html).toContain("Deine Struktur auf einen Blick");
    expect(html).not.toContain("Developer-Hinweis");
  });
});
