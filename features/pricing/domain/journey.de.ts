import {
  B2B_PACKAGE_IDS,
  B2G_PACKAGE_IDS,
  PRIVATE_PACKAGE_IDS,
  getPackagesByIds,
} from "./helpers";
import type { EDebattePackageId } from "./types";

export type PricingSegmentId = "privat" | "organisationen" | "kommunen";

export type B2cAccessTierMapping = {
  packageId: "basis" | "start" | "pro";
  marketingLabel: "Basis" | "Start" | "Pro";
  accessTierId: "citizenBasic" | "citizenPremium" | "citizenPro";
};

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
    "Pakete können direkt gewählt und beauftragt werden. Die Freischaltung und operative Aktivierung erfolgen anschließend passend zum Einsatzkontext.",
  vormerkenTitle: "Paketstart und Freischaltung abstimmen",
  vormerkenIntro:
    "Hier startest du den Paketabschluss für Bürger, Organisationen oder Kommunen. Nach der Beauftragung stimmen wir Freischaltung, Rollen und Einführung passend zum Nutzungskontext ab.",
  activationSeparation:
    "Leistungsumfang und Aktivierung sind getrennt organisiert: Paketabschluss jetzt, Freischaltung im nächsten Schritt.",
  trustNote:
    "Kein Pay-to-Win: Pakete finanzieren Infrastruktur, Prozesse, Moderation und Einführung – nicht demokratische Sonderrechte.",
} as const;

export const PRICING_JOURNEY_SEGMENTS: readonly PricingJourneySegment[] = [
  {
    id: "privat",
    label: "Bürger",
    shortLabel: "Privat",
    pricingAnchor: "pricing-privat",
    vormerkenAnchor: "vormerken-privat",
    packageIds: PRIVATE_PACKAGE_IDS,
    pricingIntro:
      "Basis, Start und Pro richten sich an Bürgerinnen und Bürger. Der Paketstart ist direkt möglich; die Aktivierung folgt danach im Standardprozess.",
    vormerkenIntro:
      "Für Bürgerinnen und Bürger: Paket wählen, Kontaktdaten ergänzen, Paketstart bestätigen – anschließend schnelle Freischaltung im Standardpfad.",
    activationHint:
      "Standardisierte Aktivierung mit Kontozuordnung, Paketprüfung und Freischaltung der gebuchten Funktionen.",
    primaryCtaLabel: "Paketstart Bürger",
    primaryCtaHref: "/vormerken?segment=privat",
  },
  {
    id: "organisationen",
    label: "Organisationen",
    shortLabel: "Organisationen",
    pricingAnchor: "pricing-organisationen",
    vormerkenAnchor: "vormerken-organisationen",
    packageIds: B2B_PACKAGE_IDS,
    pricingIntro:
      "Organisationen können Pakete direkt beauftragen. Freischaltung und Einführung werden danach entlang Rollen, Anlassräumen und Governance-Setup abgestimmt.",
    vormerkenIntro:
      "Für Verbände, Medien, Unternehmen und Teams: Paket auswählen, Einsatzkontext skizzieren, Paketstart beauftragen – danach betreute Aktivierung.",
    activationHint:
      "Freischaltung mit Rollenmodell, Anlassraum-Setup, Moderations- und Governance-Abstimmung.",
    primaryCtaLabel: "Paketstart Organisation",
    primaryCtaHref: "/vormerken?segment=organisationen",
  },
  {
    id: "kommunen",
    label: "Kommunen / Verwaltung",
    shortLabel: "Kommunen / Verwaltung",
    pricingAnchor: "pricing-kommunen",
    vormerkenAnchor: "vormerken-kommunen",
    packageIds: B2G_PACKAGE_IDS,
    pricingIntro:
      "Kommunen und Verwaltung können Pakete direkt starten. Die operative Aktivierung erfolgt anschließend strukturiert mit klarer Einführung.",
    vormerkenIntro:
      "Für kommunale und behördliche Nutzung: Paket wählen, Startkontext beschreiben, Paketstart beauftragen – danach abgestimmte Freischaltung.",
    activationHint:
      "Strukturierte Einführung mit Verwaltungsrollen, Anlassraum-Einrichtung und nachvollziehbaren Freigaben.",
    primaryCtaLabel: "Paketstart Kommune",
    primaryCtaHref: "/vormerken?segment=kommunen",
  },
] as const;

export const PRICING_ACTIVATION_STEPS: readonly string[] = [
  "Paket wählen und Paketstart anfragen oder bestätigen.",
  "Kontakt- und Einsatzkontext erfassen (bei Institutionen inkl. Einführungsbedarf).",
  "Freischaltung, Rollen- und Setup-Abstimmung im nächsten Schritt.",
] as const;

export const B2C_ACCESS_TIER_MAPPINGS: readonly B2cAccessTierMapping[] = [
  { packageId: "basis", marketingLabel: "Basis", accessTierId: "citizenBasic" },
  { packageId: "start", marketingLabel: "Start", accessTierId: "citizenPremium" },
  { packageId: "pro", marketingLabel: "Pro", accessTierId: "citizenPro" },
] as const;

export function getB2cAccessTierMapping(packageId: EDebattePackageId) {
  return B2C_ACCESS_TIER_MAPPINGS.find((entry) => entry.packageId === packageId) ?? null;
}

export function getPackagesForJourneySegment(segmentId: PricingSegmentId) {
  const segment = PRICING_JOURNEY_SEGMENTS.find((entry) => entry.id === segmentId);
  if (!segment) return [];
  return getPackagesByIds(segment.packageIds);
}
