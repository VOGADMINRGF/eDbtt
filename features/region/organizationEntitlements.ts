import { z } from "zod";
import type {
  Organization,
  OrganizationClaim,
  OrganizationMembership,
  OrganizationProvisioningStatus,
} from "./organizationOnboarding";
import { resolveProvisioningRequestStatus } from "./organizationOnboarding";
import type {
  EntitlementAuditEvent,
  EntitlementSource,
  EntitlementStatus,
  PaidDashboardEntitlement,
} from "./server/paidEntitlements";

export const ORGANIZATION_ENTITLEMENT_STATUSES = [
  "none",
  "pending_operator_decision",
  "granted",
  "limited",
  "suspended",
  "revoked",
  "expired",
] as const;

export type OrganizationEntitlementStatus =
  (typeof ORGANIZATION_ENTITLEMENT_STATUSES)[number];

export const ORGANIZATION_ENTITLEMENT_SCOPES = [
  "organization_dashboard",
  "region_cockpit",
  "review_queue",
  "content_release",
  "public_share",
  "dossier_studio",
  "source_connection",
  "billing_pending",
] as const;

export type OrganizationEntitlementScope =
  (typeof ORGANIZATION_ENTITLEMENT_SCOPES)[number];

export const ORGANIZATION_ENTITLEMENT_DECISIONS = [
  "request_operator_decision",
  "grant",
  "limit",
  "suspend",
  "revoke",
  "expire",
] as const;

export type OrganizationEntitlementDecision =
  (typeof ORGANIZATION_ENTITLEMENT_DECISIONS)[number];

export const ORGANIZATION_ENTITLEMENT_SOURCES = [
  "operator_pending",
  "paid_dashboard_entitlement",
  "billing_link_pending",
  "fixture",
  "local_runtime_fallback",
] as const;

export type OrganizationEntitlementSource =
  (typeof ORGANIZATION_ENTITLEMENT_SOURCES)[number];

export const OrganizationEntitlementAuditEventSchema = z
  .object({
    id: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    scope: z.enum(ORGANIZATION_ENTITLEMENT_SCOPES),
    status: z.enum(ORGANIZATION_ENTITLEMENT_STATUSES),
    decision: z.enum(ORGANIZATION_ENTITLEMENT_DECISIONS),
    source: z.enum(ORGANIZATION_ENTITLEMENT_SOURCES),
    linkedEntitlementId: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
    createdAt: z.string().datetime({ offset: true }),
    createdBy: z.string().trim().min(1),
  })
  .strict();

export type OrganizationEntitlementAuditEvent = z.infer<
  typeof OrganizationEntitlementAuditEventSchema
>;

export const OrganizationEntitlementGrantSchema = z
  .object({
    id: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    organizationName: z.string().trim().min(1),
    regionId: z.string().trim().min(1).nullable().optional(),
    scope: z.enum(ORGANIZATION_ENTITLEMENT_SCOPES),
    status: z.enum(ORGANIZATION_ENTITLEMENT_STATUSES),
    latestDecision: z.enum(ORGANIZATION_ENTITLEMENT_DECISIONS),
    source: z.enum(ORGANIZATION_ENTITLEMENT_SOURCES),
    linkedEntitlementId: z.string().trim().min(1).nullable().optional(),
    linkedPlanLabel: z.string().trim().min(1).nullable().optional(),
    note: z.string().trim().min(1).nullable().optional(),
    billingPending: z.boolean(),
    productionTruth: z.boolean(),
    noAutoPublicationApproved: z.literal(true),
    noAutoPublicOfficial: z.literal(true),
    noAutoPublish: z.literal(true),
    auditEvents: z.array(OrganizationEntitlementAuditEventSchema),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type OrganizationEntitlementGrant = z.infer<
  typeof OrganizationEntitlementGrantSchema
>;

export type OrganizationEntitlementSummary = {
  currentStatus: OrganizationEntitlementStatus;
  state:
    | "aktiv"
    | "eingeschränkt"
    | "in Entscheidung"
    | "gesperrt"
    | "abgelaufen"
    | "fehlt";
  grants: OrganizationEntitlementGrant[];
  operatorDecisionRequired: boolean;
  billingPending: boolean;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  productionTruth: boolean;
  planLabels: string[];
  organizationIds: string[];
  hasActiveEntitlement: boolean;
  hasTrialEntitlement: boolean;
  hasMissingEntitlement: boolean;
  hasExpiredEntitlement: boolean;
  noAutoPaymentClaim: true;
  noCheckout: true;
};

const DEFAULT_GRANTED_SCOPES: OrganizationEntitlementScope[] = [
  "organization_dashboard",
  "region_cockpit",
  "review_queue",
  "content_release",
  "dossier_studio",
  "source_connection",
];

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function entitlementPriority(status: EntitlementStatus): number {
  switch (status) {
    case "active":
      return 70;
    case "trial":
      return 60;
    case "past_due":
      return 50;
    case "suspended":
      return 40;
    case "revoked":
      return 30;
    case "expired":
      return 20;
    case "cancelled":
      return 10;
    case "inactive":
    default:
      return 0;
  }
}

function pickPrimaryEntitlement(
  entitlements: PaidDashboardEntitlement[],
): PaidDashboardEntitlement | null {
  if (entitlements.length === 0) return null;
  return [...entitlements].sort((left, right) => {
    const priorityDelta = entitlementPriority(right.status) - entitlementPriority(left.status);
    if (priorityDelta !== 0) return priorityDelta;
    return String(right.updatedAt).localeCompare(String(left.updatedAt));
  })[0] ?? null;
}

function mapPaidEntitlementToGrantStatus(
  entitlement: PaidDashboardEntitlement,
): OrganizationEntitlementStatus {
  switch (entitlement.status) {
    case "active":
      return "granted";
    case "trial":
    case "past_due":
      return "limited";
    case "suspended":
      return "suspended";
    case "revoked":
    case "cancelled":
      return "revoked";
    case "expired":
      return "expired";
    case "inactive":
    default:
      return "none";
  }
}

function mapEntitlementSource(
  source: EntitlementSource,
  billingPending: boolean,
  productionTruth: boolean,
): OrganizationEntitlementSource {
  if (!productionTruth) return "local_runtime_fallback";
  if (source === "fixture") return "fixture";
  if (billingPending || source === "order_request") return "billing_link_pending";
  return "paid_dashboard_entitlement";
}

function mapGrantDecision(
  status: OrganizationEntitlementStatus,
): OrganizationEntitlementDecision {
  switch (status) {
    case "granted":
      return "grant";
    case "limited":
      return "limit";
    case "suspended":
      return "suspend";
    case "revoked":
      return "revoke";
    case "expired":
      return "expire";
    case "pending_operator_decision":
    case "none":
    default:
      return "request_operator_decision";
  }
}

function mappedAuditStatus(
  status: EntitlementStatus | null | undefined,
): OrganizationEntitlementStatus {
  if (!status) return "pending_operator_decision";
  return mapPaidEntitlementToGrantStatus({
    status,
  } as PaidDashboardEntitlement);
}

function buildAuditEventsForEntitlement(params: {
  organizationId: string;
  scope: OrganizationEntitlementScope;
  entitlement: PaidDashboardEntitlement;
  auditEvents: EntitlementAuditEvent[];
  productionTruth: boolean;
}): OrganizationEntitlementAuditEvent[] {
  return params.auditEvents
    .filter((event) => event.organizationId === params.organizationId)
    .map((event) =>
      OrganizationEntitlementAuditEventSchema.parse({
        id: `${event.id}:${params.scope}`,
        organizationId: params.organizationId,
        scope: params.scope,
        status: mappedAuditStatus(event.nextStatus ?? event.previousStatus ?? null),
        decision: mapGrantDecision(mappedAuditStatus(event.nextStatus ?? event.previousStatus ?? null)),
        source: mapEntitlementSource(
          params.entitlement.source,
          params.entitlement.status === "past_due" || params.entitlement.source === "order_request",
          params.productionTruth,
        ),
        linkedEntitlementId: event.entitlementId,
        note: event.note ?? null,
        createdAt: event.createdAt,
        createdBy: event.createdBy,
      }),
    )
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

function buildPendingAuditEvent(params: {
  organizationId: string;
  scope: OrganizationEntitlementScope;
  claim: OrganizationClaim | null;
  productionTruth: boolean;
}): OrganizationEntitlementAuditEvent[] {
  if (!params.claim) return [];
  const createdAt =
    params.claim.reviewedAt ??
    params.claim.provisioningRequest?.decidedAt ??
    params.claim.provisioningRequest?.submittedAt ??
    params.claim.updatedAt;
  const createdBy =
    params.claim.reviewedBy ??
    params.claim.provisioningRequest?.decidedBy ??
    params.claim.userId;
  return [
    OrganizationEntitlementAuditEventSchema.parse({
      id: `${params.claim.id}:${params.scope}:pending`,
      organizationId: params.organizationId,
      scope: params.scope,
      status: "pending_operator_decision",
      decision: "request_operator_decision",
      source: params.productionTruth ? "operator_pending" : "local_runtime_fallback",
      linkedEntitlementId: null,
      note: "Organisation ist freigeschaltet, aber der Arbeitszugang braucht noch eine bewusste Betreiberentscheidung.",
      createdAt,
      createdBy,
    }),
  ];
}

function buildGrant(params: {
  organization: Organization;
  regionId: string | null;
  scope: OrganizationEntitlementScope;
  status: OrganizationEntitlementStatus;
  latestDecision: OrganizationEntitlementDecision;
  source: OrganizationEntitlementSource;
  linkedEntitlement: PaidDashboardEntitlement | null;
  note: string | null;
  billingPending: boolean;
  productionTruth: boolean;
  auditEvents: OrganizationEntitlementAuditEvent[];
  updatedAt: string;
}): OrganizationEntitlementGrant {
  return OrganizationEntitlementGrantSchema.parse({
    id: `${params.organization.id}:${params.scope}`,
    organizationId: params.organization.id,
    organizationName: params.organization.name,
    regionId: params.regionId,
    scope: params.scope,
    status: params.status,
    latestDecision: params.latestDecision,
    source: params.source,
    linkedEntitlementId: params.linkedEntitlement?.id ?? null,
    linkedPlanLabel: params.linkedEntitlement?.planLabel ?? null,
    note: params.note,
    billingPending: params.billingPending,
    productionTruth: params.productionTruth,
    noAutoPublicationApproved: true,
    noAutoPublicOfficial: true,
    noAutoPublish: true,
    auditEvents: params.auditEvents,
    updatedAt: params.updatedAt,
  });
}

export function organizationEntitlementStatusLabel(
  status: OrganizationEntitlementStatus,
): string {
  switch (status) {
    case "pending_operator_decision":
      return "In Entscheidung";
    case "granted":
      return "Freigeschaltet";
    case "limited":
      return "Eingeschränkt";
    case "suspended":
      return "Pausiert";
    case "revoked":
      return "Gesperrt";
    case "expired":
      return "Abgelaufen";
    case "none":
    default:
      return "Nicht freigeschaltet";
  }
}

export function organizationEntitlementScopeLabel(
  scope: OrganizationEntitlementScope,
): string {
  switch (scope) {
    case "organization_dashboard":
      return "Organisationsdashboard";
    case "region_cockpit":
      return "Region-Cockpit";
    case "review_queue":
      return "Review Queue";
    case "content_release":
      return "Content Release";
    case "public_share":
      return "Öffentliche Sichtbarkeit & Share";
    case "dossier_studio":
      return "Dossier-Studio";
    case "source_connection":
      return "Quellenanbindung";
    case "billing_pending":
      return "Zahlung/Vertrag offen";
    default:
      return scope;
  }
}

export function organizationEntitlementAllowsScope(
  summary: Pick<OrganizationEntitlementSummary, "grants">,
  scope: OrganizationEntitlementScope,
): boolean {
  return summary.grants.some(
    (grant) =>
      grant.scope === scope &&
      (grant.status === "granted" || grant.status === "limited"),
  );
}

export function buildOrganizationEntitlementSummary(input: {
  organization: Organization | null;
  claims: OrganizationClaim[];
  verifiedMemberships: OrganizationMembership[];
  entitlements: PaidDashboardEntitlement[];
  auditEvents: EntitlementAuditEvent[];
  productionTruth: boolean;
}): OrganizationEntitlementSummary {
  const organization = input.organization;
  const planLabels = uniqueNonEmpty(input.entitlements.map((entry) => entry.planLabel));
  const organizationIds = uniqueNonEmpty(
    organization ? [organization.id] : input.entitlements.map((entry) => entry.organizationId),
  );
  const productionTruth = input.productionTruth;
  const relevantClaims = organization
    ? input.claims.filter(
        (claim) =>
          claim.organizationId === organization.id ||
          claim.organizationName === organization.name,
      )
    : [];
  const latestClaim = [...relevantClaims].sort((left, right) =>
    String(right.updatedAt).localeCompare(String(left.updatedAt)),
  )[0] ?? null;
  const currentProvisioningStatus: OrganizationProvisioningStatus | "none" =
    organization && input.verifiedMemberships.some((membership) => membership.organizationId === organization.id)
      ? "approved"
      : latestClaim
        ? resolveProvisioningRequestStatus(latestClaim)
        : "none";
  const primaryEntitlement = pickPrimaryEntitlement(input.entitlements);
  const hasActiveEntitlement = input.entitlements.some((entry) => entry.status === "active");
  const hasTrialEntitlement = input.entitlements.some((entry) => entry.status === "trial");
  const hasExpiredEntitlement = input.entitlements.some((entry) =>
    entry.status === "expired" ||
    entry.status === "cancelled" ||
    entry.status === "revoked" ||
    entry.status === "suspended" ||
    entry.status === "past_due",
  );
  const approvedContext = Boolean(
    organization &&
      (currentProvisioningStatus === "approved" || input.entitlements.length > 0),
  );
  const operatorDecisionRequired =
    approvedContext && input.entitlements.length === 0;
  const hasPublicationApproval = input.verifiedMemberships.some(
    (membership) =>
      organization &&
      membership.organizationId === organization.id &&
      (membership.verificationStatus === "publication_approved" ||
        membership.allowedActions.includes("approve_publication")),
  );
  const billingPending = input.entitlements.some(
    (entry) => entry.status === "past_due" || entry.source === "order_request",
  );

  let grants: OrganizationEntitlementGrant[] = [];
  if (organization && operatorDecisionRequired) {
    const pendingScopes: OrganizationEntitlementScope[] = [
      ...DEFAULT_GRANTED_SCOPES,
      "public_share",
    ];
    grants = pendingScopes.map((scope) =>
      buildGrant({
        organization,
        regionId: organization.primaryRegionId ?? null,
        scope,
        status: "pending_operator_decision",
        latestDecision: "request_operator_decision",
        source: productionTruth ? "operator_pending" : "local_runtime_fallback",
        linkedEntitlement: null,
        note:
          scope === "public_share"
            ? "Öffentliche Sichtbarkeit bleibt zusätzlich an eine bewusste Publikationsfreigabe gebunden."
            : "Nach der Organisationsfreigabe braucht dieser Zugang noch eine bewusste Betreiberentscheidung.",
        billingPending: false,
        productionTruth,
        auditEvents: buildPendingAuditEvent({
          organizationId: organization.id,
          scope,
          claim: latestClaim,
          productionTruth,
        }),
        updatedAt:
          latestClaim?.reviewedAt ??
          latestClaim?.updatedAt ??
          new Date().toISOString(),
      }),
    );
  } else if (organization && primaryEntitlement) {
    const derivedStatus = mapPaidEntitlementToGrantStatus(primaryEntitlement);
    const derivedSource = mapEntitlementSource(
      primaryEntitlement.source,
      billingPending,
      productionTruth,
    );
    grants = DEFAULT_GRANTED_SCOPES.map((scope) =>
      buildGrant({
        organization,
        regionId:
          primaryEntitlement.regionId ??
          organization.primaryRegionId ??
          null,
        scope,
        status: derivedStatus,
        latestDecision: mapGrantDecision(derivedStatus),
        source: derivedSource,
        linkedEntitlement: primaryEntitlement,
        note:
          primaryEntitlement.status === "trial"
            ? "Testzugang: Scope ist bewusst begrenzt und kein Produktions- oder Zahlungsnachweis."
            : primaryEntitlement.status === "past_due"
              ? "Zahlung oder Vertragsklärung ist offen. Zugriff bleibt sichtbar, aber nicht als bezahlt ausgewiesen."
              : null,
        billingPending,
        productionTruth,
        auditEvents: buildAuditEventsForEntitlement({
          organizationId: organization.id,
          scope,
          entitlement: primaryEntitlement,
          auditEvents: input.auditEvents,
          productionTruth,
        }),
        updatedAt: primaryEntitlement.updatedAt,
      }),
    );
    const publicShareStatus =
      derivedStatus === "granted" || derivedStatus === "limited"
        ? hasPublicationApproval
          ? derivedStatus
          : "limited"
        : derivedStatus;
    grants.push(
      buildGrant({
        organization,
        regionId:
          primaryEntitlement.regionId ??
          organization.primaryRegionId ??
          null,
        scope: "public_share",
        status: publicShareStatus,
        latestDecision: mapGrantDecision(publicShareStatus),
        source: derivedSource,
        linkedEntitlement: primaryEntitlement,
        note: hasPublicationApproval
          ? "Öffentliche Sichtbarkeit bleibt review-first. `public_official` ist weiterhin ein separater menschlicher Pfad."
          : "Publikationsfreigabe fehlt noch. Dieser Grant setzt nie automatisch `publication_approved` oder `public_official`.",
        billingPending,
        productionTruth,
        auditEvents: buildAuditEventsForEntitlement({
          organizationId: organization.id,
          scope: "public_share",
          entitlement: primaryEntitlement,
          auditEvents: input.auditEvents,
          productionTruth,
        }),
        updatedAt: primaryEntitlement.updatedAt,
      }),
    );
    if (billingPending) {
      grants.push(
        buildGrant({
          organization,
          regionId:
            primaryEntitlement.regionId ??
            organization.primaryRegionId ??
            null,
          scope: "billing_pending",
          status: "limited",
          latestDecision: "limit",
          source: "billing_link_pending",
          linkedEntitlement: primaryEntitlement,
          note: "Zahlung oder Vertragsklärung ist offen. Dieser Marker ist kein Checkout- oder Paid-Nachweis.",
          billingPending: true,
          productionTruth,
          auditEvents: buildAuditEventsForEntitlement({
            organizationId: organization.id,
            scope: "billing_pending",
            entitlement: primaryEntitlement,
            auditEvents: input.auditEvents,
            productionTruth,
          }),
          updatedAt: primaryEntitlement.updatedAt,
        }),
      );
    }
  }

  const currentStatus: OrganizationEntitlementStatus =
    operatorDecisionRequired
      ? "pending_operator_decision"
      : grants.some((grant) => grant.status === "suspended")
        ? "suspended"
        : grants.some((grant) => grant.status === "revoked")
          ? "revoked"
          : grants.some((grant) => grant.status === "expired")
            ? "expired"
            : grants.some((grant) => grant.status === "limited")
              ? "limited"
              : grants.some((grant) => grant.status === "granted")
                ? "granted"
                : "none";

  switch (currentStatus) {
    case "pending_operator_decision":
      return {
        currentStatus,
        state: "in Entscheidung",
        grants,
        operatorDecisionRequired: true,
        billingPending,
        nextStepTitle: "Zugang beantragt",
        nextStepBody:
          "Die Organisation ist bestätigt, aber die Arbeitszugänge entstehen erst nach einer bewussten Betreiberentscheidung pro Scope. Es gibt keine automatische Publikationsfreigabe und keine automatische Amtlichkeit.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: true,
        hasExpiredEntitlement,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
    case "granted":
      return {
        currentStatus,
        state: "aktiv",
        grants,
        operatorDecisionRequired: false,
        billingPending,
        nextStepTitle: "Zugriff freigeschaltet",
        nextStepBody:
          "Die freigegebenen Scopes sind bewusst gesetzt und auditierbar. `publication_approved`, `public_official` und Auto-Publish entstehen trotzdem nie automatisch aus dem Entitlement.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: false,
        hasExpiredEntitlement,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
    case "limited":
      return {
        currentStatus,
        state: "eingeschränkt",
        grants,
        operatorDecisionRequired: false,
        billingPending,
        nextStepTitle: billingPending ? "Zahlung oder Vertrag offen" : "Zugriff eingeschränkt",
        nextStepBody: billingPending
          ? "Der Zugang ist sichtbar, aber nicht als bezahlt auszugeben. Billing-/Vertragsklärung bleibt ein eigener Betreiberpfad."
          : "Der Zugang ist absichtlich begrenzt, etwa als Testzugang oder ohne Publikationsfreigabe. Schreib- und Sichtbarkeitspfade bleiben scope-genau getrennt.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: false,
        hasExpiredEntitlement,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
    case "suspended":
    case "revoked":
      return {
        currentStatus,
        state: "gesperrt",
        grants,
        operatorDecisionRequired: false,
        billingPending,
        nextStepTitle: "Zugriff pausiert oder gesperrt",
        nextStepBody:
          "Die Entitlements blockieren jetzt sichtbar alle scope-gebundenen Schreibpfade. Eine erneute Freischaltung braucht wieder eine bewusste Betreiberentscheidung.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: false,
        hasExpiredEntitlement: true,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
    case "expired":
      return {
        currentStatus,
        state: "abgelaufen",
        grants,
        operatorDecisionRequired: false,
        billingPending,
        nextStepTitle: "Zugriff abgelaufen",
        nextStepBody:
          "Die bisherige Freischaltung ist abgelaufen. Schreibpfade bleiben gesperrt, bis ein neuer bewusster Grant gesetzt wird.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: false,
        hasExpiredEntitlement: true,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
    case "none":
    default:
      return {
        currentStatus: "none",
        state: "fehlt",
        grants: [],
        operatorDecisionRequired: false,
        billingPending: false,
        nextStepTitle: "Kein freigegebener Arbeitszugang",
        nextStepBody:
          "Ohne expliziten Entitlement-Grant bleiben Review, Content Release und öffentliche Sichtbarkeit gesperrt. Auch nach Organisationsprüfung werden Rechte nicht automatisch gesetzt.",
        storeLabel: productionTruth ? "Persistente Entitlement-Runtime" : "Lokaler oder In-Memory-Fallback",
        productionTruth,
        planLabels,
        organizationIds,
        hasActiveEntitlement,
        hasTrialEntitlement,
        hasMissingEntitlement: true,
        hasExpiredEntitlement,
        noAutoPaymentClaim: true,
        noCheckout: true,
      };
  }
}
