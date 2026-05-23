"use client";

import { useState, useTransition, type FormEvent } from "react";
import type {
  OrganizationClaim,
  OrganizationProvisioningKind,
  OrganizationProvisioningStatus,
} from "@features/region";
import {
  inferProvisioningRequestFromClaimView,
  resolveProvisioningRequestStatusView,
} from "@/lib/organizationProvisioning";

const ORGANIZATION_KIND_OPTIONS: Array<{
  value: OrganizationProvisioningKind;
  label: string;
}> = [
  { value: "administration", label: "Verwaltung" },
  { value: "municipality", label: "Kommune" },
  { value: "district", label: "Bezirk / Landkreis" },
  { value: "association", label: "Verein" },
  { value: "carrier", label: "Träger" },
  { value: "media_partner", label: "Medienpartner" },
  { value: "civic_group", label: "Initiative / zivilgesellschaftliche Gruppe" },
  { value: "other", label: "Sonstige Organisation" },
];

function provisioningStatusLabel(status: OrganizationProvisioningStatus) {
  switch (status) {
    case "draft":
      return "Antrag gestartet";
    case "submitted":
      return "Eingereicht";
    case "verification_required":
      return "Prüfung erforderlich";
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

function nextStepLabel(status: OrganizationProvisioningStatus) {
  switch (status) {
    case "draft":
      return "Entwurf vervollständigen und bewusst zur Prüfung einreichen.";
    case "submitted":
      return "Prüfe Angaben und Nachweise. Bis zur Entscheidung entstehen keine Moderations- oder Publish-Rechte.";
    case "verification_required":
      return "Bitte sichere Angaben zu Antragsteller, Region oder verantwortlicher Person ergänzen.";
    case "operator_review_required":
      return "Der Antrag ist vollständig genug für die Betreiberprüfung. Bitte auf die Entscheidung warten.";
    case "approved":
      return "Org-Scoped Rechte entstehen nur im bestätigten Scope. `publication_approved` bleibt ein separater Schritt.";
    case "limited":
      return "Der Zugang ist bewusst eingeschränkt. Sichtbar bleiben nur die explizit freigegebenen Basisschritte.";
    case "rejected":
      return "Ein neuer oder korrigierter Antrag ist möglich, aber Rechte bleiben bis dahin gesperrt.";
    case "suspended":
      return "Schreibrouten bleiben blockiert, bis Betreiber den Scope erneut freigeben.";
    default:
      return "Noch kein nächster Schritt hinterlegt.";
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
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter as HTMLButtonElement | null;
    const submissionMode =
      submitter?.value === "save_draft" ? "save_draft" : "submit";
    const formData = new FormData(form);

    startTransition(async () => {
      setNotice(null);
      setError(null);
      try {
        const payload = {
          organizationName: String(formData.get("organizationName") ?? ""),
          organizationKind: String(formData.get("organizationKind") ?? ""),
          countryCode: String(formData.get("countryCode") ?? ""),
          regionId: String(formData.get("regionId") ?? ""),
          regionLabel: String(formData.get("regionLabel") ?? ""),
          unitName: String(formData.get("unitName") ?? ""),
          roleLabel: String(formData.get("roleLabel") ?? ""),
          optionalLocation: String(formData.get("optionalLocation") ?? ""),
          website: String(formData.get("website") ?? ""),
          applicantName: String(formData.get("applicantName") ?? ""),
          responsiblePersonName: String(formData.get("responsiblePersonName") ?? ""),
          responsiblePersonEmail: String(formData.get("responsiblePersonEmail") ?? ""),
          note: String(formData.get("note") ?? ""),
          submissionMode,
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
        if (submissionMode === "save_draft") {
          setNotice("Antrag als Entwurf gespeichert. Noch keine Betreiberprüfung und keine Rechte.");
        } else {
          setNotice(
            "Antrag eingereicht. Betreiber entscheiden später bewusst über Membership und Org-Scope. Es gibt keine automatische Veröffentlichung und keine automatische Amtlichkeit.",
          );
        }
        form.reset();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "organization_claim_submit_failed",
        );
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Organisations-Onboarding
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Organisation oder Wirkraum beantragen
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Hier startet Self-Provisioning für Organisation, Region oder Wirkraum. Der Antrag bleibt
          zunächst Selbstauskunft und erzeugt weder Betreiberrechte noch automatische
          Veröffentlichungsrechte.
        </p>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          `publication_approved`, `public_official` und öffentliche Sichtbarkeit werden nie
          automatisch gesetzt.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Organisationsname
            <input
              name="organizationName"
              required
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Organisationsart
            <select
              name="organizationKind"
              defaultValue="administration"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            >
              {ORGANIZATION_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Land
            <input
              name="countryCode"
              placeholder="DE"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Region oder Wirkraum-ID
            <input
              name="regionId"
              placeholder="kommune-beispielstadt"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Region oder Wirkraum-Bezeichnung
            <input
              name="regionLabel"
              placeholder="Beispielstadt / Wirkraum Nord"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Einheit / Team
            <input
              name="unitName"
              placeholder="Beteiligung / Redaktion / Geschäftsstelle"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Eigene Rolle
            <input
              name="roleLabel"
              required
              placeholder="Sachbearbeitung / Koordination / Redaktion"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Antragsteller
            <input
              name="applicantName"
              required
              placeholder="Vor- und Nachname"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Verantwortliche Person
            <input
              name="responsiblePersonName"
              placeholder="falls abweichend"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            E-Mail verantwortliche Person
            <input
              name="responsiblePersonEmail"
              type="email"
              placeholder="name@organisation.de"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            Standort optional
            <input
              name="optionalLocation"
              placeholder="Rathaus, Geschäftsstelle oder Redaktionsbüro"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Website oder öffentlicher Nachweis
            <input
              name="website"
              type="url"
              placeholder="https://…"
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))] sm:col-span-2">
            Hinweis für die sichere Prüfung
            <textarea
              name="note"
              rows={4}
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              value="save_draft"
              disabled={isPending}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-70"
            >
              {isPending ? "Wird gespeichert…" : "Entwurf speichern"}
            </button>
            <button
              type="submit"
              value="submit"
              disabled={isPending}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isPending ? "Wird eingereicht…" : "Zur Prüfung einreichen"}
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
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Status und nächste sichere Schritte
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Pending, Prüfung erforderlich oder Betreiberprüfung laufend erzeugen keine Moderations-,
          Sichtbarkeits- oder Publish-Rechte.
        </p>
        <div className="mt-5 space-y-3">
          {claims.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              Noch keine Organisationsanträge vorhanden.
            </p>
          ) : (
            claims.map((claim) => {
              const request = inferProvisioningRequestFromClaimView(claim);
              const status = resolveProvisioningRequestStatusView(claim);
              return (
                <article
                  key={claim.id}
                  className="rounded-2xl border border-[rgb(var(--border))] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                        {claim.organizationName}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {claim.unitName || "Keine Einheit angegeben"}
                        {claim.regionId ? ` · ${claim.regionId}` : " · Noch keine Region angegeben"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      {provisioningStatusLabel(status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Antragsteller: {request.applicantName ?? "nicht hinterlegt"}
                    {request.responsiblePersonName
                      ? ` · Verantwortliche Person: ${request.responsiblePersonName}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Nächster Schritt: {nextStepLabel(status)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    noAutoAuthority: {claim.noAutoAuthority ? "true" : "false"}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Quellpfad: {request.source} · Entscheid:{" "}
                    {request.latestDecision ?? "noch keine Betreiberentscheidung"}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
