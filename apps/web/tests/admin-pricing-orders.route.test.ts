import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  listPricingOrders: vi.fn(),
  updatePricingOrderReview: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/pricing/server/leadsRepo", () => ({
  listPricingOrders: (...args: unknown[]) => mocks.listPricingOrders(...args),
  updatePricingOrderReview: (...args: unknown[]) => mocks.updatePricingOrderReview(...args),
}));

import { GET, PATCH } from "@/app/api/admin/pricing/orders/route";

describe("/api/admin/pricing/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });
    mocks.listPricingOrders.mockResolvedValue([]);
    mocks.updatePricingOrderReview.mockResolvedValue({
      id: "65a111111111111111111111",
      status: "approved",
      reviewedAt: new Date("2026-04-12T10:00:00.000Z").toISOString(),
    });
  });

  it("lists pricing orders for admin users", async () => {
    mocks.listPricingOrders.mockResolvedValue([{ id: "1", orderId: "EDE-20260412-AAAAAA", status: "submitted" }]);
    const req = new NextRequest("http://localhost/api/admin/pricing/orders?status=submitted&limit=50");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(mocks.listPricingOrders).toHaveBeenCalledWith({ status: "submitted", limit: 50 });
  });

  it("passes through auth gate responses", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = new NextRequest("http://localhost/api/admin/pricing/orders");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("updates status with optional note", async () => {
    const req = new NextRequest("http://localhost/api/admin/pricing/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "65a111111111111111111111",
        status: "approved",
        note: "Freigabe nach Prüfung",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      order: { id: "65a111111111111111111111", status: "approved" },
    });
    expect(mocks.updatePricingOrderReview).toHaveBeenCalledWith(
      "65a111111111111111111111",
      expect.objectContaining({
        status: "approved",
        actorUserId: "admin-1",
        note: "Freigabe nach Prüfung",
      }),
    );
  });

  it("accepts internal review/finance adjustment fields", async () => {
    const req = new NextRequest("http://localhost/api/admin/pricing/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "65a111111111111111111111",
        status: "adjusted",
        adjustedPriceLabel: "2.300 € / Monat (angepasst)",
        discountKind: "pilot",
        discountReason: "Pilotphase",
        discountAmount: 300,
        approvalReason: "Freigabe nach interner Prüfung",
        activationNotes: "Aktivierung nach Vertragsfreigabe",
        billingFinanceNote: "Billing informiert",
        contractReference: "CON-2026-04-13-01",
        invoiceReference: "INV-2026-04-13-01",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(mocks.updatePricingOrderReview).toHaveBeenCalledWith(
      "65a111111111111111111111",
      expect.objectContaining({
        status: "adjusted",
        actorUserId: "admin-1",
        adjustedPriceLabel: "2.300 € / Monat (angepasst)",
        discountKind: "pilot",
        discountReason: "Pilotphase",
        discountAmount: 300,
        approvalReason: "Freigabe nach interner Prüfung",
        activationNotes: "Aktivierung nach Vertragsfreigabe",
        billingFinanceNote: "Billing informiert",
        contractReference: "CON-2026-04-13-01",
        invoiceReference: "INV-2026-04-13-01",
      }),
    );
  });

  it("accepts explicit contract, billing and provisioning fields", async () => {
    const req = new NextRequest("http://localhost/api/admin/pricing/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "65a111111111111111111111",
        status: "active",
        organizationId: "org-reinickendorf-1",
        contractStatus: "active",
        billingStatus: "operator_verified_contract",
        billingSource: "operator_verified_contract",
        accessProvisioningDecision: "activate",
        note: "Betreiber-verifizierter Vertragsprozess freigeschaltet.",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(mocks.updatePricingOrderReview).toHaveBeenCalledWith(
      "65a111111111111111111111",
      expect.objectContaining({
        status: "active",
        actorUserId: "admin-1",
        organizationId: "org-reinickendorf-1",
        contractStatus: "active",
        billingStatus: "operator_verified_contract",
        billingSource: "operator_verified_contract",
        accessProvisioningDecision: "activate",
      }),
    );
  });

  it("accepts partner package, transparency and reporting fields", async () => {
    const req = new NextRequest("http://localhost/api/admin/pricing/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "65a111111111111111111111",
        status: "active",
        organizationId: "org-media-1",
        partnerProjectPackage: {
          id: "pkg-media-1",
          type: "media_dossier_series",
          status: "active",
          scopes: ["dossier_studio", "social_distribution"],
          createdAt: "2026-05-24T10:00:00.000Z",
        },
        partnerFundingDisclosure: {
          partnerName: "Lokalredaktion Mitte",
          role: "partner",
          label: "Medienpartner im Dossier-Kontext",
          transparencyNote:
            "Die Partnerschaft ermöglicht Distribution und Dossierarbeit, beeinflusst aber keine Quellengewichtung.",
          sourceReference: "MEDIA-CON-2026-05",
          shownToUsers: true,
          shownToAdmins: true,
        },
        partnerReportingState: "review_required",
        note: "Projektpaket mit Transparenzhinweis aktiviert.",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(mocks.updatePricingOrderReview).toHaveBeenCalledWith(
      "65a111111111111111111111",
      expect.objectContaining({
        status: "active",
        actorUserId: "admin-1",
        organizationId: "org-media-1",
        partnerProjectPackage: expect.objectContaining({
          id: "pkg-media-1",
          type: "media_dossier_series",
          status: "active",
          scopes: ["dossier_studio", "social_distribution"],
          noOperatorRights: true,
          noAutoOfficial: true,
          noAutoPublicationApproved: true,
        }),
        partnerFundingDisclosure: expect.objectContaining({
          partnerName: "Lokalredaktion Mitte",
          role: "partner",
          label: "Medienpartner im Dossier-Kontext",
          noSourceWeightInfluence: true,
          noVoteOutcomeInfluence: true,
          noFactcheckSealInfluence: true,
        }),
        partnerReportingState: "review_required",
      }),
    );
  });

  it("maps invalid transition to 409", async () => {
    mocks.updatePricingOrderReview.mockRejectedValue(new Error("invalid_status_transition"));
    const req = new NextRequest("http://localhost/api/admin/pricing/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "65a111111111111111111111",
        status: "submitted",
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_status_transition" });
  });
});
