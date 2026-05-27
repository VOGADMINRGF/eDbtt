import { beforeEach, describe, expect, it } from "vitest";
import {
  loadAutonomousModule,
  resetAutonomousFixtures,
  setAutonomousFixtures,
} from "./themenradar-autonomous-test-helpers";

describe("themenradar region and organization scope contract", () => {
  beforeEach(() => {
    resetAutonomousFixtures();
  });

  it("keeps organization and region clusters isolated to the matching scope", async () => {
    setAutonomousFixtures({
      createHandoffs: [
        {
          id: "org-1",
          summary: "Interner Hinweis",
          sourceText: "Nur für Organisation A",
          selectedAction: { label: "Thema vorschlagen" },
          topicSeed: { topicLabel: "Interner Haushalt" },
          regionId: "DE-BE",
          organizationId: "org-a",
          claims: [{ title: "Mehr Mittel nötig" }],
          openQuestions: [],
          arguments: [],
          sourceGrounding: [{ label: "Protokoll", status: "document" }],
          createdAt: "2026-05-26T07:00:00.000Z",
          updatedAt: "2026-05-26T07:30:00.000Z",
        },
      ],
      voteDrafts: [
        {
          _id: "region-1",
          title: "Schulbusse im Norden",
          claims: [{ title: "Mehr Schulbusse nötig", topic: "Schulbusse" }],
          status: "review",
          feedReviewState: "ready",
          createdAt: "2026-05-26T09:00:00.000Z",
          publishedAt: "2026-05-26T09:30:00.000Z",
          regionCode: "DE-SH",
        },
      ],
    });

    const { buildAutonomousThemenradarReadModel } = await loadAutonomousModule();
    const orgScoped = await buildAutonomousThemenradarReadModel({
      scope: { organizationIds: ["org-a"], adminContext: false },
    });
    const regionScoped = await buildAutonomousThemenradarReadModel({
      scope: { viewerRegionIds: ["DE-SH"], adminContext: false },
    });
    const noMatch = await buildAutonomousThemenradarReadModel({
      scope: { organizationIds: ["org-b"], viewerRegionIds: ["DE-BY"], adminContext: false },
    });

    expect(orgScoped.items.map((item) => item.organizationId)).toContain("org-a");
    expect(regionScoped.items.map((item) => item.regionId)).toContain("DE-SH");
    expect(noMatch.items).toHaveLength(0);
  });
});
