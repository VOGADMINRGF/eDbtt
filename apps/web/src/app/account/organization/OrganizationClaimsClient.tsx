"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { OrganizationClaim, OrganizationType } from "@features/region";

const ORGANIZATION_TYPE_OPTIONS: Array<{ value: OrganizationType; label: string }> = [
  { value: "public_administration", label: "Öffentliche Verwaltung" },
  { value: "municipality", label: "Kommune" },
  { value: "district_office", label: "Bezirksamt" },
  { value: "city_administration", label: "Stadtverwaltung" },
  { value: "county_administration", label: "Landkreisverwaltung" },
  { value: "ministry", label: "Ministerium" },
  { value: "public_body", label: "Öffentliche Einrichtung" },
  { value: "school", label: "Schule" },
  { value: "association", label: "Verein / Verband" },
  { value: "ngo", label: "NGO" },
  { value: "civic_initiative", label: "Initiative" },
  { value: "foundation", label: "Stiftung" },
  { value: "media", label: "Medien" },
  { value: "company", label: "Unternehmen" },
  { value: "research_institution", label: "Forschung" },
  { value: "custom", label: "Sonstige Organisation" },
];

function statusLabel(status: OrganizationClaim["verificationStatus"]) {
  switch (status) {
    case "organization_verified":
      return "Organisations-verifiziert";
    case "unit_verified":
      return "Unit-verifiziert";
    case "publication_approved":
      return "Publikationsfreigabe bestätigt";
    case "email_verified":
      return "E-Mail verifiziert";
    case "rejected":
      return "Abgelehnt";
    case "revoked":
      return "Widerrufen";
    case "unverified":
      return "Unverifiziert";
    default:
      return "Pending Review";
  }
}

type Props = {
  initialClaims: OrganizationClaim[];
};

export function OrganizationClaimsClient({ initialClaims }: Props) {
  const [claims, setClaims] = useState(initialClaims);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refreshClaims() {
    const res = await fetch("/api/account/organization-claims", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? "organization_claims_fetch_failed");
    }
    setClaims(Array.isArray(body.claims) ? body.claims : []);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      setNotice(null);
      setError(null);
      try {
        const payload = {
          organizationName: String(formData.get("organizationName") ?? ""),
          organizationType: String(formData.get("organizationType") ?? ""),
          countryCode: String(formData.get("countryCode") ?? ""),
          regionId: String(formData.get("regionId") ?? ""),
          unitName: String(formData.get("unitName") ?? ""),
          roleLabel: String(formData.get("roleLabel") ?? ""),
          optionalLocation: String(formData.get("optionalLocation") ?? ""),
          website: String(formData.get("website") ?? ""),
          note: String(formData.get("note") ?? ""),
        };

        const res = await fetch("/api/account/organization-claims", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? "organization_claim_submit_failed");
        }

        await refreshClaims();
        form.reset();
        setNotice("Antrag gespeichert. Diese Angabe erzeugt noch keine offiziellen Rechte.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "organization_claim_submit_failed");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Organisationsantrag
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Organisation oder Einheit angeben
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Self-declared ist nicht verifiziert. Erst Review und bestätigte Membership erzeugen Rechte.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Organisationsname
            <input name="organizationName" required className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Organisationstyp
            <select name="organizationType" defaultValue="public_administration" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2">
              {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Land
            <input name="countryCode" placeholder="DE" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Region / Bezirk / Kommune
            <input name="regionId" placeholder="berlin-reinickendorf" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Abteilung / Einheit
            <input name="unitName" placeholder="Bauen und Wohnen" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Standort optional
            <input name="optionalLocation" placeholder="Rathaus Reinickendorf" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Rolle
            <input name="roleLabel" placeholder="Sachbearbeitung" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Website
            <input name="website" type="url" placeholder="https://…" className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Hinweis für das Review
            <textarea name="note" rows={4} className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isPending ? "Wird gespeichert…" : "Antrag senden"}
            </button>
          </div>
        </form>

        {notice ? <p className="mt-4 text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Eigene Anträge
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">Status und Review-Verlauf</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Pending Review erzeugt keine Dashboard- oder Veröffentlichungsrechte.
        </p>
        <div className="mt-5 space-y-3">
          {claims.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine OrganisationClaims vorhanden.</p>
          ) : (
            claims.map((claim) => (
              <article key={claim.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.organizationName}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {claim.unitName || "Keine Einheit angegeben"}
                      {claim.optionalLocation?.name ? ` · Standort: ${claim.optionalLocation.name}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                    {statusLabel(claim.verificationStatus)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  noAutoAuthority: {claim.noAutoAuthority ? "true" : "false"}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  {claim.regionId ? `Region: ${claim.regionId}` : "Noch keine Region bestätigt"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
