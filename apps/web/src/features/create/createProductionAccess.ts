import type { RequestScopeSummary } from "@/lib/server/auth/requestScope";
import {
  hasVerifiedMembershipWriteAccess,
} from "@/lib/server/auth/membershipDirectoryRepository";
import type { CreateHandoffAction } from "@/features/create/createHandoff";
import {
  organizationEntitlementAllowsScope,
  type OrganizationDashboardReadModel,
  type OrganizationEntitlementScope,
  type RegionAllowedAction,
} from "@features/region";

export type CreateProductionAccessDecisionStatus = "allowed" | "limited" | "blocked";

export type CreateProductionAccessReason =
  | "no_organization_scope"
  | "membership_pending"
  | "membership_limited"
  | "membership_blocked"
  | "contract_pending"
  | "billing_pending"
  | "contract_blocked"
  | "entitlement_missing"
  | "action_missing"
  | "allowed";

export type CreateProductionAccessDecision = {
  status: CreateProductionAccessDecisionStatus;
  reason: CreateProductionAccessReason;
  title: string;
  body: string;
  requiredEntitlementScopes: OrganizationEntitlementScope[];
  missingEntitlementScopes: OrganizationEntitlementScope[];
  requiredActions: RegionAllowedAction[];
  missingActions: RegionAllowedAction[];
  membershipStatus: RequestScopeSummary["membershipStatus"] | null;
  organizationRole: RequestScopeSummary["organizationRole"] | null;
  contractStatus: OrganizationDashboardReadModel["contractSummary"]["currentContractStatus"] | null;
  billingStatus: OrganizationDashboardReadModel["contractSummary"]["billingStatus"] | null;
  entitlementStatus: OrganizationDashboardReadModel["entitlementSummary"]["currentStatus"] | null;
  sourceOfTruth: RequestScopeSummary["sourceOfTruth"] | null;
  confidence: RequestScopeSummary["confidence"] | null;
};

function requirementsForAction(action: CreateHandoffAction): {
  scopes: OrganizationEntitlementScope[];
  actions: RegionAllowedAction[];
} {
  switch (action) {
    case "append_to_dossier":
    case "create_dossier":
      return {
        scopes: ["review_queue", "content_release", "dossier_studio"],
        actions: ["create_dossier_draft", "submit_for_review"],
      };
    case "prepare_anlassraum":
    case "prepare_vote":
      return {
        scopes: ["review_queue", "content_release"],
        actions: ["create_anlassraum_draft", "submit_for_review"],
      };
    case "request_factcheck":
    case "request_review":
    case "submit_draft":
    default:
      return {
        scopes: ["review_queue"],
        actions: ["submit_for_review"],
      };
  }
}

function buildDecision(
  input: Omit<CreateProductionAccessDecision, "sourceOfTruth" | "confidence"> & {
    sourceOfTruth?: RequestScopeSummary["sourceOfTruth"] | null;
    confidence?: RequestScopeSummary["confidence"] | null;
  },
): CreateProductionAccessDecision {
  return {
    ...input,
    sourceOfTruth: input.sourceOfTruth ?? null,
    confidence: input.confidence ?? null,
  };
}

export function resolveCreateProductionAccessDecision(params: {
  requestScope: RequestScopeSummary | null;
  dashboardReadModel: OrganizationDashboardReadModel | null;
  action: CreateHandoffAction;
}): CreateProductionAccessDecision {
  const { requestScope, dashboardReadModel, action } = params;
  const requirements = requirementsForAction(action);
  const membershipStatus = requestScope?.membershipStatus ?? null;
  const organizationRole = requestScope?.organizationRole ?? null;
  const contractStatus = dashboardReadModel?.contractSummary.currentContractStatus ?? null;
  const billingStatus = dashboardReadModel?.contractSummary.billingStatus ?? null;
  const entitlementStatus = dashboardReadModel?.entitlementSummary.currentStatus ?? null;
  const base = {
    requiredEntitlementScopes: requirements.scopes,
    missingEntitlementScopes: [] as OrganizationEntitlementScope[],
    requiredActions: requirements.actions,
    missingActions: [] as RegionAllowedAction[],
    membershipStatus,
    organizationRole,
    contractStatus,
    billingStatus,
    entitlementStatus,
    sourceOfTruth: requestScope?.sourceOfTruth ?? null,
    confidence: requestScope?.confidence ?? null,
  };

  if (!requestScope?.organizationId) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "no_organization_scope",
      title: "Freischaltung für Organisations-Handoff nötig",
      body:
        "Du kannst den Arbeitsstand weiter vorbereiten, aber noch nicht in den produktiven Organisationspfad übergeben. Bitte Organisation und Wirkraum zuerst bestätigen lassen.",
    });
  }

  if (
    membershipStatus === "pending" ||
    membershipStatus === "evidence_required" ||
    membershipStatus === "operator_review_required" ||
    membershipStatus === "none"
  ) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "membership_pending",
      title: "Organisationsprüfung läuft noch",
      body:
        "Der Arbeitsstand kann vorbereitet werden, aber produktive Org-Handoffs starten erst nach bestätigter Betreiber-Verifikation.",
    });
  }

  if (membershipStatus === "limited") {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "membership_limited",
      title: "Organisationszugang ist eingeschränkt",
      body:
        "Dein Scope ist derzeit eingeschränkt. Ein produktiver Handoff in die Organisations-Review-Queue bleibt deshalb gesperrt, bis die Freischaltung erweitert wurde.",
    });
  }

  if (membershipStatus === "suspended" || membershipStatus === "revoked") {
    return buildDecision({
      ...base,
      status: "blocked",
      reason: "membership_blocked",
      title: "Organisationszugang ist gesperrt",
      body:
        "Produktive Org-Handoffs sind mit diesem Membership-Status blockiert. Bitte die Betreiberentscheidung prüfen lassen.",
    });
  }

  if (
    !hasVerifiedMembershipWriteAccess({
      membershipStatus: requestScope.membershipStatus,
      organizationRole: requestScope.organizationRole,
      isOperatorMode: requestScope.isOperatorMode,
      sourceOfTruth: requestScope.sourceOfTruth,
    })
  ) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "membership_pending",
      title: "Schreibfreigabe fehlt noch",
      body:
        "Für produktive Organisations-Handoffs braucht dein verifizierter Scope zusätzlich Schreibrechte im review-first Pfad.",
    });
  }

  if (!dashboardReadModel) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "contract_pending",
      title: "Vertrag und Freischaltung werden noch geklärt",
      body:
        "Der Arbeitsstand bleibt lokal vorbereitet. Für den produktiven Org-Handoff müssen Vertrag, Billing-Status und Entitlements zuerst sauber gekoppelt sein.",
    });
  }

  if (
    contractStatus === "suspended" ||
    contractStatus === "cancelled" ||
    contractStatus === "expired" ||
    billingStatus === "overdue" ||
    billingStatus === "suspended" ||
    billingStatus === "cancelled" ||
    billingStatus === "expired"
  ) {
    return buildDecision({
      ...base,
      status: "blocked",
      reason: "contract_blocked",
      title: "Organisationszugang ist pausiert",
      body:
        "Vertrag oder Billing-Status blockieren gerade produktive Org-Schreibpfade. Der Arbeitsstand wird nicht als aktiver Organisations-Handoff ausgegeben.",
    });
  }

  if (
    contractStatus === "none" ||
    contractStatus === "draft" ||
    contractStatus === "offered" ||
    contractStatus === "accepted" ||
    billingStatus === "none"
  ) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "contract_pending",
      title: "Vertrag wird noch geprüft",
      body:
        "Ein produktiver Org-Handoff startet erst mit bestätigter Vertragslage. Du kannst den Arbeitsstand weiter vorbereiten oder im Organisationsdashboard den nächsten Schritt prüfen.",
    });
  }

  if (
    contractStatus === "limited" ||
    billingStatus === "billing_pending" ||
    billingStatus === "grace_period"
  ) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: billingStatus === "billing_pending" ? "billing_pending" : "contract_pending",
      title: billingStatus === "grace_period" ? "Zugriff ist derzeit eingeschränkt" : "Billing oder Vertrag ist noch nicht vollständig aktiv",
      body:
        billingStatus === "grace_period"
          ? "Der Organisationszugang ist aktuell nur eingeschränkt freigeschaltet. Produktive Handoffs bleiben deshalb blockiert."
          : "Solange Billing oder Vertragsaktivierung noch offen ist, wird kein produktiver Vollzugriff für Organisations-Handoffs ausgegeben.",
    });
  }

  const missingEntitlementScopes = requirements.scopes.filter(
    (scope) => !organizationEntitlementAllowsScope(dashboardReadModel.entitlementSummary, scope),
  );
  const missingActions = requirements.actions.filter(
    (requiredAction) => !dashboardReadModel.allowedActions.includes(requiredAction),
  );

  if (missingEntitlementScopes.length > 0) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "entitlement_missing",
      title: "Produktive Freischaltung fehlt noch",
      body:
        "Für diesen Organisations-Handoff fehlen noch freigegebene Arbeitsbereiche. Bitte die Freischaltung im Organisationsdashboard prüfen lassen.",
      missingEntitlementScopes,
    });
  }

  if (missingActions.length > 0) {
    return buildDecision({
      ...base,
      status: "limited",
      reason: "action_missing",
      title: "Dieser Handoff ist für deinen Scope noch nicht freigegeben",
      body:
        "Die Organisationsfreigabe reicht für Lesen und Vorbereitung, aber noch nicht für diesen konkreten Dossier- oder Anlassraum-Schritt.",
      missingActions,
    });
  }

  return buildDecision({
    ...base,
    status: "allowed",
    reason: "allowed",
    title: "Produktiver Handoff ist freigeschaltet",
    body:
      "Membership, Vertrag, Billing-Status und Entitlements erlauben diesen review-first Organisations-Handoff. Veröffentlichung bleibt trotzdem ein bewusster Folgeschritt.",
  });
}
