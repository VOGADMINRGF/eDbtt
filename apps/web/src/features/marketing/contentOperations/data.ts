import {
  MarketingContentOperationsSchema,
  type MarketingContentOperation,
} from "./contracts";

const CREATED_AT = "2026-07-27T16:00:00+02:00";
const UPDATED_AT = "2026-07-27T16:00:00+02:00";

const CONTENT_OPERATIONS: MarketingContentOperation[] = [
  {
    id: "MCO-CONTENT-02-DE-01",
    campaignId: "CAM-CONTENT-02",
    assetId: "MAS-CONTENT-CAROUSEL-01",
    title: "Debattenstand der Woche · Carousel",
    kind: "carousel",
    status: "review_ready",
    locale: "de-DE",
    originalLocale: "de-DE",
    channels: ["instagram", "linkedin", "facebook"],
    captionDraft:
      "Was hat sich in dieser Debatte wirklich verändert? Wir zeigen, welche Quellen neu sind, welche Positionen sich gegenüberstehen und was weiterhin offen bleibt. Den nachvollziehbaren Debattenstand findest du auf eDebatte.",
    scriptDraft: null,
    scheduledAt: null,
    responsibleRole: "editorial",
    responsibleLabel: "Inhalt und Quellenbezug prüfen",
    cta: {
      label: "Debattenstand ansehen",
      url: "https://www.edebatte.org/",
      status: "verified",
    },
    review: {
      required: true,
      status: "pending",
      ref: "/admin/marketing/review",
    },
    distributionRecordIds: [],
    nextAction: {
      key: "review_content",
      labelDe: "Text, Visual, Quellenbezug und CTA prüfen und anschließend freigeben.",
      labelEn: "Review copy, visual, source reference and CTA, then approve.",
      href: "/admin/marketing/review",
    },
    autoPublishEligible: false,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "MCO-VOXY-03-DE-01",
    campaignId: "CAM-VOXY-03",
    assetId: "MAS-VOXY-SCRIPT-01",
    title: "Voxy erklärt · Was ist ein Debattenstand?",
    kind: "short_video",
    status: "review_ready",
    locale: "de-DE",
    originalLocale: "de-DE",
    channels: ["tiktok", "instagram_reels", "youtube_shorts"],
    captionDraft:
      "Was ist ein Debattenstand? Voxy zeigt, welche Quellen vorliegen, welche Positionen einander gegenüberstehen und welche Fragen noch offen sind.",
    scriptDraft:
      "Was ist ein Debattenstand? Nicht nur eine Schlagzeile und nicht nur eine Meinung. eDebatte ordnet Quellen, Positionen und offene Fragen nachvollziehbar. So siehst du, was bereits belegt ist und wo Beteiligung noch sinnvoll ist.",
    scheduledAt: null,
    responsibleRole: "editorial",
    responsibleLabel: "Script, Visual und Untertitel prüfen",
    cta: {
      label: "Thema mit Voxy verstehen",
      url: "https://www.edebatte.org/",
      status: "verified",
    },
    review: {
      required: true,
      status: "pending",
      ref: "/admin/marketing/review",
    },
    distributionRecordIds: [],
    nextAction: {
      key: "review_content",
      labelDe: "Script, Szenenfolge, Untertitel, Quellenbezug und CTA prüfen und anschließend freigeben.",
      labelEn: "Review script, scenes, captions, source reference and CTA, then approve.",
      href: "/admin/marketing/review",
    },
    autoPublishEligible: false,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

export function getMarketingContentOperations(): MarketingContentOperation[] {
  return MarketingContentOperationsSchema.parse(CONTENT_OPERATIONS);
}
