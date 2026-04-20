import type { PricingSegmentId } from "./types";

export type PricingTargetGroupIconId = "citizens" | "organizations" | "municipalities" | "media";

export type PricingTargetGroupDefinition = {
  id: "citizens" | "organizations" | "municipalities" | "media";
  icon: PricingTargetGroupIconId;
  title: string;
  benefit: string;
  segmentId: PricingSegmentId;
  pricingAnchor: string;
  vormerkenAnchor: string;
};

export const PRICING_TARGET_GROUPS: readonly PricingTargetGroupDefinition[] = [
  {
    id: "citizens",
    icon: "citizens",
    title: "Bürger:innen",
    benefit: "Informieren, teilnehmen, regelmäßig beitragen",
    segmentId: "privat",
    pricingAnchor: "pricing-privat",
    vormerkenAnchor: "vormerken-privat",
  },
  {
    id: "organizations",
    icon: "organizations",
    title: "Organisationen / Verbände / Vereine",
    benefit: "Strukturierte Beteiligung mit Teams und Governance",
    segmentId: "organisationen",
    pricingAnchor: "pricing-organisationen",
    vormerkenAnchor: "vormerken-organisationen",
  },
  {
    id: "municipalities",
    icon: "municipalities",
    title: "Kommunen / Verwaltungen",
    benefit: "Beteiligungsbetrieb mit Transparenz und Reports",
    segmentId: "kommunen",
    pricingAnchor: "pricing-kommunen",
    vormerkenAnchor: "vormerken-kommunen",
  },
  {
    id: "media",
    icon: "media",
    title: "Presse / Medien / freie Journalist:innen",
    benefit: "Anlassraum, Dossier, Quellenlage und Companion",
    segmentId: "journalismus",
    pricingAnchor: "pricing-journalismus",
    vormerkenAnchor: "vormerken-journalismus",
  },
] as const;

export const PRICING_TARGET_GROUPS_EN: readonly PricingTargetGroupDefinition[] = [
  {
    id: "citizens",
    icon: "citizens",
    title: "Citizens",
    benefit: "Get informed, participate, contribute regularly",
    segmentId: "privat",
    pricingAnchor: "pricing-privat",
    vormerkenAnchor: "vormerken-privat",
  },
  {
    id: "organizations",
    icon: "organizations",
    title: "Organizations / associations / NGOs",
    benefit: "Structured participation with teams and governance",
    segmentId: "organisationen",
    pricingAnchor: "pricing-organisationen",
    vormerkenAnchor: "vormerken-organisationen",
  },
  {
    id: "municipalities",
    icon: "municipalities",
    title: "Municipalities / public administration",
    benefit: "Participation operations with transparency and reports",
    segmentId: "kommunen",
    pricingAnchor: "pricing-kommunen",
    vormerkenAnchor: "vormerken-kommunen",
  },
  {
    id: "media",
    icon: "media",
    title: "Press / media / independent journalists",
    benefit: "Issue room, dossier, source context and companion",
    segmentId: "journalismus",
    pricingAnchor: "pricing-journalismus",
    vormerkenAnchor: "vormerken-journalismus",
  },
] as const;

export function getPricingTargetGroups(locale: "de" | "en" = "de") {
  return locale === "en" ? PRICING_TARGET_GROUPS_EN : PRICING_TARGET_GROUPS;
}
