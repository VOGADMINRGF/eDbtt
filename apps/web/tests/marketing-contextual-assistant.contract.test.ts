import { describe, expect, it } from "vitest";
import { buildMarketingCampaignControlReadModel } from "@/features/marketing/campaignControl/readModel";
import { buildMarketingAssistantReadModel } from "@/features/marketing/assistant/readModel";
import { MarketingAssistantReadModelSchema } from "@/features/marketing/assistant/contracts";

describe("marketing contextual assistant", () => {
  it("keeps portfolio recommendations read-only, evidence-bound and limited", () => {
    const model = buildMarketingAssistantReadModel(buildMarketingCampaignControlReadModel());

    expect(MarketingAssistantReadModelSchema.parse(model)).toEqual(model);
    expect(model.scope).toBe("portfolio");
    expect(model.automationAllowed).toBe(false);
    expect(model.actions.length).toBeGreaterThan(0);
    expect(model.actions.length).toBeLessThanOrEqual(3);
    expect(model.actions.every((action) => action.href.startsWith("/admin/"))).toBe(true);
    expect(model.actions.some((action) => action.href.includes("/connections"))).toBe(false);
    expect(model.actions.some((action) => action.href.startsWith("/admin/editorial/queue"))).toBe(false);
    expect(model.actions[0]).toMatchObject({
      kind: "review_content",
      href: "/admin/marketing/review",
      priority: 1,
    });
    expect(model.missingDataDe).toContain("Noch keine Performance-Datenquelle ist verbunden.");
  });

  it("uses selected campaign context without inventing performance", () => {
    const control = buildMarketingCampaignControlReadModel();
    const model = buildMarketingAssistantReadModel(control, {
      campaignId: "CAM-CONTENT-02",
      surface: "cockpit",
    });

    expect(model.scope).toBe("campaign");
    expect(model.campaignId).toBe("CAM-CONTENT-02");
    expect(model.headlineDe).toContain("warten auf Prüfung");
    expect(model.missingDataDe).toContain("Es fehlen verifizierte Performance-Snapshots mit Quelle und Zeitraum.");
    expect(model.actions[0]).toMatchObject({
      kind: "review_content",
      href: "/admin/marketing/review?campaign=CAM-CONTENT-02",
      priority: 1,
    });
    expect(model.actions.some((action) => action.href.startsWith("/admin/editorial/queue"))).toBe(false);
    expect(model.bodyDe).not.toContain("0 Likes");
    expect(model.bodyDe).not.toContain("ROI");
  });

  it("prioritizes content and briefing before scheduling when a campaign has no content", () => {
    const control = buildMarketingCampaignControlReadModel();
    const emptyCampaign = control.campaigns.find((row) => row.plannedContentCount === 0);
    expect(emptyCampaign).toBeDefined();

    const model = buildMarketingAssistantReadModel(control, {
      campaignId: emptyCampaign!.campaign.id,
      surface: "cockpit",
    });

    expect(model.headlineDe).toContain("noch ohne konkrete Inhalte");
    expect(model.actions[0]).toMatchObject({
      kind: "inspect_campaign",
      priority: 1,
      titleDe: "Inhalt und Briefing vorbereiten",
    });
    expect(model.actions[0].href).toContain(`campaign=${emptyCampaign!.campaign.id}`);
    expect(model.actions.some((action) => action.kind === "inspect_distribution")).toBe(false);
  });

  it("creates an insights-specific explanation when measurements are missing", () => {
    const model = buildMarketingAssistantReadModel(buildMarketingCampaignControlReadModel(), {
      campaignId: "CAM-MUNI-09",
      surface: "insights",
    });

    expect(model.scope).toBe("insights");
    expect(model.dataQuality).toBe("missing");
    expect(model.actions.some((action) => action.kind === "inspect_measurement")).toBe(true);
    expect(model.confidence).toBeLessThan(0.5);
  });
});
