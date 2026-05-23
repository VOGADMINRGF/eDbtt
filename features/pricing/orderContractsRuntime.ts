import type { OrganizationContractOrderRecord } from "./domain/types";

export type PricingOrderContractsRuntimeRepo = {
  listPricingOrdersForOrganization(input: {
    organizationId?: string | null;
    organizationName?: string | null;
    limit?: number;
  }): Promise<OrganizationContractOrderRecord[]>;
};

let pricingOrderContractsRuntimeRepoForTests: PricingOrderContractsRuntimeRepo | null = null;

export async function listPricingOrdersForOrganizationRuntime(input: {
  organizationId?: string | null;
  organizationName?: string | null;
  limit?: number;
}): Promise<OrganizationContractOrderRecord[]> {
  if (pricingOrderContractsRuntimeRepoForTests) {
    return pricingOrderContractsRuntimeRepoForTests.listPricingOrdersForOrganization(input);
  }
  const repo = await import("./server/leadsRepo");
  return repo.listPricingOrdersForOrganization(input);
}

export function setPricingOrderContractsRuntimeRepoForTests(
  repo: PricingOrderContractsRuntimeRepo | null,
) {
  pricingOrderContractsRuntimeRepoForTests = repo;
}
