import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  organizationContractAllowsProvisionedScope,
  type OrganizationContractSummary,
} from "./organizationContracts";
import {
  isProductionPartnerPackageTruth,
  partnerFundingDisclosureRoleLabel,
  partnerPackageScopeLabel,
  partnerPackageStatusLabel,
  partnerPackageTypeLabel,
  partnerProjectPackageAllowsScope,
  partnerReportingStateLabel,
} from "@features/pricing";
import type {
  OrganizationBillingSource,
  OrganizationContractOrderRecord,
  PartnerFundingDisclosure,
  PartnerPackageAuditEvent,
  PartnerPackageScope,
  PartnerPackageStatus,
  PartnerPackageType,
  PartnerReportingState,
} from "@features/pricing";

export type OrganizationPartnerPackageReadModel = {
  id: string;
  type: PartnerPackageType;
  typeLabel: string;
  status: PartnerPackageStatus;
  statusLabel: string;
  sourceOfTruth: OrganizationBillingSource;
  productionTruth: boolean;
  auditBacked: boolean;
  scopes: PartnerPackageScope[];
  scopeLabels: string[];
  enabledScopes: PartnerPackageScope[];
  reportingState: PartnerReportingState | null;
  reportingLabel: string | null;
  transparency: PartnerFundingDisclosure | null;
  transparencyRoleLabel: string | null;
  auditEvents: PartnerPackageAuditEvent[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type OrganizationPartnerPackageSummary = {
  currentStatus: PartnerPackageStatus | "none";
  statusLabel: string;
  currentType: PartnerPackageType | null;
  typeLabel: string | null;
  sourceOfTruth: OrganizationBillingSource;
  confidence: "high" | "limited";
  runtimeMarker:
    | "production_runtime"
    | "demo_or_test_runtime"
    | "external_checkout_pending";
  productionTruth: boolean;
  auditBacked: boolean;
  enabledScopes: PartnerPackageScope[];
  reportingState: PartnerReportingState | null;
  reportingLabel: string | null;
  transparency: PartnerFundingDisclosure | null;
  transparencyRoleLabel: string | null;
  nextStepTitle: string;
  nextStepBody: string;
  storeLabel: string;
  items: OrganizationPartnerPackageReadModel[];
  guardrails: {
    noOperatorRights: true;
    noPublicOfficial: true;
    noPublicationApproved: true;
    noSourceWeightInfluence: true;
    noVoteOutcomeInfluence: true;
    noFactcheckSealInfluence: true;
  };
};

function packageStatusRank(status: PartnerPackageStatus): number {
  switch (status) {
    case "active":
      return 100;
    case "limited":
      return 95;
    case "reporting_required":
      return 90;
    case "offered":
      return 70;
    case "draft":
      return 60;
    case "paused":
      return 50;
    case "completed":
      return 40;
    case "cancelled":
      return 30;
    case "archived":
      return 20;
    default:
      return 10;
  }
}

function packageRuntimeMarker(source: OrganizationBillingSource) {
  if (shouldUseInMemoryMongoFallback()) return "demo_or_test_runtime" as const;
  if (source === "external_checkout_pending") return "external_checkout_pending" as const;
  return "production_runtime" as const;
}

export function buildOrganizationPartnerPackageSummary(input: {
  contractSummary: OrganizationContractSummary;
  pricingOrders: OrganizationContractOrderRecord[];
}): OrganizationPartnerPackageSummary {
  const items = input.pricingOrders
    .filter((record) => Boolean(record.partnerProjectPackage))
    .map((record) => {
      const pkg = record.partnerProjectPackage!;
      const sourceOfTruth = record.billingSource ?? input.contractSummary.sourceOfTruth;
      const runtimeMarker = packageRuntimeMarker(sourceOfTruth);
      const auditBacked = (record.partnerPackageAuditEvents?.length ?? 0) > 0;
      const enabledScopes = pkg.scopes.filter((scope) =>
        partnerProjectPackageAllowsScope(
          {
            status: pkg.status,
            scopes: pkg.scopes,
            source: sourceOfTruth,
            runtimeMarker,
            auditBacked,
          },
          scope,
        ),
      ).filter((scope) => {
        switch (scope) {
          case "dossier_studio":
            return organizationContractAllowsProvisionedScope(input.contractSummary, "dossier_studio");
          case "source_connections":
            return organizationContractAllowsProvisionedScope(input.contractSummary, "source_connection");
          case "runden_qr":
          case "social_distribution":
            return organizationContractAllowsProvisionedScope(input.contractSummary, "public_share");
          case "reporting_export":
            return input.contractSummary.productionTruth;
          default:
            return false;
        }
      });
      return {
        id: pkg.id,
        type: pkg.type,
        typeLabel: partnerPackageTypeLabel(pkg.type),
        status: pkg.status,
        statusLabel: partnerPackageStatusLabel(pkg.status),
        sourceOfTruth,
        productionTruth:
          isProductionPartnerPackageTruth({
            source: sourceOfTruth,
            runtimeMarker,
            auditBacked,
          }) && input.contractSummary.productionTruth,
        auditBacked,
        scopes: pkg.scopes,
        scopeLabels: pkg.scopes.map((scope) => partnerPackageScopeLabel(scope)),
        enabledScopes,
        reportingState: record.partnerReportingState ?? null,
        reportingLabel: record.partnerReportingState ? partnerReportingStateLabel(record.partnerReportingState) : null,
        transparency: record.partnerFundingDisclosure ?? null,
        transparencyRoleLabel: record.partnerFundingDisclosure
          ? partnerFundingDisclosureRoleLabel(record.partnerFundingDisclosure.role)
          : null,
        auditEvents: record.partnerPackageAuditEvents ?? [],
        createdAt: pkg.createdAt ?? record.createdAt,
        updatedAt: pkg.updatedAt ?? record.updatedAt,
      } satisfies OrganizationPartnerPackageReadModel;
    })
    .sort((left, right) => {
      const statusDelta = packageStatusRank(right.status) - packageStatusRank(left.status);
      if (statusDelta !== 0) return statusDelta;
      return String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
    });

  const primary = items[0] ?? null;
  const runtimeMarker = primary ? packageRuntimeMarker(primary.sourceOfTruth) : packageRuntimeMarker(input.contractSummary.sourceOfTruth);

  if (!primary) {
    return {
      currentStatus: "none",
      statusLabel: "Kein Projektpaket aktiv",
      currentType: null,
      typeLabel: null,
      sourceOfTruth: input.contractSummary.sourceOfTruth,
      confidence: "limited",
      runtimeMarker,
      productionTruth: false,
      auditBacked: false,
      enabledScopes: [],
      reportingState: null,
      reportingLabel: null,
      transparency: null,
      transparencyRoleLabel: null,
      nextStepTitle: "Kein Projektpaket aktiv",
      nextStepBody:
        "Projektpakete werden erst nach bewusster Betreiberentscheidung, passendem Vertrag und auditierbarer Transparenz als aktiv geführt.",
      storeLabel: shouldUseInMemoryMongoFallback()
        ? "In-Memory-/Test-Fallback"
        : "Persistenter Partner-/Projektpaket-Store",
      items,
      guardrails: {
        noOperatorRights: true,
        noPublicOfficial: true,
        noPublicationApproved: true,
        noSourceWeightInfluence: true,
        noVoteOutcomeInfluence: true,
        noFactcheckSealInfluence: true,
      },
    };
  }

  const nextStepTitle =
    primary.status === "active"
      ? "Projektpaket aktiv"
      : primary.status === "limited"
        ? "Leistungen eingeschränkt"
        : primary.status === "reporting_required"
          ? "Reporting erforderlich"
          : primary.status === "offered"
            ? "Paket angeboten"
            : primary.status === "paused"
              ? "Paket pausiert"
              : primary.status === "completed"
                ? "Paket abgeschlossen"
                : primary.status === "cancelled"
                  ? "Paket beendet"
                  : primary.status === "archived"
                    ? "Paket archiviert"
                    : "Paket angefragt";

  const nextStepBody =
    primary.status === "active"
      ? "Projektpakete schalten nur explizit zugewiesene Scopes frei. Partner-, Medien- oder Förderstatus erzeugen weder Betreiberrechte noch automatische Veröffentlichungsrechte."
      : primary.status === "limited"
        ? "Das Projektpaket ist bewusst begrenzt. Nur die aktuell freigeschalteten Scopes bleiben aktiv; schreibende Zugänge ausserhalb dieser Scopes bleiben blockiert."
        : primary.status === "reporting_required"
          ? "Das Paket verlangt einen nachvollziehbaren Reporting- oder Exportschritt. Es werden keine Live-Analytics oder Ergebnisgewichte behauptet."
          : primary.status === "paused" || primary.status === "cancelled" || primary.status === "archived"
            ? "Dieses Paket ist nicht mehr schreibend aktiv. Dossier-, QR-, Social- oder Reporting-Pfade bleiben gesperrt oder nur historisch sichtbar."
            : "Das Projektpaket bleibt in Prüfung, bis Betreiber Status, Transparenzhinweise und Leistungsumfang bewusst bestätigen.";

  return {
    currentStatus: primary.status,
    statusLabel: primary.statusLabel,
    currentType: primary.type,
    typeLabel: primary.typeLabel,
    sourceOfTruth: primary.sourceOfTruth,
    confidence: primary.productionTruth ? "high" : "limited",
    runtimeMarker,
    productionTruth: primary.productionTruth,
    auditBacked: primary.auditBacked,
    enabledScopes: primary.enabledScopes,
    reportingState: primary.reportingState,
    reportingLabel: primary.reportingLabel,
    transparency: primary.transparency,
    transparencyRoleLabel: primary.transparencyRoleLabel,
    nextStepTitle,
    nextStepBody,
    storeLabel: primary.productionTruth
      ? "Persistenter Betreiber-Vertrags- und Paketprozess"
      : shouldUseInMemoryMongoFallback()
        ? "In-Memory-/Test-Fallback"
        : "Persistenter Partner-/Projektpaket-Store ohne production_truth",
    items,
    guardrails: {
      noOperatorRights: true,
      noPublicOfficial: true,
      noPublicationApproved: true,
      noSourceWeightInfluence: true,
      noVoteOutcomeInfluence: true,
      noFactcheckSealInfluence: true,
    },
  };
}
