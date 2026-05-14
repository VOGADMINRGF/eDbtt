import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
  userIsAdminDashboard: vi.fn(() => true),
}));

import { GET, POST } from "@/app/api/admin/entitlements/route";
import { PATCH } from "@/app/api/admin/entitlements/[id]/route";

describe("/api/admin/entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-reinickendorf-1",
            name: "Bezirksamt Reinickendorf",
            type: "district_office",
            countryCode: "DE",
            primaryRegionId: "bezirk-berlin-reinickendorf",
            website: "https://reinickendorf.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
        ],
      }),
    );
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      sessionValid: true,
    });
  });

  it("blocks non-admin access", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const res = await GET(new NextRequest("http://localhost/api/admin/entitlements"));
    expect(res.status).toBe(403);
  });

  it("lets admins create and list entitlements without billing semantics", async () => {
    const createRes = await POST(
      new NextRequest("http://localhost/api/admin/entitlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-reinickendorf-1",
          regionId: "berlin-reinickendorf",
          planId: "kommune-aktivierung",
          status: "trial",
          scope: "region",
          source: "admin_grant",
        }),
      }),
    );

    expect(createRes.status).toBe(201);
    const createdBody = await createRes.json();
    expect(createdBody).toMatchObject({
      ok: true,
      entitlement: expect.objectContaining({
        organizationId: "org-reinickendorf-1",
        status: "trial",
        noAutoBilling: true,
        noAutoCharge: true,
      }),
    });

    const listRes = await GET(new NextRequest("http://localhost/api/admin/entitlements"));
    expect(listRes.status).toBe(200);
    await expect(listRes.json()).resolves.toMatchObject({
      ok: true,
      entitlements: [expect.objectContaining({ organizationId: "org-reinickendorf-1" })],
    });
  });

  it("lets admins suspend or revoke entitlements and rejects invalid organization or region ids", async () => {
    const invalidOrgRes = await POST(
      new NextRequest("http://localhost/api/admin/entitlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: "missing-org",
          regionId: "berlin-reinickendorf",
          planId: "kommune-aktivierung",
          status: "active",
          scope: "region",
          source: "admin_grant",
        }),
      }),
    );
    expect(invalidOrgRes.status).toBe(404);

    const invalidRegionRes = await POST(
      new NextRequest("http://localhost/api/admin/entitlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-reinickendorf-1",
          regionId: "missing-region",
          planId: "kommune-aktivierung",
          status: "active",
          scope: "region",
          source: "admin_grant",
        }),
      }),
    );
    expect(invalidRegionRes.status).toBe(404);

    const createRes = await POST(
      new NextRequest("http://localhost/api/admin/entitlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: "org-reinickendorf-1",
          regionId: "berlin-reinickendorf",
          planId: "kommune-aktivierung",
          status: "active",
          scope: "region",
          source: "pilot_grant",
        }),
      }),
    );
    const { entitlement } = await createRes.json();

    const patchRes = await PATCH(
      new NextRequest(`http://localhost/api/admin/entitlements/${entitlement.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "suspended", note: "Pilot pausiert" }),
      }),
      { params: Promise.resolve({ id: entitlement.id }) },
    );
    expect(patchRes.status).toBe(200);
    await expect(patchRes.json()).resolves.toMatchObject({
      ok: true,
      entitlement: expect.objectContaining({ status: "suspended" }),
    });

    const revokeRes = await PATCH(
      new NextRequest(`http://localhost/api/admin/entitlements/${entitlement.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "revoked", note: "Pilot beendet" }),
      }),
      { params: Promise.resolve({ id: entitlement.id }) },
    );
    expect(revokeRes.status).toBe(200);
    await expect(revokeRes.json()).resolves.toMatchObject({
      ok: true,
      entitlement: expect.objectContaining({ status: "revoked" }),
    });
  });
});
