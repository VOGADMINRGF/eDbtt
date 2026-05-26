import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SocialReviewQueueClient from "@/app/atlas/social-review/SocialReviewQueueClient";

describe("social review queue v1", () => {
  it("renders the unified social distribution queue with honest runtime language", () => {
    const html = renderToStaticMarkup(
      <SocialReviewQueueClient
        sourceState="live"
        distributionState="live"
        queue={{
          generatedAt: "2026-05-25T09:00:00.000Z",
          totals: {
            candidates: 1,
            reviewRequired: 1,
            qualifiedContext: 0,
            factcheckSuggested: 0,
          },
          guardrails: {
            noAutoPostingDefault: true,
            noTruthPrivilege: true,
            noPriorityPrivilege: true,
            curatedOrQualifiedOfficialSocialOnly: true,
          },
          items: [],
        }}
        distributionQueue={{
          generatedAt: "2026-05-25T09:00:00.000Z",
          summary: {
            total: 2,
            reviewOpen: 1,
            queued: 1,
            scheduledReady: 0,
            exported: 0,
            blocked: 0,
          },
          guardrails: {
            noAutoPublish: true,
            noOauthConnectors: true,
            noOfficialClaim: true,
            derivedQueue: true,
          },
          items: [
            {
              id: "queue-1",
              title: "Dossier-Masterpost",
              summary: "Kommunikationsentwurf für das Dossier.",
              origin: "dossier_masterpost",
              originLabel: "Dossier-Masterpost",
              status: "queued",
              statusLabel: "In Queue",
              statusDescription: "Beschreibung",
              targetType: "dossier",
              targetLabel: "Dossier-Studio",
              targetHref: "/dossier/demo/studio",
              dossierId: "demo",
              sourceHref: "/dossier/demo",
              anlassraumHref: null,
              swipesHref: null,
              channels: ["website_update", "newsletter_draft"],
              reviewRequired: true,
              reviewHint: "Review nötig",
              riskHint: "Kein Auto-Publish.",
              nextAction: "Zeitfenster festlegen.",
              exportReady: true,
              schedulingReady: true,
              copyReady: true,
              payloadAvailable: true,
              derived: false,
              updatedAt: "2026-05-25T09:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Social Distribution Queue");
    expect(html).toContain("Abgeleitete V1-Queue");
    expect(html).toContain("In Queue");
    expect(html).toContain("Exportfähig");
    expect(html).not.toContain("Live posten");
    expect(html).not.toContain("OAuth");
  });
});
