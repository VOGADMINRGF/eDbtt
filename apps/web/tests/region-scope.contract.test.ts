import { describe, expect, it } from "vitest";
import {
  buildNonAdminModerationPermission,
  buildOrganizationScopeContext,
  buildRegionScopeContext,
  buildReviewQueueScopeContext,
  canMakeOwnContentVisible,
  canOperateOwnReviewItem,
  canPrepareOwnContentRelease,
  canEditOrganizationResource,
  canViewOrganizationResource,
  canViewRegionResource,
  canOperateReviewItem,
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

  it("derives non-admin moderation actions by verification level without granting public_official", () => {
    const ownScope = buildRegionScopeContext({
      userId: "staff-1",
      isAdmin: false,
      organizationIds: ["org-reinickendorf-1"],
      visibleRegionIds: ["bezirk-berlin-reinickendorf"],
      status: "verified_membership",
      canApproveOfficial: false,
    });
    const ownResource = {
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      reviewAuthority: "standard_review" as const,
    };

    expect(
      canOperateOwnReviewItem({
        scope: ownScope,
        verificationStatus: "organization_verified",
        resource: ownResource,
        action: "mark_in_review",
      }),
    ).toBe(true);
    expect(
      canOperateOwnReviewItem({
        scope: ownScope,
        verificationStatus: "organization_verified",
        resource: ownResource,
        action: "mark_ready",
      }),
    ).toBe(false);
    expect(
      canPrepareOwnContentRelease({
        scope: ownScope,
        verificationStatus: "unit_verified",
        resource: ownResource,
        allowedActions: ["create_dossier_draft"],
      }),
    ).toBe(true);
    expect(
      canMakeOwnContentVisible({
        scope: ownScope,
        verificationStatus: "publication_approved",
        resource: ownResource,
        allowedActions: ["approve_publication"],
      }),
    ).toBe(true);

    const permission = buildNonAdminModerationPermission({
      scope: ownScope,
      verificationStatus: "publication_approved",
      allowedActions: ["read_region_dashboard", "approve_publication", "create_dossier_draft"],
      resource: ownResource,
    });

    expect(permission.allowedActions).toContain("make_content_visible");
    expect(permission.allowedActions).not.toContain("public_official" as never);
    expect(permission.scopeCopy).toContain("deiner Organisation");
  });
});
