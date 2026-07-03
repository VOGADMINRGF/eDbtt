import {
  B2B_PACKAGE_IDS,
  B2G_PACKAGE_IDS,
  DEFAULT_CONTRACT_PROVISIONED_SCOPES,
  EDEBATTE_PACKAGES_DE,
  ORGANIZATION_BILLING_SOURCES,
  PRIVATE_PACKAGE_IDS,
  getPackagesByIds,
  resolvePaymentProviderContract,
  type EDebattePackageDefinition,
  type OrganizationBillingSource,
  type PaymentProviderContract,
} from "@features/pricing";
import { OPTIONAL_RESEARCH_PROVIDER_POLICIES, RESEARCH_ENTITLEMENT_KEYS } from "@/features/ai/researchProviderPolicy";

export const V3_PRICING_REAL_HREFS = [
  "/admin",
  "/admin/pricing/orders",
  "/admin/entitlements",
  "/admin/telemetry/ai/usage",
  "/pricing",
  "/pricing/institutionen",
  "/order",
  "/account/organization/dashboard",
  "/atlas/social-review",
] as const;

export type V3PricingHref = (typeof V3_PRICING_REAL_HREFS)[number];

export type V3PricingGateStatus = "wired" | "partially_wired";

export type V3PricingPackageFamily = {
  id: "private" | "journalism" | "organization" | "municipality";
  label: string;
  packageIds: string[];
  packageCount: number;
  contributionCreditsPerMonth: number;
  anlassraumCredits: number;
  searchCredits: number;
  deepResearchCredits: number;
  premiumResearchEligibleCount: number;
  statuses: string[];
  publicHref: V3PricingHref;
  guardrails: string[];
};

export type V3PricingCostGate = {
  id:
    | "billing_truth"
    | "entitlement_scopes"
    | "research_cost_gate"
    | "material_extraction_cost_gate"
    | "export_distribution_gate";
  label: string;
  status: V3PricingGateStatus;
  currentReality: string;
  adminHref?: V3PricingHref;
  publicHref?: V3PricingHref;
  repoEvidence: string[];
  tests: string[];
  gap: string;
  nextSliceId: string;
  guardrails: string[];
};

export type V3PricingCreditsReadModel = {
  generatedAt: string;
  sectionStatus: "operational_basic";
  summary: {
    packageCount: number;
    packageFamilies: number;
    packagesWithSearchCredits: number;
    packagesWithDeepResearchCredits: number;
    premiumResearchEligiblePackages: number;
    operatorProvisionedScopes: number;
    researchEntitlementKeys: number;
    costGates: number;
    wiredCostGates: number;
    partiallyWiredCostGates: number;
  };
  billingTruth: {
    provider: PaymentProviderContract["provider"];
    status: PaymentProviderContract["status"];
    environment: PaymentProviderContract["environment"];
    selfServiceCheckout: boolean;
    manualInvoiceFallback: boolean;
    webhookSettlement: boolean;
    blockedSources: OrganizationBillingSource[];
    operatorTruthSources: OrganizationBillingSource[];
  };
  packageFamilies: V3PricingPackageFamily[];
  costGates: V3PricingCostGate[];
  guardrails: string[];
  nextGaps: Array<{
    label: string;
    nextSliceId: string;
    reason: string;
  }>;
};

const JOURNALISM_PACKAGE_IDS = ["journal_basis", "journal_pro"] as const;

const GLOBAL_GUARDRAILS = [
  "Keine versteckten Gebührenläufe",
  "Kein kostenpflichtiger Lauf ohne explizites Gate",
  "Kein Auto-Publish",
  "Keine hidden DeepSearch",
] as const;

function uniqueStatuses(packages: EDebattePackageDefinition[]) {
  return [...new Set(packages.map((entry) => entry.status))];
}

function packageFamily(input: {
  id: V3PricingPackageFamily["id"];
  label: string;
  packageIds: readonly string[];
  publicHref: V3PricingHref;
  guardrails: string[];
}): V3PricingPackageFamily {
  const packages = getPackagesByIds(input.packageIds as never, "de");
  return {
    id: input.id,
    label: input.label,
    packageIds: [...input.packageIds],
    packageCount: packages.length,
    contributionCreditsPerMonth: packages.reduce((sum, entry) => sum + entry.contributionCreditsPerMonth, 0),
    anlassraumCredits: packages.reduce((sum, entry) => sum + entry.anlassraumCredits, 0),
    searchCredits: packages.reduce((sum, entry) => sum + entry.searchCredits, 0),
    deepResearchCredits: packages.reduce((sum, entry) => sum + entry.deepResearchCredits, 0),
    premiumResearchEligibleCount: packages.filter((entry) => entry.premiumResearchEligible).length,
    statuses: uniqueStatuses(packages),
    publicHref: input.publicHref,
    guardrails: [...input.guardrails],
  };
}

export function buildV3PricingCreditsReadModel(input?: {
  env?: Record<string, string | undefined>;
}): V3PricingCreditsReadModel {
  const paymentProvider = resolvePaymentProviderContract(input?.env);

  const packageFamilies = [
    packageFamily({
      id: "private",
      label: "Privat",
      packageIds: PRIVATE_PACKAGE_IDS,
      publicHref: "/pricing",
      guardrails: [
        "Grundbeteiligung bleibt von V3-Cost-Gates getrennt",
        "Deep Research bleibt optional und nie Default",
      ],
    }),
    packageFamily({
      id: "journalism",
      label: "Journalismus",
      packageIds: JOURNALISM_PACKAGE_IDS,
      publicHref: "/pricing",
      guardrails: [
        "Faktencheck und Research bleiben review-first",
        "Keine automatische externe Recherche",
      ],
    }),
    packageFamily({
      id: "organization",
      label: "Organisationen",
      packageIds: B2B_PACKAGE_IDS,
      publicHref: "/pricing/institutionen",
      guardrails: [
        "Freischaltung folgt Vertrag und Audit",
        "Keine stille Scope-Ausweitung",
      ],
    }),
    packageFamily({
      id: "municipality",
      label: "Kommunen / Verwaltung",
      packageIds: B2G_PACKAGE_IDS,
      publicHref: "/pricing/institutionen",
      guardrails: [
        "Keine implizite Amtlichkeitsfreigabe",
        "Keine automatische publication_approved-Logik",
      ],
    }),
  ];

  const costGates: V3PricingCostGate[] = [
    {
      id: "billing_truth",
      label: "Billing Truth / Checkout / Audit",
      status: "wired",
      currentReality:
        "Checkout-, Billing- und Vertragswahrheit laufen ueber bestehende Pricing-Orders, Checkout-Sessions und operator-verifizierte Vertragszustände.",
      adminHref: "/admin/pricing/orders",
      publicHref: "/pricing/institutionen",
      repoEvidence: [
        "features/pricing/checkoutProvider.ts",
        "features/pricing/server/checkoutSessionsRepo.ts",
        "features/pricing/domain/organizationContract.ts",
        "apps/web/src/app/admin/pricing/orders/page.tsx",
      ],
      tests: [
        "apps/web/tests/admin-pricing-control-contract.test.ts",
        "apps/web/tests/admin-pricing-control-readmodel.test.ts",
        "apps/web/tests/payment-checkout-session.contract.test.ts",
        "apps/web/tests/payment-entitlement-after-checkout.contract.test.ts",
        "apps/web/tests/admin-pricing-orders.route.test.ts",
      ],
      gap:
        "Die Consumption-Truth-Sicht ist jetzt sichtbar, aber echte Runtime-Verknuepfung zwischen Lauf, recorded_usage und Debit fehlt weiter jenseits des Vertrags- und Checkout-Scopes.",
      nextSliceId: "V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03",
      guardrails: [
        "Kein Auto-Billing fuer Review-, Publish- oder Truth-Status",
        "Fixture- und pending-Checkout bleiben keine Produktionswahrheit",
      ],
    },
    {
      id: "entitlement_scopes",
      label: "Entitlements / Planwirkung / Scopes",
      status: "wired",
      currentReality:
        "Freischaltungen und Vertrags-Scopes sind bereits ueber Entitlements, Orders und Organisationssicht sichtbar und auditierbar.",
      adminHref: "/admin/entitlements",
      publicHref: "/account/organization/dashboard",
      repoEvidence: [
        "apps/web/src/app/admin/entitlements/page.tsx",
        "features/pricing/domain/organizationContract.ts",
        "features/region/organizationContracts.ts",
        "features/region/organizationEntitlements.ts",
      ],
      tests: [
        "apps/web/tests/paid-entitlements.contract.test.ts",
        "apps/web/tests/admin-entitlements.route.test.ts",
        "apps/web/tests/account-organization-dashboard.page.test.tsx",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
      ],
      gap:
        "Es fehlt eine feinere V3-Limit- und Verbrauchslesart pro Scope statt nur Vertrags-, Plan- und Entitlement-Wirkung.",
      nextSliceId: "V3-ROLES-PERMISSIONS-ENTITLEMENTS-01",
      guardrails: [
        "Keine implizite Freigabe durch Rolle allein",
        "Scopes bleiben von Wahrheit, Verifikation und Publish getrennt",
      ],
    },
    {
      id: "research_cost_gate",
      label: "Research / DeepSearch Cost Gate",
      status: "wired",
      currentReality:
        "Research-Provider und DeepSearch bleiben optional, entitlement-gated und in der AI-Usage-Telemetry sichtbar.",
      adminHref: "/admin/telemetry/ai/usage",
      publicHref: "/pricing",
      repoEvidence: [
        "apps/web/src/features/ai/researchProviderPolicy.ts",
        "apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts",
        "apps/web/src/app/admin/telemetry/ai/usage/page.tsx",
      ],
      tests: [
        "apps/web/tests/ai-cost-research-guardrail.contract.test.ts",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
        "apps/web/tests/admin-ai-usage.route.test.ts",
        "apps/web/tests/ai-usage-operational-signals.contract.test.ts",
      ],
      gap:
        "Research-Gates und Consumption-Truth sind sichtbar; offen bleibt der explizite Runtime-Pfad pro Research-Lauf mit recorded_usage, Debit und Nachaudit.",
      nextSliceId: "V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03",
      guardrails: [
        "Keine hidden DeepSearch",
        "Kein Premium-Research als Standard-Analyze-Fallback",
      ],
    },
    {
      id: "material_extraction_cost_gate",
      label: "Material Extraction Cost Gate",
      status: "wired",
      currentReality:
        "Kostenrelevante Extraktion bleibt approval-pflichtig und blockiert, bis eine explizite Freigabe besteht.",
      adminHref: "/admin",
      publicHref: "/order",
      repoEvidence: [
        "apps/web/src/features/material/materialExtractionJobs.ts",
        "apps/web/src/app/api/admin/research/tasks/list/route.ts",
      ],
      tests: [
        "apps/web/tests/material-extraction-cost-guardrail.contract.test.ts",
        "apps/web/tests/research-review-guardrails.route.test.ts",
      ],
      gap:
        "Material-, Research- und Asset-Freigaben sind jetzt unter einer Consumption-Truth-Sicht lesbar; echte Runtime-Kopplung zu Usage und Debit fehlt weiter.",
      nextSliceId: "V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03",
      guardrails: [
        "Keine Extraktion ohne Kostenfreigabe",
        "Kein Auto-Publish aus Material-Jobs",
      ],
    },
    {
      id: "export_distribution_gate",
      label: "Export / Social Draft / Output Gate",
      status: "partially_wired",
      currentReality:
        "Export- und Social-Drafts sind review-first vorhanden, aber nicht als geschlossenes V3-Kreditsystem mit dedizierter Verbrauchswahrheit.",
      adminHref: "/atlas/social-review",
      publicHref: "/pricing",
      repoEvidence: [
        "features/outputEngine/distributionExport.ts",
        "features/outputEngine/socialDistribution.ts",
        "features/outputEngine/socialDistributionQueueReadModel.ts",
      ],
      tests: [
        "apps/web/tests/output-engine-export.test.ts",
        "apps/web/tests/social-manual-export-fallback.contract.test.ts",
        "apps/web/tests/social-export-scheduling-ready.contract.test.ts",
        "apps/web/tests/social-scheduler-review-first.contract.test.ts",
      ],
      gap:
        "Es fehlt ein sichtbarer V3-Verbrauchs- und Limitpfad fuer Exporte, Social-Drafts und spaetere Assets jenseits der review-first Queue.",
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrails: [
        "Keine externe Connector-Pflicht",
        "Kein Auto-Publish aus Export- oder Social-Drafts",
      ],
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    sectionStatus: "operational_basic",
    summary: {
      packageCount: EDEBATTE_PACKAGES_DE.length,
      packageFamilies: packageFamilies.length,
      packagesWithSearchCredits: EDEBATTE_PACKAGES_DE.filter((entry) => entry.searchCredits > 0).length,
      packagesWithDeepResearchCredits: EDEBATTE_PACKAGES_DE.filter((entry) => entry.deepResearchCredits > 0).length,
      premiumResearchEligiblePackages: EDEBATTE_PACKAGES_DE.filter((entry) => entry.premiumResearchEligible).length,
      operatorProvisionedScopes: DEFAULT_CONTRACT_PROVISIONED_SCOPES.length,
      researchEntitlementKeys: RESEARCH_ENTITLEMENT_KEYS.length,
      costGates: costGates.length,
      wiredCostGates: costGates.filter((entry) => entry.status === "wired").length,
      partiallyWiredCostGates: costGates.filter((entry) => entry.status === "partially_wired").length,
    },
    billingTruth: {
      provider: paymentProvider.provider,
      status: paymentProvider.status,
      environment: paymentProvider.environment,
      selfServiceCheckout: paymentProvider.capabilities.selfServiceCheckout,
      manualInvoiceFallback: paymentProvider.capabilities.manualInvoiceFallback,
      webhookSettlement: paymentProvider.capabilities.webhookSettlement,
      blockedSources: ORGANIZATION_BILLING_SOURCES.filter(
        (source) => source === "fixture_demo" || source === "external_checkout_pending",
      ),
      operatorTruthSources: ORGANIZATION_BILLING_SOURCES.filter(
        (source) => source === "operator_verified_contract" || source === "manual_invoice",
      ),
    },
    packageFamilies,
    costGates,
    guardrails: [...GLOBAL_GUARDRAILS],
    nextGaps: [
      {
        label: "DeepSearch / per-run cost governance",
        nextSliceId: "V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03",
        reason:
          "Research- und Material-Freigaben sind jetzt sichtbar gebuendelt; offen bleibt die echte Runtime-Verknuepfung zu recorded_usage, Debit und Nachaudit.",
      },
      {
        label: "Dossier / Social / Output drafts",
        nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
        reason: "Export- und Social-Drafts sind review-first vorhanden, aber noch nicht als V3-Kredit- und Limitpfad vereinheitlicht.",
      },
      {
        label: "Roles / permissions / entitlements",
        nextSliceId: "V3-ROLES-PERMISSIONS-ENTITLEMENTS-01",
        reason: "Plan- und Kostenwirkung bleibt offen, solange Scope- und Freischaltungsgrenzen nicht V3-weit harmonisiert sind.",
      },
    ],
  };
}
