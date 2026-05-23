import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryRegionOrganizationRuntimeRepo,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import { GET, POST } from "@/app/api/account/organization-claims/route";

describe("/api/account/organization-claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "user-1" },
      email: "kontakt@example.org",
      sessionValid: true,
    });
  });

  it("creates pending_review claims without granting authority", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/account/organization-claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName: "Stadt Beispielstadt",
          organizationKind: "municipality",
          regionId: "kommune-beispielstadt",
          optionalLocation: "Rathaus Beispielstadt",
          roleLabel: "Sachbearbeitung",
          applicantName: "Mara Beispiel",
        }),
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verificationStatus: "pending_review",
      directoryVerificationStatus: "pending",
      provisioningRequest: expect.objectContaining({
        status: "submitted",
        latestDecision: "submit",
      }),
      noAutoAuthority: true,
    });
  });

  it("stores drafts without granting review or publication rights", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/account/organization-claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName: "Verein Bildungsdialog",
          organizationKind: "association",
          roleLabel: "Koordination",
          applicantName: "Mara Beispiel",
          submissionMode: "save_draft",
        }),
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verificationStatus: "unverified",
      directoryVerificationStatus: "evidence_required",
      provisioningRequest: expect.objectContaining({
        status: "draft",
        latestDecision: "save_draft",
      }),
      noAutoAuthority: true,
    });
  });

  it("accepts media partners as pending org-scoped claims without authority", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/account/organization-claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName: "Lokalredaktion Mitte",
          organizationKind: "media_partner",
          regionId: "kommune-beispielstadt",
          roleLabel: "Redaktion",
          applicantName: "Lea Beispiel",
        }),
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verificationStatus: "pending_review",
      directoryVerificationStatus: "pending",
      noAutoAuthority: true,
    });
  });

  it("lists only the current user's claims", async () => {
    await POST(
      new NextRequest("http://localhost/api/account/organization-claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationName: "Bezirksamt Reinickendorf",
          organizationType: "district_office",
        }),
      }),
    );

    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    setRegionOrganizationRuntimeRepoForTests(repo);
    await repo.createOrganizationClaim({
      userId: "user-2",
      organizationName: "Fremde Organisation",
      organizationType: "ngo",
    });
    await repo.createOrganizationClaim({
      userId: "user-1",
      organizationName: "Eigene Organisation",
      organizationType: "district_office",
    });

    const res = await GET(new NextRequest("http://localhost/api/account/organization-claims"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      claims: [
        expect.objectContaining({ userId: "user-1", organizationName: "Eigene Organisation" }),
      ],
    });
  });

  it("blocks unauthenticated access", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/account/organization-claims"));
    expect(res.status).toBe(401);
  });
});
