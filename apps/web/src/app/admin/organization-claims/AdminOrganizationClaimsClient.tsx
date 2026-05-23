"use client";

import { useState, useTransition } from "react";
import type { OrganizationClaim, VerificationReviewDecision } from "@features/region";
import {
  inferProvisioningRequestFromClaimView,
  resolveProvisioningRequestStatusView,
} from "@/lib/organizationProvisioning";

function decisionLabel(decision: VerificationReviewDecision) {
  switch (decision) {
    case "approve_organization":
      return "Verifizieren";
    case "approve_unit":
      return "Wirkraum verifizieren";
    case "approve_publication":
      return "Publikation freigeben";
    case "limit":
      return "Einschränken";
    case "suspend":
      return "Suspendieren";
    case "reject":
      return "Ablehnen";
    case "revoke":
      return "Widerrufen";
    default:
      return "Mehr Informationen anfordern";
  }
}

function provisioningStatusLabel(claim: OrganizationClaim) {
  const status = resolveProvisioningRequestStatusView(claim);
  switch (status) {
    case "draft":
      return "Antrag gestartet";
    case "submitted":
      return "Prüfung läuft";
    case "verification_required":
      return "Nachweise nachreichen";
    case "operator_review_required":
      return "Betreiberprüfung läuft";
    case "approved":
      return "Freigeschaltet";
    case "limited":
      return "Eingeschränkt";
    case "rejected":
      return "Abgelehnt";
    case "suspended":
      return "Gesperrt";
    default:
      return "Unbekannt";
  }
}

const DECISIONS: VerificationReviewDecision[] = [
  "approve_organization",
  "approve_unit",
  "approve_publication",
  "limit",
  "suspend",
  "needs_more_information",
  "reject",
  "revoke",
];

type Props = {
  initialClaims: OrganizationClaim[];
};

export function AdminOrganizationClaimsClient({ initialClaims }: Props) {
  const [claims, setClaims] = useState(initialClaims);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshClaims() {
    const res = await fetch("/api/admin/organization-claims", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? "organization_claim_review_fetch_failed");
    }
    setClaims(Array.isArray(body.claims) ? body.claims : []);
  }

  function reviewClaim(claimId: string, decision: VerificationReviewDecision) {
    startTransition(async () => {
      setNotice(null);
      setError(null);
      try {
        const res = await fetch(`/api/admin/organization-claims/${encodeURIComponent(claimId)}/review`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? "organization_claim_review_failed");
        }
        await refreshClaims();
        setNotice(`Organisationsantrag geprüft: ${decisionLabel(decision)}`);
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : "organization_claim_review_failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <p className="text-xs text-[rgb(var(--muted))]">
        Betreiberentscheidungen sind persistent und auditierbar. `publication_approved` und
        `public_official` entstehen nie automatisch.
      </p>

      {claims.length === 0 ? (
        <p className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Keine offenen Organisationsanträge.
        </p>
      ) : (
        claims.map((claim) => {
          const provisioning = inferProvisioningRequestFromClaimView(claim);
          return (
            <article
              key={claim.id}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.organizationName}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {claim.organizationType}
                    {claim.regionId ? ` · ${claim.regionId}` : ""}
                    {claim.unitName ? ` · ${claim.unitName}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Provisioning-Status: {provisioningStatusLabel(claim)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Audit-Hinweis: Entscheidungen werden mit Quelle, Rolle und Regionscope
                    protokolliert.
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Standort optional: {claim.optionalLocation?.name ?? "nicht gesetzt"}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Antragsteller: {provisioning.applicantName ?? "nicht hinterlegt"}
                    {provisioning.responsiblePersonName
                      ? ` · Verantwortlich: ${provisioning.responsiblePersonName}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    noAutoAuthority: {claim.noAutoAuthority ? "true" : "false"}
                  </p>
                </div>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {claim.verificationStatus}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {DECISIONS.map((decision) => (
                  <button
                    key={decision}
                    type="button"
                    disabled={isPending}
                    onClick={() => reviewClaim(claim.id, decision)}
                    className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    {decisionLabel(decision)}
                  </button>
                ))}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
