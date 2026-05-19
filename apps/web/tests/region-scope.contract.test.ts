import { describe, expect, it } from "vitest";
import {
  buildOrganizationScopeContext,
  buildRegionScopeContext,
  buildReviewQueueScopeContext,
  canEditOrganizationResource,
  canOperateReviewItem,
  canViewOrganizationResource,
  canViewRegionResource,
} from "@features/region";

describe("region organization scope contract", () => {
  it("keeps pending organizations out of foreign organization resources", () => {
    const scope = buildOrganizationScopeContext({
      userId: "user-1",
      isAdmin: false,
      organizationIds: ["org-reinickendorf-1"],
      status: "pending_or_unverified",
    });

    expect(
      canViewOrganizationResource(scope, { organizationId: "org-spandau-1" }),
    ).toBe(false);
    expect(
      canEditOrganizationResource(scope, { organizationId: "org-reinickendorf-1" }),
    ).toBe(false);
  });

  it("allows verified memberships to see and edit only their own organization and region", () => {
    const scope = buildRegionScopeContext({
      userId: "staff-1",
      isAdmin: false,
      organizationIds: ["org-reinickendorf-1"],
      visibleRegionIds: ["bezirk-berlin-reinickendorf"],
      status: "verified_membership",
      canApproveOfficial: false,
    });

    expect(
      canViewOrganizationResource(scope, { organizationId: "org-reinickendorf-1" }),
    ).toBe(true);
    expect(
      canEditOrganizationResource(scope, { organizationId: "org-reinickendorf-1" }),
    ).toBe(true);
    expect(
      canViewRegionResource(scope, {
        regionId: "bezirk-berlin-reinickendorf",
        organizationId: "org-reinickendorf-1",
      }),
    ).toBe(true);
    expect(
      canViewRegionResource(scope, {
        regionId: "bezirk-berlin-spandau",
        organizationId: "org-spandau-1",
      }),
    ).toBe(false);
  });

  it("keeps publication approval separate from standard review rights", () => {
    const standardScope = buildReviewQueueScopeContext({
      userId: "staff-1",
      isAdmin: false,
      organizationIds: ["org-reinickendorf-1"],
      visibleRegionIds: ["bezirk-berlin-reinickendorf"],
      status: "verified_membership",
      canApproveOfficial: false,
    });
    const approvalScope = buildReviewQueueScopeContext({
      ...standardScope,
      canApproveOfficial: true,
    });

    expect(
      canOperateReviewItem(standardScope, {
        regionId: "bezirk-berlin-reinickendorf",
        organizationId: "org-reinickendorf-1",
        reviewAuthority: "standard_review",
      }),
    ).toBe(true);
    expect(
      canOperateReviewItem(standardScope, {
        regionId: "bezirk-berlin-reinickendorf",
        organizationId: "org-reinickendorf-1",
        reviewAuthority: "publication_approved_or_admin",
      }),
    ).toBe(false);
    expect(
      canOperateReviewItem(approvalScope, {
        regionId: "bezirk-berlin-reinickendorf",
        organizationId: "org-reinickendorf-1",
        reviewAuthority: "publication_approved_or_admin",
      }),
    ).toBe(true);
  });
});
