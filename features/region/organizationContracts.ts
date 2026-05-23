import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  DEFAULT_CONTRACT_PROVISIONED_SCOPES,
  LIMITED_CONTRACT_PROVISIONED_SCOPES,
  deriveProvisioningDecisionFromContract,
  isProductionBillingTruth,
  mapPricingOrderStatusToBillingStatus,
  mapPricingOrderStatusToContractStatus,
  organizationBillingStatusLabel,
  organizationContractStatusLabel,
} from "@features/pricing";
import type {
  OrganizationAccessProvisioningDecision,
  OrganizationBillingSource,
  OrganizationBillingStatus,
  OrganizationContractAuditEvent,
  OrganizationContractOrderRecord,
  OrganizationContractStatus,
  OrganizationPlanAssignment,
} from "@features/pricing";
import type { Organization } from "./organizationOnboarding";
import type {
  EntitlementAuditEvent,
  PaidDashboardEntitlement,
} from "./server/paidEntitlements";

export type OrganizationContractReadModel = {
  id: string;
  orderId: string;
  organizationId: string | null;
  organizationName: string | null;
  contractStatus: OrganizationContractStatus;
  billingStatus: OrganizationBillingStatus;
  sourceOfTruth: OrganizationBillingSource;
  planAssignment: OrganizationPlanAssignment | null;
  accessProvisioningDecision: OrganizationAccessProvisioningDecision;
  auditEvents: OrganizationContractAuditEvent[];
  productionTruth: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type OrganizationContractSummary = {
  currentContractStatus: OrganizationContractStatus;
  billingStatus: OrganizationBillingStatus;
  sourceOfTruth: OrganizationBillingSource;
  confidence: "high" | "limited";
  runtimeMarker:
    | "production_runtime"
    | "demo_or_test_runtime"
    | "external_checkout_pending";
  productionTruth: boolean;
  auditBacked: boolean;
  planAssignment: OrganizationPlanAssignment | null;
  accessProvisioningDecision: OrganizationAccessProvisioningDecision;
  operatorDecisionRequired: boolean;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  records: OrganizationContractReadModel[];
};

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeIsoDate(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function sourceFromEntitlement(entitlement: PaidDashboardEntitlement): OrganizationBillingSource {
  switch (entitlement.source) {
    case "fixture":
      return "fixture_demo";
    case "order_request":
      return "manual_invoice";
    case "admin_grant":
    case "pilot_grant":
    case "manual_contract":
    case "migration":
    default:
      return "operator_verified_contract";
  }
}

function contractStatusFromEntitlement(
  entitlement: PaidDashboardEntitlement,
): OrganizationContractStatus {
  switch (entitlement.status) {
    case "active":
      return "active";
    case "trial":
    case "past_due":
      return "limited";
    case "suspended":
      return "suspended";
    case "cancelled":
    case "revoked":
      return "cancelled";
    case "expired":
      return "expired";
    case "inactive":
    default:
      return "none";
  }
}

function billingStatusFromEntitlement(
  entitlement: PaidDashboardEntitlement,
): OrganizationBillingStatus {
  switch (entitlement.status) {
    case "active":
      return sourceFromEntitlement(entitlement) === "operator_verified_contract"
        ? "operator_verified_contract"
        : "active";
    case "trial":
      return "operator_verified_contract";
    case "past_due":
      return "overdue";
    case "suspended":
      return "suspended";
    case "cancelled":
    case "revoked":
      return "cancelled";
    case "expired":
      return "expired";
    case "inactive":
    default:
      return "none";
  }
}

function contractRank(status: OrganizationContractStatus): number {
  switch (status) {
    case "suspended":
      return 120;
    case "cancelled":
      return 115;
    case "expired":
      return 110;
    case "limited":
      return 100;
    case "active":
      return 90;
    case "accepted":
      return 60;
    case "offered":
      return 50;
    case "draft":
      return 40;
    case "none":
    default:
      return 10;
  }
}

function mapOrderRecordToReadModel(record: OrganizationContractOrderRecord): OrganizationContractReadModel {
  const runtimeMarker = shouldUseInMemoryMongoFallback()
    ? "demo_or_test_runtime"
    : record.billingSource === "external_checkout_pending"
      ? "external_checkout_pending"
      : "production_runtime";
  const sourceOfTruth = record.billingSource ?? "operator_verified_contract";
  const auditBacked = record.auditEvents.length > 0;
  return {
    id: record.id,
    orderId: record.orderId,
    organizationId: record.organizationId,
    organizationName: record.organizationName,
    contractStatus: record.contractStatus ?? mapPricingOrderStatusToContractStatus(record.status),
    billingStatus: record.billingStatus ?? mapPricingOrderStatusToBillingStatus(record.status),
    sourceOfTruth,
    planAssignment: record.planAssignment,
    accessProvisioningDecision:
      record.accessProvisioningDecision ??
      deriveProvisioningDecisionFromContract({
        contractStatus: record.contractStatus ?? mapPricingOrderStatusToContractStatus(record.status),
        billingStatus: record.billingStatus ?? mapPricingOrderStatusToBillingStatus(record.status),
      }),
    auditEvents: record.auditEvents,
    productionTruth: isProductionBillingTruth({
      source: sourceOfTruth,
      runtimeMarker,
      auditBacked,
    }),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapEntitlementToReadModel(input: {
  organization: Organization;
  entitlement: PaidDashboardEntitlement;
  entitlementAuditEvents: EntitlementAuditEvent[];
}): OrganizationContractReadModel {
  const sourceOfTruth = sourceFromEntitlement(input.entitlement);
  const runtimeMarker = shouldUseInMemoryMongoFallback()
    ? "demo_or_test_runtime"
    : sourceOfTruth === "external_checkout_pending"
      ? "external_checkout_pending"
      : "production_runtime";
  const auditEvents: OrganizationContractAuditEvent[] = input.entitlementAuditEvents
    .filter((event) => event.entitlementId === input.entitlement.id)
    .map((event) => ({
      id: `${event.id}:contract`,
      eventType:
        event.previousStatus === "suspended" && event.nextStatus === "active"
          ? "reactivate"
          : event.nextStatus === "active"
          ? "activate"
          : event.nextStatus === "suspended"
            ? "suspend"
            : event.nextStatus === "revoked" || event.nextStatus === "cancelled"
              ? "cancel"
              : event.nextStatus === "expired"
                ? "expire"
                  : "accept",
      organizationId: input.organization.id,
      orderId: input.entitlement.id,
      previousContractStatus: event.previousStatus
        ? contractStatusFromEntitlement({
            ...input.entitlement,
            status: event.previousStatus,
          })
        : null,
      nextContractStatus: event.nextStatus
        ? contractStatusFromEntitlement({
            ...input.entitlement,
            status: event.nextStatus,
          })
        : contractStatusFromEntitlement(input.entitlement),
      previousBillingStatus: event.previousStatus
        ? billingStatusFromEntitlement({
            ...input.entitlement,
            status: event.previousStatus,
          })
        : null,
      nextBillingStatus: event.nextStatus
        ? billingStatusFromEntitlement({
            ...input.entitlement,
            status: event.nextStatus,
          })
        : billingStatusFromEntitlement(input.entitlement),
      source: sourceOfTruth,
      planAssignment: {
        planId: input.entitlement.planId,
        planLabel: input.entitlement.planLabel,
        scopes: [...DEFAULT_CONTRACT_PROVISIONED_SCOPES],
      },
      note: event.note ?? null,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
    }));

  return {
    id: input.entitlement.id,
    orderId: input.entitlement.id,
    organizationId: input.organization.id,
    organizationName: input.organization.name,
    contractStatus: contractStatusFromEntitlement(input.entitlement),
    billingStatus: billingStatusFromEntitlement(input.entitlement),
    sourceOfTruth,
    planAssignment: {
      planId: input.entitlement.planId,
      planLabel: input.entitlement.planLabel,
      scopes: [...DEFAULT_CONTRACT_PROVISIONED_SCOPES],
    },
    accessProvisioningDecision: deriveProvisioningDecisionFromContract({
      contractStatus: contractStatusFromEntitlement(input.entitlement),
      billingStatus: billingStatusFromEntitlement(input.entitlement),
    }),
    auditEvents,
    productionTruth: isProductionBillingTruth({
      source: sourceOfTruth,
      runtimeMarker,
      auditBacked: auditEvents.length > 0,
    }),
    createdAt: input.entitlement.createdAt,
    updatedAt: input.entitlement.updatedAt,
  };
}

export function organizationContractAllowsProvisionedScope(
  summary: Pick<
    OrganizationContractSummary,
    "currentContractStatus" | "billingStatus" | "planAssignment" | "auditBacked" | "runtimeMarker"
  >,
  scope: string,
): boolean {
  if (
    summary.currentContractStatus === "suspended" ||
    summary.currentContractStatus === "cancelled" ||
    summary.currentContractStatus === "expired" ||
    summary.billingStatus === "overdue" ||
    summary.billingStatus === "suspended" ||
    summary.billingStatus === "cancelled" ||
    summary.billingStatus === "expired"
  ) {
    return false;
  }

  const availableScopes = new Set(
    summary.planAssignment?.scopes?.length
      ? summary.planAssignment.scopes
      : [...DEFAULT_CONTRACT_PROVISIONED_SCOPES],
  );

  if (
    summary.currentContractStatus === "active" &&
    (summary.billingStatus === "operator_verified_contract" || summary.billingStatus === "active") &&
    (summary.auditBacked || summary.runtimeMarker === "demo_or_test_runtime")
  ) {
    return availableScopes.has(scope);
  }

  if (
    summary.currentContractStatus === "limited" ||
    summary.billingStatus === "grace_period" ||
    summary.billingStatus === "billing_pending"
  ) {
    return availableScopes.has(scope) && LIMITED_CONTRACT_PROVISIONED_SCOPES.includes(scope as (typeof LIMITED_CONTRACT_PROVISIONED_SCOPES)[number]);
  }

  return false;
}

export function buildOrganizationContractSummary(input: {
  organization: Organization | null;
  entitlements: PaidDashboardEntitlement[];
  entitlementAuditEvents: EntitlementAuditEvent[];
  pricingOrders: OrganizationContractOrderRecord[];
}): OrganizationContractSummary {
  const runtimeMarker = shouldUseInMemoryMongoFallback()
    ? "demo_or_test_runtime"
    : "production_runtime";
  if (!input.organization) {
    return {
      currentContractStatus: "none",
      billingStatus: "none",
      sourceOfTruth: runtimeMarker === "demo_or_test_runtime" ? "fixture_demo" : "operator_verified_contract",
      confidence: "limited",
      runtimeMarker,
      productionTruth: false,
      auditBacked: false,
      planAssignment: null,
      accessProvisioningDecision: "none",
      operatorDecisionRequired: false,
      nextStepTitle: "Vertrag ausstehend",
      nextStepBody:
        "Ohne bestätigte Organisation und bewussten Betreiber-Vertragsprozess werden keine produktiven Arbeitszugänge als aktiv ausgegeben.",
      storeLabel: runtimeMarker === "demo_or_test_runtime" ? "Demo-/Test-Fallback" : "Persistenter Vertragsprozess",
      records: [],
    };
  }

  const orderRecords = input.pricingOrders.map((record) => mapOrderRecordToReadModel(record));
  const entitlementRecords = input.entitlements.map((entitlement) =>
    mapEntitlementToReadModel({
      organization: input.organization!,
      entitlement,
      entitlementAuditEvents: input.entitlementAuditEvents,
    }),
  );

  const records = [...orderRecords];
  for (const entitlementRecord of entitlementRecords) {
    if (!records.some((record) => record.id === entitlementRecord.id || record.orderId === entitlementRecord.orderId)) {
      records.push(entitlementRecord);
    }
  }

  const primary =
    [...records].sort((left, right) => {
      const rankDelta = contractRank(right.contractStatus) - contractRank(left.contractStatus);
      if (rankDelta !== 0) return rankDelta;
      return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
    })[0] ?? null;

  if (!primary) {
    return {
      currentContractStatus: "none",
      billingStatus: "none",
      sourceOfTruth: runtimeMarker === "demo_or_test_runtime" ? "fixture_demo" : "operator_verified_contract",
      confidence: "limited",
      runtimeMarker,
      productionTruth: false,
      auditBacked: false,
      planAssignment: null,
      accessProvisioningDecision: "none",
      operatorDecisionRequired: true,
      nextStepTitle: "Vertrag ausstehend",
      nextStepBody:
        "Für produktive Arbeitszugänge braucht deine Organisation einen bewussten Betreiber-Vertragsprozess. Ohne diesen Schritt bleiben Vertrags- und Billing-Status ehrlich inaktiv.",
      storeLabel: runtimeMarker === "demo_or_test_runtime" ? "Demo-/Test-Fallback" : "Persistenter Vertragsprozess",
      records: [],
    };
  }

  const sourceOfTruth =
    primary.sourceOfTruth;
  const productionTruth = primary.productionTruth && sourceOfTruth === "operator_verified_contract";
  const auditBacked = records.some((record) => record.auditEvents.length > 0);

  switch (primary.contractStatus) {
    case "active":
      return {
        currentContractStatus: primary.contractStatus,
        billingStatus: primary.billingStatus,
        sourceOfTruth,
        confidence: productionTruth ? "high" : "limited",
        runtimeMarker,
        productionTruth,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: false,
        nextStepTitle:
          primary.billingStatus === "operator_verified_contract" || primary.billingStatus === "active"
            ? "Zugriff aktiv"
            : organizationBillingStatusLabel(primary.billingStatus),
        nextStepBody:
          primary.billingStatus === "operator_verified_contract" || primary.billingStatus === "active"
            ? "Vertrag, Billing-Status und Plan-Zuweisung sind bewusst gesetzt. Freigaben bleiben scope-genau, auditierbar und erzeugen weder Betreiberrechte noch automatische Veröffentlichungsrechte."
            : "Der Vertrag ist aktiv angelegt, aber der Billing-Status begrenzt die Nutzung bewusst weiter.",
        storeLabel: productionTruth ? "Persistenter Betreiber-Vertragsprozess" : "Persistenter Vertragsprozess ohne production_truth",
        records,
      };
    case "limited":
      return {
        currentContractStatus: "limited",
        billingStatus: primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: false,
        nextStepTitle:
          primary.billingStatus === "grace_period"
            ? "Grace Period"
            : "Zugriff eingeschränkt",
        nextStepBody:
          primary.billingStatus === "grace_period"
            ? "Der Zugang bleibt vorübergehend begrenzt sichtbar. Schreibende Produktzugänge bleiben auf definierte Basisscopes reduziert, bis Betreiber den Status bewusst klären."
            : "Der Vertrag begrenzt die aktiven Scopes bewusst. Schreibende Produktpfade bleiben auf definierte Basisscopes reduziert.",
        storeLabel: productionTruth ? "Persistenter Betreiber-Vertragsprozess" : "Persistenter Vertragsprozess ohne production_truth",
        records,
      };
    case "suspended":
      return {
        currentContractStatus: "suspended",
        billingStatus: primary.billingStatus === "none" ? "suspended" : primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: false,
        nextStepTitle: "Pausiert",
        nextStepBody:
          "Vertrag oder Billing sind pausiert. Schreibende Produktzugänge bleiben blockiert, bis Betreiber bewusst reaktivieren.",
        storeLabel: productionTruth ? "Persistenter Betreiber-Vertragsprozess" : "Persistenter Vertragsprozess ohne production_truth",
        records,
      };
    case "cancelled":
      return {
        currentContractStatus: "cancelled",
        billingStatus: primary.billingStatus === "none" ? "cancelled" : primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: false,
        nextStepTitle: "Gekündigt",
        nextStepBody:
          "Der Vertrag ist beendet. Schreibende Produktzugänge bleiben gesperrt, bis ein neuer bewusster Betreiber-Vertragsprozess startet.",
        storeLabel: productionTruth ? "Persistenter Betreiber-Vertragsprozess" : "Persistenter Vertragsprozess ohne production_truth",
        records,
      };
    case "expired":
      return {
        currentContractStatus: "expired",
        billingStatus: primary.billingStatus === "none" ? "expired" : primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: false,
        nextStepTitle: "Abgelaufen",
        nextStepBody:
          "Der Vertrag ist abgelaufen. Produktzugänge bleiben gesperrt, bis Betreiber bewusst verlängern oder neu aktivieren.",
        storeLabel: productionTruth ? "Persistenter Betreiber-Vertragsprozess" : "Persistenter Vertragsprozess ohne production_truth",
        records,
      };
    case "accepted":
      return {
        currentContractStatus: "accepted",
        billingStatus: primary.billingStatus === "none" ? "operator_verified_contract" : primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth: false,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: true,
        nextStepTitle: "Angebot oder Vertrag in Prüfung",
        nextStepBody:
          "Der Vertrag ist angenommen, aber produktive Vollzugriffe werden erst nach bewusster Aktivierung sichtbar. Billing pending erzeugt keinen aktiven Vollzugriff.",
        storeLabel: runtimeMarker === "demo_or_test_runtime" ? "Demo-/Test-Fallback" : "Persistenter Vertragsprozess",
        records,
      };
    case "offered":
    case "draft":
    case "none":
    default:
      return {
        currentContractStatus: primary.contractStatus,
        billingStatus: primary.billingStatus === "none" ? "billing_pending" : primary.billingStatus,
        sourceOfTruth,
        confidence: auditBacked ? "high" : "limited",
        runtimeMarker,
        productionTruth: false,
        auditBacked,
        planAssignment: primary.planAssignment,
        accessProvisioningDecision: primary.accessProvisioningDecision,
        operatorDecisionRequired: true,
        nextStepTitle:
          primary.contractStatus === "draft"
            ? "Vertrag ausstehend"
            : "Angebot oder Vertrag in Prüfung",
        nextStepBody:
          "Der Vertragsprozess ist sichtbar, aber noch nicht aktiv. Es wird bewusst kein externer Checkout behauptet und keine aktive Vollfreischaltung vorgetäuscht.",
        storeLabel: runtimeMarker === "demo_or_test_runtime" ? "Demo-/Test-Fallback" : "Persistenter Vertragsprozess",
        records,
      };
  }
}

export {
  organizationBillingStatusLabel,
  organizationContractStatusLabel,
};
