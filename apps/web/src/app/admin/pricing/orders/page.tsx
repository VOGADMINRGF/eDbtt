"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getInstitutionalSharedAddOns,
  organizationBillingStatusLabel,
  organizationBillingSourceLabel,
  organizationContractStatusLabel,
  partnerFundingDisclosureRoleLabel,
  partnerPackageScopeLabel,
  partnerPackageStatusLabel,
  partnerPackageTypeLabel,
  partnerReportingStateLabel,
  type OrganizationAccessProvisioningDecision,
  type OrganizationBillingSource,
  type OrganizationBillingStatus,
  type OrganizationContractStatus,
  type PartnerFundingDisclosureRole,
  type PartnerPackageScope,
  type PartnerPackageStatus,
  type PartnerPackageType,
  type PartnerReportingState,
  type PricingOrderStatus,
} from "@features/pricing";

type DiscountKind = "pilot" | "yearly" | "partner" | "reference" | "manual_special";

type OrderRow = {
  id: string;
  orderId: string;
  packageId: string;
  planLabel: string;
  segment: string | null;
  status: PricingOrderStatus;
  email: string | null;
  customerName: string | null;
  organizationName: string | null;
  municipalityName: string | null;
  publicPriceSummary: {
    packagePriceLabel?: string | null;
    addOnSelections?: string[];
    notes?: string[];
  } | null;
  selectedAddOns: string[];
  requiresReview: boolean;
  internal: {
    notes: string[];
    reviewedBy: string | null;
    reviewedAt: string | null;
    adjustedPriceLabel: string | null;
    discountKind: DiscountKind | null;
    discountReason: string | null;
    discountAmount: number | null;
    approvalReason: string | null;
    rejectionReason: string | null;
    activationNotes: string | null;
    billingFinanceNote: string | null;
    contractReference: string | null;
    invoiceReference: string | null;
    organizationId: string | null;
    contractStatus: OrganizationContractStatus | null;
    billingStatus: OrganizationBillingStatus | null;
    billingSource: OrganizationBillingSource | null;
    accessProvisioningDecision: OrganizationAccessProvisioningDecision | null;
    planAssignment: {
      planId: string;
      planLabel: string;
      scopes: string[];
    } | null;
    partnerProjectPackage: {
      id: string;
      type: PartnerPackageType;
      status: PartnerPackageStatus;
      scopes: PartnerPackageScope[];
      createdAt: string;
      updatedAt: string;
    } | null;
    partnerFundingDisclosure: {
      partnerName: string;
      role: PartnerFundingDisclosureRole;
      label: string;
      transparencyNote: string | null;
      sourceReference: string | null;
      shownToUsers: boolean;
      shownToAdmins: boolean;
    } | null;
    partnerReportingState: PartnerReportingState | null;
    contractAuditEvents: Array<{
      id: string;
      eventType: string;
      createdAt: string;
      createdBy: string;
      note?: string | null;
    }>;
    partnerPackageAuditEvents: Array<{
      id: string;
      eventType: string;
      createdAt: string;
      createdBy: string;
      note?: string | null;
    }>;
  };
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ReviewDraft = {
  note: string;
  adjustedPriceLabel: string;
  discountKind: DiscountKind | "";
  discountReason: string;
  discountAmount: string;
  approvalReason: string;
  rejectionReason: string;
  activationNotes: string;
  billingFinanceNote: string;
  contractReference: string;
  invoiceReference: string;
  organizationId: string;
  contractStatus: OrganizationContractStatus | "";
  billingStatus: OrganizationBillingStatus | "";
  billingSource: OrganizationBillingSource | "";
  accessProvisioningDecision: OrganizationAccessProvisioningDecision | "";
  partnerPackageId: string;
  partnerPackageType: PartnerPackageType | "";
  partnerPackageStatus: PartnerPackageStatus | "";
  partnerPackageScopes: PartnerPackageScope[];
  partnerPackageCreatedAt: string;
  partnerDisclosurePartnerName: string;
  partnerDisclosureRole: PartnerFundingDisclosureRole | "";
  partnerDisclosureLabel: string;
  partnerDisclosureTransparencyNote: string;
  partnerDisclosureSourceReference: string;
  partnerDisclosureShownToUsers: boolean;
  partnerDisclosureShownToAdmins: boolean;
  partnerReportingState: PartnerReportingState | "";
};

const STATUS_OPTIONS: PricingOrderStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "adjusted",
  "rejected",
  "active",
  "paused",
  "cancelled",
];

const DISCOUNT_KIND_OPTIONS: Array<{ value: DiscountKind; label: string }> = [
  { value: "pilot", label: "Pilot" },
  { value: "yearly", label: "Jahresrabatt" },
  { value: "partner", label: "Partner" },
  { value: "reference", label: "Referenz" },
  { value: "manual_special", label: "Sonderfreigabe" },
];

const CONTRACT_STATUS_OPTIONS: OrganizationContractStatus[] = [
  "none",
  "draft",
  "offered",
  "accepted",
  "active",
  "limited",
  "suspended",
  "cancelled",
  "expired",
];

const BILLING_STATUS_OPTIONS: OrganizationBillingStatus[] = [
  "none",
  "billing_pending",
  "operator_verified_contract",
  "active",
  "overdue",
  "grace_period",
  "suspended",
  "cancelled",
  "expired",
];

const BILLING_SOURCE_OPTIONS: OrganizationBillingSource[] = [
  "operator_verified_contract",
  "manual_invoice",
  "external_checkout_pending",
  "external_checkout_integrated",
  "fixture_demo",
];

const PROVISIONING_DECISION_OPTIONS: OrganizationAccessProvisioningDecision[] = [
  "none",
  "offer",
  "accept",
  "activate",
  "limit",
  "grace",
  "suspend",
  "cancel",
  "expire",
  "reactivate",
];

const PARTNER_PACKAGE_TYPE_OPTIONS: PartnerPackageType[] = [
  "municipality_pilot",
  "association_workspace",
  "media_dossier_series",
  "newsroom_qr_dossier",
  "foundation_program",
  "participation_office",
  "agency_workspace",
  "public_dialog_project",
];

const PARTNER_PACKAGE_STATUS_OPTIONS: PartnerPackageStatus[] = [
  "draft",
  "offered",
  "active",
  "limited",
  "reporting_required",
  "paused",
  "completed",
  "cancelled",
  "archived",
];

const PARTNER_PACKAGE_SCOPE_OPTIONS: PartnerPackageScope[] = [
  "dossier_studio",
  "social_distribution",
  "source_connections",
  "runden_qr",
  "reporting_export",
];

const PARTNER_REPORTING_STATE_OPTIONS: PartnerReportingState[] = [
  "draft",
  "review_required",
  "approved",
  "archived",
];

const PARTNER_DISCLOSURE_ROLE_OPTIONS: PartnerFundingDisclosureRole[] = [
  "auftraggeber",
  "partner",
  "foerderer",
  "traeger",
];

function toDraft(row: OrderRow): ReviewDraft {
  return {
    note: "",
    adjustedPriceLabel: row.internal.adjustedPriceLabel || "",
    discountKind: row.internal.discountKind || "",
    discountReason: row.internal.discountReason || "",
    discountAmount: typeof row.internal.discountAmount === "number" ? String(row.internal.discountAmount) : "",
    approvalReason: row.internal.approvalReason || "",
    rejectionReason: row.internal.rejectionReason || "",
    activationNotes: row.internal.activationNotes || "",
    billingFinanceNote: row.internal.billingFinanceNote || "",
    contractReference: row.internal.contractReference || "",
    invoiceReference: row.internal.invoiceReference || "",
    organizationId: row.internal.organizationId || "",
    contractStatus: row.internal.contractStatus || "",
    billingStatus: row.internal.billingStatus || "",
    billingSource: row.internal.billingSource || "",
    accessProvisioningDecision: row.internal.accessProvisioningDecision || "",
    partnerPackageId: row.internal.partnerProjectPackage?.id || "",
    partnerPackageType: row.internal.partnerProjectPackage?.type || "",
    partnerPackageStatus: row.internal.partnerProjectPackage?.status || "",
    partnerPackageScopes: row.internal.partnerProjectPackage?.scopes || [],
    partnerPackageCreatedAt: row.internal.partnerProjectPackage?.createdAt || new Date().toISOString(),
    partnerDisclosurePartnerName: row.internal.partnerFundingDisclosure?.partnerName || "",
    partnerDisclosureRole: row.internal.partnerFundingDisclosure?.role || "",
    partnerDisclosureLabel: row.internal.partnerFundingDisclosure?.label || "",
    partnerDisclosureTransparencyNote: row.internal.partnerFundingDisclosure?.transparencyNote || "",
    partnerDisclosureSourceReference: row.internal.partnerFundingDisclosure?.sourceReference || "",
    partnerDisclosureShownToUsers: row.internal.partnerFundingDisclosure?.shownToUsers ?? true,
    partnerDisclosureShownToAdmins: row.internal.partnerFundingDisclosure?.shownToAdmins ?? true,
    partnerReportingState: row.internal.partnerReportingState || "",
  };
}

export default function AdminPricingOrdersPage() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | PricingOrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Record<string, ReviewDraft>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filterStatus !== "all") query.set("status", filterStatus);
      query.set("limit", "250");
      const res = await fetch(`/api/admin/pricing/orders?${query.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setItems(Array.isArray(body.items) ? body.items : []);
    } catch (err: any) {
      setError(err?.message ?? "Bestellungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setReviewDraft((prev) => {
      const next = { ...prev };
      items.forEach((row) => {
        if (!next[row.id]) {
          next[row.id] = toDraft(row);
        }
      });
      Object.keys(next).forEach((id) => {
        if (!items.some((row) => row.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [items]);

  const grouped = useMemo(() => {
    const map = new Map<PricingOrderStatus, number>();
    STATUS_OPTIONS.forEach((status) => map.set(status, 0));
    items.forEach((row) => map.set(row.status, (map.get(row.status) ?? 0) + 1));
    return map;
  }, [items]);

  const addOnLabelMap = useMemo(
    () => new Map<string, string>(getInstitutionalSharedAddOns("de").map((entry) => [entry.id, entry.title])),
    [],
  );

  function updateDraft(rowId: string, patch: Partial<ReviewDraft>) {
    setReviewDraft((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {
          note: "",
          adjustedPriceLabel: "",
          discountKind: "",
          discountReason: "",
          discountAmount: "",
          approvalReason: "",
          rejectionReason: "",
          activationNotes: "",
          billingFinanceNote: "",
          contractReference: "",
          invoiceReference: "",
          organizationId: "",
          contractStatus: "",
          billingStatus: "",
          billingSource: "",
          accessProvisioningDecision: "",
          partnerPackageId: "",
          partnerPackageType: "",
          partnerPackageStatus: "",
          partnerPackageScopes: [],
          partnerPackageCreatedAt: new Date().toISOString(),
          partnerDisclosurePartnerName: "",
          partnerDisclosureRole: "",
          partnerDisclosureLabel: "",
          partnerDisclosureTransparencyNote: "",
          partnerDisclosureSourceReference: "",
          partnerDisclosureShownToUsers: true,
          partnerDisclosureShownToAdmins: true,
          partnerReportingState: "",
        }),
        ...patch,
      },
    }));
  }

  async function patchStatus(row: OrderRow, nextStatus: PricingOrderStatus) {
    setSavingId(row.id);
    setError(null);
    try {
      const draft = reviewDraft[row.id] || toDraft(row);
      const discountAmountRaw = draft.discountAmount.trim();
      const discountAmountValue =
        discountAmountRaw.length === 0 ? null : Number.isFinite(Number(discountAmountRaw)) ? Number(discountAmountRaw) : NaN;

      if (Number.isNaN(discountAmountValue)) {
        throw new Error("Rabattbetrag muss eine gültige Zahl sein.");
      }

      const res = await fetch("/api/admin/pricing/orders", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          status: nextStatus,
          note: draft.note.trim() || undefined,
          adjustedPriceLabel: draft.adjustedPriceLabel.trim() || undefined,
          discountKind: draft.discountKind || null,
          discountReason: draft.discountReason.trim() || null,
          discountAmount: discountAmountValue,
          approvalReason: draft.approvalReason.trim() || null,
          rejectionReason: draft.rejectionReason.trim() || null,
          activationNotes: draft.activationNotes.trim() || null,
          billingFinanceNote: draft.billingFinanceNote.trim() || null,
          contractReference: draft.contractReference.trim() || null,
          invoiceReference: draft.invoiceReference.trim() || null,
          organizationId: draft.organizationId.trim() || null,
          contractStatus: draft.contractStatus || null,
          billingStatus: draft.billingStatus || null,
          billingSource: draft.billingSource || null,
          accessProvisioningDecision: draft.accessProvisioningDecision || null,
          partnerProjectPackage:
            draft.partnerPackageId.trim() &&
            draft.partnerPackageType &&
            draft.partnerPackageStatus
              ? {
                  id: draft.partnerPackageId.trim(),
                  type: draft.partnerPackageType,
                  status: draft.partnerPackageStatus,
                  scopes: draft.partnerPackageScopes,
                  createdAt: draft.partnerPackageCreatedAt,
                }
              : null,
          partnerFundingDisclosure:
            draft.partnerDisclosurePartnerName.trim() &&
            draft.partnerDisclosureRole &&
            draft.partnerDisclosureLabel.trim()
              ? {
                  partnerName: draft.partnerDisclosurePartnerName.trim(),
                  role: draft.partnerDisclosureRole,
                  label: draft.partnerDisclosureLabel.trim(),
                  transparencyNote: draft.partnerDisclosureTransparencyNote.trim() || null,
                  sourceReference: draft.partnerDisclosureSourceReference.trim() || null,
                  shownToUsers: draft.partnerDisclosureShownToUsers,
                  shownToAdmins: draft.partnerDisclosureShownToAdmins,
                }
              : null,
          partnerReportingState: draft.partnerReportingState || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Status konnte nicht aktualisiert werden");
      }

      updateDraft(row.id, { note: "" });
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Status konnte nicht aktualisiert werden");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Pricing Orders</p>
        <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Bestellungen & Freigaben</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Direkte Bestellungen aus Pricing/Vormerken werden hier geprüft, freigegeben, angepasst oder abgelehnt.
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | PricingOrderStatus)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          >
            <option value="all">Alle Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {STATUS_OPTIONS.map((status) => (
            <span
              key={status}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))]"
            >
              {status}: {grouped.get(status) ?? 0}
            </span>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
          Lade Bestellungen …
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((row) => {
            const draft = reviewDraft[row.id] || toDraft(row);
            return (
              <article key={row.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{row.orderId}</p>
                    <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{row.planLabel}</h2>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                      Segment: {row.segment ?? "unbekannt"} · Paket: {row.packageId}
                    </p>
                    <p className="text-sm text-[rgb(var(--muted))]">
                      Kontakt: {row.customerName || "ohne Namen"}
                      {row.email ? ` (${row.email})` : ""}
                    </p>
                    {row.organizationName || row.municipalityName ? (
                      <p className="text-sm text-[rgb(var(--muted))]">Kontext: {row.organizationName || row.municipalityName}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      {row.status}
                    </span>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {row.requiresReview ? "intern reviewpflichtig" : "direkt aktivierbarer Standardpfad"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Preis: {row.publicPriceSummary?.packagePriceLabel || "n/a"}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Add-ons:{" "}
                    {row.selectedAddOns.length
                      ? row.selectedAddOns.map((entry) => addOnLabelMap.get(entry) || entry).join(", ")
                      : "keine"}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Vertrag: {organizationContractStatusLabel(row.internal.contractStatus || "none")}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Billing: {organizationBillingStatusLabel(row.internal.billingStatus || "none")}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 sm:col-span-2">
                    Wirkung: {row.internal.accessProvisioningDecision || "none"} · Quelle:{" "}
                    {row.internal.billingSource
                      ? organizationBillingSourceLabel(row.internal.billingSource)
                      : "Noch keine Quelle"}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Projektpaket:{" "}
                    {row.internal.partnerProjectPackage
                      ? `${partnerPackageTypeLabel(row.internal.partnerProjectPackage.type)} · ${partnerPackageStatusLabel(row.internal.partnerProjectPackage.status)}`
                      : "kein aktives Paket"}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    Reporting:{" "}
                    {row.internal.partnerReportingState
                      ? partnerReportingStateLabel(row.internal.partnerReportingState)
                      : "kein Reportingstatus"}
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 sm:col-span-2">
                    Transparenz:{" "}
                    {row.internal.partnerFundingDisclosure
                      ? `${partnerFundingDisclosureRoleLabel(row.internal.partnerFundingDisclosure.role)} · ${row.internal.partnerFundingDisclosure.label}`
                      : "kein Transparenzhinweis hinterlegt"}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
                  <input
                    value={draft.note}
                    onChange={(event) => updateDraft(row.id, { note: event.target.value })}
                    placeholder="Interne Notiz (optional)"
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={savingId === row.id}
                      onClick={() => patchStatus(row, row.status)}
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-50"
                    >
                      Review-Felder speichern
                    </button>
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === row.id || status === row.status}
                        onClick={() => patchStatus(row, status)}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-50"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Review, Vertrag & Finance</summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Organisation-ID
                      <input
                        value={draft.organizationId}
                        onChange={(event) => updateDraft(row.id, { organizationId: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="org-..."
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Vertragsstatus
                      <select
                        value={draft.contractStatus}
                        onChange={(event) => updateDraft(row.id, { contractStatus: event.target.value as ReviewDraft["contractStatus"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">automatisch ableiten</option>
                        {CONTRACT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {organizationContractStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Billing-Status
                      <select
                        value={draft.billingStatus}
                        onChange={(event) => updateDraft(row.id, { billingStatus: event.target.value as ReviewDraft["billingStatus"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">automatisch ableiten</option>
                        {BILLING_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {organizationBillingStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Billing-Quelle
                      <select
                        value={draft.billingSource}
                        onChange={(event) => updateDraft(row.id, { billingSource: event.target.value as ReviewDraft["billingSource"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">automatisch ableiten</option>
                        {BILLING_SOURCE_OPTIONS.map((source) => (
                          <option key={source} value={source}>
                            {organizationBillingSourceLabel(source)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Provisioning-Entscheidung
                      <select
                        value={draft.accessProvisioningDecision}
                        onChange={(event) =>
                          updateDraft(row.id, {
                            accessProvisioningDecision: event.target.value as ReviewDraft["accessProvisioningDecision"],
                          })
                        }
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">automatisch ableiten</option>
                        {PROVISIONING_DECISION_OPTIONS.map((decision) => (
                          <option key={decision} value={decision}>
                            {decision}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Projektpaket-ID
                      <input
                        value={draft.partnerPackageId}
                        onChange={(event) => updateDraft(row.id, { partnerPackageId: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="pkg-..."
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Pakettyp
                      <select
                        value={draft.partnerPackageType}
                        onChange={(event) => updateDraft(row.id, { partnerPackageType: event.target.value as ReviewDraft["partnerPackageType"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">kein Pakettyp</option>
                        {PARTNER_PACKAGE_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {partnerPackageTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Paketstatus
                      <select
                        value={draft.partnerPackageStatus}
                        onChange={(event) => updateDraft(row.id, { partnerPackageStatus: event.target.value as ReviewDraft["partnerPackageStatus"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">kein Paketstatus</option>
                        {PARTNER_PACKAGE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {partnerPackageStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Reportingstatus
                      <select
                        value={draft.partnerReportingState}
                        onChange={(event) => updateDraft(row.id, { partnerReportingState: event.target.value as ReviewDraft["partnerReportingState"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">kein Reportingstatus</option>
                        {PARTNER_REPORTING_STATE_OPTIONS.map((state) => (
                          <option key={state} value={state}>
                            {partnerReportingStateLabel(state)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Angepasster Preis (Label)
                      <input
                        value={draft.adjustedPriceLabel}
                        onChange={(event) => updateDraft(row.id, { adjustedPriceLabel: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="z. B. 2.300 € / Monat (angepasst)"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Rabatttyp
                      <select
                        value={draft.discountKind}
                        onChange={(event) => updateDraft(row.id, { discountKind: event.target.value as ReviewDraft["discountKind"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">kein Rabatt</option>
                        {DISCOUNT_KIND_OPTIONS.map((entry) => (
                          <option key={entry.value} value={entry.value}>
                            {entry.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Rabattbetrag
                      <input
                        value={draft.discountAmount}
                        onChange={(event) => updateDraft(row.id, { discountAmount: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="z. B. 250"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Rabattbegründung
                      <input
                        value={draft.discountReason}
                        onChange={(event) => updateDraft(row.id, { discountReason: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="z. B. Pilotphase"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Freigabegrund
                      <input
                        value={draft.approvalReason}
                        onChange={(event) => updateDraft(row.id, { approvalReason: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Freigabegrund"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Ablehnungsgrund
                      <input
                        value={draft.rejectionReason}
                        onChange={(event) => updateDraft(row.id, { rejectionReason: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Ablehnungsgrund"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))] md:col-span-2">
                      Aktivierungsnotiz
                      <textarea
                        value={draft.activationNotes}
                        onChange={(event) => updateDraft(row.id, { activationNotes: event.target.value })}
                        className="min-h-[72px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Aktivierungsdetails"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))] md:col-span-2">
                      Billing-/Finance-Notiz
                      <textarea
                        value={draft.billingFinanceNote}
                        onChange={(event) => updateDraft(row.id, { billingFinanceNote: event.target.value })}
                        className="min-h-[72px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Finance-Hinweis"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Vertragsreferenz
                      <input
                        value={draft.contractReference}
                        onChange={(event) => updateDraft(row.id, { contractReference: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Contract-Ref"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Rechnungsreferenz
                      <input
                        value={draft.invoiceReference}
                        onChange={(event) => updateDraft(row.id, { invoiceReference: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Invoice-Ref"
                      />
                    </label>
                  </div>

                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Paket-Scopes</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PARTNER_PACKAGE_SCOPE_OPTIONS.map((scope) => {
                        const checked = draft.partnerPackageScopes.includes(scope);
                        return (
                          <label
                            key={scope}
                            className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs text-[rgb(var(--fg))]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                updateDraft(row.id, {
                                  partnerPackageScopes: event.target.checked
                                    ? [...draft.partnerPackageScopes, scope]
                                    : draft.partnerPackageScopes.filter((entry) => entry !== scope),
                                })
                              }
                            />
                            {partnerPackageScopeLabel(scope)}
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Paket-Scopes schalten nur explizit zugewiesene Leistungen frei. Sie setzen weder Betreiberrechte noch automatische Veröffentlichungsrechte.
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Transparenz: Name
                      <input
                        value={draft.partnerDisclosurePartnerName}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosurePartnerName: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="z. B. Stiftung Musterstadt"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))]">
                      Transparenz: Rolle
                      <select
                        value={draft.partnerDisclosureRole}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureRole: event.target.value as ReviewDraft["partnerDisclosureRole"] })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                      >
                        <option value="">keine Rolle</option>
                        {PARTNER_DISCLOSURE_ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {partnerFundingDisclosureRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))] md:col-span-2">
                      Transparenz: Kurzlabel
                      <input
                        value={draft.partnerDisclosureLabel}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureLabel: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="z. B. Förderhinweis im Projektraum"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))] md:col-span-2">
                      Transparenznotiz
                      <textarea
                        value={draft.partnerDisclosureTransparencyNote}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureTransparencyNote: event.target.value })}
                        className="min-h-[88px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="Beschreibt Partner-, Förder- oder Auftraggeberkontext ohne Einflussbehauptung."
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-[rgb(var(--muted))] md:col-span-2">
                      Quellen- / Vertragsreferenz
                      <input
                        value={draft.partnerDisclosureSourceReference}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureSourceReference: event.target.value })}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-normal text-[rgb(var(--fg))]"
                        placeholder="CON-..., Förderzusage, Beschluss, Projektnummer"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
                      <input
                        type="checkbox"
                        checked={draft.partnerDisclosureShownToUsers}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureShownToUsers: event.target.checked })}
                      />
                      Hinweis im Nutzerkontext zeigen
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[rgb(var(--muted))]">
                      <input
                        type="checkbox"
                        checked={draft.partnerDisclosureShownToAdmins}
                        onChange={(event) => updateDraft(row.id, { partnerDisclosureShownToAdmins: event.target.checked })}
                      />
                      Hinweis im Adminkontext zeigen
                    </label>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-[rgb(var(--muted))]">
                    <p>
                      Audit-Hinweis: Jede bewusste Vertrags-, Billing- oder Plan-Entscheidung bleibt
                      persistent und auditierbar. Kein externer Checkout wird hier behauptet.
                    </p>
                    <p>
                      Paket-/Funding-Hinweis: Partner- und Förderstatus beeinflussen weder Quellengewichtung noch Abstimmungsergebnis oder Factcheck-/Seal-Entscheidung.
                    </p>
                    {row.internal.planAssignment ? (
                      <p>
                        Planwirkung: {row.internal.planAssignment.planLabel} · Scopes:{" "}
                        {row.internal.planAssignment.scopes.join(", ")}
                      </p>
                    ) : null}
                    <p>
                      Letzte Prüfung: {row.internal.reviewedAt ? `${row.internal.reviewedAt}` : "noch nicht geprüft"}
                      {row.internal.reviewedBy ? ` · by ${row.internal.reviewedBy}` : ""}
                    </p>
                    <p>
                      Vertragsaudit: {row.internal.contractAuditEvents.length} Ereignisse
                      {row.internal.contractAuditEvents.length > 0
                        ? ` · zuletzt ${row.internal.contractAuditEvents[row.internal.contractAuditEvents.length - 1]?.eventType ?? "n/a"}`
                        : ""}
                    </p>
                    <p>
                      Paketaudit: {row.internal.partnerPackageAuditEvents.length} Ereignisse
                      {row.internal.partnerPackageAuditEvents.length > 0
                        ? ` · zuletzt ${row.internal.partnerPackageAuditEvents[row.internal.partnerPackageAuditEvents.length - 1]?.eventType ?? "n/a"}`
                        : ""}
                    </p>
                    {row.internal.notes.length ? (
                      <ul className="space-y-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                        {row.internal.notes.slice(-5).reverse().map((entry) => (
                          <li key={`${row.id}-${entry}`}>{entry}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Keine internen Notizen hinterlegt.</p>
                    )}
                    {row.internal.contractAuditEvents.length ? (
                      <ul className="space-y-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                        {row.internal.contractAuditEvents.slice(-3).reverse().map((event) => (
                          <li key={event.id}>
                            {event.eventType} · {event.createdAt} · {event.createdBy}
                            {event.note ? ` · ${event.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {row.internal.partnerPackageAuditEvents.length ? (
                      <ul className="space-y-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                        {row.internal.partnerPackageAuditEvents.slice(-3).reverse().map((event) => (
                          <li key={event.id}>
                            {event.eventType} · {event.createdAt} · {event.createdBy}
                            {event.note ? ` · ${event.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </details>
              </article>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
              Keine Bestellungen im aktuellen Filter.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
