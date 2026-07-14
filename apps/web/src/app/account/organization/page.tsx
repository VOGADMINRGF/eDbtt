import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { getRegionOrganizationRuntimeRepo } from "@features/region";
import { getPricingEntryTrustCopy } from "@features/pricing";
import { PRODUCTION_ENTRY_COPY } from "@/features/access/productionEntryContract";
import { buildB2GFirstLoginOnboardingHint } from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints";
import { buildMunicipalHandoffTrialOnboardingHint } from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";
import { buildInstitutionalOnboardingSegmentHint } from "@/features/agenticRuntime/segmentedAgentExperienceContract";
import { OrganizationClaimsClient } from "./OrganizationClaimsClient";

const DE_TRUST = getPricingEntryTrustCopy("de");

export const metadata = {
  title: "Organisations-Onboarding · eDebatte",
};

export default async function AccountOrganizationPage() {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;

  if (!user || !user.sessionValid || !userId) {
    redirect(`/login?next=${encodeURIComponent("/account/organization")}`);
  }

  const repo = getRegionOrganizationRuntimeRepo();
  const claims = await repo.listOrganizationClaimsForUser(userId);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Organisation
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
          Organisations-Onboarding und Freischaltung
        </h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {PRODUCTION_ENTRY_COPY.organizationLead}
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {PRODUCTION_ENTRY_COPY.organizationReviewHint} {DE_TRUST.noHiddenAiCosts}
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Ein Einstieg, dann eine geführte Auswahl: Verwaltung / Kommune, Verein / Träger /
          Verband, Medienpartner / Redaktion, Beteiligungsbüro / Agentur oder Stiftung /
          Programmträger.
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {buildInstitutionalOnboardingSegmentHint()}
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {buildB2GFirstLoginOnboardingHint()}
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {buildMunicipalHandoffTrialOnboardingHint()}
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          {PRODUCTION_ENTRY_COPY.organizationPathHint}
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Der Arbeitsbereich deiner Organisation liegt unter{" "}
          <Link href="/account/organization/dashboard" className="font-semibold text-[rgb(var(--fg))]">
            /account/organization/dashboard
          </Link>
          . Diese Seite bleibt Antrag und Status.
        </p>
      </header>
      <OrganizationClaimsClient initialClaims={claims} />
    </main>
  );
}
