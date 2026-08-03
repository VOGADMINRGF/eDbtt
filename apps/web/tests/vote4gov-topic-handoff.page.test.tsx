import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";

const mocks = vi.hoisted(() => ({
  resolveVote4GovTopicHandoff: vi.fn(),
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
}));

vi.mock("@features/vote4gov/sourceRegistry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/vote4gov/sourceRegistry")>();
  return { ...actual, resolveVote4GovTopicHandoff: mocks.resolveVote4GovTopicHandoff };
});

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

import TopicPage from "@/app/topic/[slug]/page";

describe("/topic/[slug]?v4g contextual handoff", () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue(null);
    mocks.userIsAdminDashboard.mockReturnValue(false);
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
    mocks.resolveVote4GovTopicHandoff.mockReturnValue({
      status: "resolved",
      value: {
        articleId: "article-01",
        issue: "01",
        sourceUrl: "https://review.example.org/article-01",
        topicSlug: "bezahlbare-energie-und-waermewende-berlin",
        title: "Kanonischer Vote4Gov-Artikel",
        summary: "Der freigegebene Artikelkontext.",
        thesis: "Die serverseitig freigegebene Artikelthese.",
        lifecycle: "open",
        participationClass: "open_public_consultation",
        originalLanguage: "de",
        readingLanguage: "de",
        translationStatus: "original",
        questions: [
          {
            questionId: "question-01",
            kind: "open_question",
            prompt: "Welche Perspektive fehlt?",
            localSelection: "remembered",
            sourceHref: "https://review.example.org/article-01",
            counterpositionHref: "/dossier/energie#gegenpositionen",
            contributionHref: "/create?source=vote4gov_context",
            impactHref: "/anlassraum/energie#wirkung",
          },
        ],
        publicBallot: {
          status: "unavailable",
          label: "Public Ballot noch nicht freigegeben",
          publicHref: null,
          canWrite: false,
          adapter: "vog-public-ballot-unavailable-v1",
        },
      },
    });
  });

  it("places the verified article context before the existing canonical topic surface", async () => {
    const html = renderToStaticMarkup(
      await TopicPage({
        params: Promise.resolve({ slug: "bezahlbare-energie-und-waermewende-berlin" }),
        searchParams: Promise.resolve({ v4g: "encoded-context" }),
      }),
    );

    expect(mocks.resolveVote4GovTopicHandoff).toHaveBeenCalledWith({
      encodedBundle: "encoded-context",
      topicSlug: "bezahlbare-energie-und-waermewende-berlin",
    });
    expect(html).toContain("Kanonischer Vote4Gov-Artikel");
    expect(html).toContain("Welche Perspektive fehlt?");
    expect(html).toContain("Public Ballot noch nicht freigegeben");
    expect(html.indexOf("Vote4Gov Review")).toBeLessThan(
      html.indexOf("Bezahlbare Energie und belastbare Wärmewende in Berlin"),
    );
    expect(html).not.toContain(">Zustimmen<");
    expect(html).not.toContain(">Widersprechen<");
  });
});
