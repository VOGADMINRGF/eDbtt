import { buildMarketingCampaignControlReadModel } from "../campaignControl/readModel";
import type {
  MarketingCampaignControlReadModel,
  MarketingCampaignControlRow,
} from "../campaignControl/readModel";
import type { MarketingDataQuality } from "../campaignControl/contracts";
import {
  MarketingAssistantReadModelSchema,
  type MarketingAssistantAction,
  type MarketingAssistantEvidence,
  type MarketingAssistantReadModel,
} from "./contracts";

type BuildOptions = {
  campaignId?: string | null;
  surface?: "cockpit" | "insights";
};

export function buildMarketingAssistantReadModel(
  control: MarketingCampaignControlReadModel = buildMarketingCampaignControlReadModel(),
  options: BuildOptions = {},
): MarketingAssistantReadModel {
  const campaign = options.campaignId
    ? control.campaigns.find((row) => row.campaign.id === options.campaignId) ?? null
    : null;

  const candidate = campaign
    ? buildCampaignAssistant(control, campaign, options.surface ?? "cockpit")
    : buildPortfolioAssistant(control, options.surface ?? "cockpit");

  return MarketingAssistantReadModelSchema.parse(candidate);
}

function buildPortfolioAssistant(
  control: MarketingCampaignControlReadModel,
  surface: "cockpit" | "insights",
): MarketingAssistantReadModel {
  const reviewReady = control.contentItems.filter((item) => item.content.status === "review_ready").length;
  const scheduled = control.summary.scheduledItems;
  const published = control.summary.publishedItems;
  const connectedSources = control.summary.connectedSourceKinds;
  const withPerformance = control.summary.campaignsWithPerformance;

  const headlineDe = reviewReady
    ? `${reviewReady} Inhalte warten auf Prüfung.`
    : scheduled
      ? `${scheduled} Inhalte sind eingeplant.`
      : "Die Kampagnen sind angelegt, aber noch nicht in Ausspielung.";
  const headlineEn = reviewReady
    ? `${reviewReady} content items are waiting for review.`
    : scheduled
      ? `${scheduled} content items are scheduled.`
      : "Campaigns exist, but distribution has not started yet.";

  const missingDataDe = [
    ...(published === 0 ? ["Noch keine Veröffentlichung ist mit öffentlichem Link und Zeitpunkt belegt."] : []),
    ...(connectedSources === 0 ? ["Noch keine Performance-Datenquelle ist verbunden."] : []),
    ...(scheduled === 0 ? ["Noch kein Inhalt besitzt einen bestätigten Veröffentlichungstermin."] : []),
  ];
  const missingDataEn = [
    ...(published === 0 ? ["No publication is backed by a public link and publishing time yet."] : []),
    ...(connectedSources === 0 ? ["No performance data source is connected yet."] : []),
    ...(scheduled === 0 ? ["No content item has a confirmed publishing time yet."] : []),
  ];

  const actions: MarketingAssistantAction[] = [];
  if (reviewReady > 0) {
    actions.push(action(
      "review-ready-content",
      "review_content",
      1,
      "Marketing-Inhalte prüfen",
      "Review marketing content",
      `${reviewReady} konkrete Marketinginhalte sind fachlich oder visuell noch nicht freigegeben.`,
      `${reviewReady} concrete marketing content items still need professional or visual approval.`,
      "/admin/marketing/review",
      "verified",
      0.98,
    ));
  }
  if (scheduled === 0) {
    actions.push(action(
      "inspect-distribution-plan",
      "inspect_distribution",
      actions.length + 1,
      "Beiträge und Terminplanung öffnen",
      "Open content and scheduling plan",
      "Die vorhandenen Inhalte sind noch nicht mit einem bestätigten Ausspieltermin verbunden.",
      "Existing content is not linked to a confirmed distribution time yet.",
      "/admin/marketing#distribution",
      "verified",
      0.96,
    ));
  }
  if (connectedSources === 0 || withPerformance === 0) {
    actions.push(action(
      "inspect-measurement-basis",
      "improve_data_basis",
      actions.length + 1,
      "Messplan und Datenlage prüfen",
      "Review measurement plan and data coverage",
      "Ohne verifizierte Messdaten ist noch keine Plattform- oder Reichweitenempfehlung belastbar.",
      "Without verified measurements, platform and reach recommendations are not reliable yet.",
      "/admin/marketing/insights",
      "missing",
      0.99,
    ));
  }

  const quality: MarketingDataQuality = connectedSources > 0 ? "partial" : "missing";
  return {
    generatedAt: control.generatedAt,
    scope: surface === "insights" ? "insights" : "portfolio",
    campaignId: null,
    headlineDe,
    headlineEn,
    bodyDe: `${control.summary.campaigns} Kampagnen und ${control.summary.contentItems} konkrete Inhalte sind erfasst. ${published} Veröffentlichungen und ${withPerformance} Kampagnen mit Leistungsdaten sind derzeit belegt. Fehlende Daten werden nicht als Misserfolg bewertet.`,
    bodyEn: `${control.summary.campaigns} campaigns and ${control.summary.contentItems} concrete content items are recorded. ${published} publications and ${withPerformance} campaigns with performance data are currently evidenced. Missing data is not treated as failure.`,
    dataQuality: quality,
    confidence: qualityConfidence(quality),
    evidence: [
      evidence("campaigns", "Kampagnen im Portfolio", "Campaigns in portfolio", String(control.summary.campaigns), "verified"),
      evidence("content", "Konkrete Inhalte", "Concrete content items", String(control.summary.contentItems), "verified"),
      evidence("published", "Belegte Veröffentlichungen", "Evidenced publications", String(published), published ? "verified" : "missing"),
      evidence("sources", "Verbundene Datenarten", "Connected source types", String(connectedSources), connectedSources ? "partial" : "missing"),
    ],
    missingDataDe,
    missingDataEn,
    actions: actions.slice(0, 3),
    automationAllowed: false,
  };
}

function buildCampaignAssistant(
  control: MarketingCampaignControlReadModel,
  row: MarketingCampaignControlRow,
  surface: "cockpit" | "insights",
): MarketingAssistantReadModel {
  const reviewReady = row.contentItems.filter((item) => item.status === "review_ready").length;
  const scheduled = row.scheduledContentCount;
  const published = row.publishedContentCount;
  const snapshots = row.metricSnapshots.length;
  const hasContent = row.plannedContentCount > 0;

  const headlineDe = reviewReady
    ? `${reviewReady} Inhalte dieser Kampagne warten auf Prüfung.`
    : scheduled
      ? `${scheduled} Inhalte sind für diese Kampagne eingeplant.`
      : published && snapshots === 0
        ? "Die Kampagne wurde ausgespielt, aber die Wirkung ist noch nicht messbar verbunden."
        : !hasContent
          ? "Die Kampagne ist definiert, aber noch ohne konkrete Inhalte."
          : "Die Kampagne ist vorbereitet; der nächste Ausführungsschritt ist noch offen.";
  const headlineEn = reviewReady
    ? `${reviewReady} campaign content items are waiting for review.`
    : scheduled
      ? `${scheduled} content items are scheduled for this campaign.`
      : published && snapshots === 0
        ? "The campaign was distributed, but its impact is not connected to measurements yet."
        : !hasContent
          ? "The campaign is defined but has no concrete content yet."
          : "The campaign is prepared; its next execution step is still open.";

  const missingDataDe = [
    ...(!hasContent ? ["Es fehlen konkrete Posts, Videos oder andere Ausspielvarianten."] : []),
    ...(hasContent && scheduled === 0 ? ["Es fehlt ein bestätigter Veröffentlichungstermin."] : []),
    ...(published === 0 ? ["Es fehlt ein belegter Veröffentlichungseintrag."] : []),
    ...(snapshots === 0 ? ["Es fehlen verifizierte Performance-Snapshots mit Quelle und Zeitraum."] : []),
  ];
  const missingDataEn = [
    ...(!hasContent ? ["Concrete posts, videos or other distribution variants are missing."] : []),
    ...(hasContent && scheduled === 0 ? ["A confirmed publishing time is missing."] : []),
    ...(published === 0 ? ["A verified publication record is missing."] : []),
    ...(snapshots === 0 ? ["Verified performance snapshots with source and period are missing."] : []),
  ];

  const actions: MarketingAssistantAction[] = [];
  if (!hasContent) {
    actions.push(action(
      `briefing-${row.campaign.id}`,
      "inspect_campaign",
      1,
      "Inhalt und Briefing vorbereiten",
      "Prepare content and briefing",
      "Vor Kanal- oder Terminplanung braucht die Kampagne mindestens einen konkreten Post, ein Video oder ein abgestimmtes Briefing.",
      "Before channel or scheduling work, the campaign needs at least one concrete post, video or agreed briefing.",
      `/admin/marketing?campaign=${encodeURIComponent(row.campaign.id)}#campaign-detail`,
      "verified",
      0.99,
    ));
  }
  if (reviewReady > 0) {
    actions.push(action(
      `review-${row.campaign.id}`,
      "review_content",
      actions.length + 1,
      "Kampagneninhalte prüfen",
      "Review campaign content",
      "Die ausstehenden Marketinginhalte müssen vor Terminierung oder Veröffentlichung freigegeben werden.",
      "Pending marketing content must be approved before scheduling or publishing.",
      `/admin/marketing/review?campaign=${encodeURIComponent(row.campaign.id)}`,
      "verified",
      0.99,
    ));
  }
  if (hasContent && scheduled === 0) {
    actions.push(action(
      `distribution-${row.campaign.id}`,
      "inspect_distribution",
      actions.length + 1,
      "Kanal- und Terminplanung prüfen",
      "Review channels and scheduling",
      "Die Kampagne besitzt konkrete Inhalte, aber noch keinen bestätigten Ausspieltermin.",
      "The campaign has concrete content but no confirmed distribution time yet.",
      `/admin/marketing?campaign=${encodeURIComponent(row.campaign.id)}#distribution`,
      "verified",
      0.97,
    ));
  }
  if (snapshots === 0 || !row.hasPerformanceData) {
    actions.push(action(
      `measurement-${row.campaign.id}`,
      "inspect_measurement",
      actions.length + 1,
      "Messplan und Datenlage öffnen",
      "Open measurement plan and data coverage",
      "Ohne verknüpfte Messdaten kann der Assistent noch keine Plattform-, Reichweiten- oder Skalierungsempfehlung geben.",
      "Without linked measurements, the assistant cannot recommend platforms, reach or scaling yet.",
      `/admin/marketing/insights?campaign=${encodeURIComponent(row.campaign.id)}`,
      "missing",
      0.99,
    ));
  } else {
    actions.push(action(
      `insights-${row.campaign.id}`,
      "inspect_measurement",
      actions.length + 1,
      "Kampagnenergebnisse prüfen",
      "Review campaign results",
      "Für diese Kampagne liegen gekennzeichnete Messdaten vor; Bewertung und Datenqualität sollten gemeinsam geprüft werden.",
      "Qualified measurements exist for this campaign; results and data quality should be reviewed together.",
      `/admin/marketing/insights?campaign=${encodeURIComponent(row.campaign.id)}`,
      row.dataQuality,
      qualityConfidence(row.dataQuality),
    ));
  }

  return {
    generatedAt: control.generatedAt,
    scope: surface === "insights" ? "insights" : "campaign",
    campaignId: row.campaign.id,
    headlineDe,
    headlineEn,
    bodyDe: `${row.campaign.title} richtet sich primär an ${row.profile.primarySegment.toUpperCase()} und verfolgt das Ziel: ${row.profile.objective} Aktuell sind ${row.plannedContentCount} Inhalte, ${scheduled} Termine, ${published} belegte Veröffentlichungen und ${snapshots} Mess-Snapshots verbunden.`,
    bodyEn: `${row.campaign.title} primarily targets ${row.profile.primarySegment.toUpperCase()} and pursues this objective: ${row.profile.objective} It currently has ${row.plannedContentCount} content items, ${scheduled} schedules, ${published} evidenced publications and ${snapshots} metric snapshots.`,
    dataQuality: row.dataQuality,
    confidence: qualityConfidence(row.dataQuality),
    evidence: [
      evidence("campaign", "Kampagne", "Campaign", row.campaign.title, "verified"),
      evidence("content", "Konkrete Inhalte", "Concrete content items", String(row.plannedContentCount), "verified"),
      evidence("published", "Belegte Veröffentlichungen", "Evidenced publications", String(published), published ? "verified" : "missing"),
      evidence("snapshots", "Performance-Snapshots", "Performance snapshots", String(snapshots), row.dataQuality),
    ],
    missingDataDe,
    missingDataEn,
    actions: actions.slice(0, 3),
    automationAllowed: false,
  };
}

function action(
  id: string,
  kind: MarketingAssistantAction["kind"],
  priority: number,
  titleDe: string,
  titleEn: string,
  rationaleDe: string,
  rationaleEn: string,
  href: string,
  quality: MarketingDataQuality,
  confidence: number,
): MarketingAssistantAction {
  return { id, kind, priority, titleDe, titleEn, rationaleDe, rationaleEn, href, quality, confidence };
}

function evidence(
  key: string,
  labelDe: string,
  labelEn: string,
  value: string,
  quality: MarketingDataQuality,
): MarketingAssistantEvidence {
  return { key, labelDe, labelEn, value, quality };
}

function qualityConfidence(quality: MarketingDataQuality): number {
  return {
    verified: 0.95,
    partial: 0.7,
    estimated: 0.5,
    stale: 0.4,
    missing: 0.25,
    rejected: 0.1,
  }[quality];
}
