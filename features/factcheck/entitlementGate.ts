import type { EditorialReviewRequest } from "@features/editorialReviewQueue";

export const FACTCHECK_ENTITLEMENT_ACTIONS = [
  "light_analysis",
  "editorial_review",
  "factcheck_request",
  "source_check",
  "deep_research",
  "dossier_preparation",
  "anlassraum_publish",
  "organization_mode",
] as const;

export type FactcheckEntitlementAction = (typeof FACTCHECK_ENTITLEMENT_ACTIONS)[number];

export const FACTCHECK_ENTITLEMENT_REASONS = [
  "free_draft_action",
  "login_required",
  "entitlement_missing",
  "pricing_required",
  "confirmation_required",
  "blocked_by_truth_guard",
  "blocked_by_spam",
  "review_required_first",
] as const;

export type FactcheckEntitlementReason = (typeof FACTCHECK_ENTITLEMENT_REASONS)[number];

export type FactcheckEntitlementGate = {
  action: FactcheckEntitlementAction;
  loginRequired: boolean;
  entitlementRequired: boolean;
  pricingRequired: boolean;
  confirmationRequired: boolean;
  allowed: boolean;
  reason: FactcheckEntitlementReason;
  noAutoStart: true;
  noSilentCost: true;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
};

export type FactcheckEntitlementContext = {
  isAuthenticated: boolean;
  hasEntitlement?: boolean | null;
  hasPricingAccess?: boolean | null;
  confirmationProvided?: boolean | null;
  blockedByTruthGuard?: boolean | null;
  blockedBySpam?: boolean | null;
  reviewRequiredFirst?: boolean | null;
};

function isFreeDraftAction(action: FactcheckEntitlementAction) {
  return action === "light_analysis" || action === "editorial_review";
}

function requiresLogin(action: FactcheckEntitlementAction) {
  return !isFreeDraftAction(action);
}

function requiresEntitlement(action: FactcheckEntitlementAction) {
  return (
    action === "source_check" ||
    action === "deep_research" ||
    action === "dossier_preparation" ||
    action === "anlassraum_publish" ||
    action === "organization_mode"
  );
}

function requiresConfirmation(action: FactcheckEntitlementAction) {
  return action === "source_check" || action === "deep_research";
}

export function resolveFactcheckEntitlementGate(
  action: FactcheckEntitlementAction,
  context: FactcheckEntitlementContext,
): FactcheckEntitlementGate {
  const gate: FactcheckEntitlementGate = {
    action,
    loginRequired: requiresLogin(action),
    entitlementRequired: requiresEntitlement(action),
    pricingRequired: requiresEntitlement(action),
    confirmationRequired: requiresConfirmation(action),
    allowed: false,
    reason: "free_draft_action",
    noAutoStart: true,
    noSilentCost: true,
    noAutoPublish: true,
    noAutoGraphPromotion: true,
  };

  if (context.blockedBySpam) {
    return { ...gate, reason: "blocked_by_spam" };
  }
  if (context.blockedByTruthGuard) {
    return { ...gate, reason: "blocked_by_truth_guard" };
  }
  if (context.reviewRequiredFirst) {
    return { ...gate, reason: "review_required_first" };
  }
  if (gate.loginRequired && !context.isAuthenticated) {
    return { ...gate, reason: "login_required" };
  }
  if (gate.entitlementRequired && context.hasEntitlement !== true) {
    return { ...gate, reason: "entitlement_missing" };
  }
  if (gate.pricingRequired && context.hasPricingAccess !== true) {
    return { ...gate, reason: "pricing_required" };
  }
  if (gate.confirmationRequired && context.confirmationProvided !== true) {
    return { ...gate, reason: "confirmation_required" };
  }

  return {
    ...gate,
    allowed: true,
    reason: isFreeDraftAction(action) ? "free_draft_action" : "confirmation_required",
  };
}

export function getFactcheckEntitlementReasonLabel(reason: FactcheckEntitlementReason) {
  switch (reason) {
    case "login_required":
      return "Anmeldung erforderlich";
    case "entitlement_missing":
      return "Kontingent erforderlich";
    case "pricing_required":
      return "Kontingent erforderlich";
    case "confirmation_required":
      return "Bestätigung erforderlich";
    case "blocked_by_truth_guard":
      return "Truth-Guard blockiert";
    case "blocked_by_spam":
      return "Text zuerst überarbeiten";
    case "review_required_first":
      return "Erst manuelle Prüfung";
    case "free_draft_action":
    default:
      return "Kostenfrei im Entwurf";
  }
}

export function getFactcheckEntitlementGateMessage(gate: FactcheckEntitlementGate) {
  switch (gate.reason) {
    case "login_required":
      return "Bitte melde dich an, bevor du Faktencheck oder Quellenprüfung verbindlich startest.";
    case "entitlement_missing":
    case "pricing_required":
      return "Für vertiefte Quellenprüfung oder Deep Research brauchst du ein passendes Kontingent oder Paket.";
    case "confirmation_required":
      return "Diese Quellenprüfung kann Kontingent verbrauchen und startet erst nach deiner Bestätigung.";
    case "blocked_by_truth_guard":
      return "Dieser Pfad bleibt im Truth-Guard auf Entwurf oder manuelle Prüfung begrenzt.";
    case "blocked_by_spam":
      return "Bitte überarbeite den Text, bevor eine Quellenprüfung vorbereitet wird.";
    case "review_required_first":
      return "Bitte bereite zuerst eine manuelle Prüfung oder Quellenklärung vor.";
    case "free_draft_action":
    default:
      return "Dieser Schritt bleibt im Entwurf und startet keine kostenpflichtige Recherche.";
  }
}

export function getEditorialReviewFactcheckStatusLabel(
  request: Pick<EditorialReviewRequest, "sourceType" | "status">,
) {
  if (request.sourceType !== "factcheck_request") return null;
  switch (request.status) {
    case "accepted_for_workup":
      return "Quellenprüfung vorbereitet";
    case "needs_user_clarification":
      return "Bestätigung erforderlich";
    case "in_review":
    case "pending_review":
    default:
      return "Quellenprüfung angefragt";
  }
}
