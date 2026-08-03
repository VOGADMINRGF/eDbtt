import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Vote4GovTopicContext } from "@/features/vote4gov/Vote4GovTopicContext";
import type { Vote4GovResolvedTopicHandoff } from "@features/vote4gov/sourceRegistry";

const resolved: Vote4GovResolvedTopicHandoff = {
  articleId: "article-01",
  issue: "01",
  sourceUrl: "https://review.example.org/ausgabe-01/article-01",
  topicSlug: "bezahlbare-energie-und-waermewende-berlin",
  title: "Kanonischer Artikeltitel",
  summary: "Der freigegebene Artikelkontext.",
  thesis: "Die kanonische Artikelthese.",
  lifecycle: "open",
  participationClass: "open_public_consultation",
  originalLanguage: "de",
  readingLanguage: "de",
  translationStatus: "original",
  questions: [
    {
      questionId: "question-binary",
      kind: "binary_thesis",
      prompt: "Soll diese Position weiter beraten werden?",
      localSelection: "agree",
      sourceHref: "https://review.example.org/ausgabe-01/article-01",
      counterpositionHref: "/dossier/energie#gegenpositionen",
      contributionHref: "/create?source=vote4gov_context",
      impactHref: "/anlassraum/energie#wirkung",
    },
    {
      questionId: "question-open",
      kind: "open_question",
      prompt: "Welche Perspektive fehlt?",
      localSelection: "remembered",
      sourceHref: "https://review.example.org/ausgabe-01/article-01",
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
};

describe("Vote4Gov article context card", () => {
  it("renders article, source, topic, local proposals and direct depth paths", () => {
    const html = renderToStaticMarkup(
      <Vote4GovTopicContext
        resolution={{ status: "resolved", value: resolved }}
        topicTitle="Bezahlbare Energie"
      />,
    );
    expect(html).toContain("Vote4Gov Review");
    expect(html).toContain("Ausgabe 01");
    expect(html).toContain("Kanonischer Artikeltitel");
    expect(html).toContain("Zugeordnetes Thema: Bezahlbare Energie");
    expect(html).toContain("Originalbeitrag öffnen");
    expect(html).toContain("nur lokal vorgemerkt und noch nicht öffentlich gezählt");
    expect(html).toContain("Zustimmung lokal vorgemerkt");
    expect(html).toContain("Nur für später vorgemerkt");
    expect(html).toContain("Gegenposition prüfen");
    expect(html).toContain("Wirkung &amp; nächste Schritte");
    expect(html).toContain("Eigenen Beitrag ergänzen");
    expect(html).toContain("/create?source=vote4gov_context");
  });

  it("shows binary controls only for a server-classified binary thesis", () => {
    const html = renderToStaticMarkup(
      <Vote4GovTopicContext
        resolution={{ status: "resolved", value: resolved }}
        topicTitle="Bezahlbare Energie"
      />,
    );
    expect(html.match(/>Zustimmen</g)).toHaveLength(1);
    expect(html.match(/>Widersprechen</g)).toHaveLength(1);
    expect(html).toContain("Frage 1 von 2");
    expect(html).toContain("Frage 2 von 2");
    expect(html).toContain("Public Ballot noch nicht freigegeben");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("/api/");
  });

  it("renders missing-translation and lifecycle truth without inventing content", () => {
    const html = renderToStaticMarkup(
      <Vote4GovTopicContext
        resolution={{
          status: "resolved",
          value: {
            ...resolved,
            lifecycle: "scheduled",
            translationStatus: "missing_fallback",
          },
        }}
        topicTitle="Bezahlbare Energie"
      />,
    );
    expect(html).toContain("Beteiligung geplant");
    expect(html).toContain("Übersetzung fehlt · Original wird angezeigt");
  });

  it("renders the generic context contract in English for an English reading version", () => {
    const html = renderToStaticMarkup(
      <Vote4GovTopicContext
        resolution={{
          status: "resolved",
          value: {
            ...resolved,
            title: "Canonical article title",
            summary: "Canonical article context.",
            thesis: "The canonical article thesis.",
            readingLanguage: "en",
            translationStatus: "reviewed_translation",
          },
        }}
        topicTitle="Affordable energy"
      />,
    );
    expect(html).toContain("Issue 01");
    expect(html).toContain("Related topic: Affordable energy");
    expect(html).toContain("This selection was only saved locally at Vote4Gov");
    expect(html).toContain("Public ballot not yet released");
    expect(html).toContain("Open source");
    expect(html).toContain("Add your own contribution");
  });

  it("does not echo untrusted values for an invalid handoff", () => {
    const html = renderToStaticMarkup(
      <Vote4GovTopicContext
        resolution={{ status: "invalid", reason: "unknown_question" }}
        topicTitle="Bezahlbare Energie"
      />,
    );
    expect(html).toContain("Artikelkontext nicht verifiziert");
    expect(html).not.toContain("unknown_question");
    expect(html).not.toContain("Zustimmen");
    expect(html).not.toContain("/create");
  });
});
