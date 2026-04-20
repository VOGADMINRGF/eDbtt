import { getInitialOrderStatusForSegment } from "./orderFlow";
import type { PricingLocale } from "./i18n";
import type { PricingOrderStatus, PricingSegmentId } from "./types";

export type PricingOrderFollowupContract = {
  segmentId: PricingSegmentId;
  nextPrimaryRoute: string;
  nextPrimaryLabel: string;
  nextSecondaryRoute: string | null;
  nextSecondaryLabel: string | null;
  expectedInitialStatus: PricingOrderStatus;
  requiresInternalReview: boolean;
  submittedMessage: string;
  reviewMessage: string;
  activationMessage: string;
};

const FOLLOWUP_CONTRACTS: Record<PricingSegmentId, Omit<PricingOrderFollowupContract, "segmentId" | "expectedInitialStatus" | "requiresInternalReview">> = {
  privat: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Weiter",
    nextSecondaryRoute: null,
    nextSecondaryLabel: null,
    submittedMessage: "Bestellung ist eingegangen und wird im Standardprozess weitergeführt.",
    reviewMessage: "Für dieses Segment ist kein interner Freigabe-Review als Pflichtschritt vorgesehen.",
    activationMessage:
      "Als Nächstes läuft die Aktivierung nach Registry-, Alters- und Bankverifikation im Standardprozess. Mitgliedschaft und Paketfreischaltung bleiben transparent getrennt.",
  },
  journalismus: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Weiter",
    nextSecondaryRoute: "/kontakt?kontext=journalismus-paket",
    nextSecondaryLabel: "Gespräch optional vereinbaren",
    submittedMessage: "Bestellung ist eingegangen und kann im Regelfall direkt weiterverarbeitet werden.",
    reviewMessage: "Gespräch und Feinschliff bleiben optional, nicht verpflichtend.",
    activationMessage:
      "Als Nächstes läuft die Aktivierung nach Registry- und Bankverifikation im Standardprozess. Optional gewählte Faktencheck- oder Add-on-Optionen werden transparent bestätigt.",
  },
  organisationen: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Weiter",
    nextSecondaryRoute: "/kontakt?kontext=institutionelles-paket",
    nextSecondaryLabel: "Gespräch optional vereinbaren",
    submittedMessage: "Bestellung ist eingegangen und wird intern auf Paket- und Governance-Kontext geprüft.",
    reviewMessage:
      "Als Nächstes prüfen wir Paketkonfiguration, Governance und Aktivierung intern. Danach erfolgt die Freischaltung abgestimmt zum Einsatzkontext.",
    activationMessage: "Nach Freigabe erfolgt die Aktivierung entlang des abgestimmten Betriebsrahmens.",
  },
  kommunen: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Weiter",
    nextSecondaryRoute: "/kontakt?kontext=institutionelles-paket",
    nextSecondaryLabel: "Gespräch optional vereinbaren",
    submittedMessage: "Bestellung ist eingegangen und wird intern auf Paket- und Betriebsrahmen geprüft.",
    reviewMessage:
      "Als Nächstes prüfen wir Paketkonfiguration, Governance und Aktivierung intern. Danach erfolgt die Freischaltung abgestimmt zum Einsatzkontext.",
    activationMessage: "Nach Freigabe erfolgt die Aktivierung entlang kommunaler Prozess- und Reportinglogik.",
  },
};

const FOLLOWUP_CONTRACTS_EN: Record<PricingSegmentId, Omit<PricingOrderFollowupContract, "segmentId" | "expectedInitialStatus" | "requiresInternalReview">> = {
  privat: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Continue",
    nextSecondaryRoute: null,
    nextSecondaryLabel: null,
    submittedMessage: "Order received and forwarded through the standard process.",
    reviewMessage: "For this segment, internal approval review is not a mandatory step.",
    activationMessage:
      "Next, activation follows the standard process after registry, age and bank verification. Membership and package activation remain transparently separated.",
  },
  journalismus: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Continue",
    nextSecondaryRoute: "/kontakt?kontext=journalismus-paket",
    nextSecondaryLabel: "Optionally schedule a conversation",
    submittedMessage: "Order received and typically processed directly.",
    reviewMessage: "Conversation and fine-tuning remain optional, not mandatory.",
    activationMessage:
      "Next, activation follows the standard process after registry and bank verification. Optional fact-check and add-on selections are confirmed transparently.",
  },
  organisationen: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Continue",
    nextSecondaryRoute: "/kontakt?kontext=institutionelles-paket",
    nextSecondaryLabel: "Optionally schedule a conversation",
    submittedMessage: "Order received and reviewed internally for package and governance context.",
    reviewMessage:
      "Next, we review package configuration, governance and activation internally. Activation follows aligned to operating context.",
    activationMessage: "After approval, activation follows the agreed operating framework.",
  },
  kommunen: {
    nextPrimaryRoute: "/account?preorder=thanks",
    nextPrimaryLabel: "Continue",
    nextSecondaryRoute: "/kontakt?kontext=institutionelles-paket",
    nextSecondaryLabel: "Optionally schedule a conversation",
    submittedMessage: "Order received and reviewed internally for package and operating framework.",
    reviewMessage:
      "Next, we review package configuration, governance and activation internally. Activation follows aligned to operating context.",
    activationMessage: "After approval, activation follows municipal process and reporting logic.",
  },
};

export function getPricingOrderFollowupContract(
  segmentId: PricingSegmentId,
  locale: PricingLocale = "de",
): PricingOrderFollowupContract {
  const base = (locale === "en" ? FOLLOWUP_CONTRACTS_EN : FOLLOWUP_CONTRACTS)[segmentId];
  const expectedInitialStatus = getInitialOrderStatusForSegment(segmentId);
  const requiresInternalReview = expectedInitialStatus === "under_review";

  return {
    segmentId,
    expectedInitialStatus,
    requiresInternalReview,
    ...base,
  };
}
