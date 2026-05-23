import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  getRegionEntitlementRuntimeRepo,
  getRegionOrganizationRuntimeRepo,
  resolveProvisioningRequestStatus,
} from "@features/region";
import { AdminEntitlementsClient } from "./AdminEntitlementsClient";

export const metadata = {
  title: "Freischaltungen · eDebatte",
};

export default async function AdminEntitlementsPage() {
  const user = await getSessionUser();
  if (!user || !user.sessionValid) {
    redirect(`/login?next=${encodeURIComponent("/admin/entitlements")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization");
  }

  const repo = getRegionEntitlementRuntimeRepo();
  const entitlements = await repo.listEntitlementsForAdmin();
  const organizationRepo = getRegionOrganizationRuntimeRepo();
  const claims = await organizationRepo.listOrganizationClaimsForReview();
  const entitlementHints = claims
    .filter((claim) => resolveProvisioningRequestStatus(claim) === "approved")
    .map((claim) => {
      const matchingEntitlements = entitlements.filter(
        (entitlement) =>
          entitlement.organizationId === claim.organizationId ||
          entitlement.organizationName === claim.organizationName,
      );
      return {
        claimId: claim.id,
        organizationId: claim.organizationId ?? null,
        organizationName: claim.organizationName,
        regionId: claim.regionId ?? null,
        applicantName: claim.provisioningRequest?.applicantName ?? null,
        requestedRoleLabel: claim.provisioningRequest?.requestedRoleLabel ?? claim.roleLabel ?? null,
        hasEntitlementDecision: matchingEntitlements.length > 0,
      };
    });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin Freischaltung
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Freischaltungen verwalten</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Freischaltungen ergänzen verifizierte Memberships, ersetzen sie aber nicht. Diese Oberfläche verwaltet
          Pilot-, Test- und Admin-Freischaltungen ohne Checkout, automatische Abbuchung oder Rechnungslogik.
        </p>
      </header>
      <AdminEntitlementsClient
        initialEntitlements={entitlements}
        initialEntitlementHints={entitlementHints}
      />
    </main>
  );
}
