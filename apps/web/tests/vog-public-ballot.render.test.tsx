import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VogPublicBallotClient } from "@/app/vog/fragen/[code]/[questionId]/VogPublicBallotClient";
import type { VogPublicBallotReadModel } from "@/features/vog/publicBallotReadModel";

function ballot(
  overrides: Partial<VogPublicBallotReadModel> = {},
): VogPublicBallotReadModel {
  return {
    code: "VOGSET01",
    questionId: "question-1",
    originId: "vog-question-01",
    locale: "de",
    originalLocale: "de",
    lifecycle: "open",
    title: "Soll diese Option priorisiert werden?",
    context: "Kurzer belegter Kontext zur konkreten VOG-Frage.",
    options: [
      { canonicalChoice: "yes", label: "Ja" },
      { canonicalChoice: "no", label: "Nein" },
      { canonicalChoice: "open", label: "Noch offen" },
    ],
    sources: [
      {
        id: "source-1",
        label: "Primärquelle",
        href: "https://example.org/source",
      },
    ],
    counterPositions: [
      {
        id: "counter-1",
        label: "Belegte Gegenposition",
        href: "https://example.org/counter",
      },
    ],
    accessMode: "public_guest",
    attributionMode: "hidden",
    legitimacyClass: "open_public_consultation",
    ownSelection: null,
    ownSelectionLabel: null,
    results: null,
    ...overrides,
  };
}

const metadata = {
  source: "vote4gov" as const,
  origin: "voiceopengov" as const,
  originId: "vog-question-01",
  locale: "de" as const,
};

const localeHrefs = {
  de: "/vog/fragen/VOGSET01/question-1?locale=de",
  en: "/vog/fragen/VOGSET01/question-1?locale=en",
};

describe("VOG public ballot render contract", () => {
  it("puts the concrete question, options and participation class before any login", () => {
    const html = renderToStaticMarkup(
      <VogPublicBallotClient
        initialBallot={ballot()}
        originMetadata={metadata}
        localeHrefs={localeHrefs}
      />,
    );

    expect(html).toContain("Soll diese Option priorisiert werden?");
    expect(html).toContain("Kurzer belegter Kontext");
    expect(html).toContain("Offene öffentliche Beteiligung");
    expect(html).toContain("nicht verifizierte öffentliche Konsultation");
    expect(html).toContain("Ja");
    expect(html).toContain("Nein");
    expect(html).toContain("Noch offen");
    expect(html).toContain('type="radio"');
    expect(html).toContain("Stimme abgeben");
    expect(html).toContain("Roh-IP");
    expect(html).toContain("Primärquelle");
    expect(html).toContain("Belegte Gegenposition");
    expect(html).toContain('href="#vog-evidence"');
    expect(html).not.toContain('href="/login"');
  });

  it("renders an accessible separated participation pass after a guest vote", () => {
    const html = renderToStaticMarkup(
      <VogPublicBallotClient
        initialBallot={ballot({
          ownSelection: "yes",
          ownSelectionLabel: "Ja",
          results: {
            totalVotes: 14,
            openGuestVotes: 11,
            verifiedMemberVotes: 3,
            optionCounts: [
              { canonicalChoice: "yes", label: "Ja", count: 8 },
              { canonicalChoice: "no", label: "Nein", count: 4 },
              { canonicalChoice: "open", label: "Noch offen", count: 2 },
            ],
            distributionChannels: [
              { source: "vote4gov", count: 10 },
              { source: "direct", count: 4 },
            ],
            startsAt: "2026-08-01T00:00:00.000Z",
            closesAt: "2026-09-01T00:00:00.000Z",
            resultStatus: "public_consultation",
          },
        })}
        originMetadata={metadata}
        localeHrefs={localeHrefs}
      />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("Sie haben bereits teilgenommen");
    expect(html).toContain("Beteiligungspass");
    expect(html).toContain("Offene Gaststimmen");
    expect(html).toContain("Verifizierte VOG-Mitgliedsstimmen");
    expect(html).toContain(">11<");
    expect(html).toContain(">3<");
    expect(html).toContain("nicht repräsentativ");
    expect(html).toContain("Ihre Auswahl");
    expect(html).toContain("Aggregierte Verteilungskanäle");
    expect(html).toContain("vote4gov: 10");
    expect(html).toContain('href="/login"');
    expect(html).toContain("Freiwillig anmelden");
  });

  it("renders English and closed states without an active submit action", () => {
    const html = renderToStaticMarkup(
      <VogPublicBallotClient
        initialBallot={ballot({
          locale: "en",
          lifecycle: "closed",
          title: "Should this option be prioritised?",
          context: "Brief evidenced context for the concrete VOG question.",
          options: [
            { canonicalChoice: "yes", label: "Yes" },
            { canonicalChoice: "no", label: "No" },
            { canonicalChoice: "open", label: "Still open" },
          ],
        })}
        originMetadata={{ ...metadata, locale: "en" }}
        localeHrefs={localeHrefs}
      />,
    );

    expect(html).toContain('lang="en"');
    expect(html).toContain("Open public participation");
    expect(html).toContain("This public participation is closed.");
    expect(html).toContain("Neither a raw IP address nor a full user agent".replace("Neither", "neither"));
    expect(html).not.toContain("Submit vote</button>");
  });
});
