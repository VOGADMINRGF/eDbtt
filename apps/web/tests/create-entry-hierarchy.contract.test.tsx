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
  it("keeps the initial create state reduced to one intake and one primary action", () => {
    const html = renderCreateDe();
    const composerSource = readFileSync(
      resolve(process.cwd(), "src/features/create/SharedCreateComposer.tsx"),
      "utf8",
    );
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );

    expect((html.match(/<textarea/g) ?? []).length).toBe(1);
    expect(html).toContain("id=\"create-primary-intake\"");
    expect(html).toContain("Was möchtest du einbringen?");
    expect(html).toContain("Deinen Beitrag verfassen");
    expect(html).toContain("Strukturiert. Verständlich. Wirkungsvoll.");
    expect(html).toContain("Beitrag strukturieren");
    expect(html).toContain("Anhang");
    expect(html).toContain("Sprache");
    expect(html).toContain("Deine Struktur auf einen Blick");
    expect(html).toContain("Prioritäten");
    expect(html).toContain("Was zählt zuerst?");
    expect(html).toContain("Themencluster");
    expect(html).toContain("Erkannte Cluster");
    expect(html).toContain("Fragen &amp; Abstimmung");
    expect(html).toContain("Offene Fragen");
    expect(html).toContain("Nächste Schritte");
    expect(html).toContain("Was als Nächstes folgt");
    expect((html.match(/data-mobile-structure-card/g) ?? []).length).toBe(4);
    expect(followupSource).toContain("data-mobile-structure-card className=\"flex items-center gap-2.5\"");
    expect(followupSource).toContain("grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,22rem)]");
    expect(composerSource).toContain("text-lg font-semibold tracking-tight");
    expect(composerSource).toContain("data-create-alternate-mode-disclosure");
    expect(composerSource).toContain("px-4 py-3 md:block");
    expect(html).not.toContain("Geführter Ablauf");
    expect(html).not.toContain("Signalbild");
    expect(html).not.toContain("Gelesene Sinnabschnitte");
    expect(html).not.toContain("Lesemodus");
    expect(html).not.toContain("Du/eDebatte-Protokoll");
    expect(html).not.toContain("Visual Map");
    expect(html).not.toContain("Vorgeschlagener Arbeitsstand");
    expect(html).not.toContain("Test stadt");
    expect(html).not.toContain("Checkliste");
    expect(html).not.toContain("Kontingente und Zugriff");
  });
});
