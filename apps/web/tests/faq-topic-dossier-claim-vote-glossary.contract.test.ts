import { describe, expect, it } from "vitest";
import { FAQ_CATEGORIES } from "@/app/faq/faqContent";

function buildFaqCorpus() {
  return FAQ_CATEGORIES.flatMap((category) => category.faqs).map(
    (entry) => `${entry.question}\n${entry.answer}`,
  );
}

describe("faq topic/dossier/claim/vote glossary contract", () => {
  it("includes topic vs dossier explanation", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Sind Thema und Dossier dasselbe?");
    expect(corpus).toContain("Ein Dossier hat meistens ein Hauptthema");
    expect(corpus).toContain("kann aber mehrere Themenfelder berühren");
  });

  it("explains claim as dossier-bound with thematic overlap", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Was ist ein Claim?");
    expect(corpus).toContain("Ein Claim gehört zu einem Dossier");
    expect(corpus).toContain("ein oder mehrere Themen");
  });

  it("explains vote hierarchy from claim or dossier question", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Was ist eine Abstimmung?");
    expect(corpus).toContain("aus einem Claim oder aus einer übergeordneten Dossierfrage");
    expect(corpus).toContain("Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?");
  });
});
