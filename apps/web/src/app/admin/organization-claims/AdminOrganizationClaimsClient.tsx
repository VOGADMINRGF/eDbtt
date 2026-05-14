"use client";

import { useState, useTransition } from "react";
import type { OrganizationClaim, VerificationReviewDecision } from "@features/region";

function decisionLabel(decision: VerificationReviewDecision) {
  switch (decision) {
    case "approve_organization":
      return "Organisation bestätigen";
    case "approve_unit":
      return "Einheit bestätigen";
    case "approve_publication":
      return "Publikationsfreigabe";
    case "reject":
      return "Ablehnen";
    case "revoke":
      return "Widerrufen";
    default:
      return "Mehr Informationen anfordern";
  }
}

const DECISIONS: VerificationReviewDecision[] = [
  "approve_organization",
  "approve_unit",
  "approve_publication",
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
        setNotice(`Claim geprüft: ${decisionLabel(decision)}`);
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : "organization_claim_review_failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {claims.length === 0 ? (
        <p className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Keine offenen OrganizationClaims.
        </p>
      ) : (
        claims.map((claim) => (
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
                  Standort optional: {claim.optionalLocation?.name ?? "nicht gesetzt"}
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
        ))
      )}
    </div>
  );
}
