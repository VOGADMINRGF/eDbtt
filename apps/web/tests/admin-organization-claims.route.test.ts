import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryRegionOrganizationRuntimeRepo,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
  userIsAdminDashboard: vi.fn(() => true),
}));

import { GET } from "@/app/api/admin/organization-claims/route";
import { POST } from "@/app/api/admin/organization-claims/[id]/review/route";

describe("/api/admin/organization-claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    mocks.requireAdminOrResponse.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
    });
  });

  it("lets admins see the review queue and blocks non-admins", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    setRegionOrganizationRuntimeRepoForTests(repo);
    await repo.createOrganizationClaim({
      userId: "user-1",
      organizationName: "Bezirksamt Reinickendorf",
      organizationType: "district_office",
    });

    const okRes = await GET(new NextRequest("http://localhost/api/admin/organization-claims"));
    expect(okRes.status).toBe(200);
    await expect(okRes.json()).resolves.toMatchObject({
      ok: true,
      claims: [expect.objectContaining({ organizationName: "Bezirksamt Reinickendorf" })],
    });

    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const blockedRes = await GET(new NextRequest("http://localhost/api/admin/organization-claims"));
    expect(blockedRes.status).toBe(403);
  });

  it("reviews claims and creates memberships plus audit events", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    setRegionOrganizationRuntimeRepoForTests(repo);
    const claim = await repo.createOrganizationClaim({
      userId: "user-1",
      organizationName: "Bezirksamt Reinickendorf",
      organizationType: "district_office",
      regionId: "berlin-reinickendorf",
      unitName: "Bauen und Wohnen",
      roleLabel: "Sachbearbeitung",
    });

    const organizationRes = await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${claim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve_organization" }),
      }),
      { params: Promise.resolve({ id: claim.id }) },
    );
    expect(organizationRes.status).toBe(200);
    await expect(organizationRes.json()).resolves.toMatchObject({
      ok: true,
      claim: expect.objectContaining({
        verificationStatus: "organization_verified",
        provisioningRequest: expect.objectContaining({ status: "approved" }),
      }),
      membership: expect.objectContaining({ verificationStatus: "organization_verified" }),
      auditEvents: expect.arrayContaining([
        expect.objectContaining({ eventType: "claim_reviewed" }),
      ]),
    });

    const unitRes = await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${claim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve_unit" }),
      }),
      { params: Promise.resolve({ id: claim.id }) },
    );
    expect(unitRes.status).toBe(200);
    await expect(unitRes.json()).resolves.toMatchObject({
      ok: true,
      claim: expect.objectContaining({ verificationStatus: "unit_verified" }),
      membership: expect.objectContaining({ verificationStatus: "unit_verified" }),
    });

    const publicationRes = await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${claim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve_publication" }),
      }),
      { params: Promise.resolve({ id: claim.id }) },
    );
    expect(publicationRes.status).toBe(200);
    await expect(publicationRes.json()).resolves.toMatchObject({
      ok: true,
      membership: expect.objectContaining({ verificationStatus: "publication_approved" }),
    });
  });

  it("supports reject and revoke review outcomes", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    setRegionOrganizationRuntimeRepoForTests(repo);
    const claim = await repo.createOrganizationClaim({
      userId: "user-1",
      organizationName: "Nachbarschaftsverein",
      organizationType: "association",
      regionId: "berlin-reinickendorf",
    });

    const rejectRes = await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${claim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "reject", note: "Bitte Nachweis ergänzen" }),
      }),
      { params: Promise.resolve({ id: claim.id }) },
    );
    expect(rejectRes.status).toBe(200);
    await expect(rejectRes.json()).resolves.toMatchObject({
      ok: true,
      claim: expect.objectContaining({
        verificationStatus: "rejected",
        provisioningRequest: expect.objectContaining({ status: "rejected" }),
      }),
      membership: null,
    });

    const approvedClaim = await repo.createOrganizationClaim({
      userId: "user-2",
      organizationName: "Bezirksamt Reinickendorf",
      organizationType: "district_office",
      regionId: "berlin-reinickendorf",
      unitName: "Bauen und Wohnen",
      roleLabel: "Sachbearbeitung",
    });
    await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${approvedClaim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "approve_unit" }),
      }),
      { params: Promise.resolve({ id: approvedClaim.id }) },
    );

    const revokeRes = await POST(
      new NextRequest(`http://localhost/api/admin/organization-claims/${approvedClaim.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "revoke", note: "Zugriff entzogen" }),
      }),
      { params: Promise.resolve({ id: approvedClaim.id }) },
    );
    expect(revokeRes.status).toBe(200);
    await expect(revokeRes.json()).resolves.toMatchObject({
      ok: true,
      claim: expect.objectContaining({
        verificationStatus: "revoked",
        provisioningRequest: expect.objectContaining({ status: "suspended" }),
      }),
      membership: expect.objectContaining({ verificationStatus: "revoked" }),
    });
  });
});
