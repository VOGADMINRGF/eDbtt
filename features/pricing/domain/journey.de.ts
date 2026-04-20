import {
  B2B_PACKAGE_IDS,
  B2G_PACKAGE_IDS,
  JOURNALIST_PACKAGE_IDS,
  PRIVATE_PACKAGE_IDS,
  getPackagesByIds,
} from "./helpers";
import type { PricingLocale } from "./i18n";
import type { EDebattePackageId, PricingSegmentId } from "./types";

export type PricingJourneySegment = {
  id: PricingSegmentId;
  label: string;
  shortLabel: string;
  pricingAnchor: string;
  vormerkenAnchor: string;
  packageIds: readonly EDebattePackageId[];
  pricingIntro: string;
  vormerkenIntro: string;
  activationHint: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
};

export const PRICING_JOURNEY_HEADLINES = {
  pricingTitle: "Pakete & Preise",
  pricingIntro:
    "VoiceOpenGov und eDebatte bleiben unabhängig und fair: Drei klare Privatpakete bilden die Hauptlogik, weitere Zugänge sind vorbereitet.",
  vormerkenTitle: "Paketstart",
  vormerkenIntro:
    "Hier wird ein Paket direkt beauftragt. Freischaltung, Onboarding und formale Bestätigung folgen anschließend transparent im passenden Betriebskontext.",
  activationSeparation:
    "Mitgliedschaft, Paketvormerkung und Paketfreischaltung werden bewusst getrennt geführt.",
  trustNote:
    "Kein Pay-to-Win: Beiträge tragen Infrastruktur, Sicherheit, Moderation, Weiterentwicklung und KI-Nutzung.",
} as const;

export const PRICING_JOURNEY_HEADLINES_EN = {
  pricingTitle: "Packages & Pricing",
  pricingIntro:
    "VoiceOpenGov and eDebatte remain independent and fair: three clear civic packages are primary, further access paths stay prepared.",
  vormerkenTitle: "Package start",
  vormerkenIntro:
    "Commission a package directly. Activation, onboarding and formal confirmation follow transparently in the proper operating context.",
  activationSeparation:
    "Membership, package reservation and package activation are intentionally handled separately.",
  trustNote:
    "No pay-to-win: contributions fund infrastructure, security, moderation, product development and AI usage.",
} as const;

export const PRICING_JOURNEY_SEGMENTS: readonly PricingJourneySegment[] = [
  {
    id: "privat",
    label: "Privat",
    shortLabel: "Privat",
    pricingAnchor: "pricing-privat",
    vormerkenAnchor: "vormerken-privat",
    packageIds: PRIVATE_PACKAGE_IDS,
    pricingIntro:
      "Privatpakete bleiben demokratisch fair: gleicher politischer Einfluss für alle, Beiträge nur zur Finanzierung von Infrastruktur und Betrieb.",
    vormerkenIntro:
      "Privat bestellen: Paket auswählen, Kontaktdaten ergänzen, Startkontext kurz beschreiben.",
    activationHint:
      "Freischaltung erfolgt transparent nach Paketprüfung; demokratische Rechte bleiben paketunabhängig gleich.",
    primaryCtaLabel: "Privat bestellen",
    primaryCtaHref: "/order?segment=privat",
  },
  {
    id: "journalismus",
    label: "Freie Journalist:innen",
    shortLabel: "Freie Journalist:innen",
    pricingAnchor: "pricing-journalismus",
    vormerkenAnchor: "vormerken-journalismus",
    packageIds: JOURNALIST_PACKAGE_IDS,
    pricingIntro:
      "Eigener journalistischer Bereich zwischen Privat und Organisationen: Anlassraum, Dossier, Quellenlage und öffentliche Anschlussfähigkeit.",
    vormerkenIntro:
      "Journalismus bestellen: Recherchekontext benennen und optionales Faktencheck-Kontingent wählen.",
    activationHint:
      "Freischaltung im redaktionellen Betriebsmodell mit Anlassraum-/Dossier-Fokus und optionalem Faktencheck-Kontingent.",
    primaryCtaLabel: "Journalismus bestellen",
    primaryCtaHref: "/order?segment=journalismus",
  },
  {
    id: "organisationen",
    label: "Organisationen",
    shortLabel: "Organisationen",
    pricingAnchor: "pricing-organisationen",
    vormerkenAnchor: "vormerken-organisationen",
    packageIds: B2B_PACKAGE_IDS,
    pricingIntro:
      "Organisationen erhalten keinen politischen Sonderzugang, sondern einen professionellen Betriebsrahmen für Teams, Governance und auswertbare Prozesse.",
    vormerkenIntro:
      "Organisationen bestellen: Einsatzkontext, Teammodell und gewünschte Governance-Begleitung angeben.",
    activationHint:
      "Aktivierung als Betriebsmodell mit Teams, Rollen, Moderation, Routing und Reports.",
    primaryCtaLabel: "Bestellung absenden",
    primaryCtaHref: "/order?segment=organisationen",
  },
  {
    id: "kommunen",
    label: "Kommunen / Verwaltung",
    shortLabel: "Kommunen / Verwaltung",
    pricingAnchor: "pricing-kommunen",
    vormerkenAnchor: "vormerken-kommunen",
    packageIds: B2G_PACKAGE_IDS,
    pricingIntro:
      "Kommunen und Verwaltung nutzen einen transparenten Beteiligungsbetrieb mit klarer Governance, Rückläufen und anschlussfähiger Auswertung.",
    vormerkenIntro:
      "Kommunale Nutzung bestellen: Anlassräume, Themenräume und organisatorischen Startkontext erfassen.",
    activationHint:
      "Aktivierung als strukturierter kommunaler Betriebsrahmen mit Reports und Umsetzungsnähe.",
    primaryCtaLabel: "Bestellung absenden",
    primaryCtaHref: "/order?segment=kommunen",
  },
] as const;

export const PRICING_JOURNEY_SEGMENTS_EN: readonly PricingJourneySegment[] = [
  {
    id: "privat",
    label: "Civic",
    shortLabel: "Civic",
    pricingAnchor: "pricing-privat",
    vormerkenAnchor: "vormerken-privat",
    packageIds: PRIVATE_PACKAGE_IDS,
    pricingIntro:
      "Civic packages remain democratically fair: equal political influence for everyone, contributions only fund infrastructure and operations.",
    vormerkenIntro:
      "Order civic package: choose package, add contact details and describe your start context briefly.",
    activationHint:
      "Activation follows transparent package verification; democratic rights remain equal regardless of package.",
    primaryCtaLabel: "Order civic package",
    primaryCtaHref: "/order?segment=privat",
  },
  {
    id: "journalismus",
    label: "Independent journalists",
    shortLabel: "Independent journalists",
    pricingAnchor: "pricing-journalismus",
    vormerkenAnchor: "vormerken-journalismus",
    packageIds: JOURNALIST_PACKAGE_IDS,
    pricingIntro:
      "Dedicated journalism segment between civic and institutions: issue room, dossier, source context and public continuity.",
    vormerkenIntro:
      "Order journalism package: define research context and optionally select a fact-check quota.",
    activationHint:
      "Activation in the editorial operating model with issue-room/dossier focus and optional fact-check quota.",
    primaryCtaLabel: "Order journalism package",
    primaryCtaHref: "/order?segment=journalismus",
  },
  {
    id: "organisationen",
    label: "Organizations",
    shortLabel: "Organizations",
    pricingAnchor: "pricing-organisationen",
    vormerkenAnchor: "vormerken-organisationen",
    packageIds: B2B_PACKAGE_IDS,
    pricingIntro:
      "Organizations do not buy political special access, but a professional operating framework for teams, governance and analyzable processes.",
    vormerkenIntro:
      "Order for organizations: provide operating context, team model and desired governance support.",
    activationHint:
      "Activation as a professional operating model with teams, roles, moderation, routing and reports.",
    primaryCtaLabel: "Submit order",
    primaryCtaHref: "/order?segment=organisationen",
  },
  {
    id: "kommunen",
    label: "Municipalities / administration",
    shortLabel: "Municipalities / administration",
    pricingAnchor: "pricing-kommunen",
    vormerkenAnchor: "vormerken-kommunen",
    packageIds: B2G_PACKAGE_IDS,
    pricingIntro:
      "Municipalities and administrations use a transparent participation model with clear governance, feedback loops and actionable analytics.",
    vormerkenIntro:
      "Order municipal usage: capture issue rooms, topic rooms and organizational start context.",
    activationHint:
      "Activation as a structured municipal operating model with reports and implementation proximity.",
    primaryCtaLabel: "Submit order",
    primaryCtaHref: "/order?segment=kommunen",
  },
] as const;

export const PRICING_ACTIVATION_STEPS: readonly string[] = [
  "Segment und Paket auswählen.",
  "Konto und Registry vollständig hinterlegen (inkl. Geburtsdatum).",
  "Bankverifikation per 0,01 €-Code abschließen.",
  "Bestellung verbindlich absenden.",
  "Paketfreischaltung und Rollenmodell abgestimmt aktivieren (ggf. mit internem Review).",
  "Mitgliedschaft und formale Bestätigung laufen separat.",
] as const;

export const PRICING_ACTIVATION_STEPS_EN: readonly string[] = [
  "Select segment and package.",
  "Complete account and registry data (including date of birth).",
  "Complete bank verification via €0.01 code.",
  "Submit order as binding request.",
  "Activate package and role model in a coordinated flow (with internal review when required).",
  "Membership and formal confirmation remain separate.",
] as const;

const PACKAGE_TO_SEGMENT: Record<EDebattePackageId, PricingSegmentId> = {
  basis: "privat",
  start: "privat",
  pro: "privat",
  journal_basis: "journalismus",
  journal_pro: "journalismus",
  b2b_basis: "organisationen",
  b2b_pro: "organisationen",
  b2g_basis: "kommunen",
  b2g_pro: "kommunen",
};

const PRICING_SEGMENT_IDS = new Set<PricingSegmentId>(["privat", "journalismus", "organisationen", "kommunen"]);

export function normalizePricingSegmentId(value?: string | null): PricingSegmentId | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return PRICING_SEGMENT_IDS.has(trimmed as PricingSegmentId) ? (trimmed as PricingSegmentId) : null;
}

export function getPricingJourneyHeadlines(locale: PricingLocale = "de") {
  return locale === "en" ? PRICING_JOURNEY_HEADLINES_EN : PRICING_JOURNEY_HEADLINES;
}

export function getPricingJourneySegments(locale: PricingLocale = "de") {
  return locale === "en" ? PRICING_JOURNEY_SEGMENTS_EN : PRICING_JOURNEY_SEGMENTS;
}

export function getPricingActivationSteps(locale: PricingLocale = "de") {
  return locale === "en" ? PRICING_ACTIVATION_STEPS_EN : PRICING_ACTIVATION_STEPS;
}

export function resolvePricingSegmentForPackage(packageId: EDebattePackageId): PricingSegmentId {
  return PACKAGE_TO_SEGMENT[packageId];
}

export function getPackagesForJourneySegment(segmentId: PricingSegmentId, locale: PricingLocale = "de") {
  const segment = getPricingJourneySegments(locale).find((entry) => entry.id === segmentId);
  if (!segment) return [];
  return getPackagesByIds(segment.packageIds, locale);
}
