import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  listPricingOrders,
  updatePricingOrderReview,
} from "@features/pricing/server/leadsRepo";
import type {
  OrganizationAccessProvisioningDecision,
  OrganizationBillingSource,
  OrganizationBillingStatus,
  OrganizationContractStatus,
  PartnerFundingDisclosure,
  PartnerFundingDisclosureRole,
  PartnerPackageScope,
  PartnerPackageStatus,
  PartnerPackageType,
  PartnerProjectPackage,
  PartnerReportingState,
  PricingOrderStatus,
} from "@features/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALUES: PricingOrderStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "adjusted",
  "rejected",
  "active",
  "paused",
  "cancelled",
];

const querySchema = z.object({
  status: z.enum(STATUS_VALUES as [PricingOrderStatus, ...PricingOrderStatus[]]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUS_VALUES as [PricingOrderStatus, ...PricingOrderStatus[]]),
  note: z.string().max(1200).optional(),
  adjustedPriceLabel: z.string().max(120).optional(),
  discountKind: z.enum(["pilot", "yearly", "partner", "reference", "manual_special"]).optional().nullable(),
  discountReason: z.string().max(240).optional().nullable(),
  discountAmount: z.coerce.number().min(0).max(250000).optional().nullable(),
  approvalReason: z.string().max(240).optional().nullable(),
  rejectionReason: z.string().max(240).optional().nullable(),
  activationNotes: z.string().max(500).optional().nullable(),
  billingFinanceNote: z.string().max(500).optional().nullable(),
  contractReference: z.string().max(120).optional().nullable(),
  invoiceReference: z.string().max(120).optional().nullable(),
  organizationId: z.string().max(120).optional().nullable(),
  contractStatus: z
    .enum(["none", "draft", "offered", "accepted", "active", "limited", "suspended", "cancelled", "expired"] as [
      OrganizationContractStatus,
      ...OrganizationContractStatus[],
    ])
    .optional()
    .nullable(),
  billingStatus: z
    .enum(
      [
        "none",
        "billing_pending",
        "operator_verified_contract",
        "active",
        "overdue",
        "grace_period",
        "suspended",
        "cancelled",
        "expired",
      ] as [OrganizationBillingStatus, ...OrganizationBillingStatus[]],
    )
    .optional()
    .nullable(),
  billingSource: z
    .enum(
      [
        "operator_verified_contract",
        "manual_invoice",
        "external_checkout_pending",
        "external_checkout_integrated",
        "fixture_demo",
      ] as [OrganizationBillingSource, ...OrganizationBillingSource[]],
    )
    .optional()
    .nullable(),
  accessProvisioningDecision: z
    .enum(
      ["none", "offer", "accept", "activate", "limit", "grace", "suspend", "cancel", "expire", "reactivate"] as [
        OrganizationAccessProvisioningDecision,
        ...OrganizationAccessProvisioningDecision[],
      ],
    )
    .optional()
    .nullable(),
  partnerProjectPackage: z
    .object({
      id: z.string().min(1),
      type: z.enum(
        [
          "municipality_pilot",
          "association_workspace",
          "media_dossier_series",
          "newsroom_qr_dossier",
          "foundation_program",
          "participation_office",
          "agency_workspace",
          "public_dialog_project",
        ] as [PartnerPackageType, ...PartnerPackageType[]],
      ),
      status: z.enum(
        [
          "draft",
          "offered",
          "active",
          "limited",
          "reporting_required",
          "paused",
          "completed",
          "cancelled",
          "archived",
        ] as [PartnerPackageStatus, ...PartnerPackageStatus[]],
      ),
      scopes: z.array(
        z.enum(
          [
            "dossier_studio",
            "social_distribution",
            "source_connections",
            "runden_qr",
            "reporting_export",
          ] as [PartnerPackageScope, ...PartnerPackageScope[]],
        ),
      ),
      createdAt: z.string().min(1),
    })
    .optional()
    .nullable(),
  partnerFundingDisclosure: z
    .object({
      partnerName: z.string().min(1).max(160),
      role: z.enum(["auftraggeber", "partner", "foerderer", "traeger"] as [
        PartnerFundingDisclosureRole,
        ...PartnerFundingDisclosureRole[],
      ]),
      label: z.string().min(1).max(160),
      transparencyNote: z.string().max(600).optional().nullable(),
      sourceReference: z.string().max(240).optional().nullable(),
      shownToUsers: z.boolean().optional(),
      shownToAdmins: z.boolean().optional(),
    })
    .optional()
    .nullable(),
  partnerReportingState: z
    .enum(["draft", "review_required", "approved", "archived"] as [
      PartnerReportingState,
      ...PartnerReportingState[],
    ])
    .optional()
    .nullable(),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get("status") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  }

  const items = await listPricingOrders(parsed.data);
  return NextResponse.json({ ok: true, items });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireAdminOrResponse(req);
  if (actor instanceof Response) return actor;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const partnerProjectPackage: PartnerProjectPackage | null | undefined = parsed.data.partnerProjectPackage
      ? {
          ...parsed.data.partnerProjectPackage,
          contractLinked: true,
          billingLinked: true,
          reviewOnlyOutputs: true,
          noOperatorRights: true,
          noAutoOfficial: true,
          noAutoPublicationApproved: true,
          organizationId: parsed.data.organizationId ?? null,
          organizationName: null,
          updatedAt: parsed.data.partnerProjectPackage.createdAt,
        }
      : parsed.data.partnerProjectPackage === null
        ? null
        : undefined;
    const partnerFundingDisclosure: PartnerFundingDisclosure | null | undefined =
      parsed.data.partnerFundingDisclosure
        ? {
            ...parsed.data.partnerFundingDisclosure,
            transparencyNote: parsed.data.partnerFundingDisclosure.transparencyNote ?? null,
            sourceReference: parsed.data.partnerFundingDisclosure.sourceReference ?? null,
            shownToUsers: parsed.data.partnerFundingDisclosure.shownToUsers !== false,
            shownToAdmins: parsed.data.partnerFundingDisclosure.shownToAdmins !== false,
            noSourceWeightInfluence: true,
            noVoteOutcomeInfluence: true,
            noFactcheckSealInfluence: true,
            noAutoOfficial: true,
            noAutoPublicationApproved: true,
          }
        : parsed.data.partnerFundingDisclosure === null
          ? null
          : undefined;
    const updated = await updatePricingOrderReview(parsed.data.id, {
      status: parsed.data.status,
      actorUserId: String(actor._id),
      note: parsed.data.note,
      adjustedPriceLabel: parsed.data.adjustedPriceLabel,
      discountKind: parsed.data.discountKind ?? null,
      discountReason: parsed.data.discountReason ?? null,
      discountAmount: parsed.data.discountAmount ?? null,
      approvalReason: parsed.data.approvalReason ?? null,
      rejectionReason: parsed.data.rejectionReason ?? null,
      activationNotes: parsed.data.activationNotes ?? null,
      billingFinanceNote: parsed.data.billingFinanceNote ?? null,
      contractReference: parsed.data.contractReference ?? null,
      invoiceReference: parsed.data.invoiceReference ?? null,
      organizationId: parsed.data.organizationId ?? null,
      contractStatus: parsed.data.contractStatus ?? null,
      billingStatus: parsed.data.billingStatus ?? null,
      billingSource: parsed.data.billingSource ?? null,
      accessProvisioningDecision: parsed.data.accessProvisioningDecision ?? null,
      partnerProjectPackage,
      partnerFundingDisclosure,
      partnerReportingState: parsed.data.partnerReportingState ?? undefined,
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "unknown_error";
    if (message === "invalid_order_id") {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (message === "order_not_found") {
      return NextResponse.json({ ok: false, error: message }, { status: 404 });
    }
    if (message === "invalid_status_transition") {
      return NextResponse.json({ ok: false, error: message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}
